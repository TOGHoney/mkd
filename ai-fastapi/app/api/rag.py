from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.services.rag_service import get_rag_service, RAGQueryRequest, RAGResponse

router = APIRouter(tags=["RAG"])


@router.post("/rag/query")
async def rag_query_stream(request: RAGQueryRequest):
    """
    Retrieves grounded context from Qdrant, prompts Groq Llama 3.3 70B,
    and streams tokens and citation packets in real-time over Server-Sent Events (SSE).
    """
    service = get_rag_service()
    generator = service.stream_rag_response(
        workspace_id=request.workspace_id,
        query=request.query,
        conversation_history=request.conversation_history,
        top_k=request.top_k,
        temperature=request.temperature
    )

    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.post("/rag/ask", response_model=RAGResponse)
async def rag_query_sync(request: RAGQueryRequest):
    """
    Non-streaming endpoint returning full answer text and verified source citations.
    Useful for synchronous backend proxying and batch evaluation.
    """
    service = get_rag_service()
    response = await service.generate_rag_response(
        workspace_id=request.workspace_id,
        query=request.query,
        conversation_history=request.conversation_history,
        top_k=request.top_k,
        temperature=request.temperature
    )
    return response
