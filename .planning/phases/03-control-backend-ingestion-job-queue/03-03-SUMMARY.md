# Plan 03-03 Summary: Public Widget Gateway, Origin Whitelist, Rate Limiter & Conversation Logs

**Phase:** 03-control-backend-ingestion-job-queue  
**Plan:** 03  
**Wave:** 2  
**Status:** Completed  
**Completed Date:** 2026-10-29  

---

## Executive Overview

Plan 03-03 established the public widget gateway layer. It protects the AI backend from unauthorized embedding and scraping through domain whitelisting and sliding-window rate limiting, exposes the widget configuration endpoint, and proxies Server-Sent Events (SSE) chat streams to the FastAPI RAG engine while persisting structured conversation history with latency telemetry into MongoDB Atlas.

---

## Key Deliverables

1. **Conversation Analytics Schema & Compound Indexing:**
   - `backend-node/src/models/Conversation.js`: Tracks `session_id`, `workspace_id`, `user_ip`, `origin`, `messages` array (role, content, citations, timestamp), and `latency_ms`.
   - Compound index `{ workspace_id: 1, createdAt: -1 }` added to optimize dashboard analytics queries and eliminate full collection scans.

2. **Domain Whitelist & Origin Authentication:**
   - `backend-node/src/middlewares/widgetAuth.js`:
     - Resolves `widget_key` from headers (`x-widget-key`, `Authorization`) or query parameters.
     - Rejects missing or invalid keys with HTTP 401 Unauthorized.
     - Strictly evaluates request `Origin` and `Referer` against `workspace.allowed_domains` with wildcard and subdomain support (`*.company.com`). Rejects unauthorized origins with **HTTP 403 Forbidden** (`AUTH-03`).

3. **Sliding-Window Rate Limiter:**
   - `backend-node/src/middlewares/rateLimiter.js`: Sliding-window limiter (default: 30 requests / 60 seconds per IP per workspace) using Redis or memory fallback. Blocks burst attacks with **HTTP 429 Too Many Requests** and sets `Retry-After: 60` (`QUEUE-04`).

4. **Widget Configuration & Streaming Chat Proxy:**
   - `backend-node/src/controllers/widgetController.js`:
     - `GET /api/v1/widget/config`: Public endpoint returning brand color, bot name, greeting, and bubble position.
     - `POST /api/v1/widget/chat`: Public streaming gateway. Sets `Content-Type: text/event-stream`, proxies chunks from FastAPI `/api/v1/rag/query`, extracts citations, persists conversation record in MongoDB, and cleanly terminates with `[DONE]` (`QUEUE-04`).
   - `backend-node/src/controllers/conversationController.js`:
     - `GET /api/v1/conversations`: Authenticated endpoint for the admin dashboard conversation log viewer (`DASH-05`).

5. **Automated Test Suite:**
   - `backend-node/tests/widget_gateway.test.js`: Verified domain whitelist logic, hostname parsing, HTTP 401/403 status codes, rate limiter throttling (HTTP 429), config retrieval, and SSE streaming proxy. All tests passed 100%.

---

## Requirements Validated

- [x] **AUTH-03**: Backend generates scoped public widget tokens with domain-origin whitelist enforcement.
- [x] **QUEUE-04**: Chat gateway endpoint verifies `widget_key`, validates `Origin` against `allowed_domains`, and applies Redis sliding-window rate limiting.
