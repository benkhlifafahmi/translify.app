"""Tiny Redis-backed per-IP rate limiter.

We already run Redis for the RQ workers, so reusing it for rate limits costs
nothing new in infra and keeps the limiter visible/inspectable from
``redis-cli``. No `slowapi` or other dependency.

Usage as a FastAPI dependency:

    @router.post("/x", dependencies=[Depends(rate_limit_ip("x", 10, 3600))])
    async def ...

The dependency raises 429 once the IP exceeds ``limit`` within ``window``
seconds. Successful and failed requests both count — abusers don't get
free retries.
"""
from __future__ import annotations

import asyncio
import logging
import time
from collections.abc import Awaitable, Callable

from fastapi import HTTPException, Request, status

from app.workers.queue import get_redis

log = logging.getLogger(__name__)


def _client_ip(request: Request) -> str:
    """Resolve the client IP, trusting the X-Forwarded-For header set by our
    reverse proxy.

    The API runs with ``--proxy-headers --forwarded-allow-ips '*'`` so
    ``request.client.host`` is already the rightmost trusted hop from XFF.
    Fall back to "unknown" when no peer is set (e.g. test client).
    """
    if request.client and request.client.host:
        return request.client.host
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return "unknown"


def rate_limit_ip(
    bucket: str,
    limit: int,
    window_seconds: int,
) -> Callable[[Request], Awaitable[None]]:
    """Build a FastAPI dependency enforcing ``limit`` requests / ``window``
    per IP within the named ``bucket``. The bucket lets different routes
    use different limits without colliding.
    """

    async def dep(request: Request) -> None:
        ip = _client_ip(request)
        # Pin the key by the wall clock window so an attacker can't sneak in
        # right at the boundary — same idea as a fixed-window counter, but
        # the window slides each minute boundary rather than being one
        # massive expiring key.
        window_index = int(time.time()) // window_seconds
        key = f"rl:{bucket}:{ip}:{window_index}"
        try:
            # Hop to a worker thread because the redis-py client is sync;
            # holding up the event loop on each request would be silly.
            count = await asyncio.to_thread(_incr_with_ttl, key, window_seconds)
        except Exception:
            # Never break the route on a Redis hiccup — fail open.
            log.exception("rate_limit_ip Redis error on %s", key)
            return

        if count > limit:
            retry_after = window_seconds - (int(time.time()) % window_seconds)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "rate_limited",
                    "message": "Too many sessions from this network. Try again shortly.",
                    "retry_after_seconds": retry_after,
                },
                headers={"Retry-After": str(retry_after)},
            )

    return dep


def _incr_with_ttl(key: str, ttl: int) -> int:
    """``INCR`` and stamp TTL on first hit. Sync — call via to_thread."""
    r = get_redis()
    pipe = r.pipeline()
    pipe.incr(key)
    pipe.expire(key, ttl, nx=True)  # set TTL only if not already set
    incr_result, _ = pipe.execute()
    return int(incr_result)
