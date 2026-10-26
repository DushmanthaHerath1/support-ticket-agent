#stdlib
from app.db.models import Conversation
from datetime import datetime, timezone
import uuid
from decimal import Decimal

#third-party
from fastapi import APIRouter, Request, HTTPException
from sqlalchemy import select 
from langgraph.types import Command

#local
from app.db.models import RefundApproval, RefundStatus, Order, OrderStatus
from app.db.session import async_session_factory
from app.schemas import PendingApprovalResponse, ApprovalAction

router =  APIRouter(prefix="/approvals", tags=["approvals"])

@router.get("/pending", response_model=list[PendingApprovalResponse])
async def get_pending_approvals() -> list[PendingApprovalResponse]:
    """
        Returns all refund requests currently awaiting manager action.
    """
    async with async_session_factory() as session:
        result = await session.execute(
            select(RefundApproval, Order.item_name, Order.amount.label("order_amount"))
            .join(Order, RefundApproval.order_id == Order.id)
            .where(RefundApproval.status == RefundStatus.PENDING)
            .order_by(RefundApproval.decided_at.asc().nulls_first())
        )
        rows = result.all()

    return [
        PendingApprovalResponse(
            id=str(row.RefundApproval.id), 
            conversation_id=row.RefundApproval.conversation_id,
            order_id=row.RefundApproval.order_id,
            item_name=row.item_name,
            order_amount=row.order_amount,             
            proposed_amount=row.RefundApproval.proposed_amount,
            reason=row.RefundApproval.reason,
            created_at=row.RefundApproval.decided_at
        )
        for row in rows
    ]

@router.post("/{approval_id}/action")
async def process_approval(approval_id: str, body: ApprovalAction, request: Request) -> dict:
    """
        Manager approves or rejects a pending refund request.
        Resumes the paused LangGraph HITL interrupt with the decision.
    """
    graph = request.app.state.graph
    is_approve = body.action == "approve"             

    async with async_session_factory() as session:
        result = await session.execute(
            select(RefundApproval).where(RefundApproval.id == uuid.UUID(approval_id))
        )
        approval = result.scalar_one_or_none()

        if not approval:
            raise HTTPException(status_code=404, detail=f"Approval '{approval_id}' not found.")

        if approval.status != RefundStatus.PENDING:
            raise HTTPException(
                status_code=409,
                detail=f"Already decided - current status: {approval.status.value}",
            )

        # Validate refund amount doesn't exceed original order total
        order = await session.get(Order, approval.order_id)
        if is_approve and body.final_amount and order:
            if float(body.final_amount) > float(order.amount):
                raise HTTPException(
                    status_code=400,
                    detail=f"Refund amount ${body.final_amount:.2f} exceeds original order total of ${float(order.amount):.2f}."
                )

        conversation_id = approval.conversation_id
        conv = await session.get(Conversation, approval.conversation_id)
        customer_id = str(conv.customer_id)
        proposed_amount = float(approval.proposed_amount)
        final_amount = float(body.final_amount) if is_approve and body.final_amount else proposed_amount

        approval.status = RefundStatus.APPROVED if is_approve else RefundStatus.REJECTED
        approval.final_amount = Decimal(str(final_amount)) if is_approve else None
        approval.reason = f"{approval.reason} (Manager Notes: {body.notes})"
        approval.decided_at = datetime.now(timezone.utc)
        if is_approve and order:
            order.status = OrderStatus.CANCELLED
        await session.commit()

    resume_payload = {
        "approved": is_approve,
        "final_amount": final_amount,
        "notes": body.notes,
    }

    config = {"configurable": {"thread_id": conversation_id, "customer_id": customer_id}}
    await graph.ainvoke(Command(resume=resume_payload), config=config)

    return {
        "success": True,
        "approval_id": approval_id,
        "action": body.action,
        "message": f"Refund request {body.action}d successfully."
    }
