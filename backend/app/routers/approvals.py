#stdlib
from datetime import datetime
import uuid

#third-party
from fastapi import APIRouter, Request, HTTPException
from sqlalchemy import select 
from langgraph.types import Command

#local
from app.db.models import RefundApproval, RefundStatus, Order
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
            select(RefundApproval, Order.item_name)
            .join(Order, RefundApproval.order_id == Order.id)
            .where(RefundApproval.status == RefundStatus.PENDING)
            .order_by(RefundApproval.decided_at.asc().nulls_first())
        )

        rows = result.all()

    return[
        PendingApprovalResponse(
            id=str(row.RefundApproval.id), 
            conversation_id=row.RefundApproval.conversation_id,
            order_id=row.RefundApproval.order_id,
            item_name=row.item_name,
            proposed_amount=row.RefundApproval.proposed_amount,
            reason=row.RefundApproval.reason,
            created_at=row.RefundApproval.decided_at
        )
        for row in rows
    ]

@router.post("/{approval_id}/action")
async def process_approval(approval_id: str, body: ApprovalAction, request:Request) -> dict:
    """
        Manager approves or rejects a pending refund request.
        Resumes the pause LangGraph HITL interrupt wi th the decision.

    """
    graph = request.app.state.graph

    async with async_session_factory() as session:
        result = await session.execute(
            select(RefundApproval).where(RefundApproval.id ==uuid.UUID(approval_id))
        )
        approval = result.scalar_one_or_none()

        if not approval:
            raise HTTPException(status_code=404, detail=f"Approval '{approval_id}' not found.",)

        if approval.status != RefundStatus.PENDING:
            raise HTTPException(
                status_code=409,
                detail=f"Already decided - current status: {approval.status.value}",

            )
        
        conversation_id = approval.conversation_id
        proposed_amount = float(approval.proposed_amount)

    is_approve = body.action == "approve"

    resume_payload = {
        "approved": is_approve,
        "final_amount": float(body.final_amount) if is_approve and body.final_amount else proposed_amount,
        "notes": body.notes,
    }

    config = {"configurable": {"thread_id": conversation_id}}
    await graph.ainvoke(Command(resume=resume_payload), config=config)

    return {
        "success": True,
        "approval_id": approval_id,
        "action": body.action,
        "message": f"Refund request {body.action}d successfully."
    }
