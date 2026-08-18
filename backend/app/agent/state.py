from typing import TypedDict
from langgraph.graph import MessagesState
from app.db.models import OrderStatus


class OrderContext(TypedDict, total=False):
    order_id: str
    item_name: str
    amount: float
    status: OrderStatus


class SupportState(MessagesState):
    customer_id: str | None
    order_context: OrderContext | None
    summary: str | None
