import asyncio
import logging
import re
from typing import List, Set, Dict, Any, Optional
from urllib.parse import urlparse, urljoin, urldefrag
import httpx
from bs4 import BeautifulSoup
from pydantic import BaseModel, Field

from app.crawlers.cleaner import clean_html_to_markdown

logger = logging.getLogger(__name__)


class CrawlPage(BaseModel):
    """Represents a successfully crawled and cleaned web page."""
    url: str
    title: str
    markdown: str
    content_hash: str
    depth: int
    char_count: int


class CrawlResult(BaseModel):
    """Output summary of an entire crawl job."""
    base_url: str
    total_pages: int
    pages: List[CrawlPage] = Field(default_factory=list)
    errors: List[Dict[str, Any]] = Field(default_factory=list)


class WebCrawler:
    """
    Asynchronous web crawler with same-origin domain fencing, depth limitation,
    sitemap traversal, and boilerplate cleanup.
    """

    def __init__(
        self,
        base_url: str,
        max_depth: int = 2,
        max_pages: int = 25,
        timeout: float = 15.0
    ):
        self.base_url = self._normalize_url(base_url)
        parsed = urlparse(self.base_url)
        self.target_domain = parsed.netloc.lower()
        self.scheme = parsed.scheme or "https"
        self.max_depth = max_depth
        self.max_pages = max_pages
        self.timeout = timeout

        self.visited_urls: Set[str] = set()
        self.pages: List[CrawlPage] = []
        self.errors: List[Dict[str, Any]] = []

        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (compatible; SuperMemoryBot/1.0)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }

    def _normalize_url(self, url: str) -> str:
        """Strips hash fragments, trailing slashes, and analytics query parameters."""
        url, _ = urldefrag(url)
        parsed = urlparse(url)

        # Strip marketing / session query parameters
        clean_query = []
        if parsed.query:
            params = parsed.query.split("&")
            for p in params:
                key = p.split("=")[0].lower()
                if not key.startswith("utm_") and key not in ["ref", "fbclid", "gclid", "session_id"]:
                    clean_query.append(p)

        new_query = "&".join(clean_query)
        path = parsed.path.rstrip("/") if parsed.path != "/" else "/"

        normalized = f"{parsed.scheme}://{parsed.netloc}{path}"
        if new_query:
            normalized += f"?{new_query}"
        return normalized

    def _is_internal_url(self, url: str) -> bool:
        """Verifies that the URL belongs to the exact same origin domain."""
        parsed = urlparse(url)
        return parsed.netloc.lower() == self.target_domain

    def _is_crawlable_path(self, url: str) -> bool:
        """Filters out static media, documents, archives, and non-content endpoints."""
        ignored_extensions = (
            ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico",
            ".mp4", ".mp3", ".wav", ".avi",
            ".zip", ".tar", ".gz", ".rar", ".7z",
            ".exe", ".dmg", ".apk",
            ".css", ".js", ".map"
        )
        parsed = urlparse(url)
        path = parsed.path.lower()

        if any(path.endswith(ext) for ext in ignored_extensions):
            return False

        # Exclude common non-content account/cart paths
        excluded_patterns = ["/login", "/logout", "/signin", "/signup", "/cart", "/checkout", "/wp-admin", "/api/"]
        if any(p in path for p in excluded_patterns):
            return False

        return True

    async def _discover_sitemap_urls(self, client: httpx.AsyncClient) -> List[str]:
        """Attempts to discover URLs listed in /sitemap.xml or /sitemap_index.xml."""
        sitemap_candidates = [
            f"{self.scheme}://{self.target_domain}/sitemap.xml",
            f"{self.scheme}://{self.target_domain}/sitemap_index.xml"
        ]
        discovered = []

        for sitemap_url in sitemap_candidates:
            try:
                res = await client.get(sitemap_url, timeout=5.0)
                if res.status_code == 200 and "xml" in res.headers.get("content-type", ""):
                    soup = BeautifulSoup(res.text, "xml")
                    for loc in soup.find_all("loc"):
                        if loc.string:
                            clean_loc = self._normalize_url(loc.string.strip())
                            if self._is_internal_url(clean_loc) and self._is_crawlable_path(clean_loc):
                                discovered.append(clean_loc)
                    if discovered:
                        logger.info(f"Discovered {len(discovered)} URLs from sitemap: {sitemap_url}")
                        break
            except Exception as e:
                logger.debug(f"Sitemap check failed for {sitemap_url}: {e}")

        return discovered[:self.max_pages]

    async def crawl(self) -> CrawlResult:
        """
        Executes the recursive crawl loop starting from base_url.
        """
        queue: List[Dict[str, Any]] = [{"url": self.base_url, "depth": 0}]

        async with httpx.AsyncClient(headers=self.headers, follow_redirects=True, timeout=self.timeout) as client:
            # 1. Discover sitemap URLs if available
            sitemap_urls = await self._discover_sitemap_urls(client)
            for u in sitemap_urls:
                if u != self.base_url:
                    queue.append({"url": u, "depth": 1})

            # 2. Process queue
            while queue and len(self.pages) < self.max_pages:
                item = queue.pop(0)
                current_url = item["url"]
                current_depth = item["depth"]

                if current_url in self.visited_urls:
                    continue
                self.visited_urls.add(current_url)

                logger.info(f"Crawling [depth={current_depth}] {current_url} ({len(self.pages)+1}/{self.max_pages})...")

                try:
                    res = await client.get(current_url)
                    if res.status_code != 200:
                        self.errors.append({"url": current_url, "status": res.status_code, "error": "HTTP status error"})
                        continue

                    content_type = res.headers.get("content-type", "").lower()
                    if "text/html" not in content_type:
                        continue

                    # Clean HTML to Markdown
                    clean_res = clean_html_to_markdown(res.text, base_url=current_url)
                    markdown = clean_res["markdown"]

                    # Only keep pages with meaningful text (>= 20 characters)
                    if len(markdown.strip()) >= 20:
                        page = CrawlPage(
                            url=current_url,
                            title=clean_res["title"],
                            markdown=markdown,
                            content_hash=clean_res["content_hash"],
                            depth=current_depth,
                            char_count=clean_res["char_count"]
                        )
                        self.pages.append(page)

                    # Discover next links if depth limit permits
                    if current_depth < self.max_depth:
                        soup = BeautifulSoup(res.text, "html.parser")
                        for a in soup.find_all("a", href=True):
                            href = a["href"].strip()
                            absolute_url = urljoin(current_url, href)
                            normalized_url = self._normalize_url(absolute_url)

                            if (
                                self._is_internal_url(normalized_url)
                                and self._is_crawlable_path(normalized_url)
                                and normalized_url not in self.visited_urls
                                and not any(q["url"] == normalized_url for q in queue)
                            ):
                                queue.append({"url": normalized_url, "depth": current_depth + 1})

                except Exception as e:
                    logger.warning(f"Failed to crawl {current_url}: {e}")
                    self.errors.append({"url": current_url, "error": str(e)})

        logger.info(f"Crawl finished. Extracted {len(self.pages)} pages ({len(self.errors)} errors).")
        return CrawlResult(
            base_url=self.base_url,
            total_pages=len(self.pages),
            pages=self.pages,
            errors=self.errors
        )
