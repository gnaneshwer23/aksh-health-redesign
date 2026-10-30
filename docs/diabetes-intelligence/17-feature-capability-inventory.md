# 17 — Verified feature / capability inventory

**Ground truth:** `packages/platform-uk/lib/status/capabilities.ts`  
**LIVE_ORGANISATIONS:** `0` — do not flip without evidence.

## Connected diabetes stack (Phases 0–6)

| Capability ID | Name | Status | Environment | Evidence test | UI | EHR write |
|---------------|------|--------|-------------|---------------|-----|-----------|
| `diabetes_care_journey` | Connected diabetes care journey | `synthetic_demo` | simulation | `tests/diabetes-intelligence-journey.test.ts` | `/dashboard/gp/diabetes-journey/[patientId]` | false |
| `patient_360_foundation` | Patient 360 intelligence foundation | `synthetic_demo` | simulation | `tests/patient-intelligence-360.test.ts` | `…/patient-360` | false |
| `diabetes_glucose_intelligence` | Diabetes glucose intelligence | `synthetic_demo` | simulation | `tests/diabetes-glucose-intelligence.test.ts` | `…/diabetes-intelligence` + worklist | false |
| `medication_personalised_care` | Medication and personalised care | `synthetic_demo` | simulation | `tests/medication-personalised-care.test.ts` | `…/medication-care` | false |
| `continuous_care_operations` | Continuous care / longitudinal ops | `synthetic_demo` | simulation | `tests/continuous-care-operations.test.ts` | patient + GP/nurse worklists | false |
| `diabetes_agent_intelligence` | Diabetes agent intelligence | `synthetic_demo` | simulation | `tests/diabetes-agent-intelligence.test.ts` | `…/agent-intelligence` + worklist | false |
| `chronic_disease_domain_framework` | Chronic disease domain framework | `synthetic_demo` | simulation | `tests/disease-domain-framework.test.ts` | library only | false |

## Planned (not activated)

| Capability ID | Status | Notes |
|---------------|--------|-------|
| `cardiovascular_disease_intelligence` | `planned` | Domain scaffold `not_activated` |
| `ckd_disease_intelligence` | `planned` | Domain scaffold `not_activated` |
| `obesity_metabolic_intelligence` | `planned` | Domain scaffold `not_activated` |

## Adjacent production / validation (do not conflate with synthetic stack)

| Capability ID | Typical status | Relation |
|---------------|----------------|----------|
| `cgm_monitoring` | `production` (ops workflow) | Demo `/demo/glucose` — **not** Phase 2 GP glucose intelligence |
| `slot_fill` | `production` | Access workflow — separate from care-plan follow-ups |
| Clinical spine / review queue agents | mixed | Production HITL path; diabetes agent intel is a **separate** synthetic layer |

## Separation rule (release honesty)

| Class | Examples | Allowed claim |
|-------|----------|---------------|
| **Production operational workflows** | Slot fill, CGM monitoring worklist (where status=`production`) | Live org ops **only if** capability evidence + org go-live |
| **Synthetic clinical intelligence** | All Phase 0–6 connected diabetes caps above | Demo / simulation only; not clinically validated |

## Migrations (local-dev / simulation only)

| Migration | Capability support |
|-----------|-------------------|
| `043_diabetes_care_journey.sql` | Journey |
| `044_patient_intelligence_foundation.sql` | Patient 360 |
| `045_diabetes_glucose_intelligence.sql` | Glucose |
| `046_medication_personalised_care.sql` | Medcare |
| `047_continuous_care.sql` | Continuous care |
| `048_diabetes_agent_intelligence.sql` | Agent intelligence |

**Production Neon main:** untouched by this validation workstream.
