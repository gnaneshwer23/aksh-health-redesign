# QA Traceability Matrix — Clinical Proof

Master link from vision requirements → components → tests → evidence → status.

**Statuses:** `PASS` (automated green) · `PARTIAL` · `BLOCKED: partner` · `GAP` · `MANUAL`

Generate JSON companion: `docs/qa-traceability-matrix.json` (kept in sync with this table).

| Req ID | Requirement | Component | Test ID | Expected | Evidence path | Status |
| --- | --- | --- | --- | --- | --- | --- |
| REQ-001 | Patient identity / cohort breadth | `lib/mock-data/patients.ts` | CP-COHORT-001 | ≥25 patients; all required profiles | `tests/clinical-proof-cohort.test.ts` | PASS |
| REQ-002 | Duplicate NHS detection fixture | P002 / P016 | CP-COHORT-002 | Shared NHS number flagged | same | PASS |
| REQ-003 | FHIR-shaped draft validation | `lib/clinical-proof/fhir-shape.ts` | CP-FHIR-001 | Required fields present | `tests/clinical-proof-fhir-shape.test.ts` | PASS |
| REQ-004 | Full HL7 FHIR Validator | — | — | 100% validator pass | — | GAP |
| REQ-005 | Knowledge graph relationships | Neo4j seed / mock | CP-GRAPH-001 | Seed uses cohort; live Aura optional | `scripts/seed-neo4j.ts` + health | PARTIAL |
| REQ-006 | GUARDIAN draft HITL-only | `/api/agents/guardian` | CP-HITL-001 | `ehrWrite:false`, `hitlRequired` | `tests/clinical-proof-hitl.test.ts` + e2e | PASS |
| REQ-007 | ORACLE draft HITL-only | `/api/agents/oracle` | CP-HITL-002 | Same | same | PASS |
| REQ-008 | Agent eval thresholds | `lib/eval/*` | EVAL-GOLDEN | Golden cases score | `npm run eval:agents` | PASS |
| REQ-009 | Draft ≠ record | Review queue / staging | CP-HITL-003 | Accept required before sim write | hitl + ehr-sim tests | PASS |
| REQ-010 | Accept → audit / staging path | SHIELD + EMIS staging | CP-HITL-004 | Staging `ehrWriteAttempted:false`; SHIELD append | unit + e2e | PARTIAL |
| REQ-011 | Edit preserves clinician version | Dashboard store / review | CP-HITL-005 | Edited content retained | e2e review queue | PASS |
| REQ-012 | Reject → no staging / no write | HITL reject | CP-HITL-006 | No sim write without token | unit | PASS |
| REQ-013 | Bypass: unauthenticated write | emis-staging / ehr-sim | CP-BYPASS-001 | 401 without session | e2e clinical-proof-hitl | PASS |
| REQ-014 | Bypass: agent cannot EHR write | Agent APIs | CP-BYPASS-002 | Responses deny ehrWrite | unit | PASS |
| REQ-015 | EMIS staging no live write | `emis-staging` | CP-BYPASS-003 | `liveWriteBack:false` | unit | PASS |
| REQ-016 | Simulated write needs approval | `ehr-writeback-sim` | CP-SIM-001 | Token required; replay denied | unit + API | PASS |
| REQ-017 | Live EMIS write-back | Partner API | E2E-033 | Approved resource written once | — | BLOCKED: partner |
| REQ-018 | Patel golden path (UI) | `/dashboard/gp`, `/demo/patel` | CP-PATEL-001 | Patient, queue, GUARDIAN, ORACLE, HITL | `e2e/clinical-proof-patel.spec.ts` | PARTIAL |
| REQ-019 | Patel EHR write-back step | EMIS | CP-PATEL-002 | Live write | — | BLOCKED: partner |
| REQ-020 | SHIELD append-only via API | `/api/audit/shield` | CP-SHIELD-001 | No PUT/DELETE handlers | `tests/clinical-proof-shield.test.ts` | PASS |
| REQ-021 | RBAC cross-role denial | Middleware | CP-RBAC-001 | Nurse cannot use GP-only paths as GP session | e2e + redirects | PARTIAL |
| REQ-022 | Public GP/ICS allowlist only | Middleware | CP-RBAC-002 | Admin requires auth | `e2e/role-routing.spec.ts` | PASS |
| REQ-023 | Role smoke matrix | Smoke scripts | CP-ROLE-001 | All 8 dashboards HTTP smoke | `npm run smoke:all` | PASS |
| REQ-024 | Mirth / HL7 v2 intake | — | — | Message round-trip | — | GAP |
| REQ-025 | CIS2 authentication | — | — | NHS login | — | BLOCKED: partner |
| REQ-026 | Hazard log linked to safety case | Evidence pack | CP-HAZARD-001 | Template filled | `docs/evidence-pack/06-hazard-log.md` | MANUAL |
| REQ-027 | Security / pen test | — | — | Report | evidence pack #8 | GAP |
| REQ-028 | Performance SLOs | — | — | Load report | evidence pack #9 | GAP |
| REQ-029 | Continuous learning governance | Research eval | — | Controlled model release | documentary | GAP |
| REQ-030 | Gate 1–3 sign-off | Evidence pack | — | Signed approvals | evidence pack #13–16 | MANUAL |

## Counts (snapshot)

| Bucket | Count |
| --- | ---: |
| Requirements in matrix | 30 |
| Automated PASS | 16 |
| PARTIAL | 5 |
| BLOCKED: partner | 4 |
| GAP | 4 |
| MANUAL | 1 |

Re-count after suite changes; prefer updating JSON + this table together.
