# Connected Diabetes Intelligence — index

**Date:** 29 October 2026  
**Scope:** Phase 0 docs + vertical slice; Phase 1 Patient 360 foundation; Phase 2 glucose intelligence — all in `packages/platform-uk`.  
**Ground truth:** `packages/platform-uk/lib/status/capabilities.ts`, `lib/agents/register.ts`, `db/migrations/`, live deploy root `packages/platform-uk` (www.akshhealth.com).  
**LIVE_ORGANISATIONS:** `0` — no production clinical use.

## Deliverables

| # | Doc | Purpose |
|---|-----|---------|
| 1 | [01-current-state-audit.md](./01-current-state-audit.md) | Repository / package audit |
| 2 | [02-target-architecture.md](./02-target-architecture.md) | Target architecture + ownership |
| 3 | [03-feature-gap-matrix.md](./03-feature-gap-matrix.md) | Phases 1–6 gap matrix |
| 4 | [04-adr-package-ownership.md](./04-adr-package-ownership.md) | ADR: no merge/delete without approval |
| 5 | [05-db-schema-migration-plan.md](./05-db-schema-migration-plan.md) | Schema inventory + migration plan |
| 6 | [06-api-contracts.md](./06-api-contracts.md) | API contracts sketch |
| 7 | [07-role-based-ux-journeys.md](./07-role-based-ux-journeys.md) | Role-based UX journeys |
| 8 | [08-implementation-backlog.md](./08-implementation-backlog.md) | Backlog + dependencies |
| 9 | [09-clinical-safety-gap-report.md](./09-clinical-safety-gap-report.md) | Honest safety / readiness gaps |
| 10 | [10-phase1-patient-360.md](./10-phase1-patient-360.md) | Phase 1 Patient 360 progress |
| 11 | [11-phase2-glucose-intelligence.md](./11-phase2-glucose-intelligence.md) | Phase 2 glucose intelligence progress |
| — | [REMAINING-PHASES-3-6.md](./REMAINING-PHASES-3-6.md) | What remains after Phase 0–2 |

## Vertical slice (synthetic)

**Path:** Patient → clinical history → glucose observations → clinician review → approved care plan → follow-up → longitudinal timeline.

Implemented under `packages/platform-uk` (see backlog). Feature flag / honesty: synthetic demo only; no EHR write; no autonomous prescribing.

### How to try — Phase 0 journey

1. From `packages/platform-uk`: ensure `.env.local` points at Neon **local-dev / simulation** (never production main).
2. Optional: `npm run db:migrate -- --apply` (local-dev only) for migrations `043` / `044`.
3. Run tests: `npx tsx tests/diabetes-intelligence-journey.test.ts`
4. UI (authenticated GP): `/dashboard/gp/diabetes-journey/[patientId]` (e.g. a mock cohort patient id).
5. APIs under `/api/patients/[id]/diabetes-journey/*`.

### How to try — Phase 1 Patient 360

1. Same Neon **local-dev** rule; optional apply `044_patient_intelligence_foundation.sql`.
2. `npx tsx tests/patient-intelligence-360.test.ts`
3. UI: `/dashboard/gp/patients/P002/patient-360`
4. APIs under `/api/patients/[id]/patient-360` (+ `/fhir`, med-recon decision).
5. Details: [10-phase1-patient-360.md](./10-phase1-patient-360.md).

### How to try — Phase 2 glucose intelligence

1. Same Neon **local-dev** rule; optional apply `045_diabetes_glucose_intelligence.sql`.
2. `npx tsx tests/diabetes-glucose-intelligence.test.ts`
3. UI: `/dashboard/gp/patients/P002/diabetes-intelligence` and worklist `/dashboard/gp/diabetes-intelligence`
4. APIs under `/api/patients/[id]/diabetes-intelligence` (+ review decision) and `/api/gp/diabetes-intelligence/worklist`
5. Details: [11-phase2-glucose-intelligence.md](./11-phase2-glucose-intelligence.md).

## Non-negotiables

- Do not merge/delete packages without ADR + explicit user approval.
- Do not claim clinical validation, regulatory approval, live integrations, or production readiness without evidence in the capability register.
- Synthetic data until governance approved.
- Production Neon main: **untouched**.
