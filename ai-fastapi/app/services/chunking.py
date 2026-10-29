import hashlib
import re
from typing import List, Optional
from pydantic import BaseModel


class DocumentChunk(BaseModel):
    """Represents an atomic, metadata-enriched text chunk ready for vectorization."""
    chunk_id: str
    chunk_index: int
    text: str
    enriched_text: str
    token_count: int
    content_hash: str
    heading_context: str


class RecursiveChunker:
    """
    Hierarchical recursive character splitter that respects Markdown section headers,
    preserves semantic boundaries, and enriches chunks with parent document metadata.
    """

    def __init__(
        self,
        target_chunk_size_tokens: int = 600,
        chunk_overlap_tokens: int = 100
    ):
        # Approximate 1 token = 4 characters
        self.chunk_size = target_chunk_size_tokens * 4
        self.chunk_overlap = chunk_overlap_tokens * 4
        self.separators = ["\n## ", "\n### ", "\n\n", "\n", ". ", "! ", "? ", " ", ""]

    def _split_text(self, text: str, separators: List[str]) -> List[str]:
        """Recursively splits text until chunks are within chunk_size."""
        final_chunks: List[str] = []
        separator = separators[-1]
        new_separators = []

        for i, sep in enumerate(separators):
            if sep in text:
                separator = sep
                new_separators = separators[i + 1:]
                break

        splits = text.split(separator)
        good_splits: List[str] = []

        for s in splits:
            if not s.strip():
                continue
            # Re-attach separator for headers or paragraphs
            piece = s if separator in [" ", ""] else s + (separator if not separator.startswith("\n") else "")
            if len(piece) < self.chunk_size:
                good_splits.append(piece)
            else:
                if new_separators:
                    sub_splits = self._split_text(piece, new_separators)
                    good_splits.extend(sub_splits)
                else:
                    good_splits.append(piece)

        # Merge small adjacent splits with overlap
        current_chunk = ""
        for piece in good_splits:
            if not current_chunk:
                current_chunk = piece
            elif len(current_chunk) + len(piece) <= self.chunk_size:
                current_chunk += " " + piece
            else:
                final_chunks.append(current_chunk.strip())
                # Keep sliding window overlap from end of current_chunk
                overlap_text = current_chunk[-self.chunk_overlap:] if len(current_chunk) > self.chunk_overlap else ""
                current_chunk = overlap_text + " " + piece

        if current_chunk.strip():
            final_chunks.append(current_chunk.strip())

        return final_chunks

    def chunk(self, title: str, source_url: str, markdown: str) -> List[DocumentChunk]:
        """
        Splits markdown into chunks, tracking active headings and prepending metadata.
        """
        if not markdown or not markdown.strip():
            return []

        raw_chunks = self._split_text(markdown, self.separators)
        chunks: List[DocumentChunk] = []
        current_heading = "General"

        for idx, text in enumerate(raw_chunks):
            # Check if this chunk contains a new markdown heading
            heading_match = re.search(r'^(?:#|##|###)\s+(.+)$', text, re.MULTILINE)
            if heading_match:
                current_heading = heading_match.group(1).strip()

            # Construct enriched text prepending document title, source URL, and heading context
            enriched = (
                f"[Document: {title} | Source: {source_url} | Section: {current_heading}]\n\n"
                f"{text}"
            )

            # Calculate SHA-256 hash of the chunk
            chunk_hash = hashlib.sha256(text.strip().encode("utf-8")).hexdigest()

            # Approximate token count (~4 characters per token)
            token_count = max(1, len(text) // 4)

            chunk = DocumentChunk(
                chunk_id=f"chk_{idx:04d}_{chunk_hash[:8]}",
                chunk_index=idx,
                text=text,
                enriched_text=enriched,
                token_count=token_count,
                content_hash=chunk_hash,
                heading_context=current_heading
            )
            chunks.append(chunk)

        return chunks


def chunk_document(title: str, source_url: str, markdown: str) -> List[DocumentChunk]:
    """Helper function to chunk a document using default settings."""
    chunker = RecursiveChunker()
    return chunker.chunk(title=title, source_url=source_url, markdown=markdown)
