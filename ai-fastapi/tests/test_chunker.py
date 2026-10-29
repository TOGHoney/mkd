import unittest
from app.services.chunking import chunk_document


class TestRecursiveChunker(unittest.TestCase):
    def test_chunking_and_metadata_enrichment(self):
        title = "SuperMemory Documentation"
        url = "https://docs.supermemory.ai/overview"
        markdown = """# SuperMemory Overview

SuperMemory is an AI memory platform for enterprise documentation.

## Architecture

The system consists of a FastAPI service, Qdrant vector database, and Node.js gateway.
It enables semantic search across scattered documentation with verified citations.

## Security & Isolation

Every vector point is tagged with workspace_id to guarantee multi-tenant security.
No cross-tenant data access is permitted.
"""

        chunks = chunk_document(title=title, source_url=url, markdown=markdown)

        self.assertGreater(len(chunks), 0)
        first_chunk = chunks[0]

        # Verify metadata enrichment in enriched_text
        self.assertIn("[Document: SuperMemory Documentation", first_chunk.enriched_text)
        self.assertIn("Source: https://docs.supermemory.ai/overview", first_chunk.enriched_text)
        self.assertIn("Section:", first_chunk.enriched_text)

        # Verify hash generation
        self.assertIsNotNone(first_chunk.content_hash)
        self.assertEqual(len(first_chunk.content_hash), 64)  # SHA-256 length

        # Verify chunk IDs
        self.assertTrue(first_chunk.chunk_id.startswith("chk_0000_"))


if __name__ == "__main__":
    unittest.main()
