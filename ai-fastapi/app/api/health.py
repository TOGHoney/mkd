from fastapi import APIRouter
from app.core.config import settings
from app.core.qdrant import get_qdrant_client

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    """Health check endpoint checking service and vector DB status."""
    qdrant_status = "disconnected"
    collection_status = "unknown"

    try:
        client = get_qdrant_client()
        collections_res = client.get_collections()
        qdrant_status = "connected"
        existing = [c.name for c in collections_res.collections]
        collection_status = "ready" if settings.QDRANT_COLLECTION_NAME in existing else "pending_init"
    except Exception as e:
        qdrant_status = f"error: {str(e)}"

    return {
        "status": "ok",
        "service": "ai-fastapi",
        "environment": settings.ENVIRONMENT,
        "qdrant": {
            "status": qdrant_status,
            "url": settings.QDRANT_URL,
            "collection": settings.QDRANT_COLLECTION_NAME,
            "collection_status": collection_status
        }
    }
