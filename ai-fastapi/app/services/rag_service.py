import asyncio
import json
import logging
import re
from typing import List, Dict, Any, Optional, AsyncGenerator
from pydantic import BaseModel, Field

from app.core.config import settings
from app.services.search_service import get_search_service, ScoredChunk

logger = logging.getLogger(__name__)

_rag_service: Optional["RAGService"] = None

PREAMBLE_REGEX = re.compile(
    r'^\s*(?:Based on|According to|From)\s+(?:the|our|these)?\s*(?:[a-zA-Z]+\s+)*(?:documentation|docs|information|materials|context|sources|documents)\s*[,:]?\s*',
    re.IGNORECASE
)


def strip_rag_preamble(text: str) -> str:
    """
    Strips formulaic LLM preamble phrases like 'Based on the provided documentation, '
    so responses begin directly, naturally, and authoritatively.
    """
    cleaned = PREAMBLE_REGEX.sub('', text)
    cleaned = cleaned.lstrip()
    for i, ch in enumerate(cleaned):
        if ch.isalpha():
            cleaned = cleaned[:i] + ch.upper() + cleaned[i+1:]
            break
        elif ch not in ('*', '_', '`', '#', ' ', '\n', '\t'):
            break
    return cleaned


class Citation(BaseModel):
    """Represents a validated source citation supporting an assistant answer."""
    title: str
    url: str
    heading: str
    score: float


class RAGQueryRequest(BaseModel):
    """Payload for RAG question answering."""
    workspace_id: str = Field(..., description="Target workspace ID for multi-tenant isolation")
    query: str = Field(..., min_length=1, description="Visitor question")
    conversation_history: List[Dict[str, str]] = Field(default_factory=list, description="Prior turns [{'role': 'user'|'assistant', 'content': '...'}]")
    top_k: int = Field(default=5, ge=1, le=15)
    temperature: float = Field(default=0.2, ge=0.0, le=1.0)


class RAGResponse(BaseModel):
    """Structured response for non-streaming RAG queries."""
    answer: str
    citations: List[Citation]
    retrieved_chunks: int
    model: str


SYSTEM_PROMPT = """You are a helpful, knowledgeable, and professional AI documentation and customer support assistant.
Your knowledge comes directly from the indexed company documentation and knowledge base provided in the context below.

CRITICAL INSTRUCTIONS:
1. Direct, Natural Openings (NO BOILERPLATE PREAMBLES):
   - NEVER start answers with phrases like "Based on the provided information", "Based on the provided documentation", "According to the provided materials", "Based on the retrieved context", "From the sources provided", or similar filler.
   - Jump directly and authoritatively into the answer as the company's expert documentation assistant.
   - For example, instead of: "Based on the provided documentation, Git is an open-source version control system...", state directly: "Git is an open-source version control system...".
   - Instead of: "Based on the provided documentation, here is how you can...", state directly: "Here is how you can...".

2. Greetings & Pleasantries:
   - If the user offers a greeting (e.g., "hi", "hello", "hey", "good morning"), warmly introduce yourself as the AI documentation assistant and invite them to ask questions.

3. Overview & Knowledge Base Inquiries:
   - If the user asks about "the knowledge repo", "the knowledge base", "this website", "what is this docs about", "what can you tell me", or asks for an overview of available topics, synthesize a clear, well-structured summary of the available documentation and resources directly without filler preambles.

4. Grounded Q&A:
   - For specific questions, answer accurately using the facts and instructions found in the provided sources. Use bullet points and bold highlights for readability.

5. Genuinely Missing Information:
   - Only when a user asks for specific factual details that are completely absent from the provided context (e.g., specific pricing numbers not in the text, unrelated personal questions, or external topics), politely explain:
     "I do not have detailed information on that specific topic in our documentation. Please reach out to customer support for further assistance."

6. Tone & Style:
   - Be helpful, welcoming, concise, direct, and structured. Use clean Markdown formatting.
"""


class RAGService:
    """
    Retrieval-Augmented Generation service combining Qdrant semantic search
    with Groq Llama 3.3 70B streaming inference and citations.
    """

    def __init__(self):
        self.search_service = get_search_service()
        self.model_name = settings.GROQ_MODEL
        self._groq_client = None

        if settings.GROQ_API_KEY:
            try:
                from groq import AsyncGroq
                self._groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)
                logger.info(f"Initialized Groq client with model '{self.model_name}'")
            except Exception as e:
                logger.warning(f"Could not initialize Groq client: {e}")

    def _build_context_and_citations(self, chunks: List[ScoredChunk]):
        """Formats retrieved chunks into context string and unique citations."""
        citations: List[Citation] = []
        seen_urls = set()
        context_parts = []

        for i, chunk in enumerate(chunks, start=1):
            source_header = f"[SOURCE {i}: {chunk.title} | {chunk.source_url} > {chunk.heading_context}]"
            context_parts.append(f"{source_header}\n{chunk.text}\n")

            if chunk.source_url not in seen_urls:
                seen_urls.add(chunk.source_url)
                citations.append(
                    Citation(
                        title=chunk.title or "Documentation",
                        url=chunk.source_url,
                        heading=chunk.heading_context or "General",
                        score=chunk.score
                    )
                )

        context_str = "\n".join(context_parts) if context_parts else "No relevant company documents found for this query."
        return context_str, citations

    def _assemble_messages(
        self,
        query: str,
        context_str: str,
        conversation_history: List[Dict[str, str]]
    ) -> List[Dict[str, str]]:
        """Assembles chat messages with system grounding and conversation memory."""
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT}
        ]

        # Append last 4 conversation turns for conversational continuity
        for turn in conversation_history[-4:]:
            role = turn.get("role", "user")
            content = turn.get("content", "")
            if role in ["user", "assistant"] and content:
                messages.append({"role": role, "content": content})

        # Append current user prompt with injected context
        user_prompt = f"""--- RETRIEVED COMPANY CONTEXT ---
{context_str}

--- USER QUESTION ---
{query}"""

        messages.append({"role": "user", "content": user_prompt})
        return messages

    async def stream_rag_response(
        self,
        workspace_id: str,
        query: str,
        conversation_history: List[Dict[str, str]] = [],
        top_k: int = 5,
        temperature: float = 0.2
    ) -> AsyncGenerator[str, None]:
        """
        Yields Server-Sent Events (SSE) formatted events:
        - `data: {"type": "token", "content": "..."}`
        - `data: {"type": "citations", "sources": [...]}`
        - `data: [DONE]`
        """
        # 1. Retrieve tenant-isolated vector chunks
        search_res = self.search_service.search(
            workspace_id=workspace_id,
            query=query,
            top_k=top_k
        )

        context_str, citations = self._build_context_and_citations(search_res.results)
        messages = self._assemble_messages(query, context_str, conversation_history)

        # 2. Check if Groq client is active
        if self._groq_client and settings.GROQ_API_KEY:
            try:
                stream = await self._groq_client.chat.completions.create(
                    model=self.model_name,
                    messages=messages,
                    stream=True,
                    temperature=temperature,
                    max_tokens=1024
                )

                buffer = ""
                preamble_handled = False

                async for chunk in stream:
                    delta = chunk.choices[0].delta.content or ""
                    if not delta:
                        continue

                    if not preamble_handled:
                        buffer += delta
                        is_possible_preamble = any(
                            buffer.strip().lower().startswith(p)
                            for p in ["based", "according", "from the", "from our"]
                        )
                        if is_possible_preamble:
                            has_break = any(p in buffer for p in [",", ":", "\n"])
                            if (has_break and len(buffer.split()) >= 5) or len(buffer) >= 70:
                                cleaned = strip_rag_preamble(buffer)
                                if cleaned:
                                    event_payload = json.dumps({"type": "token", "content": cleaned, "token": cleaned})
                                    yield f"data: {event_payload}\n\n"
                                buffer = ""
                                preamble_handled = True
                        else:
                            # Not a preamble: emit immediately without delay
                            event_payload = json.dumps({"type": "token", "content": buffer, "token": buffer})
                            yield f"data: {event_payload}\n\n"
                            buffer = ""
                            preamble_handled = True
                    else:
                        event_payload = json.dumps({"type": "token", "content": delta, "token": delta})
                        yield f"data: {event_payload}\n\n"

                # Flush any residual buffer on stream completion
                if not preamble_handled and buffer:
                    cleaned = strip_rag_preamble(buffer)
                    if cleaned:
                        event_payload = json.dumps({"type": "token", "content": cleaned, "token": cleaned})
                        yield f"data: {event_payload}\n\n"

            except Exception as e:
                logger.error(f"Groq streaming error: {e}")
                err_payload = json.dumps({"type": "error", "message": str(e)})
                yield f"data: {err_payload}\n\n"
        else:
            # Fallback simulator when running in local development without active GROQ_API_KEY
            query_clean = query.strip().lower().rstrip("?!.")
            greetings = ["hi", "hello", "hey", "help", "who are you", "what is this", "hi there", "good morning", "good evening"]

            if query_clean in greetings:
                sample_tokens = (
                    "Hello! I am your AI documentation assistant. I can help answer questions based on "
                    "your company's knowledge base and documentation. Ask me anything!"
                ).split(" ")
            elif search_res.results:
                top_hit = search_res.results[0]
                sample_tokens = (
                    f"**{top_hit.title}**\n\n"
                    f"{top_hit.text[:300]}..."
                ).split(" ")
            else:
                sample_tokens = (
                    f"I searched your knowledge base for \"{query}\", but did not find matching materials yet. "
                    "Please ensure your website or docs have been crawled in the dashboard, or contact customer support."
                ).split(" ")

            for word in sample_tokens:
                await asyncio.sleep(0.04)
                token_payload = json.dumps({"type": "token", "content": word + " ", "token": word + " "})
                yield f"data: {token_payload}\n\n"

        # 3. Stream citations payload
        citations_data = [c.model_dump() for c in citations]
        citations_payload = json.dumps({
            "type": "citations",
            "sources": citations_data,
            "citations": [c.url for c in citations]
        })
        yield f"data: {citations_payload}\n\n"

        # 4. Stream final termination marker
        yield "data: [DONE]\n\n"

    async def generate_rag_response(
        self,
        workspace_id: str,
        query: str,
        conversation_history: List[Dict[str, str]] = [],
        top_k: int = 5,
        temperature: float = 0.2
    ) -> RAGResponse:
        """Non-streaming query response for API integrations and testing."""
        search_res = self.search_service.search(
            workspace_id=workspace_id,
            query=query,
            top_k=top_k
        )

        context_str, citations = self._build_context_and_citations(search_res.results)
        messages = self._assemble_messages(query, context_str, conversation_history)

        answer_text = ""
        if self._groq_client and settings.GROQ_API_KEY:
            try:
                completion = await self._groq_client.chat.completions.create(
                    model=self.model_name,
                    messages=messages,
                    stream=False,
                    temperature=temperature,
                    max_tokens=1024
                )
                raw_answer = completion.choices[0].message.content or ""
                answer_text = strip_rag_preamble(raw_answer)
            except Exception as e:
                logger.error(f"Groq API error: {e}")
                answer_text = f"Error generating answer: {str(e)}"
        else:
            if search_res.results:
                top_hit = search_res.results[0]
                answer_text = f"**{top_hit.title}**\n\n{top_hit.text[:300]}..."
            else:
                answer_text = "I do not have detailed information on that specific topic in our documentation. Please reach out to customer support."

        return RAGResponse(
            answer=answer_text,
            citations=citations,
            retrieved_chunks=len(search_res.results),
            model=self.model_name
        )


def get_rag_service() -> RAGService:
    """Singleton getter for RAGService."""
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service
