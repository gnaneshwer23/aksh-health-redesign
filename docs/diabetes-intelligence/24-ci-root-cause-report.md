# 24 — CI root-cause report (post-merge)

**Date:** 30 October 2026  
**Failed run:** [40996273234](https://github.com/gnaneshwer23/aksh-health-redesign/actions/runs/40996273234) (`main` @ `033d16a`)  
**Fix PR:** [#80](https://github.com/gnaneshwer23/aksh-health-redesign/pull/80) · branch `fix/ci-int09-handler-params`

## Exact failing command

```bash
npm run verify && npm run build
# verify → npm run test:workflow && npm run typecheck
# test:workflow → tsc -p tsconfig.tests.json && …
```

Job: **Playwright E2E → Verify and build**  
Playwright browsers / E2E never started — compile failed first.

## Root cause

`packages/platform-uk/tests/connected-patient-api-access.test.ts` (INT-09) defined:

```ts
type Handler = (
  request: Request,
  context: { params: Promise<Record<string, string>> }
) => Promise<Response>;
```

App Router handlers declare **specific** param shapes (`Promise<{ id }>`, `Promise<{ id; planId }>`, …). Under TypeScript’s **contravariant** function-parameter checking, those handlers are not assignable to `Handler`. Result: **TS2322 / TS2345** on ~20 assignment sites (GET case table + POST decision cases).

This is a **test harness typing** defect, not a runtime access-control regression. Safety assertions (403 cross-patient / unbound / researcher; 200 GP) were not changed.

## Fix

Loosen harness context params to `Promise<any>` with an explicit INT-09 comment. Runtime behaviour and assertions unchanged.

## Verification

| Check | Result |
|-------|--------|
| `npx tsc -p tsconfig.tests.json` | PASS |
| `npm run verify` (local) | PASS |
| `npx tsx tests/connected-patient-api-access.test.ts` | PASS (9 GET + 9 POST) |
| Follow-up Actions run (PR #80) | See doc 25 / README for passing SHA + URL |

## What we did not do

- Did not disable INT-09 tests  
- Did not weaken 403 / denied assertions  
- Did not skip `tsc` or Playwright  
- Did not treat Vercel deploy rate-limits as merge blockers  
