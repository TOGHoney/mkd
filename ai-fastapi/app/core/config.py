import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Resolve absolute path to ai-fastapi/.env
ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH, override=True)

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
except ImportError:
    from pydantic import BaseModel
    class BaseSettings(BaseModel):
        pass
    def SettingsConfigDict(**kwargs):
        return kwargs


class Settings(BaseSettings):
    """Application configuration settings."""
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Qdrant Vector Database
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: Optional[str] = None
    QDRANT_COLLECTION_NAME: str = "company_memories"

    # Embedding Model Settings
    EMBEDDING_MODEL_NAME: str = "BAAI/bge-small-en-v1.5"
    EMBEDDING_DIMENSION: int = 384

    # Groq LLM Settings (for Phase 2)
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "qwen/qwen3.8-27b"

    # Crawler Settings
    DEFAULT_CRAWL_MAX_DEPTH: int = 2
    DEFAULT_CRAWL_MAX_PAGES: int = 25
    CRAWL_TIMEOUT_SECONDS: float = 15.0

    model_config = SettingsConfigDict(
        env_file=str(ENV_PATH) if ENV_PATH.exists() else ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
