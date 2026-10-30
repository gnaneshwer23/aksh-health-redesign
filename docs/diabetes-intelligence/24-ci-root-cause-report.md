# 24 — CI root-cause report (post-merge)

**Date:** 30 October 2026  
**Baseline:** `main` @ `033d16a`  
**Fix PR:** [#80](https://github.com/gnaneshwer23/aksh-health-redesign/pull/80) · branch `fix/ci-int09-handler-params`

Three sequential CI failure modes after the Phase 0–6 merge:

| Wave | Run | Surface | Fix commit |
|------|-----|---------|------------|
| P0 typecheck | [40996273234](https://github.com/gnaneshwer23/aksh-health-redesign/actions/runs/40996273234) | Verify and build (`tsc`) | `a5bb079` |
| Playwright schema/UI | [40997321061](https://github.com/gnaneshwer23/aksh-health-redesign/actions/runs/40997321061) | connected-diabetes (2 failed) | `d631a9f` (+ timeout `787a0bc`) |
| Playwright glucose seed hang | [41004086424](https://github.com/gnaneshwer23/aksh-health-redesign/actions/runs/41004086424) | API path only (103 passed / 1 failed) | `006e18e` + `3033af6` |

---

## Wave 1 — INT-09 Handler params typecheck

### Exact failing command

```bash
npm run verify && npm run build
# verify → npm run test:workflow && npm run typecheck
# test:workflow → tsc -p tsconfig.tests.json && …
```

Job: **Playwright E2E → Verify and build**  
Playwright browsers / E2E never started — compile failed first.

### Root cause

`packages/platform-uk/tests/connected-patient-api-access.test.ts` (INT-09) defined:

```ts
type Handler = (
  request: Request,
  context: { params: Promise<Record<string, string>> }
) => Promise<Response>;
```

App Router handlers declare **specific** param shapes (`Promise<{ id }>`, `Promise<{ id; planId }>`, …). Under TypeScript’s **contravariant** function-parameter checking, those handlers are not assignable to `Handler`. Result: **TS2322 / TS2345** on ~20 assignment sites (GET case table + POST decision cases).

This is a **test harness typing** defect, not a runtime access-control regression. Safety assertions (403 cross-patient / unbound / researcher; 200 GP) were not changed.

### Fix

Loosen harness context params to `Promise<any>` with an explicit INT-09 comment. Runtime behaviour and assertions unchanged.

---

## Wave 2 — Connected-diabetes Playwright (after Wave 1)

### Failures (run 40997321061 · 102 passed / 2 failed / 7 skipped)

1. **API path** (`connected-diabetes-journey.spec.ts:17`) — `seed_synthetic` patient-360 POST → `expect(p360.ok()).toBeTruthy()` received `false`.
2. **UI path** (`…:367`) — `/connected-diabetes` never showed `connected-patient-chrome` (60s timeout). Retries identical.

### Root causes

1. **Schema lag on ephemeral Neon CI branch** — CI creates a short-lived Neon branch from parent; pending additive migrations (`044+` Patient 360 / connected-diabetes tables) were not applied before Playwright. Seed hit missing relations → non-OK response.
2. **ToasterProvider crash on orchestration page** — `ConnectedDiabetesOrchestrationWorkspace` called `useToast()` without a provider in the dashboard tree, so the page error-bounded before chrome mounted.

### Fixes (`d631a9f`)

- Workflow step: `npx tsx scripts/db-migrate.ts --apply` on the Neon CI branch only (never prod main).
- Orchestration workspace: use shared `toast` helper from `@/components/ui/toaster` (no provider hook).
- Follow-up (`787a0bc`): raise Playwright job `timeout-minutes` 40 → 60 so migrate + verify + suite retries are not cancelled mid-run.

---

## Wave 3 — Glucose seed hang / request context disposed

### Failure (run 41004086424 · 103 passed / 1 failed · ~40m job wall)

API path only: `POST /api/patients/P002/diabetes-intelligence` `seed_synthetic` → Playwright `Test timeout of 180000ms exceeded` then `apiRequestContext.post: Request context disposed` on retries.

### Root cause

`replacePatientGlucoseSeries` / `appendGlucoseBatch` inserted ~1.5k synthetic CGM rows **one `INSERT` per reading**. On CI (US runner → Neon eu-west-2) that exceeds the 180s test timeout; Playwright then disposes the request fixture mid-flight.

### Fixes

- `006e18e` — chunked multi-row `INSERT` (400 rows/statement) in `glucose-repository.ts`. Local bench after fix: ~9s for 1521 CGM rows on local-dev Neon.
- `3033af6` — raise connected-diabetes API-path `test.setTimeout` to 360s; per-request `timeout: 120_000` on seed/draft posts; `maxDuration = 120` on diabetes-intelligence route.

---

## Verification

| Check | Result |
|-------|--------|
| `npx tsc -p tsconfig.tests.json` | PASS |
| `npm run verify` (local) | PASS |
| `npx tsx tests/connected-patient-api-access.test.ts` | PASS (9 GET + 9 POST) |
| Local connected-diabetes Playwright (2 specs, after migrate) | PASS |
| Local glucose seed bench (bulk insert) | ~9s / 1521 CGM rows |
| Passing Actions (PR #80, pre-merge) | [41008129457](https://github.com/gnaneshwer23/aksh-health-redesign/actions/runs/41008129457) — 104 passed / 7 skipped |
| Merged to `main` | `84fef5bbc528c2131ad3819d294c327a22d4004a` (squash of #80) |

## What we did not do

- Did not disable INT-09 or connected-diabetes Playwright tests  
- Did not weaken 403 / denied / `ehrWrite:false` assertions  
- Did not skip `tsc` or Playwright  
- Did not touch Neon production  
- Did not treat Vercel deploy rate-limits as merge blockers  
