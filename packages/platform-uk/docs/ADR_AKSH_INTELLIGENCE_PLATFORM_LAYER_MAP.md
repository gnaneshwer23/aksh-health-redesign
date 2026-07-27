# ADR: Aksh Intelligence Platform — Naming & Layer Map

**Status:** Accepted (naming/reframing only — no code or infra change)
**Date:** 27 July 2026
**Context doc:** Aksh Health 2.0 vision (Universal Intelligence Layer + disease modules, Diabetes first)
**Companion docs (next):** Diabetes Disease Intelligence Spec (B) · Tech Stack Modernization ADR (C)

---

## Context

Aksh Health 2.0 proposes reframing the platform as a set of modules under one **Aksh Intelligence Platform**, organized into nine layers (Core → Platform Agents → Disease Intelligence → Research → Disease Digital Twins → Population Intelligence → Patient Intelligence → Clinical Intelligence → Continuous Learning).

This is the third time this codebase has run a "vision doc vs. running code" reconciliation:

1. `docs/AKSH_PLATFORM_IMPLEMENTATION_PLAN.md` (parent repo `docs/`) — reconciled an earlier TechDoc (Supabase, LangGraph, Kafka, Weaviate, Mirth) against the UK proof.
2. `docs/BUILD_INSTRUCTIONS_GAP.md` — reconciled a "Layers 1–15 complete build instructions" doc against `main`, and is the source of the current 12-agent naming (`ORACLE→HORIZON`, `EQUITY→COMPASS`, `REFERRAL→PATHWAY`).
3. This ADR — reconciles the Aksh Health 2.0 nine-layer vision against the same codebase, one release later.

The pattern each time has been the same: **most of the "new" layer already exists under a different name or as lighter-weight scaffolding.** This ADR exists so the nine-layer vocabulary can be adopted for product/architecture communication **without triggering a rebuild of things that already work.**

## Decision

1. Adopt the Layer 1–9 vocabulary as a **naming and communication overlay** over the existing architecture. Use it in docs, decks, and future specs.
2. **Do not rename or restructure working code to fit the layer vocabulary.** Where a layer already has a working, tested implementation under a different name (e.g. "CONDUCTOR" for the Layer 1 Orchestrator), the code name stays authoritative; the layer name is a pointer to it, not a replacement.
3. Treat every future disease-specific effort (Diabetes first) as a **module that plugs into this platform** — reusing CONDUCTOR, SHIELD, HITL gates, and the continuous-learning loop — not as a parallel system with its own orchestrator, audit trail, or auth.
4. No infra is added by this ADR. No event bus, vector DB, analytics warehouse, or new backend service is introduced here. Those decisions are deferred to the Tech Stack Modernization ADR (C) and made only against a demonstrated need.

## Agent naming — already resolved, carried forward unchanged

The canonical agent directory in `lib/agents.ts` (`AGENT_DIRECTORY`, `CLINICAL_AGENT_META`) already performed the rename the Aksh Health 2.0 vision assumes. This ADR does not redo it — it confirms it as the source of truth for Layer 2.

| Legacy id | Current label | Role | Status |
| --- | --- | --- | --- |
| `ORACLE` | **HORIZON** | Predictive Risk Agent (CVD/T2D risk score) | Live (Phase 1) |
| `EQUITY` | **COMPASS** | Population Health Agent (IMD/ethnicity disparity) | Live (Phase 1) |
| `REFERRAL` | **PATHWAY** | Care Coordination Agent | Live (Phase 1) |
| — | **CANVAS** | Clinical Intake Agent (VOICE is a sub-capability feeding it, not a peer agent) | Live (Phase 1) |
| — | **SYNTHESIS** | Clinical Documentation Agent (SOAP draft) | Live (Phase 1) |
| — | **BRIDGE** | Interoperability Agent (FHIR staging / Medplum) | Live (Phase 1, dry-run) |
| — | **NEXUS** | Clinical Intelligence Agent (correlation, draft-only) | Live (Phase 1) |
| `GUARDIAN` | **GUARDIAN** (unchanged) | Medication Intelligence Agent (DDI/allergy) | Live (Phase 1) |
| `SHIELD` | **SHIELD** (unchanged) | Regulatory & Audit Agent | Live (Phase 1) |
| — | **CONDUCTOR** | Supervisor Agent (deterministic orchestrator) | Live (Phase 1) |
| — | **PRISM** | Imaging Intelligence Agent | **Not built** — Phase 2 roadmap, `live: false` |
| — | **ATLAS** | Clinical Research Agent | **Not built** — Phase 2 roadmap, `live: false` |

Internal ids, env vars (e.g. `ENABLE_LLM_ORACLE`), and API field names (e.g. `oracleScore`) keep the legacy names as aliases for backward compatibility (`AGENT_LABEL_ALIASES` in `lib/agents.ts`). Do not touch these for the layer-map exercise.

`Dr.Assist` remains an intake/coding **sub-capability** under SYNTHESIS, not a peer directory agent — do not promote it when writing the Diabetes spec.

## Layer map — Exists / Partial / Missing

### Layer 1 — Core

| Primitive | Status | Pointer |
| --- | --- | --- |
| Identity | Partial | NextAuth + Neon (`aksh.users`), role/onboarding-aware middleware. Proof-grade auth, not CIS2/production RBAC. |
| Consent | Partial | `lib/precision-health/consent.ts` — purpose codes, modality grants, revoke; `GET/POST /api/consent/grants`; SHIELD-audited. Phase 1 scaffolding on synthetic data only. |
| Security | Partial | `liveEmis:false` hard guards (types + API reject), tenant-scoped app-layer isolation. No formal pen-test beyond `docs/evidence-pack/08-security-pen-test.md` template. |
| Memory | Partial | `lib/repositories/learning-event-repository.ts` (Postgres + JSON fallback) + `lib/precision-health/timeline.ts` (patient timeline merge). No unified "memory" abstraction across agents — each store is purpose-built. |
| Knowledge Graph | Partial | `lib/neo4j/` (driver, queries, types) — live Aura when configured, honest mock-fallback banner (`components/dashboard/Neo4jMockModeBanner.tsx`) when offline. Patient/guardian/ICS-population queries only; not a general-purpose KG service. |
| Orchestrator | Partial | `lib/clinical-spine/orchestrate.ts` (CONDUCTOR) — deterministic pipeline: SYNTHESIS → GUARDIAN → HORIZON/NEXUS → safety-route → SHIELD. Tested, not LangGraph/Temporal by explicit prior decision (see `docs/BUILD_INSTRUCTIONS_GAP.md`). |
| Event Bus | **Missing** | No Kafka/pub-sub. All agent calls are synchronous in-process function calls inside one Next.js app. No evidence this is currently a bottleneck. |
| Digital Twin (as core primitive) | Partial | `lib/precision-health/twin-simulation.ts` — synthetic rules-based scenario ranking. Type-level honesty: `physiologicalTwin: false` is a literal field on every result. Not disease-specific. |
| Observability | Partial | SHIELD hash-chained audit (`aksh.shield_audit_events`), `docs/AGENT_EVAL_HARNESS.md`, `docs/HAZARD_LOG_TEMPLATE.md`, `docs/evidence-pack/`. No unified logging/tracing/metrics platform. |

### Layer 2 — Platform Agents (existing agents as services)

**Exists.** See rename map above. Canonical directory: `lib/agents.ts` (`AGENT_DIRECTORY`, `CLINICAL_AGENT_META`, `resolveClinicalAgentLabel`). Implementations under `lib/agents/llm-*.ts` (`llm-synthesis.ts`, `llm-guardian.ts`, `llm-oracle.ts` [HORIZON], `llm-equity.ts` [COMPASS], `llm-dr-assist.ts`, `llm-nexus.ts`) and `lib/clinical-spine/orchestrate.ts` (CONDUCTOR). All route through Vercel AI Gateway with deterministic fallbacks, draft-only, HITL-gated, SHIELD-audited.

### Layer 3 — Disease Intelligence Agents (Diabetes first)

**Missing.** No disease-specific decomposition exists anywhere in the codebase. HORIZON produces one composite CVD/T2D risk score (`lib/agents/llm-oracle.ts`); there is no Glucose, HbA1c, Insulin, GLP-1, Nutrition, Exercise, Behaviour, Complications, or Prevention sub-agent. This is the largest genuine gap and the subject of the Diabetes Disease Intelligence Spec (B).

### Layer 4 — Research Intelligence (Owkin-inspired)

**Partial — policy exists, pipeline does not.**

- `docs/RESEARCH_EVALUATION_BOUNDARY.md` + `lib/research-evaluation-plan.ts` — typed boundary for dataset/task/model/metric/interpretation separation. Offline, synthetic-only, explicitly not production ML.
- `lib/precision-health/federated-research.ts` — federated job **stub**: ethics-gated (`FEDERATED_RESEARCH_ETHICS_APPROVED` env), synthetic cohort aggregates only, `patientLevelExport: false`. No real federation, no external site participation.
- ATLAS (Clinical Research Agent) is named in the directory but **not built** (Phase 2).

### Layer 5 — Disease Digital Twins (Diabetes Twin first)

**Missing (disease-specific).** The only twin-shaped code is the generic `lib/precision-health/twin-simulation.ts` scenario ranker described under Layer 1 — it is disease-agnostic, rules-based, and explicitly disclaims physiological modeling. A Diabetes Twin (glucose trajectory, insulin sensitivity proxies) does not exist and depends on Layer 3 shipping first.

### Layer 6 — Population Intelligence

**Partial.** `lib/precision-health/risk-state.ts` (`buildPopulationRiskState`), COMPASS agent, and the ICS dashboard (`/api/neo4j/ics-population`) provide synthetic-cohort aggregates (risk distribution, IMD). Not disease-segmented; no analytics warehouse — current scale (100-patient synthetic cohort) runs fine on Postgres/Neo4j.

### Layer 7 — Patient Intelligence

**Partial, generic.** `lib/precision-health/`: `timeline.ts` (longitudinal merge), `health-plan.ts` (personalised plan draft, HITL-gated, `ehrWrite: false`), `coaching.ts` (nutrition/sleep/exercise/mental-health coaching drafts, explicitly "not clinical advice"). `lib/patient-companion/profile.ts` backs the patient dashboard. None of this is diabetes-specialized yet.

### Layer 8 — Clinical Intelligence workspace

**Partial — exists functionally, not named this way.** The GP review workflow (`/review`, `/cases/[id]`, `/review/command-centre`) already functions as a clinical intelligence workspace: case detail, evidence, benchmarks, roadmap. It has not been organized or marketed under a "Clinical Intelligence" layer name; no rebuild implied by adopting the name.

### Layer 9 — Continuous Learning flywheel

**Exists — the most mature layer relative to the vision.**

- `docs/CONTINUOUS_LEARNING.md` — prediction → clinician decision → outcome → append-only learning event. `POST/GET /api/learning/events`, eventual-outcome linking. No PUT/PATCH/DELETE exposed.
- `lib/clinical-spine/outcomes-loop.ts` — Phase E closed loop; `SPINE_OUTCOMES_HONESTY` constant hard-codes `autoRetrain: false`, `ehrWrite: false`, `liveEmis: false`, `physiologicalTwin: false`, `modelUpdated: false`, `hitlRequired: true` on every response.
- `docs/GOVERNED_MODEL_RELEASE_SOP.md` — G-ML-1 (engineering lead), G-ML-2 (CSO), G-ML-3 (release authority) gates required before any model/prompt version bump. Previous version stays live until all three are signed.
- `lib/outcome-capture.ts` (L10 synthetic outcome-capture schema) and `lib/human-gates.ts` (explicit persisted human-gate decisions) feed this loop.

**Governance verdict:** your hard constraint — "continuous learning must remain governed, outcomes → evaluation → improve, not silent auto-retrain" — is not aspirational here. It is the existing design, enforced in types and tested (`CP-LEARN-001` in `npm run test:clinical-proof`).

## Summary table

| Layer | Status | Primary pointer |
| --- | --- | --- |
| 1. Core — Identity | Partial | NextAuth + Neon |
| 1. Core — Consent | Partial | `lib/precision-health/consent.ts` |
| 1. Core — Security | Partial | `liveEmis:false` guards, evidence-pack |
| 1. Core — Memory | Partial | learning-event repo + `precision-health/timeline.ts` |
| 1. Core — KG | Partial | `lib/neo4j/` |
| 1. Core — Orchestrator | Partial | `lib/clinical-spine/orchestrate.ts` (CONDUCTOR) |
| 1. Core — Event Bus | **Missing** | none |
| 1. Core — Digital Twin | Partial | `lib/precision-health/twin-simulation.ts` |
| 1. Core — Observability | Partial | SHIELD, eval harness, hazard log |
| 2. Platform Agents | **Exists** | `lib/agents.ts`, `lib/agents/llm-*.ts` |
| 3. Disease Intelligence (Diabetes) | **Missing** | none |
| 4. Research Intelligence | Partial | `federated-research.ts`, `research-evaluation-plan.ts` |
| 5. Disease Digital Twins | **Missing** | none (generic twin only) |
| 6. Population Intelligence | Partial | `risk-state.ts`, COMPASS, ICS dashboard |
| 7. Patient Intelligence | Partial | `precision-health/health-plan.ts`, `coaching.ts` |
| 8. Clinical Intelligence workspace | Partial | `/review`, `/cases/[id]` |
| 9. Continuous Learning | **Exists** | `CONTINUOUS_LEARNING.md`, `GOVERNED_MODEL_RELEASE_SOP.md` |

## What is NOT changing

This ADR changes naming and documentation framing only. The following remain exactly as they are:

- **HITL is mandatory** for every clinical-facing draft — no exceptions introduced by this layer map.
- **`liveEmis: false`** stays hard everywhere (types, API rejection, sandbox). No live EHR write.
- **`autoRetrain: false`** and governed release gates (G-ML-1…3) stay exactly as specified in `docs/GOVERNED_MODEL_RELEASE_SOP.md`.
- **CONDUCTOR stays deterministic.** No LangGraph, no non-deterministic orchestration is introduced.
- **SHIELD stays the audit system of record.** No parallel audit trail for disease modules.
- **No fake certifications.** Nothing in this ADR implies DCB0129/DTAC/MHRA/CIS2 status — see `docs/BUILT_VS_REMAINING_AUDIT.md` Track A/B split, which is unaffected.
- **No new infrastructure.** Event bus, vector DB, analytics warehouse, and any other stack additions are explicitly out of scope here — see Consequences below.

## Consequences

1. Product/architecture communication can now use "Aksh Intelligence Platform" and Layer 1–9 language without implying a rebuild — this ADR is the reference for what that language actually points to in code.
2. The next document is the **Diabetes Disease Intelligence Spec (B)** — the only layer with no existing implementation (Layer 3), which also unblocks a real Layer 5 (Diabetes Twin) once shipped. It should define the 9 Diabetes sub-signals as data/feature modules feeding HORIZON and GUARDIAN, not as 9 independent new agents each requiring their own orchestration and audit infrastructure.
3. The **Tech Stack Modernization ADR (C)** follows separately and should be evaluated only against concrete bottlenecks the Diabetes module surfaces (e.g. real vector search need, real analytics scale) — not against the general nine-layer vision.
4. Disease modules (Diabetes first, others later) are **modules on this platform** — they reuse CONDUCTOR, SHIELD, the consent/audit/learning primitives in Layer 1, and the Layer 2 agent directory. They do not get their own orchestrator, their own audit trail, or their own auth system.
