# Phase 3 — Medication and personalised care

**Date:** 29 October 2026  
**Status:** Synthetic demo scaffolding in `packages/platform-uk`  
**Capability:** `medication_personalised_care` = `synthetic_demo`  
**Evidence:** `tests/medication-personalised-care.test.ts`  
**LIVE_ORGANISATIONS:** `0` — not clinically validated; not production-ready.

## What shipped

| Surface | Path |
|---------|------|
| Domain | `lib/diabetes-intelligence/medcare-*.ts` |
| Migration | `046_medication_personalised_care.sql` (local-dev / simulation only) |
| API | `GET/POST /api/patients/[id]/medication-care` |
| Med recon decision | `POST .../medication-care/medication-reconciliation/[runId]/decision` |
| Safety review decision | `POST .../medication-care/safety-review/[reviewId]/decision` |
| Care plan decision | `POST .../medication-care/care-plan/[planId]/decision` |
| GP UI | `/dashboard/gp/patients/[id]/medication-care` |

## Coverage vs BUILD DIRECTIVE

| Feature | Classification | Notes |
|---------|----------------|-------|
| Medication lists + reconciliation | `synthetic_demo` | Extends Phase 1 Patient 360 med recon |
| Allergy + interaction information | `synthetic_demo` | Allergies from Patient 360; interactions = **synthetic stub** (`licensedDrugDatabase: false`) — not BNF API / FDB / Lexicomp |
| Clinician-reviewed medication safety flags | `synthetic_demo` | Flags + HITL Accept/Edit/Reject; `validatedCds: false` |
| Individualised care-plan templates | `synthetic_demo` | Template → DRAFT plan personalised with med/allergy context |
| Patient goals + educational resources | `synthetic_demo` | Goals + synthetic education catalog |
| Assigned tasks + care-team handoffs | `synthetic_demo` | Task status + handoff records; `ehrWrite: false` |
| Review and approval history | `synthetic_demo` | Append-oriented history entries |

## How to try

1. From `packages/platform-uk`: `.env.local` → Neon **local-dev** only.
2. Optional: `npm run db:migrate -- --apply` for `046` (never production main).
3. `npx tsx tests/medication-personalised-care.test.ts`
4. Authenticated GP: `/dashboard/gp/patients/P002/medication-care` → **Seed synthetic meds & care spine** → recon / safety review / apply template → Accept/Edit/Reject.

## Explicit non-claims

- Not a licensed or maintained drug-interaction database.
- Not validated clinical decision support (`validatedCds: false`).
- No autonomous prescribing or dose adjustment.
- No EHR write (`ehrWrite: false`).
- Not clinically validated or regulatory-approved.

## Still incomplete / deferred

- Licensed drug-DB / formulary integration under clinical governance
- Org FK + RLS proof against live organisations
- Nurse/ops queues for tasks (Phase 4 continuous care)
- Playwright E2E golden path
- Clinical safety case / CSO sign-off before capability promotion beyond `synthetic_demo`
