# Multi-Stakeholder Workflow Audit

**Date:** 2026-10-30  
**App:** `packages/platform-uk`  
**Data:** Controlled / synthetic only — no PHI  
**Method:** Code + API + repository + capability + tests (unit re-run subset listed in functionality audit)

---

## 1. Executive verdict

The clinical journey is **not one continuous product pipeline**. Three largely parallel tracks exist:

1. **Classic HITL intake → review case** (`/intake` → `/review` → `/cases/[id]`)
2. **Front Desk / slot-fill access** (Asha synthetic booking + production waitlist/slots)
3. **Connected diabetes synthetic spine** (Patient 360 → meds → care plan → continuous care → agent intel)

Only **Agent orchestration → Clinical review** is a durable, gated, SHIELD-audited handoff on the product path. Lab ingest and slot-fill are production-capable *data* paths that do **not** auto-fire from clinical review.

### Status legend

| Status | Meaning |
| --- | --- |
| **working** | End-to-end: API + persistence + UI + approval + audit + tests |
| **partial** | Built but synthetic, thin SHIELD, incomplete gates, or weak handoff |
| **disconnected** | Both sides exist; no automatic handoff |
| **missing** | Required handoff absent (may exist only in `lib/e2e/*-sim`) |

### Journey strip

```
Intake ─✗─► Booking ─✗─► Nurse ─~─► GP consult ─~─► Orchestrate ─✓─► Clinical review
                                                                         │
Outcome ◄─◐─ Care coord ◄─◐─ Follow-up ◄─◐─ Care plan ◄─◐─ Medication ◄─✗/◐─ Lab
```

`✓` working · `◐` partial · `✗` disconnected

---

## 2. Transition matrix

| # | Transition | Status |
| ---: | --- | --- |
| T01 | Patient intake → Reception booking | **disconnected** |
| T02 | Reception booking → Nurse observations | **disconnected** |
| T03 | Nurse observations → GP consultation | **partial** |
| T04 | GP consultation → Agent orchestration | **partial** |
| T05 | Agent orchestration → Clinical review | **working** (simulation / in_validation) |
| T06 | Clinical review → Lab | **disconnected** (+ missing order step) |
| T07 | Lab → Medication | **partial** |
| T08 | Medication → Care plan | **partial** |
| T09 | Care plan → Patient follow-up | **partial** |
| T10 | Patient follow-up → Care coordination | **partial** |
| T11 | Care coordination → Outcome | **partial** |

---

## 3. Transition detail

### T01 — Patient intake → Reception booking — **disconnected**

| Field | Detail |
| --- | --- |
| Initiator | Clinician/GP on intake; separately Reception via Front Desk |
| Agent | CANVAS (`lib/intake-generation.ts`); optional FastAPI SYNTHESIS |
| APIs | `POST /api/review-cases`; Front Desk `/api/front-desk/*`; slots `/api/orgs/[orgId]/slots`, `/api/connect/v1/appointments` |
| DB | `aksh.review_cases`; `aksh.front_desk_state`; access/network slot tables |
| Approval | Intake DRAFT case; Front Desk drafts/campaigns; slot-fill staff accept → PENDING_VERIFICATION |
| SHIELD | Front Desk safety handoff persists; intake weaker until decisions |
| Receiver | Reception — not auto-notified from intake |
| UI | `/intake`, `/dashboard/front-desk` |
| Tests | `tests/front-desk.test.ts`; e2e `front-desk.spec.ts`, `slot-fill.spec.ts` |
| Evidence | No shared care-episode id; Front Desk `intakeReferral` ≠ `/intake` |

### T02 — Reception booking → Nurse observations — **disconnected**

| Field | Detail |
| --- | --- |
| Initiator | Reception / Asha / schedule connector |
| Agent | Asha conversation (not register peer); `lib/front-desk/safety.ts` |
| APIs | Front Desk / slots; nurse `POST /api/clinical-spine/nurse-vitals`; continuous-care worklist |
| DB | front_desk_state; modality samples; continuous-care store |
| Approval | Consent/purpose for vitals; continuous-care escalations HITL |
| SHIELD | Nurse vitals accept/defer |
| Receiver | Nurse |
| UI | `/dashboard/nurse`, observations, continuous-care |
| Tests | `clinical-spine-phase-d`; continuous-care-operations; e2e stakeholder clinic is **SIMULATED** |
| Evidence | Booked slot does not create nurse observation task |

### T03 — Nurse observations → GP consultation — **partial**

| Field | Detail |
| --- | --- |
| Initiator | Nurse |
| Agent | None for raw vitals (`agentLabel: "Nurse"`) |
| APIs | nurse-vitals; `GET /api/patients/[id]/timeline` |
| DB | modality samples; `aksh.network_observations` |
| Approval | Consent/purpose; `ehrWrite:false` |
| SHIELD | Yes on nurse-vitals path |
| Receiver | GP via timeline / patient workspace |
| UI | VitalsForm; GP patient page timeline |
| Tests | clinical-spine-phase-b/d; route-smoke |
| Evidence | Visibility works; no Encounter auto-open; no forced review-queue item |

### T04 — GP consultation → Agent orchestration — **partial**

| Field | Detail |
| --- | --- |
| Initiator | GP / clinical reviewer |
| Agent | CONDUCTOR → SYNTHESIS, GUARDIAN, HORIZON, NEXUS, optional DrASSIST; gateway |
| APIs | `POST /api/agents/orchestrate`; parallel classic `POST /api/review-cases` (not full CONDUCTOR) |
| DB | Spine patient tables; SHIELD run audit |
| Approval | Auth + Track B / workspace closures; gateway may BLOCK |
| SHIELD | Orchestrate run recorded when DB up |
| Receiver | System → clinician review queue |
| UI | ClinicalOrchestratePanel; connected-diabetes |
| Tests | **PASS** clinical-spine-phase-c, clinical-proof-orchestration, e2e-platform-agents |
| Evidence | Explicit run works; classic intake does not auto-call CONDUCTOR |

### T05 — Agent orchestration → Clinical review — **working**

| Field | Detail |
| --- | --- |
| Initiator | System after GP trigger |
| Agent | SYNTHESIS, GUARDIAN, ORACLE/HORIZON, DrASSIST, PATHWAY deferred, SHIELD |
| APIs | `lib/clinical-spine/enqueue.ts`; `/api/review-cases/**`; GP agent-intel worklist (diabetes path) |
| DB | `aksh.review_cases`; review decisions; learning_events; shield_audit_events |
| Approval | `mayEnqueueAgentDraft`; human gates; Accept/Edit/Reject |
| SHIELD | Dual-write fail-visible on queue decisions |
| Receiver | GP / pharmacist |
| UI | `/review`, `/cases/[id]`, review-queue |
| Tests | **PASS** clinical-proof-hitl, agent-loop; e2e golden HITL (not re-run Playwright here) |
| Evidence | Strongest handoff; still simulation / `ehrWrite:false` |

### T06 — Clinical review → Lab — **disconnected** (+ **missing** order)

| Field | Detail |
| --- | --- |
| Initiator | Would be clinician; actual ingest is connector/staff |
| Agent | None for order; HORIZON may flag `missingLabs` |
| APIs | Ingest `POST /api/connect/v1/observations`; diabetes HbA1c routes; **no** Accept→lab order API |
| DB | `aksh.network_observations` |
| Approval | Connector auth; unit/range rules |
| SHIELD | Not first-class on every lab insert |
| Receiver | Lab/staff; GP later |
| UI | Trends/panels; no lab-order-from-review UI |
| Tests | lab-results-db; lab-agents; e2e lab-sim |
| Evidence | Lab ingest capability strong; HITL→ServiceRequest absent |

### T07 — Lab → Medication — **partial**

| Field | Detail |
| --- | --- |
| Initiator | Lab arrival or GP |
| Agent | GUARDIAN on re-orchestrate; pharmacist spine; glucose intel |
| APIs | orchestrate; medication-care; pharmacist-review |
| DB | observations → medcare / network_medications |
| Approval | medication_decision gate; medcare HITL; **no auto-prescribe** |
| SHIELD | Strong on spine pharmacist; **gap** on medcare repos |
| Receiver | GP / pharmacist |
| UI | medication-care; pharmacist dashboards |
| Tests | medication-personalised-care; clinical-spine-phase-d |
| Evidence | Labs can influence next run; auto med-review task not single transition |

### T08 — Medication → Care plan — **partial**

| Field | Detail |
| --- | --- |
| Initiator | GP |
| Agent | Deterministic templates; health-plan draft after Accept |
| APIs | medication-care care-plan decision; diabetes-journey; health-plan |
| DB | care_plan_records/decisions; health-plan repo |
| Approval | Explicit A/E/R; ehrWrite false |
| SHIELD | Spine Accept path stronger than medcare domain |
| Receiver | Care team / patient view |
| UI | medication-care; diabetes-journey; HealthPlanDraftPanel |
| Tests | medication-personalised-care; connected-journey-steps |
| Evidence | Works inside synthetic connected-diabetes; not universal |

### T09 — Care plan → Patient follow-up — **partial**

| Field | Detail |
| --- | --- |
| Initiator | System after Accept or clinician |
| Agent | agent-intel follow_up_draft; VOICE CARE; Front Desk campaigns |
| APIs | follow-up tasks; continuous-care; patient check-in; agent-intelligence |
| DB | diabetes follow-up tasks; continuous-care; check-in |
| Approval | Escalation HITL; check-in crisis → clinician |
| SHIELD | Check-in fail-visible; continuous-care mixed |
| Receiver | Patient + nurse/GP worklists |
| UI | patient companion; continuous-care panels |
| Tests | continuous-care-operations; clinical-proof-patient-checkin |
| Evidence | Diabetes journey Accept→follow-up exists; telephony false |

### T10 — Patient follow-up → Care coordination — **partial**

| Field | Detail |
| --- | --- |
| Initiator | Nurse / coordinator / escalation |
| Agent | PATHWAY/REFERRAL; VOICE CARE; NEXUS review-only |
| APIs | escalation decisions; pathway/referral; clinical-review; Front Desk |
| DB | continuous-care escalations; referral_package items; bridge staging |
| Approval | Escalation HITL; referral_pathway gate |
| SHIELD | Referral Accept via review decisions |
| Receiver | Coordinator / GP / specialist (sim) |
| UI | continuous-care; care-pathways; Front Desk; **no dedicated coordinator dashboard** |
| Tests | continuous-care; e2e-platform-stakeholder-clinic (sim) |
| Evidence | Live e-Referral missing |

### T11 — Care coordination → Outcome — **partial**

| Field | Detail |
| --- | --- |
| Initiator | Clinician / patient / admin (explicit) |
| Agent | SHIELD + LEARN recorder; `autoRetrain:false` |
| APIs | `/api/clinical-spine/outcomes`; learning outcome link; governed evaluation |
| DB | learning_events; governed-evaluation |
| Approval | Auth; signed gates for propose_model_update |
| SHIELD | captureSpineOutcome → persist |
| Receiver | Governance / clinician loop dashboards |
| UI | SpineOutcomesCapturePanel; admin evaluation |
| Tests | clinical-spine-phase-e; loop-outcomes **PASS** |
| Evidence | Capture works when invoked; **not enforced** — actions may stay awaiting_outcome |

---

## 4. Parallel tracks (root cause)

| Track | Entry | Continuity key |
| --- | --- | --- |
| Classic intake/HITL | `/intake` | Case id |
| Front Desk | `/dashboard/front-desk` | front_desk_state JSON |
| Slot-fill | org slots/waitlist | Access tables |
| Connected diabetes | connected-diabetes UI | Patient id + domain tables |
| E2E stakeholder clinic | `lib/e2e/stakeholder-clinic.ts` | In-memory — not product DB |

---

## 5. Agents by stage

| Stage | Agents |
| --- | --- |
| Intake | CANVAS (+ VOICE) |
| Reception | Asha (Front Desk) — not register peer |
| Nurse | Spine write; optional SYNTHESIS handover |
| GP / orchestrate | CONDUCTOR → SYNTHESIS, GUARDIAN, HORIZON, NEXUS, DrASSIST |
| Clinical review | SHIELD + human gates |
| Lab | Connector (not an agent) |
| Medication | GUARDIAN, pharmacist path |
| Care plan / follow-up | PATHWAY, VOICE CARE, agent-intel drafts |
| Outcomes | LEARN + SHIELD |

---

## 6. Highest-value reconnect gaps

1. Care-episode / correlation id across intake ↔ booking ↔ nurse ↔ GP ↔ review.  
2. Booking → nurse worklist from authoritative appointment.  
3. Clinical Accept → lab order draft (ServiceRequest) with HITL.  
4. Unify SHIELD on medcare / diabetes-journey / continuous-care decisions.  
5. Single clinician workspace (Volume I Ch.12).

---

## 7. Test index (absolute paths under app)

Representative unit/integration:  
`tests/front-desk.test.ts`, `tests/lab-results-db.test.ts`, `tests/clinical-spine-phase-*.test.ts`, `tests/clinical-proof-orchestration.test.ts`, `tests/clinical-proof-hitl.test.ts`, `tests/medication-personalised-care.test.ts`, `tests/continuous-care-operations.test.ts`, `tests/diabetes-agent-intelligence.test.ts`, `tests/e2e-platform-stakeholder-clinic.test.ts`, `tests/loop-outcomes.test.ts`, `tests/patient-spine-db.test.ts`, `tests/agent-loop.test.ts`

Playwright (not re-run in this audit):  
`e2e/front-desk.spec.ts`, `e2e/clinical-proof-orchestration.spec.ts`, `e2e/clinical-proof-hitl.spec.ts`, `e2e/platform-golden-hitl.spec.ts`, `e2e/platform-master-journey.spec.ts`, `e2e/connected-diabetes-journey.spec.ts`, `e2e/slot-fill.spec.ts`
