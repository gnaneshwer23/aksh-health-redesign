# Demo launch credentials (ops)

**Date:** July 2026  
**Scope:** Synthetic HITL demo on akshhealth.com / Vercel — **not** live NHS credentials.

## Hard rules

- Never commit `.env.local`, real patient data, Partner secrets, or Medplum Client Secrets.
- `liveEmis:false` always for demo launch. Do not invent “demo EMIS” accounts.
- Prefer signup for stakeholder walkthroughs when you need a personal mailbox.
- Shared cohort passwords below are **synthetic demo accounts only** (`@demo.akshhealth.com`) — not production staff secrets.

## How to get a demo login (signup path)

1. Open **`/signup`** on the target host (local or https://akshhealth.com).
2. Create a GP (or Admin) account with a real mailbox you control.
3. Complete onboarding role select if prompted.
4. Use that account for the walkthrough: `/demo/script` → Capture → Accept → export.

## Demo cohort accounts (100 users · seeded)

Scale / outcomes / multi-role demos use the synthetic cohort:

```bash
npm run seed:demo-cohort -- --apply
# optional graph: --with-neo4j
```

| Role | Sample email | Password |
|------|--------------|----------|
| GP | `gp01@demo.akshhealth.com` | `AkshDemoCohort!2026` |
| Nurse | `nurse01@demo.akshhealth.com` | `AkshDemoCohort!2026` |
| Pharmacist | `pharmacist01@demo.akshhealth.com` | `AkshDemoCohort!2026` |
| Admin | `admin01@demo.akshhealth.com` | `AkshDemoCohort!2026` |
| ICS | `ics01@demo.akshhealth.com` | `AkshDemoCohort!2026` |
| Hospital | `hospital01@demo.akshhealth.com` | `AkshDemoCohort!2026` |
| Patient | `patient01@demo.akshhealth.com` | `AkshDemoCohort!2026` |
| Researcher | `researcher01@demo.akshhealth.com` | `AkshDemoCohort!2026` |

- Emails: `{role}{01–NN}@demo.akshhealth.com` (see [`DEMO_COHORT_SEED.md`](./DEMO_COHORT_SEED.md)).
- Override: set `DEMO_COHORT_PASSWORD` in `.env.local` before `--apply`.
- Reset: `npm run seed:demo-cohort -- --reset --apply` or `npm run auth:cleanup-demo -- --apply`.
- Patients: **P001–P100** in `lib/mock-data/patients.ts` (P001–P012 demos unchanged).

## Smoke / CI scripts

Walkthrough and dashboard smokes require env-provided credentials (no defaults in smoke helpers):

```bash
export SMOKE_EMAIL="gp01@demo.akshhealth.com"
export SMOKE_PASSWORD="AkshDemoCohort!2026"
npm run smoke:walkthrough
```

Helpers: `scripts/lib/smoke-credentials.mjs` → `requireSmokeCredentials()`.

Optional local file (gitignored): `.env.local` with the same vars plus `DATABASE_URL`, `NEXTAUTH_SECRET`, AI Gateway keys.

## What to say in the room

| Say | Do not say |
|---|---|
| Synthetic / seeded patients | Real NHS patient login |
| Clinician Accept required | Autonomous write to EMIS |
| Sim write-back / BRIDGE staging | Connected to the GP record |
| Cohort `@demo.akshhealth.com` accounts or signup for this demo | Live NHS Identity / CIS2 |

## Related

- [`DEMO_COHORT_SEED.md`](./DEMO_COHORT_SEED.md) — how to run / reset the 100×100 cohort
- [`DEMO_LAUNCH_WITHOUT_IM1.md`](./DEMO_LAUNCH_WITHOUT_IM1.md)
- [`DEMO_LAUNCH_D1_AUDIT.md`](./DEMO_LAUNCH_D1_AUDIT.md)
- [`PILOT_PACKAGE.md`](./PILOT_PACKAGE.md)
- `/demo/script` — guided Capture→export script
