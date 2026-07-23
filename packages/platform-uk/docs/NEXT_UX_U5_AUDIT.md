# U5 Audit — Nurse + pharmacist dashboard demos

**Date:** 2026-07-23  
**Branch:** `main`  
**Scope:** Nurse 3-beat demo + pharmacist med-safety HITL path; first-run / demo script aligned with U1–U3; Phase D spine honesty  
**Companion:** [`NEXT_UX_STAKEHOLDER_BUILD.md`](./NEXT_UX_STAKEHOLDER_BUILD.md) · [`NEXT_UX_U4_AUDIT.md`](./NEXT_UX_U4_AUDIT.md)

## Status

| Gate | Result |
|---|---|
| **U5 overall** | **PASS** |
| **Nurse 3-beat** | **PASS** — observations (vitals + timeline) → handover → GUARDIAN alerts |
| **Pharmacist med-safety** | **PASS** — review → GUARDIAN interactions → HITL stage (SHIELD) |
| **First-run + agent copy** | **PASS** — U1–U3 agents; primary CTAs start each path; secondary → `/demo/script` |
| **Spine APIs** | **PASS** — nurse-vitals / pharmacist-review referenced; already wired in forms/queue |
| **Honesty** | **PASS** — synthetic banners · `liveEmis:false` · no live EMR write claims |
| **Fail conditions avoided** | **PASS** — no `liveEmis` flip · no PRISM/ATLAS live · VOICE/Dr.Assist remain sub-caps |

## Exit criteria (from plan)

| Criterion | Result | Notes |
|---|---|---|
| `smoke:nurse` / `smoke:pharmacist` (or equivalent) | **PASS** | Scripts assert hero copy; live auth smoke still needs credentials + running app |
| Demo script notes for both roles | **PASS** | Nurse + pharmacist panels + `00:45` / `00:55` stops on `/demo/script` |

## What shipped

| Surface | Change |
|---|---|
| `components/dashboard/nurse/NurseHeroDemoPath.tsx` | **New** — 3-beat strip + `/demo/script` |
| `components/dashboard/pharmacist/PharmacistHeroDemoPath.tsx` | **New** — med-safety strip + HITL stage anchor |
| `app/dashboard/nurse/**` | Hero path on overview / observations / handover / alerts; honesty banner |
| `app/dashboard/pharmacist/**` | Hero path on overview / reviews / interactions; honesty banner |
| `components/dashboard/pharmacist/InteractionChecker.tsx` | `#pharmacist-hitl-stage` callout; Accept toast · `liveEmis:false` |
| `lib/product-journey.ts` | Nurse / pharmacist first-run → observations / reviews + demo script |
| `lib/onboarding/role-paths.ts` | Ready screens name 3-beat / med-safety hero paths |
| `components/demo/DemoLaunchScript.tsx` | Nurse + pharmacist panels, stops, quick links |
| `scripts/smoke-nurse-dashboard.mjs` | Expects 3-beat + `liveEmis:false` |
| `scripts/smoke-pharmacist-dashboard.mjs` | Expects med-safety + HITL stage copy |
| `tests/next-ux-u5.test.ts` | U5 matrix assertions |

## Manual verify

1. Open `/demo/script` — **Nurse 3-beat** and **Pharmacist med-safety** panels.  
2. Sign in as nurse → `/dashboard/nurse` — hero strip + honesty banner.  
3. Beat 1 → observations (vitals + timeline); Beat 2 → handover; Beat 3 → GUARDIAN alerts.  
4. Sign in as pharmacist → `/dashboard/pharmacist` — med-safety strip.  
5. Reviews → Mark Reviewed (spine/SHIELD when signed in); Interactions → run check → Accept (HITL + SHIELD · `liveEmis:false`).  
6. Confirm no “connected to the GP record” / live EMIS language.

## Honesty invariants held

- `liveEmis:false` on hero paths, first-run, honesty banners, demo script, Accept toast  
- Synthetic labelling on nurse / pharmacist hero strips  
- Phase D spine endpoints named; no claim of live EMR write  
- VOICE remains CANVAS sub-cap (nurse VoiceCare card unchanged)

## Tests run

```text
npx tsx tests/next-ux-u5.test.ts
npx tsx tests/onboarding-role-paths.test.ts
tsc -p tsconfig.tests.json && node .tmp-tests/tests/route-smoke.test.js
npm run test:clinical-proof
```

Live `npm run smoke:nurse` / `smoke:pharmacist` require a running app + `SMOKE_NURSE_*` / `SMOKE_PHARMACIST_*` credentials (see `docs/DEMO_LAUNCH_CREDENTIALS.md`).

## Next

**U6** — Practice admin dashboard (ops demo: integrations honesty + SHIELD + users/enquiries).

Do **not** start U6 until this audit stays PASS on `main`.
