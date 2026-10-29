# Requirements: SuperMemory AI (InnoBrain RAG)

**Defined:** 2026-10-29
**Core Value:** Turn any company's heterogeneous, dynamic documentation into an accurate, hallucination-free, self-updating vector memory that securely answers visitor questions with verified citations through an embeddable widget.

---

## v1 Requirements

### 1. Multi-Tenancy & Authentication
- [x] **AUTH-01**: Company admin can register an account, log in with JWT authentication, and manage sessions.
- [x] **AUTH-02**: System automatically provisions a default `workspace_id` and unique `widget_key` upon workspace creation.
- [x] **AUTH-03**: Backend generates scoped public widget tokens with domain-origin whitelist enforcement.
- [x] **AUTH-04**: System validates that API queries reject any cross-tenant data requests.

### 2. Web Ingestion & Crawling Engine
- [x] **INGEST-01**: Crawler discovers and traverses URLs from a base website URL or sitemap up to configured depth limits (max depth 3, max 50 pages).
- [x] **INGEST-02**: Ingestion pipeline strips HTML boilerplates (navbars, footers, scripts, ads) using Trafilatura / BeautifulSoup4 and converts content into clean Markdown.
- [x] **INGEST-03**: Crawler handles dynamic JavaScript SPAs using Playwright/Crawl4AI headless rendering.
- [x] **INGEST-04**: Crawler computes and persists document-level SHA-256 hashes for deduplication.

### 3. Chunking & Embeddings Pipeline
- [x] **EMBED-01**: Chunker splits extracted Markdown using hierarchical recursive character splitting (target 500–800 tokens, 100-token overlap).
- [x] **EMBED-02**: Each chunk is prepended with contextual metadata (Document Title, Source URL, Heading Path).
- [x] **EMBED-03**: FastEmbed generates 384-dimensional dense vector embeddings locally using `bge-small-en-v1.5` with ONNX Runtime.
- [x] **EMBED-04**: Chunker computes unique chunk-level hashes for granular change detection.

### 4. Qdrant Vector Storage & Isolation
- [x] **VECT-01**: System initializes `company_memories` collection in Qdrant with Cosine distance and HNSW indexing.
- [x] **VECT-02**: Payload schema stores `workspace_id`, `source_id`, `document_id`, `chunk_id`, `source_url`, `title`, and `text`.
- [x] **VECT-03**: `workspace_id` is indexed as a keyword field in Qdrant; every vector query enforces a strict payload match filter.

### 5. RAG Retrieval & Groq LLM Generation
- [x] **RAG-01**: User query is embedded via FastEmbed and matched against Qdrant top-k (K=4–6) vectors with cosine similarity thresholding (>= 0.65).
- [x] **RAG-02**: Prompt builder constructs grounded context including document titles and source URLs, instructing the LLM to avoid speculation.
- [x] **RAG-03**: Groq Llama 3.3 70B Versatile streams grounded responses with sub-1.5s time-to-first-token.
- [x] **RAG-04**: Response includes markdown links to cited source URLs used to answer the question.

### 6. Control Backend & Job Queue
- [x] **QUEUE-01**: Adding a source enqueues an ingestion job in BullMQ + Redis and immediately returns an HTTP 202 with `job_id`.
- [x] **QUEUE-02**: BullMQ worker dispatches crawling tasks to FastAPI and tracks job lifecycle (Pending, Crawling, Indexing, Done, Failed).
- [x] **QUEUE-03**: Backend provides an SSE or polling endpoint for real-time ingestion progress updates in the dashboard.
- [x] **QUEUE-04**: Chat gateway endpoint verifies `widget_key`, validates `Origin` against `allowed_domains`, and applies Redis sliding-window rate limiting.

### 7. Embeddable Chat Widget (Vanilla JS + Shadow DOM)
- [ ] **WIDG-01**: Zero-dependency standalone JavaScript bundle (`widget.js`) embeddable via a single `<script>` tag.
- [ ] **WIDG-02**: Entire widget UI is encapsulated inside Shadow DOM (`attachShadow({ mode: 'open' })`) to prevent host website CSS style pollution.
- [ ] **WIDG-03**: Widget renders a floating launcher badge and responsive collapsible chat window with customizable theme colors.
- [ ] **WIDG-04**: Widget connects to the streaming chat API and renders typewriter streaming text with markdown support.
- [ ] **WIDG-05**: Widget displays clickable source citations at the bottom of assistant responses.

### 8. Company Admin Dashboard (React + Tailwind)
- [ ] **DASH-01**: Modern dashboard displaying workspace overview, active sources, and widget configuration.
- [ ] **DASH-02**: Sources view allows adding websites, triggering crawls, and inspecting real-time progress bars.
- [ ] **DASH-03**: Widget Customizer provides real-time preview of chat bubble position, brand colors, bot name, and welcome greeting.
- [ ] **DASH-04**: Embed Modal provides one-click copy of the `<script>` tag with the workspace's widget key.
- [ ] **DASH-05**: Conversation Logs view displays past user queries, bot answers, retrieved citations, and latency.

---

## v2 Requirements (Deferred)

### Continuous Sync & Diffing
- **SYNC-01**: Scheduler triggers periodic re-crawling of active sources.
- **SYNC-02**: Hash diff engine compares current page hash with stored hash; skips unchanged pages.
- **SYNC-03**: Modifying a page deletes orphaned vector chunks from Qdrant and inserts new chunks.

### Document & Code Ingestion
- **DOC-01**: PDF manual upload with PyMuPDF text and table extraction.
- **CODE-01**: GitHub repository connector with tree-sitter AST-aware code chunking.

### Analytics & Moderation
- **ANLYT-01**: Thumbs up / down visitor feedback collection with satisfaction analytics.
- **MODR-01**: Hallucination and prompt injection guardrails for public widgets.

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Native Mobile SDKs (iOS/Android) | Embeddable widget is web-first for MVP |
| Paid Billing Integration (Stripe) | Focus on core RAG performance and UX before monetization |
| Human Live-Agent Handoff | Requires deep third-party ticketing integrations (Zendesk/Intercom) |
| Multi-Modal Image Search | Text and documentation coverage is the primary target for enterprise helpdesks |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 3 | Complete |
| AUTH-02 | Phase 3 | Complete |
| AUTH-03 | Phase 3 | Complete |
| AUTH-04 | Phase 3 | Complete |
| INGEST-01 | Phase 1 | Complete |
| INGEST-02 | Phase 1 | Complete |
| INGEST-03 | Phase 1 | Complete |
| INGEST-04 | Phase 1 | Complete |
| EMBED-01 | Phase 1 | Complete |
| EMBED-02 | Phase 1 | Complete |
| EMBED-03 | Phase 1 | Complete |
| EMBED-04 | Phase 1 | Complete |
| VECT-01 | Phase 1 | Complete |
| VECT-02 | Phase 1 | Complete |
| VECT-03 | Phase 1 | Complete |
| RAG-01 | Phase 2 | Complete |
| RAG-02 | Phase 2 | Complete |
| RAG-03 | Phase 2 | Complete |
| RAG-04 | Phase 2 | Complete |
| QUEUE-01 | Phase 3 | Complete |
| QUEUE-02 | Phase 3 | Complete |
| QUEUE-03 | Phase 3 | Complete |
| QUEUE-04 | Phase 3 | Complete |
| WIDG-01 | Phase 4 | Pending |
| WIDG-02 | Phase 4 | Pending |
| WIDG-03 | Phase 4 | Pending |
| WIDG-04 | Phase 4 | Pending |
| WIDG-05 | Phase 4 | Pending |
| DASH-01 | Phase 5 | Pending |
| DASH-02 | Phase 5 | Pending |
| DASH-03 | Phase 5 | Pending |
| DASH-04 | Phase 5 | Pending |
| DASH-05 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 33 total
- Mapped to phases: 33
- Unmapped: 0 ✓

---
*Requirements defined: 2026-10-29*
*Last updated: 2026-10-29 after initial definition*
