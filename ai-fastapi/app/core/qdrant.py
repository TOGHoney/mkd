import logging
from typing import Optional, Any
try:
    from qdrant_client import QdrantClient
    from qdrant_client.http import models
    from qdrant_client.http.exceptions import UnexpectedResponse
except ImportError:
    QdrantClient = None
    models = None
    UnexpectedResponse = Exception

from app.core.config import settings

logger = logging.getLogger(__name__)

_qdrant_client: Optional[QdrantClient] = None


def get_qdrant_client() -> Optional[Any]:
    """Returns a singleton QdrantClient instance."""
    global _qdrant_client
    if _qdrant_client is None:
        if QdrantClient is None:
            logger.warning("qdrant_client package not installed; client instance is None.")
            return None
        logger.info(f"Connecting to Qdrant at {settings.QDRANT_URL}...")
        _qdrant_client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY,
            timeout=10.0
        )
    return _qdrant_client


def init_qdrant_collection() -> bool:
    """
    Initializes the multi-tenant Qdrant collection with indexed workspace_id.
    Returns True if initialized or already exists, False if connection failed.
    """
    client = get_qdrant_client()
    collection_name = settings.QDRANT_COLLECTION_NAME

    try:
        collections_response = client.get_collections()
        existing_collections = [c.name for c in collections_response.collections]

        if collection_name not in existing_collections:
            logger.info(f"Creating collection '{collection_name}' with {settings.EMBEDDING_DIMENSION}d vectors...")
            client.create_collection(
                collection_name=collection_name,
                vectors_config=models.VectorParams(
                    size=settings.EMBEDDING_DIMENSION,
                    distance=models.Distance.COSINE
                ),
                hnsw_config=models.HnswConfigDiff(
                    m=16,
                    ef_construct=100
                )
            )

            # Create required payload index for multi-tenant isolation
            logger.info(f"Creating payload index for 'workspace_id' (KEYWORD) on '{collection_name}'...")
            client.create_payload_index(
                collection_name=collection_name,
                field_name="workspace_id",
                field_schema=models.PayloadSchemaType.KEYWORD
            )

            # Create payload index for document-level operations (re-crawl diffing and purging)
            logger.info(f"Creating payload index for 'document_id' (KEYWORD) on '{collection_name}'...")
            client.create_payload_index(
                collection_name=collection_name,
                field_name="document_id",
                field_schema=models.PayloadSchemaType.KEYWORD
            )
            logger.info(f"Collection '{collection_name}' initialized successfully with tenant isolation.")
        else:
            logger.info(f"Collection '{collection_name}' already exists.")

        return True
    except Exception as e:
        logger.warning(
            f"Failed to connect to Qdrant at {settings.QDRANT_URL}: {e}. "
            "Server will continue; Qdrant features will retry on request."
        )
        return False
