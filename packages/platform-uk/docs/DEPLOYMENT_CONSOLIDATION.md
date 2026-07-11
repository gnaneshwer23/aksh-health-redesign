# Deployment consolidation — Aksh Health UK platform

Environment variables for production (Vercel) and local development. **Never commit real secrets** — use placeholders in docs and set values in the Vercel dashboard or `.env.local`.

## P0 launch checklist

Before promoting to production:

1. Set required Vercel env vars (see tables below)
2. Set `RESEND_API_KEY` **or** SMTP credentials for password reset, email verification, and organisation enquiry emails
3. Set `ACCESS_REQUEST_NOTIFY_EMAIL` to your team inbox
4. Add `E2E_DATABASE_URL` in GitHub Actions secrets for CI
5. Run `npm run auth:schema` against production Neon (includes password reset and email verification tables)
6. Rotate Neon database password if it was ever exposed (manual, in Neon console)
7. Run `npm run auth:cleanup-demo` dry-run, review matches, then `--apply` if needed (manual)
8. Run pre-launch checks and smoke tests with real credentials (see below)

## P1 launch checklist

| Item | Status | Notes |
|------|--------|-------|
| P1a Email verification | Code | Signup sends verify email; `GET /api/auth/verify-email?token=`; `/verify-email` page; dashboard banner until verified |
| P1b Rate limiting | Code | `POST /api/auth/signup` max 5/IP/hour; `POST /api/auth/forgot-password` max 3/IP/hour |
| P1c Error monitoring | Code | `lib/monitoring.ts` structured logging; optional `SENTRY_DSN` (no SDK dependency by default) |
| P1d Performance | Code | Homepage `dynamic()` for AgentGrid/VoiceAgentSection; font preconnect |
| P1e Accessibility | Code | Skip link, navbar focus rings, form aria labels, cookie banner keyboard support |
| P1f Neo4j Aura | Manual | Set `NEO4J_*` in Vercel, redeploy, run `npm run data:seed:neo4j` (see NEO4J_SETUP.md) |
| P1f Custom domain | Manual | Vercel project → Settings → Domains; update `NEXTAUTH_URL` to production domain |

### P1a — Email verification

Migration: `db/migrations/006_email_verification.sql` adds `aksh.users.email_verified_at` and `aksh.email_verification_tokens`.

Routes:

- `GET /api/auth/verify-email?token=` — marks user verified, redirects to `/verify-email?status=success|expired`
- `POST /api/auth/resend-verification` — authenticated resend (max 3/IP/hour)
- `/verify-email` — pending, success, and expired states

Sign-in is allowed before verification. A dashboard banner reminds users until `email_verified_at` is set.

E2E/CI: set `SKIP_EMAIL_SEND=true` to skip outbound email and auto-verify signups (Playwright webServer sets this).

### P1b — Rate limiting

In-memory per-instance limits via `lib/rate-limit.ts`. Returns HTTP 429 with `Retry-After` when exceeded.

### P1c — Error monitoring

`reportError()` in `lib/monitoring.ts` logs structured JSON server-side. Set `SENTRY_DSN` as a placeholder for future Sentry SDK wiring, or use [Vercel Observability](https://vercel.com/docs/observability) for production logs.

### P1d — Lighthouse

Run against local production build:

```bash
cd packages/platform-uk
npm run build && npm run start
# In another terminal
npm run lighthouse          # desktop report → .lighthouse/report.html
npm run lighthouse:mobile   # mobile form factor → .lighthouse/report-mobile.html
```

Or with npx directly:

```bash
npx lighthouse http://localhost:3000 --only-categories=performance,accessibility --view
```

## P2 launch checklist (nice-to-have before broad launch)

| Item | Status | Notes |
|------|--------|-------|
| P2a Performance / Lighthouse | Code | `npm run lighthouse` / `lighthouse:mobile`; homepage `dynamic()` for below-fold sections; font `display=swap` + preconnect/preload |
| P2b Accessibility (WCAG quick pass) | Code | Hero/nav contrast fixes; Solutions dropdown keyboard (Escape, focus trap); form `aria-describedby`; HITL `aria-label`; axe E2E |
| P2c HITL review queue polish | Code | Accept/Edit/Reject toasts; Draft/Accepted/Rejected status badges with contrast |
| P2d Access request admin notification | Code | `notifyAccessRequestSubmitted` + `ACCESS_REQUEST_NOTIFY_EMAIL`; admin sidebar badge for submitted enquiries |
| P2e Production cleanup & monitoring docs | Docs | Demo user cleanup runbook; Neon PITR; `/api/health` uptime note |
| P2f E2E expansion | Code | `e2e/accessibility.spec.ts` (axe on `/` and `/signup`); optional LCP budget test (skipped in CI) |

### P2a — Performance targets

Run Lighthouse after a production build (`npm run build && npm run start`). Targets for marketing homepage (mobile):

| Metric | Target | Notes |
|--------|--------|-------|
| Performance score | ≥ 80 | Local dev may score lower; validate on Vercel preview |
| LCP | < 2.5s | Hero text and CTA are LCP candidates; avoid large images above fold |
| Accessibility score | ≥ 90 | Complement with `npm run test:e2e -- e2e/accessibility.spec.ts` |
| CLS | < 0.1 | Dynamic imports use min-height placeholders |

Optimisations in code:

- `app/page.tsx`: `dynamic()` for ProblemSection, HowItWorks, AgentGrid, VoiceAgentSection
- `app/layout.tsx`: Google Fonts preconnect + preload (`display=swap` in CSS import)
- Marketing pages use CSS/Tailwind (no unoptimised `<img>` tags); add `next/image` when raster assets are introduced

### P2b — Accessibility manual checklist

After deploy, spot-check:

1. Tab from page load: skip link → main nav → hero CTAs
2. Solutions menu: Enter opens, Tab cycles links, Escape closes and returns focus to trigger
3. Sign-in/sign-up: field errors announced via `aria-describedby`; global error linked to form
4. GP review queue: Accept/Edit/Reject buttons have descriptive `aria-label`s
5. Run `npm run test:e2e -- e2e/accessibility.spec.ts` for axe-core scan

### P2e — Demo user cleanup runbook

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

Review dry-run output before `--apply`. Re-run dry-run after apply to confirm zero matches.

### P2e — Neon backup and point-in-time restore

Neon provides automatic backups and point-in-time restore (PITR) per branch:

1. Open your project in the [Neon console](https://console.neon.tech/)
2. Select the production branch
3. **Branches** → **Restore** or **Create branch from timestamp** for PITR
4. Docs: [Neon point-in-time restore](https://neon.tech/docs/guides/branch-restore)

After restore to a new branch, update `DATABASE_URL` in Vercel only if you promote that branch to production.

### P2e — Uptime monitoring

Public health probe (no secrets):

```bash
curl -s https://YOUR_DOMAIN/api/health | jq .
# Expect: { "status": "ok", "database": "connected"|"unconfigured", "neo4j": "..." }
```

Optional: configure an external uptime checker (Better Uptime, UptimeRobot, Vercel Monitoring) to poll `GET /api/health` every 5 minutes and alert on non-200 or `status != ok`.

### P2d — Organisation enquiry emails

On `POST /api/access-requests` success:

1. Record saved to `aksh.pilot_applications`
2. Email sent to `ACCESS_REQUEST_NOTIFY_EMAIL` via Resend/SMTP (`lib/email/notify-access-request.ts`)

Verify in staging:

```bash
# Set RESEND_API_KEY, EMAIL_FROM, ACCESS_REQUEST_NOTIFY_EMAIL in .env.local
npm run dev
# Submit /get-started form, confirm team inbox receives notification
```

Admin dashboard shows a badge on **Organisation Enquiries** when `submittedCount > 0` (`GET /api/admin/access-requests`).

### P1f — Neo4j Aura (manual)

1. Create an AuraDB instance at [neo4j.com/cloud/aura](https://neo4j.com/cloud/aura/)
2. Add `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD` in Vercel
3. Redeploy
4. Run `npm run data:seed:neo4j` locally against Aura (see [NEO4J_SETUP.md](./NEO4J_SETUP.md))
5. Verify `GET /api/neo4j/health` returns `{ "connected": true, "mode": "live" }`

### P1f — Custom domain (manual)

1. Vercel project → **Settings** → **Domains** → add your domain (e.g. `app.akshhealth.com`)
2. Configure DNS per Vercel instructions
3. Update `NEXTAUTH_URL` to the canonical HTTPS URL
4. Redeploy

```bash
cd packages/platform-uk
npm run prelaunch:check
npm run verify && npm run build
npm run smoke:public
# With real signed-in credentials against staging/production:
npm run smoke:gp
```

## Required — Auth (NextAuth + Neon)

| Variable | Example / notes |
|----------|-----------------|
| `NEXTAUTH_URL` | `https://0ne-health.vercel.app` |
| `NEXTAUTH_SECRET` | Generate: `openssl rand -base64 32` |
| `DATABASE_URL` | `postgresql://...@...neon.tech/neondb?sslmode=require` |

Ensure auth schema after first deploy: `npm run auth:schema` (requires `DATABASE_URL`). This applies `002_users_profiles.sql`, `005_password_reset.sql`, and `006_email_verification.sql`. Users sign up via `/signup` with Terms and Privacy consent; a verification email is sent (or auto-verified when `SKIP_EMAIL_SEND=true`).

## Required for production email

Password reset (`/forgot-password`), email verification (signup), and organisation enquiry notifications require an email provider. **Production must configure one of:**

| Provider | Variables |
|----------|-----------|
| **Resend (recommended)** | `RESEND_API_KEY`, `EMAIL_FROM` or `RESEND_FROM` |
| **SMTP** | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` or `EMAIL_FROM` |

| Variable | Notes |
|----------|-------|
| `ACCESS_REQUEST_NOTIFY_EMAIL` | Team inbox notified on `POST /api/access-requests` success (e.g. `team@akshhealth.com`) |

Without email configuration:

- Password reset still creates tokens; in development the reset link is logged to the server console
- Organisation enquiries are still saved to the database; a warning is logged if notification email is not sent
- Production **must** set email env vars before launch

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

Set `SKIP_EMAIL_SEND=true` in the E2E webServer env (Playwright config) so signups are auto-verified without sending email.

If `E2E_DATABASE_URL` is missing, the workflow fails immediately with a clear error before build/test.

Local E2E: set `DATABASE_URL` in `.env.local` — `E2E_DATABASE_URL` is only needed in GitHub.

## Neon password rotation (manual)

If `DATABASE_URL` credentials were ever committed, shared in chat, or exposed in logs:

1. Open the Neon project console
2. Reset the database role password
3. Update `DATABASE_URL` in Vercel and GitHub `E2E_DATABASE_URL`
4. Redeploy and re-run `npm run auth:schema` if needed

## Demo user cleanup (manual only)

See **P2e — Demo user cleanup runbook** above for the full procedure.

Quick reference:

```bash
npm run auth:cleanup-demo           # dry run
npm run auth:cleanup-demo -- --apply
```

## Profile-driven dashboards (Phase D)

Personalization reads from Neon `aksh.profiles` and `aksh.onboarding_progress` via `GET /api/profile`. Session JWT is enriched on sign-in with `fullName` and `organisation` when the database is available.

No extra env vars beyond `DATABASE_URL` are required for profile personalization.

## Vercel env vars summary

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXTAUTH_URL` | Yes | Public app URL |
| `NEXTAUTH_SECRET` | Yes | Session signing |
| `DATABASE_URL` | Yes | Neon Postgres |
| `RESEND_API_KEY` | Production | Transactional email (reset, verification, notifications) |
| `EMAIL_FROM` / `RESEND_FROM` | Production | Email sender address |
| `ACCESS_REQUEST_NOTIFY_EMAIL` | Production | Organisation enquiry inbox |
| `SKIP_EMAIL_SEND` | E2E/CI only | Skip outbound email; auto-verify signups |
| `SENTRY_DSN` | Optional | Future Sentry SDK hook; structured logging works without it |
| `SMTP_*` | Alternative | SMTP instead of Resend |
| `NEO4J_*` | Optional | Live graph data |

## Vercel checklist

1. Set `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `DATABASE_URL`
2. Set `RESEND_API_KEY` (or SMTP) and `ACCESS_REQUEST_NOTIFY_EMAIL`
3. (Optional) Set `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`
4. Redeploy
5. Run `npm run auth:schema` against production Neon on first deploy
6. Run `npm run data:seed:neo4j` if Neo4j credentials were added (locally against Aura — see NEO4J_SETUP.md)
7. (Optional) Run `npm run auth:cleanup-demo` dry-run, then `--apply` only after reviewing matches
8. Run `npm run prelaunch:check` and smoke tests

## GitHub checklist

1. Add `E2E_DATABASE_URL` (Neon pooled connection string)
2. (Optional) Add `E2E_TEST_PASSWORD`

## Pre-launch smoke tests

With the app running and env configured:

```bash
npm run prelaunch:check
npm run smoke:public
```

Against a deployed environment with real credentials, run role-specific smoke scripts (`smoke:gp`, `smoke:admin`, etc.) as needed.
