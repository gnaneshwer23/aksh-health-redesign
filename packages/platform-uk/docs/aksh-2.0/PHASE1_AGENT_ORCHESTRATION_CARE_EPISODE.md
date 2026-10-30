# Phase 1 — Agent orchestration contracts + Care Episode foundation

**Branch / PR scope:** foundation only (audit + contracts + Care Episode persistence).  
**Not in this PR:** stakeholder UX redesign, full cross-role journeys, live FHIR adapters, HCP eval env, durable Workflow consumer, Vercel Sandbox.  
**Rule:** Do not merge/deploy automatically. Controlled synthetic data only. `ehrWrite:false` / `liveEmis:false`.

**Evidence date:** 2026-10-30  
**Codebase:** `packages/platform-uk` on `origin/main` (+ this phase)

---

## 1. Capability classification (audit)

| # | Capability | Classification | Reused primary agents / services |
|---|------------|----------------|----------------------------------|
| 1 | Patient Intake | **operational** | CANVAS, VOICE · `lib/intake-generation.ts` |
| 2 | Clinical Context | **partially_integrated** | CONDUCTOR, NEXUS · Context Engine, Patient State, Patient 360 |
| 3 | Clinical Documentation | **operational** | SYNTHESIS, DrASSIST · HITL SOAP drafts |
| 4 | CDS | **partially_integrated** | NEXUS, CONDUCTOR · decision module, contracted NEXUS |
| 5 | Medication Safety | **partially_integrated** | GUARDIAN · med-care surfaces; gateway on CI 2.0 paths |
| 6 | Laboratory Intelligence | **partially_integrated** | NEXUS, HORIZON · labs + connector; lab-sim adapter |
| 7 | Care Coordination | **partially_integrated** | PATHWAY, CONDUCTOR · diabetes journey / continuous care |
| 8 | Appointment Workflow | **partially_integrated** | CONDUCTOR · access/slot-fill (prod) + schedule connector (RO) |
| 9 | Patient Engagement | **simulated_adapter** | CANVAS · patient-access synthetic transport |
| 10 | Guardian Safety | **partially_integrated** | GUARDIAN, SHIELD · `lib/guardian-gateway` |
| 11 | Clinical Evidence / Retrieval | **partially_integrated** | NEXUS · GraphRAG (mock when Aura paused) |
| 12 | Evaluation / Quality | **partially_integrated** | SHIELD, COMPASS · evaluation engine + golden evals |

**Stakeholder / journey / interop honesty (out of Phase 1 implement scope; audited):**

| Area | Classification | Notes |
|------|----------------|-------|
| Core roles (patient, GP, nurse, pharmacist, practice-manager) | operational / partial | Real workspace gated in `lib/env/workspace.ts` |
| Lab / diabetes-specialist / care-coordinator personas | **missing** (role) | Surfaces folded into GP/nurse/access |
| Governance / researcher / ICS / hospital | partially_integrated | Simulation / synthetic_demo |
| FHIR R4 ingest/export | partially_integrated | Not full HL7 validator; no live write-back |
| HL7 v2 / Mirth | **missing** | Documented gap |
| EHR / EMIS write-back | simulated_adapter | `liveEmis:false` |
| Schedule / lab / CGM connectors | operational (read) | Partner APIs read-only where live |
| HCP evaluation environment | partially_integrated | Proof + review + CI harness; not regulatory proof |
| Production RBAC matrix | partially_integrated | `productionRbacEnforced: false` |
| Enterprise transactional outbox / WDK | **missing** | Care Episode emits `outbox_enqueued` events for Phase 2+ |

Machine-readable map: `lib/agents/contracts/capabilities.ts`.

---

## 2. What was reused vs new

### Reused (do not duplicate)
- Agent register `lib/agents/register.ts` + directory `lib/agents.ts`
- Document-06 NEXUS contract + `runContractedNexus`
- CONDUCTOR / clinical-spine + diabetes agent-intel orchestration
- Context Engine, Guardian gateway, GraphRAG, evaluation engine, model registry
- Patient 360, Connected Diabetes, review cases, patient encounters, continuous care
- Auth scope + connected-patient access guards
- Dual-path Postgres / JSON repository pattern

### New in this phase
- `lib/agents/contracts/capabilities.ts` — 12-capability map onto existing agents
- `lib/agents/contracts/orchestration.ts` — typed request/response, tools, access boundaries, failure / observability / eval hooks, stack resolver
- `lib/care-episode/*` — canonical Care Episode model, validated transitions, file+Postgres persistence, audit + outbox-shaped events
- `db/migrations/052_care_episodes.sql` + `CARE_EPISODES_SQL` in `lib/db/schema-sql.ts`
- APIs: `GET/POST /api/patients/[id]/care-episodes`, `GET/POST .../care-episodes/[episodeId]`
- Tests: `tests/orchestration-contracts.test.ts`, `tests/care-episode.test.ts`
- This phase report (updates pack index)

---

## 3. DB + API

| Artifact | Purpose |
|----------|---------|
| `aksh.care_episodes` | Durable episode row (status, links, tasks, version, synthetic, ehr_write=false) |
| `aksh.care_episode_events` | Append-only audit; `outbox_enqueued` for future durable consumers |
| File fallback | `data/care-episodes*.json` when Postgres not configured |
| APIs | Create/list/get/transition under authenticated connected-patient access |

Care Episode **links** existing artefacts (`review_case`, `patient_encounter`, `agent_intel_run`, `diabetes_journey`, etc.) — it does not replace them.

---

## 4. Agent responsibilities (Phase 1 contracts)

| Concern | Contract surface |
|---------|------------------|
| Capability → agents | `PLATFORM_CAPABILITIES` |
| Allowed tools | `ORCHESTRATION_TOOLS` + `assertToolAllowed` |
| Hard safety | `safety.liveEmis/ehrWrite/autonomousPrescribe/hitlRequired` validated |
| Failure codes | AUTH_DENIED, CAPABILITY_MISMATCH, AGENT_NOT_ALLOWED, TOOL_NOT_ALLOWED, PROHIBITED_ACTION, GATEWAY_BLOCK, … |
| Observability | correlationId, timings, model/context versions, dataSource |
| Eval hook | `enqueueEval: true`, `autoRetrain: false`, `modelUpdated: false` |
| Stack ownership | `resolveOrchestrationStack` → clinical_spine / diabetes_agent_intel / access / intake / eval |

Planned agents (PRISM, ATLAS) remain never-run.

---

## 5. Journeys (Phase 1)

Canonical Care Episode path (validated transitions):

`draft → intake → scheduled → encounter_active → context_assembled → in_review → lab_pending → med_review → care_plan_draft → follow_up → outcome_recorded → closed`

Full patient/clinician UX journeys and cross-role E2E evidence remain **Phase 2+** roadmap items.

---

## 6. Tests

```bash
npm run test:phase1:foundation
# also wired into test:clinical-proof suite
```

Covers: capability map completeness, access boundaries, tool allow-list, request validation, forbidden live write, canonical transition path, idempotent create/transition, link attach, outbox event emission.

---

## 7. Limitations (honest)

- Orchestration contracts are **not yet** the sole runtime entry for CONDUCTOR / agent-intel (shared contract layer; full wiring is Phase 2).
- Care Episode Postgres path is best-effort alongside file store; apply migration 052 on local-dev Neon before relying on PG.
- No Vercel Workflow DevKit consumer yet — only `outbox_enqueued` event rows.
- No Vercel Sandbox — not required until HCP evaluation isolation needs it.
- Stakeholder UX, full FHIR live adapters, and HCP evaluation productisation are out of scope.
- Agents remain `in_validation` / simulation — no real-patient production enablement.

---

## 8. Recommended Phase 2

1. Wire CONDUCTOR + diabetes agent-intel to emit/consume `OrchestrationRequest`/`Response` and attach `careEpisodeId`.
2. Durable outbox consumer (prefer Workflow DevKit steps) for `care_episode.transition` notifications/tasks.
3. Stakeholder UX for episode timeline on GP/nurse/patient dashboards (persistent actions).
4. Role personas for lab / care coordinator / diabetes specialist where product requires them.
5. Structured HCP evaluation feedback loop bound to Care Episode + evaluation engine.
6. Governed FHIR adapter verification gates (still `liveEmis:false` until approved).

---

## Related docs

- Pack index: [00-MASTER-INDEX.md](./00-MASTER-INDEX.md)
- Prior audit (partially stale): [01-CURRENT-STATE-AUDIT-FROM-REPO.md](./01-CURRENT-STATE-AUDIT-FROM-REPO.md)
