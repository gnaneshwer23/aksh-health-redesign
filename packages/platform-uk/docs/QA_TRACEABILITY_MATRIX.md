# QA Traceability Matrix — Clinical Proof

Master link from vision requirements → components → tests → evidence → status.

**Statuses:** `PASS` (automated green) · `PARTIAL` · `BLOCKED: partner` · `GAP` · `MANUAL`

Generate JSON companion: `docs/qa-traceability-matrix.json` (kept in sync with this table).

| Req ID | Requirement | Component | Test ID | Expected | Evidence path | Status |
| --- | --- | --- | --- | --- | --- | --- |
| REQ-001 | Patient identity / cohort breadth | `lib/mock-data/patients.ts` | CP-COHORT-001 | ≥25 patients; all required profiles | `tests/clinical-proof-cohort.test.ts` | PASS |
| REQ-002 | Duplicate NHS detection fixture | P002 / P016 | CP-COHORT-002 | Shared NHS number flagged | same | PASS |
| REQ-003 | FHIR-shaped draft validation | `lib/clinical-proof/fhir-shape.ts` | CP-FHIR-001 | Required fields present | `tests/clinical-proof-fhir-shape.test.ts` | PASS |
| REQ-004 | FHIR R4 schema validation in CI | `lib/clinical-proof/fhir-r4-validator.ts` | CP-FHIR-002 | Invalid resources fail CI; 9 target types | `tests/clinical-proof-fhir-r4.test.ts` | PASS |
| REQ-005 | Knowledge graph relationships | Neo4j seed / mock | CP-GRAPH-001 | Live when Aura up; else honest mock | `tests/clinical-proof-graph.test.ts` | PASS |
| REQ-006 | GUARDIAN draft HITL-only | `/api/agents/guardian` | CP-HITL-001 | `ehrWrite:false`, `hitlRequired` | `tests/clinical-proof-hitl.test.ts` + e2e | PASS |
| REQ-007 | ORACLE draft HITL-only | `/api/agents/oracle` | CP-HITL-002 | Same | same | PASS |
| REQ-008 | Agent eval thresholds | `lib/eval/*` | EVAL-GOLDEN | Golden cases score | `npm run eval:agents` | PASS |
| REQ-009 | Draft ≠ record | Review queue / staging | CP-HITL-003 | Accept required before sim write | hitl + ehr-sim tests | PASS |
| REQ-010 | Accept → FHIR stage → sim write | HITL chain | CP-HITL-004 | Stage + token + sim once; EMIS no live write | `tests/clinical-proof-hitl-chain.test.ts` + e2e | PASS |
| REQ-011 | Edit preserves clinician version | Dashboard store / review | CP-HITL-005 | Edited content retained | e2e review queue | PASS |
| REQ-012 | Reject → no staging / no write | HITL reject | CP-HITL-006 | No sim write without token | unit + chain | PASS |
| REQ-013 | Bypass: unauthenticated write | emis-staging / ehr-sim | CP-BYPASS-001 | 401 without session | e2e clinical-proof-hitl | PASS |
| REQ-014 | Bypass: agent cannot EHR write | Agent APIs | CP-BYPASS-002 | Responses deny ehrWrite | unit | PASS |
| REQ-015 | EMIS staging no live write | `emis-staging` | CP-BYPASS-003 | `liveWriteBack:false` | unit | PASS |
| REQ-016 | Simulated write needs approval | `ehr-writeback-sim` | CP-SIM-001 | Token required; replay denied | unit + API | PASS |
| REQ-017 | Live EMIS write-back | Partner API | E2E-033 | Approved resource written once | — | BLOCKED: partner |
| REQ-018 | Patel golden path (UI) | `/dashboard/gp`, `/demo/patel` | CP-PATEL-001 | Patient, queue, GUARDIAN, ORACLE, HITL | `e2e/clinical-proof-patel.spec.ts` | PASS |
| REQ-019 | Patel EHR write-back step | EMIS | CP-PATEL-002 | Live write | — | BLOCKED: partner |
| REQ-020 | SHIELD append-only via API | `/api/audit/shield` | CP-SHIELD-001 | No PUT/DELETE handlers | `tests/clinical-proof-shield.test.ts` | PASS |
| REQ-021 | RBAC cross-role denial | Middleware | CP-RBAC-001 | Nurse cannot use GP-only paths as GP session | e2e + redirects | PARTIAL |
| REQ-022 | Public GP/ICS/Hospital allowlist | Middleware | CP-RBAC-002 | Admin/pharmacist require auth; demos open | `e2e/clinical-proof-rbac.spec.ts` | PASS |
| REQ-023 | Role smoke matrix | Smoke scripts | CP-ROLE-001 | All 8 dashboards HTTP smoke | `npm run smoke:all` | PASS |
| REQ-024 | Mirth / HL7 v2 intake | — | — | Message round-trip | — | GAP |
| REQ-025 | CIS2 authentication | — | — | NHS login | — | BLOCKED: partner |
| REQ-026 | Hazard log linked to safety case | Evidence pack + template | CP-HAZARD-001 | Residual risks ↔ test IDs | `docs/HAZARD_LOG_TEMPLATE.md` + hazard-trace test | PASS |
| REQ-027 | Security / pen test | — | — | Report | evidence pack #8 | GAP |
| REQ-028 | Performance SLOs | `lib/clinical-proof/perf-slos.ts` | CP-PERF-001 | Soft SLO smoke; skip/soft-fail if unreachable | `npm run smoke:perf` + perf-slos test | PASS |
| REQ-029 | Continuous learning governance | `/api/learning/events` | CP-LEARN-001 | Append-only; no auto-retrain; HITL decision required | `tests/clinical-proof-learning.test.ts` + `docs/CONTINUOUS_LEARNING.md` | PASS |
| REQ-030 | Gate 1–3 sign-off | Evidence pack | — | Signed approvals | evidence pack #13–16 | MANUAL |
| REQ-031 | Multi-patient golden paths | 7 diverse cohort patients | CP-MULTI-001 | Parameterized agents + HITL + EMIS blocked | `e2e/clinical-proof-multi-patient.spec.ts` + `tests/clinical-proof-golden-paths.test.ts` | PASS |
| REQ-032 | Agent orchestration (shared context) | `lib/clinical-proof/agent-orchestration.ts` | CP-ORCH-001 | SYNTHESIS+GUARDIAN+ORACLE(+DrASSIST); no overwrite; GUARDIAN first when urgent; timeouts | unit + `e2e/clinical-proof-orchestration.spec.ts` | PASS |
| REQ-033 | Evidence pack generators | `scripts/generate-evidence-pack.mjs` | CP-EVID-001 | `npm run evidence:pack` writes generated snapshots | `docs/evidence-pack/README.md` | PASS |
| REQ-034 | Medplum FHIR rehearsal flag | `lib/medplum-client.ts` | CP-MEDPLUM-001 | Disabled by default; push refuses; liveEmis false | `tests/clinical-proof-medplum.test.ts` + `npm run smoke:medplum` | PASS |
| REQ-035 | Tenant / RLS isolation | practice filter + clinical API deny | CP-TENANT-001 | Practice A≠B; patient URL deny; admin clinical API deny | `tests/clinical-proof-tenant-isolation.test.ts` | PASS |
| REQ-036 | Eventual learning outcome link | `/api/learning/events/[id]/outcome` | CP-LEARN-002 | Append-only link; source unchanged; no auto-retrain | learning test + admin UI | PASS |
| REQ-037 | Governed model release SOP | `docs/GOVERNED_MODEL_RELEASE_SOP.md` | CP-LEARN-003 | Approval gates before model version bump | Documentary stub + learning test | MANUAL |

## Counts (snapshot)

| Bucket | Count |
| --- | ---: |
| Requirements in matrix | 37 |
| Automated PASS | 29 |
| PARTIAL | 1 |
| BLOCKED: partner | 3 |
| GAP | 2 |
| MANUAL | 2 |

Re-count after suite changes; prefer updating JSON + this table together.

**Note on REQ-004:** Zod FHIR R4 schema gates fail CI on invalid resources for DocumentReference, Condition, Flag, MedicationRequest, RiskAssessment, ServiceRequest, Observation, AuditEvent, Encounter. Full HL7 Java Validator JAR is still not in CI (optional stretch / partner tooling).

**Note on REQ-029 / REQ-036 / REQ-037:** Recorder + eventual outcome link are automated. Governed model release / CSO signatures remain MANUAL (SOP stub shipped; Gate 2+).

**Note on REQ-028:** Soft smoke SLOs only — formal load test remains a residual gap in evidence pack #9 narrative.

**Note on REQ-035:** App-layer practice filter + clinical API deny + Postgres RLS scaffold on `review_cases`. Full multi-tenant Neo4j RLS remains out of scope (synthetic cohort is shared demo graph).
