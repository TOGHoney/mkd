from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, HttpUrl, Field

from app.core.config import settings
from app.crawlers.web_crawler import WebCrawler, CrawlResult

router = APIRouter(tags=["Crawler"])


class CrawlRequest(BaseModel):
    """Request model for crawling a website URL."""
    url: HttpUrl
    max_depth: int = Field(default=2, ge=1, le=5, description="Maximum crawl depth from base URL")
    max_pages: int = Field(default=25, ge=1, le=100, description="Maximum total pages to extract")
    timeout_seconds: Optional[float] = Field(default=None, description="Per-page timeout in seconds")


@router.post("/crawl", response_model=CrawlResult)
async def crawl_website(request: CrawlRequest):
    """
    Crawls a target website or documentation site, extracts semantic content,
    strips boilerplates, and returns clean Markdown pages with SHA-256 hashes.
    """
    timeout = request.timeout_seconds or settings.CRAWL_TIMEOUT_SECONDS
    crawler = WebCrawler(
        base_url=str(request.url),
        max_depth=request.max_depth,
        max_pages=request.max_pages,
        timeout=timeout
    )

    result = await crawler.crawl()

    if result.total_pages == 0 and result.errors:
        raise HTTPException(
            status_code=400,
            detail=f"Crawl failed to extract any pages. Errors: {result.errors}"
        )

    return result
