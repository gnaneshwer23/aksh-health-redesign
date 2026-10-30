# Agent Integration Gap Matrix

**Date:** 2026-10-30  
**App:** `packages/platform-uk`  
**Companion:** `AGENT_FUNCTIONALITY_AUDIT.md`  
**Preference order for remediation:** extend existing → deterministic service → integrate platform → defer → (last) new agent.

---

## 1. Status keys

| Status | Meaning |
| --- | --- |
| OK | Verified wired for intended trigger |
| PARTIAL | Exists but incomplete / alias drift / wrong surface |
| GAP | Required for HCP eval journey; missing or disconnected |
| DEFER | Intentionally Phase 2 / out of scope pre-launch |
| N/A | Not applicable to this agent |

---

## 2. Agent × capability matrix

| Agent | Runner | API | CONDUCTOR | Review queue | SHIELD | UI | Tests | Release ready |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CONDUCTOR | OK | OK `/orchestrate` | is self | OK (enqueue) | OK (spine) | OK | OK | NO (sim) |
| VOICE | PARTIAL | PARTIAL `/transcribe` | N/A | PARTIAL voice_transcript | PARTIAL | OK | PARTIAL | NO |
| CANVAS | OK | PARTIAL (via review-cases) | N/A | OK (creates case) | PARTIAL | OK | OK | NO |
| SYNTHESIS | OK | OK | OK | OK soap_note | OK | OK | OK | NO |
| DrASSIST | OK | OK | PARTIAL (opt-in) | OK codes | OK | OK | OK | NO |
| GUARDIAN | OK | OK | OK | OK + med gate | OK | OK | OK | NO |
| HORIZON | OK | OK (+alias) | OK (as ORACLE) | OK oracle_update | OK | OK | OK / eval PARTIAL | NO |
| NEXUS | OK (dual) | OK | OK | OK draft | OK | OK | OK | NO |
| PATHWAY | OK | OK (+alias) | N/A (post) | OK referral | OK | PARTIAL | OK | NO |
| BRIDGE | OK | PARTIAL (integrations) | N/A (post) | N/A | PARTIAL | PARTIAL | OK | NO |
| SHIELD | OK | OK audit APIs | cross-cut | N/A | is self | PARTIAL ops UI | OK | NO |
| COMPASS | OK | OK (+alias) | N/A | N/A | PARTIAL | PARTIAL | PARTIAL | NO |
| PRISM | GAP | GAP | GAP | GAP | N/A | marketing only | honesty OK | DEFER |
| ATLAS | GAP | GAP | GAP | GAP | N/A | marketing only | honesty OK | DEFER |

---

## 3. Journey transition gaps (agent-relevant)

| Transition | Status | Agent impact | Prefer |
| --- | --- | --- | --- |
| Intake → Booking | disconnected | CANVAS/VOICE never hand off to Front Desk | Integrate platform: care-episode id |
| Booking → Nurse | disconnected | No agent; worklist gap | Deterministic: appointment → nurse task |
| Nurse → GP | partial | Timeline only; no auto CONDUCTOR | Extend spine role-events |
| GP → Orchestrate | partial | Manual orchestrate vs classic intake split | Unify clinician surface (Volume I Ch.12) |
| Orchestrate → Review | **working** | Core agents OK | Preserve |
| Review → Lab order | disconnected / missing | HORIZON `missingLabs` advisory only | Deterministic ServiceRequest draft + HITL |
| Lab → Medication | partial | GUARDIAN needs re-run; medcare synthetic | Extend spine + SHIELD on medcare |
| Med → Care plan | partial | Domain HITL; SHIELD thin | Integrate SHIELD dual-write |
| Care plan → Follow-up | partial | VOICE CARE / agent-intel | Extend continuous-care; do not new agent |
| Follow-up → Coordination | partial | PATHWAY drafts; no live e-Referral | Extend PATHWAY + BRIDGE |
| Coordination → Outcome | partial | Outcomes opt-in | Extend outcomes-loop capture UX |

Full detail: `MULTI_STAKEHOLDER_WORKFLOW_AUDIT.md`.

---

## 4. Named gaps (prioritised reasoning)

### G1 — Dual orchestration naming (P0)

**Evidence:** `lib/clinical-proof/agent-orchestration.ts::runAgentOrchestration` vs `lib/diabetes-intelligence/agent-intel-assemble.ts::runAgentOrchestration`.  
**Risk:** Auditors/implementers wire the wrong path; diabetes path claims CONDUCTOR/SYNTHESIS labels without calling LLM agents.  
**Prefer:** Rename diabetes export (e.g. `runDiabetesAgentIntelAssemble`); keep clinical-proof name. Do **not** create a third orchestrator.

### G2 — Clinician surface split (P0)

**Evidence:** Classic intake review cases vs spine orchestrate vs connected-diabetes agent-intel worklists (Volume I Ch.12 debt).  
**Prefer:** Extend clinical-spine enqueue as single GP review worklist adapter; keep domain seed pipelines as data prep only.

### G3 — Care-episode continuity (P0)

**Evidence:** Intake case id, front_desk_state, network patient id, diabetes domain tables — no shared episode correlation.  
**Prefer:** Deterministic episode/correlation id service spanning stakeholders — not a new agent.

### G4 — Review → Lab order missing (P1)

**Evidence:** Lab ingest production-capable (`lab_results`); Accept does not create orders; `missingLabs` advisory.  
**Prefer:** Deterministic draft ServiceRequest from accepted case + HITL. Defer live lab vendor until gate signed.

### G5 — SHIELD coverage on diabetes-intel decisions (P1)

**Evidence:** Strong dual-write on review-case path; medcare/diabetes-intelligence repos lack clear `persistShieldAuditEvent`.  
**Prefer:** Extend SHIELD helpers into domain decision routes — do not invent a second audit agent.

### G6 — Alias / REVIEW_ORDER drift (P1)

**Evidence:** Register canonical HORIZON/COMPASS/PATHWAY/DrASSIST; runtime still ORACLE/EQUITY/REFERRAL/DR_ASSIST.  
**Prefer:** Keep aliases (FR-AGT-003) but migrate REVIEW_ORDER + types to canonical ids with alias map — extend register, no new agents.

### G7 — VOICE CARE confusion (P2)

**Evidence:** Lives under `lib/agents/` + `/api/agents/voice-care` but is not register VOICE.  
**Prefer:** Relabel product/API docs; optionally move out of agents namespace later. Defer rename if it breaks demos.

### G8 — Directory oversell (P2)

**Evidence:** `AGENT_DIRECTORY.live: true` and CANVAS `intelligence_llm` vs register `modelFlag: null` / `in_validation`.  
**Prefer:** Align directory fields with register honesty module.

### G9 — COMPASS not on clinician loop (P2)

**Evidence:** On-request only; correct per register. Gap is product: ICS/admin UI thin for HCP eval of population briefs.  
**Prefer:** Extend existing equity API + admin surface; defer population LLM until small-cell sign-off.

### G10 — PRISM / ATLAS (P4 / DEFER)

**Evidence:** `phase2-capability-status` hard `built:false`.  
**Prefer:** Defer until funded imaging/research use case (migration plan P3-1). Keep honesty module.

### G11 — Durable workflow engine (DEFER)

**Evidence:** No `"use workflow"` / `@vercel/workflow` app usage; ADR avoids Temporal now.  
**Prefer:** Defer DevKit until multi-day resumable waits required. Do not invent parallel durable framework.

### G12 — Eval harness ORACLE mention regression (P1)

**Evidence:** `npm run eval:agents` EXIT 1, passRate 67%, missing mention `"ORACLE"` under deterministic mode (HORIZON rename drift likely).  
**Prefer:** Fix golden-case mentions to accept HORIZON|ORACLE — extend eval harness, not agent logic.

### G13 — Coaching/causal under `/api/agents` (P3)

**Evidence:** Not in register; agent-shaped APIs.  
**Prefer:** Document as precision-health services; defer namespace cleanup.

### G14 — No Agent Ops dashboard (P1)

**Evidence:** Readiness + loop-outcomes APIs exist; no clinician/ops dashboard aggregating runs, timeouts, accept/edit/reject, gateway BLOCK rates.  
**Prefer:** Extend existing loop-outcomes + readiness into Agent Ops UI (see HCP eval plan).

---

## 5. What not to do

| Anti-pattern | Why |
| --- | --- |
| Add new named agents for booking/nurse/lab | Deterministic services + existing PATHWAY/BRIDGE/SHIELD cover needs |
| Second CONDUCTOR framework | Spine+proof already canonical |
| Enable autonomous prescribe / live EHR write | Explicitly prohibited |
| Treat Playwright-sim stakeholder clinic as production journey | In-memory sims ≠ product DB |
| Flip PRISM/ATLAS to live without funded use case | Honesty invariant |

---

## 6. Gap → roadmap map

| Gap | Roadmap item |
| --- | --- |
| G1 | P0-ORCH-01 |
| G2 | P0-UX-01 |
| G3 | P0-EPISODE-01 |
| G4 | P1-LAB-01 |
| G5 | P1-SHIELD-01 |
| G6 | P1-ALIAS-01 |
| G12 | P1-EVAL-01 |
| G14 | P1-OPS-01 |
| G7–G9, G13 | P2–P3 |
| G10–G11 | P4 / DEFER |

See `AGENT_IMPLEMENTATION_ROADMAP.md` for full work-item fields.
