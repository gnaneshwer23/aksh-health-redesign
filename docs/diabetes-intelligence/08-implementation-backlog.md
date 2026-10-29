# 08 — Implementation backlog + dependencies

## Done in Phase 0 delivery

| ID | Item | Depends on |
|----|------|------------|
| P0-DOC | Phase 0 docs under `docs/diabetes-intelligence/` | Audit |
| P0-ADR | ADR no package merge/delete | — |
| S1 | Migration `043_diabetes_care_journey.sql` | Inventory |
| S2 | `lib/diabetes-intelligence/*` journey domain | S1 types |
| S3 | APIs under `/api/patients/[id]/diabetes-journey` | S2 |
| S4 | GP journey workspace UI | S3 |
| S5 | Tests `tests/diabetes-intelligence-journey.test.ts` | S2 |
| S6 | Capability `diabetes_care_journey` = `synthetic_demo` + evidence | S5 |

## Done in Phase 1 delivery

| ID | Item | Depends on |
|----|------|------------|
| P1-1 | Migration `044_patient_intelligence_foundation.sql` | P0 inventory |
| P1-2 | `lib/patient-intelligence/*` domain + quality + FHIR map | P1-1 |
| P1-3 | APIs `/api/patients/[id]/patient-360*` | P1-2 |
| P1-4 | GP Patient 360 workspace UI | P1-3 |
| P1-5 | Wire journey history to prefer seeded spine | P1-2, S2 |
| P1-6 | Tests + capability `patient_360_foundation` | P1-2 |
| P1-7 | Docs `10-phase1-patient-360.md` + gap/schema/API updates | P1-6 |

## Done in Phase 2 delivery

| ID | Item | Depends on |
|----|------|------------|
| P2-1 | Migration `045_diabetes_glucose_intelligence.sql` | P1 inventory |
| P2-2 | Glucose ingest contracts + deterministic TIR/HbA1c calcs | Existing `cgm/metrics`, `hba1c.ts` |
| P2-3 | APIs `/api/patients/[id]/diabetes-intelligence*` + worklist | P2-2 |
| P2-4 | GP glucose intelligence UI + worklist | P2-3 |
| P2-5 | Tests + capability `diabetes_glucose_intelligence` | P2-2 |
| P2-6 | Docs `11-phase2-glucose-intelligence.md` + gap/schema/API updates | P2-5 |

## Done in Phase 3 delivery

| ID | Item | Depends on |
|----|------|------------|
| P3-1 | Migration `046_medication_personalised_care.sql` | P1 inventory |
| P3-2 | `lib/diabetes-intelligence/medcare-*` domain | P3-1 / file store |
| P3-3 | APIs `/api/patients/[id]/medication-care*` | P3-2 |
| P3-4 | GP medication & personalised care UI | P3-3 |
| P3-5 | Tests + capability `medication_personalised_care` | P3-2 |
| P3-6 | Docs `12-phase3-medication-personalised-care.md` + gap/schema/API updates | P3-5 |

## Done in Phase 4 delivery

| ID | Item | Depends on |
|----|------|------------|
| P4-1 | Migration `047_continuous_care.sql` | P0–P3 inventory |
| P4-2 | `lib/diabetes-intelligence/continuous-care-*` domain | P4-1 / file store |
| P4-3 | APIs `/api/patients/[id]/continuous-care*` + GP/nurse worklists | P4-2 |
| P4-4 | GP + nurse continuous care UI | P4-3 |
| P4-5 | Merge journey + continuous-care into `/timeline` | S2, P4-2 |
| P4-6 | Tests + capability `continuous_care_operations` | P4-2 |
| P4-7 | Docs `13-phase4-continuous-care.md` + gap/schema/API updates | P4-6 |

## Next (Phases 4 leftovers / productization)

| ID | Item | Depends on |
|----|------|------------|
| N1 | ~~Wire journey timeline into existing `/timeline` API~~ | **Done in P4** |
| N2 | Org-scoped plans linked to `network_patients` | S1, RLS tests |
| N3 | Promote health-plan panel to call journey decision API | S3 |
| N4 | ~~Nurse queue for care follow-ups / medcare tasks~~ | **Done in P4** (synthetic) |
| N5 | E2E Playwright golden path for journey / medcare / continuous care | S4, P3, P4 |

## Later (Phases 5–6)

| ID | Item | Depends on |
|----|------|------------|
| L1 | Evaluation harness thresholds for diabetes signals | disease module |
| L2 | Clinical safety case + CSO sign-off | CLINICAL_RELEASE |
| L3 | DPIA / regulatory opinion | governance |
| L4 | Device vendor production connectors | contracts |
| L5 | Capability promotion `in_validation` → (never auto) production | L2–L3, LIVE org |

## Dependency graph (slice)

```text
Patient State / mock history
        ↓
Glucose observations (+ missing-data)
        ↓
Care plan DRAFT
        ↓
Clinician Accept|Edit|Reject
        ↓
Approved plan ──→ Follow-up task
        ↓
Journey timeline events
```
