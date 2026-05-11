"""RAG chat: embed user question, vector-search book chunks, ask the LLM.

Model selection is centralized in services/llm.py via the `task` parameter:
  - task="chat" (default) — full chat panel, currently routes to Sonnet
  - task="highlight_explain" — one-shot passage explanations, routes to Gemini

To swap models, edit TASK_CONFIG in services/llm.py — no changes needed here.
"""
from __future__ import annotations

import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.billing.family_safe import safe_addendum
from app.ingest.embeddings import embed_query
from app.models.book import Book
from app.models.chat import Message, MessageRole
from app.models.chunk import Chunk
from app.services.llm import ChatTurn, chat_complete

log = logging.getLogger(__name__)

MAX_TOKENS = 1_500
# Cost levers — smaller TOP_K and HISTORY_TURNS reduce input tokens per
# request without meaningfully hurting answer quality. If users complain
# about thin answers, bump TOP_K back up.
TOP_K = 4
HISTORY_TURNS = 4


async def answer_question(
    *,
    session: AsyncSession,
    book: Book,
    chat_id: uuid.UUID,
    question: str,
    history: list[Message],
    answer_language: str | None = None,
    task: str = "chat",
    family_safe: bool = False,
) -> tuple[str, list[dict], dict]:
    """Return (assistant_text, citations, token_usage).

    `task` routes the underlying LLM call. Use "chat" for the chat panel
    (Sonnet quality) and "highlight_explain" for one-off passage explainers
    (Gemini Flash Lite, way cheaper).

    If `answer_language` is set (e.g. the user is reading the French
    translation), the model is instructed to respond in that language even
    though source chunks are in the original.
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
        + safe_addendum(family_safe)
        + f"\n\n=== SOURCES ===\n{context_block}\n=== END SOURCES ==="
    )

    messages: list[ChatTurn] = [
        *_build_history(history),
        ChatTurn(role="user", content=question),
    ]

    resp = await chat_complete(
        task=task,
        system=system,
        messages=messages,
        max_tokens=MAX_TOKENS,
    )

    usage = {
        "input_tokens": resp.input_tokens,
        "output_tokens": resp.output_tokens,
        "model": resp.model,
    }
    log.info(
        "chat answer for chat=%s task=%s model=%s in=%s out=%s",
        chat_id, task, resp.model, resp.input_tokens, resp.output_tokens,
    )
    return resp.text.strip(), citations, usage


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


def _build_history(history: list[Message]) -> list[ChatTurn]:
    # Take the last HISTORY_TURNS *user/assistant* messages, in order.
    convo = [m for m in history if m.role in (MessageRole.user, MessageRole.assistant)]
    convo = convo[-HISTORY_TURNS:]
    return [
        ChatTurn(
            role="user" if m.role == MessageRole.user else "assistant",
            content=m.content,
        )
        for m in convo
    ]
