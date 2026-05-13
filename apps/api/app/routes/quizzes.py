"""Quiz API — generate, list, take, and score quizzes for a book."""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from anthropic import RateLimitError as AnthropicRateLimitError
from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.users import current_active_user
from app.billing.active_profile import resolve_active_profile
from app.billing.family_safe import is_family_safe_active
from app.billing.quota import reserve_quiz_for_book
from app.db import get_async_session
from app.models.book import Book, BookStatus
from app.models.quiz import Quiz, QuizAttempt
from app.models.translation import Translation
from app.schemas.quiz import (
    QuizAnswerResult,
    QuizAttemptCreate,
    QuizAttemptRead,
    QuizCreateRequest,
    QuizGradeRequest,
    QuizQuestionPublic,
    QuizRead,
    QuizSummary,
)
from app.services.quiz import generate_quiz

log = logging.getLogger(__name__)

router = APIRouter(tags=["quizzes"])


async def _get_owned_book(
    book_id: uuid.UUID, user: User, session: AsyncSession
) -> Book:
    # Seed books are visible to everyone — see app.book_access.visible_to.
    from app.book_access import visible_to
    result = await session.execute(
        select(Book).where(Book.id == book_id, visible_to(user))
    )
    book = result.scalar_one_or_none()
    if book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return book


async def _get_owned_quiz(
    quiz_id: uuid.UUID, user: User, session: AsyncSession
) -> Quiz:
    result = await session.execute(
        select(Quiz).where(Quiz.id == quiz_id, Quiz.user_id == user.id)
    )
    quiz = result.scalar_one_or_none()
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    return quiz


def _public_questions(quiz: Quiz) -> list[QuizQuestionPublic]:
    out: list[QuizQuestionPublic] = []
    for q in quiz.questions:
        if not isinstance(q, dict):
            continue
        out.append(
            QuizQuestionPublic(
                id=str(q.get("id", "")),
                type=str(q.get("type", "mcq")),
                prompt=str(q.get("prompt", "")),
                choices=[str(c) for c in q.get("choices", [])],
            )
        )
    return out


@router.get("/books/{book_id}/quizzes", response_model=list[QuizSummary])
async def list_book_quizzes(
    book_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> list[QuizSummary]:
    await _get_owned_book(book_id, user, session)
    result = await session.execute(
        select(Quiz)
        .where(Quiz.book_id == book_id, Quiz.user_id == user.id)
        .order_by(Quiz.created_at.desc())
    )
    quizzes = list(result.scalars().all())
    return [
        QuizSummary(
            id=q.id,
            book_id=q.book_id,
            title=q.title,
            scope_label=q.scope_label,
            question_count=len(q.questions or []),
            created_at=q.created_at,
        )
        for q in quizzes
    ]


@router.post(
    "/books/{book_id}/quizzes",
    response_model=QuizRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_quiz(
    payload: QuizCreateRequest,
    book_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> QuizRead:
    book = await _get_owned_book(book_id, user, session)
    if book.status != BookStatus.ready:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Book is not ready yet.",
        )

    # Plan + per-book quiz quota gate — raises 402 with structured detail.
    sub = await reserve_quiz_for_book(user, book.id, session)
    active_profile = await resolve_active_profile(user, session)
    family_safe = is_family_safe_active(user, sub, active_profile)

    output_language: str | None = None
    if payload.translation_id is not None:
        translation = await session.get(Translation, payload.translation_id)
        if (
            translation is None
            or translation.book_id != book.id
            or book.user_id != user.id
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Translation not found for this book.",
            )
        output_language = translation.target_language

    try:
        questions = await generate_quiz(
            session=session,
            book_id=book.id,
            book_title=book.title,
            question_count=payload.question_count,
            output_language=output_language,
            family_safe=family_safe,
        )
    except AnthropicRateLimitError as exc:
        # Anthropic per-minute token quota — distinct from our own quota.
        # 429 lets the frontend show a "try again in a minute" message
        # instead of a generic 502.
        log.warning("Anthropic rate limit hit for quiz on book=%s", book.id)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "ai_rate_limited",
                "message": "Translify's AI provider is at capacity right now. Wait about a minute and try again.",
                "retry_after_seconds": 60,
            },
        ) from exc
    except Exception as exc:
        log.exception("quiz generation failed for book=%s", book.id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Quiz generation failed: {exc}",
        ) from exc

    quiz = Quiz(
        book_id=book.id,
        user_id=user.id,
        title=f"Quiz — {book.title}"[:500],
        scope_label=None,
        questions=questions,
    )
    session.add(quiz)
    await session.commit()
    await session.refresh(quiz)

    return QuizRead(
        id=quiz.id,
        book_id=quiz.book_id,
        title=quiz.title,
        scope_label=quiz.scope_label,
        questions=_public_questions(quiz),
        created_at=quiz.created_at,
    )


@router.get("/quizzes/{quiz_id}", response_model=QuizRead)
async def get_quiz(
    quiz_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> QuizRead:
    quiz = await _get_owned_quiz(quiz_id, user, session)
    return QuizRead(
        id=quiz.id,
        book_id=quiz.book_id,
        title=quiz.title,
        scope_label=quiz.scope_label,
        questions=_public_questions(quiz),
        created_at=quiz.created_at,
    )


@router.post("/quizzes/{quiz_id}/grade", response_model=QuizAnswerResult)
async def grade_one(
    payload: QuizGradeRequest,
    quiz_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> QuizAnswerResult:
    """Grade a single question without persisting an attempt.

    Used by the mobile card-by-card UI so the user can see Lumi's reaction
    immediately. The full attempt is still submitted once at the end via
    /quizzes/{id}/attempts to keep XP and Garden side effects in one place.
    """
    quiz = await _get_owned_quiz(quiz_id, user, session)
    target: dict | None = None
    for q in quiz.questions:
        if isinstance(q, dict) and str(q.get("id", "")) == payload.question_id:
            target = q
            break
    if target is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found in this quiz.",
        )
    correct_index = int(target.get("answer_index", -1))
    given_index = int(payload.answer_index)
    is_correct = given_index == correct_index and correct_index >= 0
    return QuizAnswerResult(
        question_id=payload.question_id,
        given_index=given_index,
        correct_index=correct_index,
        correct=is_correct,
        explanation=str(target.get("explanation", "")),
    )


@router.post(
    "/quizzes/{quiz_id}/attempts",
    response_model=QuizAttemptRead,
    status_code=status.HTTP_201_CREATED,
)
async def submit_attempt(
    payload: QuizAttemptCreate,
    quiz_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> QuizAttemptRead:
    quiz = await _get_owned_quiz(quiz_id, user, session)

    by_id: dict[str, dict] = {
        str(q.get("id")): q for q in quiz.questions if isinstance(q, dict) and q.get("id")
    }
    answers_by_qid: dict[str, int] = {a.question_id: a.answer_index for a in payload.answers}

    results: list[QuizAnswerResult] = []
    score = 0
    total = len(quiz.questions)
    for q in quiz.questions:
        if not isinstance(q, dict):
            continue
        qid = str(q.get("id", ""))
        correct_index = int(q.get("answer_index", -1))
        given_index = int(answers_by_qid.get(qid, -1))
        is_correct = given_index == correct_index and correct_index >= 0
        if is_correct:
            score += 1
        results.append(
            QuizAnswerResult(
                question_id=qid,
                given_index=given_index,
                correct_index=correct_index,
                correct=is_correct,
                explanation=str(q.get("explanation", "")),
            )
        )

    attempt = QuizAttempt(
        quiz_id=quiz.id,
        user_id=user.id,
        answers=[r.model_dump() for r in results],
        score=score,
        total=total,
    )
    session.add(attempt)
    await session.commit()
    await session.refresh(attempt)

    return QuizAttemptRead(
        id=attempt.id,
        quiz_id=attempt.quiz_id,
        score=attempt.score,
        total=attempt.total,
        results=results,
        created_at=attempt.created_at or datetime.now(timezone.utc),
    )
