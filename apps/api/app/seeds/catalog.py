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
    source_language: str     # ISO 639-1 of the content
    filename: str            # file under apps/web/public/sample-books/
    topics: tuple[str, ...]  # frontend subject/topic this book appears under
    attribution: str         # short legal-attribution string
    source_format: str = "epub"  # "epub" | "pdf"


SEED_BOOKS: tuple[SeedBookSpec, ...] = (
    SeedBookSpec(
        slug="pride-and-prejudice",
        title="Pride and Prejudice",
        author="Jane Austen",
        source_language="en",
        filename="pride-and-prejudice.epub",
        topics=("fiction",),
        attribution="Public domain · via Project Gutenberg",
    ),
    SeedBookSpec(
        slug="alice-in-wonderland",
        title="Alice's Adventures in Wonderland",
        author="Lewis Carroll",
        source_language="en",
        filename="alice-in-wonderland.epub",
        topics=("fiction",),
        attribution="Public domain · via Project Gutenberg",
    ),
    SeedBookSpec(
        slug="meditations",
        title="Meditations",
        author="Marcus Aurelius (tr. George Long, 1862)",
        source_language="en",
        filename="meditations.epub",
        topics=("philosophy", "self-help"),
        attribution="Public domain · tr. George Long, 1862 · via Project Gutenberg",
    ),
    SeedBookSpec(
        slug="art-of-war",
        title="The Art of War",
        author="Sun Tzu (tr. Lionel Giles, 1910)",
        source_language="en",
        filename="art-of-war.epub",
        topics=("business", "history"),
        attribution="Public domain · tr. Lionel Giles, 1910 · via Project Gutenberg",
    ),
    SeedBookSpec(
        slug="origin-of-species",
        title="On the Origin of Species",
        author="Charles Darwin",
        source_language="en",
        filename="origin-of-species.epub",
        topics=("science", "history", "nature"),
        attribution="Public domain · via Project Gutenberg",
    ),
    SeedBookSpec(
        slug="tao-te-ching",
        title="Tao Te Ching",
        author="Lao Tzu (tr. James Legge, 1891)",
        source_language="en",
        filename="tao-te-ching.epub",
        topics=("philosophy", "self-help", "art"),
        attribution="Public domain · tr. James Legge, 1891 · via Project Gutenberg",
    ),
    SeedBookSpec(
        slug="shakespeares-sonnets",
        title="Shakespeare's Sonnets",
        author="William Shakespeare",
        source_language="en",
        filename="shakespeares-sonnets.epub",
        topics=("art",),
        attribution="Public domain · via Project Gutenberg",
    ),
    SeedBookSpec(
        slug="walden",
        title="Walden",
        author="Henry David Thoreau",
        source_language="en",
        filename="walden.epub",
        topics=("nature", "self-help", "philosophy"),
        attribution="Public domain · via Project Gutenberg",
    ),

    # ─── Scientific / STEM seeds ───────────────────────────────────────────────
    # Open-access textbooks, hosted and read as-is (no live translation). PDFs
    # go in apps/web/public/sample-books/ under the `filename` below, then run
    # `python -m app.scripts.seed_books`. Subject → book mapping is mirrored by
    # SUBJECTS in apps/web/src/app/join/join-client.tsx.
    SeedBookSpec(
        slug="openstax-biology-2e",
        title="Biology 2e",
        author="OpenStax · Clark, Douglas, Choi",
        source_language="en",
        filename="openstax-biology-2e.pdf",
        topics=("biology",),
        attribution="CC BY 4.0 · OpenStax, Rice University",
        source_format="pdf",
    ),  # source: https://openstax.org/details/books/biology-2e
    SeedBookSpec(
        slug="openstax-chemistry-2e",
        title="Chemistry 2e",
        author="OpenStax · Flowers, Theopold, Langley",
        source_language="en",
        filename="openstax-chemistry-2e.pdf",
        topics=("chemistry",),
        attribution="CC BY 4.0 · OpenStax, Rice University",
        source_format="pdf",
    ),  # source: https://openstax.org/details/books/chemistry-2e
    SeedBookSpec(
        slug="openstax-university-physics-1",
        title="University Physics, Volume 1",
        author="OpenStax · Ling, Sanny, Moebs",
        source_language="en",
        filename="openstax-university-physics-vol1.pdf",
        topics=("physics",),
        attribution="CC BY 4.0 · OpenStax, Rice University",
        source_format="pdf",
    ),  # source: https://openstax.org/details/books/university-physics-volume-1
    SeedBookSpec(
        slug="openstax-calculus-1",
        title="Calculus, Volume 1",
        author="OpenStax · Strang, Herman",
        source_language="en",
        filename="openstax-calculus-vol1.pdf",
        topics=("calculus",),
        attribution="CC BY 4.0 · OpenStax, Rice University",
        source_format="pdf",
    ),  # source: https://openstax.org/details/books/calculus-volume-1
    SeedBookSpec(
        slug="openstax-intro-statistics",
        title="Introductory Statistics",
        author="OpenStax · Illowsky, Dean",
        source_language="en",
        filename="openstax-introductory-statistics.pdf",
        topics=("statistics",),
        attribution="CC BY 4.0 · OpenStax, Rice University",
        source_format="pdf",
    ),  # source: https://openstax.org/details/books/introductory-statistics
    SeedBookSpec(
        slug="openstax-principles-economics-2e",
        title="Principles of Economics 2e",
        author="OpenStax · Greenlaw, Shapiro",
        source_language="en",
        filename="openstax-principles-of-economics-2e.pdf",
        topics=("economics",),
        attribution="CC BY 4.0 · OpenStax, Rice University",
        source_format="pdf",
    ),  # source: https://openstax.org/details/books/principles-economics-2e
    SeedBookSpec(
        slug="openstax-psychology-2e",
        title="Psychology 2e",
        author="OpenStax · Spielman, Jenkins, Lovett",
        source_language="en",
        filename="openstax-psychology-2e.pdf",
        topics=("psychology",),
        attribution="CC BY 4.0 · OpenStax, Rice University",
        source_format="pdf",
    ),  # source: https://openstax.org/details/books/psychology-2e
    SeedBookSpec(
        slug="dive-into-deep-learning",
        title="Dive into Deep Learning",
        author="Zhang, Lipton, Li, Smola",
        source_language="en",
        filename="dive-into-deep-learning.pdf",
        topics=("cs",),
        attribution="Open-source · d2l.ai",
        source_format="pdf",
    ),  # source: https://d2l.ai/d2l-en.pdf
)


SEED_BY_SLUG: dict[str, SeedBookSpec] = {b.slug: b for b in SEED_BOOKS}
