"""Pydantic schemas for the social layer.

Layer of validation that lives between FastAPI and the SQL models:

  - Length caps enforce the copyright posture (sentence ≤ 280, passage ≤ 500).
  - Username rules (alphanum + underscore, 3-20, reserved list) live here so
    bad handles never reach the database unique constraint.
  - Polymorphic ``Post`` payloads are validated per ``type`` via a discriminated
    union, so a caller can't ship a ``milestone`` payload as a ``sentence``.
"""
from __future__ import annotations

import re
import uuid
from datetime import datetime
from typing import Annotated, Literal, Union

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.social import MilestoneKind, PostType, PostVisibility


# ─── Username rules ───────────────────────────────────────────────────────────

USERNAME_RE = re.compile(r"^[a-z0-9_]{3,20}$")

# Routes, brand handles, generic terms we want held back from open claim. The
# matching is case-insensitive at the validation layer; users only ever store
# the lowercase form.
RESERVED_USERNAMES = frozenset({
    # Routes
    "admin", "api", "app", "auth", "blog", "contact", "cookies", "discover",
    "feed", "forgot-password", "garden", "help", "join", "languages",
    "library", "login", "logout", "manifesto", "notifications", "onboarding",
    "opt-out", "pricing", "privacy", "read", "refund-policy", "register",
    "reset-password", "search", "settings", "signup", "sitemap", "start",
    "support", "terms", "verify-email", "www",
    # Brand
    "translify", "lumi", "team", "official", "staff", "moderator", "mod",
    # Generic
    "null", "undefined", "anonymous", "guest", "user", "users", "me",
})


def _validate_username(v: str) -> str:
    lowered = v.strip().lower()
    if not USERNAME_RE.fullmatch(lowered):
        raise ValueError(
            "Username must be 3-20 characters, lowercase letters, numbers, or underscore."
        )
    if lowered in RESERVED_USERNAMES:
        raise ValueError("That username is reserved.")
    return lowered


# ─── Profile ──────────────────────────────────────────────────────────────────


class ProfilePatch(BaseModel):
    """Partial update — every field is optional."""
    bio: str | None = Field(default=None, max_length=160)
    avatar_url: str | None = Field(default=None, max_length=500)
    profile_public: bool | None = None


class UsernameClaim(BaseModel):
    username: str

    @field_validator("username")
    @classmethod
    def _v(cls, v: str) -> str:
        return _validate_username(v)


class PublicProfile(BaseModel):
    """What anyone (logged in or out) sees about a user."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    username: str | None
    display_name: str | None
    bio: str | None
    avatar_url: str | None
    profile_public: bool
    created_at: datetime
    # Aggregate counters filled by the route layer.
    post_count: int = 0
    follower_count: int = 0
    following_count: int = 0
    is_following: bool = False  # set when the viewer is logged in


# ─── Post payloads (discriminated by ``type``) ────────────────────────────────


class _WordPayload(BaseModel):
    source_word: str = Field(min_length=1, max_length=80)
    target_word: str = Field(min_length=1, max_length=120)
    part_of_speech: str | None = Field(default=None, max_length=40)
    pronunciation: str | None = Field(default=None, max_length=120)
    example: str | None = Field(default=None, max_length=280)


class _SentencePayload(BaseModel):
    source_text: str = Field(min_length=1, max_length=280)
    target_text: str = Field(min_length=1, max_length=400)


class _PassagePayload(BaseModel):
    source_text: str = Field(min_length=1, max_length=500)
    target_text: str = Field(min_length=1, max_length=700)
    source_page: int | None = Field(default=None, ge=1)


class _MilestonePayload(BaseModel):
    kind: MilestoneKind
    label: str = Field(min_length=1, max_length=120)
    value: int | None = None  # e.g. 30 for streak_30
    icon: str | None = Field(default=None, max_length=40)


class _ListPayload(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=280)
    book_ids: list[uuid.UUID] = Field(min_length=1, max_length=24)


class _ReflectionPayload(BaseModel):
    text: str = Field(min_length=1, max_length=500)


# ─── Post create (discriminated union on ``type``) ────────────────────────────


class _WordPost(BaseModel):
    type: Literal[PostType.word]
    payload: _WordPayload
    book_id: uuid.UUID | None = None
    highlight_id: uuid.UUID | None = None
    source_lang: str | None = Field(default=None, max_length=8)
    target_lang: str | None = Field(default=None, max_length=8)
    note: str | None = Field(default=None, max_length=280)
    visibility: PostVisibility = PostVisibility.public


class _SentencePost(BaseModel):
    type: Literal[PostType.sentence]
    payload: _SentencePayload
    book_id: uuid.UUID | None = None
    highlight_id: uuid.UUID | None = None
    source_lang: str | None = Field(default=None, max_length=8)
    target_lang: str | None = Field(default=None, max_length=8)
    note: str | None = Field(default=None, max_length=280)
    visibility: PostVisibility = PostVisibility.public


class _PassagePost(BaseModel):
    type: Literal[PostType.passage]
    payload: _PassagePayload
    book_id: uuid.UUID | None = None
    highlight_id: uuid.UUID | None = None
    source_lang: str | None = Field(default=None, max_length=8)
    target_lang: str | None = Field(default=None, max_length=8)
    note: str | None = Field(default=None, max_length=280)
    visibility: PostVisibility = PostVisibility.public


class _MilestonePost(BaseModel):
    type: Literal[PostType.milestone]
    payload: _MilestonePayload
    book_id: uuid.UUID | None = None
    note: str | None = Field(default=None, max_length=280)
    visibility: PostVisibility = PostVisibility.public


class _ListPost(BaseModel):
    type: Literal[PostType.list]
    payload: _ListPayload
    note: str | None = Field(default=None, max_length=280)
    visibility: PostVisibility = PostVisibility.public


class _ReflectionPost(BaseModel):
    type: Literal[PostType.reflection]
    payload: _ReflectionPayload
    book_id: uuid.UUID | None = None
    note: str | None = Field(default=None, max_length=280)
    visibility: PostVisibility = PostVisibility.public


PostCreate = Annotated[
    Union[
        _WordPost, _SentencePost, _PassagePost,
        _MilestonePost, _ListPost, _ReflectionPost,
    ],
    Field(discriminator="type"),
]


# ─── Post read ────────────────────────────────────────────────────────────────


class PostAuthor(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    username: str | None
    display_name: str | None
    avatar_url: str | None


class PostRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    type: PostType
    payload: dict
    book_id: uuid.UUID | None
    highlight_id: uuid.UUID | None
    source_lang: str | None
    target_lang: str | None
    note: str | None
    visibility: PostVisibility
    share_slug: str
    created_at: datetime
    # Hydrated by the route — included on every read so the client never
    # needs a second round-trip for "who posted this".
    author: PostAuthor | None = None
    # Filled when the post is tied to a book.
    book_title: str | None = None
    book_author: str | None = None


# ─── Follow ───────────────────────────────────────────────────────────────────


class FollowStatus(BaseModel):
    is_following: bool
    follower_count: int
    following_count: int


# ─── Search ───────────────────────────────────────────────────────────────────


class UserSearchResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    username: str | None
    display_name: str | None
    avatar_url: str | None
    bio: str | None


# ─── Milestones ───────────────────────────────────────────────────────────────


class MilestoneRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    kind: MilestoneKind
    context: dict
    shared_post_id: uuid.UUID | None
    created_at: datetime


class MilestoneShareRequest(BaseModel):
    note: str | None = Field(default=None, max_length=280)
    visibility: PostVisibility = PostVisibility.public
