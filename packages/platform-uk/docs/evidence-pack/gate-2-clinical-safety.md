# Gate 2 checklist — Clinical safety rehearsal

**Purpose:** Confirm residual clinical risks are listed, HITL is mandatory, and no autonomous clinical writes.  
**Does not claim:** CSO-signed DCB0129 complete or MHRA registration.

| # | Criterion | Evidence | Owner | Pass? | Date |
| ---: | --- | --- | --- | --- | --- |
| G2-01 | Hazard log linked to tests | `docs/HAZARD_LOG_TEMPLATE.md` + CP-HAZARD-001 | Clinical safety | ☐ | |
| G2-02 | Residual risk register current | `15-residual-risk.md` + E2E gap register | Clinical safety | ☐ | |
| G2-03 | Every AI clinical output is draft | Agent APIs + UI draft labelling | Eng + Clinical | ☐ | |
| G2-04 | Accept / Edit / Reject exercised | Clinical-proof HITL e2e | Eng + Clinician UAT | ☐ | |
| G2-05 | Reject never reaches record | CP-HITL-006 / bypass tests | Eng | ☐ | |
| G2-06 | Zero autonomous clinical writes | Agents + learning recorder deny EHR write | Eng | ☐ | |
| G2-07 | Learning loop has no auto-retrain | `/api/learning/events` + admin learning UI | Eng + CSO | ☐ | |
| G2-08 | Bypass paths 401 without session | CP-BYPASS-* | Eng | ☐ | |
| G2-09 | Clinician UAT notes attached | `13-uat-signoff.md` (may be partial) | Clinician | ☐ | |
| G2-10 | CSO review of residual risks | Signed comment or deferral | CSO | ☐ | |

## Sign-off

| Role | Name | Signature | Date |
| --- | --- | --- | --- |
| Clinical Safety Officer (or delegate) | | | |
| Clinician UAT lead | | | |
| Engineering lead | | | |

**Result:** ☐ PASS · ☐ FAIL · ☐ DEFER  
**Notes:**
