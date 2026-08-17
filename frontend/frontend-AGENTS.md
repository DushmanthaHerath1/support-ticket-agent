# AGENTS.md — frontend

React frontend for the AI support & refund agent (HITL). Talks to the FastAPI backend over SSE + REST. Full architecture spec: `docs/support-agent-architecture-final.md`.

## Stack
- React (Vite)
- Tailwind CSS
- Native `EventSource` (or a small SSE wrapper) for `/chat` streaming — no need for a heavy state-management library, this app is two screens

## Setup
```bash
pnpm install
cp .env.example .env   # set VITE_API_BASE_URL, e.g. http://localhost:8000
pnpm dev
```

## Screens — keep it to these two, plus one optional
```
src/
  screens/
    Chat.jsx          # Screen A
    Approvals.jsx      # Screen B
    Tickets.jsx        # Optional Screen C — resolved tickets table, build last if at all
  api/
    client.js          # fetch wrappers for REST endpoints
    stream.js           # SSE connection handling for /chat
  components/
    MessageBubble.jsx
    StatusIndicator.jsx  # "Checking order records..." during tool_start events
    ApprovalBanner.jsx   # shown in chat when awaiting_approval fires
    ApprovalCard.jsx      # one pending refund in the Approvals table, with Approve/Edit/Reject
```

## Screen A — Chat
- Streams assistant responses token by token from `POST /chat` (SSE).
- On `tool_start` event: show a status line, e.g. "Checking order records...".
- On `awaiting_approval` event: stop streaming, show a persistent banner — "Your refund request is pending manager authorization" — and stop showing a "typing" indicator, since the agent is genuinely paused, not thinking.
- On reload: fetch history via `GET /conversations/{id}` before opening the stream.

## Screen B — Approvals
- Table from `GET /approvals/pending`: customer, order id, proposed amount, reason.
- Three actions per row, all hitting `POST /approvals/{id}/action`:
  - Approve → `{action: "APPROVE"}`
  - Reject → `{action: "REJECT"}`
  - Edit → `{action: "EDIT", adjusted_amount}` — show an inline amount input before confirming, don't submit an edit without a changed number.
- After any action, the corresponding chat conversation should resume on its own — poll `/conversations/{id}` or reconnect the stream; don't require a manual page refresh.

## Design constraints
- No routing library needed for two screens — a simple tab/nav toggle is enough. Don't add react-router unless the app grows past three screens.
- No global state library (Redux etc.) — conversation state and pending approvals both live server-side; the frontend just reflects them. Local `useState`/`useEffect` per screen is sufficient.
- Keep components small and un-abstracted for now — this is a portfolio v1, not a design system. Resist building a generic "Card" component library before there's a second use for it.

## Things to flag, not silently fix
If the SSE event shape from the backend (`token`, `tool_start`, `awaiting_approval`, `end`) doesn't match what's documented here, flag the mismatch rather than guessing at a new contract — check with the backend AGENTS.md / architecture doc first.
