# 23 — E2E automated test results

**Date:** 30 October 2026  
**Environment:** Neon **local-dev** (`getDeploymentEnvironment()=local`) · `USE_POSTGRES=true`  
**Package:** `packages/platform-uk`  
**Command:** `npx playwright test e2e/connected-diabetes-journey.spec.ts`  
**Production Neon:** not used · no writes

## Summary

| Suite | Result | Notes |
|-------|--------|-------|
| API path: seed → HITL → timeline; safety + isolation | **PASS** | ~84s |
| UI: flagship demo + connected chrome + timeline page | **PASS** | ~13s |
| **Overall** | **2 passed** | ~1.7m wall |

## Covered behaviours

- Malformed action / missing review → 400/error with `ehrWrite: false`
- Patient 360 seed
- Glucose seed → draft review → Accept; second draft → Reject
- Journey seed → draft care plan → Accept
- Medication seed → template → Edit decision; `autonomousPrescribe=false`
- Continuous care seed → escalation Reject
- Agent seed → orchestration → Accept; provenance `ai_generated` → `clinician_verified`; no prescribe
- Timeline GET
- Persistence re-GET glucose readings/HbA1c
- Second GP scope isolation (`ehrWrite` false)
- Unauthenticated → 401/403
- `/demo/connected-diabetes` disclosure + beat UI
- `/dashboard/gp/patients/P002/timeline` + `ConnectedPatientChrome`
- Patient 360 chrome + stepper

## Local-dev prep noted

Applied pending additive migrations **046–048** on local-dev only (medcare / continuous / agent tables). Status tool: `npx tsx --env-file=.env.local scripts/db-migrate.ts --apply`.

## Bugs found & disposition

| Issue | Disposition |
|-------|-------------|
| INT-06 missing timeline page | Fixed (page + chrome) |
| Tailwind ESM `require("tailwindcss-animate")` crashed CSS compile | Fixed (ESM import) |
| Medcare/continuous seed PK collision across `scope_key` (INT-16) | Mitigated (`ON CONFLICT DO UPDATE`) |
| INT-01…05, INT-10 | Registered — not fixed in this ship |
| INT-09 weak patient API access | Fixed later — `denyUnlessConnectedPatientAccess` + `tests/connected-patient-api-access.test.ts` |
| INT-01…03 orchestration / dual stores | Mitigated later — PR #75 (`e5c90ac`); facades + pipeline; Neon prod untouched |

## CI note

Recorded locally against local-dev Neon. CI Playwright with DATABASE_URL should pick up `e2e/connected-diabetes-journey.spec.ts` under the existing `test:e2e` config.

## Production deploy confirmation

| Item | Value |
|------|-------|
| Merge SHA (UX/E2E chrome) | `6545c20aadeae4dfba2a2058cb958af4de180f54` |
| Vercel deployment | `dpl_1aq2CwpYFt55qNSQSYzqfsTWcVMB` |
| readyState | **READY** |
| Aliases | `www.akshhealth.com`, `akshhealth.com` |

### INT-01–03 merge (PR #75)

| Item | Value |
|------|-------|
| Merge SHA | `e5c90ac823a90ec6f844489589e27d7dc512a656` |
| Vercel `aksh-health-redesign` | **Not READY yet** — GitHub status: *Deployment rate limited — retry in 24 hours* |
| Local `npm run build` | **PASS** before merge |
| Neon production | **Untouched** (no migrations in PR) |
