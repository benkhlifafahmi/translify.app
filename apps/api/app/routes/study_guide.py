"""Study-guide API — generate AI study material for a book/video, and grade
free-text exercise answers.

One guide per (user, book). Generating replaces any existing guide. The stored
``sections`` keep each exercise's reference answer server-side; the read schema
strips it before sending to the client.
"""
from __future__ import annotations

import logging
import uuid

from anthropic import RateLimitError as AnthropicRateLimitError
from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.users import current_active_user
from app.billing.active_profile import resolve_active_profile
from app.billing.family_safe import is_family_safe_active
from app.billing.quota import require_active_plan
from app.book_access import visible_to
from app.db import get_async_session
from app.models.book import Book, BookStatus
from app.models.study_guide import StudyGuide
from app.models.translation import Translation
from app.schemas.study_guide import (
    GradeAnswerRequest,
    GradeAnswerResult,
    StudyGuideGenerateRequest,
    StudyGuideRead,
)
from app.services.study_guide import generate_study_guide, grade_answer

log = logging.getLogger(__name__)

router = APIRouter(tags=["study-guide"])


async def _get_owned_book(
    book_id: uuid.UUID, user: User, session: AsyncSession
) -> Book:
    result = await session.execute(
        select(Book).where(Book.id == book_id, visible_to(user))
    )
    book = result.scalar_one_or_none()
    if book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return book


async def _get_guide(
    book_id: uuid.UUID, user: User, session: AsyncSession
) -> StudyGuide | None:
    return await session.scalar(
        select(StudyGuide).where(
            StudyGuide.book_id == book_id, StudyGuide.user_id == user.id
        )
    )


async def _output_language(
    translation_id: uuid.UUID | None, book: Book, user: User, session: AsyncSession
) -> str | None:
    if translation_id is None:
        return None
    translation = await session.get(Translation, translation_id)
    if translation is None or translation.book_id != book.id or book.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Translation not found for this book.",
        )
    return translation.target_language


@router.get("/books/{book_id}/study-guide", response_model=StudyGuideRead)
async def get_study_guide(
    book_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> StudyGuide:
    await _get_owned_book(book_id, user, session)
    guide = await _get_guide(book_id, user, session)
    if guide is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No study guide yet for this book.",
        )
    return guide


@router.post(
    "/books/{book_id}/study-guide",
    response_model=StudyGuideRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_study_guide(
    payload: StudyGuideGenerateRequest,
    book_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> StudyGuide:
    book = await _get_owned_book(book_id, user, session)
    if book.status != BookStatus.ready:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Book is not ready yet.",
        )

    sub = await require_active_plan(user, session)
    active_profile = await resolve_active_profile(user, session)
    family_safe = is_family_safe_active(user, sub, active_profile)
    output_language = await _output_language(payload.translation_id, book, user, session)

    try:
        sections = await generate_study_guide(
            session=session,
            book_id=book.id,
            book_title=book.title,
            output_language=output_language,
            family_safe=family_safe,
        )
    except AnthropicRateLimitError as exc:
        log.warning("rate limit on study-guide generation for book=%s", book.id)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "ai_rate_limited",
                "message": "Translify's AI provider is at capacity. Wait a minute and try again.",
                "retry_after_seconds": 60,
            },
        ) from exc
    except Exception as exc:
        log.exception("study-guide generation failed for book=%s", book.id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Study-guide generation failed: {exc}",
        ) from exc

    # Upsert — one guide per (user, book). Replace the sections in place if a
    # guide already exists so we don't trip the unique constraint.
    guide = await _get_guide(book.id, user, session)
    if guide is None:
        guide = StudyGuide(book_id=book.id, user_id=user.id, sections=sections)
        session.add(guide)
    else:
        guide.sections = sections
    await session.commit()
    await session.refresh(guide)
    return guide


@router.post("/books/{book_id}/study-guide/grade", response_model=GradeAnswerResult)
async def grade_study_answer(
    payload: GradeAnswerRequest,
    book_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> GradeAnswerResult:
    book = await _get_owned_book(book_id, user, session)
    sub = await require_active_plan(user, session)
    active_profile = await resolve_active_profile(user, session)
    family_safe = is_family_safe_active(user, sub, active_profile)
    output_language = await _output_language(payload.translation_id, book, user, session)

    guide = await _get_guide(book_id, user, session)
    if guide is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No study guide to grade against.",
        )

    exercise: dict | None = None
    section_title = ""
    for sec in guide.sections:
        if not isinstance(sec, dict):
            continue
        for ex in sec.get("exercises", []):
            if isinstance(ex, dict) and str(ex.get("id")) == payload.exercise_id:
                exercise = ex
                section_title = str(sec.get("title", ""))
                break
        if exercise is not None:
            break

    if exercise is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found in this study guide.",
        )

    try:
        result = await grade_answer(
            question=str(exercise.get("question", "")),
            reference_answer=str(exercise.get("reference_answer", "")),
            section_title=section_title,
            learner_answer=payload.answer.strip(),
            output_language=output_language,
            family_safe=family_safe,
        )
    except AnthropicRateLimitError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "ai_rate_limited",
                "message": "Translify's AI provider is at capacity. Wait a minute and try again.",
                "retry_after_seconds": 60,
            },
        ) from exc
    except Exception as exc:
        log.exception("grading failed for book=%s exercise=%s", book_id, payload.exercise_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Grading failed: {exc}",
        ) from exc

    return GradeAnswerResult(exercise_id=payload.exercise_id, **result)
