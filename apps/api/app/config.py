"""App settings, sourced from env vars."""
from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_env: str = "development"
    api_public_url: str = "http://localhost:8000"
    web_public_url: str = "http://localhost:3000"
    cors_origins: str = "http://localhost:3000"

    postgres_dsn: str = Field(
        default="postgresql+asyncpg://translify:translify@localhost:5432/translify",
    )

    redis_url: str = "redis://localhost:6379/0"

    minio_root_user: str = "translify"
    minio_root_password: str = "translify-dev"
    minio_bucket: str = "translify"
    minio_public_url: str = "http://localhost:9000"
    minio_internal_url: str = "http://localhost:9000"

    jwt_secret: str = "dev-secret-change-me"
    jwt_lifetime_seconds: int = 60 * 60 * 24 * 30  # 30 days

    anthropic_api_key: str = ""
    deepl_api_key: str = ""
    # Gemini — used for quiz generation by default (Flash Lite is ~30x cheaper
    # than Claude Sonnet for structured-output tasks). Leave empty to fall back
    # to Anthropic.
    gemini_api_key: str = ""

    # Stripe billing
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_publishable_key: str = ""
    stripe_price_reader_monthly: str = ""
    stripe_price_reader_yearly: str = ""
    stripe_price_scholar_monthly: str = ""
    stripe_price_scholar_yearly: str = ""
    stripe_price_family_monthly: str = ""
    stripe_price_family_yearly: str = ""
    # First-month discount applied via Stripe coupon (created in dashboard).
    stripe_first_month_coupon: str = ""

    # Google OAuth (leave empty to disable the Google login button)
    google_client_id: str = ""
    google_client_secret: str = ""

    # Transactional email (Resend)
    resend_api_key: str = ""
    email_from_name: str = "Translify"
    email_from_address: str = "hello@translify.app"
    email_reply_to: str = "hello@translify.app"

    # IP geolocation — used by GET /geo to suggest a UI language from the
    # visitor's country. Keyless by default (ipwho.is); ``{ip}`` is substituted
    # with the resolved client IP. Set empty to disable IP detection entirely
    # (the web app then falls back to browser language only).
    geoip_provider_url: str = "https://ipwho.is/{ip}"
    geoip_timeout_seconds: float = 2.5
    geoip_cache_ttl_seconds: int = 60 * 60 * 24 * 7  # 7 days

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def async_postgres_dsn(self) -> str:
        """DSN normalized to use the asyncpg driver.

        Accepts ``postgres://`` or ``postgresql://`` and rewrites to
        ``postgresql+asyncpg://`` so that operators don't have to remember
        the SQLAlchemy-specific prefix.
        """
        dsn = self.postgres_dsn
        if dsn.startswith("postgresql+"):
            return dsn
        if dsn.startswith("postgresql://"):
            return "postgresql+asyncpg://" + dsn[len("postgresql://"):]
        if dsn.startswith("postgres://"):
            return "postgresql+asyncpg://" + dsn[len("postgres://"):]
        return dsn

    @property
    def sync_postgres_dsn(self) -> str:
        """Same DSN but using psycopg's sync driver — for one-shot scripts."""
        dsn = self.async_postgres_dsn
        return dsn.replace("postgresql+asyncpg://", "postgresql://", 1)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
