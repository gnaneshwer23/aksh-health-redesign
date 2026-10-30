# Milestone A5 — E2E Acceptance Results

**Date:** 2026-10-30  
**Branch:** `feat/milestone-a5-e2e-readiness` (stacked on A4 / PR #100)  
**App:** `packages/platform-uk`  
**Orgs/patients:** synthetic only (`P002`, `org-synth-a5`)

---

## Honesty label

| Mode | Executed in this A5 run? |
| --- | --- |
| **API / unit (`tsx`) golden + negatives** | **Yes** — `npm run test:milestone-a5` |
| **Playwright browser multi-account smoke** | **Spec added** — `e2e/milestone-a5-multi-account-browser.spec.ts` (role landings + authz denials; runs in Playwright CI job, not in `test:milestone-a5`) |
| **Full single-session UI click-path** | **No** — not claimed (patient→FD→nurse→GP bookings in one browser chain) |
| **Optional Playwright API spec** | **Not run locally** — `e2e/milestone-a5-golden-api.spec.ts` exists for a live Next server; excluded from `test:milestone-a5` |

---

## Command actually executed

```bash
cd packages/platform-uk
npm run test:milestone-a5
```

Expanded (from `package.json`):

```bash
ENABLE_LLM_*=false npx tsx tests/milestone-a5-golden-journey.test.ts
ENABLE_LLM_*=false npx tsx tests/milestone-a5-negative-suite.test.ts
npx tsx tests/e2e-platform-multi-account-acceptance.test.ts
npx tsx tests/e2e-platform-rbac.test.ts
npx tsx tests/p1-shield-diabetes-decide.test.ts
npx tsx tests/clinical-proof-tenant-isolation.test.ts
npm run typecheck
```

**Environment:** local file-store path (`DATABASE_URL` / `USE_POSTGRES` cleared in A5 suite harness). No Neon branch used for this run.

---

## Results (this run)

| Step | Result |
| --- | --- |
| `milestone-a5-golden-journey.test.ts` | **PASS** |
| `milestone-a5-negative-suite.test.ts` | **PASS** |
| `e2e-platform-multi-account-acceptance.test.ts` | **PASS** |
| `e2e-platform-rbac.test.ts` | **PASS** (7 RBAC negatives) |
| `p1-shield-diabetes-decide.test.ts` | **PASS** |
| `clinical-proof-tenant-isolation.test.ts` | **PASS** |
| `npm run typecheck` | **PASS** (exit 0) |

### Golden journey coverage (API/unit)

Logged from suite:

```json
{
  "mode": "api_unit",
  "browserPlaywright": false,
  "coverage": {
    "patient_identity": "covered",
    "patient_to_reception": "covered",
    "reception_to_nurse": "covered",
    "nurse_to_gp": "covered",
    "gp_conductor_guardian": "covered",
    "lab": "sim",
    "pharmacist": "sim",
    "care_plan_patient": "covered",
    "ops": "covered"
  }
}
```

Flow exercised: patient → reception booking → nurse → GP CONDUCTOR/Guardian → lab (sim) → pharmacist (sim) → care plan approve → patient visibility → PHI-safe ops.

### Negative suite

```json
{
  "cross_tenant": "PASS",
  "role_bypass": "PASS",
  "guardian_block": "PASS",
  "shield_fail_closed": "PASS",
  "duplicate_approval": "PASS"
}
```

---

## What was *not* validated

- Full multi-account **browser** click-path that books → observes → decides in one UI session
- Live Postgres / RLS branch proofs inside `test:milestone-a5` (separate DB tests exist elsewhere; Playwright job uses Neon CI branch for browser specs)
- Live EMIS / NHS lab / EPS prescribing
- Formal HCP clinical evaluation (Milestone B)

---

## Optional follow-up (not claimed green here)

```bash
# Requires Next server / Playwright webServer + auth harness
npx playwright test e2e/milestone-a5-golden-api.spec.ts
```
