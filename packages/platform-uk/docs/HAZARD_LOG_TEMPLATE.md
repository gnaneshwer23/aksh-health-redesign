# Clinical safety hazard log template

Linked to: `docs/SAFETY_CASE_REHEARSAL.md` · Evidence pack artefact #6 · Gate 2 prep.

**Not a signed DCB0129 hazard log.** Appoint a Clinical Safety Officer before production.

## Hazard ↔ control ↔ test ID matrix

| Hazard ID | Hazard | Cause | Clinical consequence | Risk rating | Control | Test ID(s) | Expected result | Actual evidence | Residual risk | Residual risk linked tests | CSO approval |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| H-001 | Missed drug interaction | Incomplete med list / agent miss | Bleeding / ADR | High | GUARDIAN draft + HITL | CP-HITL-001 · CP-PATEL-001 · CP-ORCH-001 | Red interaction for Aspirin+Apixaban; GUARDIAN leads when urgent | Unit + e2e PASS (platform) | Medium until live graph | CP-GRAPH-001 | Unsigned |
| H-002 | False urgent alert | Over-sensitive scoring | Alert fatigue / delayed care | Medium | Clinician reject + evidence | CP-HITL-006 · CP-HITL-003 | Reject leaves no staging / no sim write | Automated PASS | Medium | CP-HITL-004 | Unsigned |
| H-003 | Wrong-patient context | Duplicate NHS / mismatch | Wrong-patient treatment | High | Identity fixtures P016 | CP-COHORT-002 | Collision flagged; no auto-merge | Cohort test PASS | Medium | CP-COHORT-001 | Unsigned |
| H-004 | Hallucinated diagnosis | LLM invention | Incorrect coding | High | HITL + eval harness | EVAL-GOLDEN · CP-HITL-005 | Unsupported output blocked/rejected; edit preserves clinician text | Eval + e2e | Medium | CP-ORCH-001 | Unsigned |
| H-005 | Missing allergy | Incomplete intake | ADR | High | Safety flags / blockers | CP-MULTI-001 (P001) · workflow allergy | Blocker / flag before accept | Multi-patient PASS | Medium | CP-HITL-001 | Unsigned |
| H-006 | Stale medication data | Conflicting EHR feeds | Wrong interaction check | High | Conflicting fixture P017 | CP-COHORT-001 | Freshness / conflict surfaced | Fixture only | High until Partner feeds | E2E-033 (BLOCKED) | Unsigned |
| H-007 | AI write without approval | Bypass path | Unauthorised record write | Critical | emis no-write + ehr-sim token | CP-BYPASS-001 · CP-BYPASS-002 · CP-BYPASS-003 · CP-SIM-001 · CP-HITL-004 | All bypass attempts fail; sim needs token | Automated PASS (platform) | Low on platform; High until Partner | E2E-033 | Unsigned |
| H-008 | Failed referral | Downstream outage | Delayed specialty care | Medium | Surface failure to clinician | GAP | Failure visible | Not automated | High | — | Unsigned |
| H-009 | Incorrect risk score | Bad inputs / version drift | Missed deterioration | High | ORACLE evidence + version | CP-HITL-002 · CP-ORCH-001 · CP-MULTI-001 (P018) | Inputs/mode traceable; shared context | Partial | Medium | CP-GRAPH-001 | Unsigned |
| H-010 | Delayed deterioration alert | Queue latency | Preventable admission | High | VOICE CARE / nurse path + perf smoke | CP-PERF-001 · MANUAL | Latency measured vs SLO soft targets | Perf smoke (soft) | High until load + monitoring | REQ-028 | Unsigned |
| H-011 | Silent model update / auto-retrain | Uncontrolled learning loop | Drifted clinical behaviour | Critical | Continuous-learning recorder (append-only; no retrain) | CP-LEARN-001 · REQ-029 | Events store prediction→decision→outcome; `autoRetrain=false` | Unit PASS | Medium until CSO release process | CP-SHIELD-001 | Unsigned |
| H-012 | Learning without HITL decision | Outcome logged without clinician | Unsafe feedback into eval | High | Learning API requires decision enum | CP-LEARN-001 · CP-HITL-003 | Invalid/missing decision rejected | Unit PASS | Low on platform | CP-HITL-006 | Unsigned |
| H-013 | Graph treated as live when mock | Aura paused / unreachable | Over-trust of interaction/risk | High | Honest mock mode + reconnect hint; live only when connected + seeded edges | CP-GRAPH-001 | `mode=mock` when not connected; never fake live; TAKES_MEDICATION asserted live | Graph test PASS (live when Aura up) | Medium — keep health + banner honesty | REQ-005 | Unsigned |
| H-014 | Medplum rehearsal mistaken for EHR | Flag confusion | False write-back confidence | Medium | `ENABLE_MEDPLUM_SYNC` default false; `liveEmis:false` | CP-MEDPLUM-001 · integration-boundary | Sync disabled by default; rehearsal ≠ EMIS | Contract tests PASS | Low | CP-BYPASS-003 | Unsigned |

## Residual risk register (Gate 2 prep)

| Residual | Why remains | Mitigations in this build | Blocks Gate 2 until |
| --- | --- | --- | --- |
| Live EMIS / SystmOne write-back unproven | Partner credentials absent | Staging + sim only; CP-BYPASS / CP-SIM / CP-HITL-004 | Partner UAT + DPIA |
| Neo4j Aura not live | Instance paused / unreachable | Honest mock + CP-GRAPH-001 | Resume + seed + `npm run smoke:neo4j` |
| Unsigned hazard log | No appointed CSO | This template + evidence pack #6 | CSO review dates + sign residual risk |
| Perf / load incomplete | Only smoke SLOs | `npm run smoke:perf` soft targets | Formal load + monitoring plan (#9/#14) |
| Continuous learning not productionised | Recorder only; no governed release | CP-LEARN-001; no auto-retrain | CSO model-release SOP |

## Instructions

1. Copy rows into the organisation’s controlled hazard log.
2. Attach evidence artefact IDs from Playwright / unit runs (`npm run test:clinical-proof`, `npm run test:e2e:clinical-proof`, `npm run smoke:perf`).
3. CSO signs residual risk before Gate 2.
4. Keep `docs/QA_TRACEABILITY_MATRIX.md` test IDs in sync with this table.
