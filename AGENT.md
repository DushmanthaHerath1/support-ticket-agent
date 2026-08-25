# Agent Instructions

This file is the source of truth for any coding agent working in this repository. Read it before touching code. `backend/AGENTS.md` and `frontend/AGENTS.md` add directory-specific detail — prefer the closer file when working inside those folders, but nothing there should contradict this one.

**Project:** AI support & refund agent (HITL) — an agent that answers order questions and proposes refunds, but every refund pauses for a human to approve, reject, or edit before it executes. v1 portfolio build: keep it simple, keep it shippable in a few hours, don't let scope creep turn it into an unfinished platform.

## 1. Stack & Architecture

- **Backend:** Python + FastAPI, streaming via SSE
- **Agent orchestration:** LangGraph + LangChain Core + Pydantic v2
- **Frontend:** React + Vite + Tailwind
- **Database:** PostgreSQL via SQLAlchemy, `langgraph-checkpoint-postgres` for agent state/interrupts
- **LLM:** Dual-Model Architecture:
  - **Tool-Calling Brain:** Groq `qwen/qwen3.6-27b` — ultra-fast ReAct loop and tool execution
  - **Conversational & Structured Output Engine:** Google `gemini-2.5-flash` — conversation summarization, clean user responses without `<think>` artifacts, and strict `TicketResolution` structured extraction
- **Package managers:** `uv` (backend), `pnpm` (frontend)

**Rule:** The stack is locked unless explicitly changed by the user. Groq handles fast tool execution while Gemini 2.5 Flash handles summarization, user-facing dialogue generation, and structured audit output.

## 2. Dependency Policy

**Default: write it yourself.** Reach for a library only when the alternative would be non-trivial, error-prone, or reinvention of a complex standard. Every dependency is a liability.

- **OK to add (backend):** `langgraph`, `langchain`, `langchain-groq`, `langchain-google-genai`, `sqlalchemy`, `psycopg`, `langgraph-checkpoint-postgres`, `pydantic`, `alembic`, `sse-starlette` — these do genuinely hard things (agent orchestration, SQL, streaming protocol, migrations).
- **OK to add (frontend):** nothing beyond what's already in `frontend/AGENTS.md`'s stack. No `redux`/`zustand`/similar state library, no `react-router` — this is a two-screen app and server state (conversations, approvals) already lives in Postgres, not the client.
- **Not OK to add:** helper libraries for a few lines of standard logic, "nicer API" wrappers over `fetch` or `EventSource`, generic UI component libraries before there's a second consumer of the abstraction.

Before adding a runtime dependency, state in the commit/PR:

1. What exactly it does that can't be written in <30 lines of clear code.
2. Its maintenance / transitive-dependency footprint.

## 3. Configuration & Environment

- Backend: a single `app/config.py` loads and validates all env vars (`GROQ_API_KEY`, `GEMINI_API_KEY`, `DATABASE_URL`) — no `os.getenv` scattered through route or agent code.
- Frontend: a single `src/config.js` (or Vite's `import.meta.env` accessed only there) — no `import.meta.env` scattered through components.
- Fail fast on startup if required config is missing. No silent fallbacks to empty strings or hardcoded defaults for secrets.
- Never commit secrets, `.env` files, or API keys. `.env.example` (with blank values) is fine to commit.

## 4. Code Style & Philosophy

- **Make the smallest correct change.** Fix root causes over adding hacks.
- **Small, obvious functions.** A 15-line function with clear names beats a three-class abstraction.
- **No premature abstraction.** Extract only when there's a third caller. Three similar route handlers is better than a speculative generic handler factory.
- **No backwards-compat shims or feature flags** unless explicitly asked for — this is a v1, there is no prior version to stay compatible with.
- **Comments:** explain _why_ when non-obvious, never _what_. Remove stale TODOs.
- **Security:** sanitize untrusted input; validate at boundaries (HTTP input, tool outputs before they hit the DB). Auth on `/approvals/*` is intentionally out of scope for v1 — don't add it unprompted, and don't silently ship it insecure either; if it's missing, it should be because the doc says so, not because nobody noticed.

### Project-specific rules — do not deviate without flagging it

These came out of an earlier over-engineered draft of this project and exist specifically to keep the agent design simple. Treat them as load-bearing, not stylistic preferences:

- `issue_refund` is a normal tool inside one `ToolNode` — it calls `interrupt()` internally. Never create a second graph branch or a separate node for "sensitive" tools.
- The graph only exits the ReAct loop via an explicit `resolve_ticket` tool call, which routes to `structured_output`. Don't add heuristics like "no tool calls this turn means done."
- `TicketResolution.category`, `.sentiment`, `.resolution` are `Literal[...]` enums, never free `str` — this is what keeps `/tickets` queryable.
- `refund_approvals.status` has exactly three values: `PENDING`, `APPROVED`, `REJECTED`. There is no `EDITED` status — an edit is an `APPROVED` row where `final_amount != proposed_amount`.
- `conversation_id` is always the LangGraph `thread_id`. Resuming a paused graph uses `Command(resume=...)`, never a fresh `.invoke()`.

## 5. Development Workflow & Git

- Respect existing formatting and lint rules (`ruff`/`black` backend, `eslint`/`prettier` frontend, once configured).
- Reuse existing components, routes, and helpers before creating new ones.
- Keep commits focused and logically grouped. Do not rewrite history unless asked.
- Backend: `uv run pytest` for the smallest relevant test file while iterating, not the full suite every time.
- Frontend: verify against a running backend (`uv run uvicorn app.main:app --reload`) rather than mocking the SSE stream, unless a test explicitly calls for a mock.
- Mock the Groq client in backend tests — keep them deterministic and fast, don't hit the live API in CI.

## 6. Final Handoff Format

When finishing a task, provide a brief summary containing:

1. Summary of changes made.
2. Files changed.
3. Validation/tests performed.
4. Unresolved risks, assumptions, or missing config — especially anything that touches the API contract, DB schema, or graph structure in section 4, since those are shared contracts between backend, frontend, and the architecture doc.
