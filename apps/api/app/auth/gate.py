"""Anonymous-user gating.

Anonymous accounts can read, browse, and clone seed books, but they cannot
trigger any operation that costs us money (AI calls) or carries account
identity (uploads, translations). Routes that need a real reader call
``require_non_anonymous`` and the response carries a structured
``email_required`` detail that the frontend reads to open its email modal.
"""
from __future__ import annotations

from fastapi import HTTPException, status

from app.auth.models import User


class EmailRequired(HTTPException):
    """Raised when an anonymous user tries to do something that needs a real
    account. The HTTP status is 402 (Payment Required) by deliberate
    convention — same status the paywall uses — so a single client-side
    interceptor handles both "give us your email" and "give us your card"."""

    def __init__(self, action: str) -> None:
        super().__init__(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "error": "email_required",
                "action": action,
                "message": "Add your email to keep going — we'll save your library.",
            },
        )


def require_non_anonymous(user: User, *, action: str) -> User:
    """Reject anonymous users with a structured 402 error.

    ``action`` is a short tag the frontend can use to tailor the modal copy
    (e.g. ``"chat"``, ``"quiz"``, ``"upload"``, ``"translate"``).
    """
    if getattr(user, "is_anonymous", False):
        raise EmailRequired(action=action)
    return user
