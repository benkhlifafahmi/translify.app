"""Pydantic schemas for the back-office /admin router."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class AdminUserSummary(BaseModel):
    """One row in the customer list."""

    id: uuid.UUID
    email: str
    display_name: str | None = None
    username: str | None = None
    is_anonymous: bool = False
    is_verified: bool = False
    is_superuser: bool = False
    created_at: datetime | None = None
    plan: str
    status: str
    book_count: int


class AdminUserList(BaseModel):
    users: list[AdminUserSummary]
    total: int
    limit: int
    offset: int


class AdminBookRow(BaseModel):
    id: uuid.UUID
    title: str
    author: str | None = None
    format: str
    status: str
    page_count: int | None = None
    file_size_bytes: int
    created_at: datetime


class AdminSubscriptionInfo(BaseModel):
    plan: str
    cycle: str | None = None
    status: str
    current_period_start: datetime | None = None
    current_period_end: datetime | None = None
    trial_end: datetime | None = None
    cancel_at_period_end: bool = False
    canceled_at: datetime | None = None
    has_stripe_customer: bool = False
    stripe_customer_id: str | None = None


class AdminUsageInfo(BaseModel):
    period_start: datetime | None = None
    pages_uploaded: int = 0
    quizzes_generated: int = 0


class AdminUserStats(BaseModel):
    book_count: int
    pages_total: int
    storage_bytes: int
    highlight_count: int
    quiz_count: int
    chat_count: int
    translation_count: int


class AdminUserDetail(BaseModel):
    id: uuid.UUID
    email: str
    display_name: str | None = None
    username: str | None = None
    bio: str | None = None
    preferred_language: str = "en"
    is_anonymous: bool = False
    is_active: bool = True
    is_verified: bool = False
    is_superuser: bool = False
    family_safe_mode: bool = False
    created_at: datetime | None = None
    subscription: AdminSubscriptionInfo
    usage: AdminUsageInfo
    stats: AdminUserStats
    books: list[AdminBookRow]


class AdminEmailRequest(BaseModel):
    subject: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=10_000)


class AdminEmailResponse(BaseModel):
    sent: bool
    to: str
    detail: str | None = None
