# Operations runbook

Production: www.akshhealth.com (Vercel project `aksh-health-redesign`, functions in `lhr1` London). Database: Neon
project "Aksh Health Production" (`tiny-river-29853628`, `aws-eu-west-2` London). Simulation: Neon project
`floral-salad-21467299`. Credentials live only in the gitignored `.env.local` / `.env.production.local`.

## Backups and restore

- **Point-in-time restore window: 6 hours** (Neon `history_retention_seconds = 21600` on the current plan).
  **Action for the founder:** before real patients, move production to a plan with at least 7 days (ideally 30) of
  history, or add a nightly logical backup to separate storage. A problem found after 6 hours cannot be undone today.
- **Restore drill (done twice on 2026-10-11, passed):**
  1. `npx neonctl branches create --project-id tiny-river-29853628 --name restore-drill-<date> --parent <UTC timestamp>`
  2. Connect with `npx neonctl connection-string restore-drill-<date> --project-id tiny-river-29853628` and check:
     migrations (`aksh.schema_migrations`), table count, `aksh.deployment_marker = production`, row counts.
     Result (drill 1, 08:23 UTC): 33 migrations (latest `034_cgm_connector`), 43 tables, marker `production`, 0 accounts.
     Result (drill 2, restore point 10:23 UTC, after 035–037): 36 migrations (latest `037_mfa`), 48 tables, marker
     `production`, two-step sign-in tables present. Both drill branches deleted.
  3. `npx neonctl branches delete restore-drill-<date> --project-id tiny-river-29853628`
  4. A real restore: create the branch as above, verify, then point Vercel `DATABASE_URL` at it (or restore the main
     branch from the timestamp in the Neon console). Record who, when and why in the audit log / incident notes.
- Repeat the drill quarterly and after any change of plan.

## Database migrations

- `npm run db:migrate` (status) and `npm run db:migrate -- --apply` (simulation);
  `npx tsx --env-file=.env.production.local scripts/db-migrate.ts --apply` (production). Never edit an applied
  migration; add a new one. Apply to production before (or with) the deploy that needs it.
- Each database is stamped by `scripts/db-mark-deployment.ts`; test, seed and cleanup tooling refuses a database
  marked `production`.

## Scheduled jobs (vercel.json, `CRON_SECRET`)

| Job | When (UTC) | Does |
| --- | --- | --- |
| `/api/cron/access-expiry` | 06:00 daily | Closes slots whose offer window passed |
| `/api/cron/retention` | 03:30 daily | Deletes error events older than 90 days and rate-limit windows older than 24 hours |

Clinical records, consent, audit, go-live history and connector messages are not deleted automatically; their periods
come from the data processing agreement (legal review pending).

## Monitoring and alerts

- Errors: `aksh.error_events` (scrubbed); first occurrence per hour emailed to `OPS_ALERT_EMAIL`;
  `npm run errors:recent:production`.
- Uptime: `/api/health`. **Action:** add an external uptime check (any provider) on `https://www.akshhealth.com/api/health`.

## Rate limits

Counted in the database (`aksh.rate_limits`, keys hashed), shared by every instance; falls back to per-instance memory
if the database is unreachable. Sign-in: 10 per account and 50 per address per 15 minutes. Sign-up, password reset,
invites, patient linking, readings, connectors and chat have their own limits.

## Data export

- Organisation admin: Organisation → Settings → "Download all organisation data" (`/api/orgs/:id/export`).
- Patient: "Download a copy of my data" on their record (`/api/me/export`). Both audited; no secrets included.

## Real workspace (what production shows)

Production (`AKSH_ENVIRONMENT=production`) always runs the real workspace:
- **Navigation:** Today, Fill slots (with the weekly review), Patients, CGM monitoring (clinicians only), Organisation, Security, and Go-live reviews for platform admins.
- **Redirects:** every other dashboard, `/review`, `/cases`, `/intake` and `/workspace` redirect to Today. Patients go to their own page.
- **Removed:** the demo menu, mock notifications, sample-data search, the status debug strip, the first-run demo tips and Asha (synthetic practice).
- **Roles:** sign-up offers clinic staff and patients only. Population health, hospital and research roles are refused server-side.
- **New organisations start empty.** Onboarding never seeds sample patients in production.

To rehearse exactly this elsewhere, set `AKSH_REAL_WORKSPACE=true`. Build with it set, because static pages read it at build time. Then run:
`AKSH_REAL_WORKSPACE=true CI=1 node --env-file=.env.local ./node_modules/.bin/playwright test e2e/real-workspace.spec.ts`

## Platform admins (go-live reviewers)

`npm run platform-admin:production -- --email <email> [--revoke | --list]`. Requires `AKSH_ENVIRONMENT` in the env file.

## Security advisories (dependencies)

- `next` 14.2.35: remaining advisories are fixed only in 15.5.24+. Mitigated now: no Server Actions, no rewrites, no
  Pages Router i18n, image optimizer disabled (`images.unoptimized`), not hosted on Windows. **Planned: upgrade to
  Next 15** (separate change: React 19 and async request APIs).
- Tailwind 3 build tooling (`braces`, `micromatch`, `chokidar`, `postcss-selector-parser`) and the PostCSS copy bundled
  by `next`: build time only, processing our own files; Tailwind stays on 3.4 by project rule.
- Patched now: `next-auth` 4.24.15, `nodemailer` 10.0.6, `postcss` 8.5.28, `nanoid`, `uuid`, `source-map-js`.

## Two-step sign-in (TOTP)

- Users turn it on at `/dashboard/security` (authenticator app; 8 single-use recovery codes shown once).
- **Required for go-live reviewers in production**; recommended for organisation admins.
- Secrets are encrypted with `MFA_ENCRYPTION_KEY` (Vercel production, sensitive; set 2026-10-11). Losing or changing
  that key makes existing secrets unreadable: every user would have to set two-step sign-in up again. Keep a copy in
  the founder's password manager; never commit it.
- A user who lost their phone and their recovery codes: verify identity out of band, then delete their rows from
  `aksh.user_mfa` and `aksh.user_mfa_recovery` (owner connection) and record it in the incident notes.
