import uuid
from datetime import datetime, timezone
from decimal import Decimal
from enum import StrEnum
from sqlalchemy import DateTime, ForeignKey, Numeric, String, Uuid
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


# --- Helper Functions ---
def _uuid() -> uuid.UUID:
    return uuid.uuid4()


def _now() -> datetime:
    return datetime.now(timezone.utc)


# --- Enums for Clean Business Logic ---
# This is the single canonical vocabulary. prompts.py, tools.py, and schemas.py
# must import FROM here, not redefine their own values — that's what caused
# the mismatch the audit found. Never add a value in a docstring or prompt
# that isn't a member of one of these enums.

class OrderStatus(StrEnum):
    PENDING = "PENDING"          # Order placed, not yet packed
    PROCESSING = "PROCESSING"    # Packing / ready to ship
    SHIPPED = "SHIPPED"          # Dispatched to courier (needs manual review for return)
    DELIVERED = "DELIVERED"      # Handed over to customer
    CANCELLED = "CANCELLED"      # Cancelled and refunded


class ConversationStatus(StrEnum):
    OPEN = "OPEN"                            # Active chat
    AWAITING_APPROVAL = "AWAITING_APPROVAL"  # Frozen / waiting for manager action
    RESOLVED = "RESOLVED"                    # Finished


class RefundStatus(StrEnum):
    PENDING = "PENDING"    # Awaiting manager decision
    APPROVED = "APPROVED"  # Manager approved
    REJECTED = "REJECTED"  # Manager rejected


class TicketCategory(StrEnum):
    BILLING = "BILLING"
    REFUND = "REFUND"
    ORDER_CANCELLATION = "ORDER_CANCELLATION"
    ORDER_INQUIRY = "ORDER_INQUIRY"          # NEW — status/tracking questions, no refund involved
    TECHNICAL_SUPPORT = "TECHNICAL_SUPPORT"
    GENERAL = "GENERAL"


class SentimentType(StrEnum):
    POSITIVE = "POSITIVE"
    NEUTRAL = "NEUTRAL"
    NEGATIVE = "NEGATIVE"
    FRUSTRATED = "FRUSTRATED"
    # Deliberately not adding ANGRY — no clear boundary from FRUSTRATED,
    # and a second near-duplicate value only hurts classification accuracy.


class ResolutionType(StrEnum):
    REFUND_ISSUED = "REFUND_ISSUED"
    REFUND_REJECTED = "REFUND_REJECTED"
    ORDER_CANCELLED = "ORDER_CANCELLED"
    INQUIRY_ANSWERED = "INQUIRY_ANSWERED"
    ESCALATED = "ESCALATED"  # NEW — agent genuinely couldn't resolve it, honest exit


# --- Database Models ---

class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    orders: Mapped[list["Order"]] = relationship(
        back_populates="customer", cascade="all, delete-orphan"
    )
    conversations: Mapped[list["Conversation"]] = relationship(
        back_populates="customer", cascade="all, delete-orphan"
    )


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String, primary_key=True)  # e.g., "ORD-1024"
    customer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("customers.id"), nullable=False)
    item_name: Mapped[str] = mapped_column(String, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[OrderStatus] = mapped_column(
        SQLEnum(OrderStatus, native_enum=False, validate_strings=True),
        nullable=False,
        default=OrderStatus.PENDING,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    customer: Mapped["Customer"] = relationship(back_populates="orders")
    refund_approvals: Mapped[list["RefundApproval"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(String, primary_key=True)  # == LangGraph thread_id
    customer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("customers.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    status: Mapped[ConversationStatus] = mapped_column(
        SQLEnum(ConversationStatus, native_enum=False, validate_strings=True),
        nullable=False,
        default=ConversationStatus.OPEN,
    )
    summary: Mapped[str | None] = mapped_column(String, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )

    customer: Mapped["Customer"] = relationship(back_populates="conversations")
    refund_approvals: Mapped[list["RefundApproval"]] = relationship(
        back_populates="conversation", cascade="all, delete-orphan"
    )
    ticket: Mapped["Ticket | None"] = relationship(
        back_populates="conversation", uselist=False, cascade="all, delete-orphan"
    )


class RefundApproval(Base):
    __tablename__ = "refund_approvals"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=_uuid)
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id"), nullable=False)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id"), nullable=False)
    proposed_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    final_amount: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    reason: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[RefundStatus] = mapped_column(
        SQLEnum(RefundStatus, native_enum=False, validate_strings=True),
        nullable=False,
        default=RefundStatus.PENDING,
    )
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    category: Mapped[TicketCategory | None] = mapped_column(
        SQLEnum(TicketCategory, native_enum=False, validate_strings=True), nullable=True
    )
    sentiment: Mapped[SentimentType | None] = mapped_column(
        SQLEnum(SentimentType, native_enum=False, validate_strings=True), nullable=True
    )

    conversation: Mapped["Conversation"] = relationship(back_populates="refund_approvals")
    order: Mapped["Order"] = relationship(back_populates="refund_approvals")


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=_uuid)
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id"), unique=True, nullable=False)
    category: Mapped[TicketCategory] = mapped_column(
        SQLEnum(TicketCategory, native_enum=False, validate_strings=True), nullable=False
    )
    sentiment: Mapped[SentimentType] = mapped_column(
        SQLEnum(SentimentType, native_enum=False, validate_strings=True), nullable=False
    )
    resolution: Mapped[ResolutionType] = mapped_column(
        SQLEnum(ResolutionType, native_enum=False, validate_strings=True), nullable=False
    )
    refund_amount: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    resolved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    conversation: Mapped["Conversation"] = relationship(back_populates="ticket")