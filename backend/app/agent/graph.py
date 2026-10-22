
#stdlib
import uuid
import re

# Config & Environment
from app.config import settings

# State, Schemas & Prompts
from app.agent.state import SupportState
from app.agent.prompts import SYSTEM_PROMPT, SUMMARIZE_PROMPT

# Tools
from app.agent.tools import (
    check_refund_eligibility,
    issue_refund,
    resolve_ticket,
)

# LangGraph, LangChain and sqlAlchemy
from langchain_core.runnables import RunnableConfig
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, RemoveMessage
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from sqlalchemy import select

#local
from app.db.session import async_session_factory
from app.db.models import (
    Order
)

#tools array
model_tools=[check_refund_eligibility, resolve_ticket, issue_refund]

#initialize llms
qwen_llm=ChatGroq(
    model="qwen/qwen3.8-27b",
    groq_api_key=settings.GROQ_API_KEY,
    temperature=0.0,
    reasoning_effort="none"
)

qwen_brain=qwen_llm.bind_tools(model_tools)


# NOTE: Gemini is intentionally kept here (unused in the graph for now) as a placeholder
# for future multi-model experiments (e.g. routing summarization or specific tasks to a
# different provider). Not wired into any node currently — Groq (`llm`) is the sole
# provider driving this graph.

# gemini_llm=ChatGoogleGenerativeAI( 
#     model="gemini-2.5-flash",
#     google_api_key=settings.GOOGLE_API_KEY,
#     temperature=0.2
# )

ORDER_ID_RE = re.compile(r"\bORD-\d+\b", re.IGNORECASE)

#order Context node
async def load_order_context(state: SupportState, config: RunnableConfig) -> dict:
    """Determinastically fetchs only orders the customer referenced. No llm involvement."""
    customer_id = uuid.UUID(str(config["configurable"]["customer_id"]))

    last_human = next((m for m in reversed(state["messages"])if m.type == "human"), None)
    mentioned = {m.upper() for m in ORDER_ID_RE.findall(last_human.content)} if last_human else set()

    #orders already in context from earlier turns
    previous = {o["order_id"] for o in (state.get("order_context") or [])}
    ids_to_fetch = mentioned | previous

    if not ids_to_fetch:
        return {"order_context": [], "missing_order_ids": []}

    async with async_session_factory() as session:
        result = await session.execute(
            select(Order).where(
                Order.id.in_(ids_to_fetch),
                Order.customer_id == customer_id,
            )
        )
        orders = result.scalars().all()

        found_ids = {o.id for o in orders}

        return{
            "order_context": [
                {
                    "order_id": o.id,
                    "item_name": o.item_name,
                    "amount": float(o.amount),
                    "status": o.status.value,
                    "created_at": o.created_at.strftime("%Y-%m-%d"),
                
                }
                for o in orders
            ],
            "missing_order_ids": sorted(mentioned - found_ids)
        }



#summarize node
async def summarize_node(state: SupportState):
    """Condenses older messages. Only runs when should_summarize routes here."""

    messages=state["messages"] 
    summary=state.get("summary", "") 

    #format messages as a single string except last 2 messages
    new_msgs_str="\n".join(f"{m.type}: {m.content}" for m in messages[:-2])

    prompt=SUMMARIZE_PROMPT.format(
        existing_summary = summary or "None",
        new_messages=new_msgs_str
    )

    response=await qwen_llm.ainvoke(prompt)

    delete_messages = [RemoveMessage(id=m.id) for m in messages[:-2] if getattr(m, "id", None)]
    
    return {"summary": response.content, "messages": delete_messages}


#decision point: should summarize or not
def should_summarize(state: SupportState) -> str:
    """Conditional entry point — only summarizes once history actually grows."""
    
    return "summarize" if len(state["messages"]) > 6 else "tool_calling_llm"


#node to deside and call appropiate tool (reAct artchitecture)
async def tool_calling_llm(state: SupportState) -> dict:
    """Core ReAct decision node."""
    
    messages = state["messages"]
    summary=state.get("summary", "")

    system_prompt=SYSTEM_PROMPT

    orders = state.get("order_context") or []
    if orders:
        lines = "\n".join(
            f"- {o['order_id']} | {o['item_name']} | ${o['amount']:.2f} | {o['status']} | {o['created_at']}"
            for o in orders
        )
        system_prompt += f"\n\n### Verified Customer Orders (feom database - the ONLY source of roder facts)\n{lines}"

    else:
        system_prompt += f"\n\n### Verified Orders\nNone. If the customer asks about an order, ask for the order ID."

    missing = state.get("missing_order_ids") or []
    if missing:
        system_prompt += (
            "\n\n### Order IDs NOT found in this customer's account\n"
            + "\n".join(f"- {old}" for old in missing)
            + "\nTell the customer these were not found in thier account and ask them to verify."
        )


    if summary:
        system_prompt += f"\n\n### Current Conversation Summary:\n{summary}"
    
    full_message = [SystemMessage(content=system_prompt)] + list(messages)
    response=await qwen_brain.ainvoke(full_message)

    return {"messages": [response]}


#core graph
def build_graph(checkpointer):
    """Constructs and compiles the support agent graph.

    Takes a checkpointer instance (created and `.setup()`-ed by the caller, typically
    during FastAPI's lifespan startup) so the connection lifecycle is owned by the app,
    not by this module at import time.
    """
    builder = StateGraph(SupportState)

    # nodes
    builder.add_node("load_order_context", load_order_context)
    builder.add_node("summarize", summarize_node)
    builder.add_node("tool_calling_llm", tool_calling_llm)
    builder.add_node("tools", ToolNode(model_tools))

    # edges
    builder.add_edge(START, "load_order_context")
    builder.add_conditional_edges(
        "load_order_context",
        should_summarize,
        {"summarize": "summarize", "tool_calling_llm": "tool_calling_llm"},
    )
    builder.add_edge("summarize", "tool_calling_llm")
    builder.add_conditional_edges(
        "tool_calling_llm",
        tools_condition,
        {"tools": "tools", END: END},
    )
    builder.add_edge("tools", "tool_calling_llm")

    return builder.compile(checkpointer=checkpointer)
