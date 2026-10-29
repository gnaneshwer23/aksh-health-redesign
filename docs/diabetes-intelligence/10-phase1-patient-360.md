# Phase 1 — Unified patient intelligence foundation

**Date:** 29 October 2026  
**Status:** Synthetic demo scaffolding in `packages/platform-uk`  
**Capability:** `patient_360_foundation` = `synthetic_demo`  
**Evidence:** `tests/patient-intelligence-360.test.ts`  
**LIVE_ORGANISATIONS:** `0` — not clinically validated; not production-ready.

## What shipped

| Surface | Path |
|---------|------|
| Domain | `lib/patient-intelligence/*` |
| Migration | `044_patient_intelligence_foundation.sql` (local-dev / simulation only) |
| API | `GET/POST /api/patients/[id]/patient-360` |
| Med recon decision | `POST .../patient-360/medication-reconciliation/[runId]/decision` |
| FHIR snapshot | `GET /api/patients/[id]/patient-360/fhir` |
| GP UI | `/dashboard/gp/patients/[id]/patient-360` |

## Coverage vs BUILD DIRECTIVE

| Feature | Classification | Notes |
|---------|----------------|-------|
| Patient 360 profile | `synthetic_demo` | Assembled snapshot + UI |
| Structured medical & family history | `synthetic_demo` | Tables + seed from cohort |
| Diabetes diagnosis & classification | `synthetic_demo` | Typed profile + SNOMED map |
| Conditions & comorbidities | `synthetic_demo` | Category + clinical status |
| Allergies + medication reconciliation | `synthetic_demo` | Lists + HITL recon scaffolding; **no prescribe** |
| Clinical encounters | `synthetic_demo` | Encounter ledger |
| Lab & vital observations | `synthetic_demo` | Observation items + quality flags |
| Longitudinal timeline | `synthetic_demo` | Merges spine + journey events |
| Consent / sharing preferences | `synthetic_demo` | Append-only preference rows |
| Care-team assignments | `synthetic_demo` | Simulation spine (network care_team remains for orgs) |
| Provenance & quality indicators | `synthetic_demo` | Per-record provenance + completeness score |

## How to try

1. From `packages/platform-uk`: `.env.local` → Neon **local-dev** only.
2. Optional: `npm run db:migrate -- --apply` for `044` (never production main).
3. `npx tsx tests/patient-intelligence-360.test.ts`
4. Authenticated GP: `/dashboard/gp/patients/P002/patient-360` → **Seed Patient 360 spine**.
5. Optional: start med reconciliation → Complete (no prescribe).
6. FHIR: `GET /api/patients/P002/patient-360/fhir`.

## Explicit non-claims

- Not a unified health record / physiological twin.
- Not live EHR write (`ehrWrite: false`).
- Not autonomous prescribing (`autonomousPrescribe: false`).
- Not clinical validation or regulatory approval.
- Org-scoped `network_*` tables remain authoritative for care-network production paths; this spine is the synthetic Patient 360 assembly layer and may later project into network tables under governance.

## Still incomplete for Phase 1 productization

- Org-linked FK to `network_patients` + RLS proof tests for live orgs
- Bidirectional sync with `network_observations` / `network_medications` / `consent_records`
- Full allergy coding (dm+d / SNOMED) beyond seed placeholders
- Clinician UX for editing structured rows (seed + recon only today)
- Merge into precision-health `/timeline` API as single projection
- Playwright E2E golden path for Patient 360
