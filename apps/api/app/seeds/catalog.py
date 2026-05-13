"""Public-domain seed catalogue.

Every entry is **public domain worldwide** — see ``apps/web/public/sample-books/README.md``
for provenance and Project Gutenberg references. The matching EPUB file is
shipped at ``apps/web/public/sample-books/<filename>`` (mounted into the API
image at build time, see Dockerfile) and is the source the ingest CLI uploads
to object storage on first run.

These slugs are also referenced by the frontend ``SAMPLE_BOOKS`` list in
``apps/web/src/app/join/join-client.tsx`` — keep the two in sync so the
"chosen_book_id" tracked on onboarding leads lines up with a real seed row.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class SeedBookSpec:
    slug: str                # primary key — matches Book.seed_slug
    title: str
    author: str
    source_language: str     # ISO 639-1 of the EPUB content
    epub_filename: str       # filename under apps/web/public/sample-books/
    topics: tuple[str, ...]  # frontend topic chips this book appears under
    attribution: str         # short legal-attribution string


SEED_BOOKS: tuple[SeedBookSpec, ...] = (
    SeedBookSpec(
        slug="pride-and-prejudice",
        title="Pride and Prejudice",
        author="Jane Austen",
        source_language="en",
        epub_filename="pride-and-prejudice.epub",
        topics=("fiction",),
        attribution="Public domain · via Project Gutenberg",
    ),
    SeedBookSpec(
        slug="alice-in-wonderland",
        title="Alice's Adventures in Wonderland",
        author="Lewis Carroll",
        source_language="en",
        epub_filename="alice-in-wonderland.epub",
        topics=("fiction",),
        attribution="Public domain · via Project Gutenberg",
    ),
    SeedBookSpec(
        slug="meditations",
        title="Meditations",
        author="Marcus Aurelius (tr. George Long, 1862)",
        source_language="en",
        epub_filename="meditations.epub",
        topics=("philosophy", "self-help"),
        attribution="Public domain · tr. George Long, 1862 · via Project Gutenberg",
    ),
    SeedBookSpec(
        slug="art-of-war",
        title="The Art of War",
        author="Sun Tzu (tr. Lionel Giles, 1910)",
        source_language="en",
        epub_filename="art-of-war.epub",
        topics=("business", "history"),
        attribution="Public domain · tr. Lionel Giles, 1910 · via Project Gutenberg",
    ),
    SeedBookSpec(
        slug="origin-of-species",
        title="On the Origin of Species",
        author="Charles Darwin",
        source_language="en",
        epub_filename="origin-of-species.epub",
        topics=("science", "history", "nature"),
        attribution="Public domain · via Project Gutenberg",
    ),
    SeedBookSpec(
        slug="tao-te-ching",
        title="Tao Te Ching",
        author="Lao Tzu (tr. James Legge, 1891)",
        source_language="en",
        epub_filename="tao-te-ching.epub",
        topics=("philosophy", "self-help", "art"),
        attribution="Public domain · tr. James Legge, 1891 · via Project Gutenberg",
    ),
    SeedBookSpec(
        slug="shakespeares-sonnets",
        title="Shakespeare's Sonnets",
        author="William Shakespeare",
        source_language="en",
        epub_filename="shakespeares-sonnets.epub",
        topics=("art",),
        attribution="Public domain · via Project Gutenberg",
    ),
    SeedBookSpec(
        slug="walden",
        title="Walden",
        author="Henry David Thoreau",
        source_language="en",
        epub_filename="walden.epub",
        topics=("nature", "self-help", "philosophy"),
        attribution="Public domain · via Project Gutenberg",
    ),
)


SEED_BY_SLUG: dict[str, SeedBookSpec] = {b.slug: b for b in SEED_BOOKS}
