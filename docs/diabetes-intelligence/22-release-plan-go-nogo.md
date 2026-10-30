# 22 — Release plan with go / no-go gates

**Date:** 30 October 2026  
**Product:** Connected Diabetes Intelligence (`packages/platform-uk`)  
**Current overall gate:** **NO-GO for live clinical use** · **GO for synthetic_demo merge** (docs + E2E/UX) if CI green and Neon prod untouched.

## Release classes

| Class | Meaning | Gate owner |
|-------|---------|------------|
| **R0 — Synthetic demo** | Merge to main; status stays `synthetic_demo`; LIVE_ORGANISATIONS=0 | Eng + product honesty |
| **R1 — In validation** | Controlled clinician review on synthetic / approved datasets | Clinical lead + eng |
| **R2 — Shadow / limited org** | Org sandbox; still no autonomous EHR write | CSO + DPIA + org sign-off |
| **R3 — Production clinical** | Live patients; capability `production` | Full CLINICAL_RELEASE |

## Capability-by-capability gates

| Capability | Current | R0 GO if | R1 requires | R3 requires |
|------------|---------|----------|-------------|-------------|
| `diabetes_care_journey` | synthetic_demo | Unit + E2E seed→HITL→timeline | Clinician scorecard ≥2.5, no safety 0s | CSO case, DPIA, org go-live, access controls |
| `patient_360_foundation` | synthetic_demo | Unit evidence | Provenance audit sample | Same + FHIR governance |
| `diabetes_glucose_intelligence` | synthetic_demo | Unit + review HITL | Calculation validation protocol | Device/data sufficiency policy |
| `medication_personalised_care` | synthetic_demo | Unit + no prescribe | Licensed CDS decision or keep stub labelled | Formulary + recon policy |
| `continuous_care_operations` | synthetic_demo | Unit + escalation HITL | Nurse/GP SOP | Outreach policy |
| `diabetes_agent_intelligence` | synthetic_demo | Eval suite pass + version pins | Blinded clinician eval | Model change control + audit |
| `chronic_disease_domain_framework` | synthetic_demo | Registry tests; other domains `not_activated` | Per-domain clinical spec | Per-domain CLINICAL_RELEASE |

## Explicit go / no-go checklist (this validation ship)

### GO (R0 synthetic_demo) — required

- [x] No destructive migrations; no Neon **production** writes  
- [x] LIVE_ORGANISATIONS remains **0**  
- [x] Unvalidated intelligence remains **`synthetic_demo`**  
- [x] Integration map + inventory + defect register published  
- [x] Clinical evaluation scorecard published (synthetic)  
- [x] Production-readiness gap report honest NO-GO for live  
- [x] E2E connected journey recorded green on local-dev Neon (doc 23)  
- [x] UX chrome + guided demo shipped  
- [x] Vercel deploy READY after merge (`6545c20` → www.akshhealth.com)  

### NO-GO (anything beyond R0)

- [ ] CSO-signed safety case (GOV-01) — **fail**  
- [ ] DPIA / regulatory (GOV-02) — **fail**  
- [ ] Org go-live (GOV-03) — **fail**  
- [x] INT-01…03 mitigated (orchestration + glucose/care-plan facades; stores not physically collapsed) — INT-09 patient URL access gate **fixed**; follow-up dual store / INT-04/08/10 remain  
- [ ] INT-01…03 physical store collapse / org tenancy — **fail** (facades only; Neon prod untouched)  

- [ ] Real-patient eval — **fail / not started**  

## Merge plan for this directive

1. **PR A** — Docs 16–22 (+ README index)  
2. **PR B** — E2E Playwright + ConnectedPatientChrome + timeline page + `/demo/connected-diabetes` + Sidebar  
3. Merge to `main` when CI green  
4. Confirm Vercel production READY  
5. Record E2E results in [23-e2e-test-results.md](./23-e2e-test-results.md)

## Honest verdict

| Question | Answer |
|----------|--------|
| Ship synthetic demo improvements to main? | **GO** (if CI + E2E pass) |
| Flip any capability to `production` / `in_validation`? | **NO-GO** |
| Flip LIVE_ORGANISATIONS? | **NO-GO** |
| Allow clinical AI on real patient records? | **NO-GO** |
