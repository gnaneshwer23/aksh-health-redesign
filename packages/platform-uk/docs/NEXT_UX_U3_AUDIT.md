# U3 Audit — Personalised onboarding

**Date:** 2026-07-23  
**Branch:** `main`  
**Scope:** Role-shaped onboarding for all 8 roles → correct dashboard + first-run guidance  
**Companion:** [`NEXT_UX_STAKEHOLDER_BUILD.md`](./NEXT_UX_STAKEHOLDER_BUILD.md) · [`NEXT_UX_U2_AUDIT.md`](./NEXT_UX_U2_AUDIT.md)

## Status

| Gate | Result |
|---|---|
| **U3 overall** | **PASS** |
| **Per-role tutorial / checklist** | **PASS** — all 8 roles `hasTutorial: true` |
| **Dashboard land + first-run** | **PASS** — preview + FirstRunGuidance (agents / approve / honesty) |
| **Persist role + onboarding_complete** | **PASS** — existing Neon complete + progress APIs unchanged |
| **Honesty** | **PASS** — `liveEmis:false` banners; no live EMIS / certification claims |
| **Tests** | **PASS** — role-path unit + route-smoke + clinical-proof rbac green |

## Exit criteria (from plan)

| Criterion | Result | Notes |
|---|---|---|
| Smoke: each of 8 roles completes onboarding → correct dashboard | **PASS** | Paths + `resolveDashboardPath` matrix covered in unit test |
| First-run guidance visible once | **PASS** | Dismissible `FirstRunGuidance` on all role homes (`showFirstRun`) |
| Progress persists | **PASS** | Neon save/resume + complete → profile `onboarding_complete` |
| Fail if claims live EMIS / certification | **PASS** — not claimed |

## What shipped

| Surface | Change |
|---|---|
| `lib/onboarding/role-paths.ts` | Per-role agents, you-approve, honesty, tutorial screens, preference tips |
| `lib/onboarding/roles.ts` | Tutorials for nurse, pharmacist, admin, researcher (was GP/ICS/hospital/patient only) |
| `components/onboarding/TutorialPlayer.tsx` | Role-path screens for all 8; **Skip tutorial** for returning demo users |
| `components/onboarding/OnboardingCard.tsx` | Honesty banner `liveEmis:false` |
| `components/onboarding/SandboxPreview.tsx` | Agents + approve + preference note + honesty |
| `lib/product-journey.ts` | HORIZON (not ORACLE); richer FIRST_RUN; `resolveFirstRunCopy` + preference tips |
| `components/dashboard/FirstRunGuidance.tsx` | Agents chips, you-approve, honesty, preference-aware body |
| `tests/onboarding-role-paths.test.ts` | U3 matrix assertions |

## Per-role path (verify)

| Signup / role id | Tutorial | Lands on | First-run primary CTA |
|---|---|---|---|
| `gp` | Yes (skippable) | `/dashboard/gp` | Open review queue |
| `nurse` | Yes (new) | `/dashboard/nurse` | Open handover |
| `pharmacist` → clinical-pharmacist | Yes (new) | `/dashboard/pharmacist` | Open interactions |
| `practice-manager` / admin | Yes (new) | `/dashboard/admin` | Precision Health status |
| `ics-lead` | Yes | `/dashboard/ics` | Open risk state |
| `hospital-executive` | Yes | `/dashboard/hospital` | Open risk state |
| `patient` | Yes | `/dashboard/patient` | Explore My Health |
| `researcher` | Yes (new) | `/dashboard/researcher` | Open evaluation |

### Manual smoke (per role)

1. Sign up (or fresh test user) with that role → `/onboarding/role-select`.  
2. Complete identity → org (if applicable) → preferences → consent → tutorial (or Skip) → complete.  
3. Confirm Neon/session: `role` + `onboardingComplete: true`.  
4. Land on table dashboard; see first-run guidance once (`data-testid="first-run-guidance"`) with `liveEmis:false`.  
5. Dismiss; reload — guidance stays dismissed for that role.

## Honesty invariants held

- Onboarding card banner: demo/staging · HITL · `liveEmis:false`  
- Tutorial / first-run / preview: no live EMIS connection or certification claims  
- VOICE / Dr.Assist = sub-caps on GP path  
- ATLAS = Phase 2 on researcher path  
- Hospital / ICS: synthetic PAS / synthetic cohorts  
- HORIZON naming (ex-ORACLE) in journey copy  

## Tests run

```text
npx tsx tests/onboarding-role-paths.test.ts
npx tsx tests/route-smoke.test.ts   # via tsc + node after compile, or:
tsc -p tsconfig.tests.json && node .tmp-tests/tests/route-smoke.test.js
node .tmp-tests/tests/clinical-proof-rbac.test.js
```

## Next

**U4** — GP dashboard demo polish (hero clinical path; align Agent Control with U1 copy; one-click first-run → review queue → Accept → export/sim).

Do **not** start U4 until this audit stays PASS on `main`.
