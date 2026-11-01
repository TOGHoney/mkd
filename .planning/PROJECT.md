
# SuperMemory AI (InnoBrain RAG)

## What This Is

SuperMemory AI is an end-to-end, multi-tenant enterprise knowledge platform that ingests, cleans, chunks, and indexes a company's scattered knowledge—websites, live documentation, PDFs, GitHub repositories, and custom FAQs—into a private, continuously updated vector memory in Qdrant. The platform exposes this private memory through an embeddable, lightweight, Shadow DOM-isolated JavaScript chatbot widget that companies embed on their websites to provide grounded, citation-backed customer support and helpdesk automation.

## Core Value

Turn any company's heterogeneous, dynamic documentation into an accurate, hallucination-free, self-updating vector memory that securely answers visitor questions with verified citations through an embeddable widget.

## Business Context

- **Customer**: B2B companies, SaaS founders, documentation maintainers, and e-commerce stores needing automated, 24/7 grounded support.
- **Revenue model**: Tiered subscription (based on active workspaces, ingested page limits, re-crawl frequency, and chat query volume).
- **Success metric**: Retrieval accuracy (>95% citation relevance), sub-1.5s chat response latency, zero cross-tenant data leakage.
- **Strategy notes**: Multi-tenant isolation at database and vector level; zero-friction widget deployment via single `<script>` tag.

---

## Complete System Architecture & Technical Specifications

```
                              ┌──────────────────────────────────────────────┐
                              │            COMPANY / ADMIN DASHBOARD         │
                              │          (React + Tailwind + Vite)           │
                              └──────────────────────┬───────────────────────┘
                                                     │ REST API / Auth
                                                     ▼
┌───────────────────────────┐      ┌─────────────────────────────────────────┐
│     END-USER WEBSITE      │      │          CONTROL BACKEND                │
│ ┌───────────────────────┐ │      │     (Node.js + Express + MongoDB)       │
│ │ Embeddable Widget     │◀├──────┤  - Auth, Tenants & Workspace Mgmt       │
│ │ (Vanilla JS/ShadowDOM)│ │ REST │  - Widget Keys & Origin Validation      │
│ └───────────┬───────────┘ │ /SSE │  - Ingestion Job Dispatch (BullMQ)      │
└─────────────┼─────────────┘      │  - Conversation Logs & Analytics        │
              │ Chat Query         └──────┬───────────────────────▲──────────┘
              ▼                           │ Push Job              │ Job Status
   ┌──────────────────────┐               ▼                       │
   │  Widget Chat Gateway │       ┌───────────────┐               │
   │  (Node.js /api/chat) ├──────▶│ Redis / BullMQ│───────────────┤
   └──────────┬───────────┘       └───────┬───────┘               │
              │ Proxy Request             │ Ingestion Job         │
              ▼                           ▼                       │
┌─────────────────────────────────────────────────────────────────┴──────────┐
│                      AI & DATA PROCESSING SERVICE                          │
│                           (Python + FastAPI)                               │
│                                                                            │
│  [INGESTION PIPELINE]                       [RAG & CHAT PIPELINE]          │
│   1. Crawlers & Extractors                   1. Query Embedding (FastEmbed)│
│      - Web (Crawl4AI/Playwright/BS4)         2. Tenant-Filtered Search     │
│      - PDFs (PyMuPDF / pdfplumber)           3. Context Assembly & Prompt  │
│      - GitHub (Tree-sitter AST & APIs)       4. Streaming Groq LLM (Llama) │
│   2. Cleaning & Normalization                5. Citation Formatting        │
│   3. Semantic & AST Chunking                                               │
│   4. FastEmbed Local Vectors                                               │
│   5. Sync Engine & Hash Diffing                                            │
└───────────────────────┬─────────────────────────────┬──────────────────────┘
                        │                             │
                        ▼                             ▼
         ┌─────────────────────────────┐   ┌──────────────────────────┐
         │     QDRANT VECTOR DB        │   │        GROQ CLOUD        │
         │  - Tenant-isolated vectors  │   │  - Llama 3.3 70B / 8B    │
         │  - HNSW index + Cosine dist │   │  - Ultra-low latency API │
         └─────────────────────────────┘   └──────────────────────────┘
```

### 1. Data Ingestion & Extraction Architecture

The system supports four distinct ingestion adapters in the Python FastAPI engine:

1. **Website & Documentation Crawling Engine:**
   - **Crawling Mechanism**: Uses `crawl4ai` and `Playwright` for headless browser automation (rendering dynamic client-side SPA documentation like React, Vue, Docusaurus, Nextra) with fallback to `httpx` + `BeautifulSoup4` for static web pages.
   - **Sitemap Traversal**: Automatically parses `/sitemap.xml` and `robots.txt` to discover canonical URLs and respect crawl permissions.
   - **Boilerplate Removal**: Extracts meaningful content using heuristic cleaning (removing `<nav>`, `<header>`, `<footer>`, `<script>`, `<style>`, ads, cookie banners, tracking pixels).
   - **Markdown Conversion**: Converts clean HTML into structured Markdown with preserved headers (`#`, `##`, `###`), lists, code fences, and anchor links.

2. **PDF & Document Processing Pipeline:**
   - **Text Extraction**: Uses `PyMuPDF` (`fitz`) and `pdfplumber` to extract high-fidelity text with page-number tracking.
   - **Table & Layout Preservation**: Extracts tables into Markdown table syntax to preserve tabular relationships.
   - **Heading Detection**: Heuristically infers structural hierarchy based on font sizes, weights, and margins.

3. **GitHub Repository Extractor:**
   - **Repository Traversal**: Fetches repository contents using GitHub REST API / clone.
   - **Filter Rules**: Includes code files (`.ts`, `.js`, `.py`, `.go`, `.rs`, `.java`, `.cpp`, `.md`, `.json`), ignoring build artifacts (`node_modules/`, `dist/`, `.git/`, binary files, lockfiles).
   - **Code Structure Extraction**: Extracts module descriptions, class docstrings, function signatures, and exported interfaces.

4. **Manual Knowledge & FAQs:**
   - Direct JSON/Markdown entry through the dashboard for company-specific policies, custom QA pairs, and immediate business updates.

---

### 2. Chunking & Pre-Processing Strategies

Raw documents cannot be fed directly to embedding models without losing granular semantic context. The ingestion engine applies tailored chunking strategies:

1. **Hierarchical Recursive Text Chunking (Web Pages, Docs, PDFs):**
   - **Separators**: Cascading splits: `["\n\n", "\n", ". ", "? ", "! ", " ", ""]`.
   - **Chunk Size**: Target 500–800 tokens (~2,000–3,200 characters).
   - **Overlap**: 100–150 tokens (~400–600 characters) sliding window to prevent splitting concepts across boundaries.
   - **Metadata Injection**: Each chunk is prepended with parent metadata context:
     ```
     [Document: {title} | Source: {url} | Section: {heading_path}]
     {chunk_content}
     ```

2. **Code-Aware AST Chunking (GitHub Repositories):**
   - Rather than splitting mid-statement, uses language grammar or `tree-sitter` to parse code into discrete abstract syntax nodes (functions, classes, interfaces).
   - Small helper functions within a single file are clustered together to form a cohesive 500-token block.
   - Each chunk retains the file path, package/import context, and enclosing class/module name.

3. **Structured Q&A Chunking (FAQs):**
   - Keeps question and answer pairs together as an atomic unit.
   - Chunk format: `Question: {question}\nAnswer: {answer}` with direct deep-link reference.

4. **Deduplication & Content Hashing:**
   - Computes SHA-256 hash of raw extracted text per page/document (`doc_hash`).
   - Computes SHA-256 hash of individual chunks (`chunk_hash`).
   - Prevents duplicate embeddings and identifies exact matches during re-sync.

---

### 3. Embedding & Vector Storage Pipeline

1. **Embedding Generation Engine:**
   - **Engine**: Local embedding generation via `FastEmbed` (`BAAI/bge-small-en-v1.5` or `all-MiniLM-L6-v2`) in Python FastAPI.
   - **Performance**: Runs locally on CPU/GPU without external API calls, achieving sub-10ms per chunk embedding and zero API cost.
   - **Dimensionality**: 384 dimensions (for `bge-small-en-v1.5`), offering state-of-the-art retrieval accuracy on MTEB benchmarks.

2. **Qdrant Vector Database Architecture:**
   - **Collection Strategy**: Single shared multi-tenant collection `company_memories` with payload indexing, or isolated collections per workspace.
   - **HNSW Indexing**: Configured with Cosine distance metric for high-speed similarity search.
   - **Payload Schema**:
     ```json
     {
       "workspace_id": "ws_12345",
       "source_id": "src_web_987",
       "document_id": "doc_555",
       "chunk_id": "chk_001",
       "chunk_index": 0,
       "title": "Refund and Return Policy",
       "source_url": "https://example.com/refunds",
       "source_type": "website",
       "heading_path": "Refunds > 30-Day Window",
       "text": "[Document: Refund Policy] ...",
       "content_hash": "a8f3b...",
       "created_at": "2026-10-29T15:00:00Z",
       "updated_at": "2026-10-29T15:00:00Z"
     }
     ```
   - **Tenant Isolation**: Mandatory payload filter in every Qdrant query:
     ```python
     Filter(must=[FieldCondition(key="workspace_id", match=MatchValue(value=workspace_id))])
     ```
     Guarantees that no query can retrieve cross-tenant records under any circumstance.

---

### 4. Continuous Sync & Self-Updating Engine

1. **Incremental Refresh Cycle:**
   - BullMQ / Node scheduler pushes periodic re-crawl jobs into Redis for active sources (e.g. daily, weekly, or on-demand).
2. **Hash Comparison:**
   - The crawler re-fetches the page and computes the SHA-256 hash of the content.
   - If `new_hash == existing_doc_hash`: mark source fresh in MongoDB, skip chunking/re-embedding (0 vector writes).
3. **Diff-Based Upsert & Purge:**
   - If content changed:
     - Generate new chunks and their respective chunk hashes.
     - Match new chunks against stored chunk hashes.
     - Upsert only modified or new chunks into Qdrant.
     - Delete orphaned chunks whose IDs no longer exist in the new document structure.
4. **Link Health & Stale Page Detector:**
   - Identifies HTTP 404 or redirected pages during re-crawl.
   - Flags dead sources in the dashboard and purges associated vector points to eliminate hallucinated legacy links.

---

### 5. Control Backend & Security Architecture (Node.js + Express + MongoDB)

1. **Authentication & Multi-Tenancy:**
   - Workspace creation with member roles (Owner, Admin, Viewer).
   - Unique API keys and `widget_key` generated per workspace.
2. **Security & Embedding Widget Protection:**
   - **Origin & Referer Whitelisting**: Node backend checks incoming widget requests against the workspace's configured `allowed_domains` (e.g., `https://mycompany.com`).
   - **Rate Limiting**: Redis-backed sliding window rate limiter per visitor IP and session to prevent abuse.
   - **Secret Isolation**: Widget keys are strictly scoped public tokens with read-only query permissions to the public chat endpoint.
3. **Asynchronous Job Management (BullMQ + Redis):**
   - Ingestion jobs pushed to `ingestion-queue`.
   - Node returns an immediate `202 Accepted` with a `job_id`.
   - Python worker consumes the job, reports real-time progress (Crawling -> Parsing -> Chunking -> Indexing -> Complete) back to Redis/MongoDB.
4. **Analytics & Observability:**
   - MongoDB tracks every session: `conversation_id`, visitor query, retrieved chunks, response latency, token count, and user feedback (thumbs up / down).

---

### 6. Retrieval-Augmented Generation (RAG) & Chat Pipeline

1. **Chat Request Flow:**
   - Visitor sends message from embeddable widget.
   - Widget calls Node endpoint `POST /api/v1/widget/chat` with `widget_key` and message payload.
   - Node validates domain, checks rate limit, logs session, and proxies to FastAPI `POST /rag/query`.
2. **Vector Retrieval in FastAPI:**
   - Converts visitor query into 384-d vector using `FastEmbed`.
   - Queries Qdrant with `workspace_id` filter, retrieving Top-K (K=4 to 6) most relevant chunks.
   - Scores chunks with cosine similarity threshold (e.g. `score >= 0.65`).
3. **LLM Generation via Groq:**
   - Assembles grounded prompt containing retrieved contexts with source citations.
   - Calls Groq API (`llama-3.3-70b-versatile` or `llama-3.1-8b-instant`) with strict system instructions:
     - "Answer strictly using the provided context."
     - "If the answer is not contained in the context, explicitly inform the visitor and suggest contacting human support."
     - "Include markdown links to source URLs where the information was found."
   - Streams LLM response tokens back to Node via Server-Sent Events (SSE), which streams to the widget for instant typewriter rendering.

---

### 7. Client Layer & Embeddable Widget

1. **Company Dashboard (React + Tailwind + Vite):**
   - Workspace settings & domain whitelisting.
   - Source Management: Add/edit website URLs, upload PDFs, connect GitHub repositories, write FAQs.
   - Live Ingestion Progress: Step-by-step progress bars and log inspection.
   - Widget Customizer: Real-time preview of chat bubble position, brand primary/secondary colors, chatbot name, avatar, greeting message, and suggested starter prompts.
   - Embed Code Modal: Copy-pasteable `<script>` snippet.
   - Analytics Tab: Total conversations, popular queries, satisfaction rating, unanswered questions.

2. **Embeddable Chat Widget (Vanilla JS + Shadow DOM):**
   - Lightweight standalone script `<script src="https://cdn.supermemory.ai/widget.js" data-key="wk_live_xxx"></script>`.
   - **Shadow DOM Encapsulation**: Uses `element.attachShadow({ mode: 'open' })` to guarantee that the hosting website's CSS styles (Bootstrap, Tailwind, custom stylesheets) never bleed into or break the chatbot UI.
   - Smooth floating launcher badge with unread indicator.
   - Streaming markdown renderer with clickable source citations.
   - Session storage persistence so visitor conversations survive page navigation.

---

## Requirements

### Validated (v1.0 Shipped)

- [x] Multi-tenant workspace management and API/Widget key generation in Node.js + MongoDB.
- [x] Domain whitelist validation and rate-limiting middleware for public widget endpoints.
- [x] BullMQ + Redis job queue for asynchronous source ingestion.
- [x] Python FastAPI web crawler using Crawl4AI / Playwright + BeautifulSoup4 with markdown conversion.
- [x] Recursive hierarchical text chunker with heading and URL metadata preservation.
- [x] Local FastEmbed embedding generation (`bge-small-en-v1.5`) and Qdrant vector storage with payload filtering.
- [x] Qdrant vector search with strict `workspace_id` isolation and similarity score filtering.
- [x] Groq LLM integration (Llama 3.3 70B) with streaming response and citation extraction.
- [x] Standalone Vanilla JS embeddable chat widget with Shadow DOM encapsulation and SSE streaming (<24KB).
- [x] React + Tailwind company dashboard with workspace setup, source connectors, crawler monitor, live widget customizer, and conversation analytics.

### Active (v2.0 Milestone Candidates)

- [ ] Hash-based continuous sync engine for scheduled change detection and diff-based chunk updates/purges.
- [ ] Native PDF extraction with PyMuPDF and GitHub repository code chunking.
- [ ] Visitor feedback collection (thumbs up/down) and prompt injection guardrails.

### Out of Scope

- Native mobile SDKs (iOS/Android) — widget is web-first for MVP.
- Paid billing integration (Stripe) — deferred to v2.0 post-core validation.
- Live human agent handover (Zendesk/Intercom integration) — planned for future enterprise milestone.
- Full git commit webhook listening for instant push updates — periodic scheduled sync covers MVP.

---

## Context

- **Target Deployment**: Clean monorepo structure containing `/frontend-dashboard`, `/widget`, `/backend-node`, and `/ai-fastapi`.
- **Primary Dependencies**: Node.js/Express, MongoDB Atlas, Redis, Python 3.11+, FastAPI, FastEmbed, Qdrant (local Docker or Cloud), Groq Cloud API, React, Tailwind CSS.
- **Operating Environment**: Local development on Windows with Node v24.21.0 and Python.

## Constraints

- **Security**: Strict tenant isolation across all layers — no visitor query may access data outside its assigned `workspace_id`.
- **Performance**: Chatbot time-to-first-token must be under 1.5 seconds using Groq streaming.
- **Widget Footprint**: Embeddable widget script must be lightweight (<50KB), zero-dependency, and isolated via Shadow DOM.
- **Cost**: Local FastEmbed embeddings eliminate ongoing vector embedding API fees.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Qdrant for Vector Database | High performance, native payload filtering by `workspace_id`, Docker & cloud readiness | ✓ Shipped in v1.0 |
| Groq Cloud + FastEmbed | Blazing fast LLM inference (Llama 3.3) paired with zero-cost local CPU embeddings | ✓ Shipped in v1.0 |
| Clean Monorepo Layout | Unified code management for dashboard, widget, Node backend, and Python AI engine | ✓ Shipped in v1.0 |
| Shadow DOM for Chat Widget | Prevents host website CSS from conflicting with or breaking the embeddable chat UI | ✓ Shipped in v1.0 |
| Split Backend (Node + Python) | Node handles secure business logic, auth, queues; Python handles heavy AI/crawling/RAG | ✓ Shipped in v1.0 |

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-29 after initialization*
