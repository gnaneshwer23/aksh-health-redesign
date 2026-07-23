# U6 Audit — Practice admin dashboard

**Date:** 2026-07-23  
**Branch:** `main`  
**Scope:** Practice-manager ops narrative (not eng console); integrations honesty + SHIELD + users/enquiries; BRIDGE/CONDUCTOR framing; first-run / demo script aligned with U3–U5  
**Companion:** [`NEXT_UX_STAKEHOLDER_BUILD.md`](./NEXT_UX_STAKEHOLDER_BUILD.md) · [`NEXT_UX_U5_AUDIT.md`](./NEXT_UX_U5_AUDIT.md)

## Status

| Gate | Result |
|---|---|
| **U6 overall** | **PASS** |
| **Ops hero path** | **PASS** — integrations honesty → SHIELD audit → users/enquiries |
| **Integrations honesty** | **PASS** — `liveEmis:false` · staging/sim · designed for EMIS/SystmOne |
| **SHIELD + BRIDGE/CONDUCTOR** | **PASS** — audit visibility + ops framing on overview / hero |
| **Precision Health link** | **PASS** — scaffolding / partner readiness · no live write-back claim |
| **First-run + demo script** | **PASS** — primary → integrations; secondary → `/demo/script`; admin panel + `01:05` stop |
| **Fail conditions avoided** | **PASS** — no `liveEmis` flip · no PRISM/ATLAS live · VOICE/Dr.Assist remain sub-caps |

## Exit criteria (from plan)

| Criterion | Result | Notes |
|---|---|---|
| Admin smoke pass | **PASS** | Script asserts ops hero + “Not live EMIS”; live auth smoke needs credentials + running app |
| Demo host can say “not live EMIS” from the page | **PASS** | Honesty banner + hero badges + EMIS write-back metric |

## What shipped

| Surface | Change |
|---|---|
| `components/dashboard/admin/AdminHeroDemoPath.tsx` | **New** — 3-beat ops strip + `/demo/script` |
| `app/dashboard/admin/page.tsx` | Hero + honesty banner; practice-ops overview; Precision Health de-emphasised as scaffolding |
| `app/dashboard/admin/integrations|audit|organisation-enquiries` | Hero strip on beat pages |
| `components/dashboard/AdminQuickLinks.tsx` | “Practice ops”; honest integrations / partner-readiness labels |
| `lib/product-journey.ts` | Admin first-run → integrations + demo script |
| `lib/onboarding/role-paths.ts` | Practice-manager tutorials name ops hero beats |
| `components/demo/DemoLaunchScript.tsx` | Admin ops panel, `01:05` stop, quick link |
| `scripts/smoke-admin-dashboard.mjs` | Expects Ops demo · liveEmis:false · Not live EMIS |
| `tests/next-ux-u6.test.ts` | U6 matrix assertions |

## Manual verify

1. Open `/demo/script` — **Practice admin ops path** panel.  
2. Sign in as practice manager → `/dashboard/admin` — ops hero + “Not live EMIS” honesty banner.  
3. Beat 1 → integrations (BRIDGE · liveEmis:false); Beat 2 → SHIELD audit; Beat 3 → organisation enquiries.  
4. Confirm Precision Health / partner readiness labelled scaffolding — no “connected to the GP record”.  
5. First-run primary → integrations; secondary → `/demo/script`.

## Honesty invariants held

- `liveEmis:false` on hero, honesty banner, first-run, demo script, smoke  
- Designed for EMIS / SystmOne (staging/sim) — not live write-back  
- Precision Health / partner readiness = scaffolding only  
- Clinicians keep clinical Accept; admin = ops oversight  

## Tests run

```text
npx tsx tests/next-ux-u6.test.ts
npx tsx tests/onboarding-role-paths.test.ts
tsc -p tsconfig.tests.json && node .tmp-tests/tests/route-smoke.test.js
npm run test:clinical-proof
```

Live `npm run smoke:admin` requires a running app + `SMOKE_ADMIN_*` credentials (see `docs/DEMO_LAUNCH_CREDENTIALS.md`).

## Next

**U7** — ICS + hospital dashboards (COMPASS / synthetic PAS honesty).

Do **not** start U7 until this audit stays PASS on `main`.
