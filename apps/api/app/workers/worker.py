"""Worker entrypoint. Run with: python -m app.workers.worker"""
from __future__ import annotations

import logging

from rq import Worker

from app.workers.queue import ALL_QUEUES, get_queue, get_redis

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


def main() -> None:
    queues = [get_queue(name) for name in ALL_QUEUES]
    worker = Worker(queues, connection=get_redis())
    worker.work(with_scheduler=True)


if __name__ == "__main__":
    main()
