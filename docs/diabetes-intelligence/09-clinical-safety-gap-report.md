# 09 — Clinical safety / production-readiness gap report (honest)

## Verdict

**Not production-ready for real-patient diabetes care decisions.**  
`LIVE_ORGANISATIONS = 0`. Clinical intelligence capabilities remain `in_validation` or `synthetic_demo`. This vertical slice is a **synthetic connected demo** with hard honesty flags (`ehrWrite: false`, no autonomous prescribing).

## What is strong

- Append-only audit patterns (SHIELD, network audit, learning events)
- Server-authoritative Accept/Edit/Reject for review-queue items
- RLS / tenant isolation patterns on care network
- Explicit prohibited actions on agents (`PROHIBITED_FOR_ALL`)
- Capability register with evidence gating for production / synthetic_demo claims

## Gaps that block real-patient use

| Gap | Severity | Notes |
|-----|----------|-------|
| No CSO-signed clinical safety case / hazard log for diabetes journey | **Blocker** | Listed in CLINICAL_RELEASE |
| No DPIA / regulatory opinion for this workflow | **Blocker** | |
| No approved org go-live | **Blocker** | LIVE_ORGANISATIONS=0 |
| Evaluation thresholds not recorded as release evidence for journey | High | |
| Care plan approval is new synthetic path — not the same as full review_cases FHIR staging | High | Do not conflate |
| Glucose derivation still provisional / insufficient_data in many cases | Medium | OQ-DIAB-1 history |
| Timeline still partially mock-cohort keyed | Medium | |
| Patient-facing approved-plan companion incomplete | Medium | |
| Live EHR write intentionally off | By design until gates | |

## Claims we will not make

- Clinical validation or regulatory approval
- “Production ready” diabetes intelligence for live patients
- Live device vendor certification from this PR
- Autonomous treatment or prescribing

## Residual risk if misused

If someone enables flags and points a production DB at unvalidated drafts, clinicians could over-trust incomplete glucose signals. Mitigations: environment markers (`deployment_marker`), `AKSH_ENVIRONMENT`, capability honesty, default `ENABLE_DIABETES_MODULE=false`, synthetic labels on journey UI.
