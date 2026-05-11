"""Family-safe content posture — Family-plan content filtering.

The toggle lives on ``User.family_safe_mode`` and the active reader profile.
Activation rules:

  * If the active profile is a *child* profile and the plan exposes family-safe
    mode, the filter is forced on regardless of the account-level toggle. The
    parent cannot accidentally expose a kid to graphic content.
  * Otherwise the account-level ``user.family_safe_mode`` toggle decides, gated
    by ``PlanQuota.family_safe_mode``.

The flag travels into LLM prompts as a system-prompt addendum so chat and
quizzes share the same posture. Translations are intentionally NOT filtered —
their job is faithful reproduction.
"""
from __future__ import annotations

from app.auth.models import User
from app.billing.plans import Plan, quota_for
from app.models.profile import ProfileKind, ReaderProfile
from app.models.subscription import Subscription


FAMILY_SAFE_ADDENDUM = (
    "\n\nFAMILY-SAFE MODE IS ON. Keep your response appropriate for younger "
    "readers: no graphic violence, no sexual content, no explicit language, "
    "no descriptions of self-harm or substance abuse. If the source material "
    "contains such content, summarise it carefully at a high level and warn "
    "the reader without quoting graphic detail. Keep the educational value; "
    "drop the shock value."
)


def is_family_safe_active(
    user: User,
    sub: Subscription | None,
    profile: ReaderProfile | None = None,
) -> bool:
    """True when the kid-safe filter should be applied to the next LLM call.

    Order of decision:
      1. No plan or plan doesn't expose the feature → off (toggle persists for
         future upgrades but does nothing).
      2. Active profile is a child profile → on, no matter the toggle.
      3. Otherwise → fall back to the account-level toggle.
    """
    if sub is None:
        return False
    if not quota_for(Plan(sub.plan)).family_safe_mode:
        return False
    if profile is not None and profile.kind == ProfileKind.child:
        return True
    return bool(user.family_safe_mode)


def safe_addendum(active: bool) -> str:
    """Return the prompt addendum, or empty string if not active."""
    return FAMILY_SAFE_ADDENDUM if active else ""
