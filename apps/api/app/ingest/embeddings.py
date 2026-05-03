"""Local BGE-M3 embeddings via sentence-transformers (CPU).

BGE-M3 emits 1024-dim dense vectors, matching the ``Vector(1024)`` column +
HNSW index on ``chunks.embedding`` (see ``app.models.chunk.EMBEDDING_DIM``).

Vectors are L2-normalized so cosine distance == 1 - dot product, which keeps
pgvector's ``cosine_distance`` operator well-behaved. BGE-M3 is trained
without query/document prefixes, so we use the same path for both.

Inference is synchronous and CPU-bound; we offload to a thread so the async
surface is unchanged for callers. The model is loaded lazily on first use
and kept resident.
"""
from __future__ import annotations

import asyncio
import logging
import threading
from collections.abc import Sequence

from sentence_transformers import SentenceTransformer

from app.models.chunk import EMBEDDING_DIM

log = logging.getLogger(__name__)

EMBED_MODEL = "BAAI/bge-m3"
EMBED_DIM = EMBEDDING_DIM
BATCH_SIZE = 32


_model: SentenceTransformer | None = None
_model_lock = threading.Lock()


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                log.info("loading BGE-M3 (first call downloads ~2.3GB to HF cache)")
                _model = SentenceTransformer(EMBED_MODEL, device="cpu")
    return _model


def _embed_sync(texts: list[str]) -> list[list[float]]:
    model = _get_model()
    arr = model.encode(
        texts,
        batch_size=BATCH_SIZE,
        normalize_embeddings=True,
        convert_to_numpy=True,
        show_progress_bar=False,
    )
    return arr.tolist()


async def embed_documents(texts: Sequence[str]) -> list[list[float]]:
    """Return one embedding per input text, preserving order."""
    if not texts:
        return []
    return await asyncio.to_thread(_embed_sync, list(texts))


async def embed_query(text: str) -> list[float]:
    """Embed a single search query."""
    result = await asyncio.to_thread(_embed_sync, [text])
    return result[0]
