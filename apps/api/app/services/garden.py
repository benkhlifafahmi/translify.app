"""Garden gamification service — decay, growth, scoring.

The reads in the route layer are kept simple by denormalizing state onto the
gardens row: every event mutates the row in the same transaction it was
written. Decay (vitality dropping over time without activity) is computed
lazily on read — there's no cron yet.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.book import Book
from app.models.garden import (
    Garden,
    GardenEvent,
    GardenEventKind,
    GardenHealth,
    GardenSpecies,
    GardenTendingAttempt,
)

WEEKLY_TENDING_HOURS = 24 * 7
DECAY_HOURS_PER_DROPLET = 24
PASS_THRESHOLD = 3  # out of 5
TENDING_QUESTION_COUNT = 5

DEFAULT_FARMER = {
    "hat": "straw",
    "coat": "earth",
    "skin": "tan",
    "tool": "watering-can",
    "name": "",
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Pure rule functions
# ---------------------------------------------------------------------------

def stage_from_growth(growth_percent: int) -> int:
    """Map 0..100 → 0..6 stages. Bloom hits at 100%."""
    if growth_percent <= 0:
        return 0
    return min(6, max(1, growth_percent // 15 + 1))


def health_from_state(vitality: int, capacity: int) -> GardenHealth:
    """Derived health enum — depends on vitality, not growth."""
    if vitality <= 0:
        return GardenHealth.dying
    if vitality == 1:
        return GardenHealth.wilting
    if vitality >= max(2, capacity - 1):
        return GardenHealth.thriving
    return GardenHealth.budding


def event_rewards(kind: GardenEventKind, payload: dict) -> tuple[int, int]:
    """Pure: returns (growth_delta, vitality_delta) for a given event.

    Reading 10+ pages tops up a droplet; quizzes give growth proportional to
    correct count; tending is handled separately in score_tending.
    """
    if kind == GardenEventKind.read:
        pages = int(payload.get("pages") or 0)
        # 1% growth per 4 pages, capped at +6%. Vitality bumps when the user
        # actually settles in for a session (10+ pages).
        growth = min(6, pages // 4)
        vitality = 1 if pages >= 10 else 0
        return growth, vitality
    if kind == GardenEventKind.quiz:
        correct = int(payload.get("correct") or 0)
        total = int(payload.get("total") or 0)
        if total <= 0:
            return 0, 0
        # Quizzes outside the weekly tending — small reward.
        return min(8, correct * 2), 1 if correct >= total // 2 else 0
    if kind == GardenEventKind.water:
        return 0, 1
    if kind == GardenEventKind.translate:
        # The translation pipeline completing on a chapter doesn't bump
        # vitality — it just signals progress.
        return 2, 0
    if kind == GardenEventKind.skip:
        return 0, -1
    if kind == GardenEventKind.tend:
        # Tending uses its own scoring; the event is recorded for the journal
        # only, with deltas set explicitly by score_tending.
        return 0, 0
    return 0, 0


# ---------------------------------------------------------------------------
# Decay
# ---------------------------------------------------------------------------

def apply_decay_in_place(garden: Garden, now: datetime | None = None) -> None:
    """Drain vitality based on elapsed time since last_decay_at.

    Idempotent — calling multiple times within the same hour is a no-op. We
    only debit droplets, never add (water/read events do that elsewhere).
    """
    now = now or _now()
    elapsed = now - garden.last_decay_at
    hours = elapsed.total_seconds() / 3600.0
    if hours < DECAY_HOURS_PER_DROPLET:
        return
    drops = int(hours // DECAY_HOURS_PER_DROPLET)
    new_vit = max(0, garden.vitality - drops)
    if new_vit != garden.vitality:
        garden.vitality = new_vit
        garden.health = health_from_state(garden.vitality, garden.vitality_capacity)
    # Advance the marker by exactly the drops we consumed — leftover minutes
    # carry forward so we don't lose fractional progress.
    garden.last_decay_at = garden.last_decay_at + timedelta(hours=drops * DECAY_HOURS_PER_DROPLET)


def days_until_thirst(garden: Garden) -> int:
    """How many full days of reserve the plant has, rounded down."""
    return max(0, garden.vitality)


# ---------------------------------------------------------------------------
# Read paths
# ---------------------------------------------------------------------------

async def _get_owned_book_or_none(
    session: AsyncSession, user_id: uuid.UUID, book_id: uuid.UUID
) -> Book | None:
    row = await session.execute(
        select(Book).where(Book.id == book_id, Book.user_id == user_id)
    )
    return row.scalar_one_or_none()


async def get_or_create_garden(
    session: AsyncSession, user_id: uuid.UUID, book: Book
) -> Garden:
    """Return the (user, book) garden, creating it on first call."""
    row = await session.execute(
        select(Garden).where(Garden.user_id == user_id, Garden.book_id == book.id)
    )
    garden = row.scalar_one_or_none()
    if garden is not None:
        apply_decay_in_place(garden)
        return garden

    now = _now()
    garden = Garden(
        user_id=user_id,
        book_id=book.id,
        species=GardenSpecies.ficus,
        farmer=dict(DEFAULT_FARMER),
        started_at=now,
        last_event_at=now,
        last_decay_at=now,
        weekly_tending_due_at=now + timedelta(hours=WEEKLY_TENDING_HOURS),
    )
    session.add(garden)
    await session.flush()
    return garden


async def list_gardens_for_user(
    session: AsyncSession, user_id: uuid.UUID
) -> list[tuple[Garden, Book]]:
    """One row per garden, joined to its book for title/author display."""
    rows = await session.execute(
        select(Garden, Book)
        .join(Book, Book.id == Garden.book_id)
        .where(Garden.user_id == user_id)
        .order_by(Garden.updated_at.desc())
    )
    result: list[tuple[Garden, Book]] = []
    for garden, book in rows.all():
        apply_decay_in_place(garden)
        result.append((garden, book))
    return result


# ---------------------------------------------------------------------------
# Write paths
# ---------------------------------------------------------------------------

async def record_event(
    session: AsyncSession,
    garden: Garden,
    user_id: uuid.UUID,
    kind: GardenEventKind,
    payload: dict | None = None,
    *,
    growth_delta: int | None = None,
    vitality_delta: int | None = None,
) -> GardenEvent:
    """Append an event and update the garden state. Caller commits.

    When `growth_delta` / `vitality_delta` are omitted, they're computed from
    `event_rewards`. Pass them explicitly for tending events, where rewards
    come from the score.
    """
    payload = payload or {}
    apply_decay_in_place(garden)

    if growth_delta is None or vitality_delta is None:
        g, v = event_rewards(kind, payload)
        if growth_delta is None: growth_delta = g
        if vitality_delta is None: vitality_delta = v

    now = _now()
    event = GardenEvent(
        garden_id=garden.id,
        user_id=user_id,
        kind=kind,
        payload=payload,
        growth_delta=growth_delta,
        vitality_delta=vitality_delta,
    )
    session.add(event)

    garden.growth_percent = max(0, min(100, garden.growth_percent + growth_delta))
    garden.stage = stage_from_growth(garden.growth_percent)
    garden.vitality = max(0, min(garden.vitality_capacity, garden.vitality + vitality_delta))
    garden.health = health_from_state(garden.vitality, garden.vitality_capacity)
    garden.last_event_at = now

    # Counter mirrors — easier on the read path than re-aggregating events.
    if kind == GardenEventKind.read:
        pages = int(payload.get("pages") or 0)
        garden.pages_read += max(0, pages)
        if growth_delta > 0:
            garden.new_leaves += growth_delta
    elif kind == GardenEventKind.quiz:
        correct = int(payload.get("correct") or 0)
        total = int(payload.get("total") or 0)
        garden.quizzes_answered += 1
        garden.quiz_correct_total += correct
        garden.quiz_attempted_total += total

    _update_streak(garden, now)
    return event


def _update_streak(garden: Garden, now: datetime) -> None:
    """Maintain `streak_days` / `best_streak_days` based on event days."""
    last = garden.last_event_at
    if last is None:
        garden.streak_days = 1
    else:
        gap_days = (now.date() - last.date()).days
        if gap_days == 0:
            # Same day — no change.
            return
        if gap_days == 1:
            garden.streak_days += 1
        else:
            garden.streak_days = 1
    garden.best_streak_days = max(garden.best_streak_days, garden.streak_days)


# ---------------------------------------------------------------------------
# Journal
# ---------------------------------------------------------------------------

async def journal_for_garden(
    session: AsyncSession, garden_id: uuid.UUID, limit: int = 10
) -> list[GardenEvent]:
    rows = await session.execute(
        select(GardenEvent)
        .where(GardenEvent.garden_id == garden_id)
        .order_by(desc(GardenEvent.created_at))
        .limit(limit)
    )
    return list(rows.scalars().all())


def describe_event(ev: GardenEvent) -> tuple[str, str, bool]:
    """Format one event for the frontend journal. Returns (what, delta, warn)."""
    kind = ev.kind
    payload = ev.payload or {}
    warn = ev.vitality_delta < 0

    if kind == GardenEventKind.read:
        pages = int(payload.get("pages") or 0)
        chapter = payload.get("chapter")
        what = (
            f"Read <em>chapter {chapter}, {pages} pages</em>"
            if chapter
            else f"Read <em>{pages} pages</em>"
        )
        delta = f"+ {ev.growth_delta} leaves" if ev.growth_delta else "+ progress"
    elif kind == GardenEventKind.quiz:
        correct = int(payload.get("correct") or 0)
        total = int(payload.get("total") or 0)
        what = f"Quiz on this book — <em>{correct}/{total} correct</em>"
        delta = f"+ {ev.growth_delta}% growth" if ev.growth_delta else "+ a leaf"
    elif kind == GardenEventKind.water:
        what = "Watered — finished a reading session"
        delta = "+ 1 droplet"
    elif kind == GardenEventKind.skip:
        what = "Skipped tending — <em>the plant went a day without water</em>"
        delta = f"− {abs(ev.vitality_delta)} droplet" if ev.vitality_delta else "− 1 droplet"
    elif kind == GardenEventKind.translate:
        pages = int(payload.get("pages") or 0)
        pair = payload.get("pair") or ""
        what = f"Translation completed — <em>{pair}, {pages} pp.</em>"
        delta = "+ stage advance"
    elif kind == GardenEventKind.tend:
        score = int(payload.get("score") or 0)
        total = int(payload.get("total") or 0)
        passed = bool(payload.get("passed"))
        what = f"Weekly tending — <em>{'passed' if passed else 'missed'} with {score}/{total}</em>"
        delta = f"+ {ev.growth_delta}% growth" if passed else "− 1 droplet"
        warn = not passed
    else:
        what = str(kind.value)
        delta = ""
    return what, delta, warn


# ---------------------------------------------------------------------------
# Weekly tending
# ---------------------------------------------------------------------------

def stock_tending_questions(book: Book) -> list[dict]:
    """Sample, generic tending questions until the AI generator is wired.

    Returns a list of {id, prompt, choices, correct_index, explanation}. The
    real generator will use the book summary + chapters since the last
    tending — these are placeholders so the loop is end-to-end testable.
    """
    title = book.title
    return [
        {
            "id": "t1",
            "prompt": f"In your own reading of {title}, which chapter introduced the central conflict?",
            "choices": ["Chapter 1", "Chapter 2", "Chapter 3", "Chapter 4"],
            "correct_index": 1,
            "explanation": "Marked when you first added this book.",
        },
        {
            "id": "t2",
            "prompt": f"Which character drives the narrative in {title}?",
            "choices": ["The protagonist", "An antagonist", "A narrator", "A supporting cast"],
            "correct_index": 0,
            "explanation": "Placeholder until the AI generator is enabled.",
        },
        {
            "id": "t3",
            "prompt": "Which theme has the book most emphasized so far?",
            "choices": ["Memory", "Power", "Love", "Time"],
            "correct_index": 3,
            "explanation": "Generated when the tending feature is fully wired to the AI.",
        },
        {
            "id": "t4",
            "prompt": "Which device is the book best known for?",
            "choices": ["Foreshadowing", "Magical realism", "Stream of consciousness", "Epistolary form"],
            "correct_index": 1,
            "explanation": "Sample question — will be replaced by chapter-scoped AI question.",
        },
        {
            "id": "t5",
            "prompt": "How would you summarize your progress this week?",
            "choices": ["Light", "Steady", "Deep", "Spotty"],
            "correct_index": 1,
            "explanation": "Self-rated; any answer that matches your activity counts.",
        },
    ]


def make_tending_pack(book: Book) -> list[dict]:
    """For now: just the stock pack. Future: hand-off to AI question generator."""
    return stock_tending_questions(book)


async def ensure_tending_pack(
    session: AsyncSession, garden: Garden, book: Book
) -> list[dict]:
    if not garden.current_tending:
        garden.current_tending = make_tending_pack(book)
    return garden.current_tending


async def score_tending(
    session: AsyncSession,
    garden: Garden,
    user_id: uuid.UUID,
    answers: list[tuple[str, int]],
) -> GardenTendingAttempt:
    """Grade a tending pack, persist the attempt, update the garden."""
    pack = list(garden.current_tending or [])
    by_id = {str(q["id"]): q for q in pack}
    answer_map = {qid: idx for qid, idx in answers}

    per_question = []
    score = 0
    total = len(pack)
    for q in pack:
        qid = str(q["id"])
        correct_index = int(q.get("correct_index", -1))
        given_index = int(answer_map.get(qid, -1))
        is_correct = given_index == correct_index and correct_index >= 0
        if is_correct:
            score += 1
        per_question.append({
            "id": qid,
            "correct": is_correct,
            "given_index": given_index,
            "correct_index": correct_index,
            "explanation": q.get("explanation"),
        })
    passed = score >= PASS_THRESHOLD

    if passed:
        growth_gained = 8 + score * 2
        vitality_restored = garden.vitality_capacity - garden.vitality
    else:
        growth_gained = max(0, score - 1)
        vitality_restored = 0

    attempt = GardenTendingAttempt(
        garden_id=garden.id,
        user_id=user_id,
        score=score,
        total=total,
        passed=passed,
        growth_gained=growth_gained,
        vitality_restored=vitality_restored,
        answers=per_question,
    )
    session.add(attempt)

    # Record the journal event with explicit deltas so describe_event renders
    # the right message.
    await record_event(
        session,
        garden,
        user_id,
        GardenEventKind.tend,
        payload={"score": score, "total": total, "passed": passed},
        growth_delta=growth_gained,
        vitality_delta=vitality_restored if passed else -1,
    )

    # Reset the tending window. Clear the cached pack so a fresh one is built
    # for next week.
    now = _now()
    garden.last_tended_at = now
    garden.weekly_tending_due_at = now + timedelta(hours=WEEKLY_TENDING_HOURS)
    garden.current_tending = None
    return attempt


# ---------------------------------------------------------------------------
# Stats helpers
# ---------------------------------------------------------------------------

async def pages_read_delta(
    session: AsyncSession, garden_id: uuid.UUID, since_hours: int = 168
) -> int:
    """Sum of `pages` payloads on read events in the past `since_hours`."""
    cutoff = _now() - timedelta(hours=since_hours)
    rows = await session.execute(
        select(GardenEvent.payload).where(
            GardenEvent.garden_id == garden_id,
            GardenEvent.kind == GardenEventKind.read,
            GardenEvent.created_at >= cutoff,
        )
    )
    total = 0
    for (payload,) in rows.all():
        try:
            total += int((payload or {}).get("pages") or 0)
        except (TypeError, ValueError):
            continue
    return total


async def last_leaf_at(
    session: AsyncSession, garden_id: uuid.UUID
) -> datetime | None:
    row = await session.execute(
        select(func.max(GardenEvent.created_at)).where(
            GardenEvent.garden_id == garden_id,
            GardenEvent.growth_delta > 0,
        )
    )
    return row.scalar_one_or_none()


def quiz_accuracy_percent(garden: Garden) -> int:
    if garden.quiz_attempted_total <= 0:
        return 0
    return int(round(100 * garden.quiz_correct_total / garden.quiz_attempted_total))


