# Deployment consolidation — Aksh Health UK platform

Environment variables for production (Vercel) and local development. **Never commit real secrets** — use placeholders in docs and set values in the Vercel dashboard or `.env.local`.

## Required — Auth (NextAuth + Neon)

| Variable | Example / notes |
|----------|-----------------|
| `NEXTAUTH_URL` | `https://0ne-health.vercel.app` |
| `NEXTAUTH_SECRET` | Generate: `openssl rand -base64 32` |
| `DATABASE_URL` | `postgresql://...@...neon.tech/neondb?sslmode=require` |

Ensure auth schema after first deploy: `npm run auth:schema` (requires `DATABASE_URL`). Users sign up via `/signup` — demo accounts were removed.

## Optional — Neo4j Aura (Phase D / G)

Until these are set, ORACLE / GUARDIAN / ICS APIs use mock fallback (`X-Data-Source: mock`) and dashboards show a **mock mode** banner.

| Variable | Example / notes |
|----------|-----------------|
| `NEO4J_URI` | `neo4j+s://YOUR_INSTANCE.databases.neo4j.io` |
| `NEO4J_USERNAME` | `neo4j` |
| `NEO4J_PASSWORD` | Aura-generated password (store in Vercel secrets only) |

After adding variables in Vercel, redeploy and run `npm run data:seed:neo4j` locally against the Aura instance (see [NEO4J_SETUP.md](./NEO4J_SETUP.md)).

Verify: sign in and call `GET /api/neo4j/health` — expect `{ "connected": true, "mode": "live" }` when Aura is reachable.

Public probe: `GET /api/health` returns `{ status, database, neo4j }` with no secrets.

Full graph setup: [NEO4J_SETUP.md](./NEO4J_SETUP.md).

## Optional — Clinical OAuth

| Variable | Notes |
|----------|-------|
| `CLINICAL_OAUTH_*` | Clinical identity provider (off by default) |

## GitHub Actions — E2E CI secrets

The Playwright workflow (`.github/workflows/e2e.yml`) maps `E2E_DATABASE_URL` → `DATABASE_URL` for test runs.

| Secret | Required | Notes |
|--------|----------|-------|
| `E2E_DATABASE_URL` | **Yes** | Neon **pooled** connection string for CI (dedicated branch or ephemeral DB recommended) |
| `E2E_TEST_PASSWORD` | No | Override default E2E signup password (`E2eTestPass1!`) |

If `E2E_DATABASE_URL` is missing, the workflow fails immediately with a clear error before build/test.

Local E2E: set `DATABASE_URL` in `.env.local` — `E2E_DATABASE_URL` is only needed in GitHub.

## Demo user cleanup (manual only)

Legacy demo accounts may still exist in Neon from earlier phases. **Do not auto-run against production.**

From `packages/platform-uk` with `DATABASE_URL` in `.env.local`:

```bash
# Dry run (default) — lists matching users, deletes nothing
npm run auth:cleanup-demo

# Execute deletion (profiles and onboarding_progress cascade)
npm run auth:cleanup-demo -- --apply
```

Matches:

- `email LIKE '%@demo.akshhealth.com'`
- `doctor@akshhealth.com`, `reviewer@akshhealth.com`, `smoke@akshhealth.com`

## Profile-driven dashboards (Phase D)

Personalization reads from Neon `aksh.profiles` and `aksh.onboarding_progress` via `GET /api/profile`. Session JWT is enriched on sign-in with `fullName` and `organisation` when the database is available.

No extra env vars beyond `DATABASE_URL` are required for profile personalization.

## Vercel checklist

1. Set `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `DATABASE_URL`
2. (Optional) Set `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`
3. Redeploy
4. Run `npm run auth:schema` against production Neon on first deploy
5. Run `npm run data:seed:neo4j` if Neo4j credentials were added (locally against Aura — see NEO4J_SETUP.md)
6. (Optional) Run `npm run auth:cleanup-demo` dry-run, then `--apply` only after reviewing matches

## GitHub checklist

1. Add `E2E_DATABASE_URL` (Neon pooled connection string)
2. (Optional) Add `E2E_TEST_PASSWORD`
