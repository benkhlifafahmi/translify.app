"""Seed catalogue — system-owned public-domain books surfaced in every user's
library to power the /join "try the magic" experience.

The catalogue is code, not DB. ``catalog.py`` lists the eight titles the
``app.scripts.seed_books`` CLI ingests on first deploy. Run-time code reads
the seed rows out of the ``books`` table via ``Book.is_seed = True``.
"""
from app.seeds.catalog import SEED_BOOKS, SeedBookSpec

__all__ = ["SEED_BOOKS", "SeedBookSpec"]
