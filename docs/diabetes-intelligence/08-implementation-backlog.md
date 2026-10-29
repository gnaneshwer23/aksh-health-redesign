# 08 — Implementation backlog + dependencies

## Done in this delivery

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

## Next (Phases 3–4 productization)

| ID | Item | Depends on |
|----|------|------------|
| N1 | Wire journey timeline into existing `/timeline` API | S2 |
| N2 | Org-scoped plans linked to `network_patients` | S1, RLS tests |
| N3 | Promote health-plan panel to call journey decision API | S3 |
| N4 | Nurse queue for care follow-ups | N2 |
| N5 | E2E Playwright golden path for journey | S4 |

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
