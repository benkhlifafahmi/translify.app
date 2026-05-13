FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1

# System deps for pdfplumber/ebooklib/asyncpg
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq5 \
        libxml2 \
        libxslt1.1 \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv via PyPI. Was previously `COPY --from=ghcr.io/astral-sh/uv:latest`,
# but GHCR rate-limits and occasionally fails metadata lookups during builds.
# PyPI is more reliable from CI/server environments.
RUN pip install --no-cache-dir uv

WORKDIR /app

# Install deps first (better layer caching)
COPY pyproject.toml ./
RUN uv pip install --system --requirement pyproject.toml

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
