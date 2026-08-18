# Project Roadmap & Implementation To-Do List

**Project:** AI Customer Support & Refund Agent with Human-In-The-Loop (HITL)  
**Stack:** FastAPI + LangGraph + PostgreSQL / SQLite + React (Vite) + Tailwind CSS + Groq / LLaMA

---

## 📁 Target Project Structure

```
project_1/
├── backend/
│   ├── app/
│   │   ├── agent/
│   │   │   ├── __init__.py
│   │   │   ├── graph.py               # StateGraph definition, compilation, checkpointer wiring
│   │   │   ├── state.py               # SupportState TypedDict
│   │   │   ├── tools.py               # lookup_order, check_refund_eligibility, issue_refund, resolve_ticket
│   │   │   ├── schemas.py             # TicketResolution Pydantic model with Literal enums
│   │   │   └── prompts.py             # System prompts and instructions
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── models.py              # SQLAlchemy models: customers, orders, conversations, refund_approvals, tickets
│   │   │   ├── session.py             # Database engine & sessionmaker
│   │   │   └── seed.py                # Database seeding script with realistic demo data
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── chat.py                # POST /chat (SSE streaming), GET /conversations/{id}
│   │   │   ├── approvals.py           # GET /approvals/pending, POST /approvals/{id}/action
│   │   │   └── tickets.py             # GET /tickets
│   │   ├── config.py                  # Pydantic Settings / Environment variables
│   │   └── main.py                    # FastAPI application, CORS, router mounting
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py                # Test fixtures and mock Groq client
│   │   ├── test_agent.py              # Graph behavior, tool calls, interrupt/resume, structured exit
│   │   └── test_api.py                # Endpoints tests (/chat, /approvals, /tickets)
│   ├── .env.example
│   ├── requirements.txt
│   └── alembic/ (or init db script)
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js              # REST API client (approvals, tickets, conversation history)
│   │   │   └── stream.js              # SSE streaming handler for POST /chat
│   │   ├── components/
│   │   │   ├── ApprovalBanner.jsx     # Banner in chat when agent is awaiting human approval
│   │   │   ├── ApprovalCard.jsx       # Refund approval card with Approve/Reject/Edit actions
│   │   │   ├── MessageBubble.jsx      # Chat bubble component (user / assistant / system)
│   │   │   ├── StatusIndicator.jsx    # Live tool-call indicator ("Looking up order #1234...")
│   │   │   └── Navbar.jsx             # Clean tab navigation between screens
│   │   ├── screens/
│   │   │   ├── Chat.jsx               # Screen A: Customer support streaming chat interface
│   │   │   ├── Approvals.jsx          # Screen B: Manager pending refund approvals dashboard
│   │   │   └── Tickets.jsx            # Screen C: Resolved tickets audit table (structured output view)
│   │   ├── App.jsx                    # Main view container and tab state
│   │   ├── index.css                  # Tailwind styles and custom animations
│   │   └── main.jsx                   # React root entry point
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend-AGENTS.md                  # Backend guidelines & design rules
├── frontend-AGENTS.md                 # Frontend guidelines & UI specifications
├── support-agent-architecture.md      # Full architecture specification
└── todos.md                           # Master implementation checklist
```

---

## 📋 Step-by-Step Implementation Roadmap

### Phase 1: Environment & Project Setup

- [x] Initialize directory layout (`backend/` and `frontend/`).
- [x] Set up Python virtual environment (`.venv`) and prepare `requirements.txt` (`fastapi`, `uvicorn`, `langgraph`, `langgraph-checkpoint-postgres`, `langchain-core`, `langchain-groq`, `sqlalchemy`, `alembic`, `pydantic-settings`, `psycopg2-binary` / `aiosqlite`, `pytest`, `sse-starlette`).
- [x] Create `backend/.env.example` and `.env` (`GROQ_API_KEY`, `DATABASE_URL`, `PORT`).
- [x] Initialize React frontend with Vite, pnpm, and configure Tailwind CSS.

---

### Phase 2: Database Layer, Models & Alembic Migrations

- [x] Configure `backend/app/db/session.py` with SQLAlchemy engine and session factory.
- [x] Initialize Alembic (`alembic init alembic`) and configure `alembic/env.py` to point to SQLAlchemy `Base.metadata`.
- [x] Define database models in `backend/app/db/models.py`:
  - [x] `Customer` (`id`, `name`, `email`)
  - [x] `Order` (`id`, `customer_id`, `item`, `amount`, `status`, `created_at`)
  - [x] `Conversation` (`id`, `customer_id`, `created_at`)
  - [x] `RefundApproval` (`id`, `conversation_id`, `order_id`, `proposed_amount`, `reason`, `status`, `final_amount`, `decided_at`)
  - [x] `Ticket` (`id`, `conversation_id`, `category`, `sentiment`, `resolution`, `refund_amount`, `resolved_at`)
- [x] Create `backend/app/db/seed.py` to populate realistic fake customers and order histories for testing.

---

### Phase 3: LangGraph Agent Core

- [x] Define `SupportState` in `backend/app/agent/state.py` extending `MessagesState` (`customer_id`, `order_context`).
- [x] Define `TicketResolution` structured output Pydantic schema in `backend/app/agent/schemas.py` with strict `Literal[...]` fields for category, sentiment, and resolution.
- [ ] Implement tools in `backend/app/agent/tools.py`:
  - [ ] `lookup_order(order_id)`
  - [ ] `check_refund_eligibility(order_id)`
  - [ ] `issue_refund(order_id, amount, reason)` with native `interrupt()` for Human-In-The-Loop.
  - [ ] `resolve_ticket(category, sentiment, resolution, refund_amount)` to trigger structured logging.
- [ ] Construct the StateGraph in `backend/app/agent/graph.py`:
  - [ ] `summarize` node (token threshold check & message trimming)
  - [ ] `tool_calling_llm` node (Groq `llama-4-scout-17b-16e-instruct` / fast tool-calling model)
  - [ ] `tools` node (`ToolNode`)
  - [ ] `structured_output` node
  - [ ] Configure checkpointer (Memory or Postgres checkpointer keyed by `thread_id` == `conversation_id`).
  - [ ] Wire conditional edges: ReAct loop, HITL pause, and `resolve_ticket` routing.

---

### Phase 4: Backend API & Streaming Endpoints

- [ ] Build `backend/app/config.py` for environment and settings management.
- [ ] Implement `POST /chat` in `backend/app/routers/chat.py` with Server-Sent Events (SSE):
  - [ ] Emit `token` events during LLM generation.
  - [ ] Emit `tool_start` events when tools are called.
  - [ ] Emit `awaiting_approval` event when graph is paused at HITL interrupt.
  - [ ] Emit `end` event when turn completes.
- [ ] Implement `GET /conversations/{id}` for loading historical messages on reload.
- [ ] Implement `GET /approvals/pending` in `backend/app/routers/approvals.py` to list active refund approval requests.
- [ ] Implement `POST /approvals/{id}/action` (Approve / Reject / Edit) using `Command(resume=...)` to resume the graph.
- [ ] Implement `GET /tickets` in `backend/app/routers/tickets.py` to query resolved tickets audit log.
- [ ] Mount routers and configure CORS in `backend/app/main.py`.

---

### Phase 5: Automated Testing & Verification

- [ ] Create test fixtures with mocked LLM responses in `backend/tests/conftest.py`.
- [ ] Implement unit tests in `backend/tests/test_agent.py`:
  - [ ] Test order lookup and eligibility checks.
  - [ ] Test HITL interrupt trigger on `issue_refund`.
  - [ ] Test graph resume with approval / rejection / amount edit.
  - [ ] Test structured output exit via `resolve_ticket`.
- [ ] Implement API route tests in `backend/tests/test_api.py`.

---

### Phase 6: Frontend Development (React + Tailwind)

- [ ] Build API communication utilities:
  - [ ] `frontend/src/api/client.js` for REST endpoints.
  - [ ] `frontend/src/api/stream.js` for SSE handling.
- [ ] Develop reusable UI components:
  - [ ] `Navbar.jsx` with tabs for Chat, Pending Approvals, and Resolved Tickets.
  - [ ] `MessageBubble.jsx` for user and assistant messages with markdown support.
  - [ ] `StatusIndicator.jsx` for live tool progress updates.
  - [ ] `ApprovalBanner.jsx` when chat is waiting on manager approval.
  - [ ] `ApprovalCard.jsx` with Approve, Reject, and Edit amount modal/input.
- [ ] Build screen views:
  - [ ] **Screen A (`Chat.jsx`)**: Token streaming, status indicators, approval banner, conversation switching.
  - [ ] **Screen B (`Approvals.jsx`)**: Manager pending refund list with one-click Approve/Reject/Edit action handling.
  - [ ] **Screen C (`Tickets.jsx`)**: Structured audit log table showing sentiment, resolution, and amounts.

---

### Phase 7: Database Seeding & Integration Testing

- [ ] Run database seeding to populate sample customers and orders.
- [ ] Test end-to-end user journey:
  1. Customer inquires about order `#1001` -> Agent looks up order and explains status.
  2. Customer asks for refund -> Agent checks eligibility and calls `issue_refund`.
  3. Graph hits interrupt -> Chat UI displays "Waiting for approval" banner.
  4. Manager navigates to Screen B -> Reviews pending request and clicks **Approve** or edits amount.
  5. Graph resumes -> Agent confirms refund completion to customer and calls `resolve_ticket`.
  6. Ticket appears in Screen C with structured category, sentiment, and resolution.

---

### Phase 8: Polish, Demo Scenarios & Documentation

- [ ] Verify UI responsive design, animations, and transitions.
- [ ] Verify error states and network reconnects.
- [ ] Capture demo screenshots/recordings of the HITL approval flow for portfolio and walkthrough.
- [ ] Update documentation and walkthrough notes.
