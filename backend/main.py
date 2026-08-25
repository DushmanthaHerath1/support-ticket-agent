from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import settings
from app.agent.graph import build_graph
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with AsyncPostgresSaver.from_conn_string(settings.DATABASE_URL) as checkpointer:
        await checkpointer.setup()
        app.state.graph = build_graph(checkpointer)
        yield
    # Connection pool closes automatically here on app shutdown


app = FastAPI(title="Support Agent", lifespan=lifespan)

@app.get("/health")
async def health():
    return {"status": "ok"}

