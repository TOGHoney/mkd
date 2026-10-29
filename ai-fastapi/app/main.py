import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.qdrant import init_qdrant_collection
from app.api import health, crawl

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("supermemory-ai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager."""
    logger.info("Initializing SuperMemory AI Service...")
    # Initialize Qdrant collection
    init_qdrant_collection()
    yield
    logger.info("Shutting down SuperMemory AI Service...")


app = FastAPI(
    title="SuperMemory AI Engine",
    description="Vector ingestion, semantic chunking, and RAG retrieval service.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(health.router, prefix="/api/v1")
app.include_router(crawl.router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main.py:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
