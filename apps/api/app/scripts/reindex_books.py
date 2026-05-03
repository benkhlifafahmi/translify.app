"""One-off reindex: re-embed every book's chunks with the current model.

Run inside a running stack:

    docker compose exec worker python -m app.scripts.reindex_books

Why: when the embedding model is swapped (e.g. Voyage → BGE-M3) the
existing chunk vectors live in a different vector space and retrieval
breaks. This loops over every book and pushes it back onto the ingest
queue so the worker re-runs parse → chunk → embed (which deletes its
prior chunks first — see ``app.ingest.pipeline``).
"""
from __future__ import annotations

import logging
import sys

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

import app.auth.models  # noqa: F401 — register User mapper for FK resolution
import app.models  # noqa: F401 — register all model mappers
from app.config import settings
from app.models.book import Book, BookStatus
from app.workers.jobs import process_book
from app.workers.queue import QUEUE_INGEST, get_queue

log = logging.getLogger(__name__)


def main() -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )

    engine = create_engine(settings.sync_postgres_dsn)
    queue = get_queue(QUEUE_INGEST)

    with Session(engine) as session:
        books = (
            session.execute(
                select(Book).where(
                    Book.status.in_([BookStatus.ready, BookStatus.failed])
                )
            )
            .scalars()
            .all()
        )

    if not books:
        log.info("no books to reindex")
        return 0

    log.info("queueing %d books on the %s queue", len(books), QUEUE_INGEST)
    for i, book in enumerate(books, 1):
        queue.enqueue(
            process_book,
            str(book.id),
            job_id=f"reindex_book_{book.id}",
            job_timeout=60 * 60,
            result_ttl=60 * 60,
            failure_ttl=24 * 60 * 60,
        )
        log.info("[%d/%d] enqueued %s — %s", i, len(books), book.id, book.title)

    log.info(
        "done — %d jobs queued; tail logs with: docker compose logs -f worker",
        len(books),
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
