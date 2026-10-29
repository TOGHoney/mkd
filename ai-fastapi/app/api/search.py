from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.search_service import get_search_service, SearchResult

router = APIRouter(tags=["Search"])


class SearchRequest(BaseModel):
    """Payload for semantic vector retrieval."""
    workspace_id: str = Field(..., description="Target workspace ID for multi-tenant isolation")
    query: str = Field(..., min_length=1, description="Question or search query text")
    top_k: int = Field(default=5, ge=1, le=20, description="Max number of chunks to retrieve")
    min_score: float = Field(default=0.35, ge=0.0, le=1.0, description="Minimum cosine similarity score threshold")


@router.post("/search", response_model=SearchResult)
async def search_vectors(request: SearchRequest):
    """
    Performs semantic vector search across a workspace's private vector memory.
    Enforces strict workspace_id payload filtering to guarantee multi-tenant security.
    """
    service = get_search_service()
    try:
        result = service.search(
            workspace_id=request.workspace_id,
            query=request.query,
            top_k=request.top_k,
            score_threshold=request.min_score
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Vector search failed: {str(e)}"
        )
