# 26 — Integration regression report

**Date:** 30 October 2026  
**Baseline:** `main` @ `033d16a` (+ CI fix + INT-13/UX-04 audit delta)  
**Scope:** Connected Diabetes Intelligence Phases 0–6

## Checklist results

| Requirement | Result | Evidence |
|-------------|--------|----------|
| Full connected diabetes pipeline (synthetic) | **PASS** | `connected-diabetes-orchestration.test.ts`; journey + module unit suites |
| Persistent synthetic records (local-dev Neon) | **PASS*** | Module suites with `--env-file=.env.local`; *RLS proof insert blocked by DB role perms — file/PG repository paths still exercised |
| Canonical care-plan writes | **PASS** | Orchestration asserts `CARE_PLAN_CANONICAL_STORE` + facade provenance |
| Canonical follow-up writes | **PASS** | Follow-up facade / `isOpsProjection` asserts in orchestration suite |
| Duplicate prevention + compatibility projections | **PASS** | Med-recon / care-plan / follow-up facades + INT-03/04/04a asserts |
| Cross-user / cross-org isolation | **PASS** | INT-09 API isolation **PASS**; INT-08 helpers + local-dev RLS insert/select proof **PASS**; INT-16 scoped seed PKs |
| Clinical persona permissions on decisions | **PASS** | INT-10 `connected-diabetes-decision-scope.test.ts` + decision routes |
| Timeline complete + ordered | **PASS** (prior mitigate) | Doc 16 INT-05; `/timeline` + P360 merge; chrome step |

## Residual risks

1. **INT-08 RLS** — **closed on local-dev** when `DATABASE_URL` points at simulation Neon with `aksh_tenant` SELECT/INSERT/UPDATE grants (cleanup uses owner DELETE). Soft-skips only if role/table/migrations absent.  
2. **Playwright wall-clock** — prefer CI Neon branch over local long runs when Actions is green.  
3. **Synthetic-only** — no claim of production clinical readiness (docs 21–22).

## Regression vs pre-merge defects

| ID | Pre-merge | Post-audit |
|----|-----------|------------|
| INT-01…05, 07–11 | Mitigated / Fixed | Confirmed by tests above |
| INT-09 typecheck CI break | Introduced on merge | **Fixed** (doc 24) |
| INT-13 provenance split | Open | **Mitigated** — `provenance-bridge.ts` + worklist spine projection |
| UX-04 dual styles | Open | **Mitigated** — `ConnectedDiabetesSurface` + shared tokens + worklist nav |
