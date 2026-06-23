"""Plan catalogue — single source of truth for tiers, prices, and limits.

Limits live here (not in the DB) so they can evolve without migrations. The DB
just stores which ``plan`` a subscription is currently on.
"""
from __future__ import annotations

import enum
from dataclasses import dataclass

from app.config import settings


class Plan(str, enum.Enum):
    free = "free"
    reader = "reader"
    scholar = "scholar"
    family = "family"


class Cycle(str, enum.Enum):
    monthly = "monthly"
    yearly = "yearly"


# Sentinel for "no limit" — pick a value that fits comfortably in INT4.
UNLIMITED = 1_000_000


@dataclass(frozen=True)
class PlanQuota:
    """Hard limits on what a plan permits.

    Anything not enforced here is implicitly unlimited. Counters reset on the
    subscription's anniversary (current_period_end on Stripe), tracked via
    ``UsageCounter.period_start``.
    """

    pages_per_month: int        # rolling cap on translated pages this period
    max_pages_per_book: int     # reject any single upload over this — abuse guard
    # Rolling cap on minutes of media (YouTube/audio/video) transcribed this
    # period. The media analogue of pages_per_month.
    minutes_transcribed_per_month: int
    quizzes_per_book: int
    profiles: int
    chat_with_citations: bool
    annotated_export: bool
    priority_queue: bool
    family_safe_mode: bool
    literary_translation: bool  # Anthropic engine for translation (vs. DeepL standard)
    # Hard cap on how far a Free reader can navigate inside a *seed* book
    # before the paywall fires. Paid plans get UNLIMITED. The number is the
    # last *allowed* page (1-indexed) — i.e. 10 means pages 1..10 read free,
    # page 11 triggers the upgrade modal.
    seed_book_page_cap: int


# Limits sized for sustainable unit economics, not for marketing roundness.
# Free is unsubscribable — new users go through a 14-day Reader trial.
PLAN_QUOTAS: dict[Plan, PlanQuota] = {
    Plan.free: PlanQuota(
        # Free is the seed-library experience. Users can browse the system's
        # 8 pre-ingested public-domain books, but only the first 10 pages of
        # each are readable — page 11 triggers the upgrade modal.
        # Uploads of their own books stay tightly capped; we want them to
        # *upgrade*, not abuse the demo as a free service.
        pages_per_month=2,
        max_pages_per_book=2,
        minutes_transcribed_per_month=10,   # a short clip, to taste the feature
        quizzes_per_book=3,         # let them taste quizzes on seed books
        profiles=1,
        chat_with_citations=True,   # let them taste chat on seed books
        annotated_export=False,
        priority_queue=False,
        family_safe_mode=False,
        literary_translation=False,
        seed_book_page_cap=10,
    ),
    Plan.reader: PlanQuota(
        pages_per_month=2_000,       # ~8 average novels or one fat textbook
        max_pages_per_book=1_000,    # rejects 600-page-textbook abuse cases
        minutes_transcribed_per_month=600,  # ~10 hours of lectures / month
        quizzes_per_book=10,
        profiles=1,
        chat_with_citations=True,
        annotated_export=False,
        priority_queue=False,
        family_safe_mode=False,
        literary_translation=False,
        seed_book_page_cap=UNLIMITED,
    ),
    Plan.scholar: PlanQuota(
        pages_per_month=UNLIMITED,
        max_pages_per_book=UNLIMITED,
        minutes_transcribed_per_month=UNLIMITED,
        quizzes_per_book=UNLIMITED,
        profiles=1,
        chat_with_citations=True,
        annotated_export=True,
        priority_queue=True,
        family_safe_mode=False,
        literary_translation=True,
        seed_book_page_cap=UNLIMITED,
    ),
    Plan.family: PlanQuota(
        pages_per_month=UNLIMITED,
        max_pages_per_book=UNLIMITED,
        minutes_transcribed_per_month=UNLIMITED,
        quizzes_per_book=UNLIMITED,
        profiles=5,
        chat_with_citations=True,
        annotated_export=True,
        priority_queue=True,
        family_safe_mode=True,
        literary_translation=True,
        seed_book_page_cap=UNLIMITED,
    ),
}


def quota_for(plan: Plan) -> PlanQuota:
    return PLAN_QUOTAS[plan]


def price_id_for(plan: Plan, cycle: Cycle) -> str | None:
    """Resolve a (plan, cycle) tuple to its configured Stripe price ID."""
    mapping: dict[tuple[Plan, Cycle], str] = {
        (Plan.reader, Cycle.monthly):  settings.stripe_price_reader_monthly,
        (Plan.reader, Cycle.yearly):   settings.stripe_price_reader_yearly,
        (Plan.scholar, Cycle.monthly): settings.stripe_price_scholar_monthly,
        (Plan.scholar, Cycle.yearly):  settings.stripe_price_scholar_yearly,
        (Plan.family, Cycle.monthly):  settings.stripe_price_family_monthly,
        (Plan.family, Cycle.yearly):   settings.stripe_price_family_yearly,
    }
    return mapping.get((plan, cycle)) or None


_PRICE_TO_PLAN: dict[str, tuple[Plan, Cycle]] = {}


def plan_for_price_id(price_id: str) -> tuple[Plan, Cycle] | None:
    """Reverse-lookup — given a Stripe price ID, return (plan, cycle)."""
    if not _PRICE_TO_PLAN:
        for plan in (Plan.reader, Plan.scholar, Plan.family):
            for cycle in (Cycle.monthly, Cycle.yearly):
                pid = price_id_for(plan, cycle)
                if pid:
                    _PRICE_TO_PLAN[pid] = (plan, cycle)
    return _PRICE_TO_PLAN.get(price_id)
