# Translify Web

Next.js 15 + React 19 + Tailwind v4 + shadcn-style components.

## Local dev

```bash
pnpm install   # or npm / yarn / bun
cp .env.local.example .env.local
pnpm dev
```

App at http://localhost:3000. Make sure the API is running on http://localhost:8000.

## Deploy

Two options:
- **Vercel** — push to GitHub, import project, set `NEXT_PUBLIC_API_URL=https://translify.app/api` only if your apex traffic can reach the same path-backed API (see root `DEPLOY.md`).
- **Self-host** — `pnpm build` produces `.next/standalone`. Drop into Docker or run `node .next/standalone/server.js` behind Apache.
