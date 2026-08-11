# Aksh Architecture Gap Analysis — Codebase vs the Seven Permanent Domains

**Note (authoritative spec update):** `docs/AKSH_FINAL_ARCHITECTURE_SPEC.md` §§26–59 have been corrected to match the original specification verbatim. Authoritative full spec in place (sections 1–59 plus the final product philosophy) — the domain mapping, hard constraints, and loop terminology below remain valid and consistent with it.

**Baseline:** `docs/AKSH_FINAL_ARCHITECTURE_SPEC.md`
**Method:** Light/grep-heavy read of `lib/agents.ts`, `lib/clinical-spine/*`, `lib/disease-modules/diabetes/*`, `lib/precision-health/*`, `lib/repositories/*`, `lib/neo4j/*`, `lib/db/schema-sql.ts`, `db/migrations/*`, `lib/permission-matrix.ts`, `lib/types.ts`, plus existing docs (`ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md`, `ADR_TECH_STACK_MODERNIZATION.md`, `DISEASE_INTELLIGENCE_DIABETES_SPEC.md`, `PHASED_BUILD_PLAN.md` B0–B7, `BUILT_VS_REMAINING_AUDIT.md`, Volume I PRD headers).
**Scope note:** this is a mapping and gap exercise, not a code change. No application code was modified to produce this document.

---

## 0. Headline verdict

The codebase is unusually disciplined for a synthetic-proof build: HITL, `liveEmis:false`, `autoRetrain:false`, hash-chained audit (SHIELD), and governed-release gates are already enforced **in types and tests**, not just in docs (`lib/clinical-spine/outcomes-loop.ts`, `lib/clinical-proof/hitl-invariants.ts`, `docs/GOVERNED_MODEL_RELEASE_SOP.md`). The gap against the frozen spec is almost entirely **structural/organisational**, not a safety gap:

- There is **no versioned, longitudinal Patient State aggregate** — the closest thing (`lib/precision-health/timeline.ts`) is a per-request merge, and the primary record (`ReviewCase` in `lib/types.ts`) is **case/encounter-centric**, not patient-centric.
- **Decision logic is embedded inside orchestration** (`lib/clinical-spine/orchestrate.ts` + `safety-route.ts` + `queue-decision.ts`) rather than named and separated as its own domain.
- The **"12-agent" vocabulary is used as if it were the architecture** (`lib/agents.ts`, Volume I PRD, Layer Map ADR), when under the frozen spec agents are Intelligence/Intervention-domain orchestration wrappers, not domains themselves.
- **Data & Interoperability is real but scattered** across `lib/emis-*.ts`, `lib/medplum-client.ts`, `lib/neo4j/*`, `lib/precision-health/connectors.ts` with no single boundary contract beyond the narrow `lib/integration-boundary-contract.ts`.
- **Learning is the most mature domain** relative to the frozen spec — it already matches the append-only, governed-gate, honesty-signal design almost exactly.

---

## 1. Domain-by-domain mapping

### 1.1 Patient State

**Current implementation.**
- No `patient_state` (or equivalent) table exists in `lib/db/schema-sql.ts` / `db/migrations/*`. Patient identity lives in `lib/mock-data/patients.ts` (static/synthetic list) and as a free-text `patientLabel` (not even a stable `patientId`) on `ReviewCase` (`lib/types.ts:472`).
- `lib/precision-health/timeline.ts` builds a longitudinal *view* by merging sources at request time — it is a derived read, not a persisted, versioned record.
- Diabetes signals (`lib/disease-modules/diabetes/*`) read from `fixtures.ts` synthetic bundles keyed by `patientId`, not from any shared patient record.
- `ReviewCase` (the actual persisted primary object, `lib/repositories/review-case-repository.ts`) is **encounter/case-scoped**: it carries one consultation's draft, audit trail, and frozen artifact — there is no aggregate that outlives a single case and accumulates across encounters.

**Domain mapping.** Domain 1 (Patient State) is the weakest-covered domain in the codebase.

**Duplicated concepts.** "Patient identity" exists in at least three shapes with no reconciliation: `mock-data/patients.ts` (id + clinicalProfiles), `ReviewCase.patientLabel` (display string), and diabetes fixture keys (`patientId`).

**Obsolete concepts (relative to frozen architecture).** None obsolete here — this is a missing-component gap, not a legacy-naming gap.

**Missing components.** A versioned Patient State aggregate: append-only fact store with source/confidence/consent provenance per fact, a current-state projection, and a stable cross-domain `patientId` that `ReviewCase`, diabetes fixtures, timeline, risk-state, and learning events all key off consistently.

**Naming inconsistencies.** `patientLabel` is used where a stable `patientId` should be authoritative; some call sites already carry `patientId` (diabetes context, learning events) but it's not guaranteed to be the *same* id as `ReviewCase`'s implicit identity.

**Data-model problems.** This is the single biggest data-model gap called out in the frozen spec: "lack of a versioned Patient State." Everything else in the codebase (risk scores, coaching drafts, learning events) is correctly *event-like* and append-only at the row level, but there is no aggregate that composes those events into "the current, versioned truth about patient X."

**Safety/provenance gaps.** Contributing factors and safety flags are plain strings (`horizonContributingFactors: string[]`, `guardianSafetyFlags: string[]` in `lib/disease-modules/diabetes/index.ts`) rather than structured, source-tagged provenance records — acceptable for a synthetic proof, but a real Patient State would need typed provenance, not string concatenation.

**Longitudinal gaps.** No mechanism persists "this is what we knew about the patient at version N" — `timeline.ts` recomputes from scratch every call, so there is no way to answer "what did the system believe last Tuesday."

---

### 1.2 Intelligence

**Current implementation.**
- `lib/agents.ts` (`AGENT_DIRECTORY`, `CLINICAL_AGENT_META`) is the canonical directory of 12 "agents." Implementations live in `lib/agents/llm-*.ts` (LLM/AI-Gateway backed: `llm-oracle.ts`/HORIZON, `llm-guardian.ts`, `llm-synthesis.ts`, `llm-nexus.ts`, `llm-equity.ts`/COMPASS, `llm-dr-assist.ts`) and in `lib/precision-health/*` + `lib/disease-modules/diabetes/*` (deterministic: `risk-state.ts`, `twin-simulation.ts`, `population-diabetes.ts`, all 9 diabetes signal builders in `lib/disease-modules/diabetes/{glucose,hba1c,insulin,glp1,nutrition,exercise,behaviour,complications,prevention}.ts`).
- The diabetes composite (`buildDiabetesRiskContribution` in `lib/disease-modules/diabetes/index.ts`) is explicitly documented as "not itself an agent call... every signal builder is a deterministic, synchronous, rule-based function" — this is already a **correct instance of the frozen spec's Intelligence split** (deterministic service vs LLM judgment), just not labelled that way.

**Domain mapping.** Domain 2 (Intelligence). This is the largest, most actively developed domain in the codebase.

**Duplicated concepts.** Risk-scoring exists in at least two forms that are not unified: HORIZON's LLM-drafted composite CVD/T2D score (`llm-oracle.ts`) and the deterministic `risk-state.ts` population risk aggregate — both called "risk," serving different purposes, with no shared vocabulary distinguishing "LLM-interpreted risk draft" from "deterministic risk statistic."

**Obsolete concepts (relative to frozen architecture).** Only the *framing* of the flat 12-agent list as if it were, by itself, the entire Intelligence architecture (as Volume I PRD and the Layer Map ADR effectively do) is obsolete under the frozen spec — not the agents themselves. Intelligence should be understood as {deterministic services/tools} + {LLM judgment components} + {agents that coordinate/reason over both}, with all 12 existing names correctly surviving as real, kept agents mapped onto that structure — see §2 below for the full Keep-as-agent / convert-to-tool mapping (net effect: zero deletions; only the diabetes signal builders, already tools, are reaffirmed as tools).

**Missing components.** No explicit, code-level tag distinguishing "this agent is a deterministic tool" from "this agent makes an LLM call" — a developer has to read the implementation file to find out. `CLINICAL_AGENT_META` / `AGENT_DIRECTORY` has no `kind: "deterministic" | "llm"` field.

**Naming inconsistencies.** ORACLE→HORIZON, EQUITY→COMPASS, REFERRAL→PATHWAY renames are tracked via `AGENT_LABEL_ALIASES` in `lib/agents.ts`, but `lib/types.ts:2` (`ClinicalAgentId`) still only has the **legacy** ids (`ORACLE`, `REFERRAL`, `EQUITY`) — the type-level source of truth and the display-label source of truth have already diverged once; adding a Diabetes-vocabulary or a Decision-vocabulary on top without a single naming ADR will make this worse.

**AI that should become deterministic services/tools.** `lib/agents/llm-equity.ts` (COMPASS/population health) and parts of `llm-nexus.ts` (draft-only correlation) are plausible candidates to review — population statistics and correlation-flagging are typically rule/statistics-based, not inherently requiring free-text generation; this is a P2-level review item, not a P0 rewrite (see migration plan).

---

### 1.3 Decision

**Current implementation.**
- No file or module is named "Decision." Decision-domain logic is split between `lib/clinical-spine/safety-route.ts` (maps orchestration output → urgent/routine safety route) and `lib/clinical-spine/queue-decision.ts` (review-queue prioritisation), both called from inside `lib/clinical-spine/orchestrate.ts` (CONDUCTOR).

**Domain mapping.** Domain 3 (Decision) exists functionally but is **not separated** from Domain 2 (Intelligence) at the module/file-organisation level — `orchestrate.ts` (an Intelligence/orchestration file) directly calls the safety-route decision step in the same function, then persists the audit event itself.

**Duplicated concepts.** "Priority"/"routing" logic appears in `safety-route.ts` (safety route: urgent vs routine) and separately in `queue-decision.ts` (queue priority) — two decision outputs computed by two modules, both consumed by the same orchestration call, without a single `Decision` result type unifying them.

**Obsolete concepts.** None — again a missing-separation gap, not a legacy-naming gap.

**Missing components.** A named `Decision` module/type that takes Intelligence outputs (HORIZON score, GUARDIAN flags, diabetes contribution) + policy and returns one explainable disposition (route, priority, escalation) — today this is implicit in CONDUCTOR's call order (`SYNTHESIS → GUARDIAN → HORIZON/NEXUS → safety-route → SHIELD`, per `ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md` L54-66) rather than a first-class, independently testable domain.

**Safety gaps.** None found — HITL is still enforced downstream regardless of how Decision is organised internally. This is an organisational gap, not a patient-safety gap.

---

### 1.4 Intervention

**Current implementation.**
- `lib/precision-health/health-plan.ts` (personalised plan draft, `ehrWrite:false`), `coaching.ts` (nutrition/sleep/exercise/mental-health drafts), `lib/disease-modules/diabetes/{nutrition,exercise,behaviour}.ts` (diabetes coaching drafts), PATHWAY referral packages (`ReferralPackage`/`ServiceRequestResource` in `lib/types.ts`), and `lib/clinical-proof/ehr-writeback-sim.ts` / `lib/emis-staging.ts` (simulated write-back, never live).

**Domain mapping.** Domain 4 (Intervention). Functionally present and correctly HITL-gated everywhere it was checked (`hitlRequired: true` literals throughout `clinical-spine/*` and `disease-modules/diabetes/*`).

**Duplicated concepts.** "Coaching draft" is built independently in `precision-health/coaching.ts` (generic) and `disease-modules/diabetes/{nutrition,exercise,behaviour}.ts` (diabetes-specific) with separate types (`DiabetesCoachingDraft` vs whatever `coaching.ts` returns) rather than one Intervention-domain draft shape both extend.

**Obsolete concepts.** None found.

**Missing components.** No single `Intervention` result type/module that every domain-4 capability (health plan, coaching, referral, write-back) implements — each is a standalone file with its own shape, making it hard to answer "what interventions are pending for this patient" without querying several unrelated modules.

**Hard-constraint check (insulin/GLP-1, no auto-dose).** `lib/disease-modules/diabetes/insulin.ts` and `glp1.ts` were read as signal builders (hypo-risk flags, side-effect flags) — they surface flags for GUARDIAN, they do not compute or apply a dose. **No violation found.** This constraint is intact today and must remain intact through any migration.

---

### 1.5 Learning

**Current implementation.**
- `lib/clinical-spine/outcomes-loop.ts` (Phase E) + `lib/repositories/learning-event-repository.ts` + `lib/repositories/governed-evaluation-repository.ts` + `docs/GOVERNED_MODEL_RELEASE_SOP.md` (G-ML-1/2/3 gates) + `lib/clinical-proof/learning-loop.ts`.

**Domain mapping.** Domain 5 (Learning). **This is the most mature domain relative to the frozen spec** — it already implements append-only outcome capture (`captureSpineOutcome`), the workload-vs-honesty-signal distinction (`dispositionCompleteRatio` vs `realOutcomeCaptureRatio`), and hard-blocked governed evaluation (`assertGovernedEvaluationAllowed` refuses `propose_model_update` unless G-ML-1/2/3 are all signed) — a near-exact match for Part II §Domain 5 and Part IV item 3 of the frozen spec.

**Duplicated concepts.** Two "loop" abstractions exist over the same underlying `learning_events` table: `lib/clinical-proof/learning-loop.ts` (types/utilities) and `lib/clinical-spine/outcomes-loop.ts` (Phase E business logic). Not a functional problem today, but worth a single naming pass so "the Learning domain" has one canonical entry point.

**Obsolete concepts.** None.

**Missing components.** No diabetes-specific outcome linkage yet — `buildDiabetesRiskContribution`'s `coachingDrafts` output is not currently wired to `recordLearningEvent`/`captureSpineOutcome` with diabetes-labelled `agentLabel`s, so a diabetes coaching draft that's Accepted doesn't yet have an obvious path to "was glycaemic control better 3 months later" (see P1 in the migration plan — this is exactly the CONNECT→…→LEARN gap for the Diabetes MVP).

---

### 1.6 Data and Interoperability

**Current implementation.**
- FHIR: `lib/clinical-proof/{fhir-r4-fixtures,fhir-r4-validator,fhir-shape,staged-fhir}.ts`, `db/migrations/011_fhir_staging_bundles.sql`, `lib/repositories/bridge-staging-repository.ts` (BRIDGE agent).
- EMIS: `lib/emis-staging.ts`, `lib/emis-partner-sandbox.ts`, `lib/precision-health/emis-partner-checklist.ts` — all hard-guarded `liveEmis:false`.
- Medplum: `lib/medplum-client.ts` (dry-run/OAuth, no real secret configured per `BUILT_VS_REMAINING_AUDIT.md`).
- Neo4j: `lib/neo4j/{queries,types,mock-fallback}.ts` — live Aura when configured, honest mock-fallback banner otherwise.
- Connectors: `lib/precision-health/connectors.ts` (Phase 2/3 modality connector registry, fixtures only).
- A narrow cross-cutting contract exists at `lib/integration-boundary-contract.ts` (42 lines) but does not cover Neo4j or the modality connectors.

**Domain mapping.** Domain 6 (Data and Interoperability). Functionally broad but **organisationally scattered** — four independent subsystems (FHIR/BRIDGE, EMIS, Medplum, Neo4j) plus a connector registry, each with its own honesty flags and its own staging pattern, rather than one domain boundary with per-integration adapters.

**Duplicated concepts.** "Staging before live" is implemented three separate times (FHIR staging bundles table, EMIS staging module, Medplum dry-run client) with three different shapes, rather than once as a Data & Interoperability domain primitive that each integration adapts.

**Obsolete concepts.** None — all integrations are correctly marked non-live; nothing here claims capability it doesn't have.

**Missing components.** A single `IntegrationAdapter`-style contract (source/target system, resource type, consent scope required, live/staged flag, provenance stamp) that FHIR/EMIS/Medplum/Neo4j/connectors all implement, so "is anything writing live anywhere" is answerable by one query instead of four.

**Provenance gaps.** Connector fixtures (`lib/precision-health/connectors.ts`) generate synthetic samples but the resulting Intelligence inputs don't consistently carry a `sourceConnectorId` back onto the (currently non-existent) Patient State record — this compounds the Domain 1 gap.

---

### 1.7 Safety and Governance

**Current implementation.**
- SHIELD: `lib/repositories/shield-audit-repository.ts`, `db/migrations/007_shield_audit_events.sql` (hash-chained), invoked from every domain via `persistShieldAuditEvent`.
- Permissions: `lib/permission-matrix.ts` (`AppRole`: `clinical_reviewer | operations_lead | patient | researcher | restricted`, deny-by-default for unrecognised roles).
- HITL invariants: `lib/clinical-proof/hitl-invariants.ts`, `e2e/clinical-proof-hitl.spec.ts`, `tests/clinical-proof-hitl*.test.ts`.
- Hazard/safety case: `docs/HAZARD_LOG_TEMPLATE.md`, `docs/SAFETY_CASE_REHEARSAL.md`, `docs/GOVERNED_MODEL_RELEASE_SOP.md`.

**Domain mapping.** Domain 7 (Safety and Governance). Strong coverage; this domain is explicitly designed with "veto power" in mind already (e.g. `assertGovernedEvaluationAllowed` blocking Learning-domain actions).

**Gaps.**
- `lib/permission-matrix.ts` self-documents `productionRbacEnforced: false` — the matrix "documents intended boundaries rather than production RBAC enforcement" (line ~220). This is honestly labelled, not hidden, but it is a real gap between the frozen spec's Domain 7 guarantee ("every role's access... enumerated") and actual enforcement.
- No single "Safety & Governance" module groups SHIELD + permission-matrix + hazard log + governed-release gates under one importable surface today — they are correctly *linked* by convention (every domain calls `persistShieldAuditEvent`) but not by a shared domain package.

---

## 2. Agent mapping: codebase agents + product-owner example set → architecture layers (Keep vs Convert)

**Correction (product owner, authoritative):** an earlier reading of this gap analysis risked being interpreted as "the 12-agent directory should shrink toward pure services because the platform is Patient-State centric." That is not the correction, and it is not what §13/§13.1 of `docs/AKSH_FINAL_ARCHITECTURE_SPEC.md` says. The correct model: **specialised agents operate inside the Intelligence, Decision, Intervention and Learning layers around a shared Patient State.** Agents coordinate work (multi-source investigation/coordination — e.g. "why is this patient's diabetes control worsening?"); services/tools perform deterministic or specialised calculations (HbA1c trend, CGM time-in-range, eGFR, FHIR mapping, SNOMED lookup, drug-interaction check). The two tables below apply that test to (a) the actual 12-agent codebase directory and (b) the product owner's illustrative example-agent set, and reconcile both onto the frozen architecture stack:

```
PATIENT STATE → CARE ORCHESTRATOR → SPECIALISED AGENTS → TOOLS/MODELS/CLINICAL SERVICES → DECISION → INTERVENTION → OUTCOME
```

### 2.1 Current codebase agent directory (`lib/agents.ts`) — Keep-as-agent vs Convert-to-tool

| Codebase agent | Frozen-spec layer(s) | Keep as agent, or convert? | Evidence / rationale |
| --- | --- | --- | --- |
| CONDUCTOR | Care Orchestrator (spans Intelligence + Decision) | **Keep — Absolutely** (= Supervisor/Orchestrator role) | `lib/clinical-spine/orchestrate.ts` coordinates SYNTHESIS→GUARDIAN→HORIZON/NEXUS then Decision (`safety-route`) — this is exactly the top-level coordination role the correction calls "Care Orchestrator" |
| GUARDIAN | Safety & Governance (cross-cutting) + Intelligence judgment | **Keep — Absolutely** (= Observer/Validator role) | `lib/agents/llm-guardian.ts` performs independent safety-flag review over other agents' outputs; deterministic DDI lookups feeding it are already correctly separated as tools |
| HORIZON (ORACLE) | Intelligence — Predictive / Clinical Reasoning | **Keep as agent** | `lib/agents/llm-oracle.ts` — multi-source risk synthesis (labs, history, lifestyle) requiring judgment about what matters, not a single deterministic calculation |
| SYNTHESIS | Intelligence — State Understanding / Clinical Reasoning | **Keep as agent** | `lib/agents/llm-synthesis.ts` — synthesises multiple Patient State facts into a coherent picture; genuinely agentic (multi-source investigation) |
| NEXUS | Intelligence — Clinical Reasoning (draft correlation) | **Keep as agent for now; narrow candidate to review** | `lib/agents/llm-nexus.ts` — draft-only correlation flagging; keep as an agent while it performs multi-signal correlation judgment, but re-audit per migration plan P2-1 once its inputs are enumerable as fixed statistics. **P2-1 addendum (D1, `docs/PHASED_BUILD_PLAN_D.md`, 11 August 2026): reviewed, recommendation = keep as agent.** NEXUS's task is not a fixed, enumerable statistic — its correlation set varies per patient and per available data (conditions × medications × risk factors, LLM-selected from an open-ended prompt), which is genuine multi-source investigative judgment per the agent-vs-tool test in spec §13.1, not a single deterministic calculation. Its existing rule-based `deterministicCorrelations` fallback (used when the AI Gateway is unavailable) is a resilience feature mirroring every other LLM agent's fail-open pattern, not evidence the primary task is a fixed statistic — re-audit only if NEXUS's real scope later narrows to a literal fixed-threshold pairing check. `keepStatus: "keep"` (set in C3) is reaffirmed unchanged. |
| COMPASS (EQUITY) | Decision / Safety / Care coordination | **Keep as agent** | Equity & Access is explicitly "Yes" in the product owner's keep table — it coordinates disparity signals *and* surfaces care-coordination implications, which is judgment, not a single lookup; the underlying population statistics it draws on (`risk-state.ts`, `population-diabetes.ts`) are correctly kept as deterministic tools feeding it |
| PATHWAY (REFERRAL) | Intervention / Workflow | **Keep as agent** | Coordinates referral package construction across specialty, urgency, and patient context — a Scheduling/workflow-coordination role, not a single deterministic call |
| BRIDGE | Data & Interoperability | **Keep as agent** (coordination role) | `lib/repositories/bridge-staging-repository.ts` — coordinates staging across FHIR resource types and validation steps; the FHIR mapping/validation calculations themselves (`fhir-r4-validator.ts`, `fhir-shape.ts`) are correctly deterministic tools it invokes |
| SHIELD | Safety & Governance | **Keep as agent** (governance coordination) | Hash-chained audit coordination across every domain call-site — a cross-cutting coordination responsibility, not a single calculation |
| CANVAS | Intelligence — Data capture / Ambient Documentation | **Keep as agent** | Consultation-capture/coding sub-capability; corresponds to the product owner's "Ambient Documentation" role — genuinely multi-step (transcription context → structured coding), not a lookup |
| VOICE | Experience / Data capture | **Keep as agent** | Voice-interaction coordination; corresponds to Intake-adjacent capture role |
| DrASSIST (Dr.Assist) | Intelligence — Clinical Reasoning support | **Keep as agent** | Clinician-facing reasoning assistant; multi-source by design |
| Diabetes 9 signal builders (`glucose`, `hba1c`, `insulin`, `glp1`, `nutrition`, `exercise`, `behaviour`, `complications`, `prevention`) | Intelligence — deterministic services/tools | **Convert-to-tool status confirmed (already correct)** | `lib/disease-modules/diabetes/*` — each is documented as "a deterministic, synchronous, rule-based function," fed to HORIZON/GUARDIAN/Decision. This is the model for every other disease module: signal builders are tools, not agents |
| PRISM, ATLAS | Intelligence / Research — future (Phase 2) | **Keep as agent (roadmap, not built)** | `AGENT_DIRECTORY` `live: false` — no action needed now; when built, evaluate with the same agent-vs-tool test |

**Net effect on the 12-agent directory: zero deletions.** All 12 named agents keep their status as agents. The only structural change this gap analysis calls for is the additive `kind` classification field (P0-3 in the migration plan) and treating the diabetes signal builders (already correctly deterministic) as the template for future disease-module tools — not shrinking the agent roster.

### 2.2 Product owner's example agent set → architecture layers

| Example agent | Best place | Keep as agent? |
| --- | --- | --- |
| Intake | Patient State / Data capture | Yes |
| Triage | Intelligence + Decision | Yes |
| Scheduling | Intervention / Workflow | Yes |
| Follow-up | Intervention + Learning | Yes |
| Ambient Documentation | Experience / Data capture | Yes |
| Population Health | Intelligence / Analytics | Yes, later |
| Predictive | Intelligence | Yes |
| Digital Twin | Advanced Intelligence / Simulation | Yes, later |
| Equity & Access | Decision / Safety / Care coordination | Yes |
| Clinical Reasoning | Intelligence | Yes |
| Evidence | Intelligence | Yes |
| Care Planning | Decision / Intervention | Yes |
| Patient Engagement | Intervention / Learning | Yes |
| Supervisor / Orchestrator | Care Orchestrator | Absolutely |
| Observer / Validator | Safety / Governance | Absolutely |

Cross-referencing 2.1 and 2.2: CONDUCTOR already fills the Supervisor/Orchestrator role; GUARDIAN already fills the Observer/Validator role; HORIZON/SYNTHESIS/DrASSIST collectively fill Predictive/Clinical Reasoning; CANVAS/VOICE fill Ambient Documentation/Intake; COMPASS fills Equity & Access; PATHWAY fills Scheduling/Care Planning-adjacent workflow. The product owner's example set and the actual 12-agent codebase directory are **the same architecture described at two different levels of granularity**, not two competing rosters — no agent needs to be invented or deleted to reconcile them.

---

## 3. Naming reconciliation: Volume I / 12-agent vocabulary vs frozen "logical agents"

| Legacy/Volume I concept | Frozen-spec classification | Evidence |
| --- | --- | --- |
| CONDUCTOR | Orchestration wrapper (spans Intelligence + Decision) | `lib/clinical-spine/orchestrate.ts` calls SYNTHESIS→GUARDIAN→HORIZON/NEXUS then `safety-route` (Decision) in one function |
| HORIZON (ORACLE) | LLM-backed Intelligence judgment component | `lib/agents/llm-oracle.ts` |
| GUARDIAN | LLM-backed Intelligence judgment component (+ deterministic DDI lookups feeding it) | `lib/agents/llm-guardian.ts` |
| SYNTHESIS | LLM-backed Intelligence judgment component | `lib/agents/llm-synthesis.ts` |
| NEXUS | LLM-backed Intelligence judgment component (draft-only) | `lib/agents/llm-nexus.ts` |
| COMPASS (EQUITY) | Deterministic Intelligence service (candidate) | `risk-state.ts`/population aggregates feed it; `llm-equity.ts` wraps an LLM call today — review in P2 |
| PATHWAY (REFERRAL) | Intervention-domain orchestration wrapper | `ServiceRequestResource` draft generation |
| BRIDGE | Data & Interoperability adapter, labelled as an agent | `lib/repositories/bridge-staging-repository.ts` |
| SHIELD | Safety & Governance function, labelled as an agent | `lib/repositories/shield-audit-repository.ts` |
| CANVAS, VOICE, Dr.Assist | Intelligence-domain intake/coding sub-capabilities | `lib/agents.ts` `CLINICAL_AGENT_META` explicitly documents these as sub-capabilities, not peer agents — already aligned with frozen spec's "agents aren't the architecture" |
| PRISM, ATLAS | Not built (Phase 2) — future Intelligence/Research components | `AGENT_DIRECTORY` `live: false` |
| Diabetes 9 signal builders | Deterministic Intelligence services (correctly implemented) | `lib/disease-modules/diabetes/*` — best existing example of the frozen spec's Intelligence split |

**Conclusion:** the 12-agent list is not wrong, it is **incompletely classified**. Every entry maps cleanly onto {Intelligence: LLM} / {Intelligence: deterministic} / {Intervention wrapper} / {Data & Interop} / {Safety & Governance} — none of it needs to be deleted or renamed again; it needs one added classification field (§2.1) and a Decision-domain module extracted from CONDUCTOR. **Note re COMPASS/NEXUS "candidate for deterministic service" language above:** per §2.1, this refers only to the *population-statistics inputs* COMPASS draws on (already correctly deterministic tools) — COMPASS itself remains a kept agent per the product owner's correction, because it also performs the coordination/judgment step of surfacing equity implications into Decision, not just a lookup.

---

## 4. Summary gap table

| Domain | Coverage today | Primary gap | Severity |
| --- | --- | --- | --- |
| 1. Patient State | Weak (case-centric, no versioning) | No persisted, versioned, patient-keyed aggregate | **High — P0** |
| 2. Intelligence | Strong, unclassified | No deterministic-vs-LLM tag on agent directory | Medium — P0/P2 |
| 3. Decision | Functional but unseparated | No named Decision module/type distinct from orchestration | **High — P0** |
| 4. Intervention | Strong, fragmented shapes | No unified Intervention result type across health-plan/coaching/referral/write-back | Medium — P2 |
| 5. Learning | Strongest domain | Diabetes outcomes not yet wired to learning events | Medium — P1 |
| 6. Data & Interoperability | Broad, scattered | No single integration-adapter contract across FHIR/EMIS/Medplum/Neo4j/connectors | Medium — P0/P2 |
| 7. Safety & Governance | Strong | `productionRbacEnforced:false` (honestly labelled); no unifying package | Low (tracked, not hidden) — P2/P3 |

See `docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md` for the prioritised, reviewable remediation plan (P0–P3). **No code changes have been made as part of this analysis.**
