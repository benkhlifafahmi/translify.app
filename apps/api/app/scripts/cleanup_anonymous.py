"""Delete anonymous "ghost" users that have aged out.

Anonymous accounts are real ``users`` rows created without an email so a
TikTok visitor can clone seeds + read immediately. They never receive any
mail and have no way to recover their session after the browser cookie is
gone — so once they go cold, the row is dead weight.

This script deletes anonymous users whose ``created_at`` is older than
``--days`` (default 30). ``ON DELETE CASCADE`` on every user-scoped table
takes care of their books, chunks, folders, chats, quizzes, highlights,
gardens, profiles, and subscriptions. ``onboarding_leads.user_id`` is
``ON DELETE SET NULL`` on purpose — funnel rows outlive the user so we
keep the drop-off analytics.

Operational pattern:

    # Dry-run, prints what would be deleted:
    docker compose exec api python -m app.scripts.cleanup_anonymous --dry-run

    # Live:
    docker compose exec api python -m app.scripts.cleanup_anonymous

Wire it to cron once you have it tuned — e.g. 03:00 daily:

    0 3 * * * cd /opt/translify && docker compose exec -T api \
        python -m app.scripts.cleanup_anonymous >> /var/log/translify-cleanup.log 2>&1
"""
from __future__ import annotations

import argparse
import asyncio
import logging
import sys
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.auth.models  # noqa: F401
import app.models  # noqa: F401
from app.auth.models import User
from app.config import settings

log = logging.getLogger(__name__)

DEFAULT_AGE_DAYS = 30
# Bound the per-run deletion so a backlog doesn't stall the DB in one
# transaction. The script can be re-run; cron will catch up.
DEFAULT_BATCH = 500


async def amain(*, days: int, batch: int, dry_run: bool) -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    engine = create_async_engine(settings.async_postgres_dsn, pool_pre_ping=True)
    session_maker = async_sessionmaker(engine, expire_on_commit=False)
    deleted_total = 0
    try:
        async with session_maker() as session:
            # First, what's the damage? Useful in dry-run mode and as a
            # log line in live mode so operators can see the size.
            total_q = await session.execute(
                select(func.count(User.id)).where(
                    User.is_anonymous.is_(True),
                    User.created_at < cutoff,
                )
            )
            total_eligible = int(total_q.scalar() or 0)
            log.info(
                "%d anonymous users eligible (created before %s; cutoff=%dd)",
                total_eligible, cutoff.isoformat(), days,
            )
            if total_eligible == 0:
                return 0

            if dry_run:
                # Show a sample so operators can sanity-check before going live.
                sample_q = await session.execute(
                    select(User.id, User.created_at).where(
                        User.is_anonymous.is_(True),
                        User.created_at < cutoff,
                    ).order_by(User.created_at.asc()).limit(5)
                )
                for uid, created in sample_q.all():
                    log.info("  sample: %s created %s", uid, created.isoformat())
                log.info("dry-run — no rows deleted")
                return 0

            # Delete in batches so each transaction stays bounded. Postgres
            # locks during CASCADE on big subtrees (books → chunks with
            # 1024-dim vectors) so smaller chunks behave better under load.
            while deleted_total < total_eligible:
                # Pull a batch of IDs first so the DELETE is by id (avoids
                # holding a long-running scan on the predicate).
                ids_q = await session.execute(
                    select(User.id).where(
                        User.is_anonymous.is_(True),
                        User.created_at < cutoff,
                    ).limit(batch)
                )
                ids = [row[0] for row in ids_q.all()]
                if not ids:
                    break
                await session.execute(
                    delete(User).where(User.id.in_(ids))
                )
                await session.commit()
                deleted_total += len(ids)
                log.info("deleted %d/%d", deleted_total, total_eligible)
    finally:
        await engine.dispose()

    log.info("done — %d anonymous users deleted", deleted_total)
    return 0


def main() -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--days", type=int, default=DEFAULT_AGE_DAYS,
        help="Delete anonymous users created more than N days ago.",
    )
    parser.add_argument(
        "--batch", type=int, default=DEFAULT_BATCH,
        help="Delete in batches of this size to keep transactions bounded.",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Report counts + a small sample; touch nothing.",
    )
    args = parser.parse_args()
    return asyncio.run(amain(
        days=args.days, batch=args.batch, dry_run=args.dry_run,
    ))


if __name__ == "__main__":
    sys.exit(main())
