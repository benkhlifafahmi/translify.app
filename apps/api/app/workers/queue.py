"""RQ queue setup. Use enqueue() from API routes to schedule background work."""
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


# Named queues — workers can listen to subsets to prioritise
QUEUE_INGEST = "ingest"          # parse + chunk + embed (slow)
QUEUE_TRANSLATE = "translate"    # chunked translation (slow)
QUEUE_QUIZ = "quiz"              # quiz generation (fast)
QUEUE_DEFAULT = "default"

ALL_QUEUES = [QUEUE_INGEST, QUEUE_TRANSLATE, QUEUE_QUIZ, QUEUE_DEFAULT]
