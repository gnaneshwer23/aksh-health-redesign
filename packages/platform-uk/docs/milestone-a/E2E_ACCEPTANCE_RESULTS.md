# Milestone A5 — E2E Acceptance Results

**Date:** 2026-10-30 (post-merge tip + P0 browser/Neon follow-up)  
**Baseline merge:** `c186893` (Milestone A stack #97–#101 on `main`)  
**App:** `packages/platform-uk`  
**Orgs/patients:** synthetic only (`P002`, `org-synth-a5`)

---

## Honesty label

| Mode | Status |
| --- | --- |
| **API / unit (`tsx`) golden + negatives** | **Yes** — `npm run test:milestone-a5` (hermetic file-store default) |
| **Neon-backed A5 gate** | **Optional** — `MILESTONE_A5_USE_NEON=1` + `DATABASE_URL` → `npm run test:milestone-a5:neon` (CI job when Neon integration configured). Does **not** clear `DATABASE_URL`. |
| **Playwright browser role smoke** | **Yes** — `e2e/milestone-a5-multi-account-browser.spec.ts` role landings + authz denials |
| **Full multi-account UI click-path** | **Yes** — same file: Front Desk booking → nurse observe → GP CONDUCTOR + review Accept (synthetic Patel) |
| **Optional Playwright API spec** | Exists — `e2e/milestone-a5-golden-api.spec.ts`; excluded from `test:milestone-a5` |

Lab / pharmacy remain **simulation** (HITL honesty labels on admin E2E + pharmacist workspace).

---

## Commands

### Hermetic (default locally + CI `milestone-a5-gate`)

```bash
cd packages/platform-uk
npm run test:milestone-a5
```

Suites call `applyMilestoneA5StoreMode()` and **clear** `DATABASE_URL` / `USE_POSTGRES` unless Neon is gated — file-store / in-process path.

### Neon-backed (optional)

```bash
# Requires a throwaway / non-prod DATABASE_URL (CI Neon branch or local Neon)
MILESTONE_A5_USE_NEON=1 USE_POSTGRES=true npm run test:milestone-a5:neon
```

When `MILESTONE_A5_USE_NEON=1` **and** `DATABASE_URL` is present, suites **keep** `DATABASE_URL` (do not clear). Without the flag, hermetic remains default even if `.env.local` has a URL (tsx does not load `.env.local` unless `--env-file`).

CI: job **Milestone A5 Neon gate** runs only when `vars.NEON_PROJECT_ID` is set; creates a throwaway Neon branch, migrates, runs `:neon`, deletes branch.

### Browser click-path (Playwright job)

```bash
npx playwright test e2e/milestone-a5-multi-account-browser.spec.ts
```

---

## Golden journey coverage (API/unit)

```json
{
  "mode": "api_unit",
  "storeMode": "file_store|neon",
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

### Browser click-path coverage

| Step | Evidence |
| --- | --- |
| Front Desk booking | Sample referral → Confirm booking (Patel / P002) |
| Nurse observe | Observation worklist + Save Observations (spine, `ehrWrite:false`) |
| GP CONDUCTOR | `/api/agents/orchestrate` honesty flags |
| GP review decide | Case screen Accept under signed-in GP |

---

## What was *not* validated

- Live EMIS / NHS lab / EPS prescribing
- Formal HCP clinical evaluation (Milestone B)
- `productionRbacEnforced` flip (separate workstream)
- Full PRISM/ATLAS product paths (scaffolds only)
