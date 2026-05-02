# Deploying Translify

Target: your Hetzner dedicated server, with Virtualmin managing
`translify.app`. Apache is the public-facing reverse proxy; everything
else runs in Docker bound to `127.0.0.1`.

## 1. Prereqs on the server

- Docker + docker compose plugin installed
- Apache modules enabled (Virtualmin → Webmin → Servers → Apache → Configure → Modules):
  - `proxy`, `proxy_http`
  - `rewrite` (already on)
  - **NOT** required: `proxy_wstunnel` (we use SSE over HTTP, not WebSockets)
- Your existing Postgres has the `pgvector` extension installed:
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```
  (The migration also runs this, but the role needs CREATE EXTENSION privilege.)

## 2. Set up Virtualmin subdomains

In Virtualmin, create two sub-servers under `translify.app`:

- **api.translify.app** — proxies to FastAPI (port 8000)
- **files.translify.app** — proxies to MinIO (port 9000)

(`app.translify.app` goes to Vercel — set its DNS A/CNAME at the registrar
or to Vercel's IPs, and don't create a Virtualmin sub-server for it.)

Issue Let's Encrypt certs for both via Virtualmin.

## 3. Apache vhost config

Per Virtualmin sub-server, edit the SSL vhost (Webmin → Apache →
Edit Directives) and add inside the `<VirtualHost ... :443>` block:

### `api.translify.app`

```apache
ProxyPreserveHost On
ProxyRequests Off

# CRITICAL for SSE streaming chat — disable buffering and gzip on this host.
SetEnv proxy-sendchunked 1
SetEnv no-gzip 1
RequestHeader set X-Forwarded-Proto "https"

ProxyPass        / http://127.0.0.1:8000/ flushpackets=on retry=0 timeout=600
ProxyPassReverse / http://127.0.0.1:8000/
```

### `files.translify.app`

```apache
ProxyPreserveHost On
ProxyRequests Off

# Allow large uploads (adjust as you like — 200MB shown)
LimitRequestBody 209715200
RequestHeader set X-Forwarded-Proto "https"

ProxyPass        / http://127.0.0.1:9000/ retry=0 timeout=600
ProxyPassReverse / http://127.0.0.1:9000/
```

> **Note.** Virtualmin's `.htaccess` does support `RewriteRule ... [P]`
> for proxying, but the `<VirtualHost>`-level directives above are
> cleaner, faster, and let you set the SSE-critical env vars and headers.

Restart Apache after editing: `systemctl reload apache2` (or
`httpd` on RHEL-likes).

## 4. Configure environment

```bash
cp .env.example .env
$EDITOR .env
```

Important values to set:
- `POSTGRES_DSN` — point to your Postgres. From inside Docker, the host
  is reachable as `host.docker.internal` thanks to the `extra_hosts`
  block in compose. So:
  `postgresql+asyncpg://USER:PASS@host.docker.internal:5432/translify`
- `REDIS_URL` — same: `redis://host.docker.internal:6379/0`
- `JWT_SECRET` — `python -c "import secrets; print(secrets.token_urlsafe(64))"`
- `MINIO_ROOT_PASSWORD` — long random string
- `MINIO_PUBLIC_URL=https://files.translify.app`
- `MINIO_INTERNAL_URL=http://minio:9000`
- `CORS_ORIGINS=https://app.translify.app`
- API keys: `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY`, `DEEPL_API_KEY`

## 5. Build and run

```bash
docker compose build
docker compose up -d
```

## 6. Run migrations and create MinIO bucket

```bash
# Migrations
docker compose run --rm api alembic upgrade head

# Create the bucket (one-time)
docker compose run --rm api python -c \
  "from app.storage import ensure_bucket; ensure_bucket(); print('ok')"
```

## 7. Deploy the web app

For Vercel:
1. Push the repo to GitHub.
2. In Vercel, import the project, set the root directory to `apps/web`.
3. Set env var: `NEXT_PUBLIC_API_URL=https://api.translify.app`.
4. Add `app.translify.app` as a custom domain.

To self-host the web app instead, see `apps/web/README.md`.

## 8. Smoke test

```bash
# Health
curl https://api.translify.app/health
# => {"status":"ok"}

# Register a user
curl -X POST https://api.translify.app/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"hunter22hunter22"}'

# Log in
curl -X POST https://api.translify.app/auth/jwt/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=test@example.com&password=hunter22hunter22'
```

## Updating

```bash
git pull
docker compose build
docker compose run --rm api alembic upgrade head
docker compose up -d
```

## Logs

```bash
docker compose logs -f api
docker compose logs -f worker
```
