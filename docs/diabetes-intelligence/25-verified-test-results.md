# 25 — Verified test results (post-merge audit)

**Date:** 30 October 2026  
**Package:** `packages/platform-uk`  
**DB policy:** Neon **local-dev / simulation only** · production Neon untouched · `LIVE_ORGANISATIONS=0`

## Local verify

| Command | Result |
|---------|--------|
| `npm run verify` | **PASS** (~5.5m) |
| `npx tsc -p tsconfig.tests.json` (after INT-09 Handler fix) | **PASS** |

## Connected diabetes / integration units

| Suite | Result | Notes |
|-------|--------|-------|
| `connected-patient-api-access.test.ts` (INT-09) | **PASS** | 9 GET + 9 POST isolation; 18 routes wired |
| `connected-diabetes-decision-scope.test.ts` (INT-10) | **PASS** | Persona gates |
| `connected-diabetes-orchestration.test.ts` (INT-01…04a) | **PASS** | Canonical care-plan / follow-up + projections |
| `connected-diabetes-org-tenancy.test.ts` (INT-08) | **PASS** helpers | RLS insert skipped: `permission denied for table care_plan_records` on this local role — helpers still asserted |
| `diabetes-intelligence-journey.test.ts` | **PASS** | Vertical slice |
| `patient-intelligence-360.test.ts` | **PASS** | With `.env.local` |
| `diabetes-glucose-intelligence.test.ts` | **PASS** | |
| `medication-personalised-care.test.ts` | **PASS** | |
| `continuous-care-operations.test.ts` | **PASS** | |
| `diabetes-agent-intelligence.test.ts` | **PASS** | |
| `provenance-bridge.test.ts` (INT-13) | **PASS** | New |
| `aksh20-intelligence.test.ts` (CI 2.0 stack) | **PASS** | Context / GraphRAG / contracts / Guardian / model / eval |
| `connected-journey-steps.test.ts` | **PASS** | |

## Playwright / CI

| Item | Value |
|------|-------|
| Failed baseline | [run 40996273234](https://github.com/gnaneshwer23/aksh-health-redesign/actions/runs/40996273234) @ `033d16a` |
| Fix PR | [#80](https://github.com/gnaneshwer23/aksh-health-redesign/pull/80) |
| Passing commit / workflow URL | **Fill after merge** — see README index |

## Safety honesty

- All listed capabilities remain `synthetic_demo`  
- `ehrWrite: false` / no autonomous prescribing asserted in suites above  
- Vercel rate-limit failures ignored for merge policy (GitHub Actions is the gate)  
