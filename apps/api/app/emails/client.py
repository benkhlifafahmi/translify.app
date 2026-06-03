"""Resend client wrapper.

Resend's Python SDK is sync; we run it in a thread to avoid blocking the
FastAPI event loop. If ``RESEND_API_KEY`` is unset (e.g. local dev) we log
the would-be email and skip — auth flows still work, they just don't deliver.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any

import resend

from app.config import settings

log = logging.getLogger(__name__)

_configured = False


def _configure() -> None:
    global _configured
    if not _configured and settings.resend_api_key:
        resend.api_key = settings.resend_api_key
        _configured = True


def _send_sync(payload: dict[str, Any]) -> dict[str, Any] | None:
    try:
        return resend.Emails.send(payload)
    except Exception:
        log.exception("Resend API call failed for to=%s subject=%r",
                      payload.get("to"), payload.get("subject"))
        return None


async def send(
    *,
    to: str,
    subject: str,
    html: str,
    text: str,
    tag: str | None = None,
) -> dict[str, Any] | None:
    """Send an email via Resend. Failures are logged, not raised — auth flows
    must remain side-effect-tolerant (we don't want a Resend outage to brick
    registration).

    Returns the Resend response dict on success, or ``None`` when delivery was
    skipped (no API key) or failed — callers that care (e.g. the admin
    composer) can branch on the result; callers that don't can ignore it.
    """
    _configure()

    if not settings.resend_api_key:
        log.warning(
            "RESEND_API_KEY unset — would have sent to=%s subject=%r",
            to, subject,
        )
        return None

    payload: dict[str, Any] = {
        "from": f"{settings.email_from_name} <{settings.email_from_address}>",
        "to": [to],
        "subject": subject,
        "html": html,
        "text": text,
        "reply_to": settings.email_reply_to,
        "headers": {
            "List-Unsubscribe": f"<mailto:{settings.email_reply_to}>",
        },
    }
    if tag:
        payload["tags"] = [{"name": "category", "value": tag}]

    return await asyncio.to_thread(_send_sync, payload)
