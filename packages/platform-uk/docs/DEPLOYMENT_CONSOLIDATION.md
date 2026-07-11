# Deployment consolidation — Aksh Health UK platform

Environment variables for production (Vercel) and local development. **Never commit real secrets** — use placeholders in docs and set values in the Vercel dashboard or `.env.local`.

## Required — Auth (NextAuth + Neon)

| Variable | Example / notes |
|----------|-----------------|
| `NEXTAUTH_URL` | `https://0ne-health.vercel.app` |
| `NEXTAUTH_SECRET` | Generate: `openssl rand -base64 32` |
| `DATABASE_URL` | `postgresql://...@...neon.tech/neondb?sslmode=require` |

Ensure auth schema after first deploy: `npm run auth:schema` (requires `DATABASE_URL`). Users sign up via `/signup` — demo accounts were removed.

## Optional — Neo4j Aura (Phase D)

Until these are set, ORACLE / GUARDIAN / ICS APIs use mock fallback (`X-Data-Source: mock`).

| Variable | Example / notes |
|----------|-----------------|
| `NEO4J_URI` | `neo4j+s://YOUR_INSTANCE.databases.neo4j.io` |
| `NEO4J_USERNAME` | `neo4j` |
| `NEO4J_PASSWORD` | Aura-generated password (store in Vercel secrets only) |

After adding variables in Vercel, redeploy and run `npm run data:seed:neo4j` locally against the Aura instance (or from CI with env injected).

Verify: sign in and call `GET /api/neo4j/health` — expect `{ "connected": true, "mode": "live" }` when Aura is reachable.

Full graph setup: [NEO4J_SETUP.md](./NEO4J_SETUP.md).

## Optional — Clinical OAuth

| Variable | Notes |
|----------|-------|
| `CLINICAL_OAUTH_*` | Clinical identity provider (off by default) |

## Profile-driven dashboards (Phase D)

Personalization reads from Neon `aksh.profiles` and `aksh.onboarding_progress` via `GET /api/profile`. Session JWT is enriched on sign-in with `fullName` and `organisation` when the database is available.

No extra env vars beyond `DATABASE_URL` are required for profile personalization.

## Vercel checklist

1. Set `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `DATABASE_URL`
2. (Optional) Set `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`
3. Redeploy
4. Run `npm run auth:schema` against production Neon on first deploy
5. Run `npm run data:seed:neo4j` if Neo4j credentials were added
