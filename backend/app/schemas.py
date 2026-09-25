"""
Centralized Pydantic schemas for the HTTP API layer (request & response models).
All routers import from here — do not define API schemas inline in router files.
Note: This file is for transport-layer shapes only.
      Agent/LLM-layer schemas live in app/agent/schemas.py.
"""

from typing import Literal
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel

#chat
class ChatRequest(BaseModel):
    message: str
    conversation_id: str
    customer_id: str

#approvals
class PendingApprovalResponse(BaseModel):
    id: str
    conversation_id: str
    order_id: str
    item_name: str
    proposed_amount: Decimal
    reason: str
    created_at: datetime | None

class ApprovalAction(BaseModel):
    action: Literal["approve", "reject"]
    final_amount: float | None = None
    notes: str = "No notes provided."

class TicketResponse(BaseModel):
    id: str
    conversation_id: str
    customer_name: str
    category: str
    sentiment: str
    resolution: str
    refund_amount: Decimal | None
    resolved_at: datetime