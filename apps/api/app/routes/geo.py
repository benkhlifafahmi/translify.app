"""IP geolocation → suggested UI language.

The web app calls ``GET /geo`` on a visitor's first load (when they have no
stored language preference) to learn which country the request came from and
which of our supported locales that country suggests. The browser separately
knows ``navigator.language``; when the two disagree (e.g. a Japanese IP with an
English browser) the web app shows a one-time "choose your language" popup.

Design notes:

* The client IP is resolved from the reverse-proxy ``X-Forwarded-For`` exactly
  like the rate limiter does — the API runs with ``--proxy-headers``.
* Country lookup goes through a keyless HTTP provider (ipwho.is by default,
  configurable via ``GEOIP_PROVIDER_URL``). The lookup is server-side so it is
  not defeated by client ad-blockers, and results are cached per-IP in Redis so
  a busy network only costs one outbound call per week.
* Everything fails *open*: a provider hiccup, a private/loopback IP, or a Redis
  blip all resolve to ``{country: null, suggested_locale: null}`` so the web app
  simply falls back to browser-language detection. The endpoint never errors.
"""
from __future__ import annotations

import asyncio
import ipaddress
import logging

import httpx
from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.config import settings
from app.workers.queue import get_redis

log = logging.getLogger(__name__)

router = APIRouter(prefix="/geo", tags=["geo"])

# Map ISO 3166-1 alpha-2 country codes to one of our supported UI locales.
# Best-effort: multilingual countries pick their most-spoken supported language,
# and the popup lets the visitor override anyway. Anything not listed falls back
# to English (see ``_locale_for_country``).
COUNTRY_LOCALE: dict[str, str] = {
    # Japanese
    "JP": "ja",
    # Chinese
    "CN": "zh", "TW": "zh", "HK": "zh", "MO": "zh",
    # German
    "DE": "de", "AT": "de", "CH": "de", "LI": "de",
    # French
    "FR": "fr", "MC": "fr", "LU": "fr",
    # Spanish (Spain + Latin America)
    "ES": "es", "MX": "es", "AR": "es", "CO": "es", "CL": "es", "PE": "es",
    "VE": "es", "EC": "es", "GT": "es", "CU": "es", "BO": "es", "DO": "es",
    "HN": "es", "PY": "es", "SV": "es", "NI": "es", "CR": "es", "PA": "es",
    "UY": "es", "PR": "es",
    # Arabic
    "SA": "ar", "EG": "ar", "AE": "ar", "DZ": "ar", "IQ": "ar", "MA": "ar",
    "SD": "ar", "YE": "ar", "SY": "ar", "TN": "ar", "JO": "ar", "LY": "ar",
    "LB": "ar", "PS": "ar", "OM": "ar", "KW": "ar", "QA": "ar", "BH": "ar",
    "MR": "ar",
    # Indonesian / Malay
    "ID": "id",
    "MY": "ms", "BN": "ms",
}

# Locales the web app actually ships. Kept here so a bad map entry can never
# suggest a locale the frontend has no dictionary for.
SUPPORTED_LOCALES = frozenset({"en", "fr", "es", "de", "ja", "zh", "ar", "id", "ms"})


class GeoResponse(BaseModel):
    """All fields are nullable — null means "couldn't tell, use browser language"."""

    country: str | None = None
    country_name: str | None = None
    suggested_locale: str | None = None


def _client_ip(request: Request) -> str:
    """Resolve the client IP, trusting the reverse proxy's X-Forwarded-For.

    Mirrors ``app.auth.rate_limit._client_ip`` — the API runs with
    ``--proxy-headers --forwarded-allow-ips '*'`` so ``request.client.host`` is
    already the rightmost trusted hop.
    """
    if request.client and request.client.host:
        return request.client.host
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return ""


def _is_public_ip(ip: str) -> bool:
    """True only for routable public addresses — skip loopback/LAN/etc. so dev
    machines and internal health checks never hit the provider."""
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return False
    return not (
        addr.is_private
        or addr.is_loopback
        or addr.is_link_local
        or addr.is_multicast
        or addr.is_reserved
        or addr.is_unspecified
    )


def _locale_for_country(code: str | None) -> str | None:
    """Country code → supported locale. Known country but unmapped → English;
    unknown country (``None``) → ``None`` so the client uses browser language."""
    if not code:
        return None
    loc = COUNTRY_LOCALE.get(code.upper(), "en")
    return loc if loc in SUPPORTED_LOCALES else "en"


def _cache_get(ip: str) -> str | None:
    """Sync Redis read — call via ``asyncio.to_thread``. Returns a cached
    country code, the sentinel ``"-"`` for a known-unresolvable IP, or None."""
    try:
        raw = get_redis().get(f"geo:{ip}")
    except Exception:
        return None
    if raw is None:
        return None
    return raw.decode() if isinstance(raw, bytes) else str(raw)


def _cache_set(ip: str, value: str) -> None:
    """Sync Redis write — call via ``asyncio.to_thread``. Fails open."""
    try:
        get_redis().set(f"geo:{ip}", value, ex=settings.geoip_cache_ttl_seconds)
    except Exception:
        log.debug("geo cache write skipped for %s", ip, exc_info=True)


async def _lookup_country(ip: str) -> str | None:
    """Resolve a public IP to an ISO country code via the configured provider.
    Returns None on any failure (the caller treats that as "unknown")."""
    url_tmpl = settings.geoip_provider_url.strip()
    if not url_tmpl:
        return None
    url = url_tmpl.replace("{ip}", ip)
    try:
        async with httpx.AsyncClient(timeout=settings.geoip_timeout_seconds) as client:
            resp = await client.get(url, headers={"Accept": "application/json"})
        resp.raise_for_status()
        data = resp.json()
    except Exception:
        log.warning("geo provider lookup failed for %s", ip, exc_info=True)
        return None
    if isinstance(data, dict) and data.get("success") is False:
        # ipwho.is signals rate limits / bad input with success=false.
        return None
    # ipwho.is uses "country_code"; tolerate a couple of common aliases so the
    # provider can be swapped via env without a code change.
    code = None
    if isinstance(data, dict):
        code = data.get("country_code") or data.get("countryCode") or data.get("country")
    if not isinstance(code, str) or len(code) != 2:
        return None
    return code.upper()


@router.get("", response_model=GeoResponse)
async def geo(request: Request) -> GeoResponse:
    """Best-effort country + suggested locale for the requesting IP."""
    ip = _client_ip(request)
    if not ip or not _is_public_ip(ip):
        return GeoResponse()

    cached = await asyncio.to_thread(_cache_get, ip)
    if cached == "-":
        # Previously unresolvable — don't re-hit the provider for a week.
        return GeoResponse()
    if cached:
        return GeoResponse(
            country=cached,
            country_name=None,
            suggested_locale=_locale_for_country(cached),
        )

    code = await _lookup_country(ip)
    await asyncio.to_thread(_cache_set, ip, code or "-")
    if not code:
        return GeoResponse()
    return GeoResponse(
        country=code,
        country_name=None,
        suggested_locale=_locale_for_country(code),
    )
