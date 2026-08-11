# Aksh Architecture Migration Plan (P0–P3)

**Baseline:** `docs/AKSH_FINAL_ARCHITECTURE_SPEC.md`
**Input:** `docs/AKSH_ARCHITECTURE_GAP_ANALYSIS.md`
**Principle:** progressive, reviewed refactor. This is a **plan**, not an instruction to build. Nothing in this document authorises any code change — every item below requires its own review and its own explicit go-ahead. **Do not use this plan to ask an agent to "implement all of P0" (or the whole plan) in one pass.** Each item is scoped to be independently reviewable and independently revertible.

**Correction (product owner, authoritative):** Patient-State centricity is not a mandate to shrink the 12-agent directory. The correct model is specialised agents operating inside the Intelligence, Decision, Intervention and Learning layers around shared Patient State — coordinating multi-source investigation (agents) versus performing deterministic calculations (services/tools). See `docs/AKSH_FINAL_ARCHITECTURE_SPEC.md` §13/§13.1 and `docs/AKSH_ARCHITECTURE_GAP_ANALYSIS.md` §2 for the full Keep-as-agent mapping this plan builds on. **P0-3 below is corrected accordingly: it classifies and maps agents to layers, it does not reduce the agent roster.**

**Recommended next step:** review the **P0 items only**. Do not proceed to P1–P3 until P0's approach is agreed.

---

## How to read each item

Every change below lists: current implementation → problem → target implementation → files affected → DB changes → API changes → frontend changes → AI/model changes → clinical safety implications → migration risk → testing requirements → acceptance criteria.

---

## P0 — Architectural corrections required before further development

These correct structural gaps against the frozen spec. None of them requires deleting or rewriting working functionality — each is additive (new module/table/type) plus a re-pointing of existing call sites.

### P0-1. Introduce a versioned Patient State aggregate

- **Current implementation.** No `patient_state` table. Identity is split across `lib/mock-data/patients.ts` (id + clinicalProfiles), `ReviewCase.patientLabel` (free text, `lib/types.ts:472`), and diabetes fixture keys. `lib/precision-health/timeline.ts` recomputes a longitudinal view per request; nothing is persisted or versioned.
- **Problem.** Domain 1 (Patient State) — the frozen spec's centre of the system — does not exist as a first-class, versioned record. Every other domain (Intelligence, Decision, Intervention, Learning) currently reads/writes around this gap rather than through it.
- **Target implementation.** A new `aksh.patient_state_facts` (append-only, one row per fact-version: patient_id, fact_type, value, source, confidence, consent_scope_id, effective_at, recorded_at, superseded_by) plus a `patient_state_current` materialised/derived view per patient. `ReviewCase`, diabetes fixtures, timeline, and risk-state all resolve `patientId` against this new table rather than their own local notion of identity.
- **Files affected.** New: `lib/patient-state/*` (types, repository, projection). Touched (read-only re-pointing, not rewritten): `lib/precision-health/timeline.ts`, `lib/mock-data/patients.ts` (becomes seed data source, not the runtime source of truth), `lib/disease-modules/diabetes/fixtures.ts` (keys align to the new `patientId`), `lib/types.ts` (`ReviewCase` gains a required `patientId: string`, additive, `patientLabel` stays for display).
- **DB changes.** New migration `db/migrations/013_patient_state.sql` (new schema/tables only; no alteration of existing tables beyond an additive, nullable `patient_id` column on `aksh.review_cases`/equivalent if not already present).
- **API changes.** New read-only endpoint, e.g. `GET /api/patients/[id]/state` (versioned view). No existing endpoint response shape changes.
- **Frontend changes.** None required for P0; a future P1/P2 item can surface a "Patient State" timeline view once the backend exists.
- **AI/model changes.** None — this is a data-layer change only.
- **Clinical safety implications.** Positive: enables real provenance tracking (source/confidence/consent per fact) which today is informally represented as strings. No change to what is shown to clinicians until a consuming feature is built.
- **Migration risk.** Low if additive-only and read paths are migrated one at a time behind the existing data. Risk increases if `ReviewCase.patientId` is made a hard foreign key before all existing synthetic data is backfilled — backfill first, enforce later.
- **Testing requirements.** New repository unit tests (append-only invariant, version supersession); a backfill script dry-run against the existing synthetic cohort (`data/seed/demo-cohort-*`) verifying every existing case resolves to exactly one patient.
- **Acceptance criteria.** Every existing synthetic patient has exactly one `patient_state` identity; `ReviewCase.patientId` resolves for 100% of the demo cohort; no existing test in `tests/*` regresses.

### P0-2. Extract a named Decision domain from CONDUCTOR

- **Current implementation.** `lib/clinical-spine/orchestrate.ts` (CONDUCTOR) calls Intelligence agents, then calls `safety-route.ts` and separately `queue-decision.ts`, then persists the SHIELD audit event — all inside one function, with no single `Decision` result type unifying route + priority.
- **Problem.** Domain 3 (Decision) is not separated from Domain 2 (Intelligence) at the module boundary, as the frozen spec requires. This makes Decision logic harder to test in isolation and harder to reuse for future disease modules without copy-pasting orchestration.
- **Target implementation.** A new `lib/decision/index.ts` exporting `resolveDecision(intelligenceOutputs, patientState, policy): Decision` where `Decision = { route, priority, escalation, explanation, contributingIntelligenceRefs }`. `orchestrate.ts` calls this one function instead of calling `safety-route.ts` and `queue-decision.ts` separately; both existing files become internal implementation details of `lib/decision/`, re-exported unchanged in behaviour.
- **Files affected.** New: `lib/decision/index.ts`. Moved (not rewritten, re-exported): `lib/clinical-spine/safety-route.ts`, `lib/clinical-spine/queue-decision.ts` logic becomes internal to `lib/decision/`. Touched: `lib/clinical-spine/orchestrate.ts` (call-site swap only).
- **DB changes.** None.
- **API changes.** None — `runClinicalSpineOrchestrate`'s public return shape is unchanged; `safetyRoute`/`safetyRouteLabel` fields stay byte-identical.
- **Frontend changes.** None.
- **AI/model changes.** None — Decision remains deterministic, as it is today.
- **Clinical safety implications.** None negative; positive: an isolated, independently unit-testable Decision module is easier to safety-review than logic embedded in orchestration.
- **Migration risk.** Low — this is a pure extraction/re-export refactor with no behaviour change, verified by snapshotting existing orchestration outputs before/after.
- **Testing requirements.** Golden-output regression test: run `runClinicalSpineOrchestrate` for the existing golden scenarios (`GOLDEN_SCENARIO_PATEL_DEMO_ID`, `GOLDEN_SCENARIO_V_UK1_ID`) before and after, assert byte-identical `safetyRoute`/`queuePriority`.
- **Acceptance criteria.** All existing `tests/clinical-spine-*.test.ts` pass unmodified; golden-scenario outputs unchanged; `lib/decision/` has its own unit test file.

### P0-3. Classify the 12-agent directory by kind AND by frozen architecture layer — keep all 12 as agents

- **Correction (product owner, authoritative).** This item does **not** authorise, and must never be read as authorising, deleting, merging, or "servicifying away" any of the 12 named agents in `lib/agents.ts`. Patient-State centricity (§4 of the spec) means every agent reads from and writes back to shared Patient State — it is not a reason to shrink the agent roster. Per `docs/AKSH_ARCHITECTURE_GAP_ANALYSIS.md` §2.1, all 12 current agents are **Keep-as-agent**; the diabetes 9 signal builders are already correctly implemented as deterministic tools (not agents) and are not part of this classification — they are the template for how future deterministic work should be added (as tools/services called *by* agents), not evidence that existing agents should be converted.
- **Current implementation.** `lib/agents.ts` `AGENT_DIRECTORY`/`CLINICAL_AGENT_META` lists 12 agents with no field indicating (a) whether each is primarily LLM-judgment-backed, orchestration, an interoperability adapter, or a governance function, or (b) which frozen architecture layer(s) (§1/§5 of the spec) it primarily operates in.
- **Problem.** Without this classification, every future contributor (human or agent) will keep treating "the 12 agents" as *either* the whole architecture (the old confusion) *or*, if mis-corrected, as a legacy list to be pruned toward pure services (the new confusion this correction exists to prevent). Both misreadings are avoided by explicitly tagging each agent's kind, its layer(s), and its keep status.
- **Target implementation.** Add three additive fields to each `AGENT_DIRECTORY` entry, populated per the gap analysis §2.1 table:
  - `kind: "orchestration" | "intelligence_llm" | "intervention" | "data_interop" | "safety_governance"` — the agent's primary coordination/judgment character. (Deterministic calculations are never given a `kind` here because they are not agents at all — e.g. the diabetes signal builders live outside `AGENT_DIRECTORY` entirely, in `lib/disease-modules/diabetes/*`, as tools.)
  - `layer: Array<"patient_state" | "intelligence" | "decision" | "intervention" | "learning" | "data_interop" | "safety_governance">` — the frozen architecture layer(s) this agent primarily operates in (an agent may span more than one, e.g. CONDUCTOR spans `intelligence` + `decision`).
  - `keepStatus: "keep"` — every one of the 12 entries gets this literal value; the field exists so that any future review can assert, in a type-checkable way, that no agent has been silently reclassified as "convert" without an explicit, separate, reviewed decision (per the guardrail in spec §54).
  - No renaming of ids, labels, env vars, or aliases. No agent is removed from `AGENT_DIRECTORY`.
- **Files affected.** `lib/agents.ts` only (additive fields + a short comment pointing to the gap analysis §2.1 table).
- **DB changes.** None.
- **API changes.** Additive fields on any endpoint that serialises `AGENT_DIRECTORY` verbatim (check `app/api/agents/orchestrate/route.ts`, `app/api/agents/oracle/route.ts` for shape sensitivity before shipping).
- **Frontend changes.** None required; optional future UI grouping by `kind`/`layer`.
- **AI/model changes.** None.
- **Clinical safety implications.** None directly — documentation/metadata only. Indirectly positive: makes it type-checkable that every agent is still required to operate against shared Patient State, provenance, safety, and decision policies (spec §13.1, §54) rather than each agent inventing its own private state or bypassing Decision/Safety.
- **Migration risk.** Very low.
- **Testing requirements.** Snapshot test on `AGENT_DIRECTORY`/`CLINICAL_AGENT_META` shape to catch accidental breaking changes to consumers; a lint/unit assertion that every entry's `keepStatus` is `"keep"` unless a specific, separately-reviewed migration item says otherwise.
- **Acceptance criteria.** Every one of the 12 entries has `kind`, `layer`, and `keepStatus: "keep"`; the directory still has exactly 12 entries; no existing consumer of `AGENT_DIRECTORY`/`CLINICAL_AGENT_META` breaks.

### P0-4. Formalise a single Data & Interoperability adapter contract

- **Current implementation.** FHIR staging (`lib/clinical-proof/staged-fhir.ts`, `db/migrations/011_fhir_staging_bundles.sql`), EMIS staging (`lib/emis-staging.ts`, `lib/emis-partner-sandbox.ts`), Medplum (`lib/medplum-client.ts`), Neo4j (`lib/neo4j/*`), and modality connectors (`lib/precision-health/connectors.ts`) each implement their own "staged vs live" pattern independently. `lib/integration-boundary-contract.ts` (42 lines) covers only part of this.
- **Problem.** Domain 6 (Data & Interoperability) has no single boundary, making it hard to answer "is anything writing live anywhere" without checking five files, and making it easy for a future integration to accidentally skip the staging-first pattern.
- **Target implementation.** Extend `lib/integration-boundary-contract.ts` into a shared `IntegrationAdapter` interface (`{ systemId, resourceType, mode: "staged" | "live", consentScopeRequired, provenanceTag }`) that FHIR/EMIS/Medplum/Neo4j adapters implement or wrap, without changing their internal logic. `liveEmis:false` and equivalent flags remain enforced exactly as today — this item formalises the shared shape, it does not change any flag's default.
- **Files affected.** `lib/integration-boundary-contract.ts` (extended, additive). Wrapper-only touches (no logic changes) to `lib/emis-staging.ts`, `lib/medplum-client.ts`, `lib/neo4j/queries.ts`, `lib/precision-health/connectors.ts`.
- **DB changes.** None required for the contract itself; optionally a `data_interop_events` audit view later (P2), out of scope for P0.
- **API changes.** None — this is an internal contract, not a public API change.
- **Frontend changes.** None.
- **AI/model changes.** None.
- **Clinical safety implications.** Positive: makes "no live write" easier to verify by inspection/lint rather than by reading five files; no behaviour change.
- **Migration risk.** Low-medium — wrapping existing adapters risks subtle behaviour changes if done carelessly; mitigate by wrapping (not editing) each adapter's existing exported functions.
- **Testing requirements.** A single test asserting every registered `IntegrationAdapter` has `mode: "staged"` unless explicitly allow-listed (`liveEmis`-style guard, generalised); existing integration tests (`tests/emis-partner-sandbox.test.ts`, `tests/clinical-proof-medplum.test.ts`) must pass unmodified.
- **Acceptance criteria.** One place in the codebase enumerates every external-system adapter and its live/staged status; all existing integration tests green.

---

## P1 — Diabetes MVP requirements (prove the full CONNECT → … → LEARN loop)

These depend on P0-1 (Patient State) and P0-2 (Decision) existing, at least in skeleton form, so the loop has something real to close through.

### P1-1. Wire diabetes coaching-draft outcomes into the Learning domain

- **Current implementation.** `buildDiabetesRiskContribution` (`lib/disease-modules/diabetes/index.ts`) produces `coachingDrafts` (nutrition/exercise/behaviour). Nothing currently calls `recordLearningEvent`/`captureSpineOutcome` (`lib/clinical-spine/outcomes-loop.ts`) with a diabetes-labelled `agentLabel` when a clinician Accepts one of these drafts.
- **Problem.** The Learning domain (already the strongest domain per the gap analysis) has no diabetes-specific entry point, so the Diabetes module cannot yet demonstrate a closed CONNECT→…→LEARN loop — only CONNECT→INTERPRET is demonstrable today.
- **Target implementation.** When a diabetes coaching draft is Accepted (existing HITL Accept flow), call `recordLearningEvent` with `agentLabel` set to the specific diabetes area (e.g. `"DIABETES_NUTRITION"`), `predictionId` referencing the coaching draft, so `captureSpineOutcome` can later link a real glycaemic/behavioural outcome to it exactly like existing agent outcomes.
- **Files affected.** `lib/disease-modules/diabetes/index.ts` (no change), new glue in whatever Accept-flow handler currently exists for the review queue (locate via `deriveReviewQueueItems`/`buildGuardianItem`-style pattern in `lib/agents.ts` and the relevant `/api/clinical-spine/*` route), `lib/clinical-spine/outcomes-loop.ts` (no change — reused as-is).
- **DB changes.** None — reuses `aksh.learning_events`.
- **API changes.** Existing Accept endpoint(s) gain an internal call to `recordLearningEvent`; response shape unchanged.
- **Frontend changes.** None required for P1-1 itself; a later item can surface "diabetes outcomes pending" in the clinician UI.
- **AI/model changes.** None — this wires an existing deterministic composite's output into an existing deterministic learning-event recorder.
- **Clinical safety implications.** Positive: closes a real gap in outcome traceability for diabetes coaching; no new patient-facing behaviour.
- **Migration risk.** Low.
- **Testing requirements.** Extend `tests/clinical-proof-learning.test.ts`-style coverage with a diabetes-labelled learning event; verify `buildOutcomesLoopStatus` correctly buckets it.
- **Acceptance criteria.** Accepting a diabetes coaching draft produces a `learning_events` row with a diabetes `agentLabel`; `docs/CONTINUOUS_LEARNING.md` updated to document the new label (docs-only change, not covered by the "no application code" constraint since it's documentation).

### P1-2. Real longitudinal glucose/HbA1c ingestion tied to Patient State

- **Current implementation.** `lib/disease-modules/diabetes/fixtures.ts` provides synthetic-only glucose/HbA1c bundles; there is no ingestion path from a real (or realistically-shaped) device/EHR source into a persisted series.
- **Problem.** Without P0-1's Patient State, glucose/HbA1c "history" is regenerated per call from static fixtures rather than accumulated over time — CONNECT/INGEST are not demonstrable for diabetes today.
- **Target implementation.** A `lib/disease-modules/diabetes/ingest.ts` that writes glucose/HbA1c readings as Patient State facts (via P0-1's repository), with `buildGlucoseSignal`/`buildHbA1cSignal` reading from Patient State instead of (or in addition to, during transition) the static fixture bundle.
- **Files affected.** New: `lib/disease-modules/diabetes/ingest.ts`. Touched (additive parameter, fixture remains default fallback): `lib/disease-modules/diabetes/glucose.ts`, `hba1c.ts`.
- **DB changes.** Uses P0-1's `aksh.patient_state_facts` — no new table.
- **API changes.** New `POST /api/patients/[id]/diabetes/glucose` (or connector-driven ingestion) — additive only.
- **Frontend changes.** Clinician diabetes UI (`docs/PHASED_BUILD_PLAN.md` B4) can optionally display "readings source: fixture vs ingested" — additive, not required for P1 acceptance.
- **AI/model changes.** None — ingestion is deterministic.
- **Clinical safety implications.** Requires care that fixture-derived and real-ingested readings are never silently blended without a clear provenance tag (ties to P0-1's per-fact `source` field) — this is a testing requirement, not just a nice-to-have.
- **Migration risk.** Medium — depends on P0-1 landing first; sequence explicitly after P0.
- **Testing requirements.** Test that a real-ingested reading and a fixture reading are distinguishable in `buildGlucoseSignal`'s output provenance; regression test that omitting real data falls back to existing fixture behaviour byte-for-byte.
- **Acceptance criteria.** At least one full patient's glucose series can be ingested, persisted with provenance, and read back through `buildGlucoseSignal` without touching fixtures.

### P1-3. Diabetes-specific Decision output, separated from HORIZON/GUARDIAN intelligence

- **Current implementation.** Diabetes signals feed HORIZON's `contributingFactors` and GUARDIAN's `safetyNotes` additively (`applyDiabetesContributionAdditively` in `lib/clinical-spine/orchestrate.ts`) — there is no diabetes-specific Decision output (e.g. "escalate to diabetes nurse" vs "routine coaching follow-up").
- **Problem.** Per the frozen spec, Decision must be explicit and separate from Intelligence; today diabetes's only "decision" influence is indirectly raising/lowering the existing composite risk score and safety route.
- **Target implementation.** Extend P0-2's `resolveDecision` to accept the diabetes contribution as an additional Intelligence input, producing an explicit `escalation: "diabetes_nurse_review" | "routine_coaching" | "none"` field alongside the existing route/priority — additive to the `Decision` type, not a new parallel decision path.
- **Files affected.** `lib/decision/index.ts` (from P0-2), `lib/clinical-spine/orchestrate.ts` (pass diabetes contribution into `resolveDecision` instead of only into HORIZON/GUARDIAN).
- **DB changes.** None beyond what P0-2 already introduces.
- **API changes.** Additive field on `runClinicalSpineOrchestrate`'s response.
- **Frontend changes.** Diabetes clinician UI can surface the new escalation field — additive.
- **AI/model changes.** None — remains deterministic.
- **Clinical safety implications.** Positive: makes the diabetes escalation path explicit and testable rather than implicit in a composite score threshold.
- **Migration risk.** Low, sequenced after P0-2 and P1-1.
- **Testing requirements.** Unit tests on `resolveDecision` for diabetes-flagged vs non-flagged patients, asserting non-diabetes patients are byte-identical to pre-change behaviour (mirrors the existing `FR-DIAB-022` byte-identical guarantee already tested for HORIZON/GUARDIAN).
- **Acceptance criteria.** A diabetes-flagged synthetic patient with hypo-risk flags produces an explicit `escalation: "diabetes_nurse_review"`; a non-diabetes patient's decision output is unchanged.

### P1-4. End-to-end diabetes CONNECT→…→LEARN evidence script

- **Current implementation.** `scripts/run-clinical-proof.mjs` and `docs/E2E_CLINICAL_PROOF.md` exercise the general clinical spine; no script demonstrates the full loop for one diabetes patient specifically.
- **Problem.** Without a single evidence artifact, "the Diabetes MVP proves the full loop" is a claim, not a demonstrated fact — exactly the kind of claim this project's honesty culture (`docs/BUILT_VS_REMAINING_AUDIT.md` "Honesty first") requires be backed by evidence.
- **Target implementation.** A new `scripts/run-diabetes-loop-proof.mjs` that: ingests a glucose/HbA1c series (P1-2) for one synthetic patient → runs orchestration with the diabetes module enabled (existing `ENABLE_DIABETES_MODULE` flag) → captures the Decision escalation (P1-3) → simulates an Accept → records a learning event (P1-1) → captures a synthetic outcome → asserts every stage produced an auditable SHIELD event. Mirrors the existing `run-clinical-proof.mjs` pattern.
- **Files affected.** New script only; no existing script modified.
- **DB changes.** None beyond P0-1/P1-1/P1-2.
- **API changes.** None — uses existing/new endpoints as a client.
- **Frontend changes.** None.
- **AI/model changes.** None.
- **Clinical safety implications.** None — evidence tooling only.
- **Migration risk.** Low.
- **Testing requirements.** The script itself is the test; wire it into CI alongside `npm run test:clinical-proof`.
- **Acceptance criteria.** One CI-run script produces a pass/fail evidence artifact for the full diabetes CONNECT→…→LEARN loop, added to `docs/evidence-pack/`.

---

## P2 — Intelligence and workflow improvements

Lower urgency than P0/P1; valuable but not blocking the Diabetes MVP.

### P2-1. Review NEXUS inputs for deterministic-vs-LLM fit (COMPASS already decided: keep as agent)

- **Correction note.** Per `docs/AKSH_ARCHITECTURE_GAP_ANALYSIS.md` §2.1, COMPASS is **decided: keep as agent** — it coordinates population-disparity signals *and* surfaces equity/care-coordination implications into Decision, which is judgment/coordination, not a single deterministic calculation. Only the population-statistics *inputs* COMPASS draws on (`risk-state.ts`, `population-diabetes.ts`) are, and remain, deterministic tools. This item is narrowed to NEXUS only.
- **Current implementation.** `lib/agents/llm-nexus.ts` (NEXUS) makes LLM/AI-Gateway calls for draft-only correlation flagging across multiple signals.
- **Problem.** Possible over-use of LLM judgment where a deterministic service/tool would be more reproducible, cheaper, and easier to safety-review — but only if NEXUS's task turns out to be a fixed, enumerable statistical correlation rather than genuine multi-source investigation (per the agent-vs-tool test in spec §13.1).
- **Target implementation.** A review spike (no code change) producing one recommendation for NEXUS: keep as an agent (if it is doing genuine multi-signal investigation/judgment), or extract a deterministic correlation-statistics tool that NEXUS (or another agent) calls (if its current scope turns out to be a fixed calculation) — keeping the existing draft/HITL contract unchanged either way, and keeping NEXUS's `keepStatus` (P0-3) as `"keep"` unless this review produces an explicit, separately-reviewed decision to convert it.
- **Files affected.** Review only in P2; any resulting change is its own future item.
- **DB/API/frontend/AI changes.** None until a follow-up decision is made.
- **Clinical safety implications.** Neutral — no behaviour change from the review itself.
- **Migration risk.** N/A (review only).
- **Testing requirements.** N/A.
- **Acceptance criteria.** A short written recommendation per agent, added to the Layer Map ADR as an addendum.

### P2-2. Unify Intervention-domain result shape

- **Current implementation.** `health-plan.ts`, `coaching.ts`, diabetes coaching builders, and referral packages each define their own draft shape.
- **Problem.** No single "what interventions are pending for this patient" query is possible without touching four modules.
- **Target implementation.** A shared `InterventionDraft` base type (`{ id, domain, patientId, status: "draft"|"accepted"|"rejected", hitlRequired: true, ehrWrite: false, ... }`) that existing draft types extend additively.
- **Files/DB/API/frontend/AI changes.** Type-level additive change only; no runtime behaviour change.
- **Clinical safety implications.** None — organisational only.
- **Migration risk.** Low.
- **Testing requirements.** Type-check plus existing test suite green.
- **Acceptance criteria.** All existing Intervention draft types satisfy the shared base type without behaviour change.

### P2-3. Patient State timeline UI

- **Current implementation.** `lib/precision-health/timeline.ts` powers ad hoc timeline views; no UI shows "state as of version N."
- **Problem.** Once P0-1 exists, its value is invisible without a UI.
- **Target implementation.** A read-only timeline/version view in the existing patient/clinician dashboard surfaces, additive to current dashboard routes.
- **Files/DB/API/AI changes.** Frontend-only, reading P0-1's new read endpoint.
- **Clinical safety implications.** Positive — visible provenance builds clinician trust; must not overstate certainty (respect existing honesty-field conventions).
- **Migration risk.** Low.
- **Testing requirements.** Component/e2e smoke test.
- **Acceptance criteria.** A clinician can view a patient's fact history with source/confidence per fact.

### P2-4. Data & Interoperability audit view

- **Current implementation.** Each integration's staging/live status is checked independently.
- **Problem.** No single dashboard panel answers "is anything live anywhere" across all integrations.
- **Target implementation.** An admin panel reading P0-4's `IntegrationAdapter` registry.
- **Files/DB/API/AI changes.** Additive read-only endpoint + admin panel.
- **Clinical safety implications.** Positive — improves auditability of the `liveEmis:false`-style guarantees.
- **Migration risk.** Low.
- **Testing requirements.** Smoke test confirming the panel reflects registry state.
- **Acceptance criteria.** Admin can see every integration's live/staged status in one place.

---

## P3 — Advanced future capabilities

Out of scope until P0–P2 are substantially delivered and there is demonstrated need (per the frozen spec's "migration over rewrite" and existing ADRs' "not against the general vision, against concrete bottlenecks" principle).

- **P3-1. PRISM (Imaging Intelligence) and ATLAS (Clinical Research Agent).** Currently `live: false` roadmap entries in `AGENT_DIRECTORY`. Build only against a concrete, funded use case — not speculatively.
- **P3-2. Production RBAC / CIS2.** `lib/permission-matrix.ts` explicitly documents `productionRbacEnforced: false` today. Moving to enforced production RBAC is a significant security and compliance project (see `docs/evidence-pack/08-security-pen-test.md`, `docs/BUILT_VS_REMAINING_AUDIT.md` Track A/B split) requiring its own dedicated plan, sign-off, and pen-test — explicitly not bundled into this migration.
- **P3-3. Live EMIS / NHS write path (Track B).** Requires partner credentials, Medplum OAuth, CIS2, and a signed go/no-go per `docs/BUILT_VS_REMAINING_AUDIT.md` "Path to demo GO vs live NHS GO" — governed entirely outside this migration plan, and `liveEmis:false` must remain the default until that separate process completes.
- **P3-4. Federated research pipeline productionisation.** `lib/precision-health/federated-research.ts` is currently an ethics-gated stub; production federation is a distinct, larger initiative.
- **P3-5. Additional disease modules beyond Diabetes.** Only after the Diabetes MVP (P1) has proven the full CONNECT→…→LEARN loop end-to-end — reusing the same Patient State, Decision, and Learning infrastructure rather than building new per-disease infrastructure.

---

## Explicit non-instructions

- This plan does **not** authorise a rebuild of Aksh Health in one pass, by any agent, human or AI.
- This plan does **not** authorise touching `liveEmis`, `autoRetrain`, HITL enforcement, or any other hard-constraint flag's default value.
- This plan does **not** authorise deleting any existing doc (Volume I PRD, ADRs, PHASED_BUILD_PLAN, Diabetes Spec) — all are reconciled, not replaced (see `docs/AKSH_FINAL_ARCHITECTURE_SPEC.md` Part VI).
- **This plan does not authorise deleting, merging, or "servicifying away" any of the 12 named agents in `lib/agents.ts`, and no item in this plan (including P0-3) should be executed in a way that reduces the agent directory's count.** Patient-State centricity is not a reason to collapse named agents — see `docs/AKSH_FINAL_ARCHITECTURE_SPEC.md` §13/§13.1 and §54, and `docs/AKSH_ARCHITECTURE_GAP_ANALYSIS.md` §2.1 for the per-agent Keep-as-agent verdicts (net effect: zero deletions).
- **Recommended next action: review the P0 items above only**, and decide (a) whether to proceed with P0-1..P0-4 as scoped, and (b) whether any P0 item needs its own separate, more detailed design doc before implementation begins.
