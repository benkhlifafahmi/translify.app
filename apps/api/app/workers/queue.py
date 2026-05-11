"""RQ queue setup. Use enqueue() from API routes to schedule background work.

Priority model
--------------
Each kind-of-work has two queues — a normal one and a ``_priority`` variant.
Workers read priority queues FIRST so Scholar/Family jobs jump ahead of Free/
Reader jobs of the same kind without starving anything.

Routes pick the queue via ``queue_for(base, priority=…)`` based on the caller's
plan (see ``plans.PlanQuota.priority_queue``).
"""
from __future__ import annotations

from functools import lru_cache

from redis import Redis
from rq import Queue

from app.config import settings


@lru_cache
def get_redis() -> Redis:
    return Redis.from_url(settings.redis_url)


@lru_cache
def get_queue(name: str = "default") -> Queue:
    return Queue(name, connection=get_redis())


# Named queues — workers can listen to subsets to prioritise.
QUEUE_INGEST = "ingest"             # parse + chunk + embed (slow)
QUEUE_TRANSLATE = "translate"       # chunked translation (slow)
QUEUE_QUIZ = "quiz"                 # quiz generation (fast)
QUEUE_DEFAULT = "default"

# Priority variants — same work, drained first.
QUEUE_INGEST_PRIORITY = "ingest_priority"
QUEUE_TRANSLATE_PRIORITY = "translate_priority"
QUEUE_QUIZ_PRIORITY = "quiz_priority"

# Worker drain order: ALL priority queues first, then normal queues.
# RQ Worker scans this list left-to-right per polling round, so any pending
# priority job runs before the next normal job of the same kind.
ALL_QUEUES = [
    QUEUE_INGEST_PRIORITY,
    QUEUE_TRANSLATE_PRIORITY,
    QUEUE_QUIZ_PRIORITY,
    QUEUE_INGEST,
    QUEUE_TRANSLATE,
    QUEUE_QUIZ,
    QUEUE_DEFAULT,
]


def queue_for(base: str, *, priority: bool) -> Queue:
    """Pick the priority or normal queue for a kind of work.

    ``base`` is one of QUEUE_INGEST / QUEUE_TRANSLATE / QUEUE_QUIZ. Falls back
    to the base queue if ``base`` is not one of the recognised priorities.
    """
    if not priority:
        return get_queue(base)
    mapping = {
        QUEUE_INGEST: QUEUE_INGEST_PRIORITY,
        QUEUE_TRANSLATE: QUEUE_TRANSLATE_PRIORITY,
        QUEUE_QUIZ: QUEUE_QUIZ_PRIORITY,
    }
    return get_queue(mapping.get(base, base))
