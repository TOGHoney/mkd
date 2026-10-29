import logging
from typing import List, Optional
from pydantic import BaseModel
try:
    from qdrant_client.http import models
except ImportError:
    models = None

from app.core.config import settings
from app.core.qdrant import get_qdrant_client
from app.services.embedding import get_embedding_service

logger = logging.getLogger(__name__)

_search_service: Optional["SearchService"] = None


class ScoredChunk(BaseModel):
    """Represents a matched chunk retrieved from the vector database."""
    chunk_id: str
    document_id: str
    source_url: str
    title: str
    heading_context: str
    text: str
    enriched_text: str
    score: float


class SearchResult(BaseModel):
    """Structured result of a multi-tenant vector search."""
    query: str
    workspace_id: str
    total_found: int
    results: List[ScoredChunk]


class SearchService:
    """
    Handles semantic vector search in Qdrant with mandatory workspace_id
    payload filtering and similarity thresholding.
    """

    def __init__(self):
        self.qdrant_client = get_qdrant_client()
        self.embedding_service = get_embedding_service()
        self.collection_name = settings.QDRANT_COLLECTION_NAME

    def search(
        self,
        workspace_id: str,
        query: str,
        top_k: int = 5,
        score_threshold: float = 0.35
    ) -> SearchResult:
        """
        Executes semantic search strictly filtered by workspace_id.
        Guarantees that no cross-tenant records can ever be returned.
        """
        if not workspace_id or not workspace_id.strip():
            raise ValueError("workspace_id is required for multi-tenant isolation")

        if not query or not query.strip():
            return SearchResult(query=query, workspace_id=workspace_id, total_found=0, results=[])

        # 1. Compute query embedding vector (384-d)
        query_vector = self.embedding_service.embed_query(query)

        # 2. Build mandatory tenant filter
        tenant_filter = models.Filter(
            must=[
                models.FieldCondition(
                    key="workspace_id",
                    match=models.MatchValue(value=workspace_id)
                )
            ]
        )

        # 3. Query Qdrant with payload filter and score threshold
        try:
            hits = self.qdrant_client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                query_filter=tenant_filter,
                limit=top_k,
                score_threshold=score_threshold
            )
        except Exception as e:
            logger.error(f"Qdrant search error for workspace '{workspace_id}': {e}")
            raise e

        # 4. Map hits to ScoredChunk objects
        scored_chunks: List[ScoredChunk] = []
        for hit in hits:
            payload = hit.payload or {}
            scored_chunks.append(
                ScoredChunk(
                    chunk_id=payload.get("chunk_id", str(hit.id)),
                    document_id=payload.get("document_id", ""),
                    source_url=payload.get("source_url", ""),
                    title=payload.get("title", ""),
                    heading_context=payload.get("heading_context", ""),
                    text=payload.get("text", ""),
                    enriched_text=payload.get("enriched_text", ""),
                    score=float(hit.score)
                )
            )

        logger.info(f"Retrieved {len(scored_chunks)} chunks for workspace '{workspace_id}' (query: '{query[:40]}...')")

        return SearchResult(
            query=query,
            workspace_id=workspace_id,
            total_found=len(scored_chunks),
            results=scored_chunks
        )


def get_search_service() -> SearchService:
    """Singleton getter for SearchService."""
    global _search_service
    if _search_service is None:
        _search_service = SearchService()
    return _search_service
