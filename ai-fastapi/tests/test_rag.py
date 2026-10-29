import unittest
from app.services.search_service import ScoredChunk
from app.services.rag_service import RAGService


class TestRAGService(unittest.TestCase):
    def test_context_and_citation_builder(self):
        service = RAGService()

        chunks = [
            ScoredChunk(
                chunk_id="chk_001",
                document_id="doc_123",
                source_url="https://example.com/refund",
                title="Refund Policy",
                heading_context="30-Day Window",
                text="Customers can request a full refund within 30 days of purchase.",
                enriched_text="[Document: Refund Policy | Source: https://example.com/refund] Customers can request...",
                score=0.88
            ),
            ScoredChunk(
                chunk_id="chk_002",
                document_id="doc_123",
                source_url="https://example.com/refund",
                title="Refund Policy",
                heading_context="Exceptions",
                text="Digital downloads are non-refundable after download key activation.",
                enriched_text="[Document: Refund Policy | Source: https://example.com/refund] Digital downloads...",
                score=0.75
            )
        ]

        context_str, citations = service._build_context_and_citations(chunks)

        # Citations should be deduplicated by URL
        self.assertEqual(len(citations), 1)
        self.assertEqual(citations[0].url, "https://example.com/refund")
        self.assertEqual(citations[0].title, "Refund Policy")

        # Context string should contain both chunks with headers
        self.assertIn("Refund Policy", context_str)
        self.assertIn("30 days of purchase", context_str)
        self.assertIn("Digital downloads", context_str)

    def test_message_assembly_grounding(self):
        service = RAGService()
        query = "Can I get a refund after 20 days?"
        context_str = "[SOURCE 1]: Full refund within 30 days."
        history = [{"role": "user", "content": "Hello"}]

        messages = service._assemble_messages(query, context_str, history)

        self.assertEqual(messages[0]["role"], "system")
        self.assertIn("STRICTLY and SOLELY based on the provided company documentation", messages[0]["content"])
        self.assertIn(context_str, messages[-1]["content"])
        self.assertIn(query, messages[-1]["content"])


if __name__ == "__main__":
    unittest.main()
