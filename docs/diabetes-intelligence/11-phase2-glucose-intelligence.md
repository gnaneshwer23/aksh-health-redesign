# Phase 2 — Diabetes glucose intelligence

**Date:** 29 October 2026  
**Status:** Synthetic demo scaffolding in `packages/platform-uk`  
**Capability:** `diabetes_glucose_intelligence` = `synthetic_demo`  
**Evidence:** `tests/diabetes-glucose-intelligence.test.ts`  
**LIVE_ORGANISATIONS:** `0` — not clinically validated; not production-ready.

## What shipped

| Surface | Path |
|---------|------|
| Domain | `lib/diabetes-intelligence/glucose-*.ts` (calculations, seed, repository, assemble) |
| Migration | `045_diabetes_glucose_intelligence.sql` (local-dev / simulation only) |
| API | `GET/POST /api/patients/[id]/diabetes-intelligence` |
| Review decision | `POST .../diabetes-intelligence/review/[reviewId]/decision` |
| Worklist | `GET /api/gp/diabetes-intelligence/worklist` |
| GP UI | `/dashboard/gp/patients/[id]/diabetes-intelligence` |
| Worklist UI | `/dashboard/gp/diabetes-intelligence` |

## Coverage vs BUILD DIRECTIVE

| Feature | Classification | Notes |
|---------|----------------|-------|
| HbA1c trends | `synthetic_demo` | Reuses `buildHbA1cSignal`; non-diagnostic |
| CGM & SMBG ingestion contracts | `synthetic_demo` | Typed batches + dual-path store |
| Glucose trend charts | `synthetic_demo` | Chart points + sparkline UI |
| Time-in-range analytics | `synthetic_demo` | Via `computeMetrics` only when consensus sufficiency permits |
| Missing-data & measurement quality | `synthetic_demo` | Explicit indicators on assemble |
| Review worklists | `synthetic_demo` | Urgency-ranked GP worklist |
| Explainable deterministic calculations | `synthetic_demo` | Explanations on TIR + HbA1c |
| Clinician-controlled review & sign-off | `synthetic_demo` | Accept / Edit / Reject; `ehrWrite: false` |

## How to try

1. From `packages/platform-uk`: `.env.local` → Neon **local-dev** only.
2. Optional: `npm run db:migrate -- --apply` for `045` (never production main).
3. `npx tsx tests/diabetes-glucose-intelligence.test.ts`
4. Authenticated GP: `/dashboard/gp/patients/P002/diabetes-intelligence` → **Seed synthetic CGM / SMBG / HbA1c** → **Draft review for sign-off** → Accept/Edit/Reject.
5. Worklist: `/dashboard/gp/diabetes-intelligence`.

## Explicit non-claims

- Not clinically validated or regulatory-approved.
- Not a live device/vendor integration (`synthetic` seed / contract staging only).
- Not real-time CGM alarming.
- TIR percentages with insufficient wear/days are informational only (`sufficient: false`).
- No EHR write (`ehrWrite: false`); no autonomous prescribing.

## Still incomplete / deferred

- Live CGM vendor connectors and production RLS org proofs
- Bidirectional projection into `cgm_trusted_readings` / `network_observations`
- Resolution of `OQ-DIAB-1` (precision-health glucose modality schema)
- Playwright E2E for glucose intelligence golden path
- Clinical safety case / CSO sign-off before any capability promotion beyond `synthetic_demo`
