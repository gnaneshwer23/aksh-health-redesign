# Demo launch credentials (ops)

**Date:** July 2026  
**Scope:** Synthetic HITL demo on akshhealth.com / Vercel — **not** live NHS credentials.

## Hard rules

- **No baked-in shared demo passwords** in the repo (removed intentionally).
- Never commit `.env.local`, real patient data, Partner secrets, or Medplum Client Secrets.
- `liveEmis:false` always for demo launch. Do not invent “demo EMIS” accounts.

## How to get a demo login

1. Open **`/signup`** on the target host (local or https://akshhealth.com).
2. Create a GP (or Admin) account with a real mailbox you control.
3. Complete onboarding role select if prompted.
4. Use that account for the walkthrough: `/demo/script` → Capture → Accept → export.

## Smoke / CI scripts

Walkthrough and dashboard smokes require env-provided credentials (no defaults):

```bash
export SMOKE_EMAIL="you@example.com"
export SMOKE_PASSWORD="your-signup-password"
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
| Account created via signup for this demo | Shared “demo/demo” password |

## Related

- [`DEMO_LAUNCH_WITHOUT_IM1.md`](./DEMO_LAUNCH_WITHOUT_IM1.md)
- [`DEMO_LAUNCH_D1_AUDIT.md`](./DEMO_LAUNCH_D1_AUDIT.md)
- [`PILOT_PACKAGE.md`](./PILOT_PACKAGE.md)
- `/demo/script` — guided Capture→export script
