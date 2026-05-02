# Translify API

FastAPI backend + RQ workers.

## Local dev

Requires Python 3.12+, [uv](https://docs.astral.sh/uv/), and a running Postgres (with `pgvector` extension) + Redis.

```bash
# Install deps
uv sync

# Copy env and edit
cp .env.example .env

# Run migrations
uv run alembic upgrade head

# Run API
uv run uvicorn app.main:app --reload

# Run worker (in another terminal)
uv run python -m app.workers.worker
```

API runs on http://localhost:8000 — docs at `/docs`.

## Migrations

```bash
# Create new migration after model changes
uv run alembic revision --autogenerate -m "describe change"

# Apply migrations
uv run alembic upgrade head

# Roll back one
uv run alembic downgrade -1
```
