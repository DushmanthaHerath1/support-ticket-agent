# stdlib
import json
import uuid
from typing import Any

# third-party
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# local
from app.db.models import Conversation, ConversationStatus
from app.db.session import async_session_factory
from app.schemas import ChatRequest


router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("")
async def chat(request: Request, body: ChatRequest) -> StreamingResponse:
    """
        Receives a user mesage, runs it through the LangGraph agent,
        and streams back SSE events(token, tool_start, awaiting_approval, end).
    """

    graph = request.app.state.graph

    async def event_stream():
        async with async_session_factory() as session:
            await get_or_create_conversation(session, body.conversation_id, body.customer_id)
            await session.commit()

        config = {
            "configurable": {
                "thread_id":body.conversation_id,
            }
        }

        input_data = {
            "messages": [HumanMessage(content=body.message)],
            "customer_id": body.customer_id,
        }

        async for event in graph.astream_events(input_data, config=config, version="v2"):
            kind= event["event"]

            if kind == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                if chunk.content:
                    yield f"event: token\ndata: {json.dumps({'content': chunk.content})}\n\n"

            elif kind == "on_tool_start":
                tool_name = event["name"]
                yield f"event: tool_start\ndata: {json.dumps({'tool': tool_name})}\n\n"

        state = await graph.aget_state(config)

        if state.next:
            yield f"event: awaiting_approval\ndata: {json.dumps({'status': 'waiting_for_manager'})}\n\n"
        else:
            yield f"event: end\ndata: {json.dumps({'status': 'done'})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")

@router.get("/{conversation_id}")
async def get_conversation(conversation_id: str, request: Request) -> list[dict[str, Any]]:
    """
        Returns the stored message history for a conversation from the LangGraph checkpointer.
        Used by the frontend to restore chat state on page reload.
    """
    graph = request.app.state.graph

    config = {"configurable": {"thread_id": conversation_id}}

    state = await graph.aget_state(config)

    if not state or not state.values:
        return[]

    messages = state.values.get("messages", [])

    return [
        {
            "type": msg.type,
            "content": msg.content
        }
        for msg in messages if msg.content
    ]


async def get_or_create_conversation(session:AsyncSession, conversation_id: str, customer_id: str ) -> Conversation:
    """
        Ensures a conversation row is exists in the DB fro the given conversation_id.
        creates one if missing. Must be called before the graph runs.
    """

    result = await session.execute(
        select(Conversation).where(Conversation.id == conversation_id)

    )
    conv = result.scalar_one_or_none()

    if conv is None:
        conv = Conversation(
            id=conversation_id,
            customer_id=uuid.UUID(customer_id),
            status=ConversationStatus.OPEN,
        )
        session.add(conv)
        await session.flush()
    return conv