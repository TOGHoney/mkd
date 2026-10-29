# Architecture Research

**Domain:** Multi-Tenant RAG, Knowledge Ingestion & Embeddable Customer Chat Widget
**Researched:** 2026-10-29
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                              │
├────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────┐  ┌───────────────────────────────┐  │
│  │ Company Admin Dashboard       │  │ Embeddable Chat Widget        │  │
│  │ (React + Tailwind + Vite)     │  │ (Vanilla JS + Shadow DOM)     │  │
│  └───────────────┬───────────────┘  └───────────────┬───────────────┘  │
│                  │                                  │                  │
├──────────────────┼──────────────────────────────────┼──────────────────┤
│                  ▼                                  ▼                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     CONTROL BACKEND (Node.js)                    │  │
│  │  - Express REST API / JSON Web Tokens & Tenant Verification      │  │
│  │  - Origin & Referer Whitelist Checker / Redis Rate Limiter       │  │
│  │  - BullMQ Job Dispatcher & SSE Progress Broadcaster              │  │
│  │  - Conversation Session Persistence & Analytics                  │  │
│  └──────────────────┬───────────────────────────────▲───────────────┘  │
│                     │ Ingestion Job                 │ Status / Progress │
│                     ▼                               │                   │
│         ┌───────────────────────┐                   │                   │
│         │ Redis Broker (BullMQ) ├───────────────────┘                   │
│         └───────────┬───────────┘                                       │
├─────────────────────┼──────────────────────────────────────────────────┤
│                     ▼ Proxy RAG Query / Ingestion Worker               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │               AI & DATA PROCESSING SERVICE (FastAPI)             │  │
│  │  - Ingestion Worker: Playwright/Crawl4AI, BeautifulSoup4, PDFs   │  │
│  │  - Chunking Engine: Recursive Text & Code AST chunking           │  │
│  │  - FastEmbed: Local ONNX embedding generation (bge-small-en)     │  │
│  │  - Vector Controller: Qdrant payload-filtered upsert & query     │  │
│  │  - RAG Controller: Context assembly, citations, Groq streaming  │  │
│  └──────────────────┬───────────────────────────────┬───────────────┘  │
├─────────────────────┼───────────────────────────────┼──────────────────┤
│                     ▼                               ▼                  │
│       ┌───────────────────────────┐   ┌───────────────────────────┐    │
│       │ Qdrant Vector DB          │   │ MongoDB Atlas             │    │
│       │ - Multi-tenant vectors    │   │ - Users, Workspaces, Jobs │    │
│       │ - HNSW index (Cosine)     │   │ - Source metadata, Logs   │    │
│       └───────────────────────────┘   └───────────────────────────┘    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Recommended Monorepo Structure

```
inno-2.0/
├── backend-node/                 # Control Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/              # MongoDB, Redis, JWT, environment configs
│   │   ├── controllers/         # Auth, workspace, source, widget, chat controllers
│   │   ├── middlewares/         # auth.js, rateLimiter.js, domainWhitelist.js
│   │   ├── models/              # User, Workspace, Source, IngestionJob, ChatSession
│   │   ├── queues/              # BullMQ queue definitions and event listeners
│   │   ├── routes/              # /api/v1/auth, /workspaces, /sources, /widget
│   │   └── server.js            # Express entry point
│   └── package.json
│
├── ai-fastapi/                   # AI & Data Engine (Python + FastAPI)
│   ├── app/
│   │   ├── api/                 # /ingest, /rag/query, /health endpoints
│   │   ├── core/                # Settings, Qdrant client, Groq client
│   │   ├── crawlers/            # WebCrawler (Playwright/BS4), PDFExtractor
│   │   ├── services/
│   │   │   ├── chunking.py      # Recursive & AST chunkers
│   │   │   ├── embedding.py     # FastEmbed bge-small ONNX runner
│   │   │   ├── qdrant_service.py# Vector upsert, tenant search, deletion
│   │   │   ├── rag_service.py   # Context ranking, Groq Llama 3.3 prompt & stream
│   │   │   └── sync_service.py  # Content hashing & diff updater
│   │   ├── workers/             # Background task runner consuming BullMQ/Redis
│   │   └── main.py              # FastAPI entry point
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend-dashboard/           # Company Admin Portal (React + Tailwind + Vite)
│   ├── src/
│   │   ├── components/          # Sidebar, Navbar, SourceCard, JobProgress, Modal
│   │   ├── pages/               # Login, Workspaces, Sources, WidgetCustomizer, Analytics
│   │   ├── services/            # Axios API clients
│   │   ├── context/             # AuthContext, WorkspaceContext
│   │   └── App.jsx
│   ├── vite.config.js
│   └── package.json
│
├── widget/                       # Embeddable Chatbot Widget
│   ├── src/
│   │   ├── widget.js            # Custom Web Component with Shadow DOM
│   │   ├── styles.css           # Injected CSS styles scoped to Shadow DOM
│   │   └── api.js               # SSE client connecting to /api/v1/widget/chat
│   ├── vite.config.js           # Build into dist/widget.js (IIFE bundle)
│   └── package.json
│
└── .planning/                    # GSD Planning & Architecture specifications
```

---

## Architectural Patterns

### Pattern 1: Tenant-Isolated Payload Filtering in Qdrant
**What:** Rather than spinning up a new collection for every tenant (which causes massive cluster overhead), all chunks live in a unified collection (`company_memories`), tagged with `workspace_id`.
**Why:** Qdrant's payload index allows instantaneous index-level filtering before cosine calculation.
```python
search_result = qdrant_client.search(
    collection_name="company_memories",
    query_vector=query_embedding,
    query_filter=models.Filter(
        must=[
            models.FieldCondition(
                key="workspace_id",
                match=models.MatchValue(value=workspace_id)
            )
        ]
    ),
    limit=5
)
```

### Pattern 2: Shadow DOM Encapsulation for Embeddable Widget
**What:** The widget mounts inside a custom Web Component with an isolated Shadow Root (`element.attachShadow({ mode: 'open' })`).
**Why:** Zero CSS leakage. A host website using global CSS overrides (e.g., `* { margin: 0; font-family: Comic Sans; }`) will not alter the widget layout or fonts.
```javascript
class SuperMemoryWidget extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = WIDGET_SCOPED_CSS;
    const container = document.createElement('div');
    container.className = 'sm-widget-root';
    shadow.appendChild(style);
    shadow.appendChild(container);
  }
}
customElements.define('supermemory-chat', SuperMemoryWidget);
```

### Pattern 3: Asynchronous Ingestion with BullMQ
**What:** Ingestion requests immediately return HTTP 202 Accepted with a `job_id`, delegating crawling and vectorization to background workers.
**Why:** Crawling a 20-page documentation site takes 30–60 seconds; running synchronously in HTTP would cause browser timeouts.

---

## Data Flow

### 1. Ingestion Flow
```
Dashboard -> POST /api/sources -> Node Express (Validate & Save Source to MongoDB)
                                      ↓
                                BullMQ Queue (Push job: { workspace_id, url })
                                      ↓
                                FastAPI Worker (Pulls job from Redis)
                                      ↓
                                Headless Crawler (Extracts HTML -> Clean Markdown)
                                      ↓
                                Chunking Engine (Recursive character splitting)
                                      ↓
                                FastEmbed (Generates 384-d vectors locally)
                                      ↓
                                Qdrant (Upsert vectors with workspace_id payload)
                                      ↓
                                MongoDB (Update job status: COMPLETED)
```

### 2. Chat Request Flow
```
Visitor on Host Website -> Types Question -> Widget (Shadow DOM)
                                                  ↓
                                  POST /api/v1/widget/chat (with widget_key)
                                                  ↓
                                Node Backend:
                                 - Check Origin against allowed_domains
                                 - Rate limit visitor IP via Redis
                                 - Fetch workspace config
                                                  ↓
                                FastAPI /rag/query:
                                 - FastEmbed query text
                                 - Qdrant top-k search (filtered by workspace_id)
                                 - Assemble prompt with citations
                                 - Call Groq Llama 3.3 70B (streaming)
                                                  ↓
                                Node Backend proxies SSE stream -> Widget typewriter UI
                                                  ↓
                                Node logs conversation and latency to MongoDB
```
