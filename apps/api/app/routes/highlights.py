"""Highlights API — save, list, update, delete; ask-AI on a saved highlight."""
from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.users import current_active_user
from app.billing.quota import require_active_plan
from app.db import get_async_session
from app.models.book import Book
from app.models.highlight import Highlight
from app.schemas.highlight import (
    AskAiRequest,
    HighlightCreate,
    HighlightRead,
    HighlightUpdate,
)
from app.services.highlight_ai import explain_highlight

log = logging.getLogger(__name__)

router = APIRouter(tags=["highlights"])


async def _get_owned_book(
    book_id: uuid.UUID, user: User, session: AsyncSession
) -> Book:
    result = await session.execute(
        select(Book).where(Book.id == book_id, Book.user_id == user.id)
    )
    book = result.scalar_one_or_none()
    if book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return book


async def _get_owned_highlight(
    highlight_id: uuid.UUID, user: User, session: AsyncSession
) -> Highlight:
    result = await session.execute(
        select(Highlight).where(
            Highlight.id == highlight_id, Highlight.user_id == user.id
        )
    )
    hl = result.scalar_one_or_none()
    if hl is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Highlight not found")
    return hl


@router.get("/highlights", response_model=list[HighlightRead])
async def list_all_highlights(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> list[Highlight]:
    """All of the user's highlights across the library, newest first."""
    result = await session.execute(
        select(Highlight)
        .where(Highlight.user_id == user.id)
        .order_by(Highlight.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/books/{book_id}/highlights", response_model=list[HighlightRead])
async def list_book_highlights(
    book_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> list[Highlight]:
    await _get_owned_book(book_id, user, session)
    result = await session.execute(
        select(Highlight)
        .where(Highlight.user_id == user.id, Highlight.book_id == book_id)
        .order_by(Highlight.page.asc(), Highlight.created_at.asc())
    )
    return list(result.scalars().all())


@router.post(
    "/books/{book_id}/highlights",
    response_model=HighlightRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_highlight(
    payload: HighlightCreate,
    book_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> Highlight:
    book = await _get_owned_book(book_id, user, session)
    hl = Highlight(
        user_id=user.id,
        book_id=book.id,
        page=payload.page,
        text=payload.text.strip(),
        color=payload.color,
        note=(payload.note or None),
        position_cfi=(payload.position_cfi or None),
    )
    session.add(hl)
    await session.commit()
    await session.refresh(hl)
    return hl


@router.patch("/highlights/{highlight_id}", response_model=HighlightRead)
async def update_highlight(
    payload: HighlightUpdate,
    highlight_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> Highlight:
    hl = await _get_owned_highlight(highlight_id, user, session)
    data = payload.model_dump(exclude_unset=True)
    if "note" in data:
        hl.note = (data["note"] or None)
    if "color" in data and data["color"] is not None:
        hl.color = data["color"]
    await session.commit()
    await session.refresh(hl)
    return hl


@router.delete("/highlights/{highlight_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_highlight(
    highlight_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> None:
    hl = await _get_owned_highlight(highlight_id, user, session)
    await session.delete(hl)
    await session.commit()


@router.post("/highlights/{highlight_id}/ask-ai", response_model=HighlightRead)
async def ask_ai(
    payload: AskAiRequest,
    highlight_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> Highlight:
    # Live-cost path: gate on active plan, same as chat.
    await require_active_plan(user, session)
    hl = await _get_owned_highlight(highlight_id, user, session)
    book = await session.get(Book, hl.book_id)
    if book is None or book.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    try:
        answer, _usage = await explain_highlight(
            session=session,
            book=book,
            highlight_id=hl.id,
            highlight_text=hl.text,
            page=hl.page,
            question=payload.question,
        )
    except Exception as exc:
        log.exception("ask-ai failed for highlight=%s", hl.id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Assistant failed: {exc}",
        ) from exc

    hl.ai_question = (payload.question or "").strip() or None
    hl.ai_answer = answer
    await session.commit()
    await session.refresh(hl)
    return hl
