"""Book-visibility helpers.

Books are strictly per-user. Seed books from ``app/seeds/catalog.py`` are
held under a system user and **cloned** into the visitor's library on first
open (see ``app/routes/seeds.py``). Once cloned, a seed book is just another
row in the user's library — same ownership rules, same lifecycle.

The helper is kept as a single point of indirection so future changes to
visibility (org sharing, family-plan profiles, library invitations) only
have to touch one file.
"""
from __future__ import annotations

from sqlalchemy import ColumnElement

from app.auth.models import User
from app.models.book import Book


def visible_to(user: User) -> ColumnElement[bool]:
    """SQL predicate: this user can read / chat / quiz / highlight this book."""
    return Book.user_id == user.id
