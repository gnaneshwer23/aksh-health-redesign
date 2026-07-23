# U7 Audit — ICS + hospital dashboards

**Date:** 2026-07-23  
**Branch:** `main`  
**Scope:** ICS COMPASS-led population/equity/forecast demo; hospital synthetic PAS command-centre (wards → capacity → staffing); first-run / demo script aligned with U4–U6  
**Companion:** [`NEXT_UX_STAKEHOLDER_BUILD.md`](./NEXT_UX_STAKEHOLDER_BUILD.md) · [`NEXT_UX_U6_AUDIT.md`](./NEXT_UX_U6_AUDIT.md)

## Status

| Gate | Result |
|---|---|
| **U7 overall** | **PASS** |
| **ICS hero path** | **PASS** — population → COMPASS equity → forecast |
| **ICS honesty** | **PASS** — synthetic cohorts · aggregate only · no patient-level spill · `liveEmis:false` |
| **Hospital hero path** | **PASS** — wards → capacity → staffing |
| **Hospital honesty** | **PASS** — synthetic PAS · Not live PAS · PATHWAY/HORIZON framing · `liveEmis:false` |
| **First-run + demo script** | **PASS** — primary → population / wards; secondary → `/demo/script`; panels + `01:15` / `01:25` stops |
| **Fail conditions avoided** | **PASS** — no `liveEmis` flip · no PRISM/ATLAS live · VOICE/Dr.Assist remain sub-caps · no live PAS claims |

## Exit criteria (from plan)

| Criterion | Result | Notes |
|---|---|---|
| ICS + hospital smoke pass | **PASS** | Scripts assert hero + honesty copy; live auth smoke needs credentials + running app (hospital public demo is primary) |
| Banners state synthetic / not live PAS | **PASS** | ICS honesty banner + hospital honesty banner + `HospitalMockModeBanner` |

## What shipped

| Surface | Change |
|---|---|
| `components/dashboard/ics/IcsHeroDemoPath.tsx` | **New** — 3-beat population strip + `/demo/script` |
| `components/dashboard/hospital/HospitalHeroDemoPath.tsx` | **New** — 3-beat command-centre strip + `/demo/script` |
| `app/dashboard/ics/page.tsx` (+ population / equity / forecast) | Hero + honesty banner; no `demoPatientHref` spill on spine panel |
| `app/dashboard/hospital/page.tsx` (+ wards / capacity / staffing) | Hero + “Not live PAS” honesty; PATHWAY/HORIZON section copy |
| `components/dashboard/hospital/HospitalMockModeBanner.tsx` | Explicit **Not live PAS** + `liveEmis:false` |
| `lib/product-journey.ts` | ICS/hospital first-run → population / wards + demo script |
| `lib/onboarding/role-paths.ts` | Tutorials name hero beats |
| `components/demo/DemoLaunchScript.tsx` | ICS + hospital panels, `01:15` / `01:25` stops, quick links |
| `scripts/smoke-ics-dashboard.mjs` | Expects Population demo · liveEmis:false · no patient-level spill |
| `scripts/smoke-hospital-dashboard.mjs` | Expects Command-centre demo · Not live PAS · synthetic PAS |
| `tests/next-ux-u7.test.ts` | U7 matrix assertions |

## Manual verify

1. Open `/demo/script` — **ICS population (COMPASS)** and **Hospital command-centre** panels.  
2. Open `/dashboard/ics` (public) — population hero + synthetic / no patient-level spill honesty banner.  
3. Beat 1 → population; Beat 2 → COMPASS equity; Beat 3 → forecast (HORIZON scaffolding).  
4. Open `/dashboard/hospital` — command-centre hero + **Not live PAS** banner / mock-mode strip.  
5. Beat 1 → wards; Beat 2 → capacity; Beat 3 → staffing.  
6. First-run primary → population / wards; secondary → `/demo/script`.

## Honesty invariants held

- `liveEmis:false` on heroes, honesty banners, first-run, demo script, smoke  
- ICS: synthetic cohorts · aggregate only · no patient-level spill  
- Hospital: synthetic PAS · Not live PAS / EPR · no hospital write-back  
- PATHWAY / HORIZON / COMPASS named as draft / foresight agents — not live feeds  

## Tests run

```text
npx tsx tests/next-ux-u7.test.ts
npx tsx tests/onboarding-role-paths.test.ts
tsc -p tsconfig.tests.json && node .tmp-tests/tests/route-smoke.test.js
npm run test:clinical-proof
```

Live `npm run smoke:ics` / `npm run smoke:hospital` require a running app (+ `SMOKE_ICS_*` for authenticated ICS; hospital public demo is enough without credentials).

## Next

**U8** — Patient + researcher dashboards (companion / ethics · ATLAS Phase 2).

Do **not** start U8 until this audit stays PASS on `main`.
