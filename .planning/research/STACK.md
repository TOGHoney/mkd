# Stack Research

**Domain:** Multi-Tenant RAG, Vector Search, Knowledge Ingestion & Embeddable Widget
**Researched:** 2026-10-29
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Python** | 3.11+ | AI, Crawling & RAG Engine | Unmatched ecosystem for NLP, embedding models, vector libraries, and document processing |
| **FastAPI** | 0.115+ | AI Service Web Framework | High-performance async ASGI framework, native Pydantic v2 validation, OpenAPI docs, and SSE streaming support |
| **Node.js** | 22+ LTS / 24 | Control Backend Runtime | Event-driven, non-blocking I/O ideal for API gateways, auth, webhooks, and asynchronous job orchestration |
| **Express.js** | 4.21+ / 5.0 | REST API Server | Battle-tested, minimal overhead, robust middleware ecosystem for security headers, auth, and rate-limiting |
| **MongoDB Atlas** | 7.0+ / 8.0 | Application Database | Flexible document schema for heterogeneous sources, workspaces, job states, conversation sessions, and analytics |
| **Redis** | 7.2+ | In-Memory Broker & Cache | Ultra-fast data structure store required for BullMQ queues and sliding-window rate limiters |
| **BullMQ** | 5.20+ | Background Job Queue | Production-ready Redis-backed queue with retries, exponential backoff, concurrency controls, and real-time job progress events |
| **Qdrant** | 1.12+ | Vector Database | Rust-based high-throughput vector search engine with native HNSW indexing and rock-solid payload filtering for tenant isolation |
| **FastEmbed** | 0.4+ | Local Embedding Inference | Lightweight Python library by Qdrant running ONNX Runtime on CPU/GPU; zero PyTorch bloat, sub-10ms latency, zero API costs |
| **Groq Cloud SDK** | 0.11+ | LLM Inference Engine | LPUs (Language Processing Units) delivering 250+ tokens/sec on Llama 3.3 70B Versatile, enabling near-instant TTFT for chat |
| **React** | 18.3+ / 19 | Dashboard Frontend | Standard for rich, stateful SaaS dashboards with deep component ecosystem and developer velocity |
| **Tailwind CSS** | 3.4+ / 4.0 | UI Design & Styling | Utility-first styling enabling fast, cohesive dark/light design systems without CSS overhead |
| **Vanilla JS + Shadow DOM** | ES2022 | Embeddable Chat Widget | Zero external dependencies (<40KB gzipped); Shadow DOM guarantees zero CSS conflicts with host websites |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **crawl4ai** | 0.4+ | Async Web Crawler | Deep crawling of modern JavaScript-rendered SPAs with automated Markdown extraction |
| **playwright** | 1.48+ | Headless Browser Automation | Rendering dynamic JS pages that require interaction, scrolling, or cookie bypass |
| **beautifulsoup4** | 4.12+ | HTML Parsing | Fast extraction for static websites and cleanup of HTML fragments |
| **trafilatura** | 1.12+ | Main Content Extraction | Stripping boilerplate (headers, footers, sidebars, cookie banners) to extract pure document text |
| **PyMuPDF (`fitz`)** | 1.24+ | PDF Extraction | Ultra-fast text, table, and structure extraction from uploaded PDF documents |
| **tree-sitter** / AST | 0.23+ | Code Chunking | Parsing GitHub source files into atomic function, class, and module blocks |
| **tiktoken** | 0.8+ | Token Counting | Accurate token calculation for chunk boundaries and context window packing |
| **ioredis** | 5.4+ | Redis Client (Node) | High-performance Redis client with cluster, sentinel, and pipelining support |
| **mongoose** | 8.8+ | MongoDB ODM | Schema validation, relationship modeling, and indexing for workspaces and conversations |
| **jsonwebtoken & bcryptjs** | Latest | Authentication | Secure JWT token issuance and password hashing for dashboard users |
| **cors & helmet** | Latest | HTTP Security Middleware | Strict CORS policy and security headers for backend endpoints |

---

## Installation Commands

### 1. Python AI & RAG Engine (`/ai-fastapi`)
```bash
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Core AI & Web
pip install fastapi uvicorn[standard] pydantic pydantic-settings
pip install qdrant-client fastembed groq httpx
# Crawling & Document Processing
pip install crawl4ai playwright beautifulsoup4 trafilatura pymupdf tiktoken
playwright install chromium
```

### 2. Node.js Control Backend (`/backend-node`)
```bash
npm init -y
npm install express mongoose dotenv cors helmet jsonwebtoken bcryptjs ioredis bullmq
npm install -D nodemon @types/node
```

### 3. React Dashboard (`/frontend-dashboard`)
```bash
npm create vite@latest . -- --template react
npm install lucide-react clsx tailwindcss postcss autoprefixer axios
npx tailwindcss init -p
```

### 4. Embeddable Widget (`/widget`)
```bash
# Bundled via Vite or esbuild into a single widget.js output
npm init -y
npm install -D esbuild terser
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Qdrant** | Pinecone | When a fully managed proprietary cloud with zero self-hosting option is mandated by enterprise policy |
| **Qdrant** | MongoDB Atlas Vector Search | When you want a single database and can accept higher memory consumption and slower HNSW index builds |
| **FastEmbed (`bge-small-en-v1.5`)** | OpenAI `text-embedding-3-small` | When network latency to OpenAI is acceptable and paying per token for embeddings is preferred over local CPU compute |
| **Groq Llama 3.3 70B** | OpenAI GPT-4o-mini | When Groq rate limits are exceeded or specialized multi-turn tool calling with OpenAI structured outputs is required |
| **Crawl4AI + Playwright** | Firecrawl Cloud | When the team prefers paying for an external SaaS scraping API rather than running Playwright headless workers |
| **Shadow DOM Widget** | `<iframe>` Widget | When the widget needs complete sandboxing with its own cross-origin cookies and storage, at the cost of responsiveness and slower DOM rendering |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Heavy PyTorch / HuggingFace Transformers in Web API** | Adds 2GB+ to Docker image, 15s cold starts, and high RAM overhead | **FastEmbed (ONNX Runtime)**: sub-100MB footprint, instant initialization |
| **Global Unscoped Qdrant Collections per Tenant** | Creating 10,000 collections degrades Qdrant cluster performance | **Single Collection with Indexed `workspace_id` Payload Filter** |
| **Plain CSS in Embeddable Widget without Shadow DOM** | Host website styles (`body * { box-sizing: border-box; font-size: 14px !important; }`) will corrupt the widget | **Web Component with Shadow DOM (`attachShadow({ mode: 'open' })`)** |
| **Synchronous Crawling in HTTP Request** | Web scraping takes 10s–5 minutes; will cause HTTP gateway timeouts (504) | **BullMQ Background Worker with SSE progress updates** |

---

## Sources
- [Qdrant Documentation](https://qdrant.tech/documentation/) — Multi-tenancy and Payload Indexing best practices
- [FastEmbed GitHub](https://github.com/qdrant/fastembed) — Benchmarks for BAAI/bge-small-en-v1.5 ONNX runtime
- [Groq Cloud Docs](https://console.groq.com/docs/) — Llama 3.3 70B Versatile specs and streaming endpoints
- [Crawl4AI Docs](https://crawl4ai.com/) — Async crawl pipelines and markdown heuristics
