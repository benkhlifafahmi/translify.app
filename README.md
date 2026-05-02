# Translify

SaaS for uploading PDF/EPUB books and using AI to translate them, chat with them, and generate quizzes from them.

## Monorepo Layout

```
apps/
  api/      FastAPI backend + RQ workers
  web/      Next.js 15 web app
  mobile/   Flutter app (Phase 6, skeleton only)
```

## Phase 0 Status

- [x] Monorepo structure
- [x] FastAPI + FastAPI-Users auth
- [x] Postgres schema (books, chunks, translations, chats, quizzes)
- [x] MinIO storage + RQ queue
- [x] Next.js shell with login/register/library
- [x] docker-compose for self-host deploy

Next: **Phase 1 — Upload & Library** (R2/MinIO presigned uploads, parse + chunk + embed pipeline).

## Local Development

See `apps/api/README.md` and `apps/web/README.md`.

## Deploy

See `DEPLOY.md`.
