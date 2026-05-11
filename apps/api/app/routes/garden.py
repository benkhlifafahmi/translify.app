"""Garden gamification API — one garden per (user, book)."""
from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.users import current_active_user
from app.db import get_async_session
from app.models.book import Book
from app.models.garden import (
    Garden,
    GardenEventKind,
    GardenSpecies,
)
from app.schemas.garden import (
    FarmerSchema,
    GardenRead,
    GardenSummary,
    GardenUpdate,
    JournalEntry,
    RecordEventRequest,
    SubmitTendingRequest,
    TendingPerQuestion,
    TendingQuestion,
    TendingResult,
)
from app.services.garden import (
    apply_decay_in_place,
    days_until_thirst,
    describe_event,
    ensure_tending_pack,
    get_or_create_garden,
    journal_for_garden,
    last_leaf_at as svc_last_leaf_at,
    list_gardens_for_user,
    pages_read_delta,
    quiz_accuracy_percent,
    record_event,
    score_tending,
)

log = logging.getLogger(__name__)

router = APIRouter(prefix="/gardens", tags=["gardens"])


async def _get_owned_book(
    book_id: uuid.UUID, user: User, session: AsyncSession
) -> Book:
    row = await session.execute(
        select(Book).where(Book.id == book_id, Book.user_id == user.id)
    )
    book = row.scalar_one_or_none()
    if book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return book


async def _build_read_payload(
    session: AsyncSession, garden: Garden, book: Book
) -> GardenRead:
    journal_events = await journal_for_garden(session, garden.id, limit=10)
    journal: list[JournalEntry] = []
    for ev in journal_events:
        what, delta, warn = describe_event(ev)
        journal.append(
            JournalEntry(
                id=ev.id,
                at=ev.created_at,
                kind=ev.kind.value,  # type: ignore[arg-type]
                what=what,
                delta=delta,
                warn=warn,
            )
        )

    delta_pages = await pages_read_delta(session, garden.id)
    last_leaf = await svc_last_leaf_at(session, garden.id)
    accuracy = quiz_accuracy_percent(garden)

    return GardenRead(
        book_id=book.id,
        book_title=book.title,
        book_author=book.author,
        started_at=garden.started_at,
        species=garden.species.value,  # type: ignore[arg-type]
        farmer=FarmerSchema(**(garden.farmer or {})),
        stage=garden.stage,
        growth_percent=garden.growth_percent,
        pages_read=garden.pages_read,
        page_count=book.page_count or 0,
        pages_read_delta=delta_pages,
        quizzes_answered=garden.quizzes_answered,
        quizzes_total=garden.quiz_attempted_total,
        quiz_accuracy_percent=accuracy,
        vitality=garden.vitality,
        vitality_capacity=garden.vitality_capacity,
        days_until_thirst=days_until_thirst(garden),
        weekly_tending_due_at=garden.weekly_tending_due_at,
        streak_days=garden.streak_days,
        best_streak_days=garden.best_streak_days,
        new_leaves=garden.new_leaves,
        last_leaf_at=last_leaf,
        journal=journal,
    )


# ---------------------------------------------------------------------------
# Garden CRUD-ish
# ---------------------------------------------------------------------------

@router.get("", response_model=list[GardenSummary])
async def list_gardens(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> list[GardenSummary]:
    rows = await list_gardens_for_user(session, user.id)
    # apply_decay touched in-memory rows — persist any droplet drops.
    await session.commit()
    return [
        GardenSummary(
            book_id=book.id,
            book_title=book.title,
            book_author=book.author,
            species=garden.species.value,  # type: ignore[arg-type]
            stage=garden.stage,
            growth_percent=garden.growth_percent,
            health=garden.health.value,  # type: ignore[arg-type]
        )
        for garden, book in rows
    ]


@router.get("/{book_id}", response_model=GardenRead)
async def get_garden(
    book_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> GardenRead:
    book = await _get_owned_book(book_id, user, session)
    garden = await get_or_create_garden(session, user.id, book)
    payload = await _build_read_payload(session, garden, book)
    await session.commit()
    return payload


@router.patch("/{book_id}", response_model=GardenRead)
async def update_garden(
    update: GardenUpdate,
    book_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> GardenRead:
    book = await _get_owned_book(book_id, user, session)
    garden = await get_or_create_garden(session, user.id, book)
    if update.species is not None:
        garden.species = GardenSpecies(update.species)
    if update.farmer is not None:
        garden.farmer = update.farmer.model_dump()
    payload = await _build_read_payload(session, garden, book)
    await session.commit()
    return payload


# ---------------------------------------------------------------------------
# Events
# ---------------------------------------------------------------------------

@router.post(
    "/{book_id}/events",
    response_model=GardenRead,
    status_code=status.HTTP_201_CREATED,
)
async def record_garden_event(
    body: RecordEventRequest,
    book_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> GardenRead:
    book = await _get_owned_book(book_id, user, session)
    garden = await get_or_create_garden(session, user.id, book)
    await record_event(
        session,
        garden,
        user.id,
        GardenEventKind(body.kind),
        payload=body.payload or {},
    )
    payload = await _build_read_payload(session, garden, book)
    await session.commit()
    return payload


# ---------------------------------------------------------------------------
# Weekly tending
# ---------------------------------------------------------------------------

@router.get("/{book_id}/tending", response_model=list[TendingQuestion])
async def get_tending_pack(
    book_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> list[TendingQuestion]:
    book = await _get_owned_book(book_id, user, session)
    garden = await get_or_create_garden(session, user.id, book)
    pack = await ensure_tending_pack(session, garden, book)
    await session.commit()
    # The wire format strips the correct index — the answer is verified
    # server-side on submit.
    return [
        TendingQuestion(
            id=str(q["id"]),
            prompt=str(q["prompt"]),
            choices=[str(c) for c in q.get("choices", [])],
        )
        for q in pack
    ]


@router.post("/{book_id}/tending", response_model=TendingResult)
async def submit_tending(
    body: SubmitTendingRequest,
    book_id: uuid.UUID = Path(...),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
) -> TendingResult:
    book = await _get_owned_book(book_id, user, session)
    garden = await get_or_create_garden(session, user.id, book)
    apply_decay_in_place(garden)

    if not garden.current_tending:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No tending pack to submit — fetch one first.",
        )

    answers = [(a.question_id, a.choice_index) for a in body.answers]
    attempt = await score_tending(session, garden, user.id, answers)
    await session.commit()

    return TendingResult(
        score=attempt.score,
        total=attempt.total,
        passed=attempt.passed,
        growth_gained=attempt.growth_gained,
        vitality_restored=attempt.vitality_restored,
        new_stage=garden.stage,
        next_due_at=garden.weekly_tending_due_at,
        per_question=[TendingPerQuestion(**p) for p in attempt.answers],
    )

