<div align="center">

# 🛡️ AgentDesk
### Autonomous Customer Support & Refund Governance Engine with Human-In-The-Loop (HITL)

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/Orchestration-LangGraph-blue.svg?logo=python&logoColor=white)](https://langchain-ai.github.io/langgraph/)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20v4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Groq](https://img.shields.io/badge/LLM-Groq%20Qwen%203.8--27B-orange.svg)](https://groq.com)
[![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red.svg)](#license)

<p align="center">
  A hybrid agentic platform coupling conversational AI with deterministic business rules and human-governed financial controls for expanding e-commerce merchants.
</p>

</div>

---







## 📸 Product Preview

<div align="center">

| Customer Support Chat (SSE Streaming) | Manager Approvals (Human-in-the-Loop) | Resolved Tickets (Audit Log & KPIs) |
| :---: | :---: | :---: |
| ![Customer Chat Interface](https://github.com/user-attachments/assets/8010ce45-c9fa-459d-af8c-a1e230437320) | ![Manager Approvals Dashboard](https://github.com/user-attachments/assets/3d3fba91-43cd-4876-81a2-b50be7dfd70d) | ![Resolved Tickets Audit Table](https://github.com/user-attachments/assets/b5295873-d4c5-49da-878a-c9edcec682fd) |
| *Real-time token streaming, active tool status pills & frozen approval alerts.* | *Pending refund cards with 1-click Approve, Reject, and Edit Amount modal.* | *Structured resolution records, sentiment distribution & analytics.* |

</div>

---

## 📖 Background & Problem Statement

Small and Medium Enterprises (SMEs) face immense pressure to deliver fast, empathetic customer service to stay competitive. However, customer inquiries are frequently handled across fragmented phone calls, WhatsApp Business chats, and shared inboxes. During seasonal volume spikes or promotional sales, this manual orchestration quickly becomes unsustainable.

Products and deliveries are never 100% defect-free: transit delays, damaged goods, and warehouse errors inevitably trigger customer frustration. Yet, most growing brands lack the staff to manually review every inquiry.

### The SME Post-Purchase Dilemma
Managing post-purchase logistics—such as tracking questions (**WISMO: "Where Is My Order?"**), return requests, and cancellations—creates severe administrative drag. Support teams often spend **up to 40% of their operational hours** cross-referencing tracking states, checking return eligibility windows, and jumping between payment gateways to issue refunds.

### Why Existing Solutions Fall Short for SMEs

Market leaders rely on enterprise helpdesk platforms and reverse logistics portals:

| Enterprise Platform | Standard Capabilities | SME Adoption Constraint |
|---|---|---|
| **Helpdesks**<br>*(Gorgias, Zendesk)* | Direct order modification inside tickets; multi-channel unified inbox; AI-assisted macro drafts. | **Cost Prohibitive** — $150–$500+/month base fees plus steep per-agent seat licensing and volume spike penalties. |
| **Returns Portals**<br>*(Loop Returns, ReturnGO)* | Self-service return portal; automated label generation; warehouse scanning hooks. | **Platform Lock-in** — Strict Shopify Plus dependencies, high upfront retainers, and mandatory annual commitments. |
| **Workflow Engines**<br>*(Enterprise Zapier, Workato)* | Multi-app syncing, custom data pipelines, enterprise audit trails. | **Complex Setup** — High engineering maintenance, brittle multi-step logic, and slow execution. |

### Lightweight Alternatives & Critical Failure Points
To bypass enterprise software costs, SMEs often resort to basic chat widgets (Crisp, Tidio), unverified web forms, or generic no-code pipelines (Typeform $\rightarrow$ Google Sheets). These tools consistently fail due to:
1. **Zero Validation:** Customers submit unverified order numbers, forcing manual cross-checks.
2. **Hallucinated Math & Policy:** Naive AI chatbots frequently hallucinate discount deductions, return policies, or dollar amounts.
3. **Action Disconnect:** Inquiries get stranded in separate inboxes with no connection to fulfillment or payment systems.
4. **Financial Security Risks:** Autonomous bots with direct payment access risk prompt injection and unauthorized payouts.

---

## 💡 The Solution: Hybrid Agentic Architecture

**AgentDesk** solves this dilemma by coupling a conversational state machine (**LangGraph**) with **deterministic backend logic** and **human-in-the-loop (HITL) financial governance**:

```mermaid
flowchart LR
    A("Customer Input<br/><br/>Chat / Natural Lang<br/>Intent Extraction")
    B("LangGraph Agent<br/><br/>Scoped Tool Execution<br/>No Direct Payment Access")
    C("Deterministic Logic<br/><br/>• Database Validation<br/>• Eligibility & Refund Math<br/>• Idempotency Checking")
    D("Manager Review<br/><br/>Human-in-the-Loop<br/>1-Click Manual Payout")

    A --> B --> C --> D

    style A fill:#ffffff,stroke:#cbd5e1,stroke-width:1.5px,color:#1e293b
    style B fill:#f0fdfa,stroke:#009688,stroke-width:2px,color:#0f766e
    style C fill:#ffffff,stroke:#cbd5e1,stroke-width:1.5px,color:#1e293b
    style D fill:#fff5f5,stroke:#ef4444,stroke-width:2px,color:#b91c1c

    linkStyle 0,1,2 stroke:#0f766e,stroke-width:1.5px
```

### Core Architecture Pillars

1. **Database-Backed Validation:** Agent tools validate customer identity, order existence, items, and billing records directly against PostgreSQL before any action proceeds.
2. **Deterministic Rule Enforcement:** Return eligibility (e.g., delivered date $\le$ 14 days, non-cancellable shipped goods, maximum refund caps) is computed in strict Python code, eliminating AI math errors.
3. **Zero Token Waste (Deterministic Ingestion):** Customer order references (`ORD-\d+`) are regex-extracted and pre-loaded into state before the LLM runs, avoiding unnecessary tool-calling rounds.
4. **Human-In-The-Loop Financial Safety:** The LLM has **zero direct access to payment gateways**. Proposed refunds pause execution via LangGraph's native `interrupt()`, storing the frozen state in PostgreSQL until a manager explicitly approves, rejects, or edits the amount.
5. **Direct Structured Audit Persistence:** The `resolve_ticket` tool accepts typed enum parameters (`category`, `sentiment`, `resolution`, `refund_amount`) and commits records directly to the database without a redundant second LLM extraction pass.

---

## ⚡ Key Features

### 1. Customer Support Chat Interface (`/`)
* **Real-Time Token Streaming:** Server-Sent Events (SSE) stream AI responses token-by-token.
* **Live Tool Status Indicators:** Animated pills notify customers when background tools run (`"Looking up order records..."`, `"Checking refund policy..."`).
* **Interactive Approval Alert:** When a refund is proposed, chat automatically displays an amber status banner while the agent freezes.
* **Session Persistence:** Retains thread state across page reloads via `localStorage` and backend checkpointer history restoration (`GET /chat/{id}`).

### 2. Manager Approvals Dashboard (`/admin/approvals`)
* **Pending Action Cards:** Displays order tags, customer identifiers, purchased items, proposed refund amounts, and the agent's stated justification.
* **1-Click Quick Approve:** Approves the exact proposed amount and automatically resumes the paused agent thread.
* **Amount Adjustment Modal:** Allows managers to edit the final refund payout amount and attach internal manager notes.
* **Rejection Modal:** Declines the request with required justification notes, which the resumed agent communicates to the customer.
* **Real-time KPI Metrics:** Instant calculation of total pending approval count and cumulative financial exposure.

### 3. Resolved Tickets Audit Log (`/admin/tickets`)
* **Structured Analytics Table:** Comprehensive audit trail displaying ticket IDs, customer names, categories, sentiment tags, resolutions, and refund totals.
* **Interactive Filters & Search:** Filter by sentiment (`POSITIVE`, `NEUTRAL`, `NEGATIVE`, `FRUSTRATED`), resolution type, or customer search terms.
* **Executive Metrics Cards:** Real-time satisfaction rate (%) and total dollars refunded.
* **Ticket Detail Inspector:** Modal providing deep inspection into conversation context and timestamps.

---

## 🔄 End-to-End Execution Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer (Chat Screen)
    participant API as FastAPI Backend
    participant Graph as LangGraph Engine
    participant DB as PostgreSQL
    actor Manager as Manager (Dashboard)

    Customer->>API: "I want to cancel order ORD-1003 and get a refund"
    API->>DB: get_or_create_conversation()
    API->>Graph: Execute stream with customer_id & thread_id
    Graph->>Graph: load_order_context (Regex extracts ORD-1003 deterministically)
    Graph->>Graph: tool_calling_llm (Qwen checks policy & decides refund is needed)
    Graph->>Graph: Call issue_refund tool -> triggers interrupt()
    Graph->>DB: Checkpointer serializes paused state (AsyncPostgresSaver)
    API-->>Customer: SSE Event: awaiting_approval (Banner displayed)

    Manager->>API: GET /approvals/pending (Views refund card)
    Manager->>API: POST /approvals/{id}/action (Approve / Reject / Edit)
    API->>DB: Update RefundApproval & Order status
    API->>Graph: Resume paused graph via Command(resume=decision)
    Graph->>Graph: Agent confirms payout to customer
    Graph->>DB: Call resolve_ticket -> Commits structured audit row
    Graph-->>API: Graph completes execution turn
    API-->>Customer: Final confirmation response streamed
```

---

## 🛠️ Tech Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Backend Framework** | **FastAPI** | High-performance async REST API and SSE streaming endpoints. |
| **Agent Orchestration** | **LangGraph**, **LangChain Core** | Stateful agent workflows, conditional branching, checkpointer, and HITL `interrupt()`. |
| **LLM Inference** | **Groq Qwen 3.8-27B** | Low-latency ReAct function calling, intent classification, and conversation summarization. |
| **Persistence & ORM** | **PostgreSQL**, **SQLAlchemy (Async)**, **Alembic** | Relational schemas, migrations, and LangGraph binary state serialization (`AsyncPostgresSaver`). |
| **Frontend Framework** | **React 19**, **Vite** | Modern, fast reactive single-page client interface. |
| **Routing & Navigation** | **React Router v7** | Nested layout routing for customer chat and admin portals. |
| **Styling & Icons** | **Tailwind CSS v4**, **Lucide React** | Clean, responsive design with customized badge tokens and modal components. |

---

## 📁 Repository Structure

```text
project_1/
├── backend/
│   ├── app/
│   │   ├── agent/
│   │   │   ├── graph.py               # StateGraph definition & checkpointer compilation
│   │   │   ├── prompts.py             # System instructions and summarization templates
│   │   │   ├── schemas.py             # Structured TicketResolution Pydantic model
│   │   │   ├── state.py               # SupportState TypedDict
│   │   │   └── tools.py               # check_refund_eligibility, issue_refund, resolve_ticket
│   │   ├── db/
│   │   │   ├── models.py              # SQLAlchemy models (customers, orders, conversations, etc.)
│   │   │   ├── seed.py                # Database seed script with realistic demo scenarios
│   │   │   └── session.py             # Async database engine & session factory
│   │   ├── routers/
│   │   │   ├── approvals.py           # GET /approvals/pending, POST /approvals/{id}/action
│   │   │   ├── chat.py                # POST /chat (SSE stream), GET /chat/{id}
│   │   │   └── tickets.py             # GET /tickets
│   │   ├── config.py                  # Pydantic BaseSettings & environment validation
│   │   └── schemas.py                 # Centralized HTTP request/response models
│   ├── alembic/                       # Database migration versions
│   ├── alembic.ini
│   ├── main.py                        # FastAPI entrypoint, CORS & checkpointer lifespan setup
│   ├── requirements.txt
│   ├── pyproject.toml / uv.lock
│   ├── .env.example
│   └── backend-AGENTS.md
│
├── frontend/
│   ├── src/
│   │   ├── assets/api/
│   │   │   ├── client.js              # REST API client wrapper
│   │   │   └── stream.js              # SSE streaming reader & chunk parser
│   │   ├── components/
│   │   │   ├── ApprovalBanner.jsx     # Amber status banner in chat
│   │   │   ├── ApprovalCard.jsx       # Action card with Approve/Edit/Reject handlers
│   │   │   ├── Badge.jsx              # Status, sentiment, and category badge
│   │   │   ├── EmptyState.jsx         # Clean empty state graphics
│   │   │   ├── MessageBubble.jsx      # Message bubble with copy button & streaming cursor
│   │   │   ├── Modal.jsx              # Reusable modal component
│   │   │   ├── StatCard.jsx           # KPI analytics summary card
│   │   │   └── StatusIndecator.jsx    # Real-time tool execution pill
│   │   ├── hooks/
│   │   │   ├── useApprovals.js        # Approvals data fetching and modal actions hook
│   │   │   └── useTickets.js          # Tickets query, filtering, and metric calculation hook
│   │   ├── layouts/
│   │   │   └── AdminLayout.jsx        # Admin tab shell (/admin/*)
│   │   ├── screens/
│   │   │   ├── Approvals.jsx          # Screen B: Pending refund approvals view
│   │   │   ├── Chat.jsx               # Screen A: Customer support streaming chat
│   │   │   └── Tickets.jsx            # Screen C: Resolved tickets audit table
│   │   ├── utils/
│   │   │   └── formatters.js          # Currency, date, and cent calculation utilities
│   │   ├── App.jsx                    # React Router configuration
│   │   ├── index.css                  # Tailwind v4 import & custom styling
│   │   └── main.jsx
│   ├── package.json / pnpm-lock.yaml
│   ├── vite.config.js
│   ├── .env.example
│   └── frontend-AGENTS.md
│
├── support-agent-architecture.md      # Full architecture specification document
└── todos.md                           # Implementation roadmap & checklist
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
* **Python**: 3.11+ (Python 3.12 recommended)
* **Node.js**: 18+ and `pnpm` (or `npm`)
* **PostgreSQL**: Running locally or on cloud (port `5432`)
* **Groq API Key**: Free API key from [console.groq.com](https://console.groq.com)

---

### 1. Clone the Repository
```bash
git clone https://github.com/DushmanthaHerath1/support-ticket-agent.git
cd support-ticket-agent
```

---

### 2. Backend Setup

Navigate to the `backend` folder and create an environment:

```bash
cd backend

# Using uv (Recommended)
uv sync

# Or using standard python venv
python -m venv .venv
source .venv/bin/activate    # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

#### Configure Environment Variables
Create a `backend/.env` file:
```env
GROQ_API_KEY="your-groq-api-key-here"
DATABASE_URL="postgresql://postgres:password@localhost:5432/support_ticket_agent"
PORT=8000
FRONT_END_URL="http://localhost:5173"
```

#### Run Migrations & Seed Database
```bash
# Apply database migrations
uv run alembic upgrade head

# Seed demo customers and orders
uv run python -m app.db.seed
```

#### Start Backend Server
```bash
uv run uvicorn main:app --reload
```
The FastAPI backend will start at `http://localhost:8000`. Interactive Swagger API docs are available at `http://localhost:8000/docs`.

---

### 3. Frontend Setup

In a new terminal window, navigate to the `frontend` folder:

```bash
cd frontend

# Install dependencies
pnpm install   # or npm install
```

#### Configure Environment Variables
Create a `frontend/.env` file:
```env
VITE_API_BASE_URL="http://localhost:8000"
```

#### Start Frontend Dev Server
```bash
pnpm dev       # or npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Testing the Human-In-The-Loop Flow

The database seed script sets up 4 customers with realistic test cases:

| Customer | Seeded Data & Orders | Test Scenario |
|---|---|---|
| **Alice Johnson** | `ORD-1001` (Headphones, $349.99, PENDING)<br>`ORD-1002` (Mouse, $99.99, DELIVERED) | Inquire about order status or request cancellation on unfulfilled order. |
| **Bob Smith** | `ORD-1003` (Adapter, $19.00, PROCESSING) | **Trigger Refund**: Ask to cancel `ORD-1003`. Watch the agent pause with an approval alert banner. |
| **Charlie Davis** | `ORD-1004` (Monitor, $599.99, SHIPPED) | Ask for refund on a shipped item; agent will review eligibility rules. |
| **Diana Prince** | `ORD-1005` (Keyboard, $149.50, CANCELLED) | Contains a pre-resolved ticket to inspect in the Audit Log view. |

### Walkthrough Steps:
1. Open `http://localhost:5173/` (Customer Chat).
2. Enter: *"Can you please cancel my order ORD-1003 and refund me?"*
3. Watch the assistant look up policy and emit the **"Waiting for manager approval"** banner.
4. Navigate to `http://localhost:5173/admin/approvals`.
5. Review Bob's pending card $\rightarrow$ click **Approve** (or Edit amount).
6. Return to Chat $\rightarrow$ see the agent confirm the refund.
7. Navigate to `http://localhost:5173/admin/tickets` $\rightarrow$ verify the structured audit record logged with positive sentiment and resolution type.

---

## 🔮 Future Implementation & Scalability

Building on this core foundation of LangGraph orchestration and deterministic HITL authorization, the platform is architected to scale into an end-to-end commerce operations suite:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AGENTDESK ROADMAP                               │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Multimodal Returns: Vision LLM inspection for damaged item photos.  │
│ 2. Pre-Fulfillment Self-Service: In-flight address and line-item swaps.│
│ 3. Deep Logistics Telemetry: Live courier webhook sync & predictive    │
│    WISMO transit alerts.                                               │
│ 4. Omnichannel Bridges: WhatsApp Business Cloud API & Instagram DMs.   │
│ 5. Risk Intelligence: Serial returner scoring & LTV decision badges.   │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Post-Fulfillment Returns & Visual Defect Inspection (Multimodal AI)**
   - Allow customers to upload photographs or videos of damaged/defective items directly into chat.
   - A Vision LLM verifies defects, extracts barcodes/serial numbers, and attaches structured visual proof to the manager review card.
   - Propose smart exchanges (alternative sizes/colors) or bonus store credit before defaulting to cash refunds.
   - Generate automated prepaid return shipping labels via carrier API hooks.

2. **Pre-Fulfillment Autonomous Self-Service**
   - In-flight delivery address corrections, phone number updates, or gate delivery notes before packing.
   - Allow line-item swaps (e.g. swap shirt size from M to L) with automatic payment balance adjustments.
   - 1-click autonomous order cancellations for un-packed orders without requiring manager review.

3. **Deep Logistics Sync & Predictive WISMO**
   - Integrate 3rd-party logistics webhooks (DHL, FedEx, regional couriers) for granular transit milestones.
   - Trigger proactive customer notifications if courier tracking stalls, calibrating expectations before customer frustration builds.

4. **Omnichannel Messaging Bridges**
   - Connect the LangGraph state machine to WhatsApp Business Cloud API and Instagram Direct Messages.
   - Maintain cross-channel session persistence using Redis-cached thread states so customers can switch seamlessly from web to mobile messaging.

5. **Risk Assessment & Decision-Support Intelligence**
   - Deterministic risk heuristics that flag serial returners and high dispute rates with warning badges on manager review cards.
   - Display customer lifetime value (LTV) alongside max refundable allowances to speed up manager decision-making.

---

## 👤 Author

**HMT Dushmantha Herath**
* **Email:** [hmt.dushmantha@gmail.com](mailto:hmt.dushmantha@gmail.com)
* **LinkedIn:** [linkedin.com/in/hmt-dushmantha](https://www.linkedin.com/in/hmt-dushmantha)
* **GitHub:** [@DushmanthaHerath1](https://github.com/DushmanthaHerath1)

---

## 📄 License

Copyright © 2026 HMT Dushmantha Herath. All Rights Reserved.
