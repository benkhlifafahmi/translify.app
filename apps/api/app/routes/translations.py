"""Translation API — start, list, retrieve translated documents."""
from __future__ import annotations

import logging
import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.users import current_active_user
from app.billing.quota import require_active_plan
from app.db import get_async_session
from app.models.book import Book, BookStatus
from app.models.translation import Translation, TranslationProvider, TranslationStatus
from app.schemas.translation import (
    FileUrlResponse,
    TranslationCreateRequest,
    TranslationRead,
)
from app.storage import presigned_get_url
from app.workers.jobs import translate_book
from app.workers.queue import QUEUE_TRANSLATE, get_queue

log = logging.getLogger(__name__)

router = APIRouter(tags=["translations"])

FILE_URL_EXPIRY = timedelta(hours=1)


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


async def _get_owned_translation(
    translation_id: uuid.UUID, user: User, session: AsyncSession
) -> Translation:
    result = await session.execute(
        select(Translation)
        .join(Book, Book.id == Translation.book_id)
        .where(Translation.id == translation_id, Book.user_id == user.id)
    )
    translation = result.scalar_one_or_none()
    if translation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Translation not found"
        )
    return translation


@router.get("/books/{book_id}/translations", response_model=list[TranslationRead])
async def list_translations(
    book_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> list[Translation]:
    await _get_owned_book(book_id, user, session)
    result = await session.execute(
        select(Translation)
        .where(Translation.book_id == book_id)
        .order_by(Translation.created_at.desc())
    )
    return list(result.scalars().all())


@router.post(
    "/books/{book_id}/translations",
    response_model=TranslationRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_translation(
    payload: TranslationCreateRequest,
    book_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> Translation:
    book = await _get_owned_book(book_id, user, session)
    if book.status != BookStatus.ready:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Book is not ready yet. Wait for processing to finish.",
        )

    # Translations are a paid feature — gate on active plan.
    await require_active_plan(user, session)

    target_lang = payload.target_language.strip().lower()
    if not target_lang:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="target_language is required",
        )

    if book.source_language and book.source_language.lower() == target_lang:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target language matches the source language.",
        )

    # If a translation in this language already exists, return it instead of
    # creating a duplicate (the unique constraint would block it anyway).
    existing = await session.execute(
        select(Translation).where(
            Translation.book_id == book_id,
            Translation.target_language == target_lang,
        )
    )
    existing_t = existing.scalar_one_or_none()
    if existing_t is not None:
        if existing_t.status == TranslationStatus.failed:
            # Allow retrying a failed translation by re-queuing.
            existing_t.status = TranslationStatus.queued
            existing_t.error_message = None
            existing_t.progress_pct = 0
            existing_t.output_file_key = None
            existing_t.output_format = None
            await session.commit()
            await session.refresh(existing_t)
            _enqueue(existing_t.id)
        return existing_t

    translation = Translation(
        book_id=book_id,
        target_language=target_lang,
        provider=TranslationProvider.anthropic,
        status=TranslationStatus.queued,
    )
    session.add(translation)
    await session.commit()
    await session.refresh(translation)

    _enqueue(translation.id)
    return translation


@router.get("/translations/{translation_id}", response_model=TranslationRead)
async def get_translation(
    translation_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> Translation:
    return await _get_owned_translation(translation_id, user, session)


@router.post("/translations/{translation_id}/retry", response_model=TranslationRead)
async def retry_translation(
    translation_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> Translation:
    """Re-run a translation in place. Useful in dev when tweaking the engine."""
    await require_active_plan(user, session)
    translation = await _get_owned_translation(translation_id, user, session)
    if translation.status == TranslationStatus.in_progress:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Translation is already in progress.",
        )
    translation.status = TranslationStatus.queued
    translation.error_message = None
    translation.progress_pct = 0
    translation.output_file_key = None
    translation.output_format = None
    translation.completed_at = None
    await session.commit()
    await session.refresh(translation)
    _enqueue(translation.id)
    return translation


@router.get("/translations/{translation_id}/file-url", response_model=FileUrlResponse)
async def get_translation_file_url(
    translation_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> FileUrlResponse:
    translation = await _get_owned_translation(translation_id, user, session)
    if translation.status != TranslationStatus.ready or not translation.output_file_key:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Translation is not ready.",
        )
    url = presigned_get_url(translation.output_file_key, expires=FILE_URL_EXPIRY)
    return FileUrlResponse(
        url=url, expires_in_seconds=int(FILE_URL_EXPIRY.total_seconds())
    )


def _enqueue(translation_id: uuid.UUID) -> None:
    get_queue(QUEUE_TRANSLATE).enqueue(
        translate_book,
        str(translation_id),
        job_id=f"translate_{translation_id}",
        job_timeout=60 * 60 * 2,  # 2 hours
        result_ttl=60 * 60,
        failure_ttl=24 * 60 * 60,
    )
