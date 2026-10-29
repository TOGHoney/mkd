import datetime
import logging
import uuid
from typing import Dict, Any, List
try:
    from qdrant_client.http import models
except ImportError:
    models = None

from app.core.config import settings
from app.core.qdrant import get_qdrant_client
from app.services.chunking import chunk_document, DocumentChunk
from app.services.embedding import get_embedding_service
from app.crawlers.web_crawler import CrawlResult

logger = logging.getLogger(__name__)

# Namespace UUID for deterministic Qdrant point IDs
SUPERMEMORY_NAMESPACE = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")


class IngestionService:
    """
    Coordinates document chunking, embedding generation, and multi-tenant
    vector upsert into Qdrant.
    """

    def __init__(self):
        self.qdrant_client = get_qdrant_client()
        self.embedding_service = get_embedding_service()
        self.collection_name = settings.QDRANT_COLLECTION_NAME

    def ingest_document(
        self,
        workspace_id: str,
        source_id: str,
        document_id: str,
        title: str,
        source_url: str,
        markdown: str
    ) -> Dict[str, Any]:
        """
        Chunks, embeds, and stores a single document in Qdrant with tenant payload tags.
        """
        if not markdown or not markdown.strip():
            return {
                "workspace_id": workspace_id,
                "document_id": document_id,
                "chunks_indexed": 0,
                "status": "skipped_empty"
            }

        # 1. Chunk document
        chunks: List[DocumentChunk] = chunk_document(
            title=title,
            source_url=source_url,
            markdown=markdown
        )

        if not chunks:
            return {
                "workspace_id": workspace_id,
                "document_id": document_id,
                "chunks_indexed": 0,
                "status": "no_chunks_generated"
            }

        logger.info(f"Generated {len(chunks)} chunks for document '{title}' ({source_url})")

        # 2. Embed enriched text representations
        enriched_texts = [chunk.enriched_text for chunk in chunks]
        vectors = self.embedding_service.embed_documents(enriched_texts)

        # 3. Build Qdrant PointStruct list
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        points: List[models.PointStruct] = []

        for chunk, vector in zip(chunks, vectors):
            # Deterministic UUID prevents duplicate point IDs on re-ingestion
            point_id = str(uuid.uuid5(SUPERMEMORY_NAMESPACE, f"{workspace_id}:{document_id}:{chunk.chunk_index}"))

            payload = {
                "workspace_id": workspace_id,  # Indexed keyword for multi-tenant isolation
                "source_id": source_id,
                "document_id": document_id,    # Indexed keyword for document-level purges
                "chunk_id": chunk.chunk_id,
                "chunk_index": chunk.chunk_index,
                "title": title,
                "source_url": source_url,
                "heading_context": chunk.heading_context,
                "text": chunk.text,
                "enriched_text": chunk.enriched_text,
                "content_hash": chunk.content_hash,
                "created_at": now_iso
            }

            points.append(
                models.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=payload
                )
            )

        # 4. Batch upsert into Qdrant
        try:
            self.qdrant_client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            logger.info(f"Successfully upserted {len(points)} points into Qdrant for workspace '{workspace_id}'")
            return {
                "workspace_id": workspace_id,
                "document_id": document_id,
                "chunks_indexed": len(points),
                "status": "completed"
            }
        except Exception as e:
            logger.error(f"Failed to upsert points to Qdrant: {e}")
            raise e

    def ingest_crawled_pages(
        self,
        workspace_id: str,
        source_id: str,
        crawl_result: CrawlResult
    ) -> Dict[str, Any]:
        """
        Ingests all pages returned by a web crawl.
        """
        total_chunks = 0
        pages_indexed = 0

        for page in crawl_result.pages:
            # Generate deterministic document_id from page content_hash and URL
            doc_id = str(uuid.uuid5(SUPERMEMORY_NAMESPACE, f"{source_id}:{page.url}"))
            res = self.ingest_document(
                workspace_id=workspace_id,
                source_id=source_id,
                document_id=doc_id,
                title=page.title,
                source_url=page.url,
                markdown=page.markdown
            )
            if res.get("status") == "completed":
                pages_indexed += 1
                total_chunks += res.get("chunks_indexed", 0)

        return {
            "workspace_id": workspace_id,
            "source_id": source_id,
            "total_pages_crawled": crawl_result.total_pages,
            "pages_indexed": pages_indexed,
            "total_chunks_indexed": total_chunks,
            "status": "completed"
        }
