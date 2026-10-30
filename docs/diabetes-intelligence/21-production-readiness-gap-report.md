# 21 — Production-readiness gap report

**Date:** 30 October 2026  
**Verdict:** **NO-GO for live-patient Connected Diabetes Intelligence.**  
Operational production workflows (e.g. slot-fill, CGM monitoring where status=`production`) are **separate** and must not be used to imply clinical-intelligence readiness.

## What is ready (simulation / synthetic)

- Phase 0–6 modules implemented with unit evidence referenced in `capabilities.ts`  
- HITL Accept/Edit/Reject on drafts; `ehrWrite: false` invariants  
- Capability honesty (`synthetic_demo`) and LIVE_ORGANISATIONS = 0  
- Offline agent eval harness for structure/safety language  
- Post-impl integration map + defect register + UX chrome/demo  

## Gaps by class

### Clinical safety & regulatory (blockers)

| Gap | Status |
|-----|--------|
| CSO-signed clinical safety case / hazard log for diabetes intelligence | Missing (GOV-01) |
| DPIA covering connected diabetes + AI drafts | Missing (GOV-02) |
| Regulatory / DCB / MHRA pathway opinion as applicable | Missing |
| Clinician-scored evaluation on real (or approved de-identified) cases | Not started — synthetic only |
| Approved organisation go-live checklist | None — LIVE_ORGANISATIONS=0 (GOV-03) |

### Integration & data integrity

| Gap | Status |
|-----|--------|
| Cross-phase orchestration (INT-01) | Mitigated |
| Dual glucose / care-plan / follow-up stores (INT-02/03 / INT-04a) | Mitigated (canonical write paths; care-plan/follow-up SoT + satellites/projections; additive 051; no prod drops) |
| Dual med-recon entry points (INT-04) | Mitigated (canonical write + facade; single physical store; entry_surface additive) |
| Unified timeline including all module decisions (INT-05) | Mitigated on `/timeline` + P360 panel merge |
| Agent context from live module snapshots (INT-07) | Mitigated |
| Org/practice tenancy on module tables (INT-08) | Mitigated (stamp + RLS proof; LIVE_ORGANISATIONS=0) |

### Security & access

| Gap | Status |
|-----|--------|
| `evaluatePatientUrlAccess` on module APIs (INT-09) | Fixed — `denyUnlessConnectedPatientAccess` |
| Clinical persona / decision scope on module HITL (INT-10) | Fixed — `denyUnlessConnectedDiabetesDecisionScope` + `decidedByPersona` |

### Clinical content quality

| Gap | Status |
|-----|--------|
| Licensed CDS / drug interaction DB | Explicitly out of scope (`validatedCds=false`) |
| Glucose derivation clinical validation | Provisional |
| Autonomous outreach / recall campaigns | Planned / off |

### Evidence vs capability register

| Requirement | Met? |
|-------------|------|
| Unit tests listed as evidence for each `synthetic_demo` cap | Yes |
| Cross-phase E2E Playwright on local-dev Neon | Added in validation workstream — see doc 23 |
| CLINICAL_RELEASE checklist for promotion | Not met |

## Claims we will not make

- Production-ready diabetes clinical AI  
- Clinical validation or regulatory approval  
- Live EHR write-back or autonomous prescribing  
- LIVE_ORGANISATIONS > 0  

## Residual risk if misused

Pointing production Neon or live EHR credentials at unvalidated drafts could cause over-trust. Mitigations: environment markers, capability status, synthetic UI disclosure, default module flags, no Neon prod writes in this workstream.
