# Deploying Translify

Target: your Hetzner dedicated server, with Virtualmin managing
`translify.app`. Apache is the public-facing reverse proxy; everything
else runs in Docker bound to `127.0.0.1`.

Path-based routing keeps the stack on one hostname:

- **`https://translify.app/api/...`** → FastAPI (port 8000)
- **`https://translify.app/files/...`** → MinIO (port 9000)

The FastAPI and MinIO containers still listen at `/` internally; Apache
strips the `/api/` and `/files/` prefixes when proxying.

> **Single origin.** These rules assume TLS for `translify.app` terminates
> on this Apache box (typical if you self-host the Next app here). If the
> apex domain is served elsewhere (e.g. Vercel), `/api` on that host is not
> this server unless you add **their** edge rewrites to proxy `/api` and
> `/files` to a reachable backend URL.

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

## 2. Virtualmin + DNS

Use the **top-level virtual server** for `translify.app` (one TLS host).
Issue Let's Encrypt for it in Virtualmin.

You do **not** need separate `api.*` or `files.*` sub-servers for this layout.

## 3. Apache vhost config

Edit the **SSL** vhost for `translify.app` (Webmin → Apache → Edit Directives)
and add **inside** the `<VirtualHost ... :443>` block.

**Ordering:** define `/api/` and `/files/` **before** any `ProxyPass / ...`
that sends the rest of the site to Next.js (or another upstream).

```apache
ProxyPreserveHost On
ProxyRequests Off
RequestHeader set X-Forwarded-Proto "https"

# Normalize /api → /api/ so ProxyPass prefix matches
RewriteEngine On
RewriteRule ^/api$ /api/ [R=301,L]

# SSE-friendly proxy env for anything under /api
<LocationMatch ^/api>
    SetEnv proxy-sendchunked 1
    SetEnv no-gzip 1
</LocationMatch>

ProxyPass        /api/  http://127.0.0.1:8000/ flushpackets=on retry=0 timeout=600
ProxyPassReverse /api/  http://127.0.0.1:8000/

# MinIO (S3 path-style: /bucket/key — strip /files/ prefix)
LimitRequestBody 209715200
ProxyPass        /files/ http://127.0.0.1:9000/ retry=0 timeout=600
ProxyPassReverse /files/ http://127.0.0.1:9000/
```

If you self-host the Next standalone server on the same machine (e.g. port
3000), add **after** the block above:

```apache
ProxyPass        / http://127.0.0.1:3000/ retry=0 timeout=600
ProxyPassReverse / http://127.0.0.1:3000/
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
- `JWT_SECRET` — `python -c "import secrets; print(secrets.token_urlsafe(64))"`
- `MINIO_ROOT_PASSWORD` — long random string
- `MINIO_PUBLIC_URL=https://translify.app/files` — no trailing slash; must
  match the public path Apache exposes to MinIO
- `MINIO_INTERNAL_URL=http://minio:9000`
- `API_PUBLIC_URL=https://translify.app/api`
- `WEB_PUBLIC_URL=https://translify.app`
- `CORS_ORIGINS=https://translify.app` (comma-separated if you add more
  origins later)
- API keys: `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY`, `DEEPL_API_KEY`

Compose overrides `REDIS_URL` for the `api` and `worker` services to the
in-cluster `redis` container; you do not need host Redis for the default
setup.

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

Set the browser API base to the **path**, without a trailing slash (the
client concatenates paths like `/health`):

`NEXT_PUBLIC_API_URL=https://translify.app/api`

**Self-host Next on this server:** build per `apps/web/README.md`, run
standalone Node on `127.0.0.1:3000`, and use the `ProxyPass /` lines in §3.

**Vercel:** only works with the same `/api` URL if the apex (or `www`) you
use actually reaches an edge that proxies `/api` and `/files` to this
stack; otherwise keep a dedicated backend hostname or self-host the site on
Hetzner.

## 8. Smoke test

```bash
# Health
curl https://translify.app/api/health
# => {"status":"ok"}

# Register a user
curl -X POST https://translify.app/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"hunter22hunter22"}'

# Log in
curl -X POST https://translify.app/api/auth/jwt/login \
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
