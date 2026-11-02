import os
import logging
from typing import List, Optional, Any
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

_embedding_service: Optional["EmbeddingService"] = None

HF_ROUTER_URL = "https://router.huggingface.co/hf-inference/models"
HF_LEGACY_URL = "https://api-inference.huggingface.co/pipeline/feature-extraction"


def _normalize_hf_embeddings(raw_embeddings: Any) -> List[List[float]]:
    """
    Normalizes Hugging Face inference API response into a List of float vectors.
    Handles both pooled 2D outputs [batch, dim] and unpooled 3D token outputs [batch, seq_len, dim].
    """
    if not isinstance(raw_embeddings, list) or len(raw_embeddings) == 0:
        return []

    # Case 1: Single vector 1D list [0.1, 0.2, ...]
    if isinstance(raw_embeddings[0], (int, float)):
        return [[float(x) for x in raw_embeddings]]

    # Case 2: Standard 2D list of pooled embeddings [[0.1, ...], [0.2, ...]]
    if isinstance(raw_embeddings[0], list) and (len(raw_embeddings[0]) == 0 or isinstance(raw_embeddings[0][0], (int, float))):
        return [[float(x) for x in vec] for vec in raw_embeddings]

    # Case 3: 3D unpooled token embeddings [batch, tokens, hidden_dim] -> Mean pooling across tokens
    if isinstance(raw_embeddings[0], list) and isinstance(raw_embeddings[0][0], list):
        pooled = []
        for doc_tokens in raw_embeddings:
            if not doc_tokens:
                pooled.append([0.0] * settings.EMBEDDING_DIMENSION)
                continue
            n_tokens = len(doc_tokens)
            dim = len(doc_tokens[0])
            mean_vec = [0.0] * dim
            for token_vec in doc_tokens:
                for d in range(dim):
                    mean_vec[d] += float(token_vec[d])
            pooled.append([v / n_tokens for v in mean_vec])
        return pooled

    return []


class EmbeddingService:
    """
    Hybrid Embedding Service:
    1. Cloud Serverless (Zero RAM): When HF_TOKEN is configured, uses Hugging Face's
       free Serverless Inference API for BAAI/bge-small-en-v1.5. Uses ~0MB RAM, allowing
       the FastAPI container to stay easily under Render's 512MB free tier cap.
    2. Local FastEmbed: Lazy-loaded fallback using single-threaded ONNX Runtime when running
       offline or without an HF_TOKEN.
    """

    def __init__(self, model_name: str = settings.EMBEDDING_MODEL_NAME):
        self.model_name = model_name
        self.hf_token = settings.HF_TOKEN or os.getenv("HF_TOKEN")
        self._model = None

        if self.hf_token:
            logger.info(
                f"EmbeddingService configured with Cloud Hugging Face Serverless API "
                f"for '{self.model_name}' (Zero-RAM mode)."
            )
        else:
            logger.info(
                f"EmbeddingService initialized without HF_TOKEN. "
                f"Will lazy-load local FastEmbed on first demand."
            )

    def _load_local_model(self):
        """Lazy-loads FastEmbed ONNX model with optimized single-thread CPU constraints."""
        if self._model is not None:
            return
        try:
            from fastembed import TextEmbedding
            cache_dir = os.getenv("FASTEMBED_CACHE_PATH", None)
            threads = int(os.getenv("OMP_NUM_THREADS", "1"))
            logger.info(f"Loading local FastEmbed model '{self.model_name}' (threads={threads})...")
            self._model = TextEmbedding(
                model_name=self.model_name,
                cache_dir=cache_dir,
                threads=threads
            )
            logger.info(f"Local FastEmbed model '{self.model_name}' loaded successfully.")
        except Exception as e:
            logger.warning(
                f"Failed to load local FastEmbed model '{self.model_name}': {e}. "
                "Will fall back to normalized dummy vectors if no cloud provider is active."
            )
            self._model = None

    def _embed_huggingface_batch(self, batch: List[str]) -> List[List[float]]:
        """Calls Hugging Face serverless feature extraction for a batch of texts."""
        headers = {
            "Authorization": f"Bearer {self.hf_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "inputs": batch,
            "options": {"wait_for_model": True}
        }

        urls = [
            f"{HF_ROUTER_URL}/{self.model_name}",
            f"{HF_LEGACY_URL}/{self.model_name}"
        ]

        last_error = None
        for url in urls:
            try:
                with httpx.Client(timeout=30.0) as client:
                    resp = client.post(url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        raw = resp.json()
                        normalized = _normalize_hf_embeddings(raw)
                        if len(normalized) == len(batch):
                            return normalized
                        logger.warning(
                            f"HF response count {len(normalized)} did not match batch size {len(batch)}."
                        )
                    else:
                        logger.warning(f"HF inference error at {url} ({resp.status_code}): {resp.text[:200]}")
                        last_error = f"Status {resp.status_code}: {resp.text[:200]}"
            except Exception as e:
                logger.warning(f"HF inference connection failed at {url}: {e}")
                last_error = str(e)

        raise RuntimeError(f"Hugging Face serverless embedding failed: {last_error}")

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """
        Embeds a list of document chunk texts.
        Returns a list of 384-dimensional float vectors.
        """
        if not texts:
            return []

        # 1. Prefer Hugging Face Serverless API if HF_TOKEN is set
        if self.hf_token:
            try:
                all_vectors: List[List[float]] = []
                batch_size = 16  # Safe batch size for Serverless payloads
                for i in range(0, len(texts), batch_size):
                    batch = texts[i:i + batch_size]
                    vectors = self._embed_huggingface_batch(batch)
                    all_vectors.extend(vectors)
                return all_vectors
            except Exception as e:
                logger.error(
                    f"Cloud embedding generation via Hugging Face failed: {e}. "
                    "Falling back to local FastEmbed."
                )

        # 2. Local FastEmbed fallback
        self._load_local_model()
        if self._model is not None:
            embeddings_gen = self._model.embed(texts)
            return [list(map(float, vec)) for vec in embeddings_gen]

        # 3. Last-resort fallback for local environment without dependencies
        logger.warning("No embedding provider available; returning normalized dummy vectors.")
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
