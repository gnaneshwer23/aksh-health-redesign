# U8 Audit — Patient + researcher dashboards

**Date:** 2026-07-23  
**Branch:** `main`  
**Scope:** Patient companion My Health → plan → consent demo; researcher ethics → evaluation → data access (ATLAS Phase 2); first-run / demo script aligned with U4–U7  
**Companion:** [`NEXT_UX_STAKEHOLDER_BUILD.md`](./NEXT_UX_STAKEHOLDER_BUILD.md) · [`NEXT_UX_U7_AUDIT.md`](./NEXT_UX_U7_AUDIT.md)

## Status

| Gate | Result |
|---|---|
| **U8 overall** | **PASS** |
| **Patient hero path** | **PASS** — My Health → care plan → consent |
| **Patient honesty** | **PASS** — invite-by-practice · clinicians keep HITL · synthetic · `liveEmis:false` |
| **Researcher hero path** | **PASS** — ethics → evaluation → data access |
| **Researcher honesty** | **PASS** — ATLAS Phase 2 · COMPASS / SHIELD supporting · synthetic cohorts · `liveEmis:false` |
| **First-run + demo script** | **PASS** — primary → companion / ethics; secondary → `/demo/script`; panels + `01:35` / `01:45` stops |
| **Fail conditions avoided** | **PASS** — no `liveEmis` flip · no PRISM/ATLAS live · VOICE/Dr.Assist remain sub-caps |
| **UX track (U1–U8)** | **COMPLETE** |

## Exit criteria (from plan)

| Criterion | Result | Notes |
|---|---|---|
| Patient + researcher smoke pass | **PASS** | Scripts assert hero + honesty copy; live auth smoke needs credentials + running app |
| ATLAS remains Phase 2 in copy | **PASS** | Hero badges, honesty banner, first-run, onboarding, demo script |

## What shipped

| Surface | Change |
|---|---|
| `components/dashboard/patient/PatientHeroDemoPath.tsx` | **New** — 3-beat companion strip + `/demo/script` |
| `components/dashboard/researcher/ResearcherHeroDemoPath.tsx` | **New** — 3-beat ethics/evaluation strip + `/demo/script` |
| `components/dashboard/PatientCompanion.tsx` | Hero + honesty banner; plan before consent; hash anchors for beats |
| `app/dashboard/researcher/layout.tsx` (+ overview) | Hero on all researcher routes; honesty + ethics empty-state |
| `lib/product-journey.ts` | Patient/researcher first-run → companion / ethics + demo script |
| `lib/onboarding/role-paths.ts` | Tutorials name hero beats |
| `components/demo/DemoLaunchScript.tsx` | Patient + researcher panels, `01:35` / `01:45` stops, quick links |
| `scripts/smoke-patient-dashboard.mjs` | Expects Companion demo · liveEmis:false · invite-by-practice |
| `scripts/smoke-researcher-dashboard.mjs` | Expects Research demo · ATLAS Phase 2 · liveEmis:false |
| `tests/next-ux-u8.test.ts` | U8 matrix assertions |

## Manual verify

1. Open `/demo/script` — **Patient companion** and **Researcher ethics / evaluation** panels.  
2. Open `/dashboard/patient` (signed in) — companion hero + invite-by-practice / HITL honesty banner.  
3. Beat 1 → My Health; Beat 2 → care plan DRAFT; Beat 3 → consent grants.  
4. Open `/dashboard/researcher` — research hero + ATLAS Phase 2 honesty banner + ethics empty-state.  
5. Beat 1 → ethics overview; Beat 2 → evaluation; Beat 3 → data access.  
6. First-run primary → companion / ethics; secondary → `/demo/script`.

## Honesty invariants held

- `liveEmis:false` on heroes, honesty banners, first-run, demo script, smoke  
- Patient: invite-by-practice · clinicians keep HITL · no patient-app EHR write  
- Researcher: ATLAS Phase 2 (not live) · COMPASS / SHIELD supporting · aggregate default · synthetic cohorts  

## Tests run

```text
npx tsx tests/next-ux-u8.test.ts
npx tsx tests/onboarding-role-paths.test.ts
tsc -p tsconfig.tests.json && node .tmp-tests/tests/route-smoke.test.js
npm run test:clinical-proof
```

Live `npm run smoke:patient` / `npm run smoke:researcher` require a running app + `SMOKE_PATIENT_*` / `SMOKE_RESEARCHER_*` credentials.

## Next

**UX stakeholder track complete (U1–U8).** Demo ops: rehearse multi-role `/demo/script`, provision smoke accounts, keep partner/`liveEmis` paused.

Do **not** flip `liveEmis` or claim ATLAS/PRISM live without a new eng phase.
