import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select
from app.db.session import engine, async_session_factory, Base
from app.db.models import (
    Customer,
    Order,
    OrderStatus,
    Conversation,
    ConversationStatus,
    RefundApproval,
    RefundStatus,
    Ticket,
    TicketCategory,
    SentimentType,
    ResolutionType,
)


async def reset_database():
    """Drops and recreates every table. This IS the 'remove existing, create fresh' step —
    run this file again any time you want a clean slate; old data is not preserved."""
    async with engine.begin() as conn:
        print("Dropping existing tables...")
        await conn.run_sync(Base.metadata.drop_all)
        print("Creating fresh tables with updated schema...")
        await conn.run_sync(Base.metadata.create_all)


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def seed_data():
    """Populates the database with realistic sample customers, orders, and test scenarios."""
    await reset_database()
    print("Starting database seeding...")

    async with async_session_factory() as session:
        now = _now()

        # ---------------------------------------------------------
        # 1. Customers
        # ---------------------------------------------------------
        alice = Customer(
            id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
            name="Alice Johnson",
            email="alice@example.com",
            created_at=now - timedelta(days=60),
        )
        bob = Customer(
            id=uuid.UUID("22222222-2222-2222-2222-222222222222"),
            name="Bob Smith",
            email="bob@example.com",
            created_at=now - timedelta(days=30),
        )
        charlie = Customer(
            id=uuid.UUID("33333333-3333-3333-3333-333333333333"),
            name="Charlie Davis",
            email="charlie@example.com",
            created_at=now - timedelta(days=15),
        )
        diana = Customer(
            id=uuid.UUID("44444444-4444-4444-4444-444444444444"),
            name="Diana Prince",
            email="diana@example.com",
            created_at=now - timedelta(days=90),
        )

        session.add_all([alice, bob, charlie, diana])
        await session.flush()

        # ---------------------------------------------------------
        # 2. Orders with diverse statuses and test cases
        # ---------------------------------------------------------
        order_1001 = Order(
            id="ORD-1001",
            customer_id=alice.id,
            item_name="Sony WH-1000XM5 Wireless Headphones",
            amount=Decimal("349.99"),
            status=OrderStatus.PENDING,
            created_at=now - timedelta(hours=2),
        )
        order_1002 = Order(
            id="ORD-1002",
            customer_id=alice.id,
            item_name="Logitech MX Master 3S Mouse",
            amount=Decimal("99.99"),
            status=OrderStatus.DELIVERED,
            created_at=now - timedelta(days=10),
        )
        order_1003 = Order(
            id="ORD-1003",
            customer_id=bob.id,
            item_name="Apple 20W USB-C Power Adapter",
            amount=Decimal("19.00"),
            status=OrderStatus.PROCESSING,
            created_at=now - timedelta(hours=12),
        )
        order_1004 = Order(
            id="ORD-1004",
            customer_id=charlie.id,
            item_name="Dell UltraSharp 27 4K Monitor",
            amount=Decimal("599.99"),
            status=OrderStatus.SHIPPED,
            created_at=now - timedelta(days=2),
        )
        order_1005 = Order(
            id="ORD-1005",
            customer_id=diana.id,
            item_name="Mechanical Gaming Keyboard RGB",
            amount=Decimal("149.50"),
            status=OrderStatus.CANCELLED,
            created_at=now - timedelta(days=20),
        )

        session.add_all([order_1001, order_1002, order_1003, order_1004, order_1005])
        await session.flush()

        # ---------------------------------------------------------
        # 3. Seed Conversations, Pending Approval, and Resolved Ticket
        # ---------------------------------------------------------
        conv_diana = Conversation(
            id="thread_diana_sample_01",
            customer_id=diana.id,
            status=ConversationStatus.RESOLVED,
            summary="Customer requested cancellation for order ORD-1005 due to accidental duplicate order. Refund approved and issued.",
            created_at=now - timedelta(days=18),
            updated_at=now - timedelta(days=18),
        )
        session.add(conv_diana)
        await session.flush()

        ticket_diana = Ticket(
            conversation_id=conv_diana.id,
            category=TicketCategory.ORDER_CANCELLATION,
            sentiment=SentimentType.POSITIVE,
            resolution=ResolutionType.REFUND_ISSUED,
            refund_amount=Decimal("149.50"),
            resolved_at=now - timedelta(days=18),
        )
        session.add(ticket_diana)

        conv_bob = Conversation(
            id="thread_bob_sample_02",
            customer_id=bob.id,
            status=ConversationStatus.AWAITING_APPROVAL,
            summary="Customer requested refund for Apple Power Adapter (ORD-1003) because they no longer need it.",
            created_at=now - timedelta(hours=3),
            updated_at=now - timedelta(hours=3),
        )
        session.add(conv_bob)
        await session.flush()

        approval_bob = RefundApproval(
            conversation_id=conv_bob.id,
            order_id=order_1003.id,
            proposed_amount=Decimal("19.00"),
            reason="Customer changed mind before dispatch",
            status=RefundStatus.PENDING,
            category=TicketCategory.REFUND,
            sentiment=SentimentType.NEUTRAL,
        )
        session.add(approval_bob)

        await session.commit()

        print("Database seeding completed successfully!")
        print("   - 4 Customers created (Alice, Bob, Charlie, Diana)")
        print("   - 5 Orders created (ORD-1001 to ORD-1005 with varied statuses)")
        print("   - 1 Pending Approval seeded (for testing Manager Dashboard)")
        print("   - 1 Resolved Ticket seeded (for testing Audit Log)")


if __name__ == "__main__":
    asyncio.run(seed_data())
