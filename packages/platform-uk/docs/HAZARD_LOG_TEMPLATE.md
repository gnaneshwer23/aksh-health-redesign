# Clinical safety hazard log template

Linked to: `docs/SAFETY_CASE_REHEARSAL.md` · Evidence pack artefact #6.

**Not a signed DCB0129 hazard log.** Appoint a Clinical Safety Officer before production.

| Hazard ID | Hazard | Cause | Clinical consequence | Risk rating | Control | Test case | Expected result | Actual evidence | Residual risk | CSO approval |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| H-001 | Missed drug interaction | Incomplete med list / agent miss | Bleeding / ADR | High | GUARDIAN draft + HITL | CP-HITL-001 / Patel P002 | Red interaction for Aspirin+Apixaban | _pending_ | Medium until live graph | Unsigned |
| H-002 | False urgent alert | Over-sensitive scoring | Alert fatigue / delayed care | Medium | Clinician reject + evidence | CP-HITL-006 | Reject leaves no staging | _pending_ | Medium | Unsigned |
| H-003 | Wrong-patient context | Duplicate NHS / mismatch | Wrong-patient treatment | High | Identity fixtures P016 | CP-COHORT-002 | Collision flagged; no auto-merge | Cohort test PASS | Medium | Unsigned |
| H-004 | Hallucinated diagnosis | LLM invention | Incorrect coding | High | HITL + eval harness | EVAL-GOLDEN | Unsupported output blocked/rejected | Eval harness | Medium | Unsigned |
| H-005 | Missing allergy | Incomplete intake | ADR | High | Safety flags / blockers | workflow allergy case | Blocker before accept | workflow tests | Medium | Unsigned |
| H-006 | Stale medication data | Conflicting EHR feeds | Wrong interaction check | High | Conflicting fixture P017 | MANUAL | Freshness / conflict surfaced | Fixture only | High | Unsigned |
| H-007 | AI write without approval | Bypass path | Unauthorised record write | Critical | emis no-write + ehr-sim token | CP-BYPASS-* | All bypass attempts fail | Automated PASS (platform) | Low on platform; High until Partner | Unsigned |
| H-008 | Failed referral | Downstream outage | Delayed specialty care | Medium | Surface failure to clinician | GAP | Failure visible | Not automated | High | Unsigned |
| H-009 | Incorrect risk score | Bad inputs / version drift | Missed deterioration | High | ORACLE evidence + version | CP-HITL-002 | Inputs/mode traceable | Partial | Medium | Unsigned |
| H-010 | Delayed deterioration alert | Queue latency | Preventable admission | High | VOICE CARE / nurse path | MANUAL | Latency measured | Not automated | High | Unsigned |

## Instructions

1. Copy rows into the organisation’s controlled hazard log.
2. Attach evidence artefact IDs from Playwright / unit runs.
3. CSO signs residual risk before Gate 2.
