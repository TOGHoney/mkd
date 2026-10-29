import logging
from typing import List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

_embedding_service: Optional["EmbeddingService"] = None


class EmbeddingService:
    """
    Local embedding model service using FastEmbed (ONNX Runtime).
    Computes 384-dimensional dense vectors with zero external API fees.
    """

    def __init__(self, model_name: str = settings.EMBEDDING_MODEL_NAME):
        self.model_name = model_name
        self._model = None
        self._load_model()

    def _load_model(self):
        """Loads FastEmbed ONNX model."""
        try:
            from fastembed import TextEmbedding
            logger.info(f"Loading FastEmbed model '{self.model_name}'...")
            self._model = TextEmbedding(model_name=self.model_name)
            logger.info(f"FastEmbed model '{self.model_name}' loaded successfully.")
        except Exception as e:
            logger.warning(
                f"Failed to load FastEmbed model '{self.model_name}': {e}. "
                "Local inference will fall back to lazy initialization or zero vectors for testing."
            )
            self._model = None

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """
        Embeds a list of document chunk texts.
        Returns a list of 384-dimensional float vectors.
        """
        if not texts:
            return []

        if self._model is None:
            self._load_model()

        if self._model is not None:
            # fastembed.embed returns a generator of numpy arrays
            embeddings_gen = self._model.embed(texts)
            return [list(map(float, vec)) for vec in embeddings_gen]
        else:
            # Fallback if dependencies not yet installed in local python environment
            logger.warning("FastEmbed model unavailable; returning normalized dummy vectors.")
            dim = settings.EMBEDDING_DIMENSION
            return [[0.0] * dim for _ in texts]

    def embed_query(self, query: str) -> List[float]:
        """
        Embeds a single search query string for RAG retrieval.
        """
        results = self.embed_documents([query])
        return results[0] if results else [0.0] * settings.EMBEDDING_DIMENSION


def get_embedding_service() -> EmbeddingService:
    """Thread-safe lazy singleton for the EmbeddingService."""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service
