# Gate 3 checklist — Pilot / go-live authority

**Purpose:** Sponsor decision to run a limited pilot under agreed controls.  
**Does not claim:** Full production NHS deployment or live Partner EHR write-back unless separately evidenced.

| # | Criterion | Evidence | Owner | Pass? | Date |
| ---: | --- | --- | --- | --- | --- |
| G3-01 | Gate 1 passed (or waivers listed) | `gate-1-platform-readiness.md` | Release | ☐ | |
| G3-02 | Gate 2 passed (or waivers listed) | `gate-2-clinical-safety.md` | CSO | ☐ | |
| G3-03 | DPIA / IG path agreed for pilot site | Site IG pack | IG lead | ☐ | |
| G3-04 | Partner integrations scoped | EMIS/CIS2/Mirth = blocked or out of scope | Sponsor | ☐ | |
| G3-05 | Rollback plan reviewed | `16-release-rollback.md` | Ops | ☐ | |
| G3-06 | Pilot monitoring plan | `14-pilot-monitoring.md` | Ops + Clinical | ☐ | |
| G3-07 | On-call / incident contacts | Runbook | Ops | ☐ | |
| G3-08 | User access / RBAC for pilot cohort | Role matrix + smoke | Eng + Admin | ☐ | |
| G3-09 | Communications / patient notice (if required) | Site materials | Sponsor | ☐ | |
| G3-10 | Explicit “no live EMIS write-back” confirmation | Staging contract + sponsor ack | Sponsor + Eng | ☐ | |

## Sign-off

| Role | Name | Signature | Date |
| --- | --- | --- | --- |
| Pilot sponsor | | | |
| Clinical Safety Officer | | | |
| Information governance | | | |
| Engineering / release | | | |

**Result:** ☐ GO · ☐ NO-GO · ☐ GO WITH WAIVERS (list below)  
**Waivers / conditions:**
