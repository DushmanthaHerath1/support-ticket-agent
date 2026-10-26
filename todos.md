# Project Roadmap & Implementation To-Do List

**Project:** AI Customer Support & Refund Agent with Human-In-The-Loop (HITL)  
**Stack:** FastAPI + LangGraph + PostgreSQL / SQLite + React (Vite) + Tailwind CSS + Dual LLM (Groq Qwen 3.6-27B + Google Gemini 2.5 Flash)

---

## 📁 Current Project Structure

```
project_1/
├── backend/
│   ├── app/
│   │   ├── agent/
│   │   │   ├── graph.py               # StateGraph definition, compilation, checkpointer wiring
│   │   │   ├── prompts.py             # System prompts and instructions
│   │   │   ├── schemas.py             # TicketResolution Pydantic model with enums
│   │   │   ├── state.py               # SupportState TypedDict
│   │   │   └── tools.py               # lookup_order, check_refund_eligibility, issue_refund, resolve_ticket
│   │   ├── db/
│   │   │   ├── models.py              # SQLAlchemy models: customers, orders, conversations, etc.
│   │   │   ├── seed.py                # Database seeding script with realistic demo data
│   │   │   └── session.py             # Database engine & async sessionmaker
│   │   ├── routers/
│   │   │   ├── approvals.py           # GET /approvals/pending, POST /approvals/{id}/action
│   │   │   ├── chat.py                # POST /chat (SSE streaming), GET /chat/{id}
│   │   │   └── tickets.py             # GET /tickets
│   │   ├── config.py                  # Pydantic Settings / Environment variables
│   │   └── schemas.py                 # HTTP API schemas (ChatRequest, ApprovalAction, TicketResponse)
│   ├── alembic/                       # Alembic migrations directory
│   │   ├── versions/
│   │   └── env.py
│   ├── tests/                         # Automated tests directory
│   ├── .env / .env.example
│   ├── alembic.ini
│   ├── backend-AGENTS.md              # Backend guidelines & design rules
│   ├── main.py                        # FastAPI application, CORS, lifespan & checkpointer setup
│   ├── pyproject.toml / uv.lock
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── assets/api/
│   │   │   ├── client.js              # REST API client (approvals, tickets, conversation history)
│   │   │   └── stream.js              # SSE streaming handler for POST /chat
│   │   ├── components/
│   │   │   ├── ApprovalBanner.jsx     # Banner in chat when agent is awaiting human approval
│   │   │   ├── ApprovalCard.jsx       # Refund approval card with Approve/Reject/Edit actions
│   │   │   ├── Badge.jsx              # Status, sentiment, and category badges
│   │   │   ├── EmptyState.jsx         # Clean empty-state graphic & message
│   │   │   ├── MessageBubble.jsx      # Chat bubble component with copy response action
│   │   │   ├── Modal.jsx              # Reusable modal (Edit amount, Reject, Ticket details)
│   │   │   ├── StatCard.jsx           # Dashboard metric card
│   │   │   └── StatusIndecator.jsx    # Live tool-call indicator ("Looking up order records...")
│   │   ├── hooks/
│   │   │   ├── useApprovals.js        # Approvals data fetching, modal states & action handlers
│   │   │   └── useTickets.js          # Tickets data fetching, metrics calculation & filtering
│   │   ├── layouts/
│   │   │   └── AdminLayout.jsx        # Admin navigation shell (Approvals & Tickets tabs)
│   │   ├── screens/
│   │   │   ├── Approvals.jsx          # Screen B: Manager pending refund approvals dashboard
│   │   │   ├── Chat.jsx               # Screen A: Customer support streaming chat interface
│   │   │   └── Tickets.jsx            # Screen C: Resolved tickets audit table
│   │   ├── utils/
│   │   │   └── formatters.js          # Currency, date, and cent formatters
│   │   ├── App.css
│   │   ├── App.jsx                    # React Router configuration
│   │   ├── index.css                  # Tailwind v4 styles & custom utilities
│   │   └── main.jsx                   # React root entry point
│   ├── .env / .env.example
│   ├── frontend-AGENTS.md             # Frontend guidelines & UI specifications
│   ├── package.json / pnpm-lock.yaml
│   └── vite.config.js
│
├── AGENT.md                           # General agent guidelines
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
- [x] Implement tools in `backend/app/agent/tools.py`:
  - [x] `lookup_order(order_id)`
  - [x] `check_refund_eligibility(order_id)`
  - [x] `issue_refund(order_id, amount, reason)` with native `interrupt()` for Human-In-The-Loop.
  - [x] `resolve_ticket(category, sentiment, resolution, refund_amount)` to trigger structured logging.
- [x] Construct the StateGraph in `backend/app/agent/graph.py`:
  - [x] `summarize` node — uses Qwen (Groq) for summarization; triggers when `len(messages) > 6`.
  - [x] `tool_calling_llm` node — Groq `qwen/qwen3.6-27b` ReAct core.
  - [x] `tools` node — `ToolNode` executing order queries & HITL pause via `interrupt()`.
  - [x] ~~`structured_output` node~~ — **Intentionally removed.** `resolve_ticket` already receives category, sentiment, resolution, and refund_amount as typed flat arguments matching `TicketResolution` exactly. Invoking a second LLM pass to re-extract the same data would waste tokens with zero gain. Data is written to DB directly inside `resolve_ticket`.
  - [x] Configure checkpointer — `AsyncPostgresSaver` wired via lifespan in `main.py`, keyed by `thread_id`.
  - [x] Wire conditional edges: `should_summarize` entry point, ReAct loop, and HITL pause.

> **Note — Gemini LLM:** `ChatGoogleGenerativeAI` is temporarily detached from the graph. The initialization code is kept as a comment in `graph.py` for future use (e.g., routing summarization or structured tasks to a separate provider). Qwen (Groq) handles all tasks for now.

---

### Phase 4: Backend API & Streaming Endpoints

- [x] Build `backend/app/config.py` for environment and settings management.
- [x] Implement `POST /chat` in `backend/app/routers/chat.py` with Server-Sent Events (SSE):
  - [x] Emit `token` events during LLM generation.
  - [x] Emit `tool_start` events when tools are called.
  - [x] Emit `awaiting_approval` event when graph is paused at HITL interrupt.
  - [x] Emit `end` event when turn completes.
- [x] Implement `GET /conversations/{id}` for loading historical messages on reload.
- [x] Implement `GET /approvals/pending` in `backend/app/routers/approvals.py` to list active refund approval requests.
- [x] Implement `POST /approvals/{id}/action` (Approve / Reject / Edit) using `Command(resume=...)` to resume the graph.
- [x] Implement `GET /tickets` in `backend/app/routers/tickets.py` to query resolved tickets audit log.
- [x] Mount routers and configure CORS in `backend/app/main.py`.

---

### Phase 5: Automated Testing & Verification

- [ ] Create test fixtures with mocked LLM responses in `backend/tests/conftest.py`.
- [ ] Implement unit tests in `backend/tests/test_agent.py`:
  - [x] Test order lookup and eligibility checks.
  - [x] Test HITL interrupt trigger on `issue_refund`.
  - [x] Test graph resume with approval / rejection / amount edit.
  - [x] Test structured output exit via `resolve_ticket`.
- [ ] Implement API route tests in `backend/tests/test_api.py`.

---

### Phase 6: Frontend Development (React + Tailwind)

> **Frontend complete:** Vite + React 19 + Tailwind CSS v4 with full router integration, live SSE chat streaming, approvals dashboard, and tickets audit log.

- [x] Build API communication utilities:
  - [x] `frontend/src/api/client.js` for REST endpoints.
  - [x] `frontend/src/api/stream.js` for SSE handling.
- [x] Set up routing: `App.jsx` with React Router + `AdminLayout.jsx` with nested admin routes (`/admin/approvals`, `/admin/tickets`).
- [x] Develop reusable UI components:
  - [x] `MessageBubble.jsx` for user and assistant messages with markdown support.
  - [x] `StatusIndicator.jsx` for live tool progress updates.
  - [x] `ApprovalCard.jsx` with Approve, Reject, and Edit amount modal/input.
- [x] Build screen views:
  - [x] **Screen A (`Chat.jsx`)**: Token streaming, approval banner, conversation history restore (localStorage).
  - [x] **Screen B (`Approvals.jsx`)**: Manager pending refund list with one-click Approve/Reject/Edit action handling.
  - [x] **Screen C (`Tickets.jsx`)**: Structured audit log table showing sentiment, resolution, and amounts.

---

### Phase 7: Database Seeding & Integration Testing

- [x] Write `backend/app/db/seed.py` — seeding script complete (4 customers, 5 orders, 1 pending approval, 1 resolved ticket).
- [x] Run database seeding against real database to populate sample customers and orders.
- [x] Test end-to-end user journey:
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

---

### 🔧 Technical Debt & Backlog (Discovered During Testing)

- [x] **`/chat` endpoint: `get_or_create_conversation` step** — Implemented inside `event_stream()` in `chat.py`. On every first message, checks if a `Conversation` row exists; creates one if not. FK integrity maintained.
