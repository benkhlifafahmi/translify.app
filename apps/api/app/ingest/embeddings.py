"""Voyage embedding client.

Voyage's ``voyage-3`` model returns 1024-dim vectors — must match ``EMBEDDING_DIM``
in ``app.models.chunk``.
"""
from __future__ import annotations

import asyncio
import logging
from collections.abc import Sequence

import voyageai

from app.config import settings

log = logging.getLogger(__name__)

EMBED_MODEL = "voyage-3"
BATCH_SIZE = 64  # Voyage allows up to 128, leave headroom for token-count limits


_client: voyageai.AsyncClient | None = None


def _get_client() -> voyageai.AsyncClient:
    global _client
    if _client is None:
        if not settings.voyage_api_key:
            raise RuntimeError("VOYAGE_API_KEY is not configured")
        _client = voyageai.AsyncClient(api_key=settings.voyage_api_key)
    return _client


async def embed_documents(texts: Sequence[str]) -> list[list[float]]:
    """Return one embedding per input text, preserving order."""
    if not texts:
        return []

    client = _get_client()
    out: list[list[float]] = []
    for start in range(0, len(texts), BATCH_SIZE):
        batch = list(texts[start : start + BATCH_SIZE])
        result = await _embed_with_retry(client, batch, input_type="document")
        out.extend(result.embeddings)
    return out


async def embed_query(text: str) -> list[float]:
    """Embed a single search query using the query input type."""
    client = _get_client()
    result = await _embed_with_retry(client, [text], input_type="query")
    return result.embeddings[0]


async def _embed_with_retry(
    client: voyageai.AsyncClient, batch: list[str], *, input_type: str, attempts: int = 3
) -> "voyageai.object.embeddings.EmbeddingsObject":
    delay = 1.0
    last_exc: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            return await client.embed(batch, model=EMBED_MODEL, input_type=input_type)
        except Exception as exc:
            last_exc = exc
            log.warning(
                "voyage embed attempt %d/%d failed: %s", attempt, attempts, exc
            )
            if attempt == attempts:
                break
            await asyncio.sleep(delay)
            delay *= 2
    assert last_exc is not None
    raise last_exc
