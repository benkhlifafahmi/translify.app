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

    books_per_month: int
    quizzes_per_book: int
    profiles: int
    chat_with_citations: bool
    annotated_export: bool
    priority_queue: bool
    family_safe_mode: bool


# Limits sized to match the marketing pricing page.
PLAN_QUOTAS: dict[Plan, PlanQuota] = {
    Plan.free: PlanQuota(
        books_per_month=0,  # No active subscription = no uploads.
        quizzes_per_book=0,
        profiles=1,
        chat_with_citations=False,
        annotated_export=False,
        priority_queue=False,
        family_safe_mode=False,
    ),
    Plan.reader: PlanQuota(
        books_per_month=10,
        quizzes_per_book=10,
        profiles=1,
        chat_with_citations=True,
        annotated_export=False,
        priority_queue=False,
        family_safe_mode=False,
    ),
    Plan.scholar: PlanQuota(
        books_per_month=UNLIMITED,
        quizzes_per_book=UNLIMITED,
        profiles=1,
        chat_with_citations=True,
        annotated_export=True,
        priority_queue=True,
        family_safe_mode=False,
    ),
    Plan.family: PlanQuota(
        books_per_month=UNLIMITED,
        quizzes_per_book=UNLIMITED,
        profiles=5,
        chat_with_citations=True,
        annotated_export=True,
        priority_queue=True,
        family_safe_mode=True,
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
