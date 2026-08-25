# AGENTS.md — backend

FastAPI + LangGraph backend for the AI support & refund agent (HITL). Full architecture spec: `docs/support-agent-architecture-final.md` (copy it into this repo if it isn't already there) — read it before making structural changes.

## Stack
- FastAPI + Uvicorn, SSE for streaming (`text/event-stream`)
- LangGraph + LangChain Core + Pydantic v2 for the agent
- PostgreSQL via SQLAlchemy; `langgraph-checkpoint-postgres` for agent state/interrupts
- LLM: Dual-Model Setup:
  - **Tool-Calling Brain:** Groq `qwen/qwen3.6-27b` (fast ReAct loop and tool-calling execution)
  - **Conversational & Structured Output:** Google `gemini-2.5-flash` (summarization, structured ticket resolution audit logging, clean customer-facing streaming responses)

## Setup
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in GROQ_API_KEY, GEMINI_API_KEY, DATABASE_URL
alembic upgrade head    # or equivalent migration command
uvicorn app.main:app --reload
```

## Project structure (target — create if missing)
```
app/
  main.py              # FastAPI app, route registration
  routers/
    chat.py            # POST /chat, GET /conversations/{id}
    approvals.py       # GET /approvals/pending, POST /approvals/{id}/action
    tickets.py         # GET /tickets
  agent/
    graph.py           # StateGraph definition, compiled graph, checkpointer wiring
    state.py           # SupportState TypedDict
    tools.py           # lookup_order, check_refund_eligibility, issue_refund, resolve_ticket
    schemas.py         # TicketResolution Pydantic model (Literal fields, not free strings)
  db/
    models.py          # SQLAlchemy models: customers, orders, conversations, refund_approvals, tickets
    session.py
  config.py            # env var loading
```

## Core design rules — don't deviate without updating the architecture doc
- `issue_refund` is a normal tool inside the single `ToolNode` — it calls `interrupt()` internally. Do NOT create a second graph branch or separate node for "sensitive tools." One tool node handles everything.
- The agent only exits the ReAct loop via an explicit `resolve_ticket` tool call, which routes to the `structured_output` node. There is no other exit condition — don't add heuristics like "no tool calls this turn = done."
- `TicketResolution.category`, `.sentiment`, and `.resolution` must stay `Literal[...]` enums, not `str`. This is what keeps `/tickets` queryable.
- `refund_approvals.status` has exactly three values: `PENDING`, `APPROVED`, `REJECTED`. There is no `EDITED` status — an edit is just an `APPROVED` row where `final_amount != proposed_amount`.
- `conversation_id` == LangGraph `thread_id`. Always pass it through to the checkpointer config: `config={"configurable": {"thread_id": conversation_id}}`.
- Resuming a paused graph uses `Command(resume=...)`, not a fresh `.invoke()`.

## API contract (keep in sync with routers/)
- `POST /chat` — `{conversation_id, message, customer_id}` → SSE events: `token`, `tool_start`, `awaiting_approval`, `end`
- `GET /conversations/{id}` — full message history
- `GET /approvals/pending`
- `POST /approvals/{id}/action` — `{action: APPROVE|REJECT|EDIT, adjusted_amount?}`
- `GET /tickets`

## Auth
Not implemented in v1 by design — `/approvals/*` is intentionally open for this demo/portfolio scope. Don't silently add auth complexity unless asked; if you do add it, note the change in the architecture doc.

## Testing
```bash
pytest                      # unit tests
pytest tests/test_agent.py  # graph behavior: tool calls, interrupt/resume, structured output exit
```
When testing the agent, mock the LLM clients (Groq & Google GenAI) rather than hitting live APIs — keep tests deterministic and fast.

## Things to flag, not silently fix
If a change would alter the API contract above, the DB schema, or the graph's node/edge structure, call it out explicitly rather than just implementing it — these are the pieces the frontend and the architecture doc both depend on.
