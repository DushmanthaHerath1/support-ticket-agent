#third-party
from fastapi import APIRouter
from sqlalchemy import select

#local
from app.db.models import Ticket, Customer, Conversation
from app.db.session import async_session_factory
from app.schemas import TicketResponse

router = APIRouter(prefix="/tickets", tags=["tickets"])

@router.get("", response_model=list[TicketResponse])
async def get_tickets() -> list[TicketResponse]:
    """
        Returns all resolved tickets for the audit log.
        Orders newest first.
    """
    async with async_session_factory() as session:
        result = await session.execute(
            select(Ticket, Customer.name)
            .join(Conversation, Ticket.conversation_id == Conversation.id)
            .join(Customer, Conversation.customer_id == Customer.id)
            .order_by(Ticket.resolved_at.desc())
        )
        rows = result.all()

    return [
        TicketResponse(
            id=str(row.Ticket.id),
            conversation_id=row.Ticket.conversation_id,
            customer_name=row.name,
            category=row.Ticket.category.value,
            sentiment=row.Ticket.sentiment.value,
            resolution=row.Ticket.resolution.value,
            refund_amount=row.Ticket.refund_amount,
            resolved_at=row.Ticket.resolved_at
        )
        for row in rows
    ]