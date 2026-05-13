"""Book-visibility helpers.

Books are normally per-user, with one exception: ``is_seed = True`` rows are
system-owned and visible to every authenticated user. The frontend /join flow
needs every visitor to instantly see Pride and Prejudice, Meditations,
etc. without us cloning chunks or duplicating content rows.

This module gives the routes a single, audit-friendly predicate to express
"the user can see this book." Per-user state (chats, quizzes, highlights)
still keys on ``(user_id, book_id)`` — sharing applies only to the source
content + chunks + summary.
"""
from __future__ import annotations

from sqlalchemy import ColumnElement, or_

from app.auth.models import User
from app.models.book import Book


def visible_to(user: User) -> ColumnElement[bool]:
    """SQL predicate: this user can read / chat / quiz / highlight this book."""
    return or_(Book.user_id == user.id, Book.is_seed.is_(True))
