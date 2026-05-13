"""Billing schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class CheckoutRequest(BaseModel):
    plan: Literal["reader", "scholar", "family"]
    cycle: Literal["monthly", "yearly"]
    apply_first_month_discount: bool = False


class CheckoutResponse(BaseModel):
    url: str


class PortalResponse(BaseModel):
    url: str


class QuotaRead(BaseModel):
    pages_per_month: int
    max_pages_per_book: int
    quizzes_per_book: int
    profiles: int
    chat_with_citations: bool
    annotated_export: bool
    priority_queue: bool
    family_safe_mode: bool
    literary_translation: bool
    # Page after which a Free reader is paywalled on seed books. The frontend
    # reads this from /billing/me to fire the upgrade modal — paid plans get
    # the UNLIMITED sentinel and never trip the gate. 1-indexed.
    seed_book_page_cap: int


class UsageRead(BaseModel):
    period_start: datetime | None
    pages_uploaded: int
    quizzes_generated: int


class SubscriptionRead(BaseModel):
    plan: Literal["free", "reader", "scholar", "family"]
    cycle: Literal["monthly", "yearly"] | None
    status: Literal[
        "inactive", "trialing", "active", "past_due", "canceled", "unpaid"
    ]
    current_period_start: datetime | None
    current_period_end: datetime | None
    trial_end: datetime | None
    cancel_at_period_end: bool
    canceled_at: datetime | None
    has_stripe_customer: bool
    quota: QuotaRead
    usage: UsageRead
