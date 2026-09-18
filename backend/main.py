#stdlib
from contextlib import asynccontextmanager

#third-party
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

#local
from app.config import settings
from app.db.session import engine
from app.agent.graph import build_graph
from app.routers import chat, approvals, tickets


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with AsyncPostgresSaver.from_conn_string(settings.DATABASE_URL) as checkpointer:
        await checkpointer.setup()
        app.state.graph = build_graph(checkpointer)
        
        try:
            yield
        finally:
            await engine.dispose()
    # Connection pool closes automatically here on app shutdown


app = FastAPI(title="Support Agent", lifespan=lifespan)

#CORS - allow the vite dev server to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True, #for now
    allow_methods=["*"],
    allow_headers=["*"],
)

#routers
app.include_router(chat.router)
app.include_router(approvals.router)
app.include_router(tickets.router)

@app.get("/health")
async def health():
    return {"status": "ok"}
