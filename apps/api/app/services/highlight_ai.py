"""Ask AI about a highlighted passage — thin wrapper over the RAG chat service."""
from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.book import Book
from app.services.chat import answer_question

DEFAULT_QUESTION = "Explain this passage in plain language."


async def explain_highlight(
    *,
    session: AsyncSession,
    book: Book,
    highlight_id: uuid.UUID,
    highlight_text: str,
    page: int,
    question: str | None,
    answer_language: str | None = None,
) -> tuple[str, dict]:
    """Return (answer_text, usage). Reuses the book's RAG context."""
    q = (question or "").strip() or DEFAULT_QUESTION
    page_label = f" (page {page})" if page else ""
    framed = (
        f'The reader highlighted this passage from the book{page_label}:\n\n'
        f'"""\n{highlight_text.strip()}\n"""\n\n'
        f"Their question about it: {q}\n\n"
        "Answer using the book's content. If the passage is self-contained, "
        "you may answer directly; otherwise pull from the surrounding sources."
    )
    text, _citations, usage = await answer_question(
        session=session,
        book=book,
        chat_id=highlight_id,  # only used as a logging key
        question=framed,
        history=[],
        answer_language=answer_language,
    )
    return text, usage
