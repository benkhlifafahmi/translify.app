"""Ingest the public-domain seed catalogue into the database.

One-shot, idempotent. Run after migrations on first deploy and again whenever
``app/seeds/catalog.py`` gains a new entry:

    docker compose exec api python -m app.scripts.seed_books

For each entry in ``SEED_BOOKS`` the script:

1. Upserts the system user that owns the seed catalogue (see
   ``app.seeds.system_user``).
2. Skips the book if a row with the same ``seed_slug`` already exists —
   re-running is safe.
3. Uploads the EPUB file at ``apps/web/public/sample-books/<filename>`` into
   object storage under ``seeds/<slug>.epub``.
4. Creates the ``Book`` row with ``is_seed=True`` and queues
   ``process_book`` on the ingest worker (parse → chunk → embed).

The EPUB path is configurable via ``SEED_BOOKS_DIR`` (defaults to a path
relative to the repo root). In the Docker image this is set to a baked-in
location.
"""
from __future__ import annotations

import argparse
import asyncio
import logging
import os
import sys
import uuid
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.auth.models  # noqa: F401
import app.models  # noqa: F401
from app.config import settings
from app.models.book import Book, BookFormat, BookStatus
from app.seeds import SEED_BOOKS, SeedBookSpec
from app.seeds.system_user import get_or_create_system_user
from app.storage import ensure_bucket, get_s3_client, put_object_bytes
from app.workers.jobs import process_book
from app.workers.queue import QUEUE_INGEST, get_queue

log = logging.getLogger(__name__)


def _resolve_seed_dir() -> Path:
    override = os.environ.get("SEED_BOOKS_DIR")
    if override:
        return Path(override)
    # Repo layout: apps/api/app/scripts/seed_books.py  →  apps/web/public/sample-books
    here = Path(__file__).resolve()
    return here.parents[3] / "web" / "public" / "sample-books"


async def _ingest_one(
    session, spec: SeedBookSpec, seed_dir: Path, *, force: bool, dry_run: bool
) -> str:
    # Fetch ALL rows for this slug — historically a few slugs ended up with
    # duplicate seed rows, which made scalar_one_or_none() raise. Keep the
    # oldest as canonical and drop the extras (they're system-owned seed rows;
    # user clones are independent rows and aren't touched).
    existing_rows = (
        await session.execute(
            select(Book)
            .where(Book.seed_slug == spec.slug)
            .order_by(Book.created_at.asc())
        )
    ).scalars().all()
    book = existing_rows[0] if existing_rows else None
    dups = existing_rows[1:]
    if dups:
        log.warning("seed %s has %d duplicate row(s)", spec.slug, len(dups))
        if not dry_run:
            for d in dups:
                await session.delete(d)

    if book is not None and not force:
        if dups and not dry_run:
            return f"skip-existing (removed {len(dups)} duplicate)"
        return "skip-existing"

    fmt = BookFormat.pdf if spec.source_format == "pdf" else BookFormat.epub
    ext = "pdf" if fmt is BookFormat.pdf else "epub"
    content_type = "application/pdf" if fmt is BookFormat.pdf else "application/epub+zip"

    src_path = seed_dir / spec.filename
    if not src_path.is_file():
        raise FileNotFoundError(
            f"seed file missing: {src_path} — "
            "place the file under apps/web/public/sample-books/ "
            "(or run `git lfs pull` / build the API image with sample-books mounted)."
        )

    file_bytes = src_path.read_bytes()
    size = len(file_bytes)

    if dry_run:
        return f"dry-run ({size:,} bytes, {ext})"

    # Upload to object storage under a stable, well-known key.
    key = f"seeds/{spec.slug}.{ext}"
    put_object_bytes(key, file_bytes, content_type)

    system_user = await get_or_create_system_user(session)

    if book is None:
        book = Book(
            id=uuid.uuid4(),
            user_id=system_user.id,
            title=spec.title,
            author=spec.author,
            source_language=spec.source_language,
            format=fmt,
            file_key=key,
            file_size_bytes=size,
            status=BookStatus.uploaded,
            is_seed=True,
            seed_slug=spec.slug,
        )
        session.add(book)
    else:
        # Force-re-ingest: rewrite blob, clear status so the worker re-runs.
        book.title = spec.title
        book.author = spec.author
        book.source_language = spec.source_language
        book.format = fmt
        book.file_key = key
        book.file_size_bytes = size
        book.status = BookStatus.uploaded
        book.error_message = None

    await session.flush()
    book_id = str(book.id)

    # Queue the ingest. Same worker function that runs after a normal upload.
    queue = get_queue(QUEUE_INGEST)
    queue.enqueue(
        process_book,
        book_id,
        job_id=f"seed_ingest_{spec.slug}",
        job_timeout=60 * 60,
        result_ttl=60 * 60,
        failure_ttl=24 * 60 * 60,
    )

    return f"queued ({size:,} bytes)"


async def amain(force: bool, dry_run: bool) -> int:
    if not dry_run:
        ensure_bucket()

    seed_dir = _resolve_seed_dir()
    log.info("seed source: %s", seed_dir)

    engine = create_async_engine(settings.async_postgres_dsn, pool_pre_ping=True)
    session_maker = async_sessionmaker(engine, expire_on_commit=False)
    try:
        async with session_maker() as session:
            for spec in SEED_BOOKS:
                result = await _ingest_one(
                    session, spec, seed_dir, force=force, dry_run=dry_run
                )
                log.info("[%s] %s — %s", result, spec.slug, spec.title)
            if not dry_run:
                await session.commit()
    finally:
        await engine.dispose()

    if dry_run:
        log.info("dry-run complete — no DB / S3 mutations made")
    else:
        log.info(
            "done. tail worker logs: docker compose logs -f worker  "
            "(ingest typically finishes in 1–5 minutes per book)",
        )
    return 0


def main() -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-upload and re-queue ingest even for slugs that already exist.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Read files and report what would happen; touch nothing.",
    )
    args = parser.parse_args()
    return asyncio.run(amain(force=args.force, dry_run=args.dry_run))


if __name__ == "__main__":
    sys.exit(main())
