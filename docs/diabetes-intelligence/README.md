# Connected Diabetes Intelligence — Phase 0 index

**Date:** 29 October 2026  
**Scope:** Documentation + smallest synthetic vertical slice in `packages/platform-uk`.  
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
| — | [REMAINING-PHASES-3-6.md](./REMAINING-PHASES-3-6.md) | What remains after this slice |

## Vertical slice (synthetic)

**Path:** Patient → clinical history → glucose observations → clinician review → approved care plan → follow-up → longitudinal timeline.

Implemented under `packages/platform-uk` (see backlog). Feature flag / honesty: synthetic demo only; no EHR write; no autonomous prescribing.

### How to try

1. From `packages/platform-uk`: ensure `.env.local` points at Neon **local-dev / simulation** (never production main).
2. Optional: `npm run db:migrate -- --apply` (local-dev only) for migration `043_diabetes_care_journey.sql`.
3. Run tests: `npx tsx tests/diabetes-intelligence-journey.test.ts`
4. UI (authenticated GP): `/dashboard/gp/diabetes-journey/[patientId]` (e.g. a mock cohort patient id).
5. APIs under `/api/patients/[id]/diabetes-journey/*`.

## Non-negotiables

- Do not merge/delete packages without ADR + explicit user approval.
- Do not claim clinical validation, regulatory approval, live integrations, or production readiness without evidence in the capability register.
- Synthetic data until governance approved.
- Production Neon main: **untouched**.
