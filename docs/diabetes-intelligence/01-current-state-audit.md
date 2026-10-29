# 01 — Current-state repository audit

**As of:** 29 October 2026 · SHA baseline ~`8759d57` (main)  
**Live site:** www.akshhealth.com → Vercel `aksh-health-redesign`, root `packages/platform-uk`.

## Package map

| Package | Role | Live? |
|---------|------|-------|
| `packages/platform-uk` | UK production Next.js app: auth, Neon `aksh.*`, HITL, CGM, diabetes module, capability register | **Yes** |
| `packages/aksh-health` | Legacy marketing scaffold | **No** — do not deploy |
| `packages/foundation` | Shared clinical workflow types / synthetic fixtures (`@akshhealth/foundation`) | Library |
| `packages/platform-india-app` | India Phase 0 intake/review | Separate product surface |
| `packages/marketing-india` | India marketing | Separate |
| `packages/marketing-os` | Retired marketing OS | Reference only |
| `packages/akeno` | Akeno Health L0–L10 services / dashboard | Separate product line |

**Confirmed:** `0ne-health.vercel.app` is older / not the current UK live root. Capability register: `LIVE_ORGANISATIONS = 0`.

## What already exists for diabetes intelligence

### Disease module (flag-gated)

- Path: `packages/platform-uk/lib/disease-modules/diabetes/`
- Flag: `ENABLE_DIABETES_MODULE` (default `false`; CI may set `true`)
- Signals: glucose, HbA1c, insulin, GLP-1, nutrition/exercise/behaviour coaching drafts, complications, prevention
- Ingest → `aksh.patient_state_facts` via `ingest.ts`
- Honesty: `hitlRequired: true`, `ehrWrite: false`; insulin/GLP-1 never emit dose changes

### Care network / glucose production primitives

- `aksh.network_patients`, `network_observations` (glucose, hba1c, labs), CGM tables, `personal_readings`
- Capabilities marked **production** (code deployed): `cgm_monitoring`, `patient_readings`, `lab_results`, `identity_access`, `audit`, `consent`, `handoffs`, slot-fill — still **0 live orgs**

### HITL / agents

- Review cases + Accept/Edit/Reject: `lib/workflow/decide-review-item.ts`, SHIELD hash-chain audit
- Agents register: all clinical agents `in_validation` / simulation; PRISM & ATLAS `planned`
- Loop includes non-agent `AKSH_DIABETES` analyse step

### Care plans today

- `HealthPlanDraft` always `status: "DRAFT"`; JSON file store (`health-plan-repository.ts`)
- **No** durable Postgres care-plan approval lifecycle before this slice
- Follow-ups: `aksh.handoff_tasks` (access/slot-fill oriented) — not a general diabetes care-plan follow-up model

### Patient 360 / timeline

- Patient State facts + `/api/patients/[id]/state`
- Timeline: `/api/patients/[id]/timeline` — still partly mock-patient keyed; does not yet unify glucose + care-plan approval + follow-up as one journey

### Docs already in tree (platform-uk)

- `docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md` (spec; Layer 3 ADR may lag code)
- `PHASED_BUILD_PLAN*.md`, Volume I PRD Ch. 8, architecture gap/migration docs

## Honest summary

The platform has **substantial production-grade plumbing** (network, CGM, readings, labs, audit, RLS) and **simulation-grade clinical intelligence** (review queue, diabetes signals, coaching). It does **not** yet expose a single connected synthetic journey from history → glucose → review → **approved** care plan → follow-up → longitudinal timeline. That gap is what Phase 0 + this vertical slice close.
