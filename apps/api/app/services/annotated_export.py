"""Annotated-export — package a book's highlights + notes as a portable file.

Scholar / Family feature. Renders to Markdown today (universally readable,
plays well with Obsidian/Notion/Bear). Other formats can be added by writing
sibling renderers; the shape of `_collect()` won't change.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.book import Book
from app.models.highlight import Highlight


def _stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")


async def _collect(book_id: uuid.UUID, session: AsyncSession) -> list[Highlight]:
    """Highlights for one book, page-ordered, then chronological inside a page."""
    result = await session.execute(
        select(Highlight)
        .where(Highlight.book_id == book_id)
        .order_by(Highlight.page.asc(), Highlight.created_at.asc())
    )
    return list(result.scalars().all())


def render_markdown(book: Book, highlights: list[Highlight]) -> str:
    """Render a single Markdown document for the book + its highlights.

    Layout:
      # Title — by Author
      > one-line metadata: format · pages · exported timestamp
      ---
      ## Page N
      > "highlighted text"
      [color tag]
      Note: the user's note (if any)
      Lumi: AI answer (if any)
    """
    lines: list[str] = []

    # Header
    lines.append(f"# {book.title}")
    if book.author:
        lines.append(f"*by {book.author}*")
    meta_parts: list[str] = [book.format.upper()]
    if book.page_count:
        meta_parts.append(f"{book.page_count} pages")
    if book.source_language:
        meta_parts.append(book.source_language.upper())
    meta_parts.append(f"exported {_stamp()}")
    lines.append("")
    lines.append(f"> {' · '.join(meta_parts)}")
    lines.append(f"> {len(highlights)} annotation" + ("s" if len(highlights) != 1 else ""))
    lines.append("")
    lines.append("---")
    lines.append("")

    if not highlights:
        lines.append("_No annotations yet — go highlight a passage in the reader._")
        lines.append("")
        return "\n".join(lines)

    # Group by page
    current_page: int | None = None
    for h in highlights:
        if h.page != current_page:
            current_page = h.page
            lines.append(f"## Page {h.page}")
            lines.append("")

        # Quoted highlight text — escape any leading > on text lines.
        for tline in (h.text or "").splitlines():
            lines.append(f"> {tline.lstrip('>')}")
        lines.append(f"`{h.color.value if hasattr(h.color, 'value') else h.color}`")
        lines.append("")

        if h.note:
            lines.append(f"**Note:** {h.note.strip()}")
            lines.append("")
        if h.ai_answer:
            lines.append(f"**Lumi:** {h.ai_answer.strip()}")
            lines.append("")

    return "\n".join(lines)


async def render_book_export(
    book: Book, session: AsyncSession
) -> tuple[str, str]:
    """Return (filename, body) for a Markdown export of the book's annotations."""
    highlights = await _collect(book.id, session)
    body = render_markdown(book, highlights)
    safe_title = "".join(c if c.isalnum() or c in " -_" else "" for c in book.title).strip()
    filename = f"{safe_title or 'translify-notes'} — annotations.md"
    return filename, body
