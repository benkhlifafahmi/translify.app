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

# Run API (localhost only)
uv run uvicorn app.main:app --reload

# Run API and accept connections from the LAN (phone, other devices)
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run worker (in another terminal)
uv run python -m app.workers.worker
```

API runs on http://localhost:8000 — docs at `/docs`.

### Reaching the API from a phone or another device on the LAN

Default `uvicorn` binds to `127.0.0.1`, which is unreachable from anything but
the host machine. To use the API from the Flutter app on your phone:

1. Bind to all interfaces by adding `--host 0.0.0.0` (see above).
2. Find your machine's LAN IP — `ip -4 -br addr` on Linux, `ipconfig getifaddr en0` on macOS.
3. Make sure your firewall allows inbound TCP 8000 (and 9000 if you also use MinIO).
4. In `.env`, add the LAN origin to `CORS_ORIGINS` so the web app from a phone
   browser can hit it too:

   ```env
   CORS_ORIGINS=http://localhost:3000,http://192.168.178.51:3000
   ```

5. If you upload books from the phone, the API hands back **presigned MinIO URLs**
   pointing at `MINIO_PUBLIC_URL`. That URL must also be reachable from the phone.
   Update `.env` accordingly:

   ```env
   MINIO_PUBLIC_URL=http://192.168.178.51:9000
   ```

   …and either run MinIO bound to `0.0.0.0:9000` (host networking) or, if you use
   the compose file, change the `minio` and `api` port mappings from
   `127.0.0.1:9000:9000` → `0.0.0.0:9000:9000` (and `8000` likewise) for dev.
6. Point the Flutter app at your LAN IP:

   ```bash
   flutter run --dart-define=API_URL=http://192.168.178.51:8000
   ```

## Migrations

```bash
# Create new migration after model changes
uv run alembic revision --autogenerate -m "describe change"

# Apply migrations
uv run alembic upgrade head

# Roll back one
uv run alembic downgrade -1
```
