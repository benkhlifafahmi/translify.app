"""Token-aware chunker.

Walks pages in order, packing them into chunks that target ~600 tokens with
~80 tokens of overlap. Each chunk records the page range it spans so we can
cite locations later.
"""
from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

import tiktoken

from app.ingest.parsers import Page

TARGET_TOKENS = 600
OVERLAP_TOKENS = 80
HARD_MIN_TOKENS = 32  # don't emit chunks smaller than this except as the final tail


@dataclass(slots=True)
class TextChunk:
    text: str
    token_count: int
    page_start: int | None
    page_end: int | None


@lru_cache(maxsize=1)
def _encoding() -> tiktoken.Encoding:
    # cl100k is a reasonable proxy for token count across most modern models.
    # Voyage uses its own tokenizer, but cl100k gets us close enough for
    # chunk-budget bookkeeping.
    return tiktoken.get_encoding("cl100k_base")


def chunk_pages(pages: list[Page]) -> list[TextChunk]:
    enc = _encoding()

    # Tokenize each page once; remember which page each token belongs to.
    tokens: list[int] = []
    token_pages: list[int] = []
    for page in pages:
        if not page.text.strip():
            continue
        page_tokens = enc.encode(page.text)
        if not page_tokens:
            continue
        # Include a paragraph separator between pages so chunk boundaries
        # don't paste the last word of one page to the first of the next.
        if tokens:
            sep = enc.encode("\n\n")
            tokens.extend(sep)
            token_pages.extend([page.number] * len(sep))
        tokens.extend(page_tokens)
        token_pages.extend([page.number] * len(page_tokens))

    if not tokens:
        return []

    chunks: list[TextChunk] = []
    step = max(1, TARGET_TOKENS - OVERLAP_TOKENS)
    i = 0
    n = len(tokens)
    while i < n:
        end = min(i + TARGET_TOKENS, n)
        slice_tokens = tokens[i:end]
        slice_pages = token_pages[i:end]
        if not slice_tokens:
            break
        # Skip emitting tiny dangling chunks unless this is the only chunk.
        if len(slice_tokens) < HARD_MIN_TOKENS and chunks:
            break
        text = enc.decode(slice_tokens).strip()
        if text:
            chunks.append(
                TextChunk(
                    text=text,
                    token_count=len(slice_tokens),
                    page_start=slice_pages[0],
                    page_end=slice_pages[-1],
                )
            )
        if end >= n:
            break
        i += step

    return chunks
