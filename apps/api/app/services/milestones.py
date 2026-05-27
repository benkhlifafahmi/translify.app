"""Milestone recording + sharing.

The Milestone row is created when an underlying event fires (a perfect
quiz, a finished book, a streak crossing a threshold). The user later opts
in to share it: ``share_milestone`` minimally creates the corresponding
``Post`` and links it back via ``Milestone.shared_post_id``.

Idempotency rules:

  - One-time kinds (``streak_7``, ``streak_30``, ``streak_100``,
    ``words_*``, ``first_book_finished``) cannot be recorded twice for the
    same user. The first call creates the row; subsequent calls return the
    existing one.
  - Per-target kinds (``book_finished``, ``quiz_perfect``,
    ``garden_bloom``) dedupe on (user, kind, context-key). For
    ``book_finished`` the key is ``book_id``; for ``quiz_perfect`` it is
    ``quiz_id``; for ``garden_bloom`` it is ``garden_id``.
  - Sharing is also idempotent: a milestone that already has a
    ``shared_post_id`` returns that post on a re-share attempt.

These rules let the route layer call ``record_milestone`` unconditionally
on every event without worrying about duplicates.
"""
from __future__ import annotations

import logging
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.social import (
    Milestone,
    MilestoneKind,
    Post,
    PostType,
    PostVisibility,
)

log = logging.getLogger(__name__)


ONE_TIME_KINDS: frozenset[MilestoneKind] = frozenset({
    MilestoneKind.first_book_finished,
    MilestoneKind.streak_7,
    MilestoneKind.streak_30,
    MilestoneKind.streak_100,
    MilestoneKind.words_100,
    MilestoneKind.words_500,
    MilestoneKind.words_1000,
})

# Per-target kinds key off these context fields. record_milestone uses the
# key to scope its dedup query.
PER_TARGET_KEYS: dict[MilestoneKind, str] = {
    MilestoneKind.book_finished: "book_id",
    MilestoneKind.quiz_perfect: "quiz_id",
    MilestoneKind.garden_bloom: "garden_id",
}


async def record_milestone(
    *,
    user_id: uuid.UUID,
    kind: MilestoneKind,
    context: dict[str, Any] | None = None,
    session: AsyncSession,
) -> Milestone:
    """Create + return a milestone, or return the existing one if duplicate.

    Caller is responsible for transaction boundary (``await session.commit()``)
    after the call returns. We add to the session but don't commit so callers
    can batch with their own writes.
    """
    context = context or {}

    # One-time kinds: dedup on (user_id, kind).
    if kind in ONE_TIME_KINDS:
        existing = (
            await session.execute(
                select(Milestone).where(
                    Milestone.user_id == user_id, Milestone.kind == kind
                )
            )
        ).scalar_one_or_none()
        if existing is not None:
            return existing

    # Per-target kinds: dedup on (user_id, kind, context_key).
    key = PER_TARGET_KEYS.get(kind)
    if key is not None and key in context:
        existing = (
            await session.execute(
                select(Milestone).where(
                    Milestone.user_id == user_id,
                    Milestone.kind == kind,
                    Milestone.context[key].astext == str(context[key]),
                )
            )
        ).scalar_one_or_none()
        if existing is not None:
            return existing

    m = Milestone(user_id=user_id, kind=kind, context=context)
    session.add(m)
    await session.flush()
    return m


# ─── Sharing ──────────────────────────────────────────────────────────────────


def _payload_for(milestone: Milestone) -> dict[str, Any]:
    """Render the auto-share payload for a milestone's Post.

    Each milestone kind has a stable label + icon + value. Callers can
    override by passing their own payload to ``share_milestone``, but the
    default is good enough for the toast's one-tap share path.
    """
    ctx = milestone.context or {}
    kind = milestone.kind

    if kind == MilestoneKind.first_book_finished:
        title = ctx.get("book_title", "a book")
        return {
            "kind": kind.value,
            "label": f"Finished my first book: {title}",
            "value": None,
            "icon": "📖",
        }
    if kind == MilestoneKind.book_finished:
        title = ctx.get("book_title", "a book")
        lang = ctx.get("target_lang")
        suffix = f" in {lang.upper()}" if isinstance(lang, str) and lang else ""
        return {
            "kind": kind.value,
            "label": f"Finished {title}{suffix}",
            "value": None,
            "icon": "📖",
        }
    if kind in {MilestoneKind.streak_7, MilestoneKind.streak_30, MilestoneKind.streak_100}:
        days = int(ctx.get("days", kind.value.split("_")[-1]))
        return {
            "kind": kind.value,
            "label": "Day reading streak",
            "value": days,
            "icon": "🔥",
        }
    if kind in {MilestoneKind.words_100, MilestoneKind.words_500, MilestoneKind.words_1000}:
        count = int(ctx.get("count", kind.value.split("_")[-1]))
        return {
            "kind": kind.value,
            "label": "Words translated",
            "value": count,
            "icon": "✦",
        }
    if kind == MilestoneKind.quiz_perfect:
        total = int(ctx.get("total", 0))
        return {
            "kind": kind.value,
            "label": "Perfect quiz score",
            "value": total or None,
            "icon": "★",
        }
    if kind == MilestoneKind.garden_bloom:
        species = ctx.get("species", "garden")
        return {
            "kind": kind.value,
            "label": f"My {species} bloomed",
            "value": None,
            "icon": "❀",
        }
    return {"kind": kind.value, "label": "Milestone", "value": None, "icon": "✦"}


async def share_milestone(
    *,
    milestone: Milestone,
    session: AsyncSession,
    note: str | None = None,
    visibility: PostVisibility = PostVisibility.public,
) -> Post:
    """Create the Post for a milestone, link it back, return the Post.

    Idempotent: re-calling for an already-shared milestone returns the
    existing Post.
    """
    if milestone.shared_post_id is not None:
        existing = (
            await session.execute(
                select(Post).where(Post.id == milestone.shared_post_id)
            )
        ).scalar_one_or_none()
        if existing is not None:
            return existing

    payload = _payload_for(milestone)
    ctx = milestone.context or {}
    book_id = ctx.get("book_id")

    post = Post(
        user_id=milestone.user_id,
        type=PostType.milestone,
        payload=payload,
        book_id=uuid.UUID(book_id) if isinstance(book_id, str) else book_id,
        note=note,
        visibility=visibility,
    )
    session.add(post)
    await session.flush()
    milestone.shared_post_id = post.id
    return post
