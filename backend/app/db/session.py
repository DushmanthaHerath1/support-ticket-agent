from typing import AsyncGenerator
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.ext.asyncio import (
    AsyncSession, 
    async_sessionmaker,
    create_async_engine
)
from app.config import settings

database_url=settings.DATABASE_URL
if not database_url:
    raise ValueError("Error: Database url not initialized.")

if database_url.startswith("postgresql://"):
    database_url=database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

elif database_url.startswith("sqlite://") and not database_url.startswith("sqlite+aiosqlite://"):
    database_url=database_url.replace("sqlite://", "sqlite+aiosqlite://", 1)


engine=create_async_engine(
    database_url,
    echo=False,
    pool_pre_ping=True
)

#session factory
async_session_factory=async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False
)

#base class for models
class Base(DeclarativeBase):
    pass

#FastAPI Dependency Injection Function
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()