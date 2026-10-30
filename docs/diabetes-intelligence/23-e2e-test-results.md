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
| INT-01…05, INT-09…10 | Registered — not fixed in this ship |

## CI note

Recorded locally against local-dev Neon. CI Playwright with DATABASE_URL should pick up `e2e/connected-diabetes-journey.spec.ts` under the existing `test:e2e` config.
