# 16 — Integration map (post-implementation audit)

**Date:** 30 October 2026  
**Package:** `packages/platform-uk`  
**LIVE_ORGANISATIONS:** `0`  
**Scope:** Trace Patient 360 → glucose intelligence → medication-care → care-plan approval → continuous care → longitudinal timeline → agent intelligence (Phase 6 = domain registry only).

## Verdict

Phases 0–6 ship as **parallel synthetic modules** keyed by mock-cohort `patientId` (canonical demo: **P002**) and authenticated **`scopeKey` (= user id)**. There is **no single orchestrator** that advances one patient through all phases in one transaction. Safety posture holds: `ehrWrite: false`, no autonomous prescribe/treatment. Unvalidated intelligence remains **`synthetic_demo`**.

## End-to-end path (as implemented)

| Step | Module | Primary API | UI | Feeds next automatically? |
|------|--------|-------------|-----|---------------------------|
| 1 Patient 360 | `lib/patient-intelligence/` | `/api/patients/[id]/patient-360` | `/dashboard/gp/patients/[id]/patient-360` | Partial — medcare reads allergies/care team |
| 2 Glucose intelligence | `lib/diabetes-intelligence/glucose-*` | `/api/patients/[id]/diabetes-intelligence` | `…/diabetes-intelligence` + GP worklist | **No** — separate from journey ingest |
| 3 Medication & personalised care | `medcare-*` | `/api/patients/[id]/medication-care` | `…/medication-care` | **No** — own care plans vs journey |
| 4 Care-plan HITL | Journey + medcare | `…/diabetes-journey` + medcare care-plan decisions | journey + medication-care | Dual approval lifecycles |
| 5 Continuous care | `continuous-care-*` | `/api/patients/[id]/continuous-care` | patient + GP/nurse worklists | Seed pattern refs only (no FKs) |
| 6 Longitudinal timeline | Cross-cut | `/api/patients/[id]/timeline` | chart panel + **timeline page** | Merges journey + continuous + precision-health; **omits** glucose/medcare/agent |
| 7 Agent intelligence | `agent-intel-*` | `/api/patients/[id]/agent-intelligence` | patient + GP worklist | Mock shared context — does not assemble live 360/glucose/medcare |
| 8 Domain framework | `lib/disease-domains/` | (none) | (none) | Registry only; CVD/CKD/obesity `not_activated` |

## Shared context

| Key | Reality |
|-----|---------|
| `patientId` | URL `[id]` / journey `[patientId]`; mock cohort (`P002`, …) |
| `scopeKey` | `session.user.id` via `requireAuthenticatedUserScope` |
| `organisationId` | **Not applied** in app code (optional DB column on 043 unused) |
| Actor | `userEmail ?? userId` on decisions |

## Stores (duplication)

| Concern | Store A | Store B | Priority |
|---------|---------|---------|----------|
| Care plans | `aksh.care_plan_records` (journey) | `aksh.medcare_care_plans` | High unify |
| Follow-ups | journey `care_follow_up_tasks` | `ccare_follow_up_items` | High |
| Med recon | Patient 360 runs | medcare start also creates runs | Medium |
| Glucose | Phase 2 `glucose_*` | disease-module ingest (journey) | High |
| Timeline | P360 / journey / `/timeline` API | three partial views | High |
| Agent context | mock cohort | live module snapshots | High |

JSON fallbacks under `packages/platform-uk/data/` when Postgres is off (scoped by `scopeKey`).

## Auth & isolation

- All connected APIs use **`requireAuthenticatedUserScope`**.
- **`denyUnlessConnectedPatientAccess`** (INT-09) gates every patient-scoped module route — wraps `evaluateAppRoleClinicalReadAccess` → `evaluatePatientUrlAccess` (cross-patient / unbound patient / ops-researcher deny). Same posture as `/api/patients/[id]/state`.
- **`evaluateDecisionScope`** (clinical persona) is **not** on module Accept/Edit/Reject (INT-10).
- Tenant isolation for module data = **per-user scope**, not org/practice (INT-08).

## Provenance

| Surface | Model |
|---------|--------|
| Patient 360 | Rich provenance on spine entities |
| Glucose / journey / medcare | Synthetic flags + actor timestamps; no shared `InformationProvenance` enum |
| Agent drafts | `ai_generated` → `clinician_verified` on HITL (best-in-class) |

## Safety invariants (verified in types + unit tests)

- `ehrWrite: false` on snapshots / decisions
- `autonomousPrescribe` / `prescribeOrTreat` / `autonomousClinicalAction` = false
- HITL required before clinical-looking drafts become “verified” artifacts (still synthetic store only)

## Target integration (backlog — not this PR)

1. Canonical glucose path (bridge ingest ↔ glucose-intelligence).
2. Canonical care-plan + follow-up read model.
3. Unified timeline projector including glucose/medcare/agent decisions.
4. `buildSharedPatientContext` loads live 360 + glucose + medcare snapshots.
5. Org/practice tenancy on module stores (INT-08). Patient URL access gate shipped (INT-09).
6. Shared `ConnectedPatientChrome` (shipped as UX step toward this).

## Related defects

See [18-defect-register.md](./18-defect-register.md) (INT-01 … INT-15).
