"""Pydantic schemas for workspace sharing."""
from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field

from app.schemas.study_guide import StudySectionPublic


class ShareInfo(BaseModel):
    """Owner-facing share status for a book."""
    shared: bool
    slug: str | None = None
    url: str | None = None


class InviteRequest(BaseModel):
    """Invite up to 10 people to a shared course by email."""
    emails: list[EmailStr] = Field(min_length=1, max_length=10)


class SharedWorkspaceRead(BaseModel):
    """Public, view-only payload for a shared media workspace.

    ``sections`` reuses the study-guide public shape, so exercise reference
    answers are stripped automatically.
    """
    title: str
    author: str | None = None
    source_url: str | None = None
    duration_seconds: int | None = None
    sections: list[StudySectionPublic] = []
