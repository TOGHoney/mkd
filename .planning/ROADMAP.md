# Roadmap: SuperMemory AI (InnoBrain RAG)

## Overview

SuperMemory AI transforms scattered company knowledge into an embeddable, private RAG chatbot widget. This roadmap executes the v1.0 MVP across five structured, cohesive phases: beginning with the core data ingestion and local vector pipeline (Phase 1), followed by the grounded streaming RAG engine (Phase 2), the multi-tenant control backend with BullMQ job queuing (Phase 3), the Shadow DOM embeddable JavaScript chat widget (Phase 4), and concluding with the React admin dashboard and widget customizer (Phase 5).

---

## Phases

- [x] **Phase 1: Ingestion & Vector Storage Pipeline** - Python FastAPI crawler, recursive chunker, FastEmbed embeddings, and tenant-isolated Qdrant vector storage.
- [x] **Phase 2: Semantic RAG & Streaming Generation** - Tenant-filtered Qdrant retrieval, grounded context assembly, Groq Llama 3.3 streaming, and verified source citations.
- [ ] **Phase 3: Control Backend & Ingestion Job Queue** - Node.js Express server, MongoDB Atlas models, BullMQ Redis queue, domain whitelisting, and rate-limiting.
- [ ] **Phase 4: Embeddable Chat Widget** - Standalone Vanilla JS Web Component with Shadow DOM encapsulation, typewriter streaming, and citation links.
- [ ] **Phase 5: Company Admin Dashboard** - React + Tailwind dashboard for source management, crawler monitoring, live widget customization, and embed snippet distribution.

---

## Phase Details

### Phase 1: Ingestion & Vector Storage Pipeline
**Goal**: Establish the Python FastAPI ingestion service, crawl websites/sitemaps into clean Markdown, chunk with metadata preservation, compute local FastEmbed embeddings, and store vectors with indexed `workspace_id` in Qdrant.
**Depends on**: Nothing (first phase)
**Requirements**: INGEST-01, INGEST-02, INGEST-03, INGEST-04, EMBED-01, EMBED-02, EMBED-03, EMBED-04, VECT-01, VECT-02, VECT-03
**Success Criteria** (what must be TRUE):
  1. Python FastAPI service boots and initializes a connection to Qdrant vector database.
  2. Inputting a website URL crawls pages (including dynamic SPAs) up to depth limit, strips boilerplate, and outputs clean Markdown with document hashes.
  3. Text is recursively chunked (500–800 tokens, 100-token overlap) with prepended document title, URL, and section breadcrumbs.
  4. Local FastEmbed model (`bge-small-en-v1.5`) generates 384-d vectors and upserts them to Qdrant with `workspace_id` indexed for tenant isolation.
**Plans**: 3 plans

Plans:
- [x] 01-01: FastAPI service scaffolding, Qdrant client connection, and `company_memories` collection schema with indexed `workspace_id`.
- [x] 01-02: Web crawling pipeline (Playwright/Crawl4AI + BeautifulSoup4), sitemap traversal, boilerplate stripper, and markdown conversion.
- [x] 01-03: Recursive hierarchical text chunker with metadata injection, FastEmbed ONNX runner, and batch Qdrant point upsert API.

---

### Phase 2: Semantic RAG & Streaming Generation
**Goal**: Implement the semantic retrieval and LLM generation pipeline using Qdrant vector search and Groq Cloud Llama 3.3 70B streaming.
**Depends on**: Phase 1
**Requirements**: RAG-01, RAG-02, RAG-03, RAG-04
**Success Criteria** (what must be TRUE):
  1. Vector search strictly enforces `workspace_id` payload match, mathematically preventing cross-tenant leakage.
  2. Top-k (4–6) relevant chunks are retrieved with cosine similarity score thresholding.
  3. LLM prompt assembles retrieved context and system rules that enforce zero-hallucination and source citation.
  4. Groq Llama 3.3 70B streams tokens via Server-Sent Events (SSE) with sub-1.5s time-to-first-token and clickable source URLs.
**Plans**: 2 plans

Plans:
- [x] 02-01: Vector search service in FastAPI with strict `workspace_id` filter, similarity score thresholding, and context ranking.
- [x] 02-02: Groq SDK integration, grounded system prompt construction, citation extractor, and SSE streaming chat endpoint (`/rag/query`).

---

### Phase 3: Control Backend & Ingestion Job Queue
**Goal**: Build the Node.js + Express control backend with MongoDB schemas, BullMQ Redis background job queue for async ingestion, and secured public chat gateway.
**Depends on**: Phase 1, Phase 2
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, QUEUE-01, QUEUE-02, QUEUE-03, QUEUE-04
**Success Criteria** (what must be TRUE):
  1. Admin can register/login with JWT; default workspace, API key, and `widget_key` are generated automatically.
  2. Submitting a website URL pushes an ingestion job to BullMQ and immediately returns HTTP 202 with `job_id`.
  3. BullMQ worker orchestrates crawl execution in FastAPI and updates job status in MongoDB with real-time SSE progress.
  4. Public chat gateway validates `widget_key`, checks `Origin` against `allowed_domains`, enforces Redis rate-limiting, and proxies queries to FastAPI.
**Plans**: 3 plans

Plans:
- [ ] 03-01: Express backend setup, MongoDB connection, JWT auth, and User/Workspace/Source models with widget key generation.
- [ ] 03-02: BullMQ queue and Redis worker integration for async ingestion jobs with status polling/SSE endpoints.
- [ ] 03-03: Public widget gateway endpoint with origin domain whitelisting, Redis sliding-window rate limiter, and conversation logging.

---

### Phase 4: Embeddable Chat Widget
**Goal**: Develop the lightweight, zero-dependency embeddable chat widget packaged as a Web Component with Shadow DOM styling, streaming markdown renderer, and clickable citations.
**Depends on**: Phase 2, Phase 3
**Requirements**: WIDG-01, WIDG-02, WIDG-03, WIDG-04, WIDG-05
**Success Criteria** (what must be TRUE):
  1. Widget compiles into a single, lightweight (<40KB) `widget.js` script tag.
  2. Encapsulation inside Shadow DOM guarantees host website CSS frameworks never alter or break widget appearance.
  3. Floating launcher button toggles a responsive chat dialog with customizable brand theme colors and avatar.
  4. User messages stream LLM responses in real-time with markdown formatting and clickable source badges.
**Plans**: 2 plans

Plans:
- [ ] 04-01: Custom Web Component architecture, Shadow DOM encapsulation, responsive chat window layout, and theme customization.
- [ ] 04-02: SSE streaming client integration, typewriter message renderer, source citation badge component, and standalone bundle build.

---

### Phase 5: Company Admin Dashboard
**Goal**: Build the React + Tailwind company management portal where admins manage sources, monitor crawler jobs, customize the widget in real-time, copy the embed snippet, and view conversation logs.
**Depends on**: Phase 3, Phase 4
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05
**Success Criteria** (what must be TRUE):
  1. Admin can log in, switch workspaces, and view API / widget keys.
  2. Admin can add website sources and observe real-time crawler progress bars.
  3. Interactive Widget Customizer provides live preview of chat bubble position, colors, bot name, and greeting.
  4. Embed Code Modal provides a one-click copyable `<script>` snippet.
  5. Conversation Logs table displays recent questions, assistant answers, retrieved sources, and latency metrics.
**Plans**: 3 plans

Plans:
- [ ] 05-01: React + Vite + Tailwind scaffolding, auth context, layout, workspace settings, and API key management.
- [ ] 05-02: Sources management view with URL crawler submission form, active status badges, and real-time progress monitor.
- [ ] 05-03: Interactive Widget Customizer with live preview, one-click embed snippet modal, and conversation logs table.

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Ingestion & Vector Storage Pipeline | 3/3 | Complete | 2026-10-29 |
| 2. Semantic RAG & Streaming Generation | 2/2 | Complete | 2026-10-29 |
| 3. Control Backend & Ingestion Job Queue | 0/3 | Not started | - |
| 4. Embeddable Chat Widget | 0/2 | Not started | - |
| 5. Company Admin Dashboard | 0/3 | Not started | - |

---
*Roadmap updated: 2026-10-29*
*Next step: `/gsd-execute-phase 3`*
