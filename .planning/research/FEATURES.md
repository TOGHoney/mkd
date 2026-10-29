# Feature Research

**Domain:** Multi-Tenant RAG, Knowledge Ingestion & Embeddable Customer Chat Widget
**Researched:** 2026-10-29
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Multi-Source Ingestion (Web & Docs)** | Companies have knowledge in websites, sitemaps, and PDF manuals | MEDIUM | Must handle HTML stripping, sitemap traversal, and PDF page extraction |
| **Grounded RAG with Direct Citations** | Answers without sources cause user skepticism and hallucination risks | MEDIUM | Each answer must display clickable source URLs and document titles |
| **Embeddable Chat Widget** | Companies need an out-of-the-box snippet without custom frontend work | MEDIUM | Standalone JS snippet with customizable primary color, bot name, and greetings |
| **Strict Multi-Tenant Isolation** | Corporate knowledge must never cross tenant boundaries | HIGH | Strict Qdrant payload filters (`workspace_id`) + backend API token verification |
| **Asynchronous Ingestion Status** | Large sites take minutes to crawl; blocking UI leads to user frustration | MEDIUM | BullMQ job queue with status updates (Pending, Crawling, Indexing, Done) |
| **Rate Limiting & Domain Whitelist** | Prevents competitors from stealing or abusing the company's widget API | LOW | Origin/Referer header checks against `allowed_domains` + Redis sliding window rate limits |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Continuous Sync & Hash-Diffing** | Auto-updates vector memory when website content changes without manual re-crawling | HIGH | Compare SHA-256 hashes of pages and chunks; update only changed vectors, purge deleted ones |
| **Ultra-Low Latency Streaming (Groq LPUs)** | Sub-1 second time-to-first-token provides an instantaneous chat experience | LOW | Groq Llama 3.3 70B streaming over Server-Sent Events (SSE) to widget |
| **Zero-Cost Local FastEmbed** | Eliminates third-party embedding API costs and network hops | LOW | FastEmbed `bge-small-en-v1.5` running locally via ONNX Runtime inside Python FastAPI |
| **Shadow DOM Widget Isolation** | Guarantee that host website CSS framework never corrupts the chat widget UI | MEDIUM | Encapsulates widget styles entirely inside `shadowRoot` |
| **Code-Aware GitHub Ingestion** | Ingest developer documentation and code repositories cleanly | HIGH | AST / structure-aware chunking preserving function/class boundaries |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Real-time Vector Ingestion on every keystroke** | Sounds like "instant sync" | High resource consumption, vector store thrashing, and high churn | Batch debounced sync or scheduled periodic re-crawl (e.g. daily/weekly) |
| **Allowing arbitrary domain embeddings on public widget** | Convenient for testing | Allows third parties to steal customer's AI quota and spam queries | Strict `allowed_domains` whitelist enforced at backend gateway |
| **Multi-agent autonomous tool execution in public widget** | Cool demo concept | High latency, unpredictability, safety risks, and prompt injection danger | Fast, deterministic RAG retrieval + guarded LLM generation with fallback |

---

## Feature Dependencies

```
[Workspace Management & Auth]
    └──requires──> [MongoDB Atlas & Node Backend]

[BullMQ Ingestion Worker]
    └──requires──> [Redis Broker] & [FastAPI Crawler Engine]

[Semantic Search & RAG]
    └──requires──> [FastEmbed Local Model] & [Qdrant Multi-Tenant Collection]

[Streaming RAG Chat API]
    └──requires──> [Qdrant Retrieval] & [Groq Llama 3.3 Engine]

[Embeddable JS Widget]
    └──requires──> [Streaming RAG Chat API] & [Domain Whitelist Middleware]

[Continuous Sync Engine]
    └──requires──> [Content Hash Tracking] & [BullMQ Ingestion Worker]
```

---

## MVP Definition

### Launch With (v1)
- [x] Multi-tenant workspace management and widget key generation in Node.js + MongoDB.
- [x] BullMQ + Redis background queue for asynchronous web crawling and ingestion.
- [x] Python FastAPI crawler using Crawl4AI / Playwright + BeautifulSoup4 with clean markdown output.
- [x] Hierarchical recursive text chunker with title and source URL metadata injection.
- [x] Local FastEmbed embedding generation (`bge-small-en-v1.5`) and Qdrant vector storage.
- [x] RAG retrieval with mandatory `workspace_id` filter and Groq Llama 3.3 streaming response.
- [x] Shadow DOM-encapsulated embeddable chat widget with customizable brand colors and greeting.
- [x] Origin/Referer domain whitelist security check and Redis rate limiter.
- [x] React + Tailwind dashboard for source management, crawler monitoring, and embed snippet.

### Add After Validation (v1.x)
- [ ] Continuous sync engine with SHA-256 hash comparison and diff-based chunk deletion.
- [ ] PDF document upload and text/table extraction with PyMuPDF.
- [ ] Conversation history analytics and thumbs up/down user feedback logging.

### Future Consideration (v2+)
- [ ] GitHub repository AST ingestion for technical codebases.
- [ ] Hybrid search (BM25 keyword search + Dense Vector search with reciprocal rank fusion).
- [ ] Human support agent live-handoff (Intercom / Zendesk webhook).

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Website Ingestion & Crawling | HIGH | MEDIUM | P1 |
| Qdrant Tenant-Isolated Vector Storage | HIGH | MEDIUM | P1 |
| FastEmbed Local Embeddings | HIGH | LOW | P1 |
| Groq Llama 3.3 Streaming RAG | HIGH | LOW | P1 |
| Shadow DOM Embeddable Widget | HIGH | MEDIUM | P1 |
| Origin Whitelist & Rate Limiting | HIGH | LOW | P1 |
| React Dashboard (Sources & Customizer) | HIGH | MEDIUM | P1 |
| Content Hash Diffing (Continuous Sync) | MEDIUM | MEDIUM | P2 |
| PDF Document Parsing | MEDIUM | LOW | P2 |
| Conversation Analytics & Feedback | MEDIUM | LOW | P2 |
| GitHub Codebase Ingestion | MEDIUM | HIGH | P3 |
