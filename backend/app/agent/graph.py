# Config & Environment
from app.config import settings

# State, Schemas & Prompts
from app.agent.state import SupportState
from app.agent.prompts import SYSTEM_PROMPT, SUMMARIZE_PROMPT

# Tools
from app.agent.tools import (
    lookup_order,
    check_refund_eligibility,
    issue_refund,
    resolve_ticket,
)

# LangGraph & LangChain
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, RemoveMessage
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

#tools array
model_tools=[lookup_order, check_refund_eligibility, issue_refund, resolve_ticket]

#initialize llms
qwen_llm=ChatGroq(
    model="qwen/qwen3.6-27b",
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
    builder.add_node("summarize", summarize_node)
    builder.add_node("tool_calling_llm", tool_calling_llm)
    builder.add_node("tools", ToolNode(model_tools))

    # edges
    builder.add_conditional_edges(
        START,
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
