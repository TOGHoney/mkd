# Pitfalls Research

**Domain:** Multi-Tenant RAG, Knowledge Ingestion & Embeddable Customer Chat Widget
**Researched:** 2026-10-29
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Cross-Tenant Vector Leakage (Critical Security Risk)

**What goes wrong:**
A visitor on Company A's website asks a question, and the RAG pipeline retrieves confidential chunks belonging to Company B.

**Why it happens:**
The vector database query omits or misconfigures the tenant filter (`workspace_id`), or relies on soft filtering after retrieval instead of hard indexed filtering at the query root.

**How to avoid:**
1. In Qdrant, mark `workspace_id` as an indexed payload field (`FieldType.KEYWORD`).
2. Wrap all search calls inside a utility function that strictly requires `workspace_id` and injects `models.FieldCondition(key="workspace_id", match=models.MatchValue(value=workspace_id))`.
3. Unit test with synthetic multi-tenant vectors: querying Tenant A must mathematically return 0 vectors belonging to Tenant B even when Tenant B's text is a 100% exact keyword match.

**Warning signs:**
Any retrieval function that takes `workspace_id` as an optional parameter.

**Phase to address:**
Phase 1 (Vector Database & Ingestion Engine).

---

### Pitfall 2: Host Website CSS Bleeding into Embeddable Widget

**What goes wrong:**
The widget looks gorgeous in isolation, but when embedded on customer sites using Bootstrap, Tailwind, or custom styles, fonts break, buttons stretch across the screen, or z-index issues hide the chat window.

**Why it happens:**
Host websites declare aggressive global selectors like `* { box-sizing: border-box; font-size: 14px !important; line-height: 1.2; }`.

**How to avoid:**
1. Encapsulate the entire widget inside a native **Shadow DOM** (`element.attachShadow({ mode: 'open' })`).
2. Inject all CSS rules directly into the shadow root via a `<style>` tag.
3. Ensure the host-facing container tag has `z-index: 2147483647` (maximum 32-bit integer) and `position: fixed`.

**Warning signs:**
Testing the widget only in a blank HTML file rather than on complex, heavily styled existing websites.

**Phase to address:**
Phase 3 (Embeddable Widget & Client Integration).

---

### Pitfall 3: Spider Traps, Infinite Crawl Loops & Headless Memory Leaks

**What goes wrong:**
A company inputs a URL with calendar queries (`/events?date=2026-11-01`), pagination parameters, or logout links, causing the crawler to spawn thousands of requests, exhaust server memory, or crash the Playwright process.

**Why it happens:**
Naive URL discovery without path normalization, depth limits, or query parameter sanitization.

**How to avoid:**
1. Enforce a hard maximum page depth (e.g. depth 3) and page count cap (e.g. 50 pages for MVP).
2. Strip tracking query parameters (`utm_*`, `ref`, session IDs).
3. Reuse Playwright browser contexts rather than launching a new browser process for every URL, and always invoke `context.close()` in `finally:` blocks.
4. Respect `robots.txt` and disallow non-content paths (`/login`, `/cart`, `/checkout`).

**Warning signs:**
Crawl jobs running longer than 3 minutes without completing.

**Phase to address:**
Phase 1 (Web Crawling & Ingestion Worker).

---

### Pitfall 4: Orphaned Vectors & Stale Knowledge Hallucinations

**What goes wrong:**
A company updates its pricing from $20 to $30. The crawler ingests the new page, but the old chunks remain in the vector database. The RAG pipeline retrieves both chunks and hallucinatingly quotes both prices.

**Why it happens:**
Appending new vectors without tracking and deleting prior chunk IDs associated with the source document.

**How to avoid:**
1. Store `source_id` and `document_id` in every chunk's payload.
2. During re-crawling, if a document's content hash changes, delete all previous vectors where `document_id == current_doc_id` before upserting the newly generated chunks.
3. Use a transactional or idempotency key pattern for ingestion runs.

**Warning signs:**
Vector collection count steadily increases on every scheduled re-crawl even when no new pages were created.

**Phase to address:**
Phase 2 (Sync Engine & Content Hashing).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Ingesting raw HTML without boilerplate cleanup | Faster ingestion pipeline setup | Vector database clogged with `<nav>`, footer links, and cookie disclaimers, degrading RAG quality | Never. Always strip boilerplate with Trafilatura / Readability |
| Synchronous HTTP crawling | Simple endpoint code | Browser/gateway 504 timeouts on sites with >5 pages | Never. Always use background queue (BullMQ) |
| Hardcoding LLM system prompts in code | Rapid initial prototyping | Impossible to update prompt without redeploying backend | Acceptable in MVP, extract to config/DB in Phase 4 |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| In-memory embedding model reloading per request | 5–10s latency per chat question | Load FastEmbed model once as a singleton during FastAPI lifespan startup | Breaks on first chat query |
| Unbounded top-k context stuffing into LLM | Prompt context window overflow or high latency | Cap top-k at 4–6 chunks, enforce 2,500 token ceiling on assembled context | Breaks when chunks are large (>1,000 tokens) |
| MongoDB full collection scans for conversation logs | Slow dashboard analytics load times | Create compound index on `{ workspace_id: 1, created_at: -1 }` | Breaks after 10,000 messages |

---

## "Looks Done But Isn't" Checklist

- [ ] **Multi-Tenant Isolation:** Verify that searching with Tenant A's token never returns chunks from Tenant B, even with exact keyword queries.
- [ ] **Shadow DOM Styling:** Verify widget renders identically when embedded inside a Tailwind v3 host, a Bootstrap v5 host, and a raw HTML host.
- [ ] **Crawl Cancellation:** Verify that deleting a source in the dashboard cancels the running BullMQ job and terminates active Playwright tasks.
- [ ] **Citation Verification:** Verify that every URL returned in LLM citations matches a validated source URL actually ingested in the workspace.
- [ ] **Origin Whitelist:** Verify that sending a chat request with a forged or unapproved `Origin` header returns HTTP 403 Forbidden.

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification Method |
|---------|------------------|---------------------|
| Cross-tenant vector leakage | Phase 1 | Automated multi-tenant retrieval test in test suite |
| Headless crawler memory leak | Phase 1 | Load test crawling 50 pages; monitor RAM usage |
| Orphaned vector accumulation | Phase 2 | Re-crawl updated page; verify vector count remains constant |
| Shadow DOM CSS bleed | Phase 3 | Visual test embedded in Bootstrap & Tailwind sample sites |
| Origin spoofing & unauthorized usage | Phase 4 | Postman / curl test sending unapproved Origin header |
