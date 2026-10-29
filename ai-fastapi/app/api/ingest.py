from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl, Field

from app.core.config import settings
from app.crawlers.web_crawler import WebCrawler
from app.services.ingestion_service import IngestionService

router = APIRouter(tags=["Ingestion"])


class IngestDocumentRequest(BaseModel):
    """Payload for ingesting a single document or markdown page."""
    workspace_id: str = Field(..., description="Target workspace ID for multi-tenant isolation")
    source_id: str = Field(..., description="ID of the parent data source")
    document_id: str = Field(..., description="Unique ID for this document")
    title: str = Field(..., description="Document or page title")
    source_url: str = Field(..., description="Canonical source URL or file path")
    markdown: str = Field(..., description="Extracted Markdown content")


class IngestCrawlRequest(BaseModel):
    """Payload for triggering a crawl and immediately ingesting the results."""
    workspace_id: str = Field(..., description="Target workspace ID")
    source_id: str = Field(..., description="Data source ID in control backend")
    url: HttpUrl = Field(..., description="Base URL of the website or docs to crawl")
    max_depth: int = Field(default=2, ge=1, le=5)
    max_pages: int = Field(default=25, ge=1, le=100)


@router.post("/ingest")
async def ingest_document(request: IngestDocumentRequest) -> Dict[str, Any]:
    """
    Ingests a single document into Qdrant: chunks the text with hierarchical
    metadata enrichment, computes dense embeddings locally via FastEmbed, and
    upserts vectors tagged with workspace_id.
    """
    service = IngestionService()
    try:
        result = service.ingest_document(
            workspace_id=request.workspace_id,
            source_id=request.source_id,
            document_id=request.document_id,
            title=request.title,
            source_url=request.source_url,
            markdown=request.markdown
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to ingest document into vector database: {str(e)}"
        )


@router.post("/ingest/crawl")
async def ingest_crawl(request: IngestCrawlRequest) -> Dict[str, Any]:
    """
    Crawls a target website, converts all reachable pages to clean Markdown,
    chunks and embeds them, and upserts all resulting vectors into Qdrant.
    """
    crawler = WebCrawler(
        base_url=str(request.url),
        max_depth=request.max_depth,
        max_pages=request.max_pages,
        timeout=settings.CRAWL_TIMEOUT_SECONDS
    )

    crawl_result = await crawler.crawl()
    if crawl_result.total_pages == 0:
        raise HTTPException(
            status_code=400,
            detail=f"Crawl could not extract any pages from {request.url}. Errors: {crawl_result.errors}"
        )

    service = IngestionService()
    try:
        ingest_result = service.ingest_crawled_pages(
            workspace_id=request.workspace_id,
            source_id=request.source_id,
            crawl_result=crawl_result
        )
        return ingest_result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to ingest crawled pages into vector database: {str(e)}"
        )
