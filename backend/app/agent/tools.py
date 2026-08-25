from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from langchain_core.tools import tool
from langchain_core.runnables import RunnableConfig
from langgraph.types import interrupt
from sqlalchemy import select

from app.db.models import (
    Conversation,
    ConversationStatus,
    Order,
    OrderStatus,
    RefundApproval,
    RefundStatus,
    ResolutionType,
    SentimentType,
    Ticket,
    TicketCategory,
)
from app.db.session import async_session_factory


@tool
async def lookup_order(order_id: str) -> dict[str, Any]:
    """Looks up customer order details from the database by order ID (e.g. 'ORD-1001').

    Args:
        order_id: The unique identifier of the order to look up.

    Returns:
        A dictionary containing order item, amount, status, date, and customer details,
        or an error message if the order is not found.
    """
    clean_order_id = order_id.strip()

    async with async_session_factory() as session:
        result = await session.execute(select(Order).where(Order.id == clean_order_id))
        order = result.scalar_one_or_none()

        if not order:
            return {
                "found": False,
                "error": f"Order '{clean_order_id}' was not found in our system. Please ask the customer to verify the order number.",
            }

        return {
            "found": True,
            "order_id": order.id,
            "customer_id": str(order.customer_id),
            "item_name": order.item_name,
            "amount": float(order.amount),
            "status": order.status.value,
            "created_at": order.created_at.strftime("%Y-%m-%d %H:%M:%S UTC"),
        }


@tool
async def check_refund_eligibility(order_id: str) -> dict[str, Any]:
    """Evaluates company refund policy against an order to determine if a refund can be initiated.

    Args:
        order_id: The unique identifier of the order to check.

    Returns:
        A dictionary indicating whether the order is eligible, max refund amount, and policy explanation.
    """
    clean_order_id = order_id.strip()

    async with async_session_factory() as session:
        result = await session.execute(select(Order).where(Order.id == clean_order_id))
        order = result.scalar_one_or_none()

        if not order:
            return {"eligible": False, "reason": f"Order '{clean_order_id}' not found."}

        if order.status == OrderStatus.CANCELLED:
            return {
                "eligible": False,
                "order_status": order.status.value,
                "reason": f"Order '{clean_order_id}' is already CANCELLED and refunded.",
            }

        days_since_order = (datetime.now(timezone.utc) - order.created_at).days
        if days_since_order > 30:
            return {
                "eligible": False,
                "order_status": order.status.value,
                "days_since_order": days_since_order,
                "reason": f"Order was placed {days_since_order} days ago. Company policy limits refund requests to 30 days from purchase.",
            }

        if order.status in [OrderStatus.SHIPPED, OrderStatus.DELIVERED]:
            return {
                "eligible": False,
                "requires_manual_escalation": True,
                "order_status": order.status.value,
                "reason": (
                    f"Order is already {order.status.value}. According to company policy, "
                    "orders that have already shipped or arrived cannot be refunded automatically. "
                    "Inform the customer that their case will be escalated to a human administrator "
                    "or requires returning the item."
                ),
            }

        return {
            "eligible": True,
            "order_status": order.status.value,
            "max_refundable_amount": float(order.amount),
            "reason": (
                f"Order is {order.status.value} (not yet shipped). Eligible for cancellation "
                f"and full refund of ${float(order.amount):.2f}."
            ),
        }


@tool
async def issue_refund(
    order_id: str,
    amount: float,
    reason: str,
    config: RunnableConfig,
) -> dict[str, Any]:
    """Submits a refund request and pauses execution for Human-In-The-Loop manager approval.

    CRITICAL: This tool pauses the agent until a manager approves, rejects, or modifies the refund amount.

    Args:
        order_id: The order ID to be refunded.
        amount: The proposed refund amount in USD.
        reason: Clear justification for the refund request.

    Returns:
        The manager's final decision and processing result.
    """
    # conversation_id is NOT an LLM-supplied argument — it's injected from the graph's
    # own run config, so it can never be missing, malformed, or hallucinated by the model.
    conversation_id = config["configurable"]["thread_id"]

    clean_order_id = order_id.strip()

    async with async_session_factory() as session:
        result = await session.execute(select(Order).where(Order.id == clean_order_id))
        order = result.scalar_one_or_none()

        if not order:
            return {
                "success": False,
                "status": "ERROR",
                "message": f"Order '{clean_order_id}' was not found in the database.",
            }

        if order.status == OrderStatus.CANCELLED:
            return {
                "success": False,
                "status": "ERROR",
                "message": f"Order '{clean_order_id}' is already CANCELLED and refunded.",
            }

        if order.status in [OrderStatus.SHIPPED, OrderStatus.DELIVERED]:
            return {
                "success": False,
                "status": "INELIGIBLE",
                "message": (
                    f"Order '{clean_order_id}' has already {order.status.value}. "
                    "Cannot initiate automated refund. Please inform the customer or escalate manually."
                ),
            }

        if amount <= 0 or amount > float(order.amount):
            return {
                "success": False,
                "status": "ERROR",
                "message": f"Refund amount ${amount:.2f} is invalid. Maximum refundable amount is ${float(order.amount):.2f}.",
            }

    # Trigger the LangGraph HITL interrupt. Execution pauses here; state (including
    # conversation_id) is checkpointed until a manager resumes it via Command(resume=...).
    decision = interrupt(
        {
            "action": "refund_approval",
            "order_id": clean_order_id,
            "proposed_amount": amount,
            "reason": reason,
            "conversation_id": conversation_id,
            "description": f"Manager approval requested to refund ${amount:.2f} for Order #{clean_order_id}.",
        }
    )

    # Expected decision format: {"approved": bool, "final_amount": float, "notes": str}
    is_approved = bool(decision.get("approved", False))
    final_amount = float(decision.get("final_amount", amount))
    notes = decision.get("notes", "No manager notes provided.")

    async with async_session_factory() as session:
        result = await session.execute(select(Order).where(Order.id == clean_order_id))
        order = result.scalar_one_or_none()

        approval_record = RefundApproval(
            conversation_id=conversation_id,  # plain str — matches Conversation.id, no UUID parsing
            order_id=order.id,
            proposed_amount=Decimal(str(amount)),
            final_amount=Decimal(str(final_amount)) if is_approved else None,
            reason=f"{reason} (Manager Notes: {notes})",
            status=RefundStatus.APPROVED if is_approved else RefundStatus.REJECTED,
            decided_at=datetime.now(timezone.utc),
        )
        session.add(approval_record)

        if is_approved:
            order.status = OrderStatus.CANCELLED
            await session.commit()
            return {
                "success": True,
                "status": "APPROVED",
                "final_amount": final_amount,
                "message": (
                    f"Refund of ${final_amount:.2f} for Order #{clean_order_id} has been APPROVED by the manager "
                    f"and processed successfully. The order is now CANCELLED."
                ),
            }
        else:
            await session.commit()
            return {
                "success": False,
                "status": "REJECTED",
                "message": (
                    f"Refund request for Order #{clean_order_id} was REJECTED by the manager. "
                    f"Reason: {notes}"
                ),
            }


@tool
async def resolve_ticket(
    category: TicketCategory,
    sentiment: SentimentType,
    resolution: ResolutionType,
    summary: str,
    config: RunnableConfig,
    refund_amount: float | None = None,
) -> dict[str, Any]:
    """Records the final resolution of the conversation and logs structured ticket data into the database.

    Call this ONLY on the final concluding turn, once the inquiry is fully answered,
    a refund decision is finalized, or the issue is escalated. Never call it while still
    waiting on the customer for information.

    Args:
        category: Primary ticket category.
        sentiment: Customer emotional sentiment detected across the conversation.
        resolution: Final outcome for this ticket.
        summary: Brief 1-2 sentence summary of what happened and how it was resolved.
        refund_amount: Amount refunded in USD, or None if no refund was issued.

    Returns:
        Confirmation dictionary of ticket creation.
    """
    # As with issue_refund — conversation_id comes from the graph's run config, never from
    # the model. category/sentiment/resolution are typed as the real enums, so LangChain
    # validates them against the DB's own vocabulary before this function body ever runs;
    # no manual try/except needed here anymore.
    conversation_id = config["configurable"]["thread_id"]

    async with async_session_factory() as session:
        conv_result = await session.execute(select(Conversation).where(Conversation.id == conversation_id))
        conv = conv_result.scalar_one_or_none()
        if conv:
            conv.status = ConversationStatus.RESOLVED
            conv.summary = summary
            conv.updated_at = datetime.now(timezone.utc)

        ticket = Ticket(
            conversation_id=conversation_id,
            category=category,
            sentiment=sentiment,
            resolution=resolution,
            refund_amount=Decimal(str(refund_amount)) if refund_amount and refund_amount > 0 else None,
            resolved_at=datetime.now(timezone.utc),
        )
        session.add(ticket)
        await session.commit()

        return {
            "success": True,
            "ticket_id": str(ticket.id),
            "category": category.value,
            "sentiment": sentiment.value,
            "resolution": resolution.value,
            "refund_amount": float(ticket.refund_amount) if ticket.refund_amount else None,
            "message": "Ticket successfully resolved and audit log created.",
        }
