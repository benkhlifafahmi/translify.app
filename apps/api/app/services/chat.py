"""RAG chat: embed user question, vector-search book chunks, ask Claude."""
from __future__ import annotations

import logging
import uuid

from anthropic import AsyncAnthropic
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.ingest.embeddings import embed_query
from app.models.book import Book
from app.models.chat import Message, MessageRole
from app.models.chunk import Chunk

log = logging.getLogger(__name__)

MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 1_500
TOP_K = 6
HISTORY_TURNS = 8  # how many prior messages to include as context

_client: AsyncAnthropic | None = None


def _get_client() -> AsyncAnthropic:
    global _client
    if _client is None:
        if not settings.anthropic_api_key:
            raise RuntimeError("ANTHROPIC_API_KEY is not configured")
        _client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


async def answer_question(
    *,
    session: AsyncSession,
    book: Book,
    chat_id: uuid.UUID,
    question: str,
    history: list[Message],
    answer_language: str | None = None,
) -> tuple[str, list[dict], dict]:
    """Return (assistant_text, citations, token_usage).

    If `answer_language` is set (e.g. the user is reading the French translation),
    Claude is instructed to respond in that language even though the source
    chunks are in the original language.
    """
    # 1. Retrieve top-k relevant chunks via cosine similarity.
    query_vec = await embed_query(question)
    chunks = await _search_chunks(session, book.id, query_vec, k=TOP_K)

    # 2. Build context block + citation table.
    context_parts: list[str] = []
    citations: list[dict] = []
    for i, chunk in enumerate(chunks, start=1):
        page_label = _page_label(chunk)
        context_parts.append(
            f"[Source {i}{page_label}]\n{chunk.text.strip()}"
        )
        citations.append(
            {
                "chunk_id": str(chunk.id),
                "page_start": chunk.page_start,
                "page_end": chunk.page_end,
                "snippet": chunk.text.strip()[:240],
            }
        )

    context_block = "\n\n".join(context_parts) or "(no relevant passages found)"

    language_instruction = ""
    if answer_language:
        language_instruction = (
            f" Always respond in {answer_language}, even though the sources "
            "may be in another language."
        )

    system = (
        f"You are a helpful assistant answering questions about the book "
        f'"{book.title}"'
        + (f" by {book.author}" if book.author else "")
        + ". Use only the provided sources to answer. If the answer isn't in "
        "the sources, say so plainly. Cite sources inline as [1], [2], etc., "
        "matching the [Source N] labels."
        + language_instruction
        + f"\n\n=== SOURCES ===\n{context_block}\n=== END SOURCES ==="
    )

    messages = _build_history(history) + [
        {"role": "user", "content": question},
    ]

    client = _get_client()
    resp = await client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=system,
        messages=messages,
    )
    text = "".join(b.text for b in resp.content if getattr(b, "type", "") == "text").strip()

    usage = {
        "input_tokens": getattr(resp.usage, "input_tokens", None),
        "output_tokens": getattr(resp.usage, "output_tokens", None),
    }
    return text, citations, usage


async def _search_chunks(
    session: AsyncSession,
    book_id: uuid.UUID,
    query_vec: list[float],
    *,
    k: int,
) -> list[Chunk]:
    # pgvector cosine_distance via the .cosine_distance comparator.
    stmt = (
        select(Chunk)
        .where(Chunk.book_id == book_id, Chunk.embedding.is_not(None))
        .order_by(Chunk.embedding.cosine_distance(query_vec))
        .limit(k)
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


def _page_label(chunk: Chunk) -> str:
    if chunk.page_start is None:
        return ""
    if chunk.page_end and chunk.page_end != chunk.page_start:
        return f", p. {chunk.page_start}–{chunk.page_end}"
    return f", p. {chunk.page_start}"


def _build_history(history: list[Message]) -> list[dict]:
    # Take the last HISTORY_TURNS *user/assistant* messages, in order.
    convo = [m for m in history if m.role in (MessageRole.user, MessageRole.assistant)]
    convo = convo[-HISTORY_TURNS:]
    return [
        {"role": m.role.value, "content": m.content}
        for m in convo
    ]
