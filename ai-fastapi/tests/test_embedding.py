import unittest
from unittest.mock import patch, MagicMock
from app.services.embedding import EmbeddingService, _normalize_hf_embeddings
from app.core.config import settings


class TestEmbeddingService(unittest.TestCase):
    def test_normalize_hf_embeddings_2d(self):
        """Test normalization of standard 2D pooled vectors."""
        raw = [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]
        normalized = _normalize_hf_embeddings(raw)
        self.assertEqual(len(normalized), 2)
        self.assertEqual(normalized[0], [0.1, 0.2, 0.3])
        self.assertEqual(normalized[1], [0.4, 0.5, 0.6])

    def test_normalize_hf_embeddings_3d_mean_pooling(self):
        """Test mean-pooling of 3D token vectors [batch, seq_len, dim]."""
        # Batch of 1 document with 2 tokens of 3 dimensions
        raw = [[[1.0, 2.0, 3.0], [3.0, 4.0, 5.0]]]
        normalized = _normalize_hf_embeddings(raw)
        self.assertEqual(len(normalized), 1)
        # Token mean: [(1+3)/2, (2+4)/2, (3+5)/2] = [2.0, 3.0, 4.0]
        self.assertEqual(normalized[0], [2.0, 3.0, 4.0])

    def test_normalize_empty_and_invalid(self):
        """Test edge cases with empty or invalid inputs."""
        self.assertEqual(_normalize_hf_embeddings([]), [])
        self.assertEqual(_normalize_hf_embeddings(None), [])

    @patch("app.services.embedding.httpx.Client")
    def test_cloud_embedding_with_mocked_hf(self, mock_client_cls):
        """Verify cloud embeddings call Hugging Face when token is set."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = [[0.05] * 384, [0.08] * 384]

        mock_client = MagicMock()
        mock_client.post.return_value = mock_resp
        mock_client_cls.return_value.__enter__.return_value = mock_client

        service = EmbeddingService(model_name="BAAI/bge-small-en-v1.5")
        service.hf_token = "hf_test_mock_token"

        results = service.embed_documents(["Hello world", "Documentation test"])
        self.assertEqual(len(results), 2)
        self.assertEqual(len(results[0]), 384)
        self.assertEqual(results[0][0], 0.05)


if __name__ == "__main__":
    unittest.main()
