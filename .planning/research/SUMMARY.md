# Project Research Summary

**Project:** SuperMemory AI (InnoBrain RAG)
**Domain:** Multi-Tenant RAG, Knowledge Ingestion & Embeddable Customer Chat Widget
**Researched:** 2026-10-29
**Confidence:** HIGH

## Executive Summary

SuperMemory AI is an enterprise-grade, multi-tenant knowledge extraction and retrieval platform designed to ingest unstructured corporate data (websites, documentation, PDFs, and codebases), transform it into high-fidelity semantic embeddings, and expose that private memory through a lightweight, embeddable JavaScript chat widget. The system solves the dual challenges of knowledge fragmentation and hallucination-prone customer support by grounding every AI response in verified corporate context.

The recommended architectural approach isolates control logic (Node.js + Express + MongoDB + BullMQ) from AI and crawling computation (Python + FastAPI + FastEmbed + Qdrant + Groq). Local embedding generation with FastEmbed completely eliminates third-party embedding API costs and network latency, while Groq's Llama 3.3 70B Versatile provides sub-1.5s time-to-first-token streaming. The embeddable widget leverages Web Components with native Shadow DOM encapsulation, guaranteeing complete immunity to host website CSS style bleeding.

The top architectural risks—cross-tenant vector leakage, host CSS bleed, and orphaned stale vectors—are mitigated early through strict Qdrant payload filters (`workspace_id`), Shadow DOM encapsulation, and SHA-256 content hash diffing with automated vector cleanup.

---

## Key Findings

### Recommended Stack
- **AI & RAG Engine**: Python 3.11+, FastAPI, FastEmbed (`bge-small-en-v1.5`), Qdrant Vector Database, Groq Cloud SDK (`llama-3.3-70b-versatile`).
- **Control Backend**: Node.js 22+, Express, MongoDB Atlas, Redis 7.2+, BullMQ (asynchronous ingestion queues).
- **Client Layer**: React 18+ & Tailwind CSS (Company Dashboard), Vanilla JS Web Component + Shadow DOM (Embeddable Widget).

### Expected Features
- **Must Have (Table Stakes)**:
  - Multi-tenant workspace management with unique API & widget keys.
  - Asynchronous website crawler (Playwright / Crawl4AI + BeautifulSoup4) with markdown output.
  - Hierarchical recursive text chunker with source URL and heading breadcrumb metadata.
  - Qdrant vector storage with mandatory `workspace_id` payload filtering.
  - Streaming RAG chat API with direct source citation links.
  - Embeddable `<script>` widget with Shadow DOM isolation, origin domain whitelisting, and Redis rate limiting.
  - React admin dashboard for source management, crawler inspection, and widget customization.
- **Should Have (Competitive Differentiators)**:
  - Continuous sync engine using SHA-256 hash comparison and diff-based vector upsert/delete.
  - PDF document extraction preserving tables and structure via PyMuPDF.
  - Session analytics and user feedback tracking (thumbs up/down).
- **Defer (v2+)**:
  - GitHub code AST ingestion with tree-sitter.
  - Human live-agent handoff integrations.

### Critical Pitfalls
1. **Cross-Tenant Vector Leakage**: Prevented by mandatory Qdrant payload indexing and programmatic `workspace_id` filtering on all vector queries.
2. **Host Website CSS Bleed**: Prevented by encapsulating the widget inside a Shadow Root (`attachShadow({ mode: 'open' })`).
3. **Crawl Loops & Headless Memory Leaks**: Prevented by hard depth limits (max depth 3, max 50 pages), domain restriction, and proper Playwright context recycling.
4. **Orphaned Stale Vectors**: Prevented by tracking `document_id` in vector payloads and purging outdated chunks prior to re-indexing.

---

## Implications for Roadmap

Based on research dependencies and risk mitigation, the recommended phase structure:

### Phase 1: Foundation & Data Ingestion Engine (AI Service + Qdrant)
**Rationale:** The core value proposition relies on clean document extraction, chunking, and isolated vector storage.
**Delivers:**
- Python FastAPI service setup.
- Web crawler (Crawl4AI/Playwright/BS4) producing clean Markdown.
- Recursive hierarchical chunker with metadata injection.
- FastEmbed local embedding pipeline and Qdrant multi-tenant collection setup with indexed `workspace_id`.
**Avoids:** Crawler memory leaks and cross-tenant leakage foundation.

### Phase 2: RAG Pipeline & Generation Engine (FastAPI + Groq)
**Rationale:** Once vectors are indexed, semantic search and low-latency grounded generation must be proven.
**Delivers:**
- Qdrant top-k semantic search filtered by `workspace_id` with similarity thresholding.
- Prompt assembly with system grounding and citation rules.
- Streaming Groq Llama 3.3 70B integration with Server-Sent Events (SSE).
- Test harness validating retrieval accuracy and citation precision.

### Phase 3: Control Backend & Ingestion Job Queue (Node.js + MongoDB + BullMQ)
**Rationale:** Provides multi-tenant isolation, user authentication, and asynchronous job queuing so crawling doesn't block APIs.
**Delivers:**
- Node.js Express server with MongoDB Atlas schemas (Users, Workspaces, Sources, IngestionJobs).
- BullMQ + Redis job queue orchestrating crawling tasks in Python.
- Public chat gateway verifying `widget_key`, `Origin` domain whitelisting, and Redis sliding-window rate limiting.
- Real-time ingestion progress reporting via SSE.

### Phase 4: Embeddable Chat Widget (Vanilla JS + Shadow DOM)
**Rationale:** The company's end-users interact exclusively through this component; it must be completely isolated and lightweight.
**Delivers:**
- Standalone zero-dependency Web Component bundle (`widget.js`).
- Shadow DOM encapsulation preventing host CSS conflicts.
- Floating launcher badge, collapsible chat window, SSE streaming typewriter text, and clickable source citations.
- Embed script generator and testing on diverse third-party styled pages.

### Phase 5: Company Admin Dashboard (React + Tailwind)
**Rationale:** Ties the entire system together for the paying company admin.
**Delivers:**
- Workspace management & API key generation.
- Source management UI (add websites, monitor crawler progress bars).
- Interactive Widget Customizer with live preview (colors, bot name, welcome greeting, starter questions).
- Embed snippet modal with one-click copy.
- Analytics tab (conversation volume, latency, feedback).

### Phase 6: Continuous Sync & Content Hash Diffing
**Rationale:** Keeps the company memory updated automatically without full manual re-indexing.
**Delivers:**
- Periodic re-crawl scheduler.
- SHA-256 page and chunk hash comparison.
- Diff-based vector upsert and orphaned chunk purge in Qdrant.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Node + Python + Qdrant + Groq + React is the gold-standard production pattern for enterprise RAG |
| Features | HIGH | Table stakes, differentiators, and MVP scope boundaries clearly defined |
| Architecture | HIGH | Clean microservices separation in a monorepo structure with BullMQ queue |
| Pitfalls | HIGH | Specific mitigations identified for tenant isolation, Shadow DOM, and vector staleness |

**Overall confidence:** HIGH

---
*Research completed: 2026-10-29*
*Ready for roadmap: yes*
