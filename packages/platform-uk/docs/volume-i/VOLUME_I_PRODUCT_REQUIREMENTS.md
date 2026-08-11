# Volume I — Product Requirements Document (PRD)

**Document ID:** AKSH-VOL1-PRD
**Version:** 0.21 (draft complete — chapter-by-chapter)
**Status:** **Draft complete — pending review.** All 22 chapters are now marked **[DRAFTED]** in the Table of Contents to functional-spec depth. No chapter has been marked **Accepted** — that requires the Product/Architecture/Clinical Safety Lead sign-off proposed at §21.10, which remains `Proposed`, not ratified. This Volume is complete as a draft; it is not yet reviewed, signed off, or exported for distribution.
**Date:** 27 July 2026
**Product:** Aksh Health — Aksh Intelligence Platform (UK/EU), first commercial module: Aksh Diabetes
**Repository:** `packages/platform-uk`

---

## 0. Document Control

### 0.1 Purpose of this document

This is Volume I of the Aksh Health product documentation program. It is the **product source of truth for what the platform must do** — not how it is built, and not a marketing or vision summary. Every chapter, once drafted, is written to functional-specification depth: objectives, responsibilities, inputs, outputs, triggers, and acceptance criteria stated as testable `Given/When/Then` scenarios. Chapters that have not reached this depth are marked **[TODO]** and contain, at most, a one-line placeholder description — they are intentionally not padded with prose to look more complete than they are.

This document supersedes, for product-requirement purposes, the informal narrative style used in earlier working docs (`docs/PRODUCT_AUDIT_AND_ROADMAP.md`, `docs/HOW_TO_BUILD_AKSH_HEALTH.md`, and similar). Those documents remain valid as historical/engineering audit records; they are not requirements documents and should not be cited as the source of truth for "what shall be built" going forward. Where this Volume and an audit doc disagree on current build status, this Volume's "current state" framing takes the audit doc's evidence as input but the requirement language here governs what the target state must be.

### 0.2 Audience

| Audience | What this document is for them |
| --- | --- |
| **Product / Program Management** | The requirements backlog and scope boundary. Chapter status (DRAFTED/TODO) is the honest measure of specification completeness — not engineering completeness. |
| **Architects** | The product-level "what" that architecture (ADRs, layer maps, tech-stack decisions) must satisfy without contradicting. See §0.4 for the ADR relationship. |
| **AI / Backend / Frontend Engineers** | The requirement and acceptance-criteria (AC) source for implementation. Chapters are written so that a `Given/When/Then` AC block can be handed to an engineer (or to Cursor, see §0.3) as a near-complete implementation brief. |
| **Clinical Safety Lead** | The place where every hard clinical-safety constraint (HITL, no auto-prescribing, no EHR replacement, explainability) is stated as a non-objective or business rule, not left implicit. Clinical Safety must review and sign off each chapter before it is considered Accepted (see §0.5 status model). |
| **QA** | The traceable source for test-case derivation. Every AC block in a DRAFTED chapter is expected to map to at least one test case once implementation begins. |

### 0.3 How to use this document with Cursor

- This Markdown file is the **source of truth**. A `.docx` rendering for external/commercial distribution is a downstream export, produced later from this file — never edited independently and never allowed to drift from it.
- Each functional requirement in a DRAFTED chapter carries a stable ID (scheme in §0.6). When asking Cursor (or any engineering agent) to implement a feature, reference the requirement ID and its AC block directly, e.g. *"Implement FR-VIS-003 per Volume I Chapter 1, AC block AC-VIS-003-1 through AC-VIS-003-3."*
- Do not ask an engineering agent to "implement Volume I" wholesale. Implementation should always be scoped to a specific chapter, requirement, or AC block that has reached **[DRAFTED]** status and has been reviewed.
- Where a chapter references an existing ADR or engineering spec (§0.4), the engineering agent should read that companion document for the current-state/implementation-boundary detail this Volume deliberately does not duplicate.

### 0.4 Relationship to existing ADRs and specs

This Volume is the **product** source of truth ("what must the product do, for whom, and to what acceptance bar"). It does not replace or contradict the following, which remain the **architecture/engineering** source of truth ("how, and with what stack") and are treated as binding overlays wherever this Volume touches the same ground:

| Document | Relationship to this Volume |
| --- | --- |
| `docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md` | Defines the 9-layer platform vocabulary and the current build status (Exists/Partial/Missing) per layer, and the canonical 12-agent directory/naming. This Volume's Chapter 4 (Platform Architecture — product view) and Chapter 7 (Universal Agent Platform) must use this naming and must not restate or re-derive layer status; they cross-reference it. |
| `docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md` | Defines the 9 Diabetes intelligence areas, their module boundary, HITL gates, and phased delivery (v0/v1/v2). This Volume's Chapter 8 (Disease Intelligence — Diabetes) elevates this into product-requirement form (Purpose/Responsibilities/Inputs/Outputs/Triggers/AC) but must not contradict its module boundaries, non-goals, or phasing. |
| `docs/ADR_TECH_STACK_MODERNIZATION.md` | Defines what infrastructure is Keep / Add-later (named trigger) / Avoid-now. This Volume's non-functional requirements (Chapter 19, when drafted) must be satisfiable within the "Keep now" stack for any requirement targeting the current release; a requirement that implicitly requires an "Avoid now" component must say so explicitly and flag it as blocked on the named trigger firing, not silently assume it. |
| `docs/CONTINUOUS_LEARNING.md`, `docs/GOVERNED_MODEL_RELEASE_SOP.md` | Define the existing governed continuous-learning loop and model-release gate sequence (G-ML-1/2/3). Chapter 14 (Continuous Learning) in this Volume must describe product-level requirements for this loop without inventing a second loop or relaxing the gate sequence. |
| `docs/BUILT_VS_REMAINING_AUDIT.md` | Current honest build-state snapshot (Track A demo GO / Track B live-EMR NO-GO). This Volume's Success Criteria (Chapter 1) and Acceptance & Validation (Chapter 20 §20.6) must stay consistent with this Track A/B split and must not imply Track B is closer than it is. |

**Precedence rule:** if a future chapter of this Volume appears to conflict with a hard constraint stated in one of the documents above, the hard constraint wins and the chapter must be corrected before it can move past Draft status. This Volume does not have authority to relax `liveEmis:false`, `autoRetrain:false`, HITL mandatoriness, or the no-fake-certification rule — see Chapter 1 §1.4 for these stated as Non-Objectives.

### 0.5 Chapter status model

| Status | Meaning |
| --- | --- |
| **[DRAFTED]** | Written to full functional-spec depth for this pass: Purpose, Responsibilities/Objectives, Inputs, Outputs, Triggers, Business Rules, and Acceptance Criteria in `Given/When/Then` form, as applicable to the chapter type. Still subject to review — DRAFTED is not the same as Accepted/Approved. |
| **[TODO]** | Not yet written. Placeholder title and one-line scope note only. |

No chapter in this document has been marked "Accepted" or "Approved" as of this version. That status will be added per-chapter once Product, Architecture, and Clinical Safety sign-off is recorded (mechanism TBD — see Chapter 21, Open Questions, once drafted).

### 0.6 Requirement and AC numbering scheme (binding for all future chapters)

- **Business Objectives:** `BO-<n>`
- **Non-Objectives:** `NO-<n>`
- **Success Criteria:** `SC-<n>` (each tagged `[MEASURABLE]` or `[ASPIRATIONAL — NEEDS BASELINE]`, see §1.5)
- **Functional Requirements:** `FR-<CHAPTER-CODE>-<nnn>` (chapter codes assigned in the Table of Contents, §0.7)
- **Non-Functional Requirements:** `NFR-<nnn>`
- **Acceptance Criteria:** `AC-<FR-ID>-<n>`, each written as `Given / When / Then`
- **Business Rules:** `BR-<nnn>`
- **Open Questions:** `OQ-<nnn>`

IDs are never renumbered or reused once a chapter reaches DRAFTED status and has been reviewed at least once. If a requirement is dropped, it is marked `DEPRECATED` in place, not deleted, so historical Cursor prompts and test cases referencing it do not silently point at a different requirement.

### 0.7 Revision history

| Version | Date | Change |
| --- | --- | --- |
| 0.1 | 27 July 2026 | Initial working draft. Document control, full Table of Contents, Chapter 1 (Product Vision & Objectives) and Chapter 2 (Scope & Non-Scope) drafted. All other chapters TODO. |
| 0.2 | 27 July 2026 | Chapter 3 (Personas & Stakeholders) drafted, grounded in the existing 8-role onboarding model (`lib/onboarding/roles.ts`), role-based tutorial paths (`lib/onboarding/role-paths.ts`), the two-tier RBAC model (`lib/permission-matrix.ts`, `lib/user-scope.ts`), and tenant/patient isolation policy (`lib/clinical-proof/tenant-isolation.ts`). No other chapters changed. |
| 0.3 | 27 July 2026 | Chapter 5 (Clinical Safety & Human Oversight — HITL) drafted, ahead of Chapter 4 per the dependency ordering flagged in v0.2, grounded in `lib/human-gates.ts`, `lib/clinical-spine/orchestrate.ts`, `lib/clinical-spine/safety-route.ts`, `lib/clinical-spine/queue-decision.ts`, `lib/clinical-spine/outcomes-loop.ts`, `lib/repositories/shield-audit-repository.ts`, `lib/agents/llm-guardian.ts`, `docs/GOVERNED_MODEL_RELEASE_SOP.md`, and `docs/CONTINUOUS_LEARNING.md`. Chapter 4 remains TODO. |
| 0.4 | 27 July 2026 | Chapter 4 (Platform Architecture — Product View) drafted, completing the deferred chapter, grounded in `lib/agents.ts`, `lib/clinical-spine/`, `lib/disease-modules/diabetes/`, `lib/precision-health/`, `lib/neo4j/`, `lib/integration-config.ts`, and both `docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md` and `docs/ADR_TECH_STACK_MODERNIZATION.md`. Notes that `lib/disease-modules/diabetes/` v0 typed stubs now exist in code (an update since the Layer Map ADR was written) but remain unwired into CONDUCTOR/HORIZON/GUARDIAN, consistent with the spec's own v0 phase. |
| 0.5 | 27 July 2026 | Chapter 6 (Core Platform Capabilities — Identity, Consent, Interop, Knowledge Fabric) drafted, opening Part B, grounded in `lib/auth.ts`, `lib/permission-matrix.ts`, `lib/clinical-proof/tenant-isolation.ts`, `lib/precision-health/consent.ts`, `lib/repositories/consent-grant-repository.ts`, `lib/precision-health/timeline.ts`, `lib/precision-health/modalities.ts`, `lib/neo4j/`, `lib/medplum-client.ts`, `lib/emis-staging.ts`, `lib/integration-boundary-contract.ts`, and `docs/ADR_TECH_STACK_MODERNIZATION.md`'s Knowledge/terminology section. |
| 0.6 | 27 July 2026 | Chapter 7 (Universal Agent Platform) drafted, completing Part B, grounded in `lib/agents.ts` (canonical `AGENT_DIRECTORY`), `lib/agents/llm-*.ts` (SYNTHESIS, GUARDIAN, HORIZON/ORACLE, NEXUS, COMPASS/EQUITY, Dr.Assist), `lib/clinical-proof/agent-orchestration.ts`, `lib/clinical-spine/orchestrate.ts` and `safety-route.ts`, `lib/referral-agent.ts` (PATHWAY), `lib/bridge-staging.ts` (BRIDGE), `lib/intake-generation.ts` (CANVAS), `lib/agents/voice-care.ts`, and `lib/repositories/shield-audit-repository.ts` (SHIELD). Uses canonical renamed labels (HORIZON, COMPASS, PATHWAY) throughout while noting legacy internal ids (ORACLE, EQUITY, REFERRAL) remain in code as aliases. Confirms PRISM and ATLAS are Phase 2 roadmap agents, not built. |
| 0.7 | 27 July 2026 | Chapter 8 (Disease Intelligence — Diabetes) drafted, opening Part C, as the most detailed chapter in the Volume to date. Grounded in `docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md` and every file in `lib/disease-modules/diabetes/` (`types.ts`, `glucose.ts`, `hba1c.ts`, `insulin.ts`, `glp1.ts`, `nutrition.ts`, `exercise.ts`, `behaviour.ts`, `complications.ts`, `prevention.ts`, `index.ts`, `fixtures.ts`), reconciled against Chapters 4, 5, and 7's already-drafted requirements. Restates the spec's 6 open questions with `DIAB` requirement-ID framing and named owners rather than re-deciding them. |
| 0.8 | 27 July 2026 | Chapter 9 (Digital Twin — Diabetes) drafted, completing Part C, grounded in `lib/precision-health/twin-simulation.ts` (the only twin-related code that exists today — a generic, disease-agnostic, heart-failure-flavoured `synthetic_rules` scenario ranker with `physiologicalTwin: false`), Chapter 8's Prevention Intelligence non-twin boundary, and the Layer Map ADR's Layer 5 "Missing" status. States plainly that no Diabetes-specific scenario simulator or intervention catalogue exists in code today — this chapter specifies requirements for a future Diabetes-scoped extension of the existing rules pattern, and separately, requirements for a much later physiological twin explicitly gated behind clinical/governance sign-off that this Volume does not request be built now. |
| 0.9 | 27 July 2026 | Chapter 10 (Population Intelligence) drafted, opening Part D, grounded in `lib/precision-health/risk-state.ts` (`buildPopulationRiskState`), `lib/agents/llm-equity.ts` (COMPASS), `lib/mock-data/population.ts`, `lib/neo4j/queries.ts`/`mock-fallback.ts`, `lib/precision-health/pharma-payer.ts`, `lib/precision-health/consent.ts`, and `lib/clinical-proof/tenant-isolation.ts`. Introduces a five-stage Segment→Predict→Recommend→Monitor→Learn intelligence-loop framing (per the product vision) as the organizing structure for requirements, while recording plainly that today's ICS dashboard numbers are a separately-authored, illustrative-scale static fixture (47,832 patients) disconnected from the platform's actual 100-patient synthetic cohort, and that even the "live" Neo4j path reads pre-seeded literal aggregate properties rather than computing a live aggregation — neither Segment nor Predict is a real computed pipeline stage yet. Restates Chapter 4's OQ-ARC-2 (k-anonymity threshold) rather than re-deciding it. |
| 0.10 | 27 July 2026 | Chapter 11 (Patient Intelligence) drafted, continuing Part D, grounded in `lib/precision-health/coaching.ts`, `health-plan.ts`, `timeline.ts`, `modalities.ts`, `consent.ts`, `lib/patient-companion/profile.ts`, and Chapter 8's diabetes-specific coaching drafts (`nutrition.ts`, `exercise.ts`, `behaviour.ts`). Maps the product vision's nine patient-facing capabilities (Coach, Education, Gamification, Wearables, Voice, Medication, Lifestyle, Goals, Family) against the actual build with an honest Exists/Partial/Missing rating for each — Gamification, Goals, and Family have no code representation at all; Voice has none on the patient-facing side (VOICE and VOICE CARE are both clinician/nurse-facing); Coach/Wearables/Lifestyle/Medication views are Partial (schema/draft-only, not personalized or adherence-derived); the patient self-report check-in surface Chapter 3's persona description assumes exists has no backing API today. States a hard, absolute rule that no patient-facing surface may ever accept a medication self-prescribe/dose-change/stop-insulin request, restating Chapter 8's and Chapter 9's type-level locks at the patient layer. Restates Chapter 3's open `patient`-`AppRole`-mapping gap (OQ-PER-1/2) as a blocking precondition for treating any capability in this chapter as production-ready. |
| 0.11 | 27 July 2026 | Chapter 12 (Clinical Intelligence) drafted, continuing Part D, grounded in `/dashboard/gp` and `/dashboard/gp/patients/[id]` (the GP patient workspace and its precision-health panel set), `/review` + `/cases/[id]` (the generic case-review workflow: draft editor, human-gate panels, safety/validation, decision panel, activity timeline, plus separate Evidence and Validation Dossier pages), `/dashboard/nurse` and `/dashboard/pharmacist` (materially thinner, task-scoped surfaces), `lib/human-gates.ts`, `lib/clinical-spine/`, and `docs/RESEARCH_EVALUATION_BOUNDARY.md`. States plainly that the product vision's single unified clinician workspace (Timeline → Evidence → Agents → Approvals → Care Plan → Twin → Risk → Research, all in one place) is delivered today as **three separate, not-fully-unified surfaces** a GP moves between (the GP dashboard overview, the patient-detail precision-health page, and the generic `/review`/`/cases/[id]` case workflow), each covering a different subset of the eight vision panels, with Evidence and the Validation Dossier as separate pages rather than panels within one workspace, and Research reachable only as an offline, one-directional data-export boundary with no live workspace entry point at all. Restates Chapter 4's FR-ARC-019 (existing GP review workflow as "the" clinical-intelligence workspace) as the honest baseline this chapter's unification requirements are measured against, and restates Chapter 5's full gate catalog and Chapter 3's clinician personas (GP/Nurse/Pharmacist/Admin) rather than re-specifying them. |
| 0.12 | 27 July 2026 | Chapter 13 (Research Intelligence) drafted, completing Part D, grounded in `docs/RESEARCH_EVALUATION_BOUNDARY.md`, `lib/research-evaluation-plan.ts` (the typed dataset/task/metric evaluation boundary — corrected from Chapter 4's `lib/precision-health/` grouping, as the file lives outside that directory), `lib/precision-health/federated-research.ts` (the ethics-gated federated-research job stub), `lib/precision-health/biomarkers.ts` (an explicitly-labeled "biomarker-lite" display formatter, not a discovery engine), `app/api/research/evaluation/route.ts` and `app/api/research/federated/jobs/route.ts` (both genuinely SHIELD-audited today), and the `/dashboard/researcher` surface (`ResearcherKpiRow`, `FederatedJobsPanel`, `GovernanceBoundariesCard`, the Evaluation and Data Access pages). Maps the product vision's six Owkin-inspired capability areas (Literature Intelligence, Cohort Builder, Biomarker Discovery, Hypothesis Generator, Trial Matching, Scientific Writer) against the actual build: Literature Intelligence, Hypothesis Generator (at cohort level), Trial Matching, and Scientific Writer have **no code representation at all**; Cohort Builder is a static illustrative display, not an interactive builder; Biomarker Discovery's only namesake code is an explicit non-discovery display helper. States that the evaluation harness (four typed tasks, two `available_now`) and the federated-research ethics gate are the most genuinely-built parts of this layer, both with real SHIELD audit writes. Restates Chapter 12's clinical/research workspace boundary as a one-directional, offline export pipeline with no live handoff, and flags a new architecture observation (OQ-RES-1) that the research-evaluation endpoint's role check bypasses the canonical permission matrix. |
| 0.13 | 27 July 2026 | Chapter 14 (Continuous Learning — Governed) drafted, completing Part D in full, grounded in `docs/CONTINUOUS_LEARNING.md`, `docs/GOVERNED_MODEL_RELEASE_SOP.md`, `docs/AGENT_EVAL_HARNESS.md`, `docs/HAZARD_LOG_TEMPLATE.md` (hazards H-011/H-012), `lib/clinical-proof/learning-loop.ts` (the `LearningEvent` schema and its `assertNoAutoRetrain` contract check), `lib/repositories/learning-event-repository.ts` (dual Postgres/file storage, with `autoRetrainTriggered`/`modelUpdated`/`ehrWrite`/`hitlRequired` hard-coded as literal SQL constants — `FALSE, FALSE, FALSE, TRUE` — in the insert statement itself, not merely an application-level default), `lib/clinical-spine/outcomes-loop.ts` (`assertGovernedEvaluationAllowed`, `allGovernedGatesSigned`, `submitGovernedEvaluation`), and `lib/repositories/governed-evaluation-repository.ts` (the append-only governed-evaluation record store). Maps the product vision's eleven-stage flywheel (Patient→Data→KG→Agents→Clinician→Intervention→Outcome→Evidence→Validation→Improve Agents→Improve Twin→Improve Disease Models) onto delivered mechanism: the six stages from Clinician through Validation are real, tested, and durable; the three "Improve" stages are a defined, gate-checked *process* (unit-tested via `CP-LEARN-001`) with no demonstrated release history in this build — no agent version, twin rule-weight, or disease-module model has actually been bumped through the G-ML-1/2/3 sequence to date. Restates Chapter 5's FR-HITL-027–030 at full functional-spec depth as this chapter's own home-chapter requirements, and records that hazards H-011 and H-012 remain **Unsigned** in the hazard log as of this Volume's drafting. |
| 0.14 | 27 July 2026 | Chapter 15 (Workflows & User Journeys) drafted, opening Part E, as eight concrete end-to-end journeys threaded through Chapters 3–14's already-specified personas, gates, agents, and layers rather than re-deriving any of them: (1) clinician encounter→CONDUCTOR→review→Accept/Edit/Reject→learning (restates Chapter 4 §4.5's six-stage flow at full step depth, `[LIVE]`); (2) clinician clears a case-level `HumanGateId` (`red_flag_escalation`/`referral_pathway`/`medication_decision`), which resolves — as the mechanism, not a new gate type — the out-of-hours crisis-escalation question both Chapter 8 (EC-DIAB-5) and Chapter 11 (OQ-PAT-6) explicitly deferred here; (3) patient consent→coaching/health-plan draft with an absolute no-self-prescribe rule (`[PARTIAL]`, since Chapter 11's patient self-report submission surface has no backing API today); (4) Diabetes future-wired CGM/lab→signal→HORIZON/GUARDIAN→clinician review, labeled `[FUTURE]` and stated honestly as validated only once Chapter 8's v1 wiring (currently **not started**) lands; (5) ICS population intelligence walking Chapter 10's five-stage Segment→Predict→Recommend→Monitor→Learn framing stage-by-stage, `[PARTIAL]`, since only Recommend is genuinely computed; (6) researcher ethics-gated evaluation/export, `[PARTIAL] leaning toward missing`, walking only the two capabilities (the evaluation harness, the federated-research ethics gate) Chapter 13 confirms are real rather than fabricating steps for the four-plus unbuilt research-vision areas; (7) demo vs. live identity, establishing that every other journey in this chapter executes entirely within Track A (`liveEmis:false`) and that no journey may silently assume a Track B transition; (8) Digital Twin what-if + HITL, restating Chapter 9's hard-gated `medication_decision` block on any safety-critical medication-cessation scenario (including "stop insulin") as a withhold-the-result-until-gated rule, stricter than the standard show-then-gate pattern. Adds six cross-journey invariants (§15.10), 7 non-goals, 6 edge cases, and 7 open questions. Recommends Chapter 16 (Business Rules Catalog) as the next chapter to draft. |
| 0.15 | 27 July 2026 | Chapter 16 (Business Rules Catalog) drafted, continuing Part E, consolidating 85 cross-cutting business rules (`BR-001`–`085`) that Chapters 1–15 had so far stated inline and per-chapter into one indexed, tabular catalogue grouped into 12 categories (Safety/HITL, Identity/Access, Consent/Privacy, Clinical Actions, Diabetes/Medication, Twin, Population, Patient App, Research, Learning/ML, Demo vs Live, Interop/EHR), each entry carrying a Statement, Priority (`HARD`/`MUST`), Origin (`FR-*`/`NO-*`/`OQ-*` cross-reference), Enforcement note, and Phase (`now`/`v1`/`future`) rather than re-deriving any home chapter's own Given/When/Then. Opens with a top-priority quick-reference table (§16.1) surfacing the eight hardest constraints — HITL mandatoriness (BR-001), no auto-prescribe (BR-027), no auto EHR write (BR-043/059/081), `liveEmis:false` (BR-076), `autoRetrain:false` (BR-068), no fake certification (BR-040), the Insulin/GLP-1 `null`-type locks (BR-034), and the patient no-stop-insulin rule (BR-056/044) — before the full per-category catalogue. States a binding conflict-resolution rule (§16.3): where code or a future chapter contradicts a `HARD`-priority entry, the hard constraint wins and the conflict is escalated, never silently resolved by narrowing the catalogue. Records 8 open questions (§16.4) that block treating the catalogue as fully finalized, six of which restate an existing open question from an earlier chapter (OQ-HITL-1/2, OQ-ARC-2/OQ-POP-1, OQ-DIAB-2, OQ-PER-4/OQ-CORE-1, OQ-LEARN-2) at the catalogue level rather than re-deciding it. No code is introduced or modified by this chapter. Recommends Chapter 17 (Data Expectations) as the next chapter to draft. |
| 0.16 | 27 July 2026 | Chapter 17 (Data Expectations) drafted, continuing Part E, as this Volume's product-level data dictionary — an 11-entity catalogue (Patient, Encounter/Case, ConsentGrant, ClinicalDraft, GateDecision, LearningEvent, ShieldAuditEvent, PopulationAggregate, Diabetes signal/reading, TwinScenarioResult, ResearchExport) grounded in `lib/mock-data/types.ts`, `lib/types.ts`, `lib/precision-health/consent.ts` and `modalities.ts`, `lib/disease-modules/diabetes/types.ts`, `lib/clinical-proof/learning-loop.ts`, `lib/repositories/shield-audit-repository.ts`, `lib/human-gates.ts`, `lib/precision-health/risk-state.ts`, `lib/precision-health/twin-simulation.ts`, `lib/precision-health/federated-research.ts`, `lib/research-evaluation-plan.ts`, and the FHIR-lite shapes in `lib/types.ts`/`lib/emis-staging.ts`/`lib/medplum-client.ts`. Each entity carries description, key attributes (required vs optional), source (synthetic/user/device/FHIR), a four-tier sensitivity/retention classification (§17.1), and cross-referenced `FR-*`/`BR-*` origins, deliberately stopping at product-contract depth rather than proposing ClickHouse/Postgres DDL (that remains an engineering-volume artifact per NO-DATA-1). States plainly, as its defining finding, that no glucose/CGM modality exists in the modality enum today (`MODALITY_IDS` has no `glucose` value) and that Chapter 8's diabetes glucose/HbA1c readings remain typed placeholders returning `insufficient_data`/`null` — restated here as a required, currently-open data-contract gap (FR-DATA-017–018) rather than a resolved shape. Restates Chapter 16's honesty-field, null-type-lock, and suppression-threshold business rules (BR-008, BR-025, BR-034, BR-052) as the exact data-shape constraints they imply, per Chapter 16 §16.5's own forward pointer, without re-deriving them. Adds a quality rule (§17.5) binding every entity to "absent data renders `insufficient_data`/`null`, never a fabricated or interpolated value" and a demo-vs-live data rule (§17.6) binding every entity to the existing `liveEmis:false`/synthetic-cohort boundary. Records 7 non-goals (§17.8, most notably: not designing physical database schemas, and not inventing a live SNOMED/terminology server), 5 edge cases (§17.9), and 7 open questions (§17.10, most notably: whether CGM should extend the `wearable` modality or become a new `glucose` modality, restating Chapter 8's own open question at data-contract level; and whether a canonical shared data-dictionary module should exist in code, since several entities catalogued here are today defined independently, with no single shared type, across `lib/mock-data/types.ts` and `lib/types.ts`). Recommends Chapter 18 (UI / Screen Definitions) as the next chapter to draft. |
| 0.17 | 27 July 2026 | Chapter 18 (UI / Screen Definitions) drafted, completing Part E, as a 59-screen product-level catalogue (Screen ID, route, persona, purpose, key components/panels, primary actions, related FRs, honest Exists/Partial/Missing status) grounded in a fresh read of the `app/` route tree — `/signin`/`/signup`/`/auth/error`/`/forgot-password`/`/reset-password`/`/verify-email`/`/demo*` (auth & demo entry, `SCR-AUTH`), `/onboarding/*` (role onboarding, `SCR-ONB`), `/dashboard/gp`, `/dashboard/gp/review-queue`, `/dashboard/gp/patients/[id]`, `/dashboard/gp/care-pathways`, `/dashboard/gp/reports`, `/dashboard/gp/settings`, `/review`, `/cases/[id]`, `/cases/[id]/evidence`, `/cases/[id]/dossier`, `/cases/[id]/report` (GP + case workflow, `SCR-GP`), `/dashboard/nurse*`, `/dashboard/pharmacist*` (`SCR-NUR`/`SCR-PHM`), `/dashboard/admin*` (`SCR-ADM`), `/dashboard/ics*`, `/dashboard/regional`, `/dashboard/hospital*` (`SCR-ICS`/`SCR-HOSP`), `/dashboard/patient` ("My Health", `SCR-PAT`), and `/dashboard/researcher*` (`SCR-RES`). Carries 64 functional requirements (`FR-UI-001`–`064`), 7 hard non-goals (`NO-UI-1`–`7`, most notably: not a Figma/wireframe file, not a visual redesign of the Clinical Signal brand, and not a catalogue of the internal `/workspace`/`/review/ops`-style engineering-readiness tooling), 5 edge cases, and 7 open questions. Corrects Chapter 12's three-surface GP-workspace finding to four once the standalone `/dashboard/gp/review-queue` screen is catalogued separately from the dashboard overview (FR-UI-062), without softening Chapter 12's underlying no-single-unified-workspace finding. States the platform's most absolute UI-level rule (FR-UI-061): no control ever rendered within a `patient`-role session may submit a medication dose-change, self-prescribe, or cessation request, regardless of which persona's screen the underlying shared component appears on. Restates, rather than re-derives, Chapter 3's personas, Chapter 5's gate mechanics, Chapter 9's twin honesty fields, Chapter 11's patient capability baseline, Chapter 12's workspace findings, and Chapter 17's entity catalogue throughout. Completes Part E (Chapters 15–18). Recommends Chapter 19 (Non-Functional Requirements), opening Part F, as the next chapter to draft. |
| 0.18 | 27 July 2026 | Chapter 19 (Non-Functional Requirements) drafted, opening Part F (Quality & Governance), grounded in `docs/ADR_TECH_STACK_MODERNIZATION.md`'s Keep/Add-later/Avoid-now framing, `lib/clinical-proof/perf-slos.ts` (the three real perf-smoke SLO targets, soft/hard, for dashboard TTFB / agent-draft API / HITL review-action path, exercised by `npm run test:clinical-proof`'s `CP-PERF-001`), `e2e/accessibility.spec.ts` (the existing `@axe-core/playwright` critical-violation check, currently covering exactly 2 of Chapter 18's 59 screens), and the `docs/evidence-pack/` artefact set — most importantly `08-security-pen-test.md` and `12-disaster-recovery.md`, both dated placeholders honestly stating **GAP** (no external penetration test and no Neon/Vercel restore drill have been run). Introduces a three-way honesty tag — `[MEASURED]`, `[ASPIRATIONAL — NEEDS BASELINE]`, `[PROCESS GATE — NOT YET EVIDENCED]` — applied to every quantitative or process claim across 60 non-functional requirements (`NFR-001`–`060`) spanning Performance & Scalability, Reliability & Availability, Security, Privacy & Compliance Posture, Observability, Accessibility, Maintainability & Testability, AI/ML Non-Functional Requirements, and Demo vs. Production NFR Differences. States plainly that no formal uptime/availability SLA, no production-scale load test, and no LLM-on latency baseline exist today (all `[ASPIRATIONAL — NEEDS BASELINE]`), that population/ICS analytics remain on Postgres/Neo4j with no ClickHouse mandate (restating Chapter 4 FR-ARC-017 and Chapter 10 NO-POP-2), and that CONDUCTOR's deterministic control flow and the G-ML-1/2/3 governed-release gate sequence (restating Chapter 7 NO-AGT-5 and Chapter 14 FR-LEARN-021/024) are this Volume's binding AI/ML non-functional requirements rather than new proposals. Resolves Chapter 18's OQ-UI-6 by naming WCAG 2.1 AA as the platform's binding accessibility conformance target (NFR-041), while stating that full-catalogue conformance beyond the 2 axe-checked routes is unknown and unaudited (NFR-042/043), and records this as a new, narrower open question (OQ-NFR-4) rather than treating OQ-UI-6 as fully closed. Adds 7 hard non-goals (`NO-NFR-1`–`7`, most notably: does not itself perform a load test, penetration test, or DR drill, and does not claim any DPIA/DCB0129/MHRA/DTAC/CIS2 progress), 5 edge cases, and 7 open questions. Recommends Chapter 20 (Acceptance & Validation) as the next chapter to draft. |
| 0.19 | 27 July 2026 | Chapter 20 (Acceptance & Validation) drafted, continuing Part F, grounded in a light-read pass over `package.json`'s test scripts (`test:clinical-proof`'s 29 chained suites, `test:workflow`, `test:e2e`/`test:e2e:clinical-proof`, `eval:agents`, `typecheck`), `docs/AGENT_EVAL_HARNESS.md` (confirming the golden-case scorecard covers SYNTHESIS/GUARDIAN/ORACLE only, 3 of the 12-agent `AGENT_DIRECTORY`), `docs/QA_TRACEABILITY_MATRIX.md` (the platform's only existing traceability artefact, using its own pre-Volume-I `REQ-<nnn>` scheme with no row yet citing a Volume I `FR-*`/`AC-*` id), `docs/evidence-pack/README.md` plus its three gate checklists (`gate-1-platform-readiness.md`, `gate-2-clinical-safety.md`, `gate-3-pilot-authority.md`), and `docs/BUILT_VS_REMAINING_AUDIT.md`'s Track A "GO WITH LIGHT POLISH" / Track B "NO-GO by design" split. Defines a seven-level validation hierarchy (Unit → Integration → E2E → Clinical-proof → Agent eval → Manual clinical safety review → Partner gate), a binding traceability rule (every `FR-*`/`AC-*`/`BR-*` mappable to a test, an evidence artefact, or an explicit `GAP`/`BLOCKED: partner`/`DEFERRED` marker) adopting the existing traceability matrix's status vocabulary rather than inventing a new one, an eleven-area acceptance-suite table (HITL, Agents/CONDUCTOR, Diabetes, Twin, Population, Patient, Research, Learning, Journeys, UI, NFRs) naming each area's genuine test coverage honestly — including a new finding that no test in `tests/` imports any of the 9 Diabetes signal-builder files (restating Chapter 8's "v1 wiring not started" at the coverage layer) — a Definition-of-Done checklist for Cursor-delivered changes extending Chapter 19's maintainability NFRs, and binding Demo-GO/Live-NHS-EMR-NO-GO criteria that adopt rather than redefine the existing Track A/B split and Gate 1–3 checklists. Carries 45 functional requirements (`FR-VAL-001`–`045`), 6 Given/When/Then acceptance criteria, 7 hard non-goals (`NO-VAL-1`–`7`, most notably: does not claim regulatory certification via this chapter, and does not re-key the existing traceability matrix into Volume I's id scheme), 5 edge cases, and 7 open questions. No code is introduced or modified by this chapter. Recommends Chapter 21 (Open Questions / Decisions Log) as the next chapter to draft. |
| 0.20 | 27 July 2026 | Chapter 21 (Open Questions & Decisions Log) drafted, continuing Part F, as a light-read consolidation pass rather than a new-content chapter: greps every `OQ-<CODE>-<n>` id stated across Chapters 3–20 (118 found, none renumbered or re-decided) into one master backlog (§21.2–21.7), organized by this Volume's own Part A–F structure, each entry restating its existing Owner and adding a short Blocks/Priority/Status classification; separately registers 22 already-made decisions (`DEC-001`–`022`) — HITL mandatoriness, CONDUCTOR-not-LangGraph, `liveEmis:false`, `autoRetrain:false`, Diabetes-as-9-signals-not-9-agents, the HORIZON/COMPASS/PATHWAY rename map, the Tech Stack ADR's Keep/Add-later/Avoid-now split, WCAG 2.1 AA, and the demo-grade-RBAC and Track A/B findings among them — each as a pointer to its existing `NO-*`/`BR-*`/`FR-*`/`NFR-*` origin, not a new decision authored here. Flags, as a de-duplication finding (§21.8), that several open questions recorded under different chapter-scoped ids are in fact one underlying decision restated multiple times (most notably the k-anonymity/minimum-cell threshold, appearing as `OQ-ARC-2`/`OQ-POP-1`/`OQ-BR-3`/`OQ-DATA-3`, and the SHIELD audit-write gap, appearing as `OQ-HITL-2`/`OQ-BR-2`/`OQ-RES-7`/`OQ-LEARN-6`). Proposes, but does not itself execute, an interim chapter-acceptance sign-off mechanism (§21.10) answering §0.5's long-standing "mechanism TBD" note and Chapter 20's `OQ-VAL-4` — recorded as `Proposed`, not `Closed`, pending Product/Architecture/Clinical Safety Lead ratification. Carries 6 functional requirements (`FR-OQ-001`–`006`), 6 hard non-goals (`NO-OQ-1`–`6`), and does not invent an answer to any of the 118 restated open questions. Recommends Chapter 22 (Appendices) — the Volume's final chapter — as the next and last chapter to draft. |
| 0.21 | 27 July 2026 | Chapter 22 (Appendices) drafted, completing Part F and **Volume I in full (22 of 22 chapters)** — a deliberately light, reference-only closing chapter per Chapter 21's own recommendation, built by cross-referencing rather than reprinting Chapters 1–21: **Appendix A** (glossary of ~45 platform terms — the 12+ named agents and the HORIZON/COMPASS/PATHWAY rename map, the four `HumanGateId`/four `SafetyRoute` values, the honesty-field set `liveEmis`/`autoRetrain`/`autoRetrainTriggered`/`physiologicalTwin`/`ehrWrite`/`hitlRequired`, the G-ML-1/2/3 gate sequence, `SharedPatientContext`, the disease-module pattern, Track A/B, and the k-anonymity/minimum-cell threshold, each cited to its origin chapter); **Appendix B** (a requirement-ID prefix index confirming, by grep against the drafted text, the exact `FR-<CODE>-nnn` range per chapter — Chapter 8 the largest at `FR-DIAB-001`–`058`, Chapters 1–2 using the Volume-wide `BO-`/`NO-`/`SC-` schemes instead of a chapter-coded `FR-` prefix — plus the `NFR-`/`BR-`/`OQ-`/`DEC-`/`AC-` ranges); **Appendix C** (a related-documents index, by path, of every ADR/spec/governance doc/evidence-pack artefact/audit this Volume cites rather than duplicates, grouped by category); **Appendix D** (the agent legacy→canonical rename map, restating DEC-008 as a standalone lookup table); **Appendix E** (a hard-constraints one-pager — the eight §16.1 top-priority entries plus the full `DEC-001`–`022` id list — as pointers only, no restated rule text); **Appendix F** (how an engineering agent, including Cursor, should use this Volume — restating and extending §0.3); **Appendix G** (the document change-control/amendment process — restating §0.5's status model and §21.10's decision-closure mechanism as the one amendment path, rather than a second one invented here); and **Appendix H** (a demo-credentials/seed-data pointer to `docs/DEMO_LAUNCH_CREDENTIALS.md` and `docs/DEMO_COHORT_SEED.md` — no credential value is reprinted in this Volume). Carries 6 functional requirements (`FR-APP-001`–`006`) and 6 hard non-goals (`NO-APP-1`–`6`), introduces no new product requirement, business rule, or open question of its own, and resolves Chapter 18's `OQ-UI-7` by recording (Appendix C) that the internal `/workspace`/`/review/ops` tooling inventory it raised remains explicitly out of scope for this appendix and for this Volume, consistent with Chapter 18's own `NO-UI-7`. **This completes Volume I: all 22 chapters are now [DRAFTED].** No file under `lib/`, `app/`, or `components/` is created or modified. Next steps (recorded, not executed, by this revision): Product/Architecture/Clinical Safety Lead chapter-by-chapter review and sign-off per §21.10; a `.docx` export per §0.3 once review begins; and Volume II, scope and content TBD by Product — this Volume does not draft, outline, or speculate on Volume II's content. |

---

## 1. Table of Contents

Sized for an estimated 80–100 pages at full completion (~3,000–4,500 words per drafted chapter, longer for Chapters 8, 15, and 16). Chapter codes in parentheses are the stable prefixes used for requirement IDs per §0.6.

**Part A — Foundations**

1. Product Vision & Objectives (`VIS`) — **[DRAFTED]**
2. Scope & Non-Scope (`SCP`) — **[DRAFTED]**
3. Personas & Stakeholders (`PER`) — **[DRAFTED]**
4. Platform Architecture — Product View (`ARC`) — **[DRAFTED]**
5. Clinical Safety & Human Oversight — HITL (`HITL`) — **[DRAFTED]**

**Part B — Platform Capabilities**

6. Core Platform Capabilities: Identity, Consent, Interop, Knowledge Fabric (`CORE`) — **[DRAFTED]**
7. Universal Agent Platform (12 agents as platform services) (`AGT`) — **[DRAFTED]**

**Part C — Disease Intelligence (Diabetes First)**

8. Disease Intelligence — Diabetes (`DIAB`) — **[DRAFTED]**
9. Digital Twin — Diabetes (`TWIN`) — **[DRAFTED]**

**Part D — Intelligence Layers (Phased)**

10. Population Intelligence (`POP`) — **[DRAFTED]**
11. Patient Intelligence (`PAT`) — **[DRAFTED]**
12. Clinical Intelligence (`CLIN`) — **[DRAFTED]**
13. Research Intelligence (`RES`) — **[DRAFTED]**
14. Continuous Learning — Governed (`LEARN`) — **[DRAFTED]**

**Part E — Experience & Workflows**

15. Workflows & User Journeys (`FLOW`) — **[DRAFTED]**
16. Business Rules Catalog (`BR`) — **[DRAFTED]**
17. Data Expectations (`DATA`) — **[DRAFTED]**
18. UI / Screen Definitions (`UI`) — **[DRAFTED]**

**Part F — Quality & Governance**

19. Non-Functional Requirements (`NFR`) — **[DRAFTED]**
20. Acceptance & Validation (`VAL`) — **[DRAFTED]**
21. Open Questions / Decisions Log (`OQ`) — **[DRAFTED]**
22. Appendices (`APP`) — **[DRAFTED]**

**Chapter count:** 22 chapters across 6 parts. **Drafted:** 22 of 22 — **Volume I is draft-complete.** Part A (Chapters 1–5), Part B (Chapters 6–7), Part C (Chapters 8–9), Part D (Chapters 10–14), Part E (Chapters 15–18), and Part F (Chapters 19–22: Non-Functional Requirements, Acceptance & Validation, Open Questions / Decisions Log, and Appendices) are all complete. No chapter has yet been marked **Accepted** (see §0.5, §21.10) — draft-complete means every chapter has reached functional-spec depth at least once, not that any chapter has been reviewed and signed off.

---

## 2. Chapter 1 — Product Vision & Objectives `[DRAFTED]`

### 1.1 Objective

Aksh Health is building the **Aksh Intelligence Platform**: a single, auditable, human-in-the-loop clinical intelligence layer that sits alongside a practice's existing systems of record (EHR/EMR) rather than replacing them. The platform's job is to turn scattered clinical signal — consultation notes, labs, medications, wearable/self-report data, and population context — into structured, explainable, clinician-reviewable drafts that a human decides on. It never decides on its own.

The platform is organized as nine layers (Core, Platform Agents, Disease Intelligence, Research Intelligence, Disease Digital Twins, Population Intelligence, Patient Intelligence, Clinical Intelligence, Continuous Learning — see `docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md`). Disease-specific capability is delivered as **modules that plug into this one platform**, reusing its orchestrator (CONDUCTOR), its audit system (SHIELD), its consent and identity primitives, and its governed continuous-learning loop — not as parallel products each with their own safety and audit infrastructure. **Aksh Diabetes is the first such module** and the first commercially positioned product built on the platform (§1.6).

The commercial thesis is narrow and testable: a GP practice, PCN, or ICS pilot site should be able to see — for a defined patient cohort with diabetes or diabetes risk — a coherent, explainable, clinically-reviewed set of signals (glucose, HbA1c, insulin, GLP-1, nutrition, exercise, behaviour, complications, prevention) surfaced through the same review workflow, audit trail, and safety gates already proven on the general clinical-intake pipeline. The platform does not need to prove nine new products; it needs to prove one module works end-to-end on infrastructure that already works.

This chapter states the objectives, non-objectives, and success criteria for the platform as a whole and for the Diabetes module as its first commercial instance. It intentionally does not restate architecture (Chapter 4), agent-level detail (Chapter 7), or Diabetes signal-level detail (Chapter 8) — those are separate chapters and separate ADR/spec companions per §0.4.

### 1.2 Background: the problem being solved

Primary care and disease-management teams work with fragmented signal: a consultation note here, a lab result there, a self-reported symptom in a different system, population risk context nobody has time to correlate by hand. Two failure modes recur when technology tries to fix this:

1. **Point tools that don't compose.** A risk calculator, a coding assistant, and a coaching app that don't share an audit trail, a consent model, or a review workflow create three places a clinician has to trust separately, and three places safety can silently diverge.
2. **Automation that oversteps.** Tools that auto-populate the record, auto-suggest a dose, or claim a diagnostic-grade prediction without a clinician in the loop create clinical risk and regulatory exposure disproportionate to the value delivered.

Aksh Health's answer is a platform where every capability — general clinical intake, medication safety, risk scoring, care coordination, and now diabetes-specific intelligence — shares **one** orchestrator, **one** audit trail, **one** consent model, and **one** non-negotiable rule: nothing reaches a patient record or a prescription without a human decision. Chapters 4–14 define each capability at requirement depth; this chapter defines why the platform exists and what "good" looks like for it.

### 1.3 Business Objectives

Numbered `BO-<n>`. Each is a `shall` statement — a commitment the product must satisfy, not an aspiration.

- **BO-1.** The platform shall provide one auditable clinical intelligence layer that composes clinical intake, medication safety, risk scoring, care coordination, and disease-specific intelligence through a single deterministic orchestrator and a single audit system, so that adding a new capability (including a new disease module) does not require a new safety or audit boundary.
- **BO-2.** The platform shall deliver Aksh Diabetes as its first disease-specific commercial module, demonstrating that a disease module can be built as data/feature modules feeding the existing risk (HORIZON) and safety (GUARDIAN) agents, without a dedicated per-disease orchestrator, audit trail, or authentication system.
- **BO-3.** The platform shall make every clinical-facing output explainable: every risk score, safety flag, or coaching draft shall carry a traceable rationale (contributing factors, evidence references, or explicit "non-diagnostic" framing) sufficient for a clinician to agree, disagree, or ask why, without needing to inspect model internals.
- **BO-4.** The platform shall require a human clinical decision (accept / reject / defer / override, with a reason where relevant) before any AI-generated clinical draft can be treated as final, persisted to a patient record, or acted upon — with no configuration path that removes this requirement for any user role.
- **BO-5.** The platform shall keep a complete, tamper-evident audit trail (SHIELD) of every clinical-facing AI output and every human decision on it, sufficient to reconstruct "what the system suggested, what evidence it cited, and what the clinician decided" for any case, at any later time.
- **BO-6.** The platform shall operate on synthetic and pilot-consented data only until a named regulatory and integration path (live EHR write, formal certification) is explicitly approved by clinical, regulatory, and commercial leadership — see Non-Objectives NO-2 through NO-6.
- **BO-7.** The platform shall be extensible to additional disease modules beyond Diabetes (e.g. cardiovascular, respiratory) using the same module-on-platform pattern established by BO-2, without requiring this Volume or the underlying platform architecture to be rewritten per disease.
- **BO-8.** The platform shall support the full population-to-individual continuum — population risk context, individual patient intelligence, and clinician-facing clinical intelligence — as complementary views over the same underlying signal, not as separate, inconsistent products (see Chapters 10–12 when drafted).
- **BO-9.** The platform shall improve itself only through a governed continuous-learning loop (prediction → clinician decision → eventual outcome → governed evaluation → gated release), never through silent or automatic retraining (see NO-7 and Chapter 14 when drafted).

### 1.4 Non-Objectives

Numbered `NO-<n>`. Each is a `shall not` statement. These are hard constraints inherited from prior ADRs and clinical-safety decisions; this Volume does not have authority to relax them (§0.4).

- **NO-1 (No autonomous clinical decisions).** The platform shall not make an autonomous clinical decision of any kind — including diagnosis, prescribing, dose change, or care-plan finalization — without a human clinician's explicit review and decision. This applies to every disease module, including Diabetes Insulin and GLP-1 intelligence, which are explanatory/advisory-only by design (`docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md`).
- **NO-2 (No automatic prescribing).** The platform shall never generate an executable prescription or an auto-applied dose change. Any medication- or dose-related output is a draft for clinician review only.
- **NO-3 (No EHR replacement).** The platform shall not position itself, or be built, as a replacement for a practice's EHR/EMR system of record (EMIS, SystmOne, or equivalent). It is an intelligence layer that sits alongside the EHR, not a competing record system.
- **NO-4 (No live EHR write).** The platform shall not perform a live write to a production EHR. The `liveEmis:false` flag shall remain hard (enforced in types and rejected at the API layer) until a separately governed decision explicitly changes this, with named regulatory, contractual, and technical sign-off — not as a byproduct of this Volume or any feature shipped under it.
- **NO-5 (No silent or automatic model retraining).** The platform shall not retrain, fine-tune, or otherwise silently update any model or scoring rule based on production or pilot data without passing through the governed release gate sequence (G-ML-1/2/3, `docs/GOVERNED_MODEL_RELEASE_SOP.md`). `autoRetrain:false` shall remain a literal, tested guarantee, not a policy statement alone.
- **NO-6 (No fake or implied certification).** The platform shall not claim, imply, or allow marketing/sales material to imply any regulatory or safety certification (e.g. UKCA/MHRA medical device classification, DCB0129/DCB0160, DTAC, CIS2 production accreditation) that has not actually been obtained. Where rehearsal artifacts (hazard logs, evidence packs, SOPs) exist in preparation for a future certification, they shall be labeled as rehearsal/preparation, not as the certification itself.
- **NO-7 (No un-explainable clinical output).** The platform shall not surface a clinical-facing risk score, safety flag, or recommendation that cannot be traced to stated inputs, rules, or evidence. A model or rule that cannot produce this trace shall not be shipped to a clinician-facing surface regardless of its accuracy.
- **NO-8 (No parallel safety/audit infrastructure per disease module).** A disease module (Diabetes or any future module) shall not introduce its own orchestrator, its own audit trail, or its own authentication/authorization system. It shall reuse CONDUCTOR, SHIELD, and the existing identity/consent primitives (BO-1, BO-2).
- **NO-9 (No real patient data without an explicit, governed decision).** The platform shall not ingest, process, or display real (non-synthetic, non-explicitly-pilot-consented) patient data under this Volume's current scope. Any transition to real patient data is a separate, explicitly governed decision requiring consent, DPIA, and regulatory review — it is not implied or unlocked by any requirement in this document.
- **NO-10 (No single-disease lock-in).** The platform shall not be architected in a way that hard-codes Diabetes-only assumptions into shared platform layers (Core, Platform Agents, Continuous Learning). Diabetes is the first module proving the pattern in BO-2/BO-7, not the platform's permanent sole subject.

### 1.5 Success Criteria

Success criteria are split into two explicitly labeled categories, per instruction: measurable gates the product can actually be checked against today or at defined pilot milestones, and aspirational commercial outcomes that are legitimate goals but are **not yet backed by a baseline measurement, a clinical trial, or a signed-off clinical claim**. Treating the second category as already achieved, or citing it externally without the noted confirmation, would violate NO-6.

#### 1.5.1 Measurable — demo, engineering, and pilot-gate criteria `[MEASURABLE]`

- **SC-1 [MEASURABLE].** 100% of clinical-facing AI drafts (SYNTHESIS, GUARDIAN, HORIZON, NEXUS, and any Diabetes-module contribution to them) require a recorded clinician decision (accept/reject/defer/override) before being treated as final, verified by automated test (`npm run test:clinical-proof` or successor suite).
- **SC-2 [MEASURABLE].** 0 (zero) live writes to a production EHR occur in any environment, verified by the `liveEmis:false` guard remaining enforced in code and rejected at the API layer, with no environment-specific override path.
- **SC-3 [MEASURABLE].** 100% of clinical-facing AI outputs that reach a clinician are captured in the SHIELD audit trail (hash-chained), verified by audit-coverage tests against every route/agent that produces a clinical-facing draft.
- **SC-4 [MEASURABLE].** 0 (zero) automatic model or rule updates occur outside the G-ML-1/2/3 governed release sequence, verified by `autoRetrainTriggered:false` remaining literal and tested on every continuous-learning code path.
- **SC-5 [MEASURABLE].** The Diabetes module ships its v0 (typed stubs) and v1 (rules/demo signals) phases exactly as scoped in `docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md`, with the stated exit criteria met: at least one demo patient with coherent diabetes-shaped data end-to-end, at least one HORIZON contribution and one GUARDIAN flag sourced from a Diabetes signal, and SHIELD audit confirmation for both.
- **SC-6 [MEASURABLE].** For any pilot site, 100% of Diabetes-module outputs shown to a clinician carry an explicit non-diagnostic / advisory label where applicable (HbA1c trend estimate, GLP-1 suitability signal, Insulin sensitivity estimate), verified by UI copy review and a fixed test fixture check.
- **SC-7 [MEASURABLE].** This Volume's chapter completion is tracked honestly: the DRAFTED/TODO ratio stated in the Table of Contents (§1) is kept accurate at every revision — a chapter is not marked DRAFTED unless it contains Purpose/Responsibilities/Inputs/Outputs/Triggers and `Given/When/Then` AC blocks, or the closest applicable equivalent for that chapter's type.
- **SC-8 [MEASURABLE].** Evidence-pack gates already defined in `docs/evidence-pack/` (platform readiness, clinical safety, pilot authority) remain the binding pilot-readiness bar; this Volume's Acceptance & Validation chapter (Chapter 20 §20.7) maps onto these gates rather than defining a competing readiness bar.

#### 1.5.2 Aspirational — commercial outcomes `[ASPIRATIONAL — NEEDS BASELINE / CLINICAL LEAD CONFIRMATION]`

These are legitimate long-term goals for the Diabetes module and the platform. None of them has a current baseline measurement, a completed clinical evaluation, or clinical-lead sign-off as of this version, and none should be quoted externally (sales, marketing, investor material) as an achieved result.

- **SC-9 [ASPIRATIONAL].** Reduced clinician time-per-case for diabetes-related review, relative to a pre-Aksh baseline. **Needs:** a defined baseline measurement protocol and a pilot site willing to measure it; no baseline currently exists.
- **SC-10 [ASPIRATIONAL].** Improved consistency of diabetes risk-factor documentation (fewer missed contributing factors) versus unaided clinician review. **Needs:** a clinical-lead-approved evaluation design (e.g. blinded chart-review comparison) — not yet scoped.
- **SC-11 [ASPIRATIONAL].** Positive clinician-reported trust/usability signal for Diabetes-module drafts (e.g. acceptance rate of GUARDIAN/HORIZON diabetes contributions, qualitative feedback). **Needs:** a pilot cohort large enough to be meaningful and an agreed survey/feedback instrument; not yet run.
- **SC-12 [ASPIRATIONAL].** Commercial pilot conversion (number of practices/PCNs/ICSs signing a paid pilot or contract following a Diabetes-module demonstration). **Needs:** commercial-lead-owned pipeline tracking; not a product-engineering measurable and must not be conflated with SC-1–SC-8.
- **SC-13 [ASPIRATIONAL].** Any claim of improved clinical outcome (e.g. HbA1c reduction, reduced hypoglycaemic events, reduced complication incidence) attributable to the platform. **Needs:** a formal clinical evaluation or trial designed and approved by a clinical lead and, if pursued for regulatory purposes, ethics/regulatory sign-off. **No such evaluation exists today, and no outcome claim shall be made without one** — this is a hard restatement of NO-6/NO-7, not merely an aspiration to phrase carefully.

### 1.6 First commercial product: Aksh Diabetes

Aksh Diabetes is the platform's first disease-specific commercial product, per BO-2. It is defined at spec depth in `docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md` and will be elevated to full product-requirement depth (Purpose/Responsibilities/Inputs/Outputs/Triggers/AC per signal area) in Chapter 8 of this Volume. For this chapter, the commercially relevant framing is:

- Diabetes was chosen as the first module because it is the platform's most clearly identified gap (Layer 3 — Disease Intelligence Agents, marked **Missing** in `docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md`) and because its nine intelligence areas (Glucose, HbA1c, Insulin, GLP-1, Nutrition, Exercise, Behaviour, Complications, Prevention) map cleanly onto existing platform surfaces (HORIZON risk contribution, GUARDIAN safety flags, the existing `CoachingDraft` pattern) without requiring new infrastructure.
- Commercial credibility depends on **not** overstating this module's maturity. As of this version, Diabetes-module code does not yet exist in the repository (`docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md` marks Layer 3 as Missing; the spec's `lib/disease-modules/diabetes/` path is "proposed, not yet created"). Chapter 8 requirements must be written so that "not yet built" and "built to v1 rules-based scope" and "v2 model-governed scope" remain clearly distinguishable states, matching the spec's own v0/v1/v2 phasing.
- The Digital Twin (Diabetes) specified in Chapter 9 is explicitly **not** a physiological simulation in its first shipped form — see the honesty requirement in the Diabetes spec (`physiologicalTwin:false` as a literal, tested field) and Chapter 9's own non-goals (NO-TWIN-1 through NO-TWIN-7).

### 1.7 Intelligence layer vs. EHR: the distinction that defines the product

This distinction is foundational enough to state directly in the vision chapter, not deferred to architecture:

| | Aksh Intelligence Platform | EHR / EMR (EMIS, SystmOne, etc.) |
| --- | --- | --- |
| **System of record?** | No. It does not claim to be the authoritative, legally-mandated clinical record. | Yes. Remains the system of record for the practice. |
| **Writes to the patient record?** | No live write (`liveEmis:false`, NO-4). Any staged/simulated write is explicitly labeled as such in the UI, never presented as a completed record write. | Yes — this is its core function. |
| **What it produces** | Drafts: risk contributions, safety flags, coaching talking points, referral suggestions — all reviewable, all attributable, all reversible before any downstream action. | The authoritative record entry, once a clinician (using whatever tool, including possibly Aksh-assisted drafting) commits it. |
| **Who decides** | The platform proposes; a human clinician disposes (BO-4, NO-1). | The clinician (or authorized staff), as today, using the EHR's own write path. |
| **Relationship** | Reads/derives from available signal (consented, synthetic today) to produce a draft that can inform what a clinician ultimately writes into the EHR — through the EHR's own normal workflow, not through an Aksh-mediated write. | Unaffected in its role; Aksh does not ask a practice to change its system of record. |

This is the distinction every future chapter must preserve: **Aksh Health is an intelligence layer that makes existing clinical work more informed, explainable, and audited — it is not, and does not aim to become, the record system a practice already trusts and is contractually/regulatorily bound to.**

---

## 3. Chapter 2 — Scope & Non-Scope `[DRAFTED]`

### 2.1 Purpose of this chapter

Chapter 1 stated why the platform exists and what "good" looks like. This chapter draws the boundary of what is actually being specified and built under the current program of work — geographically, functionally, and temporally — so that later chapters (3–22) each inherit a consistent, non-contradictory scope statement instead of re-litigating it per chapter.

### 2.2 In-scope

- **IS-1. Geography.** The United Kingdom / EU market is the active build target. (India-market work is explicitly paused per `docs/PRODUCT_AUDIT_AND_ROADMAP.md` and is out of scope for this Volume — see NS-1.)
- **IS-2. Platform.** The Aksh Intelligence Platform as defined by the 9-layer map (`docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md`): Core primitives (identity, consent, security, memory, knowledge graph, orchestrator, digital twin primitive, observability), the 12-agent Platform Agent directory, and the layer-by-layer intelligence capabilities (Disease Intelligence, Research Intelligence, Disease Digital Twins, Population/Patient/Clinical Intelligence, Continuous Learning).
- **IS-3. First disease module.** Aksh Diabetes, end-to-end: the 9 signal areas, HORIZON/GUARDIAN integration, coaching-draft outputs, and the governed v0 → v1 → v2 phasing defined in `docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md`.
- **IS-4. Data posture.** Synthetic cohort data (current), extending to explicitly pilot-consented data only under a separately governed decision (see NS-4). Real, non-consented patient data is never in scope under this Volume.
- **IS-5. Users.** Clinicians (GPs and practice staff) as primary reviewers/decision-makers; patients as recipients of coaching/companion surfaces (non-clinical-advice framing only); practice/ICS operations and commissioning stakeholders as consumers of population-level and readiness reporting; engineering, QA, and clinical safety as internal build/review stakeholders. Full definitions are Chapter 3's responsibility.
- **IS-6. Workflow surfaces.** The existing intake → draft → review → decision → evidence pipeline, and its extension to carry Diabetes-module signals through the same pipeline rather than a parallel one.
- **IS-7. Governance artifacts.** The evidence-pack gates, hazard log, governed model-release SOP, and continuous-learning loop remain in scope as the mechanisms by which this Volume's requirements are checked before any pilot or release milestone.

### 2.3 Out of scope (for this Volume, and in most cases for this phase of the product)

- **NS-1. India market.** Paused; not covered by this Volume. Any future India-specific requirements are a separate document, not a section to be added here without an explicit decision to resume that market.
- **NS-2. Disease modules beyond Diabetes.** Cardiovascular-specific, respiratory-specific, or other disease-specific intelligence beyond what already exists generically (e.g. HORIZON's composite CVD/T2D score) is out of scope for this Volume. BO-7 (Chapter 1) states the platform shall be *extensible* to them later; this Volume does not specify them now.
- **NS-3. Live EHR integration (Track B).** Per `docs/BUILT_VS_REMAINING_AUDIT.md`, live EMIS/SystmOne/IM1 write-back is explicitly **NO-GO** until partner agreements and a signed integration path exist. This Volume specifies the product assuming Track A (synthetic/demo/pilot, no live write) throughout; Track B is a future, separately gated program, not a phase implicitly unlocked by finishing this Volume.
- **NS-4. Real patient data / production clinical use.** Any use of real, identifiable patient data — including a paid pilot using real data — is out of scope until a named consent, DPIA, and regulatory review process is completed and separately approved. This Volume's requirements assume synthetic or explicitly-scoped pilot-consented data (see IS-4) and do not themselves constitute that approval.
- **NS-5. Formal regulatory certification.** UKCA/MHRA medical-device classification, DCB0129/DCB0160 formal sign-off, DTAC, and CIS2 production accreditation are not delivered by this Volume. Evidence-pack and hazard-log artifacts referenced in Chapter 20 (§20.7, NO-VAL-2) are preparation/rehearsal for these, not the certifications themselves (restates NO-6).
- **NS-6. New core infrastructure.** Per `docs/ADR_TECH_STACK_MODERNIZATION.md`, this Volume does not require and must not silently assume any "Avoid now" component (NestJS, FastAPI-as-backend, Temporal, LangGraph, Kafka, GraphQL, Qdrant, ClickHouse, BiomedCLIP/MedGemma, external research APIs). Any future chapter whose requirement appears to need one of these must flag it explicitly as blocked on the named trigger in that ADR, not assume it will be added.
- **NS-7. PRISM (Imaging Intelligence) and ATLAS (Clinical Research Agent).** Both remain Phase 2 / not built per the agent directory (`docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md`). Any imaging-pixel analysis or live external research-API integration is out of scope for this Volume.
- **NS-8. This Volume rewriting or superseding all program documentation.** This document does not attempt to restate, replace, or re-litigate every existing ADR, audit, or evidence-pack document. Where an existing document already answers a question at the right level of detail, this Volume cross-references it (§0.4) rather than duplicating or re-deriving it.
- **NS-9. Multi-volume program scope.** This is Volume I. Any subsequent Volumes in the broader documentation program (if and when commissioned) are out of scope for this document to define, name, or number. This Volume does not assume or imply the existence, contents, or numbering of any Volume II or beyond.

### 2.4 Phasing model this Volume inherits

This Volume does not invent a new phasing scheme. It inherits and must stay consistent with two existing phasing models:

1. **Track A / Track B** (`docs/BUILT_VS_REMAINING_AUDIT.md`): Track A (polished synthetic demo / pilot marketing) is the active, GO track. Track B (live NHS clinical / EMR integration) is NO-GO by design until partner and regulatory prerequisites are met. Every requirement in this Volume that touches EHR interaction must state which track it belongs to.
2. **v0 / v1 / v2 per disease module** (`docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md` for Diabetes): v0 = typed stubs, no behaviour; v1 = rules/demo signals wired into HORIZON/GUARDIAN; v2 = statistically/ML-modelled signals under the full governed release-gate sequence. Chapter 8 of this Volume must preserve this phasing rather than presenting Diabetes as a single monolithic requirement set.

### 2.5 Scope boundary statement

**In one sentence:** this Volume specifies a UK/EU, synthetic-and-pilot-data, human-in-the-loop clinical intelligence platform, with Aksh Diabetes as its first fully-specified disease module, operating strictly within Track A until a separately governed decision opens Track B — and it does so without requiring new core infrastructure beyond what `docs/ADR_TECH_STACK_MODERNIZATION.md` already designates as "Keep now."

---

## 4. Chapter 3 — Personas & Stakeholders `[DRAFTED]`

### 3.0 Purpose of this chapter

Chapters 1 and 2 defined why the platform exists and its boundary. Every chapter from here on (Architecture, HITL, Core Capabilities, Agent Platform, Diabetes, Workflows, UI) writes its Responsibilities/Inputs/Outputs/Triggers and `Given/When/Then` acceptance criteria in terms of specific human actors. This chapter fixes those actors once, so later chapters reference "the GP persona" or "the Patient persona" instead of informally re-defining who that is each time.

This chapter is grounded in what the product actually implements today, not an idealized persona set: the 8-role onboarding model (`lib/onboarding/roles.ts`, `UserRole`), the role-specific onboarding/tutorial paths (`lib/onboarding/role-paths.ts`), the two-tier authorization model (`lib/permission-matrix.ts`'s coarse `AppRole`, `lib/user-scope.ts`'s session-to-role mapping), and the tenant/patient isolation policy (`lib/clinical-proof/tenant-isolation.ts`). Where the current build's persona support is honestly narrower than a fully mature product would need (see §3.5, §3.6), this chapter states that gap explicitly rather than describing an aspirational RBAC system as if it already existed.

### 3.1 Persona model overview

The platform models each human actor at three levels, all of which already exist in code and must stay consistent with each other:

| Level | Type | Cardinality | Purpose | Source |
| --- | --- | --- | --- | --- |
| **Fine-grained role** | `UserRole` | 8 values: `gp`, `nurse`, `clinical-pharmacist`, `practice-manager`, `ics-lead`, `hospital-executive`, `patient`, `researcher` | Drives onboarding steps, dashboard routing, tutorial content, and per-role agent framing. | `lib/onboarding/roles.ts` |
| **Dashboard role** | `DashboardRole` | Same 8, with shorthand ids (`pharmacist`, `admin`, `ics`, `hospital`) | Drives which dashboard shell and workspace state (Zustand store) a session hydrates. | `lib/zustand/dashboardStore.ts` |
| **Coarse app role** | `AppRole` | 2 values: `clinical_reviewer`, `operations_lead` | Drives the binary permission matrix (case queue, exports, ops dashboard, demo reset) independent of the finer persona distinctions. | `lib/permission-matrix.ts`, `lib/user-scope.ts` (`mapSessionRoleToAppRole`) |

**FR-PER-001.** The platform shall support exactly the 8 fine-grained personas listed in §3.1 as first-class `UserRole` values at sign-up, onboarding, and session level. This Volume does not introduce a 9th primary persona without a corresponding update to `lib/onboarding/roles.ts` and this chapter together — the two shall never be allowed to drift apart.

**FR-PER-002.** Every fine-grained `UserRole` shall map deterministically to exactly one `AppRole` for permission-matrix purposes, per the existing mapping: `gp`, `nurse`, `clinical-pharmacist` → `clinical_reviewer`; `practice-manager`, `ics-lead`, `hospital-executive` → `operations_lead`; `patient` and `researcher` are clinical, non-operations personas and shall never be silently promoted to `operations_lead` (see Open Question OQ-PER-2, §3.7, on their current mapping gap).

> **AC-PER-002-1.** Given a session with `role = "practice-manager"`, when `mapSessionRoleToAppRole` resolves the app role, then it shall return `operations_lead`, not `clinical_reviewer`.
> **AC-PER-002-2.** Given a session with `role = "gp"`, `"nurse"`, or `"clinical-pharmacist"`, when the app role is resolved, then it shall return `clinical_reviewer`.

### 3.2 Primary personas

Each persona below follows the same structure: Purpose, Goals & jobs-to-be-done, key tasks in Aksh, data they see, actions they may take, HITL responsibilities, and what they must not do. "Primary surface" is cross-referenced against the mapping table in §3.4.

#### 3.2.1 GP / Clinician (`gp`)

- **Purpose.** The accountable clinical decision-maker. Every AI-generated clinical draft in the platform exists to be reviewed, and ultimately accepted, edited, or rejected, by a GP or an equivalently accountable clinician.
- **Goals & JTBD.** Clear a review queue efficiently without missing a safety flag; trust that a risk score or interaction alert is explainable before acting on it; spend less time on documentation, not less time on judgment.
- **Key tasks in Aksh.** Work the review queue (`/dashboard/gp`); accept/edit/reject SYNTHESIS SOAP drafts, Dr.Assist coding suggestions, GUARDIAN interaction/allergy flags, HORIZON risk drafts, and PATHWAY referral drafts; dictate via VOICE into CANVAS; review case detail and evidence (`/cases/[id]`).
- **Data they see.** Full clinical record view for patients within their own practice (per tenant isolation, §3.6): consultation history, medications, allergies, labs, risk factors, audit history for their own decisions.
- **Actions they may take.** Accept / Edit / Reject any clinical draft; add reviewer notes and override reasons; trigger BRIDGE staging (sim-only) on acceptance; escalate via PATHWAY.
- **HITL responsibilities.** The GP **is** the human in the loop for every clinical-facing agent output reaching their queue (BO-4, Chapter 1). No draft becomes final without their decision.
- **Must NOT do.** Must not be bypassed by any automated finalization path; must not have their Accept substituted by another role (e.g. practice-manager cannot Accept a clinical draft on a GP's behalf — see FR-PER-010); must not receive a live EHR write believing it already happened (`liveEmis:false` framing, NO-4).
- **Primary surface.** `/dashboard/gp`, `/review`, `/cases/[id]`.

#### 3.2.2 Nurse / Care Coordinator (`nurse`)

- **Purpose.** Front-line observation capture and care coordination, with the same HITL discipline as the GP persona but scoped to observations, handover, and safety-alert follow-up rather than prescribing-adjacent decisions.
- **Goals & JTBD.** Record observations quickly and accurately; produce a trustworthy shift handover; make sure a GUARDIAN alert reaches the right clinical follow-up.
- **Key tasks in Aksh.** Structured observation capture via CANVAS; review/confirm SYNTHESIS handover drafts; triage GUARDIAN safety alerts for follow-up; log PATHWAY-linked follow-up tasks.
- **Data they see.** Patient observations, handover drafts, and safety alerts for patients within their practice/ward scope. Same tenant boundary as GP (§3.6).
- **Actions they may take.** Confirm observation entries; confirm/edit handover drafts before they append to the audited record; escalate a GUARDIAN alert to a GP/pharmacist rather than resolving a prescribing-adjacent decision themselves.
- **HITL responsibilities.** Confirms observation and handover drafts before they are treated as final; is not the accountable decision-maker for medication or diagnosis changes — those route to GP/pharmacist.
- **Must NOT do.** Must not finalize a medication-related GUARDIAN flag as if it were a prescribing decision; must not write directly to the EHR (`liveEmis:false`).
- **Primary surface.** `/dashboard/nurse`.

#### 3.2.3 Clinical Pharmacist (`clinical-pharmacist`)

- **Purpose.** Medication safety specialist — the primary accountable reviewer for GUARDIAN drug-interaction and allergy output ahead of, or alongside, the GP.
- **Goals & JTBD.** Clear medication-review queues; resolve interaction/allergy flags with confidence in the evidence (BNF-backed rules); avoid missing a high-severity interaction.
- **Key tasks in Aksh.** Work medication-review queue; run/clear GUARDIAN interaction checks; document med-review outcomes via SYNTHESIS drafts.
- **Data they see.** Current medication list, allergy record, interaction history for patients within their practice scope.
- **Actions they may take.** Accept / Edit / Reject GUARDIAN interaction recommendations and med-review drafts; trigger BRIDGE staging (sim-only) on acceptance.
- **HITL responsibilities.** Is the human decision-maker for medication-safety drafts routed to them; equally bound by BO-4/NO-1/NO-2 — no interaction flag or dose-adjacent output is ever auto-applied.
- **Must NOT do.** Must not accept a dose-change suggestion that the Diabetes Insulin/GLP-1 modules (Chapter 8, when drafted) are explicitly barred from generating as an executable action (NO-2) — any such draft is explanatory only, and the pharmacist's Accept records a clinical judgment, not an automated dosing action.
- **Primary surface.** `/dashboard/pharmacist`.

#### 3.2.4 Practice Manager / Admin (`practice-manager`)

- **Purpose.** Operational oversight of the practice's use of the platform — integration posture, audit health, queue throughput, and user administration — explicitly **not** a clinical decision-maker.
- **Goals & JTBD.** Confirm the practice's integration/audit posture is healthy; manage user access; understand whether clinicians are clearing their queues; never be put in a position of having to make a clinical call.
- **Key tasks in Aksh.** View BRIDGE/integration honesty status; review SHIELD audit samples; manage user invitations and status; monitor CANVAS intake volume as a workload signal.
- **Data they see.** Aggregate/operational data (queue throughput, audit summaries, integration status, user roster) — not individual clinical record detail (see `CLINICAL_RECORD_DENIED_ROLES`, §3.6).
- **Actions they may take.** Invite/manage users; view (not decide) audit and integration status; trigger a deterministic demo-data reset in non-production environments.
- **HITL responsibilities.** None for clinical drafts — this persona is explicitly excluded from clinical Accept/Reject (`youApprove` in `lib/onboarding/role-paths.ts`: *"You do not Accept clinical SOAP or meds"*). Its HITL-adjacent responsibility is administrative: making sure clinicians, not the practice-manager, are the ones clearing the queue.
- **Must NOT do.** Must not access individual patient clinical records via clinical APIs (enforced by `CLINICAL_RECORD_DENIED_ROLES`); must not Accept, Edit, or Reject a clinical draft under any circumstance, including "on behalf of" a clinician; must not be given a UI path that implies otherwise.
- **Primary surface.** `/dashboard/admin`.

#### 3.2.5 ICS Lead / Clinical Informatics (`ics-lead`)

- **Purpose.** Population-level and equity-focused planning across practices within an Integrated Care System, on aggregate synthetic-cohort data — a population-intelligence consumer, not an individual-case reviewer.
- **Goals & JTBD.** Understand population risk distribution and equity (IMD-linked) patterns; use aggregate forecasts for system planning; benchmark practices.
- **Key tasks in Aksh.** View COMPASS equity/population views; view HORIZON aggregate risk-state forecasts; review PATHWAY system-level pathway patterns; export governed aggregate reports.
- **Data they see.** Aggregate, de-identified population views only — no individual patient-level clinical detail by default (`CLINICAL_RECORD_DENIED_ROLES`; "no patient-level spill by default" per `honestyNote`).
- **Actions they may take.** Configure aggregate views (date range, IMD overlay); export SHIELD-audited aggregate reports.
- **HITL responsibilities.** None on individual clinical drafts — site clinicians retain HITL on any patient-level draft. This persona's own "decisions" (e.g. acting on a population signal) are planning decisions, not clinical ones, and are out of this platform's clinical-safety gate scope by design.
- **Must NOT do.** Must not be granted a patient-level clinical view without an explicit, separately governed exception; must not treat an aggregate forecast as a live PAS/EPR feed (it is synthetic-cohort scaffolding, per the layer-map ADR's Layer 6 status).
- **Primary surface.** `/dashboard/ics` (alternate: `/dashboard/regional`).

#### 3.2.6 Hospital Executive (`hospital-executive`)

- **Purpose.** Operational leadership view (capacity, staffing, flow) at hospital/command-centre level, on synthetic PAS-shaped data — analogous in scope posture to the ICS Lead persona but at hospital rather than system level.
- **Goals & JTBD.** Monitor ward status, capacity forecasts, and staffing alerts; act on operational recommendations without being handed unvetted automation.
- **Key tasks in Aksh.** View Command Centre (wards, capacity, staffing); review HORIZON demand/surge drafts and PATHWAY flow/discharge coordination drafts.
- **Data they see.** Aggregate operational/capacity data (synthetic), not individual patient clinical records by default.
- **Actions they may take.** Accept/dismiss operational (capacity/staffing) recommendations; ward clinicians, not this persona, accept any clinical-care draft that arises within that operational context.
- **HITL responsibilities.** Is the human decision-maker for operational recommendations only (e.g. a capacity/staffing suggestion) — not for clinical care drafts, which remain gated to ward clinical staff.
- **Must NOT do.** Must not treat Command Centre feeds as a live PAS/EPR connection (explicitly synthetic, `liveEmis:false`-adjacent honesty); must not Accept a clinical-care draft.
- **Primary surface.** `/dashboard/hospital`.

#### 3.2.7 Patient (`patient`)

- **Purpose.** The subject of care, using a practice-invited companion surface to see their own information and complete self-report check-ins — never a clinical decision-maker for their own record.
- **Goals & JTBD.** Understand their conditions, medications, and care team in plain English; complete check-ins; raise concerns; see (not edit) their care plan and consent grants.
- **Key tasks in Aksh.** Use "My Health" companion view; complete self-report check-ins (e.g. diabetes-relevant self-report feeding Nutrition/Exercise/Behaviour coaching per the Diabetes spec, Chapter 8); view care-plan draft and consent purpose grants; ask questions via a GP-gated escalation path.
- **Data they see.** Only their own bound patient record (`evaluatePatientUrlAccess`, §3.6) — conditions, medications, care team, care-plan draft, their own consent grants.
- **Actions they may take.** Submit self-report check-in data; view (not finalize) care-plan drafts; grant/revoke purpose-bound consent (`lib/precision-health/consent.ts` purpose codes: `care_delivery`, `care_improvement`, `clinical_research_deidentified`, `population_analytics`, `coaching_wellness`, `risk_stratification_demo`); raise a concern that escalates to their care team.
- **HITL responsibilities.** None as a clinical approver — the patient's own GP/nurse/pharmacist retain HITL over any clinical draft concerning them. The patient's "human in the loop" role is limited to consenting to data use and reporting self-observed information, not clinically dispositioning AI output.
- **Must NOT do.** Must not be able to view another patient's record (tenant/patient isolation, §3.6); must not be presented any coaching output as clinical advice (`isClinicalAdvice:false` on every coaching draft, per the Diabetes spec and `lib/precision-health/coaching.ts`); must not be able to trigger any EHR write, live or simulated, directly.
- **Primary surface.** `/dashboard/patient` ("My Health").

#### 3.2.8 Researcher / Analyst (`researcher`)

- **Purpose.** Governed, ethics-gated consumer of aggregate and (in restricted, explicitly-approved cases) individual-level data for evaluation and research purposes — bound by the strongest data-minimisation posture of any persona.
- **Goals & JTBD.** Run cohort evaluations under an approved ethics reference; access data at the minimum level of identifiability needed; trust that every query/export is audited.
- **Key tasks in Aksh.** Start from an ethics empty-state; configure cohort evaluation and data-access level (aggregate by default); review outcome evaluation exports; (Phase 2, not built) eventually work with ATLAS.
- **Data they see.** Aggregate/de-identified data by default; individual-level access only when a specific ethics reference is confirmed and the access level is explicitly elevated (`dataAccessLevel` preference, `lib/onboarding/role-paths.ts`) — this is a UI/workflow gate today, not yet a hardened server-side ethics-approval enforcement (see OQ-PER-3, §3.7).
- **Actions they may take.** Configure and run governed cohort queries/evaluations; export SHIELD-audited results; select aggregate vs. individual access level (with the ethics caveat above).
- **HITL responsibilities.** None on clinical drafts — site clinicians retain HITL on any patient-level draft. This persona's own gate is the ethics/data-minimisation check on what data it may see at all, not a clinical decision gate.
- **Must NOT do.** Must not access identifiable patient-level data without a confirmed ethics reference; must not be told or shown that ATLAS (Clinical Research Agent) is live — it is Phase 2 and explicitly `live:false` in the agent directory; must not export data outside the governed, audited export path.
- **Primary surface.** `/dashboard/researcher`.

### 3.3 Secondary stakeholders

These are not `UserRole` values in the product today (they do not sign up or authenticate as such) but are essential audiences for this Volume and for the governance mechanisms it depends on. They are stakeholders of the specification and of the release process, not personas of the running application.

| Stakeholder | Role in the program | Where they engage |
| --- | --- | --- |
| **Clinical Safety Lead** | Owns HITL gate design, hazard log, and the G-ML-1/2/3 clinical sign-off gate (`docs/GOVERNED_MODEL_RELEASE_SOP.md`). Reviews and must approve Chapter 5 (Clinical Safety & HITL) and any chapter introducing a new gate type. | Hazard log, evidence-pack gates, governed-release sign-off; not a logged-in application persona. |
| **Compliance / Regulatory** | Owns the honest positioning of certification status (NO-6) and the eventual DCB0129/DTAC/CIS2/MHRA path, if and when pursued. Reviews any chapter making a regulatory-adjacent claim. | `docs/evidence-pack/`, `docs/BUILT_VS_REMAINING_AUDIT.md` Track A/B framing. |
| **Engineering / Platform team** | Implements chapters against their `FR-*`/`AC-*` IDs (§0.6); maintains CONDUCTOR, SHIELD, and the shared platform primitives that every persona and every disease module depends on (BO-1, NO-8). | Consumes this Volume via Cursor per §0.3; the primary "reader" of `Given/When/Then` blocks. |
| **QA** | Derives test cases from AC blocks; owns `npm run test:clinical-proof` and successor suites verifying SC-1 through SC-8 (Chapter 1). | Test suites, evidence-pack validation artifacts. |
| **Partner EHR (EMIS / SystmOne, via Medplum rehearsal)** | Not a human stakeholder inside this program, but the external system every "no live write" (NO-4) and "not an EHR replacement" (NO-3) statement is defined against. Any future live-integration work is a separately governed Track B decision (§2.3, NS-3). | `lib/medplum-client.ts` rehearsal client; referenced, not owned, by this Volume. |

### 3.4 Persona → surface / workspace mapping

| Persona (`UserRole`) | Dashboard role | Primary surface | Primary agents encountered | App role (`AppRole`) |
| --- | --- | --- | --- | --- |
| `gp` | `gp` | `/dashboard/gp`, `/review`, `/cases/[id]` | CANVAS, VOICE, SYNTHESIS, Dr.Assist, GUARDIAN, HORIZON, PATHWAY, CONDUCTOR, BRIDGE, SHIELD | `clinical_reviewer` |
| `nurse` | `nurse` | `/dashboard/nurse` | CANVAS, SYNTHESIS, GUARDIAN, PATHWAY, SHIELD, CONDUCTOR | `clinical_reviewer` |
| `clinical-pharmacist` | `pharmacist` | `/dashboard/pharmacist` | GUARDIAN, SYNTHESIS, CONDUCTOR, BRIDGE, SHIELD | `clinical_reviewer` |
| `practice-manager` | `admin` | `/dashboard/admin` | CONDUCTOR (queue health), BRIDGE, SHIELD, CANVAS (volume signal) | `operations_lead` |
| `ics-lead` | `ics` | `/dashboard/ics` (alt: `/dashboard/regional`) | COMPASS, HORIZON, PATHWAY, CONDUCTOR, SHIELD, BRIDGE | `operations_lead` |
| `hospital-executive` | `hospital` | `/dashboard/hospital` | HORIZON, PATHWAY, COMPASS, CONDUCTOR, SHIELD, BRIDGE | `operations_lead` |
| `patient` | `patient` | `/dashboard/patient` ("My Health") | CANVAS, SYNTHESIS, PATHWAY, GUARDIAN, SHIELD (all read/consumption-only) | *(not mapped — see OQ-PER-2)* |
| `researcher` | `researcher` | `/dashboard/researcher` | ATLAS (Phase 2, not live), COMPASS, SHIELD, HORIZON, BRIDGE | *(not mapped — see OQ-PER-2)* |

### 3.5 Authentication & authorization requirements

This section states requirements at the product level. It deliberately does not restate the NextAuth/JWT implementation detail already correct in `lib/auth.ts` — it states what must remain true regardless of implementation.

- **FR-PER-003.** The platform shall authenticate every session-bearing user via a single identity system (currently NextAuth with a credentials provider and an optional clinical-OAuth provider) before granting access to any role-scoped dashboard or API.
- **FR-PER-004.** Every authenticated session shall carry exactly one `UserRole` at a time. The platform shall not support a single session simultaneously acting as two personas (e.g. `gp` and `practice-manager`) without an explicit, audited role switch.
- **FR-PER-005.** The platform shall enforce authorization decisions (clinical-record access, ops-dashboard access, demo-reset access) on the server side, independent of any client-side UI restriction. A hidden button is not an access control.
- **FR-PER-006.** The platform shall scope every clinical-record-bearing API response to the requesting practice (tenant isolation) and, for the `patient` persona, to their own bound patient id only.

> **AC-PER-006-1.** Given a GP authenticated for Practice A, when they request case records, then the platform shall return only records where `practiceId` resolves to Practice A, never Practice B, even if a Practice B record id is supplied directly.
> **AC-PER-006-2.** Given a patient with bound patient id `P014`, when they request patient record `P002` via URL/query, then the platform shall deny the request (403), per `evaluatePatientUrlAccess`.

- **FR-PER-007.** The platform shall deny individual clinical-record API access to operational/aggregate personas (`practice-manager`, `ics-lead`, `hospital-executive`, `researcher`) by default, per `CLINICAL_RECORD_DENIED_ROLES`. Any exception (e.g. a researcher's approved individual-level access) shall require an explicit, separately audited elevation, not a default permission.
- **FR-PER-008.** The platform shall record every role-permission decision it enforces (allowed/scoped/denied) in a way that can be reproduced and audited — today via the documented permission matrix (`lib/permission-matrix.ts`); the matrix itself must remain the single source of truth cross-referenced by this chapter, not duplicated with different values elsewhere.
- **FR-PER-009.** The platform shall never allow a non-clinical persona (`practice-manager`, `ics-lead`, `hospital-executive`, `researcher`) to record a clinical Accept/Edit/Reject decision on a SYNTHESIS, GUARDIAN, HORIZON, or Diabetes-module draft.

> **AC-PER-009-1.** Given a `practice-manager` session, when a request attempts to record a decision against a clinical review-case id, then the platform shall reject the request regardless of any client-supplied role claim, verified server-side against the authenticated session's role.

- **FR-PER-010.** The platform shall keep the fine-grained `UserRole` (drives UX/tutorial/dashboard) and the coarse `AppRole` (drives permission enforcement) as two explicitly linked but distinct concepts (§3.1), so that adding a 9th fine-grained persona in the future does not require redesigning the permission matrix — only extending the mapping in FR-PER-002.

**Honest current-state note (binding on this chapter, not a requirement to be implemented further without a decision):** as recorded directly in the codebase (`lib/permission-matrix.ts`: `productionRbacEnforced: false`), the current build's authorization is demo-grade — "this matrix documents intended boundaries rather than production RBAC enforcement," using demo auth and scoped JSON/Postgres stores rather than a hardened production RBAC/multi-tenant system. FR-PER-005 through FR-PER-009 state the *target* behavior this Volume requires; §3.7 (Open Questions) records the gap between that target and today's enforcement maturity, which must be closed before any Track B (live EHR) or real-patient-data milestone (NS-3, NS-4, Chapter 1).

### 3.6 Edge cases

- **FR-PER-011 (Wrong role assigned or requested).** If a session's role does not match a role required by a requested surface or action, the platform shall deny access or redirect to the session's correct dashboard (`resolveDashboardPath`) rather than silently granting the requested surface at a different privilege level.

> **AC-PER-011-1.** Given a `nurse` session, when it requests `/dashboard/admin`, then the platform shall redirect to `/dashboard/nurse` (or an equivalent denial), never render the admin surface.

- **FR-PER-012 (Revoked consent).** If a patient's consent grant for a given purpose code (`lib/precision-health/consent.ts`) is `revoked`, the platform shall not use that patient's data for that purpose in any subsequent draft generation, coaching output, or aggregate inclusion, starting from the point of revocation.

> **AC-PER-012-1.** Given a patient whose `coaching_wellness` consent grant status is `revoked`, when a coaching-draft generation job runs for that patient, then it shall exclude that patient rather than generate a draft under the revoked purpose.
> **AC-PER-012-2.** Given a revoked consent grant, when SHIELD records the revocation, then the audit entry shall include `revokedAt` and `revokedBy`, per the existing `ConsentGrant` type — this chapter does not introduce a new audit shape for revocation.

- **FR-PER-013 (Demo vs. live identity).** The platform shall never allow a demo/synthetic identity (`@demo.akshhealth.com` cohort accounts, or any synthetic seed identity) to be presented, in any UI surface or exported artifact, as if it were a live NHS/CIS2 identity or a real patient. Every demo/synthetic session shall remain visibly and structurally distinguishable from a (currently unimplemented) live clinical identity path.

> **AC-PER-013-1.** Given a session authenticated with a `@demo.akshhealth.com` cohort account, when any dashboard renders, then it shall not display language implying live NHS identity or a live EMIS/SystmOne connection (consistent with the "Say / Do not say" table in `docs/DEMO_LAUNCH_CREDENTIALS.md`).

- **FR-PER-014 (Cross-practice / cross-tenant access attempt).** Any attempt, whether via direct API call, crafted URL, or client-side state manipulation, to access another practice's records or another patient's bound record shall be denied server-side and shall not depend on the requesting UI having hidden the option (restates FR-PER-005/FR-PER-006 as an explicit adversarial case, and is the basis for the existing `assertPracticeCannotSeeOtherPractice` test contract).
- **FR-PER-015 (Session role change mid-session).** If a user's role changes (e.g. an admin reassigns a user from `nurse` to `clinical-pharmacist`), the platform shall require the session to refresh its role claim (JWT `update` trigger, per `lib/auth.ts`) before the new role's permissions take effect — a stale session shall not silently retain a superseded role's access.

### 3.7 Open questions / decisions needed

- **OQ-PER-1.** Confirm the intended `AppRole` mapping for `patient` and `researcher` (§3.4 marks these "not mapped"). Today `mapSessionRoleToAppRole` defaults any unrecognized role string to `clinical_reviewer`, which would be an incorrect default for `patient` (a patient must never be treated as a clinical reviewer for permission-matrix purposes). This needs an explicit decision and, likely, a third `AppRole` value or an explicit denial-default — not a silent fallback. **Owner:** Engineering + Clinical Safety.
- **OQ-PER-2.** Confirm whether `patient` and `researcher` need their own `AppRole` bucket(s) rather than inheriting the binary `clinical_reviewer`/`operations_lead` split, given neither persona should have `clinical_reviewer`-level case-queue access nor full `operations_lead` scope. **Owner:** Architecture + Product.
- **OQ-PER-3.** Confirm what "ethics reference confirmed" means operationally for the Researcher persona's individual-level data-access elevation (`dataAccessLevel` preference) — today this is a UI/preference-level signal, not a verified server-side ethics-approval check. Needs a decision on whether a lightweight approval record is required before any pilot exposes this path beyond synthetic data. **Owner:** Clinical Safety + Compliance.
- **OQ-PER-4.** Confirm the path and named trigger for moving `productionRbacEnforced` from `false` to `true` (§3.5) — this is a prerequisite for any Track B (live EHR) milestone and should be scoped as its own workstream, not assumed to happen incidentally while building disease modules. **Owner:** Architecture + Engineering.
- **OQ-PER-5.** Confirm whether a distinct "Clinical Safety Lead" or "Compliance" login/persona should ever become a first-class `UserRole` (e.g. for in-app hazard-log or evidence-pack sign-off) or whether these stakeholders remain out-of-band (email/SOP-driven) indefinitely, as `docs/GOVERNED_MODEL_RELEASE_SOP.md` currently assumes. **Owner:** Product + Clinical Safety.

### 3.8 Cross-references

- Chapter 1 (§1.4 NO-1, NO-4, NO-9) — the non-objectives every persona's "must not do" list restates in persona-specific terms.
- Chapter 2 (§2.2 IS-5) — the persona list first named at scope level; this chapter is its full elaboration.
- `docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md` — Layer 1 Identity/Consent status ("Partial... proof-grade auth, not CIS2/production RBAC"), which this chapter's §3.5 honest current-state note is directly consistent with.
- Chapter 5 (Clinical Safety & HITL, `[DRAFTED]`) defines the HITL gate mechanics this chapter only states responsibilities for (e.g. exactly what "Accept/Edit/Reject" requires as an audit-grade action).
- Chapter 8 (Disease Intelligence — Diabetes, `[DRAFTED]`) reuses the GP and Pharmacist personas' HITL responsibilities unchanged for Insulin/GLP-1 signal review (per `docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md`).

---

## 5. Chapter 4 — Platform Architecture (Product View) `[DRAFTED]`

### 4.0 Purpose of this chapter

This chapter describes the platform's shape from a **product** vantage point: what layers and modules exist, what each one must provide to the rest of the product, how they compose, and where the boundary between "this platform" and "the outside world" (EHR, wearables, partner systems) sits. It is deliberately **not** a technology-stack deep dive — that is `docs/ADR_TECH_STACK_MODERNIZATION.md`'s job, and this chapter cross-references rather than re-litigates it (no NestJS/Kafka/Temporal/Qdrant discussion here). It is also not a repeat of the Layer Map ADR's exists/partial/missing audit — it takes that audit as ground truth and states, for each layer, what the *product* requires that layer to deliver, in `shall` form, so later chapters (6–14) can build on a fixed architectural vocabulary instead of each re-deriving it.

### 4.1 Platform framing

- **FR-ARC-001.** The platform shall present itself, architecturally and commercially, as one **Aksh Intelligence Platform** — a set of layered capabilities (§4.2) that disease modules plug into — not as a collection of independently-branded point products (restates Chapter 1 BO-1/BO-2).
- **FR-ARC-002.** The platform shall treat Diabetes as the first Disease Intelligence module proving the "module on a platform" pattern (Chapter 1 BO-2), and shall keep the pattern generalizable enough that a second disease module (e.g. cardiovascular, renal) can be added by repeating the same module shape, not by extending the platform's core layers with disease-specific logic (elaborated in §4.8).
- **FR-ARC-003.** The platform's product architecture shall be described using the nine-layer vocabulary already adopted in `docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md` (Core, Platform Agents, Disease Intelligence, Research Intelligence, Disease Digital Twins, Population Intelligence, Patient Intelligence, Clinical Intelligence, Continuous Learning). This chapter does not introduce a competing or renamed layer scheme.

### 4.2 Layer map as product architecture

The table below restates each layer's **current build status** from the Layer Map ADR (source of truth for exists/partial/missing — this chapter does not re-derive it) alongside the **product requirement** for what that layer must provide once mature. A "Partial" or "Missing" status is not itself a defect this Volume asks to be fixed on any particular timeline — it is the honest starting point each requirement below is written against.

| Layer | Build status (per ADR) | Product requirement (`FR-ARC-###`) |
| --- | --- | --- |
| 1. Core — Identity | Partial (NextAuth + Neon, proof-grade) | **FR-ARC-004.** The platform shall provide one identity system that every persona (Chapter 3) authenticates against, with no disease module or agent introducing a second identity boundary (restates NO-8). |
| 1. Core — Consent | Partial (`lib/precision-health/consent.ts`) | **FR-ARC-005.** The platform shall provide one purpose-bound consent registry (six purpose codes today: `care_delivery`, `care_improvement`, `clinical_research_deidentified`, `population_analytics`, `coaching_wellness`, `risk_stratification_demo`) that every data-consuming capability, including every disease module, checks before using patient data for that purpose. |
| 1. Core — Security | Partial (`liveEmis:false` guards, app-layer tenant isolation) | **FR-ARC-006.** The platform shall enforce tenant isolation (Chapter 3, §3.6) as a cross-cutting concern applied identically regardless of which layer or module produced the data being returned — a Disease Intelligence signal is exactly as tenant-scoped as a core clinical record. |
| 1. Core — Memory | Partial (learning-event repo, `precision-health/timeline.ts`) | **FR-ARC-007.** The platform shall provide one longitudinal patient-timeline abstraction that disease-module signals (e.g. Diabetes glucose/HbA1c trends) append to, rather than each module maintaining its own parallel patient history store. |
| 1. Core — Knowledge Graph | Partial (`lib/neo4j/`, honest mock-fallback) | **FR-ARC-008.** The platform shall provide one knowledge-graph service (Neo4j when configured) for patient/guardian/population graph queries, with an explicit, visibly-labeled mock-fallback mode when unreachable (Chapter 5, FR-HITL-025/033) — never a silent degrade presented as live. |
| 1. Core — Orchestrator | Partial (CONDUCTOR, `lib/clinical-spine/orchestrate.ts`) | **FR-ARC-009.** The platform shall route every clinical-facing draft through exactly one deterministic orchestrator (restates Chapter 5 FR-HITL-005). This chapter adds: the orchestrator shall remain synchronous and in-process for the product's current scale, per the Tech Stack ADR's Temporal/event-bus "Avoid now" determination — this Volume does not request an async workflow engine. |
| 1. Core — Event Bus | **Missing** | **FR-ARC-010.** The platform shall not require an event bus for any requirement in this Volume to be satisfiable. Any future requirement that appears to need one must cite the named trigger in `docs/ADR_TECH_STACK_MODERNIZATION.md` (a second independent service needing async clinical-event reaction) rather than assume it will be added. |
| 1. Core — Digital Twin (generic primitive) | Partial (`lib/precision-health/twin-simulation.ts`, `physiologicalTwin:false`) | **FR-ARC-011.** The platform shall keep the generic twin-simulation primitive disease-agnostic and rules-based (`synthetic_rules` mode) until a disease-specific twin (Chapter 9, Diabetes Twin) is separately specified and approved — this chapter does not request a physiological simulation capability. |
| 1. Core — Observability | Partial (SHIELD, eval harness, hazard log) | **FR-ARC-012.** The platform shall keep SHIELD as the single audit/observability system of record for clinical-facing decisions (restates Chapter 5 §5.4); this chapter does not request a separate logging/tracing/metrics platform. |
| 2. Platform Agents | **Exists** (`lib/agents.ts`, `lib/agents/llm-*.ts`) | **FR-ARC-013.** The platform shall expose its 12-entry agent directory (`CLINICAL_AGENT_META`) as the canonical set of platform-agent services every disease module and every future capability integrates with, rather than each module defining its own agent naming (elaborated Chapter 7, when drafted). |
| 3. Disease Intelligence (Diabetes) | **Partial — v0 typed stubs exist, unwired** (see honest current-state note, §4.3.3) | **FR-ARC-014.** The platform shall implement disease-specific intelligence as typed data/feature modules under `lib/disease-modules/<disease>/` that feed the existing HORIZON/GUARDIAN agents, per §4.8 and Chapter 8 (when drafted) — not as new peer agents. |
| 4. Research Intelligence | Partial (policy exists, pipeline does not) | **FR-ARC-015.** The platform shall keep Research Intelligence bounded by the existing typed evaluation boundary (`lib/precision-health/research-evaluation-plan.ts`, `docs/RESEARCH_EVALUATION_BOUNDARY.md`) until ATLAS (Phase 2, not built) is scoped; this chapter does not request an external research-API integration (restates Chapter 2, NS-6/NS-7). |
| 5. Disease Digital Twins | **Missing** (disease-specific) | **FR-ARC-016.** A disease-specific twin (Diabetes Twin, Chapter 9) shall reuse the generic twin-simulation pattern (`physiologicalTwin:false`, `hitlRequired:true`) rather than introduce a new simulation framework, consistent with FR-ARC-011. |
| 6. Population Intelligence | Partial (`risk-state.ts`, COMPASS, ICS dashboard) | **FR-ARC-017.** The platform shall keep population-level aggregation on the existing Postgres/Neo4j aggregation path for current synthetic-cohort scale, per the Tech Stack ADR's ClickHouse "Avoid now" determination (named trigger: real multi-practice, multi-thousand-patient scale). |
| 7. Patient Intelligence | Partial, generic (`timeline.ts`, `health-plan.ts`, `coaching.ts`) | **FR-ARC-018.** The platform shall extend the existing generic coaching-draft pattern for disease-specific coaching (Diabetes Nutrition/Exercise/Behaviour, per `DiabetesCoachingDraft` in `lib/disease-modules/diabetes/types.ts`) rather than inventing a second coaching-draft shape. |
| 8. Clinical Intelligence workspace | Partial, exists functionally (`/review`, `/cases/[id]`) | **FR-ARC-019.** The platform shall keep the existing GP review workflow as the single clinical-intelligence workspace; disease-module outputs surface within it (as HORIZON/GUARDIAN contributions) rather than as a separate per-disease review queue. |
| 9. Continuous Learning | **Exists** (most mature layer) | **FR-ARC-020.** The platform shall route every disease module's outcomes through the existing continuous-learning loop (Chapter 5, §5.7) with no per-module learning-event schema (restates NO-8 and the Diabetes spec's "no diabetes-specific exception" statement). |

### 4.3 Module boundaries

The product is organized into five directory-level module groups today. This section states what each group is responsible for and, critically, what it must **not** take on.

#### 4.3.1 Core platform (`lib/agents.ts`, `lib/auth*`, `lib/user-scope.ts`, `lib/permission-matrix.ts`, `lib/neo4j/`, `lib/repositories/`, `lib/db/`)

- **Responsible for:** identity/session, tenant/patient scoping, the SHIELD audit repository, the knowledge-graph client, and the durable-store repositories (learning events, consent grants, governed evaluations, bridge staging) every other module depends on.
- **FR-ARC-021.** No other module group (agent platform, disease modules, precision-health, research) shall implement its own authentication, its own audit persistence, or its own tenant-scoping logic. They shall call into this group's repositories and helpers (restates NO-8 at the module-boundary level).

#### 4.3.2 Agent platform (`lib/agents/llm-*.ts`, `lib/clinical-spine/`)

- **Responsible for:** the 12-agent directory's implementations (SYNTHESIS, GUARDIAN, HORIZON/ORACLE, NEXUS, Dr.Assist, PATHWAY/REFERRAL, COMPASS/EQUITY, VOICE, CANVAS, BRIDGE, SHIELD, CONDUCTOR) and the clinical-spine orchestration (`runClinicalSpineOrchestrate`), safety routing, queue-decision recording, and the outcomes/continuous-learning loop.
- **FR-ARC-022.** Every clinical-facing capability, including every disease module's contribution, shall reach a clinician through this group's existing orchestration and queue-decision machinery (Chapter 5) — no disease module shall stage its own review queue.

#### 4.3.3 Disease modules (`lib/disease-modules/diabetes/`)

- **Responsible for:** disease-specific signal derivation (the 9 Diabetes areas: Glucose, HbA1c, Insulin, GLP-1, Nutrition, Exercise, Behaviour, Complications, Prevention) as pure, typed functions over a patient context, composed by one barrel function (`buildDiabetesRiskContribution`) into HORIZON-contributing-factor and GUARDIAN-safety-flag shapes.
- **Honest current-state note (as of this Volume's drafting):** `lib/disease-modules/diabetes/` now contains v0 typed-stub code (types, 9 signal builders, a composite barrel, and demo fixtures) — an update since `docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md` was written, which described this path as "proposed, not yet created." However, per the module's own code comments and the spec's v0 phase definition, **none of this is yet called from `lib/clinical-spine/orchestrate.ts`, `lib/agents/llm-oracle.ts`, or `lib/agents/llm-guardian.ts`.** The v0 → v1 wiring step (behind a proposed `ENABLE_DIABETES_MODULE` flag, default `false`, following the `ENABLE_LLM_*` convention in `lib/integration-config.ts`) remains a distinct, not-yet-taken engineering step. This Volume's Chapter 8 (when drafted) must track this distinction precisely — "types exist" is not "signals reach a clinician."
- **FR-ARC-023.** A disease module shall expose exactly one composite integration function per disease (the `buildDiabetesRiskContribution` pattern) as its sole interface to the agent platform — individual signal builders (e.g. `buildGlucoseSignal`) are internal to the module and shall not be called directly from `lib/clinical-spine/` or `lib/agents/`.
- **FR-ARC-024.** A disease module shall not perform its own AI Gateway calls, its own SHIELD audit writes, or its own HITL gating — it produces typed data that flows through the agent platform's existing mechanisms once wired (restates Chapter 1 NO-8 and Chapter 5 FR-HITL-005 at the disease-module boundary).

#### 4.3.4 Precision Health (`lib/precision-health/`)

- **Responsible for:** disease-agnostic patient-level and lifestyle capabilities that predate and sit alongside disease modules — consent, modalities, timeline, health-plan drafts, generic coaching, generic twin-simulation, risk-state aggregation, federated-research stubs, biomarkers, causal-AI scaffolding.
- **FR-ARC-025.** Disease modules shall extend `lib/precision-health/` contracts (e.g. `modalities.ts`, `coaching.ts`'s `CoachingDraft` shape) rather than duplicate them with disease-specific variants, except where an explicit, documented reason exists (e.g. the Diabetes spec's open question on `NUTRITION_DIABETES` vs. extending the existing `CoachingAgentId` union — Chapter 8, when drafted, must resolve this, not silently fork the type).

#### 4.3.5 Research (`lib/precision-health/research-evaluation-plan.ts`, `lib/precision-health/federated-research.ts`)

- **Responsible for:** the typed dataset/task/model/metric/interpretation evaluation boundary and the ethics-gated federated-research stub — both explicitly offline, synthetic-only, not production ML (Chapter 2, NS-7).
- **FR-ARC-026.** This module group shall remain a policy/typing boundary until ATLAS (Phase 2) is scoped; this chapter does not request it be built out further.

### 4.4 Core product components

Four components recur across every layer and module group above and are described once here so later chapters can reference them by name without redefinition:

- **CONDUCTOR / clinical spine** (`lib/clinical-spine/orchestrate.ts`) — the single deterministic pipeline (SYNTHESIS → GUARDIAN → HORIZON/NEXUS → safety-route → SHIELD) every clinical-facing draft passes through (Chapter 5, §5.1–§5.2). **FR-ARC-027.** No product capability described anywhere in this Volume shall bypass CONDUCTOR to reach a clinician-facing surface directly.
- **SHIELD** (`lib/repositories/shield-audit-repository.ts`) — the single, hash-linked, append-only audit system of record (Chapter 5, §5.4). **FR-ARC-028.** No product capability shall write its own parallel audit record for a clinical-facing decision; SHIELD is the only such record.
- **Knowledge Graph** (`lib/neo4j/`, with `lib/neo4j/mock-fallback.ts` honesty) — the patient/guardian/population graph query layer, with a synthetic mock fallback (`getMockPatientResponse` et al.) that mirrors the live schema shape so upstream code (and UI) does not need to branch on data source, only on the honesty banner shown to the user. **FR-ARC-029.** Every product surface reading from the Knowledge Graph shall function correctly (with mock data) when Neo4j is unconfigured or unreachable, and shall visibly disclose which mode is active (Chapter 5, FR-HITL-025).
- **Identity & Consent** (`lib/auth.ts`, `lib/precision-health/consent.ts`) — the single identity boundary (Chapter 3, §3.5) and the single purpose-bound consent registry (§4.2, FR-ARC-005) every persona and every data use passes through.

### 4.5 Data flow at product level

The product-level flow, from patient signal to governed learning, is:

**Patient / source signal → Ingest → Agents (CONDUCTOR-orchestrated) → HITL disposition → Outcome capture → Continuous learning (governed)**

| Stage | What happens | Fail-safe behavior (Chapter 5 cross-ref) |
| --- | --- | --- |
| 1. Patient / source signal | Consultation transcript, structured observation, lab value, self-report check-in, or (proposed) CGM/wearable reading enters via a modality-typed ingestion stub (`lib/precision-health/modalities.ts`, `ingestion-pipeline.ts`) — synthetic or pilot-consented only (Chapter 2, NS-4). | If consent for the relevant purpose code is not `active`, the platform shall exclude that patient's data from the stage entirely (Chapter 5, FR-HITL-012/AC-PER-012-1). |
| 2. Ingest | Data is normalized into the shared patient context CONDUCTOR consumes (`sharedContext` in `runAgentOrchestration`), including a disease module's `DiabetesPatientContext` once wired. | If ingested-modality count falls below the minimum-completeness threshold, the safety route shall resolve to `request_more_data` rather than proceeding on thin context (Chapter 5, FR-HITL-021). |
| 3. Agents (CONDUCTOR-orchestrated) | SYNTHESIS → GUARDIAN → HORIZON/NEXUS run in a fixed, GUARDIAN-first-when-urgent order; a disease module's composite contribution (once wired) is folded in as an additional HORIZON-contributing-factor / GUARDIAN-safety-flag source, in the same position existing Neo4j graph signals occupy — not a parallel pipeline (per `docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md`). | On agent timeout or missing independent evidence, orchestration throws and returns no result rather than a partial draft (Chapter 5, FR-HITL-031/032). |
| 4. HITL disposition | A human persona (Chapter 3) records Accept/Edit/Reject at the item level and confirms/marks-not-applicable any required case-level gate (Chapter 5, §5.2). | A case cannot reach finalization-ready state while a required gate is open (Chapter 5, FR-HITL-008). |
| 5. Outcome capture | An eventual outcome (e.g. "hypo event occurred at 30 days") is linked, append-only, to the originating learning event (`linkLearningOutcome`). | Outcome capture never mutates the source event; a missing outcome leaves the loop stage `awaiting_outcome`, never silently closed (Chapter 5, FR-HITL-027). |
| 6. Continuous learning (governed) | Linked outcomes feed a governed evaluation reviewed against G-ML-1/2/3; only a fully-signed `propose_model_update` can lead to a manual version bump outside this loop. | `autoRetrainTriggered`/`modelUpdated` remain `false` unconditionally; an unsigned proposal is rejected with a `blockedReason` (Chapter 5, FR-HITL-028/029/030). |

**FR-ARC-030.** This six-stage flow shall be the same for every clinical-facing capability on the platform, including every disease module — a disease module does not get its own shortened or parallel flow (restates FR-ARC-022/NO-8).

### 4.6 Multi-tenancy & isolation requirements

- **FR-ARC-031.** Every product layer that returns patient- or practice-scoped data (core clinical records, Population Intelligence aggregates, Disease Intelligence signals, Research Intelligence exports) shall apply the same tenant-isolation check (Chapter 3, §3.6) rather than each layer implementing its own scoping logic — restates FR-ARC-006 as a testable cross-layer requirement.
- **FR-ARC-032.** A patient-bound persona (Chapter 3, `patient`) shall be restricted to their own record at every layer that could expose patient-identifiable data, including any future Disease Intelligence or Digital Twin surface — not only the core clinical-record API.
- **FR-ARC-033.** Aggregate-only layers (Population Intelligence, ICS/hospital dashboards) shall not leak patient-level identifiable detail through an aggregate response, even when the aggregate's underlying group size is small enough that re-identification risk exists — this is a product requirement whose exact k-anonymity/small-cell-suppression threshold is an open question (§4.10, OQ-ARC-2), not yet a specified rule.

> **AC-ARC-031-1.** Given a `practice-manager` persona from Practice A, when they request any Population Intelligence aggregate, then the response shall include only Practice A's data, using the same tenant filter as core clinical-record APIs (`filterRecordsForPractice`).

### 4.7 Integration boundary

- **FR-ARC-034.** The platform shall treat every external system connection — FHIR export, EMIS/SystmOne staging, Medplum sync, wearable/CGM data, future lab/pharmacy feeds — as an **adapter** behind an explicit registry (`getIntegrationAdapterRegistry`), each with a declared status (`available`/`enabled`/`disabled`/`planned`/`scaffolded`) and boundary statement, never as an implicit, undeclared dependency.
- **FR-ARC-035.** `liveEmis:false` and `liveWriteBack:false` shall remain the default and, for this Volume's scope, the *only* operative state for every EMIS/SystmOne-adjacent adapter (`ehr-connectors`: `planned`, `emis-fhir-staging`: `scaffolded`, `ehr-writeback-sim`: `available` but sim-only) — restates Chapter 1 NO-4 and Chapter 5 FR-HITL-023 at the integration-boundary level.
- **FR-ARC-036.** Rehearsal-only adapters (Medplum sync, FastAPI synthesis) shall remain off by default (`ENABLE_MEDPLUM_SYNC`, `ENABLE_FASTAPI_SYNTHESIS`, both defaulting to unset/false) and shall only activate via an explicit environment flag, never a silent runtime detection of partner credentials.
- **FR-ARC-037.** A future wearable/CGM adapter (needed for Diabetes Glucose Intelligence beyond synthetic fixtures, per `docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md`'s Data Sources section) shall follow the same `ingestion-stub` pattern (`buildIngestionStubResponse` in `modalities.ts`) as every other modality — a consent-gated, explicitly-flagged, non-silent adapter — not a bespoke integration path.

### 4.8 Extensibility: adding a disease module without a new platform

This section makes BO-7 (Chapter 1) and FR-ARC-002 concrete, using Diabetes's own v0 shape (§4.3.3) as the worked example any future module (e.g. a hypothetical Cardiac or Renal module) should follow:

- **FR-ARC-038.** A new disease module shall be added as a new `lib/disease-modules/<disease>/` directory following the Diabetes v0 shape: a `types.ts` with the module's signal areas and shared honesty fields, one file per signal area, a `fixtures.ts` for demo data, and one barrel `index.ts` exposing a single composite integration function.
- **FR-ARC-039.** A new disease module shall feed its composite output into the existing HORIZON (`contributingFactors`) and GUARDIAN (`safetyNotes`/interactions) shapes, and/or the existing `CoachingDraft` pattern for lifestyle-facing outputs — it shall not require a new agent, a new orchestrator stage, or a new review-queue surface to ship.
- **FR-ARC-040.** A new disease module shall be wired into CONDUCTOR behind its own feature flag (following the proposed `ENABLE_DIABETES_MODULE` convention, §4.3.3), so modules can be developed and reviewed independently without one module's incompleteness blocking another's release.
- **FR-ARC-041.** A new disease module shall reuse the existing case-level HITL gates (Chapter 5, §5.2) by default; introducing a disease-specific gate type is the exception, requiring the same clinical-lead confirmation the Diabetes spec's Insulin/GLP-1 open question already requires (Chapter 5, OQ-HITL-1), not a default design choice for new modules.

> **AC-ARC-038-1.** Given a hypothetical new disease module directory is created following FR-ARC-038's shape, when its composite function is called, then it shall return a result whose shape (contributing factors, safety flags, coaching drafts, honesty fields) is structurally consistent with `DiabetesRiskContribution`, without requiring changes to `lib/clinical-spine/orchestrate.ts`'s core pipeline structure — only an additional, flagged data-gathering call.

### 4.9 Explicit non-architecture decisions (deferred)

This chapter does not decide, and this Volume does not need to decide, the following — they remain the Tech Stack ADR's or a future Volume's responsibility:

- Any change to the backend framework, workflow engine, event bus, or database technology — governed entirely by `docs/ADR_TECH_STACK_MODERNIZATION.md`'s Keep/Add-later/Avoid-now buckets and named triggers. This chapter's FR-ARC-009/010/011/017 explicitly defer to it rather than restate its reasoning.
- The exact API contract, versioning scheme, or external developer-facing interface for any future partner/third-party integration (e.g. a real CGM vendor API) — deferred until the Tech Stack ADR's GraphQL/API-contract triggers fire.
- Detailed data-model/schema design (table shapes, migration sequencing) for any layer — that is an engineering implementation concern once a chapter's functional requirements are approved, not a product-architecture decision this chapter makes.
- Any future Volume's scope or numbering (restates Chapter 2, NS-9) — this chapter does not imply or name a "Volume II Architecture Deep-Dive" or similar.
- The specific k-anonymity/small-cell-suppression rule for aggregate views (FR-ARC-033) — flagged as an open question, not decided here.

### 4.10 Open questions

- **OQ-ARC-1.** Confirm the target timeline and owner for the Diabetes v0 → v1 wiring step (§4.3.3: connecting `buildDiabetesRiskContribution` into `orchestrate.ts`/HORIZON/GUARDIAN behind `ENABLE_DIABETES_MODULE`) — this is an engineering scheduling decision, not a product-architecture one, but this Volume's Chapter 8 depends on knowing whether to specify "current state" as v0 or v1. **Owner:** Product + Engineering.
- **OQ-ARC-2.** Confirm the k-anonymity / small-cell-suppression threshold for Population Intelligence and any future Disease Intelligence population aggregate (FR-ARC-033) — no rule is currently specified in code or docs reviewed for this chapter. **Owner:** Clinical Safety Lead + Compliance + Architecture.
- **OQ-ARC-3.** Confirm whether `NUTRITION_DIABETES`/`EXERCISE_DIABETES`/`BEHAVIOUR_DIABETES` (Diabetes-suffixed coaching agent ids, §4.3.4) should extend the existing generic `CoachingAgentId` union in `lib/precision-health/coaching.ts` in place, or remain a distinct, disease-suffixed type indefinitely — restates the Diabetes spec's own open question #5, now framed as a module-boundary architecture question (FR-ARC-025). **Owner:** Product + Engineering.
- **OQ-ARC-4.** Confirm whether a second disease module (if and when commissioned) should be scoped as its own chapter addition to this Volume, or as a new Volume — this Volume's position (Chapter 2, NS-9) is that it does not decide this now, but the decision will need to be made before a second module's requirements are drafted. **Owner:** Product.
- **OQ-ARC-5.** Confirm the intended behavior when a disease module's composite function (e.g. `buildDiabetesRiskContribution`) throws or returns incomplete data for a given patient — should CONDUCTOR fail the whole orchestration (consistent with FR-HITL-032's "fail the proof" pattern) or degrade gracefully by omitting that module's contribution and flagging the omission? Not yet decided in code or spec. **Owner:** Clinical Safety Lead + Engineering.

### 4.11 Cross-references

- Chapter 1 (§1.1 BO-1/BO-2/BO-7, §1.4 NO-8/NO-10) — the platform-as-one-system and disease-modules-as-modules commitments this chapter turns into architectural requirements.
- Chapter 2 (§2.2/§2.3 scope boundary, NS-6/NS-7/NS-9) — the infrastructure and research-API exclusions this chapter's §4.2/§4.9 restate at the architecture level.
- Chapter 3 (§3.5/§3.6 auth/authz and tenant isolation) — the mechanism this chapter's §4.6 requires be applied uniformly across every layer.
- Chapter 5 (§5.1–§5.2 HITL gates, §5.4 SHIELD, §5.7 continuous learning) — the mechanics this chapter's §4.4/§4.5 reference by name rather than redefine.
- `docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md` — the authoritative exists/partial/missing status this chapter's §4.2 table is built against.
- `docs/ADR_TECH_STACK_MODERNIZATION.md` — the authoritative Keep/Add-later/Avoid-now stack decisions this chapter defers to throughout (§4.2, §4.9).
- `docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md` — the module boundary and composite-integration design this chapter's §4.3.3/§4.8 elevate into product-architecture requirements.
- Chapter 6 (Core Platform Capabilities, `[DRAFTED]`) takes Identity/Consent/Interop/Knowledge Fabric (§4.2's Layer 1 rows, §4.4) to full requirements depth.
- Chapter 7 (Universal Agent Platform, `[DRAFTED]`) takes the 12-agent directory (§4.3.2, FR-ARC-013) to full requirements depth.
- Chapter 8 (Disease Intelligence — Diabetes, `[DRAFTED]`) takes §4.3.3/§4.8 to full requirements depth, resolving OQ-ARC-1 and OQ-ARC-3 as part of doing so.

---

## 6. Chapter 5 — Clinical Safety & Human Oversight (HITL) `[DRAFTED]`

### 5.0 Purpose of clinical safety in Aksh

Aksh Health is an intelligence layer, not an autonomous clinician (Chapter 1, §1.7). Every capability this platform ships — general clinical intake, medication safety, risk scoring, care coordination, and each disease module — produces a **draft**, never a decision. This chapter defines the mechanism that makes that true in practice, not just in prose: the gate catalog a draft must pass through, who is authorized to clear each gate, what is recorded when they do, and what the platform must fail-safe on when something goes wrong (a timeout, an offline dependency, a conflicting edit, an audit-write failure).

This chapter is not aspirational. Every gate, status, and honesty field described below is grounded in code that exists today (`lib/human-gates.ts`, `lib/clinical-spine/orchestrate.ts`, `lib/clinical-spine/safety-route.ts`, `lib/clinical-spine/queue-decision.ts`, `lib/clinical-spine/outcomes-loop.ts`, `lib/repositories/shield-audit-repository.ts`, `lib/agents/llm-guardian.ts`). Where the current implementation falls short of the target this chapter states, §5.8 and §5.9 say so explicitly rather than describing the gap as already closed.

### 5.1 Mandatory HITL principles

These restate and operationalize Chapter 1's BO-3/BO-4/BO-5 and NO-1/NO-2/NO-4/NO-5/NO-7 as binding product behavior, not aspiration.

- **FR-HITL-001.** The platform shall treat every clinical-facing AI output (SYNTHESIS SOAP/coding drafts, GUARDIAN interaction/allergy flags, HORIZON risk drafts, PATHWAY referral drafts, NEXUS correlation drafts, and any Diabetes-module contribution to these) as a draft with exactly three possible dispositions at the individual-item level: **Accept**, **Edit**, or **Reject** — never an implicit fourth state of "already applied."
- **FR-HITL-002.** The platform shall require an authenticated, role-eligible human actor (per Chapter 3's persona HITL responsibilities) to record the disposition in FR-HITL-001 before a draft can be staged (BRIDGE, sim-only) or referenced as a finalized clinical position anywhere in the product.
- **FR-HITL-003.** The platform shall never present a case, item, or draft as "complete" or export-ready while a mandatory case-level human gate (§5.2) remains in a `required`/open status.
- **FR-HITL-004.** The platform shall record who made a disposition, when, and — for Reject and Override — why, as a condition of accepting the disposition at all. A disposition without an actor identity or timestamp shall be rejected by the system, not silently defaulted.
- **FR-HITL-005.** The platform shall route every clinical-facing draft through exactly one deterministic orchestrator (CONDUCTOR, `lib/clinical-spine/orchestrate.ts`). No disease module, agent, or future capability shall introduce a second orchestration path that could reach a clinician-facing surface without passing through the same gate infrastructure (restates NO-8, Chapter 1).
- **FR-HITL-006.** The platform shall attach the same literal honesty fields to every orchestration result and persist them into the audit trail unchanged: `ehrWrite:false`, `hitlRequired:true`, `physiologicalTwin:false`, `autoRetrain:false`, `liveEmis:false`. These shall be typed fields checked by the codebase, not comments or documentation claims.

> **AC-HITL-006-1.** Given any call to `runClinicalSpineOrchestrate`, when the result is returned, then `ehrWrite`, `physiologicalTwin`, `autoRetrain`, and `liveEmis` shall each be the literal value `false`, and `hitlRequired` shall be the literal value `true`, matching `ClinicalSpineOrchestrateResult`.

- **FR-HITL-007.** The platform shall treat a twin/simulation output that does not honestly declare `physiologicalTwin:false` and `simulationMode:"synthetic_rules"` as a defect to be blocked before release, not shipped with a caveat — per the existing runtime check in `runClinicalSpineOrchestrate` (`throw new Error("Twin honesty check failed...")`).

### 5.2 Gate catalog

The platform operates HITL at **two layers**, and this Volume keeps them distinct because the code does:

1. **Item-level disposition** — Accept / Edit / Reject on each individual agent draft (a SOAP note, a GUARDIAN flag, a HORIZON score, a referral draft) in the review queue. This is the base primitive (`lib/clinical-spine/queue-decision.ts`).
2. **Case-level human gates** — three named gates (`HumanGateId`) that must be explicitly confirmed or marked not-applicable before a *case* (not just one item) can be considered finalization-ready (`lib/human-gates.ts`).

#### 5.2.1 Item-level disposition gate (all clinical drafts)

| | |
| --- | --- |
| **Purpose** | The universal HITL checkpoint every clinical-facing AI output must pass through before it can be staged or treated as final. |
| **Who may act** | The accountable clinical persona for that draft type: GP for SOAP/coding/risk/referral drafts; Clinical Pharmacist for medication-review/interaction drafts; Nurse for observation/handover drafts (Chapter 3, §3.2). Non-clinical personas (`practice-manager`, `ics-lead`, `hospital-executive`, `researcher`) are barred (FR-PER-009, Chapter 3). |
| **Allowed decisions** | `accept`, `edit`, `reject` (`LearningDecision` / `ReviewQueueItemStatus`). |
| **On Accept** | Item status → `ACCEPTED`. A learning event is recorded (`recordLearningEvent`, dual-written to SHIELD). If the accepted item is a clinical draft eligible for a follow-on care-plan, a health-plan draft may be offered (`createHealthPlanDraft`) — itself HITL-gated and `ehrWrite:false`. BRIDGE may stage the accepted content (sim-only, `liveEmis:false`). |
| **On Edit** | Item status remains `DRAFT` but `decidedBy`/content/timestamp change; a learning event with `decision:"edit"` is recorded. Editing is not a lesser action than Accept for audit purposes — it is recorded with the same rigor. |
| **On Reject** | Item status → `REJECTED`; a learning event with `decision:"reject"` and a mandatory `rejectionReason` is recorded. A rejected draft is never staged and never silently retried without new input. |
| **Audit requirements** | Every disposition writes a SHIELD audit event (dual-write, `shieldDualWrite:true`) and a learning event in the same operation (`recordSpineQueueDecisions`) — the two shall never be allowed to diverge (one without the other). |

#### 5.2.2 Case-level gate: `red_flag_escalation`

| | |
| --- | --- |
| **Purpose** | Confirms whether an urgent escalation, same-day review, or safety-netting action is required, when synthetic source evidence contains a red-flag pattern (e.g. fever with wheeze/breathlessness). |
| **Who may act** | GP (primary); Nurse may raise/observe but the confirming decision is a GP/clinician-accountable action per Chapter 3. |
| **Allowed decisions** | `confirmed` (escalation reviewed and actioned/dismissed with a note) or `not_applicable` (no red-flag evidence present — system-derived, reviewer-confirmable). |
| **On Accept (confirmed)** | Gate status → `completed`; decision persisted (`HumanGateDecision`) with `decidedAt`/`decidedBy`/optional `note`. |
| **On Reject** | There is no "reject" for this gate type — a red-flag signal cannot be dismissed without a recorded rationale; the only closing states are `confirmed` (with note) or `not_applicable` when no evidence exists. A case shall not silently drop a `required` red-flag gate. |
| **Audit requirements** | Gate status transition is part of the case's persisted state and shall be included in any case-level SHIELD audit summary; the gate's `reason` and `evidence[]` fields must remain traceable to the safety flags that triggered `required` status. |

#### 5.2.3 Case-level gate: `referral_pathway`

| | |
| --- | --- |
| **Purpose** | Confirms whether a case should stay in primary-care review, be referred, or take another pathway action, when escalation/urgent-language/respiratory evidence suggests a referral may be needed. |
| **Who may act** | GP; PATHWAY agent produces the referral *draft*, never the decision. |
| **Allowed decisions** | `confirmed` or `not_applicable`. |
| **On Accept (confirmed)** | Gate → `completed`; if a referral is confirmed, PATHWAY's referral draft is what may be staged (sim-only) — the draft itself was never auto-sent. |
| **On Reject** | Same constraint as §5.2.2 — no bare "reject"; the reviewer records `not_applicable` with rationale if no referral/pathway action is needed. |
| **Audit requirements** | Same pattern as §5.2.2. This is also the gate the Diabetes spec's Complication Intelligence area (Chapter 8, when drafted) reuses for retinopathy/CKD/cardiovascular referral triggers — no new gate type is introduced for that purpose (`docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md`). |

#### 5.2.4 Case-level gate: `medication_decision`

| | |
| --- | --- |
| **Purpose** | Confirms, edits, rejects, or overrides a medication-related decision when GUARDIAN safety flags (allergy, intolerance, DDI, low-confidence extraction) or any medication draft are present. |
| **Who may act** | Clinical Pharmacist (primary for interaction/allergy review); GP (co-accountable, particularly for prescribing-adjacent decisions). |
| **Allowed decisions** | `confirmed` or `not_applicable`; the reviewer action text explicitly allows "confirm, edit, reject, or override... with a documented rationale" at the underlying item level, funneled into this case-level gate once resolved. |
| **On Accept (confirmed)** | Gate → `completed`. This is also the gate the Diabetes spec's Insulin and GLP-1 Intelligence areas (Chapter 8) are provisionally mapped to reuse for dose-adjacent discussions — confirmed as the default in the spec but explicitly flagged there as needing clinical-lead confirmation on whether a dedicated gate type (e.g. `insulin_dose_confirmation`) is warranted instead (see OQ-HITL-1, §5.10). |
| **On Reject** | Same "no bare reject" constraint — an override must carry a documented rationale (`note`) rather than a silent dismissal. |
| **Audit requirements** | Same as §5.2.2/§5.2.3; additionally, per NO-2 (Chapter 1), a `medication_decision` confirmation shall never itself constitute an executable dose or prescription change — it records a clinical judgment on the draft, not a prescribing transaction. |

**FR-HITL-008.** A case shall not be treated as finalization-ready (`FinalizationState` ≠ `blocked`) while any case-level gate in §5.2.2–§5.2.4 remains in `required` status. A `warn`-level state (recommended but not mandatory gate open) may proceed with an explicit acknowledgement; a `blocked` state shall not.

> **AC-HITL-008-1.** Given a case with the `red_flag_escalation` gate at `required` status and no recorded decision, when a reviewer attempts to export or mark the case complete, then the platform shall block the action and surface the open gate as the reason.
> **AC-HITL-008-2.** Given the same case after the reviewer records a `confirmed` decision with a note, when the export/complete action is retried, then the platform shall allow it (assuming no other blocking condition).

### 5.3 What may never be autonomous

Restated here in HITL-specific, testable form (Chapter 1 §1.4 states these as platform-wide Non-Objectives; this section is their clinical-safety-mechanism instantiation):

- **FR-HITL-009.** The platform shall never transition a queue item to `ACCEPTED` or a case-level gate to `completed` without a recorded human actor identity (restates NO-1).
- **FR-HITL-010.** The platform shall never generate or apply an executable medication dose change, prescription, or EHR write as a side effect of any agent output, gate confirmation, or governed evaluation (restates NO-2, NO-4). The Insulin/GLP-1 Diabetes-module areas (Chapter 8) are explicitly bound by this at the module level, not just the platform level.
- **FR-HITL-011.** The platform shall never trigger a model, prompt, or scoring-rule version change as a byproduct of learning-event volume, outcome data, or SHIELD audit accumulation, absent the full G-ML-1/2/3 signed sequence (restates NO-5; mechanism detailed in §5.7).
- **FR-HITL-012.** The platform shall never auto-resolve a `required` case-level gate to `completed` based on elapsed time, queue pressure, or any heuristic — a gate left open shall stay open (and shall keep the case out of a finalization-ready state per FR-HITL-008) until a human actor decides it.
- **FR-HITL-013.** The platform shall never allow a non-accountable persona (per Chapter 3, e.g. `practice-manager`) to clear any gate in §5.2, even when acting as an "admin" convenience, and even if the acting user is otherwise a legitimate operations lead for that practice.

### 5.4 SHIELD audit trail requirements

SHIELD is the platform's single audit system of record (Chapter 1, NO-8). Its current mechanism, honestly stated:

- **How it works today.** Each SHIELD event is hashed (`sha256` over `id`, `recordedAt`, `prevEventId`, `action`, `actor`, `label`, `detail`, `caseId`, `queueItemId`, `practiceId`, `agentLabel`, `resourceRef`, `payload`) and stores the immediately preceding event's id as `prevEventId` alongside its own `contentHash` — a hash-linked chain, one link per event, in Postgres (`aksh.shield_audit_events`).
- **FR-HITL-014.** The platform shall record a SHIELD audit event for every case-level gate decision, every item-level disposition (Accept/Edit/Reject), every continuous-learning outcome capture, and every governed evaluation submission — with no clinical-facing decision type exempted.
- **FR-HITL-015.** Every SHIELD audit event shall be append-only. The platform shall never expose an update or delete path for a persisted SHIELD event (consistent with `docs/CONTINUOUS_LEARNING.md`'s "No PUT/PATCH/DELETE exposed" invariant).
- **FR-HITL-016.** Every SHIELD audit event shall carry a content hash computed over its own fields plus the previous event's id, such that altering any historical event's content would break the hash chain from that point forward and be detectable.
- **FR-HITL-017.** SHIELD audit read access shall be scoped by persona and tenant exactly as clinical-record access is (Chapter 3, §3.6): a practice may read its own audit trail; cross-practice audit reads shall be denied by the same tenant-isolation mechanism.

**Status update (B1, closed for the review-queue/learning/outcome paths — see `docs/PHASED_BUILD_PLAN.md` B1):** the best-effort gap described below is closed for the paths FR-HITL-014 actually requires audit completeness on — item-level Accept/Edit/Reject (`queue-decision.ts`), continuous-learning outcome capture, and governed-evaluation submission (`outcomes-loop.ts`). `persistShieldAuditEvent` now returns a discriminated `{ persisted: true, row }` / `{ persisted: false, row: null, reason }` result instead of a `null` that was indistinguishable from success. Callers on these paths propagate `shieldAuditWriteFailed`/`shieldAuditWriteReason` to the API response and reviewer UI (a dismissible "audit write degraded — retry" banner, plus `POST /api/clinical-spine/shield-audit-retry`). Chosen remediation was **(a) fail-visible**, not (b) a durable outbox: the clinical action itself is never blocked or hard-failed by an audit-write failure — it still completes and returns 200 — only the honesty of what's reported back changes. This is *visibly degraded when it fails*, not "guaranteed durable"; no stronger durability claim is made. **Residual gap, not closed by B1:** the research-evaluation export and federated-research-job paths (EC-RES-4, §13) still call `persistShieldAuditEvent` fire-and-forget (`void persistShieldAuditEvent(...)`) and do not yet check `persisted` — consistent with EC-RES-4/OQ-RES-7's own text, which defers a research-specific fix to a future pass rather than claiming one here.

**Original honest current-state gap (binding — must be resolved before any pilot milestone, not before this chapter can be marked DRAFTED), preserved for history:** `persistShieldAuditEvent` was explicitly a **best-effort** write — if the Postgres write failed, the function caught the error, logged it to the server console, and returned `null` "never throws into clinical UI paths." This meant a clinical Accept/Edit/Reject could succeed in the application even if its corresponding SHIELD audit write silently failed. This was the opposite of what FR-HITL-014/FR-HITL-015 require as a target state and was recorded as **OQ-HITL-2** (§5.10) rather than papered over — a production/pilot posture needed either (a) a hard failure on the clinical action if the audit write fails, or (b) a durable retry/outbox mechanism that guarantees eventual consistency with an alerting path, decided by Clinical Safety + Engineering. (a) was the design chosen, per the status update above.

- **Retention.** No retention or deletion policy for SHIELD events currently exists in code or documentation reviewed for this chapter. This is **OQ-HITL-3** (§5.10), not a stated requirement, because a retention period is a clinical-governance and data-protection decision, not an engineering default.

### 5.5 Safety routing & escalation

- **FR-HITL-018.** The platform shall route every case, after agent orchestration, into exactly one of four safety routes (`SafetyRoute`): `low_risk_coaching`, `clinical_review_queue`, `urgent_flag`, or `request_more_data` — never an undefined or absent route.
- **FR-HITL-019.** The platform shall assign `urgent_flag` whenever GUARDIAN's `overallStatus` is `red` or the orchestration's `queuePriority` is `Urgent`, and shall reorder the review queue so GUARDIAN is reviewed first on that route (`reviewOrder`, `resolveReviewOrder`).
- **FR-HITL-020.** The platform shall assign `clinical_review_queue` (not `low_risk_coaching`) whenever GUARDIAN is `amber` or HORIZON's risk band is `High`/`VeryHigh`, so that any elevated — not only maximal — risk signal reaches a clinician rather than the patient-facing coaching surface.
- **FR-HITL-021.** The platform shall assign `request_more_data` whenever ingested modality count falls below the minimum completeness threshold (`max(3, floor(expectedModalities * 0.5))`), rather than generating a coaching or clinical draft from insufficient context.
- **FR-HITL-022.** Coaching-surface content shall be gated by `coachingAllowedForRoute` and shall never be shown to a patient when the route is `clinical_review_queue`, `urgent_flag`, or `request_more_data` — a paused/blocked coaching surface, with a route-appropriate patient message, is the required behavior, not silent coaching continuation.

> **AC-HITL-019-1.** Given GUARDIAN returns `overallStatus:"red"` for a case, when the safety route is resolved, then the result shall be `urgent_flag` and the review order shall place GUARDIAN before SYNTHESIS/HORIZON/NEXUS.
> **AC-HITL-022-1.** Given a case routed to `urgent_flag`, when the patient-companion surface renders, then it shall show the `urgent_flag` patient message ("contact your care team... coaching is paused") and shall not render any coaching draft.

### 5.6 Demo vs. live safety posture

- **FR-HITL-023.** The platform shall keep `liveEmis:false` and `liveWriteBack:false` as hard, code-enforced values in every environment until a separately governed decision changes them (restates NO-4). No feature shipped under this Volume shall carry an environment variable or configuration path that flips this default silently.
- **FR-HITL-024.** The platform shall never claim, in code-derived output or documentation, a signed DPIA, signed CSO Gate 2, signed DCB0129, signed MHRA classification, or a named/assigned CSO unless that specific fact is true — restates NO-6, and is enforced today as literal `false` fields (`signedDpia`, `signedCsoGate2`, `signedDcb0129`, `signedMhra`, `namedCsoAssigned` in `SPINE_PARTNER_HONESTY`) that this chapter requires stay `false` until each is genuinely true, updated one at a time, not as a bundle.
- **FR-HITL-025.** When a live data dependency (e.g. Neo4j) is unreachable, the platform shall fall back to a clearly labeled mock/demo data mode and shall never present mock data under a "live" banner. Conversely, when genuinely live (Neo4j-backed) data is shown, the platform shall label it as such while still disclosing "still synthetic rehearsal patients, not a live NHS feed" (per `Neo4jMockModeBanner`).
- **FR-HITL-026.** All patient data used in HITL-gated workflows shall be synthetic or explicitly pilot-consented (restates NS-4, Chapter 2) — this chapter does not open, and cannot open on its own, a path to real patient data.

### 5.7 Continuous learning safety boundary

- **FR-HITL-027.** The platform shall log every HITL care action (an Accept/Edit/Reject that produces a clinically meaningful decision) as a learning event, and every eventual outcome as an **append-only** linked event (`linkLearningOutcome`) — never a mutation of the original event.
- **FR-HITL-028.** The platform shall never trigger a model or scoring-rule change from a governed evaluation unless all three gates are signed: **G-ML-1** (Engineering lead — eval harness delta, no HITL/EHR invariant regression), **G-ML-2** (Clinical Safety Officer — hazard log delta, residual risk note), **G-ML-3** (Release authority/pilot sponsor — explicit written approval of the version string to promote). This is enforced today by `assertGovernedEvaluationAllowed`, which blocks a `propose_model_update` action unless `allGovernedGatesSigned` is true.
- **FR-HITL-029.** `autoRetrainTriggered` and `modelUpdated` shall remain literal `false` on every governed-evaluation result and outcomes-loop status object, regardless of proposed action, until a human-operated release process (per `docs/GOVERNED_MODEL_RELEASE_SOP.md`) manually bumps a version string outside of this loop entirely. The loop itself has no code path that can flip either field to `true`.
- **FR-HITL-030.** A `propose_model_update` submission without all three gates signed shall be rejected with an explicit `blockedReason`, not silently downgraded to a different, unsigned action.

> **AC-HITL-028-1.** Given a `submitGovernedEvaluation` call with `proposedAction:"propose_model_update"` and only G-ML-1 and G-ML-2 signed, when the evaluation is submitted, then the platform shall return `accepted:false` with `blockedReason` citing the missing G-ML-3 signature, and no evaluation record with `status:"approved_for_manual_release"` shall be created.
> **AC-HITL-029-1.** Given any governed evaluation outcome, when the result is inspected, then `autoRetrainTriggered` shall be `false` and `modelUpdated` shall be `false`, with no code path in the reviewed modules capable of setting either to `true`.

### 5.8 Edge cases & failure modes

- **FR-HITL-031 (Agent timeout).** If an individual agent call exceeds its timeout (default 8s per agent, 30s overall budget, `agentTimeoutMs`/`overallTimeoutMs`), the platform shall fail the orchestration with an explicit error rather than returning a partial or fabricated result for the missing agent. The case shall remain in its prior state — no partially-generated draft shall be silently presented to a reviewer as complete.
- **FR-HITL-032 (Missing independent evidence).** If any agent's output fails the independent-evidence check (`assertSharedContext`/evidence collection — "Independent evidence missing for: ..."), the platform shall throw and refuse to return an orchestration result, rather than returning a draft with an unsubstantiated agent output.
- **FR-HITL-033 (Neo4j / graph dependency offline).** If the knowledge-graph dependency is unreachable, the platform shall fall back to labeled mock/demo data (§5.6, FR-HITL-025) for any HORIZON/GUARDIAN/ICS view that depends on it, and shall not silently degrade to an empty or default-risk result presented as if it were a real assessment.
- **FR-HITL-034 (Conflicting concurrent edits).** If two reviewers attempt to disposition the same queue item concurrently, the platform shall detect and surface the conflict (e.g. a second write observing a state change since the first reviewer's read) rather than silently accepting a last-write-wins overwrite that discards one reviewer's decision without a record. **Current-state note:** the reviewed queue-decision code (`diffQueueDecisions`, `recordSpineQueueDecisions`) does not implement explicit optimistic-concurrency conflict detection today; this is recorded as **OQ-HITL-4** (§5.10), not claimed as already solved.
- **FR-HITL-035 (SHIELD audit write failure).** As stated in §5.4's status update: closed (B1) for Accept/Edit/Reject, outcome capture, and governed evaluation — an audit write failure no longer blocks the clinical action, but it is also no longer indistinguishable from success; the failure is surfaced via `shieldAuditWriteFailed` to the API response and reviewer UI, with a retry path. **Not yet closed** for the research-evaluation-export and federated-research-job paths (EC-RES-4, §13) — tracked as **OQ-HITL-2** for that residual scope only.
- **FR-HITL-036 (Session/role revoked mid-decision).** If a user's role or session is revoked between loading a case and submitting a disposition, the platform shall re-validate authorization at submission time (server-side, per FR-PER-005/FR-PER-015, Chapter 3) and reject a disposition from a since-invalidated session rather than honoring a stale client-held permission.
- **FR-HITL-037 (Gate left open across a session/case handoff).** If a case is handed off between reviewers (e.g. shift change) with a case-level gate still `required`, the platform shall preserve the open gate's status and evidence across the handoff — a new reviewer opening the case shall see the same `required` status and reason, not a reset or cleared gate.

### 5.9 Acceptance criteria suites for key gates

**Suite: `red_flag_escalation` gate (§5.2.2)**

> **AC-HITL-RFE-1.** Given source evidence containing fever with wheeze/breathlessness and no prior gate decision, when `deriveHumanGates` runs, then the gate status shall be `required` and `mandatory:true`.
> **AC-HITL-RFE-2.** Given the same case, when a GP records `{status:"confirmed", note:"Same-day review booked", decidedBy:"gp01"}`, then the gate status shall become `completed` and the decision shall be retrievable via `humanGateDecisions`.
> **AC-HITL-RFE-3.** Given the gate is `required` and no decision has been recorded, when any export or finalization action is attempted, then it shall be blocked (FR-HITL-008/AC-HITL-008-1).
> **AC-HITL-RFE-4.** Given no red-flag evidence is present, when `deriveHumanGates` runs, then the gate status shall be `clear`, and a decision of `not_applicable` may be pre-populated (`ensureHumanGateDecisionSnapshot`) without requiring active reviewer input.

**Suite: `medication_decision` gate (§5.2.4)**

> **AC-HITL-MED-1.** Given a GUARDIAN allergy or DDI flag is present, when `deriveHumanGates` runs, then the `medication_decision` gate status shall be `required`.
> **AC-HITL-MED-2.** Given the pharmacist records a `confirmed` decision with a note documenting the clinical rationale, when the case is re-evaluated, then the gate shall be `completed` and the underlying medication draft shall remain unstaged until the corresponding item-level Accept also occurs (the case-level gate and the item-level disposition are both required, not substitutes for each other).
> **AC-HITL-MED-3.** Given a medication_decision gate confirmation, when the resulting SHIELD audit event is inspected, then it shall never contain a payload implying an executable dose change (`ehrWrite:false` on the associated record).

**Suite: GUARDIAN urgent routing (§5.5)**

> **AC-HITL-URG-1.** Given GUARDIAN returns `overallStatus:"red"`, when `resolveSafetyRouteFromOrchestration` runs, then the route shall be `urgent_flag` regardless of HORIZON's risk band.
> **AC-HITL-URG-2.** Given route `urgent_flag`, when the review order is computed, then GUARDIAN shall appear first in `reviewOrder`.

### 5.10 Open questions for Clinical Safety Lead

- **OQ-HITL-1.** Confirm whether Diabetes-module Insulin/GLP-1 dose-adjacent discussions (Chapter 8, when drafted) should route through the existing `medication_decision` gate as-is, or whether a new gate type (e.g. `insulin_dose_confirmation`) is clinically warranted — this is the same open question already flagged in `docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md` and is restated here because it is fundamentally a HITL-gate-catalog decision. **Owner:** Clinical Safety Lead.
- **OQ-HITL-2.** ~~Confirm the required remediation for the SHIELD best-effort audit-write gap (§5.4)~~ — **closed by B1** for Accept/Edit/Reject, continuous-learning outcome capture, and governed evaluation: remediation (a) fail-visible was chosen (surface `shieldAuditWriteFailed` + retry, never hard-fail the clinical action). **Remains open** for the research-evaluation-export and federated-research-job paths (EC-RES-4, §13), which still use the old fire-and-forget call and were explicitly out of B1's scope. **Owner:** Clinical Safety Lead + Engineering.
- **OQ-HITL-3.** Confirm the required SHIELD audit retention period (none is currently specified) and any regulatory minimum that should apply once real/pilot-consented data is in scope. **Owner:** Clinical Safety Lead + Compliance.
- **OQ-HITL-4.** Confirm whether explicit optimistic-concurrency conflict detection on queue-item disposition (FR-HITL-034) is required before the next pilot milestone, or whether the current single-reviewer-per-case workflow assumption makes this a lower-priority hardening item. **Owner:** Clinical Safety Lead + Product.
- **OQ-HITL-5.** Confirm who is authorized to mark a case-level gate `not_applicable` versus requiring it to always route to a named clinician for explicit `confirmed` status, particularly for `referral_pathway` in ambiguous cases. **Owner:** Clinical Safety Lead.
- **OQ-HITL-6.** Confirm the intended behavior when `request_more_data` persists across multiple sessions for the same patient (e.g. a companion user who never completes enough self-report) — is there a maximum "stuck" duration after which a clinician should be proactively notified, and if so, is that itself a new gate or an operational alert outside the HITL gate catalog. **Owner:** Clinical Safety Lead + Product.

### 5.11 Cross-references

- Chapter 1 (§1.3 BO-3/BO-4/BO-5, §1.4 NO-1/NO-2/NO-4/NO-5/NO-6/NO-7/NO-8) — the platform-level commitments this chapter operationalizes into gates, audit mechanics, and testable AC.
- Chapter 2 (§2.4 phasing model) — Track A/B and v0/v1/v2 framing this chapter's §5.6 stays consistent with.
- Chapter 3 (§3.2 per-persona HITL responsibilities, §3.5 auth/authz, §3.6 edge cases) — who holds each gate's authority; this chapter defines what holding that authority requires them to do.
- `docs/CONTINUOUS_LEARNING.md`, `docs/GOVERNED_MODEL_RELEASE_SOP.md` — the continuous-learning and release-gate mechanics this chapter's §5.7 elevates into product requirements without altering.
- `docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md` — the Insulin/GLP-1/Complication gate-reuse questions this chapter restates as OQ-HITL-1.
- `docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md` — Layer 1 Orchestrator/Observability status, consistent with this chapter's CONDUCTOR/SHIELD framing.
- Chapter 4 (Platform Architecture — Product View, `[DRAFTED]`) describes CONDUCTOR, SHIELD, and the agent directory as platform-layer components; it references this chapter's gate catalog and audit requirements rather than redefining them.
- Chapter 8 (Disease Intelligence — Diabetes, `[DRAFTED]`) inherits every gate in §5.2 unchanged and must resolve OQ-HITL-1 before finalizing its Insulin/GLP-1 requirements.

---

## 8. Chapter 6 — Core Platform Capabilities: Identity, Consent, Interop, Knowledge Fabric `[DRAFTED]`

### 6.0 Purpose of this chapter

Chapter 4 named Identity, Consent, Interop, and Knowledge Fabric as Layer 1 (Core) product components at architecture-overview depth. This chapter takes each to full functional-spec depth — Purpose, Responsibilities, Inputs, Outputs, Triggers, and Given/When/Then acceptance criteria — as the first chapter of Part B (Platform Capabilities). Every requirement here is grounded in code that exists today; where a capability is genuinely absent (a live terminology server, HL7v2 feed, pharmacy adapter), this chapter says so and states it as a phased future requirement rather than describing it as built.

### 6.1 Identity & Trust

**Purpose.** Resolve every request to exactly one authenticated identity with exactly one role, and make every subsequent authorization and audit decision derive from that resolution — never from a client-supplied claim.

**Responsibilities:**
- Authenticate via NextAuth credentials (bcrypt-compared password hash) or, when configured, a clinical OAuth identity provider (`lib/auth.ts`, `isClinicalOAuthConfigured`).
- Carry `UserRole` (Chapter 3, §3.1 — 8 roles) through the JWT/session and expose it to every downstream authorization check.
- Map the fine-grained `UserRole` onto the coarse-grained `AppRole` (`clinical_reviewer` | `operations_lead`) used by the permission matrix, via `mapSessionRoleToAppRole` (`lib/user-scope.ts`).
- Enforce tenant (practice) and patient-binding isolation on every clinical-record read (`lib/clinical-proof/tenant-isolation.ts`).
- Link every identity-relevant state change (consent grant/revoke, role change) to a SHIELD audit event bearing the acting identity.

**Inputs:** credentials or OAuth profile at sign-in; session token on each request; `role`, `practiceId`, and (for patients) bound `patientId` carried on the session.

**Outputs:** a resolved session (`session.user.role`, `.id`, `.email`, `.organisation`); an `allowed`/`denied`/`scoped` decision per requested action; a SHIELD audit event for identity-relevant state changes.

**Triggers:** sign-in; session refresh (`trigger === "update"`); any request to a clinical-record, consent, or admin-surface API.

Requirements:

- **FR-CORE-001.** The platform shall resolve identity exactly once per request, at the session/JWT boundary, and every downstream authorization check shall consume that resolved identity rather than re-deriving role or tenant from request parameters.
- **FR-CORE-002.** The platform shall carry a single `UserRole` per identity (Chapter 3, §3.1) and shall not allow a request to assert a different role than the one on its resolved session.
- **FR-CORE-003.** The platform shall map every `UserRole` to exactly one `AppRole` (`clinical_reviewer` or `operations_lead`) via a single, centrally defined mapping function (`mapSessionRoleToAppRole`) — no route shall implement its own role-mapping logic.
- **FR-CORE-004.** The platform shall deny clinical-record API access to `practice-manager`, `ics-lead`, `hospital-executive`, `researcher`, and `operations_lead` roles (`CLINICAL_RECORD_DENIED_ROLES`), restating Chapter 3's role-boundary table as an enforced, testable policy.
- **FR-CORE-005.** The platform shall restrict a `patient`-role identity to their own bound `patientId` on every patient-identifiable surface, resolved via `evaluatePatientUrlAccess`, and shall fail closed (403) when no bound patient id exists on the session.
- **FR-CORE-006.** The platform shall fail closed — deny, not allow — for any role string it does not recognize on a clinical-record API (`evaluateClinicalApiAccess`'s default branch), rather than defaulting to permissive access for unknown roles.
- **FR-CORE-007.** The platform shall link every consent grant, consent revoke, and (once implemented) role-change event to a SHIELD audit event carrying the acting identity, the affected patient, and a `false` `ehrWrite` honesty flag — restating Chapter 5 §5.4 at the identity boundary.
- **Honest current-state note.** `buildRolePermissionMatrix()` (`lib/permission-matrix.ts`) sets `productionRbacEnforced: false` explicitly and states in its own `enforcementNotes`: *"this matrix documents intended boundaries rather than production RBAC enforcement."* The matrix today covers only the two `AppRole` values (`clinical_reviewer`, `operations_lead`) over the review-workflow surface (`/review`, `/cases/[id]`, ops/benchmark/roadmap tooling) — it does not yet cover the full 8-persona `UserRole` set's dashboard surfaces (Chapter 3). This chapter's FR-CORE-001–006 state the intended, product-required behavior; FR-CORE-004/005 (tenant/patient isolation) are enforced today via `lib/clinical-proof/tenant-isolation.ts` independent of the permission matrix's current scope. Extending `buildRolePermissionMatrix()` to cover all 8 personas is tracked as OQ-CORE-1.

> **AC-CORE-004-1.** Given an authenticated identity with role `ics-lead`, when they call a clinical-record API (e.g. a patient detail endpoint), then the platform shall return 403 with reason `Role "ics-lead" is denied clinical record APIs (admin/ops isolation)`.
>
> **AC-CORE-005-1.** Given an authenticated `patient` identity bound to `patientId=P002`, when they request patient detail for `patientId=P007`, then the platform shall return 403 with reason `Patient P002 cannot access patient P007`.
>
> **AC-CORE-006-1.** Given a request carrying an unrecognized role string, when it calls a clinical-record API, then the platform shall return 403 rather than treating the unknown role as permitted.

### 6.2 Consent

**Purpose.** Ensure every use of patient data for a given purpose is backed by an active, purpose-bound, modality-scoped consent grant — and that revocation takes effect on the next read, not retroactively on past decisions already made under HITL.

**Responsibilities:**
- Maintain a registry of purpose codes (`PURPOSE_CODES`: `care_delivery`, `care_improvement`, `clinical_research_deidentified`, `population_analytics`, `coaching_wellness`, `risk_stratification_demo`) with a fixed catalogue of labels, descriptions, and an `allowsClinicalWrite: false` honesty field on every entry (`lib/precision-health/consent.ts`).
- Record consent grants scoped to a `patientId`, one `purposeCode`, and a set of `modalities` (`ConsentGrantInput`/`ConsentGrant`).
- Support revocation of a specific grant by id, setting `status: "revoked"`, `revokedAt`, `revokedBy` — never deleting the grant record.
- Check `isModalityGranted(grants, patientId, modality, purposeCode?)` before a capability uses a given modality of patient data for a given purpose.
- Durably mirror grants to Postgres (`mirrorConsentGrantToPostgres`) as a best-effort write, with the JSON file store remaining the source of truth on mirror failure.
- Emit a SHIELD audit event on every grant and every revoke (`persistShieldAuditEvent`, category `system`, actor `agentLabel: "SHIELD"`).

**Inputs:** `patientId`, `purposeCode`, `modalities[]`, `grantedBy` (grant); `revokeGrantId`, actor (revoke).

**Outputs:** a `ConsentGrant` record; a SHIELD audit event; (on read) a boolean modality-granted decision consumed by data-using capabilities.

**Triggers:** a consenting party (patient, or a clinician acting under a documented consent-capture workflow — Chapter 3's `patient` persona notes) submits a grant or revoke; a capability about to use patient data checks grant status before proceeding.

Requirements:

- **FR-CORE-008.** The platform shall require an active consent grant, scoped to both the specific `purposeCode` and the specific `modality` being used, before any capability uses patient data for that purpose — restating Chapter 1 NO-6 as an enforced check.
- **FR-CORE-009.** The platform shall never delete a consent grant record on revocation; revocation shall set `status: "revoked"` with `revokedAt`/`revokedBy` populated, preserving the grant's full history for audit (Chapter 5 §5.4's append-only pattern applied to consent).
- **FR-CORE-010.** The platform shall treat a consent revocation as effective immediately for all data use occurring after the revocation is recorded, and shall not require or perform retroactive changes to clinical decisions or drafts already produced before the revocation (see edge case §6.7-EC-1).
- **FR-CORE-011.** Every `PURPOSE_CODES` entry shall carry `allowsClinicalWrite: false` and the platform shall not introduce a purpose code that implies direct clinical write access — all purposes remain HITL-gated draft-producing or aggregate-analytics uses only (restates Chapter 1 NO-3/NO-4 at the consent-catalogue level).
- **FR-CORE-012.** The platform shall emit a SHIELD audit event for every consent grant and every consent revoke, and that event shall be linked to SHIELD's hash chain exactly as any other audit event (Chapter 5, §5.4) — consent state changes are not a second-class audit category.
- **FR-CORE-013.** The consent registry's durable Postgres mirror shall be best-effort: a mirror failure shall be logged and shall not throw into, block, or roll back the JSON-file-store write that remains the consent system's source of truth (restates the "best-effort, never blocks clinical flow" pattern from Chapter 5 §5.4 applied to consent persistence).

> **AC-CORE-008-1.** Given a patient has an active `care_delivery` grant covering the `clinical` modality but no grant covering `wearable`, when a capability attempts to use that patient's wearable data for `care_delivery`, then `isModalityGranted` shall return `false` and the capability shall not use that data.
>
> **AC-CORE-010-1.** Given a patient revokes their `coaching_wellness` consent at 14:00, when a coaching-draft capability checks consent at 14:01 for a new draft, then the check shall return `false`; when the same capability retrieves a coaching draft already generated and stored at 13:00, then the platform shall not be required to retroactively delete or redact that already-produced draft, though it shall be visible in the timeline as generated before revocation (§6.5).

### 6.3 Privacy & data lineage requirements (product level)

**Purpose.** Make every piece of patient data traceable to its source, its consent basis, and its downstream uses — without requiring a dedicated data-catalogue product this Volume does not scope.

Requirements:

- **FR-CORE-014.** Every data sample the platform ingests (wearable, lifestyle, clinical, lab, imaging-meta, omics-meta, environment — `MODALITY_IDS`) shall carry a `provenance` record stating its `source` (`synthetic_fixture` or `ingestion_stub` today), a `liveStream: false` flag, and a `realPatientData: false` flag for all non-pilot data, per `lib/precision-health/modalities.ts`'s existing schema pattern — restating Chapter 2 NS-4/NS-5 as an enforced per-record contract.
- **FR-CORE-015.** The platform shall make a patient's full data lineage reconstructable from three linked sources: the consent registry (what was authorized, and when), the modality-sample provenance record (where each sample came from), and SHIELD (what was done with it) — a clinician or compliance reviewer shall be able to answer "why does the platform have this, and what happened to it" without a separate lineage-tracking system.
- **FR-CORE-016.** The platform shall propagate the `ehrWrite: false` honesty field on every data-lineage-relevant record type it defines (timeline events, consent grants, modality samples) so that no downstream consumer of these records can misinterpret platform-internal data handling as an EHR write (restates Chapter 1 NO-4 at the data-record level).
- **FR-CORE-017.** The platform shall not aggregate or export patient-level data across the `clinical_research_deidentified` or `population_analytics` purpose boundary without applying the de-identification/aggregation rule scoped in Chapter 4 (FR-ARC-033, OQ-ARC-2) — this chapter does not re-decide that threshold, only restates that lineage tracking must record which purpose boundary a given export crossed.

### 6.4 Interoperability adapters

**Purpose.** Treat every external system connection as an explicit, individually-flagged adapter (Chapter 4, FR-ARC-034) — this section specifies each adapter's current vs. required state at functional-spec depth.

| Adapter | Current state (code-grounded) | Required state (this chapter) |
| --- | --- | --- |
| FHIR-shaped export | **Exists.** Builds internal FHIR R4-shaped evidence payloads (`fhir-export` in `getIntegrationAdapterRegistry`) — not a live EHR write, used for case-evidence export. | **FR-CORE-018.** The platform shall keep FHIR-shaped export as an internal evidence artifact format, decoupled from any live transmission adapter — exporting a FHIR bundle shall never itself constitute a write to an external system. |
| Medplum sync | **Partial — rehearsal only.** `ENABLE_MEDPLUM_SYNC` defaults unset/false; when true, pushes newly-accepted frozen cases to a configured Medplum FHIR server via OAuth (`lib/medplum-client.ts`); `liveEmis: false` is a literal type on every status/probe response. | **FR-CORE-019.** The platform shall keep Medplum sync off by default and shall never allow its rehearsal mode to be confused with EMIS/SystmOne write-back — `getMedplumRehearsalStatus().liveEmis` shall remain `false` unconditionally, restating Chapter 4 FR-ARC-036. |
| EMIS / SystmOne staging | **Scaffolded, non-functional for live write-back.** Queues HITL-approved FHIR bundles into an internal `memoryQueue` (`lib/emis-staging.ts`); `EMIS_NOT_LIVE_BANNER` is shown wherever this adapter's status surfaces; requires credentials + DPIA + CSO go/no-go signed **out-of-band** before any live path could even be considered. | **FR-CORE-020.** The platform shall display `EMIS_NOT_LIVE_BANNER` (or equivalent honesty text) on every UI surface that shows EMIS/SystmOne staging status, and shall not permit a queued envelope to transition to a live write regardless of configuration state, until a documented partner go/no-go (DPIA, CSO Gate 2, MHRA where applicable — Chapter 5 §5.6) is separately signed. |
| Simulated EHR write-back (test double) | **Exists, sim-only.** `POST /api/integrations/ehr-writeback-sim`; requires a short-lived clinician approval token; never calls live EMIS; used only by the clinical-proof harness. | **FR-CORE-021.** The platform shall keep the EHR write-back simulator as a test double disabled as an external integration (`enabled: false` in the adapter registry) — it exists to prove the approval-token pattern, not as a partial live-write feature. |
| Wearables / CGM / device data | **Missing (live); schema exists.** `wearableSampleSchema` defines the shape; no live device integration exists; all current wearable data is `synthetic_fixture` or `ingestion_stub` provenance. | **FR-CORE-022 (Phase 2+, not this build).** A live wearable/CGM adapter shall follow the same `ingestion-stub` → consent-gated → explicitly-flagged pattern as every other modality (Chapter 4, FR-ARC-037) when commissioned; this Volume does not request it be built now. |
| Labs (LOINC-coded results) | **Missing (live); schema exists.** `labSampleSchema` defines the shape; no live lab-feed integration exists. | **FR-CORE-023 (Phase 2+, not this build).** A live lab-results adapter (e.g. HL7v2 ORU or FHIR `Observation` subscription) shall be scoped as a new adapter entry in `getIntegrationAdapterRegistry` with its own status and boundary statement — not silently added to an existing adapter's scope. |
| Pharmacy / dispensing feed | **Missing entirely.** No schema, no adapter entry exists in code today. | **FR-CORE-024 (Phase 2+, not this build).** A pharmacy/dispensing adapter is out of scope for this Volume; if commissioned, it shall follow FR-CORE-018–023's adapter-registry pattern rather than being added as an undocumented dependency. |
| HL7v2 messaging (ADT/ORU feeds) | **Missing entirely.** The platform's current and planned interop surface is FHIR R4-shaped (export, Medplum, EMIS staging); no HL7v2 listener or parser exists. | **FR-CORE-025.** The platform shall not silently acquire an HL7v2 dependency; if a future integration genuinely requires HL7v2 (e.g. a hospital ADT feed), that dependency shall be named explicitly in the Tech Stack ADR before being added, per that ADR's own trigger-based change process. |

- **FR-CORE-026.** `liveEmis: false` (or the equivalent literal-typed honesty field) shall appear on every interoperability adapter's status/probe response without exception, for the duration this Volume is in effect — restating Chapter 1 NO-4 and Chapter 4 FR-ARC-035 as a per-adapter contract.
- **FR-CORE-027.** The integration-adapter registry (`getIntegrationAdapterRegistry`) shall remain the single, queryable list of every external connection the platform has, is building, or has scaffolded — a new adapter shall not exist in code without a corresponding registry entry.

> **AC-CORE-019-1.** Given `ENABLE_MEDPLUM_SYNC` is unset, when any code path calls `getMedplumRehearsalStatus()`, then `mode` shall be `"disabled"` and `liveEmis` shall be `false`.
>
> **AC-CORE-020-1.** Given the EMIS staging adapter has sandbox credentials configured and `sandboxFlagEnabled: true`, when a HITL-approved bundle is queued, then its status shall be `sandbox_flag_on_creds_present_write_deferred` — never a status implying a completed write — and `ehrWriteAttempted` shall remain `false`.

### 6.5 Knowledge Fabric

**Purpose.** Provide the shared substrate — graph relationships, longitudinal history, and (future) semantic retrieval and coded terminology — that every agent and disease module reads from, so no capability builds its own private data store for information the platform already holds.

| Component | Current state | Required state (this chapter) |
| --- | --- | --- |
| Knowledge Graph (Neo4j) | **Partial — exists with honest mock fallback.** `lib/neo4j/` provides patient, guardian-interaction, and ICS-population queries; `lib/neo4j/mock-fallback.ts` mirrors the live schema shape from `lib/mock-data/` when Neo4j is unconfigured/unreachable; `Neo4jMockModeBanner` discloses which mode is active in the UI. | **FR-CORE-028.** The platform shall serve every Knowledge Graph query correctly in mock mode when Neo4j is unconfigured or unreachable, restating Chapter 4 FR-ARC-029, and the mock/live mode shall always be disclosed to the viewing clinician, restating Chapter 5 FR-HITL-025. |
| Vector / embedding memory | **Missing — deliberately deferred.** No embedding, RAG, or similar-case retrieval use case exists in the product today; the Tech Stack ADR names Qdrant as "Avoid now" and states the documented precedent is to extend Neon Postgres with **pgvector** first, if and when a retrieval use case (e.g. Research Intelligence literature grounding, or a "similar encounters" feature) actually appears. | **FR-CORE-029 (Phase 2+, trigger-based, not this build).** The platform shall not adopt a vector/embedding store until a named consuming feature exists (per `docs/ADR_TECH_STACK_MODERNIZATION.md`'s trigger), and when it does, the platform shall extend the existing Neon Postgres instance with `pgvector` rather than introduce a new database service, absent a documented reason to deviate. |
| Ontology / coded terminology (SNOMED, ICD-10, LOINC, RxNorm) | **Partial, narrow.** Dr.Assist (`lib/agents/llm-dr-assist.ts`) produces diagnosis-coding drafts today via deterministic fallback or AI Gateway narrative — this is coding-*suggestion*, not a queryable terminology server. No live SNOMED/ICD-10/LOINC/RxNorm terminology service, code-validation API, or formal ontology graph exists or is called. John Snow Labs NLP (referenced in `docs/BUILD_INSTRUCTIONS_GAP.md`) is explicitly not wired. | **FR-CORE-030 (Phase 2+, not this build).** A live coded-terminology service (SNOMED CT / ICD-10 / LOINC / RxNorm validation or lookup) is **not** part of this Volume's required build — this chapter records it as a future requirement, phase-gated on a named trigger (a feature requiring code validation beyond Dr.Assist's current suggestion-only draft), consistent with the Tech Stack ADR's "Avoid now" position on a formal ontology layer beyond Neo4j's current scope. This Volume does not invent or imply a live terminology server exists. |
| Longitudinal patient timeline | **Exists.** `lib/precision-health/timeline.ts`'s `buildPatientTimeline` merges case activity, modality samples, learning outcomes, and consent changes into one chronological, `ehrWrite: false`-tagged event stream per patient, explicitly labeled *"not a production unified health record."* | **FR-CORE-031.** The platform shall keep the longitudinal timeline as the single merge point for a patient's cross-capability history (case activity, modality samples, learning outcomes, consent changes, and — once wired — disease-module signals per Chapter 4 FR-ARC-007) rather than each capability exposing its own separate history view. |
| Clinical memory (case/audit trail) | **Exists.** SHIELD (Chapter 5, §5.4) and the review-case audit-event log together constitute the platform's clinical memory of what was decided, by whom, and why. | **FR-CORE-032.** The platform shall treat SHIELD plus the review-case audit trail as its clinical-memory system of record; a future "clinical memory" or "agent memory" feature shall read from and append to this existing trail rather than introduce a parallel memory store (restates Chapter 4 FR-ARC-028 at the memory-component level). |

- **FR-CORE-033.** The Knowledge Fabric's honesty posture (mock-vs-live disclosure, no live terminology claim, no vector-store claim) shall be consistent across every layer that touches it — a UI surface, an API response, and an internal log shall never disagree about whether a given Knowledge Fabric component is live, mocked, or absent.

> **AC-CORE-028-1.** Given `NEO4J_URI` is unset, when a clinician opens a patient's Guardian panel, then the response shall be served from `getMockPatientResponse`/`getMockGuardianResponse` and the UI shall display the mock-mode banner rather than presenting mock data as a live graph query result.

### 6.6 Edge cases

- **§6.7-EC-1 (revoked consent mid-flow).** Given a patient revokes their `care_delivery` consent for the `wearable` modality while a CONDUCTOR orchestration run for that patient is already in progress using wearable-derived context, then the in-flight run shall complete using the context it had already gathered (it is not re-checked mid-run), but any *new* orchestration run for that patient shall fail the `isModalityGranted` check and proceed under `request_more_data` or with that data source excluded, per FR-CORE-010. This is a product decision this chapter makes explicitly, not a race condition left undefined.
- **§6.7-EC-2 (tenant breach attempt).** Given a `gp` identity from Practice A crafts a request with a `practiceId` query parameter for Practice B, then `filterRecordsForPractice` shall filter the response to Practice A's records regardless of the requested parameter — the tenant filter is derived from the resolved session, never from a client-supplied parameter (restates FR-CORE-001).
- **§6.7-EC-3 (Knowledge Graph offline mid-session).** Given Neo4j becomes unreachable partway through a clinician's session (e.g. after opening a live-mode dashboard), then subsequent Knowledge Graph queries shall fall back to mock mode and the UI banner shall update to reflect the change — the platform shall not continue silently serving stale live data or crash the surface (restates Chapter 5 FR-HITL-025/033).
- **§6.7-EC-4 (admin role attempting a clinical-record read via a non-obvious route).** Given an `operations_lead` identity attempts to reach patient-identifiable data via a route not explicitly modeled as a "clinical-record API" (e.g. an export or debug endpoint), then that route shall still apply `evaluateClinicalApiAccess` (or an equivalent check) before returning patient-identifiable content — the isolation policy is a property of the data being returned, not of the specific route name.
- **§6.7-EC-5 (duplicate/conflicting consent grants).** Given a patient has two active grants for the same `purposeCode` with different modality sets, then `isModalityGranted` shall return `true` if *either* active grant covers the requested modality (grants are additive, not last-write-wins) — the platform shall not silently invalidate an earlier grant when a new one is created for the same purpose unless the new grant explicitly carries a `revokeGrantId` for the earlier one.

### 6.7 Open questions

- **OQ-CORE-1.** Confirm the plan and timeline to extend `buildRolePermissionMatrix()` from its current 2-`AppRole` scope to the full 8-`UserRole` set (Chapter 3) across all persona dashboard surfaces, and to move `productionRbacEnforced` from `false` toward a genuine production enforcement claim. **Owner:** Engineering + Product.
- **OQ-CORE-2.** Confirm whether §6.7-EC-1's "in-flight run completes, new runs are re-checked" behavior is the correct product decision for consent revocation mid-flow, or whether a stronger requirement (abort in-flight runs on revocation) is needed for a future pilot. **Owner:** Clinical Safety Lead + Product.
- **OQ-CORE-3.** Confirm the named trigger and target phase for a live coded-terminology service (FR-CORE-030) — today Dr.Assist's coding drafts are not validated against any live terminology source, which is acceptable for a HITL-gated draft but should be tracked as a explicit gap, not forgotten. **Owner:** Product + Clinical Safety Lead.
- **OQ-CORE-4.** Confirm the retention policy for revoked consent grants and superseded modality samples — FR-CORE-009 requires they are never deleted, but no maximum retention period or archival policy is currently specified (relates to Chapter 5's OQ-HITL audit-retention open question). **Owner:** Compliance + Engineering.
- **OQ-CORE-5.** Confirm whether §6.7-EC-5's additive-grant behavior (multiple active grants per purpose code, union of modalities) matches clinical/compliance expectations, or whether a single-active-grant-per-purpose-code constraint should be enforced instead. **Owner:** Compliance + Product.

### 6.8 Cross-references

- Chapter 1 (§1.4 NO-3/NO-4/NO-6/NO-8) — the write-boundary, consent, and single-system commitments this chapter enforces as identity/consent/interop requirements.
- Chapter 2 (§2.2/§2.3 NS-4/NS-5) — the synthetic/pilot-only data boundary this chapter's §6.3 data-lineage requirements restate per-record.
- Chapter 3 (§3.1 the 8-role table, §3.5 auth/authz, §3.6 tenant isolation) — the persona and isolation model this chapter's §6.1 turns into enforced identity requirements.
- Chapter 4 (§4.2 Layer 1 rows, §4.4 core components, FR-ARC-004–012/028/029) — the architecture-overview statements this chapter elevates to full requirements depth.
- Chapter 5 (§5.4 SHIELD, §5.6 regulatory honesty fields, §5.7 continuous learning) — the audit and honesty mechanics this chapter's §6.1/§6.4/§6.5 apply to identity, interop, and Knowledge Fabric specifically.
- `docs/ADR_TECH_STACK_MODERNIZATION.md` (Knowledge/terminology section, Qdrant/pgvector rows) — the authoritative stack-trigger decisions this chapter's §6.5 restates without re-litigating.
- `docs/BUILD_INSTRUCTIONS_GAP.md` — referenced for the John Snow Labs NLP / terminology gap this chapter's §6.5 records honestly.
- Chapter 7 (Universal Agent Platform, `[DRAFTED]`) depends on this chapter's Identity/Consent requirements being fixed, since an agent's output is only as trustworthy as the identity and consent context it was generated under.

---

## 10. Chapter 7 — Universal Agent Platform `[DRAFTED]`

### 7.0 Purpose of this chapter

Chapter 4 (§4.3.2) named the agent platform as a module group; Chapter 6 fixed the identity, consent, and Knowledge Fabric context every agent runs under. This chapter specifies the 12-agent directory itself at full functional-spec depth — what each agent is for, what it consumes and produces, when it runs, how it meets a clinician through HITL, and how the fixed orchestration contract binds them together. It closes Part B.

### 7.1 Agent ecosystem framing

- **FR-AGT-001.** The platform shall present its 12 named agents as **platform services** — internal, typed, in-process functions/modules invoked by one deterministic orchestrator (CONDUCTOR) — not as independently deployed microservices, and not as nodes in a dynamic, LLM-planned graph (e.g. LangGraph-style agent-to-agent handoff). Restates Chapter 4 FR-ARC-009's "no event bus, no async workflow engine needed" position at the agent layer.
- **FR-AGT-002.** CONDUCTOR's control flow (§7.3) shall remain hard-coded and deterministic — the sequence, parallelism, and priority rules of which agent runs when are defined in code (`resolveReviewOrder`, `resolveQueuePriority`), not decided at runtime by a planning LLM call. No agent shall decide which other agent runs next.
- **FR-AGT-003.** The platform shall use the canonical July 2026 agent names (`AGENT_DIRECTORY` in `lib/agents.ts`) in all product-facing and specification surfaces: **HORIZON** (not ORACLE), **COMPASS** (not EQUITY), **PATHWAY** (not REFERRAL). Legacy identifiers (`ORACLE`, `EQUITY`, `REFERRAL`) remain in code as internal ids, environment variable names, and API route segments — this chapter does not require those be renamed, only that product copy and this specification use the canonical label via `resolveClinicalAgentLabel`/`formatAgentTimelineLabel`.
- **FR-AGT-004.** The platform shall treat VOICE (dictation intake) and Dr.Assist (coding suggestions) as **sub-capabilities** of CANVAS and SYNTHESIS respectively — not as two additional peer entries in the 12-agent directory — per `CLINICAL_AGENT_META`'s own descriptions. This chapter documents them at full depth (§7.2.3, §7.2.9) because they carry real HITL-relevant behavior, but does not count them toward the "12 agents" figure.
- **FR-AGT-005.** PRISM (Imaging Intelligence) and ATLAS (Clinical Research) shall remain labeled Phase 2 / `live: false` in the agent directory and shall not be described anywhere in product copy or this Volume as available capabilities — restates Chapter 2's non-objective boundary at the agent-directory level.

### 7.2 Agent catalog

Each entry states Purpose, Responsibilities, Inputs, Outputs, Triggers, HITL interaction, and key acceptance criteria. Agents are grouped where a shared pattern makes that clearer; each still gets its own requirement IDs.

#### 7.2.1 CONDUCTOR (Supervisor Agent — Orchestration)

**Purpose.** Be the single deterministic entry point that runs the other agents against one shared patient context and resolves a safety route — restates Chapter 4 FR-ARC-027/FR-ARC-009 as an agent-level capability, and Chapter 5 §5.1's "one clinical spine" requirement.

**Responsibilities:** build a `SharedPatientContext` (patientId, label, proposed drug, transcript, flags); run SYNTHESIS/GUARDIAN/HORIZON/NEXUS (+ optional Dr.Assist) against it; enforce per-agent and overall timeouts; resolve queue priority and review order; resolve the safety route; emit exactly one SHIELD audit event per orchestration run.

**Inputs:** `patientId`, optional `proposedDrug`, optional `transcript`, per-agent inclusion flags, timeout overrides.

**Outputs:** an `OrchestrationResult` (shared context, per-agent outputs in independent slots, queue priority, review order, evidence list, `ehrWrite:false`, `hitlRequired:true`, timing) plus, from the clinical-spine wrapper, a resolved `SafetyRoute` and twin-ranking result.

**Triggers:** a clinician-initiated case run, a demo/rehearsal invocation, or (once wired, per Chapter 4 §4.3.3) a disease-module-flagged case.

**HITL interaction:** CONDUCTOR never itself constitutes a clinician decision — it produces the shared draft set a human then reviews via the queue (Chapter 5, §5.2). It has no independent "accept" path.

Requirements:

- **FR-AGT-006.** CONDUCTOR shall run every included agent against one identical `SharedPatientContext` object and shall assert (`assertSharedContext`) that every agent's output references that same patient before returning — a mismatch shall throw, not warn.
- **FR-AGT-007.** CONDUCTOR shall store each agent's output in an independent slot and shall assert (`assertNoOverwrite`) that no two slots share an object reference — restates the "no overwrite" invariant as a checked, not assumed, property.
- **FR-AGT-008.** CONDUCTOR shall prioritise GUARDIAN first in review order whenever queue priority resolves to `Urgent` (GUARDIAN `overallStatus: red`, or an `URGENT` patient flag) — restates Chapter 5's safety-first ordering as an agent-orchestration contract, checked by an explicit assertion that throws if violated.
- **FR-AGT-009.** CONDUCTOR shall enforce a per-agent timeout (default 8s) and an overall orchestration timeout (default 30s) via `Promise.race`, and shall propagate a timeout as a thrown error — not a partial, silently-degraded result — per Chapter 5 FR-HITL-031.
- **FR-AGT-010.** CONDUCTOR shall verify independent evidence for every agent's output (`collectEvidence`) before returning a result, and shall throw listing the specific agents with weak evidence if any fails — restating Chapter 5 FR-HITL-032.
- **FR-AGT-011.** CONDUCTOR shall emit exactly one SHIELD audit event per orchestration run, tagged `agentLabel: "CONDUCTOR"`, carrying queue priority, review order, safety route, and the full honesty-field set (`ehrWrite`, `hitlRequired`, `physiologicalTwin`, `autoRetrain`, `liveEmis`) — restates Chapter 5 §5.4/§5.6 at the orchestration-event level.

> **AC-AGT-008-1.** Given a patient flagged `URGENT` with GUARDIAN status `red`, when CONDUCTOR resolves review order, then GUARDIAN shall be first in `reviewOrder`; if it is not, orchestration shall throw rather than return a misordered result.
>
> **AC-AGT-009-1.** Given HORIZON exceeds its 8-second per-agent timeout, when CONDUCTOR is running the full agent set, then the orchestration shall throw an `AgentTimeoutError` for HORIZON and shall not return a result containing a stale, cached, or default HORIZON output in its place.

#### 7.2.2 SYNTHESIS (Clinical Documentation Agent)

**Purpose.** Turn a consultation transcript (or synthetic default) into a structured SOAP-style clinical documentation draft.

**Responsibilities:** produce `subjective`/`objective`/`assessment`/`plan` fields plus `safetyNotes` and a `confidence` score, via AI Gateway when configured or a deterministic fallback otherwise.

**Inputs:** transcript text, patient label.

**Outputs:** a `SynthesisDraft` (`mode: "llm" | "deterministic"`, SOAP fields, safety notes, confidence, raw text).

**Triggers:** CONDUCTOR orchestration run; VOICE intake completion (dictation feeds SYNTHESIS's transcript input).

**HITL interaction:** surfaced as a `soap_note` review-queue item; a clinician must Accept/Edit/Reject before the note is considered finalized (Chapter 5, §5.2).

- **FR-AGT-012.** SYNTHESIS shall never claim its output has been filed to EMIS/SystmOne — its own system prompt and every output path shall treat the SOAP draft as draft-only pending HITL, per Chapter 1 NO-4.
- **FR-AGT-013.** SYNTHESIS shall fall back to a deterministic, non-LLM draft (`deterministicFallback`) when the AI Gateway is not configured or `ENABLE_LLM_SYNTHESIS=false`, and shall mark that draft `mode: "deterministic"` so downstream consumers and clinicians can distinguish it from an AI Gateway-generated draft.

> **AC-AGT-012-1.** Given SYNTHESIS is invoked with a transcript, when it returns a draft, then the draft's `mode` field shall be present and correctly reflect whether an AI Gateway call was made, and no field in the response shall assert or imply the note is filed.

#### 7.2.3 VOICE (dictation intake — sub-capability of CANVAS)

**Purpose.** Convert a spoken/dictated consultation into a transcript with a confidence score that seeds CANVAS's shared patient context and SYNTHESIS's transcript input.

**Responsibilities:** stage a transcript for HITL alongside its source type and transcription confidence; hand off to CANVAS's intake-generation pipeline (`lib/intake-generation.ts`).

**Inputs:** raw audio/dictation (or, in the current build, synthetic/simulated transcription per Chapter 6's transcription-dependency status).

**Outputs:** a `voice_transcript` review-queue item (transcript summary, source type, confidence).

**Triggers:** a clinician-initiated dictation/intake session.

**HITL interaction:** the transcript itself is reviewable as a queue item before SYNTHESIS/CANVAS treat it as ground truth.

- **FR-AGT-014.** VOICE shall attach a `transcriptConfidence` to every transcript it produces, and CANVAS/SYNTHESIS shall surface that confidence to the reviewing clinician rather than presenting a transcript as ground truth without it.

#### 7.2.4 CANVAS (Clinical Intake Agent)

**Purpose.** Build the shared, structured intake context (inferred conditions, medications, vitals, generation trace) that CONDUCTOR's downstream agents consume — the platform's single intake normalization point (Chapter 4, FR-ARC (data flow, §4.5 stage 2)).

**Responsibilities:** normalize consultation input into a `FhirBundleDraft`-shaped structure with a field-by-field `GenerationTraceItem` explaining each inferred value's source snippet and rationale (explainability requirement, §7.5).

**Inputs:** `ConsultationInput` (transcript, pathway hint, confidence mode, source profile, inferred-context overrides).

**Outputs:** structured draft resources plus a generation trace (source snippet → inferred value → rationale, per field).

**Triggers:** intake session start (voice or typed).

**HITL interaction:** every inferred field is traceable to its source snippet via the generation trace, so a clinician reviewing the resulting SOAP/coding drafts can verify *why* a given value was inferred (§7.5).

- **FR-AGT-015.** CANVAS shall attach a `GenerationTraceItem` (source snippet, inferred value, rationale) to every inferred field it produces — an inferred value with no traceable source snippet shall not be emitted.

#### 7.2.5 GUARDIAN (Medication Intelligence Agent — Safety)

**Purpose.** Produce a medicines-safety brief (drug–drug interaction / allergy check) that determines whether a case is escalated as `Urgent`.

**Responsibilities:** query the Knowledge Graph (Neo4j, or mock fallback per Chapter 6 §6.5) for known interactions given a patient and optional proposed drug; classify `overallStatus` (`red`/`amber`/`green`); produce clinician actions and safety notes.

**Inputs:** `patientId`, optional `proposedDrug`.

**Outputs:** a `GuardianDraft` (`dataSource: "neo4j" | "mock"`, `overallStatus`, `interactions[]`, summary, clinician actions, safety notes, confidence).

**Triggers:** CONDUCTOR orchestration run; standalone `/api/agents/guardian` call.

**HITL interaction:** surfaced as a `guardian_alert` review-queue item when high-severity flags exist; drives CONDUCTOR's urgent-priority/review-order behavior (§7.2.1).

- **FR-AGT-016.** GUARDIAN shall disclose its `dataSource` (`neo4j` or `mock`) on every output, and that disclosure shall propagate to the UI per Chapter 6 FR-CORE-028 — a GUARDIAN brief shall never be presented without indicating which data source backed it.
- **FR-AGT-017.** GUARDIAN's `overallStatus` classification shall be the single input CONDUCTOR's `resolveQueuePriority` uses to detect urgency from medicines safety — no other agent shall independently declare a case `Urgent` on safety grounds.
- **FR-AGT-018.** GUARDIAN shall never claim an alert has been "filed" — its system prompt and output shape shall treat every brief as draft pending clinician action, restating Chapter 1 NO-4.

> **AC-AGT-017-1.** Given GUARDIAN returns `overallStatus: "red"` for a patient, when CONDUCTOR resolves queue priority, then `queuePriority` shall be `"Urgent"` regardless of HORIZON's risk classification.

#### 7.2.6 HORIZON (Predictive Risk Agent, internal id `ORACLE`)

**Purpose.** Produce a CVD/T2D composite risk narrative with contributing factors for clinician review — restates Chapter 4's Layer 6/7 (Population/Patient Intelligence) risk-scoring role as an agent capability.

**Responsibilities:** read a patient's existing risk score, conditions, medications, and risk factors from the Knowledge Graph (or mock); narrate contributing factors and recommended clinician actions; never invent a score, condition, or medication not supplied.

**Inputs:** `patientId`.

**Outputs:** an `OracleDraft` (risk score, risk band, conditions, medications, risk factors, admission-risk figure, summary, contributing factors, clinician actions, safety notes, confidence).

**Triggers:** CONDUCTOR orchestration run; standalone `/api/agents/oracle` call.

**HITL interaction:** surfaced as an `oracle_update` (risk score update) review-queue item when a score has changed.

- **FR-AGT-019.** HORIZON shall not invent a risk score, condition, or medication that was not present in its supplied graph/mock context — its own system prompt states this rule, and this chapter makes it a product requirement, not only a prompt-engineering choice.
- **FR-AGT-020.** HORIZON shall be the sole agent that produces the platform's composite CVD/T2D risk score and risk band — no other agent (including a disease module, per §7.4) shall independently assign a competing risk score for the same patient; disease-module signals contribute *factors*, not a second score.
- **FR-AGT-021.** Once a Disease Intelligence module is wired (Chapter 4, FR-ARC-040), its `horizonContributingFactors` shall be merged into HORIZON's `contributingFactors` list rather than replacing or overriding HORIZON's own risk-score computation.

> **AC-AGT-019-1.** Given HORIZON's supplied graph context lists two conditions, when it produces a narrative, then its output shall reference only those two conditions and shall not introduce a third condition not present in the supplied context.

#### 7.2.7 NEXUS (Clinical Intelligence Agent)

**Purpose.** Surface 2–3 clinically significant cross-signal correlations (e.g. a medication and a lab trend) a GP should consider, as a `ClinicalImpression`-shaped draft.

**Responsibilities:** correlate only supplied conditions/medications/risk signals; always return `status: "draft"`; never invent data.

**Inputs:** `patientId`.

**Outputs:** a `NexusDraft` (`fhirResource: "ClinicalImpression"`, `status: "draft"`, correlations `{link, significance, suggestedConsideration}[]`, safety notes, confidence).

**Triggers:** CONDUCTOR orchestration run (included by default, `includeNexus !== false`).

**HITL interaction:** correlations are review-only input to the clinician's assessment; NEXUS output cannot itself trigger an action.

- **FR-AGT-022.** NEXUS shall always return `status: "draft"` and CONDUCTOR shall throw if it does not (`"NEXUS must return status: draft — refusing non-draft output"`) — restates Chapter 5 FR-HITL-005 as a checked assertion specific to NEXUS.
- **FR-AGT-023.** NEXUS shall not correlate data it was not supplied — its system prompt and this requirement jointly forbid inventing conditions, medications, results, or risk scores to manufacture a correlation.

#### 7.2.8 PATHWAY (Care Coordination Agent, internal id `REFERRAL`)

**Purpose.** Draft a care-coordination/referral package (e.g. urgent DVT imaging pathway) from an accepted clinical assessment, ready for GP Accept before any `ServiceRequest` write-back.

**Responsibilities:** build a referral queue item with priority, requested investigations, clinical indication, and supporting codes; build a `ServiceRequest` FHIR resource stub in `draft` status.

**Inputs:** the accepted `ReviewCase` (condition, supporting codes).

**Outputs:** a `referral_package` review-queue item; a draft `ServiceRequestResource`.

**Triggers:** SOAP note and diagnosis codes both reaching `ACCEPTED` status (`soapAndCodesAccepted`).

**HITL interaction:** the referral package itself requires GP Accept before the `ServiceRequest` stub is considered ready for any downstream staging (Chapter 6 §6.4's BRIDGE/EMIS-staging path).

- **FR-AGT-024.** PATHWAY shall only build a referral package once both the SOAP note and diagnosis codes for the case have reached `ACCEPTED` status — it shall not draft a referral from an unreviewed assessment.
- **FR-AGT-025.** PATHWAY's `ServiceRequestResource` output shall remain in `status: "draft"` and shall require a further GP Accept action before any staging/write-back adapter (Chapter 6, §6.4) treats it as ready.

#### 7.2.9 Dr.Assist (coding — sub-capability of SYNTHESIS)

**Purpose.** Suggest SNOMED CT and ICD-10 codes for clinician review from known conditions/medications/risk context.

**Responsibilities:** produce coded suggestions with per-code confidence; fall back to a small deterministic SNOMED/ICD-10 lookup (`inferIcdCodes`) when the AI Gateway/John Snow Labs NLP path is unavailable (which, per Chapter 6 §6.5 FR-CORE-030, it always is in this build).

**Inputs:** `patientId`, known conditions/medications.

**Outputs:** a `diagnosis_codes` review-queue item; a `DrAssistDraft` (coded suggestions `{system, code, display, confidence}[]`, clinician actions, safety notes).

**Triggers:** CONDUCTOR orchestration run (`includeDrAssist`, default true in `runAgentOrchestration`, default false in the clinical-spine wrapper).

**HITL interaction:** coding suggestions require clinician Accept before PATHWAY can reference them as "supporting codes" (§7.2.8).

- **FR-AGT-026.** Dr.Assist shall label every coded suggestion with a `system` of exactly `"SNOMED CT"` or `"ICD-10"` and shall not present a suggestion as a validated, terminology-server-confirmed code — restating Chapter 6 FR-CORE-030's "suggestion, not a live terminology server" distinction at the agent level.
- **FR-AGT-027.** Dr.Assist shall not invent a condition not supplied in its input context when generating coding suggestions.

#### 7.2.10 COMPASS (Population Health Agent, internal id `EQUITY`)

**Purpose.** Produce an aggregate, practice/ICS-level health-disparity action brief — never a named-patient output.

**Responsibilities:** read aggregate equity flags from the Knowledge Graph (or mock ICS-population response); produce priorities and recommended actions for ICS leads.

**Inputs:** ICS/practice identifier, aggregate equity flags.

**Outputs:** an `EquityDraft` (summary, priorities, recommended actions, safety notes, confidence) — no patient-level identifiers.

**Triggers:** an `ics-lead`/`hospital-executive` persona (Chapter 3) requesting a population brief.

**HITL interaction:** reviewed by the requesting persona; COMPASS cannot itself action a recommendation.

- **FR-AGT-028.** COMPASS shall never include a named patient or patient-identifiable detail in its output — restates Chapter 4 FR-ARC-033's small-cell-suppression concern at the agent-output level; a violation here is a defect, not an open question.
- **FR-AGT-029.** COMPASS shall never claim write-back to EMIS, SystmOne, or a national system — its system prompt and output shape are recommendation-only.

> **AC-AGT-028-1.** Given COMPASS is invoked for an ICS with a small underlying cohort, when it returns a brief, then no field in the response shall contain a patient name, NHS number, or other patient-identifiable value.

#### 7.2.11 BRIDGE (Interoperability Agent)

**Purpose.** Stage a HITL-accepted case's FHIR bundle into the platform's own internal staging record and the EMIS-staging queue (Chapter 6, §6.4) — never a live EHR write.

**Responsibilities:** build an accepted FHIR R4 staging bundle from a `ReviewCase`; persist a `BridgeStagingRecord`; queue an EMIS-staging envelope; optionally attempt a simulated EHR write via a short-lived clinician approval token (test-double only, per Chapter 6 §6.4).

**Inputs:** an `ACCEPTED` `ReviewCase`.

**Outputs:** a `BridgeAcceptStageResult` (`liveEmis: false`, `ehrWriteAttempted: false`, `medplumRequired: false`, `status: "preliminary"`).

**Triggers:** a clinician's Accept action on a case (Chapter 5, §5.2).

**HITL interaction:** BRIDGE only runs *after* HITL acceptance — it is a post-decision staging step, not a pre-decision drafting agent like SYNTHESIS/GUARDIAN/HORIZON/NEXUS.

- **FR-AGT-030.** BRIDGE shall require a case to already be in `ACCEPTED` status before staging any FHIR bundle — it shall not stage a draft or rejected case.
- **FR-AGT-031.** BRIDGE's staging output shall carry `liveEmis: false` and `ehrWriteAttempted: false` unconditionally in this build, restating Chapter 6 FR-CORE-026 at the BRIDGE-agent level.

#### 7.2.12 SHIELD (Regulatory & Audit Agent — Governance)

**Purpose.** Be the platform's single immutable, hash-chained audit trail for every reviewer action and every agent/orchestration event — already specified in full at Chapter 5 §5.4; this chapter states SHIELD's role as an agent-directory entry rather than re-deriving its mechanics.

- **FR-AGT-032.** SHIELD shall receive an audit event from every other agent's clinically-relevant action (CONDUCTOR run, BRIDGE stage, consent grant/revoke per Chapter 6 FR-CORE-012, queue decisions per Chapter 5) — no agent in this directory shall have a clinically-relevant action that produces zero SHIELD event.

#### 7.2.13 PRISM and ATLAS (Phase 2 — not built)

- **FR-AGT-033.** PRISM (Imaging Intelligence Agent) and ATLAS (Clinical Research Agent) shall remain `phase: 2`, `live: false` in `AGENT_DIRECTORY` for the duration this Volume is in effect. Neither shall be invoked from CONDUCTOR, referenced in a persona's onboarding path (Chapter 3) as available, or described in product marketing copy as a current capability.

#### 7.2.14 VOICE CARE (Day-3 synthetic outbound escalation) — adjacent capability, not a 12-agent-directory entry

**Purpose.** Note on naming: VOICE CARE (`lib/agents/voice-care.ts`, a synthetic Day-3 outbound check-in escalation that creates a nurse task) is a **distinct capability from VOICE** (§7.2.3, dictation intake) despite the similar name. This chapter records the distinction explicitly to prevent the two being conflated in later chapters or in product copy.

- **FR-AGT-034.** The platform shall never present VOICE CARE as performing live telephony — its own output type carries `channel: "synthetic_outbound"` and `telephony: false` unconditionally, and this shall remain true for the duration this Volume is in effect (restates Chapter 1 NO-4/Chapter 2 NS-4 at this capability).
- **FR-AGT-035.** VOICE CARE's escalation shall always produce a nurse-facing task (`hitlRequired: true`) rather than closing the loop autonomously — restates Chapter 5 §5.1 at this capability.

### 7.3 Orchestration contract

CONDUCTOR's fixed pipeline, restated precisely from `lib/clinical-proof/agent-orchestration.ts` and `lib/clinical-spine/safety-route.ts`:

1. **Shared context build** — one `SharedPatientContext` per run.
2. **Parallel agent execution** — SYNTHESIS, GUARDIAN, HORIZON, and (by default) NEXUS run concurrently against that context, each under its own timeout; Dr.Assist runs after, when included.
3. **Priority resolution** — `Urgent` if GUARDIAN is `red` or an `URGENT` flag is present; `High` if GUARDIAN is `amber` or HORIZON risk is `High`/`VeryHigh`; else `Normal`.
4. **Review-order resolution** — GUARDIAN first when `Urgent` (then HORIZON, SYNTHESIS, NEXUS, Dr.Assist); otherwise SYNTHESIS, GUARDIAN, HORIZON, NEXUS, Dr.Assist. (This is the precise version of the "SYNTHESIS → GUARDIAN → HORIZON/NEXUS" shape, with the documented GUARDIAN-first exception under urgency.)
5. **Independent-evidence check** — every included agent's output must pass its evidence check or the run throws (§7.2.1, FR-AGT-010).
6. **Safety-route resolution** — `resolveSafetyRouteFromOrchestration` maps the orchestration result to one of `low_risk_coaching` / `clinical_review_queue` / `urgent_flag` / `request_more_data` (Chapter 5, §5.2).
7. **SHIELD audit** — exactly one audit event for the run (FR-AGT-011).
8. **HITL handoff** — the result becomes review-queue items; no automatic action is taken on it (Chapter 5, §5.1–§5.2).

**Failure behavior (restated from Chapter 5):**

- **FR-AGT-036.** A per-agent timeout, an overall-orchestration timeout, a shared-context mismatch, an output-slot overwrite, or a failed independent-evidence check shall each cause the orchestration to throw and return no result — restating Chapter 5 FR-HITL-031/032 as the specific failure modes enumerated in this chapter.
- **FR-AGT-037.** A thrown orchestration error shall not produce a partial review-queue item, a cached prior result, or a default/placeholder draft presented as current — a clinician shall see either a complete, evidenced result or an explicit failure, never an ambiguous in-between.

> **AC-AGT-036-1.** Given HORIZON's output is missing a numeric `oracleScore` (evidence check fails), when CONDUCTOR evaluates evidence, then orchestration shall throw `"Independent evidence missing for: ORACLE"` and no review-queue items shall be created from that run.

### 7.4 How disease modules feed agents

Restating Chapter 4 §4.3.3/§4.8 at the agent-integration-point level, using the Diabetes v0 stub as the concrete (not-yet-wired) example:

- **FR-AGT-038.** Once wired (Chapter 4, FR-ARC-040 — behind a feature flag, not yet done as of this Volume's drafting), a disease module's composite contribution (e.g. `buildDiabetesRiskContribution`) shall feed exactly two existing agents: its `horizonContributingFactors` merge into HORIZON's `contributingFactors` (§7.2.6, FR-AGT-021), and its `guardianSafetyFlags` merge into GUARDIAN's safety-notes/interaction context (§7.2.5) — no new agent is created for a disease module's signals.
- **FR-AGT-039.** A disease module's coaching drafts (e.g. Diabetes Nutrition/Exercise/Behaviour) shall surface via the existing coaching-draft pattern (Chapter 4, FR-ARC-018) rather than through any of the 12 directory agents — coaching is a Patient Intelligence surface, not an agent-directory capability.
- **Honest current-state note.** As stated in Chapter 4 §4.3.3, this wiring does not exist yet — `lib/disease-modules/diabetes/index.ts`'s `buildDiabetesRiskContribution` is not called from `lib/clinical-spine/orchestrate.ts`, `lib/agents/llm-oracle.ts`, or `lib/agents/llm-guardian.ts`. FR-AGT-038/039 state the required *shape* of that integration once built, per the Diabetes spec's own design; Chapter 8 will track the wiring itself as a Diabetes-module requirement, not an agent-platform one.

### 7.5 Explainability / evidence requirements

- **FR-AGT-040.** Every agent that produces a clinically-actionable draft (SYNTHESIS, GUARDIAN, HORIZON, NEXUS, PATHWAY, Dr.Assist) shall include a `confidence` value and, where applicable, `safetyNotes`/`clinicianActions` fields that ground the draft in reviewable reasoning — a bare recommendation with no supporting factors shall not be considered a valid draft.
- **FR-AGT-041.** CANVAS's generation trace (§7.2.4) shall be available to the reviewing clinician for any inferred intake field that feeds a downstream agent's draft, so a clinician can trace a SOAP-note or coding-suggestion detail back to the transcript snippet it was inferred from.
- **FR-AGT-042.** No agent shall assert numeric confidence, a risk score, or a coded suggestion without the underlying supplied data being visible in the same response (conditions, medications, risk factors, interactions as applicable) — restating each agent's own "do not invent" system-prompt rule as a cross-cutting product requirement, not just a prompt-engineering convention that could silently regress.

### 7.6 Non-goals

- **NO-AGT-1.** No agent in this directory shall write to EMIS, SystmOne, or any live EHR autonomously or otherwise — restates Chapter 1 NO-4 at the agent-directory level; every agent's output type carries `ehrWrite: false` (or an equivalent literal) without exception.
- **NO-AGT-2.** No agent shall autonomously prescribe, dose, titrate, or otherwise finalize a medication decision — GUARDIAN flags and HORIZON scores inform a clinician's medication decision; neither agent nor any other in this directory makes one (restates Chapter 1 NO-3, Chapter 5's Medication Decision human gate).
- **NO-AGT-3.** No agent shall produce a side effect (a write, a notification to a third party, a queued external action) that a clinician did not either trigger or subsequently accept — CONDUCTOR's own outputs are drafts; BRIDGE only stages after Accept; VOICE CARE only escalates to a nurse task, never to an external channel.
- **NO-AGT-4.** No agent shall dynamically alter CONDUCTOR's orchestration order or decide to skip another agent at runtime (restates FR-AGT-002) — any change to review order or which agents run is a code change to `resolveReviewOrder`/`resolveQueuePriority`, reviewed like any other clinical-safety-relevant change (Chapter 5, §5.9).
- **NO-AGT-5.** No agent shall silently change its underlying model or prompt version outside the Governed Model Release SOP (Chapter 5, §5.7, G-ML-1/2/3) — restates Chapter 5's governed-release gate at the per-agent level.

### 7.7 Edge cases

- **EC-AGT-1 (GUARDIAN and HORIZON disagree on urgency).** Given GUARDIAN returns `overallStatus: "amber"` while HORIZON returns `oracleRisk: "VeryHigh"`, then `resolveQueuePriority` resolves to `"High"` (not `"Urgent"`, which requires GUARDIAN `red` or an explicit `URGENT` flag) — this is the defined, deterministic tie-break, not an ambiguous state requiring runtime judgment.
- **EC-AGT-2 (Dr.Assist included but conditions text is ambiguous).** Given `inferIcdCodes`'s deterministic fallback cannot match a known pattern, then it shall return a `"Provisional: <condition text>"` code rather than guessing a specific ICD-10 code — an unmatched condition produces an explicitly provisional suggestion, not a confident-looking wrong code.
- **EC-AGT-3 (PATHWAY invoked before codes are accepted).** Given a case's SOAP note is `ACCEPTED` but diagnosis codes are still `DRAFT`, then `soapAndCodesAccepted` returns `false` and PATHWAY shall not build a referral package — restates FR-AGT-024 as a defined pre-condition check, not a race condition.
- **EC-AGT-4 (COMPASS queried for an ICS with a very small cohort).** Given an aggregate query's underlying group size is small enough that individual patients could be inferred, COMPASS's output is still governed by the k-anonymity/small-cell-suppression threshold that Chapter 4 (OQ-ARC-2) has not yet fixed — this chapter does not resolve that threshold, it only restates that COMPASS must never leak identifiable detail regardless of where that threshold ends up (FR-AGT-028).
- **EC-AGT-5 (BRIDGE staging attempted on a re-opened/edited-then-re-accepted case).** Given a case is Accepted, then later re-opened and edited, then re-Accepted, BRIDGE shall stage the *current* accepted FHIR bundle, and the prior staging record (if any) shall remain in the append-only staging history rather than being overwritten — consistent with SHIELD's append-only pattern (Chapter 5, §5.4).

### 7.8 Open questions

- **OQ-AGT-1.** Confirm whether GUARDIAN-`amber` + HORIZON-`VeryHigh` (EC-AGT-1) should remain `"High"` or be promoted to `"Urgent"` — the current deterministic rule may be too conservative for some clinical scenarios; needs clinical-lead confirmation, not an engineering-only decision.
- **OQ-AGT-2.** Confirm the intended behavior when `includeNexus` or `includeDrAssist` is false for a given run and a downstream capability (e.g. PATHWAY) expects Dr.Assist-sourced codes — is `"Provisional: <condition>"` an acceptable input to a referral package, or should PATHWAY require Dr.Assist to have run? **Owner:** Product + Clinical Safety Lead.
- **OQ-AGT-3.** Confirm the target phase/trigger for PRISM (Imaging) and ATLAS (Research) — this Volume records them as Phase 2/not-built but does not set a target date; premature commitment here would contradict Chapter 2's non-objective boundary (NS-9). **Owner:** Product.
- **OQ-AGT-4.** Confirm whether VOICE CARE's name should be changed to avoid ongoing confusion with VOICE (dictation) — a documentation-only fix (FR-AGT-034/035's behavior would be unaffected) but worth resolving before Chapter 15 (Workflows) needs to reference both by name repeatedly. **Owner:** Product.
- **OQ-AGT-5.** Confirm who owns sign-off when a future change to `resolveReviewOrder`/`resolveQueuePriority` (NO-AGT-4) is proposed — Chapter 5 names a general clinical-safety change-review gate (§5.9) but does not name a specific approver role for orchestration-logic changes specifically. **Owner:** Clinical Safety Lead + Engineering.

### 7.9 Cross-references

- Chapter 1 (§1.4 NO-3/NO-4) — the no-autonomous-prescribing, no-EHR-write commitments restated as NO-AGT-1/NO-AGT-2.
- Chapter 2 (§2.2/§2.3 NS-9) — the Phase 2 boundary restated for PRISM/ATLAS (§7.2.13, OQ-AGT-3).
- Chapter 3 (§3.1 personas) — the clinicians and reviewers who consume every agent's draft via HITL.
- Chapter 4 (§4.3.2 agent-platform module boundary, FR-ARC-013/022/027, §4.3.3/§4.8 disease-module integration) — the architecture-overview statements this chapter elevates to full per-agent requirements depth, and the Diabetes wiring shape restated in §7.4.
- Chapter 5 (§5.1–§5.2 HITL gates, §5.4 SHIELD, §5.7 continuous learning, §5.9 change review) — the safety mechanics this chapter's orchestration contract (§7.3) and non-goals (§7.6) apply per agent.
- Chapter 6 (§6.1 identity/tenant context every agent runs under, §6.5 Knowledge Fabric agents read from, FR-CORE-028/030) — the platform-capability context this chapter's GUARDIAN/HORIZON/Dr.Assist entries depend on.
- `lib/agents.ts` (`AGENT_DIRECTORY`, `CLINICAL_AGENT_META`) — the authoritative agent-naming and phase source this chapter's catalog is built against.
- Chapter 8 (Disease Intelligence — Diabetes, `[DRAFTED]`) takes §7.4's integration shape to full depth, including resolving the actual v0 → v1 wiring (Chapter 4, OQ-ARC-1).

---

## 12. Chapter 8 — Disease Intelligence: Diabetes `[DRAFTED]`

### 8.0 Purpose of this chapter

Diabetes is the first Disease Intelligence module on the Aksh Intelligence Platform and the platform's flagship commercial disease-module proof point (Chapter 1, BO-2). Chapter 4 (§4.3.3) named it as a module group; Chapter 7 (§7.4) fixed exactly how a disease module is required to feed HORIZON and GUARDIAN. This chapter takes Diabetes itself to full functional-spec depth: every one of the 9 intelligence areas, the composite coordination function that unifies them, the phased delivery plan, and the hard non-goals that keep this module a **feature on the existing platform, not a second product**.

This chapter harmonizes two authoritative sources without contradicting either: `docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md` (the product/clinical design) and the actual v0 code in `lib/disease-modules/diabetes/` (what has been built so far). Where the two agree, this chapter cites both. Where the spec describes a v1/v2 behavior not yet in code, this chapter says so explicitly rather than presenting a future state as current.

### 8.1 Purpose of Aksh Diabetes as the first disease module

- **FR-DIAB-001.** Aksh Diabetes shall exist to prove, with a real disease, that the Aksh Intelligence Platform's "module on a platform" pattern (Chapter 4, FR-ARC-002/FR-ARC-038–041) works end-to-end — from typed signal derivation through HORIZON/GUARDIAN integration to clinician-facing HITL review — without requiring a new orchestrator, audit system, consent store, or auth boundary.
- **FR-DIAB-002.** Aksh Diabetes shall be scoped as nine intelligence areas — Glucose, HbA1c, Insulin, GLP-1, Nutrition, Exercise, Behaviour, Complications, Prevention — each a typed signal- or coaching-derivation function, not nine new LLM agents and not nine new entries in the Chapter 7 agent directory. This restates the spec's own framing and Chapter 7's FR-AGT-038/039 as the module's foundational product requirement.
- **FR-DIAB-003.** The commercial and product narrative for Aksh Diabetes shall describe it as "the platform's diabetes intelligence," not as a standalone "diabetes app" — reinforcing Chapter 1's BO-1 (one platform) positioning in every product surface this module touches.

### 8.2 Module boundary

- **FR-DIAB-004.** The Diabetes module shall live entirely at `lib/disease-modules/diabetes/` and shall depend only on existing platform primitives (CONDUCTOR, SHIELD, the consent registry, the Knowledge Graph, the coaching-draft pattern) — restates Chapter 4 FR-ARC-021/024 at the Diabetes-module level.
- **FR-DIAB-005.** The module's internal file layout shall mirror the existing `lib/precision-health/` convention (typed modules + a barrel `index.ts`) rather than introduce a new architectural pattern: `types.ts` (shared types and honesty fields), one file per intelligence area (`glucose.ts`, `hba1c.ts`, `insulin.ts`, `glp1.ts`, `nutrition.ts`, `exercise.ts`, `behaviour.ts`, `complications.ts`, `prevention.ts`), `fixtures.ts` (demo data), and `index.ts` (composite integration point). This matches the module as it exists in code today.
- **FR-DIAB-006.** No file in `lib/disease-modules/diabetes/` shall import from, or be imported by, a hypothetical second disease module's directory — module boundaries between diseases remain hard, per Chapter 4's extensibility model (FR-ARC-038), even though Diabetes is currently the only disease module that exists.

### 8.3 Phasing: v0 → v1 → v2

This restates the spec's phased-delivery plan as binding product requirements, cross-checked against the code's own v0-status comments.

| Phase | Scope | Current status (code-grounded) |
| --- | --- | --- |
| **v0 — Stub types** | Typed signal/coaching shapes for all 9 areas; all honesty fields (`hitlRequired`, `ehrWrite: false`, `autoRetrain: false`, `physiologicalTwin: false` where relevant) as literal types; a minimal self-contained demo fixture; no wiring into HORIZON/GUARDIAN; no UI changes. | **Complete.** Every file listed in §8.2 exists with this exact shape; each signal builder returns an honest "insufficient data" / stub result rather than fabricating a value (verified in `glucose.ts`, `hba1c.ts`, `insulin.ts`, `glp1.ts`, `complications.ts`, `prevention.ts`). |
| **v1 — Rules / demo signals** | Deterministic rule-based derivation for Glucose, HbA1c, Complications, Prevention; `CoachingDraft`-pattern extensions for Nutrition, Exercise, Behaviour; Insulin and GLP-1 as explanatory-only signals (no dose output at any phase); wiring into HORIZON's contributing factors and GUARDIAN's safety flags; SHIELD audit confirmed for both feed paths. | **Partially complete (`docs/PHASED_BUILD_PLAN.md` B3, 6 August 2026).** HbA1c, Complications, Prevention, and the Nutrition/Exercise/Behaviour coaching drafts now use real rule-based derivation (not stubs). Insulin/GLP-1 are real explanatory-only signals (hypo/side-effect-driven, still hard `null` dose/prescribing locks). `buildDiabetesRiskContribution` is wired into `lib/clinical-spine/orchestrate.ts` behind `ENABLE_DIABETES_MODULE` (default `false`) plus a diabetes-flagged-patient gate. Glucose Intelligence remains a v0-style honest `insufficient_data` stub — deliberately **not** advanced to v1, since `OQ-DIAB-1` (glucose modality schema) is still open; see updated `OQ-DIAB-1` entry below. Scenario + unit tests exist (`tests/clinical-spine-diabetes.test.ts`). |
| **v2 — Models under governance** | Any statistical/ML model replacing a v1 rule (e.g. a real HbA1c trend predictor, a real hypo-risk classifier) ships only behind the full G-ML-1/2/3 gate sequence (Chapter 5, §5.7); real CGM/device ingestion considered only with a named clinical owner and signed consent/DPIA path; a real Diabetes Twin scoped as its own follow-on spec (Chapter 9). | **Not started; correctly out of scope for this Volume.** |

- **FR-DIAB-007.** A phase shall not be presented as complete in product copy, demos, or investor materials unless its own exit criteria (per `docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md`'s "Phased delivery" section) are met — v0's exit criteria (types compile, one fixture patient has diabetes-shaped data, no runtime behaviour change elsewhere) are met today; v1's are met for every area **except** Glucose (explicitly deferred to v1.1, not silently claimed — see `OQ-DIAB-1`).
- **FR-DIAB-008.** The v0 → v1 transition shall require, at minimum: (a) each signal builder replaced with real rule-based derivation for the areas the spec scopes for v1 (Glucose, HbA1c, Complications, Prevention, Nutrition, Exercise, Behaviour); (b) `buildDiabetesRiskContribution` wired into CONDUCTOR behind a feature flag (Chapter 4, FR-ARC-040 — proposed `ENABLE_DIABETES_MODULE`); (c) at least one scenario test proving a Diabetes-sourced HORIZON contribution and one proving a Diabetes-sourced GUARDIAN flag; (d) confirmed SHIELD audit events for both paths. **Status: (a) met for HbA1c/Complications/Prevention/Nutrition/Exercise/Behaviour, explicitly not met for Glucose pending `OQ-DIAB-1`; (b), (c), (d) all met** — `docs/PHASED_BUILD_PLAN.md` B3, `ENABLE_DIABETES_MODULE` flag (default `false`), `tests/clinical-spine-diabetes.test.ts`.
- **FR-DIAB-009.** Insulin (#3) and GLP-1 (#4) shall remain explanatory-only signals with no dose/prescribing output at v1 — this is not a temporary v1 limitation to be lifted at v2; it is a permanent non-goal restated in §8.5.
- **FR-DIAB-010.** The v1 → v2 transition for any given signal shall be evaluated and gated independently per signal — the module shall not require all 9 areas to reach v2 simultaneously; e.g. HbA1c trend modelling could reach v2 governance while Insulin remains a v1 rule-based explanatory signal indefinitely (since it has no v2 "smarter model" need beyond what governance already restricts).

### 8.4 Composite Diabetes Intelligence coordination

This section specifies the product requirements for `buildDiabetesRiskContribution` (`lib/disease-modules/diabetes/index.ts`) — the single coordination point the spec requires instead of nine separate agent calls (restates Chapter 4 FR-ARC-023).

**Purpose.** Aggregate all 9 areas' signals into exactly one contribution shape that HORIZON and GUARDIAN can consume, so the platform gains "one unified disease understanding" for a diabetic patient without gaining nine new panels in the GP review queue.

**Responsibilities (shall):**

- **FR-DIAB-011.** The coordinator shall derive all 9 areas' signals from one shared `DiabetesPatientContext` (patientId, patientLabel) plus area-specific supplementary inputs (readings, regimen, side effects) — restating Chapter 7's shared-context pattern (FR-AGT-006) at the Diabetes-module level.
- **FR-DIAB-012.** The coordinator shall partition the 9 signals into exactly three destination categories, matching the spec's composite-integration design precisely: (a) **HORIZON-contributing-factor signals** — Glucose, HbA1c, Complications, Prevention; (b) **GUARDIAN-safety-flag signals** — Insulin, GLP-1; (c) **coaching-surface drafts** — Nutrition, Exercise, Behaviour. No signal shall be routed to a destination outside this partition without a specification change reviewed like any other clinical-safety-relevant change (Chapter 5, §5.9).
- **FR-DIAB-013.** The coordinator shall return a single composite result — not nine separate return values — with the exact honesty fields `hitlRequired: true`, `ehrWrite: false`, `autoRetrain: false` present on the composite result itself, in addition to each individual signal carrying its own honesty fields. This matches `DiabetesRiskContribution`'s existing shape in code today.
- **FR-DIAB-014.** The coordinator shall be a pure, synchronous, deterministic function with no AI Gateway call of its own — restating Chapter 4 FR-ARC-024's "a disease module does not perform its own AI Gateway calls" as a coordinator-level requirement. Any AI Gateway narrative generation the composite feeds into remains HORIZON's or GUARDIAN's own (existing) call, not a new one.
- **FR-DIAB-015.** Once wired (v1, per FR-DIAB-008), the coordinator shall be invoked by CONDUCTOR as an additional data-gathering step feeding HORIZON/GUARDIAN inputs, in the same position existing Knowledge Graph signals occupy today — before the deterministic safety-route step, not as a parallel pipeline. Restates the spec's "Integration with CONDUCTOR and SHIELD" section and Chapter 4's FR-ARC-030 (one flow for every capability, no shortcuts).
- **FR-DIAB-016.** Every diabetes-module output that reaches a clinician (a HORIZON contribution, a GUARDIAN flag, a referral trigger) shall be SHIELD-audited exactly like existing agent outputs — no new audit table, no new event schema (restates the spec verbatim and Chapter 4 FR-ARC-028). Coaching-only outputs (Nutrition/Exercise/Behaviour) that never leave the patient-companion surface shall still be audited on generation, following the existing posture for `NUTRITION`/`SLEEP` coaching drafts — they are not exempt from SHIELD simply because they don't reach the clinician queue.
- **FR-DIAB-017.** The coordinator's behavior on a per-area derivation failure (e.g. an area throws or returns malformed data) **is now decided (`docs/PHASED_BUILD_PLAN.md` B3, resolving `OQ-DIAB-7`): fail-open, per-area.** A throwing/malformed area is degraded gracefully (safe fallback value), the failed area is recorded in a new `areaFailures: DiabetesModuleId[]` field on the composite result (also surfaced in the SHIELD audit payload for full visibility), and every other area's derivation continues unaffected — the composite never fails outright on a single area's error. See `lib/disease-modules/diabetes/index.ts`'s `safeBuildArea` helper.

> **AC-DIAB-012-1.** Given the coordinator is called for a patient context, when it returns a result, then `horizonContributingFactors` shall contain only strings sourced from Glucose/HbA1c signal limitations (per the current v0 implementation) and `guardianSafetyFlags` shall contain only strings sourced from Insulin/GLP-1 signals — no coaching-draft content shall appear in either array.
>
> **AC-DIAB-013-1.** Given the coordinator returns a `DiabetesRiskContribution`, when any caller inspects it, then `hitlRequired` shall be the literal `true`, `ehrWrite` shall be the literal `false`, and `autoRetrain` shall be the literal `false` — not merely conventionally-true values that a future edit could silently flip.

### 8.5 Feed contracts to HORIZON and GUARDIAN

Restating Chapter 7 §7.4/FR-AGT-021/038 with the Diabetes-specific contract detail the spec provides:

- **FR-DIAB-018.** `horizonContributingFactors` (a `string[]`) shall merge into `OracleDraft.contributingFactors` (`lib/agents/llm-oracle.ts`) additively — appended, not replacing HORIZON's existing CVD/T2D contributing factors. HORIZON's own composite risk score computation (Chapter 7, FR-AGT-020) is not altered by this merge; Diabetes contributes factors, not a second score.
- **FR-DIAB-019.** `guardianSafetyFlags` (a `string[]`) shall merge into GUARDIAN's existing `interactions`/`safetyNotes` surface (`lib/agents/llm-guardian.ts`) additively, following the same non-replacing pattern as FR-DIAB-018.
- **FR-DIAB-020.** Nutrition, Exercise, and Behaviour coaching drafts shall surface on the patient-companion coaching surface (Chapter 4, FR-ARC-018's coaching-draft pattern) and shall **not** appear in the GP review queue by default — they reach the clinician queue only if a `clinicalEscalationHints` trigger fires (per each module's own escalation-hint list, §8.6.5–8.6.7).
- **FR-DIAB-021.** A referral-triggering Complications flag shall route through the existing PATHWAY agent and `referral_pathway` `HumanGateId` (Chapter 5's human-gate catalogue; Chapter 7's PATHWAY entry) — no new gate type or referral surface is introduced for Diabetes.
- **FR-DIAB-022.** The feed contract shall remain additive and non-destructive in both directions: disabling the Diabetes module (feature flag off, per FR-DIAB-008) shall leave HORIZON and GUARDIAN functioning exactly as they do today, with zero Diabetes-sourced content — the module's absence shall never be a silent failure mode for the existing agents.

> **AC-DIAB-018-1.** Given `ENABLE_DIABETES_MODULE` is off (or unset, matching today's actual state), when HORIZON produces a risk narrative for any patient, then its `contributingFactors` shall be identical to what it would produce with no Diabetes module present in the codebase at all.

### 8.6 The nine intelligence areas

Each area follows the same honesty contract (`hitlRequired: true`, `ehrWrite: false`, `autoRetrain: false`, plus an area-specific flag such as `isDiagnosticPrediction: false` or `isDoseRecommendation: false`) verified against `DIABETES_SIGNAL_HONESTY` in code.

#### 8.6.1 Glucose Intelligence

**Purpose.** Characterize a patient's glucose control pattern (time-in-range, variability, recognizable patterns) as a HORIZON contributing-factor category.

**Responsibilities (shall):**
- **FR-DIAB-023.** Glucose Intelligence shall compute `tirPercent`, `variabilityScore`, and `patternFlags[]` (`dawn_phenomenon_suspected`, `post_prandial_spike_suspected`, `nocturnal_hypo_suspected`, `insufficient_data`) once real derivation is implemented at v1 — today (v0) it shall return `null`/`insufficient_data` rather than fabricate a value, exactly matching `buildGlucoseSignal`'s current behavior.
- **FR-DIAB-024.** Glucose Intelligence shall never itself raise a GUARDIAN safety flag — hypoglycaemia flagging is Insulin/GLP-1's responsibility, which may combine glucose patterns with regimen data (restates the spec's explicit division of responsibility and the module's own code comment).

**Inputs:** `DiabetesGlucoseReading[]` (`recordedAt`, `glucoseMgDl`, optional `context`: fasting/post_prandial/bedtime/unspecified).

**Outputs:** `GlucoseSignal { tirPercent, variabilityScore, patternFlags[], dataCompleteness, limitations[] }`, feeding HORIZON.

**Trigger events:** a CONDUCTOR orchestration run for a patient with an active Diabetes flag (once wired); a direct coordinator call in a scenario test today.

**HITL notes:** none on its own (observational signal) — becomes gate-relevant only indirectly, via any GUARDIAN alert it contributes to through Insulin/GLP-1.

**Business rules / edge cases:**
- Zero readings supplied → `dataCompleteness: "none"`, `patternFlags: ["insufficient_data"]` — never an inferred pattern from no data.
- Readings supplied but v0 stub active → `dataCompleteness: "partial"`, still `patternFlags: ["insufficient_data"]` until v1 derivation ships — the module shall not claim `"sufficient"` completeness while returning null scores.

> **AC-DIAB-023-1.** Given zero glucose readings are supplied, when `buildGlucoseSignal` is called, then `tirPercent` and `variabilityScore` shall both be `null` and `dataCompleteness` shall be `"none"`.
>
> **AC-DIAB-023-2.** Given three glucose readings are supplied (v0 stub), when `buildGlucoseSignal` is called, then `dataCompleteness` shall be `"partial"` and `patternFlags` shall still equal `["insufficient_data"]` — the stub shall not report a fabricated pattern flag merely because some readings exist.
>
> **AC-DIAB-024-1.** Given Glucose Intelligence detects (once v1 is implemented) a nocturnal-hypo-suspected pattern, when its signal is derived, then it shall append that pattern to `patternFlags` and to `limitations`/HORIZON's contributing factors — it shall not, on its own, set a GUARDIAN `overallStatus`.

#### 8.6.2 HbA1c Intelligence

**Purpose.** Track a patient's HbA1c trend over recorded lab values as a T2D contributing factor and Prevention Intelligence input — explicitly non-diagnostic.

**Responsibilities (shall):**
- **FR-DIAB-025.** HbA1c Intelligence shall report the latest supplied value and, once v1 trend logic ships, a `trend` classification (`insufficient_data`/`improving`/`stable`/`worsening`) and a `predictedNext3MonthsPercent` estimate — the estimate shall be a rules/regression trend estimate only, never labeled a diagnosis.
- **FR-DIAB-026.** `isDiagnosticPrediction` shall remain a hard literal `false` on every HbA1c signal — this is not a configurable field, matching the type in code (`isDiagnosticPrediction: false`).
- **FR-DIAB-027.** HbA1c Intelligence shall not fabricate a reading — with zero supplied readings, `latestValuePercent` shall be `null` and `explanation` shall state that no readings were supplied, exactly matching `buildHbA1cSignal`'s current stub behavior.

**Inputs:** `DiabetesHbA1cReading[]` (`recordedAt`, `valuePercent`) — fits the existing `labSampleSchema` (Chapter 6, §6.4) without a schema change.

**Outputs:** `HbA1cSignal { latestValuePercent, trend, predictedNext3MonthsPercent, isDiagnosticPrediction: false, explanation[], limitations[] }`, feeding HORIZON and Prevention Intelligence.

**Trigger events:** new lab result recorded (once a live/pilot lab feed exists — Chapter 6, FR-CORE-023, Phase 2+); coordinator call today.

**HITL notes:** clinician review is required before any HbA1c-driven care-plan change; this reuses the existing case-level review, not a new gate type by default (Open Question, §8.9 OQ-DIAB-2/spec #2 boundary — see note below on gate reuse).

**Business rules / edge cases:**
- A single reading → `trend` cannot exceed `"insufficient_data"` (a trend requires at least two points) even once v1 ships; this chapter records the minimum-points rule explicitly so v1 implementation doesn't silently under- or over-claim a trend from one data point.
- UI wording for `predictedNext3MonthsPercent` must not read as a diagnostic prediction — restates spec Open Question #3 (§8.9, OQ-DIAB-3).

> **AC-DIAB-025-1.** Given one HbA1c reading of 7.8% is supplied, when `buildHbA1cSignal` is called, then `latestValuePercent` shall be `7.8` and `trend` shall be `"insufficient_data"` (not a trend derived from a single point).
>
> **AC-DIAB-026-1.** Given any HbA1c signal is produced at any phase (v0, v1, or v2), when a consumer inspects it, then `isDiagnosticPrediction` shall be `false` — a v2 ML-based trend model (governed per G-ML-1/2/3) shall not be permitted to flip this field to `true` without a full Volume-level product-requirement change, not just a model swap.

#### 8.6.3 Insulin Intelligence — hard dose-recommendation lock

**Purpose.** Surface insulin-regimen observations and a hypoglycaemia-risk flag to GUARDIAN — explanatory only, never a dosing instruction.

**Responsibilities (shall):**
- **FR-DIAB-028.** Insulin Intelligence shall derive `regimenSummary`, `sensitivityEstimate`, `timingObservations[]`, and `hypoRiskFlag` from a supplied regimen and glucose signal — at v0 (today), `sensitivityEstimate` is hard-locked to the literal `"insufficient_data"` and `timingObservations` is empty; v1 may populate `timingObservations` from regimen + Glucose Intelligence, but `sensitivityEstimate` remains explanatory framing, never a numeric dose-sensitivity value presented as actionable.
- **FR-DIAB-029 (hard rule).** `doseChangeRecommendation` shall remain a hard `null` literal **type** — not an optional field a future version can silently populate — for the entire lifetime of this module unless a dedicated, separately-reviewed specification change with clinical sign-off explicitly authorizes an executable dose-change output (which this Volume does not anticipate or request). This is the single most safety-sensitive requirement in this chapter; restates Chapter 1 NO-3 and the spec's own framing verbatim.
- **FR-DIAB-030.** `hypoRiskFlag` shall be set `true` whenever `reportedHypoEventCount > 0` in the supplied regimen context — any reported hypo event shall always route to clinician review via GUARDIAN, with zero threshold-based suppression (e.g. a single reported hypo event shall not be treated as "not enough to flag").
- **FR-DIAB-031.** Any insulin-related output that could influence a dose shall route through GUARDIAN's existing HITL-gated alert path — restates the spec's "mandatory, hard" HITL gate framing; no insulin-related content shall be surfaced directly to a patient without first passing through clinician review.

**Inputs:** `InsulinRegimenSummary { medications[], reportedHypoEventCount }`; Glucose Intelligence signal (§8.6.1) once v1 cross-references it.

**Outputs:** `InsulinSignal { regimenSummary, sensitivityEstimate: "insufficient_data", timingObservations[], hypoRiskFlag, doseChangeRecommendation: null, isDoseRecommendation: false, limitations[] }`, feeding GUARDIAN.

**Trigger events:** coordinator call for a patient with a recorded insulin regimen.

**HITL notes:** mandatory, hard — restated above as FR-DIAB-031; this is the strictest HITL requirement of the nine areas.

**Business rules / edge cases:**
- Empty `medications[]` → `regimenSummary: "No insulin regimen recorded"` — the module shall not infer a regimen from absence of data.
- `doseChangeRecommendation` shall never be populated even in a v2 governed-model scenario for "sensitivity estimation" — a v2 model may improve `sensitivityEstimate`'s explanatory quality, but it may not begin producing a dose value; that would be a scope change requiring a new Volume-level requirement, not a model upgrade.

> **AC-DIAB-029-1.** Given any caller of any type attempts to read a dose-change value from an `InsulinSignal` at any phase, when they inspect `doseChangeRecommendation`, then the value shall be `null` and its type shall admit no other value — this is enforced as a type-level guarantee, not a runtime check that could be bypassed.
>
> **AC-DIAB-030-1.** Given a patient's supplied regimen context includes exactly one reported hypo event, when `buildInsulinSignal` is called, then `hypoRiskFlag` shall be `true` and `limitations` shall include a clinician-review routing note referencing that specific hypo-event count.

#### 8.6.4 GLP-1 Intelligence — hard prescribing-recommendation lock

**Purpose.** Surface GLP-1 suitability talking points and side-effect flags to GUARDIAN and (where specialist review is indicated) PATHWAY — never a prescribing recommendation.

**Responsibilities (shall):**
- **FR-DIAB-032.** GLP-1 Intelligence shall derive `suitabilitySignal` and `responseTrend` from medication list and weight/BMI trend (once v1 ships); at v0 (today) both are hard-locked to `"insufficient_data"`.
- **FR-DIAB-033 (hard rule).** `prescribingRecommendation` shall remain a hard `null` literal type, mirroring FR-DIAB-029 exactly — this module shall never initiate or change a prescription, at any phase, without a dedicated Volume-level specification change with clinical sign-off.
- **FR-DIAB-034.** Reported side effects shall be surfaced as `sideEffectFlags[]` feeding GUARDIAN without alteration or suppression — the module shall not filter out a self-reported side effect on the grounds that it seems minor; severity triage is GUARDIAN's/the clinician's job, not this module's.
- **FR-DIAB-035.** A specialist-review trigger arising from GLP-1 signals shall route through the existing PATHWAY agent and `referral_pathway` human gate (Chapter 7, §7.2.8/§7.2.13) — no new gate type is introduced for GLP-1.

**Inputs:** current medication list; weight/BMI trend (if available); self-reported side effects (via the patient-companion surface).

**Outputs:** `Glp1Signal { suitabilitySignal: "insufficient_data", responseTrend: "insufficient_data", sideEffectFlags[], prescribingRecommendation: null, isPrescribingRecommendation: false, limitations[] }`, feeding GUARDIAN (and PATHWAY when a referral trigger fires).

**Trigger events:** coordinator call for a patient on a GLP-1 medication; a new self-reported side effect submitted via patient-companion.

**HITL notes:** clinician review is required before any GLP-1 initiation/change discussion is documented as a plan — restates the spec verbatim.

**Business rules / edge cases:**
- Zero reported side effects → `sideEffectFlags: []` and a limitations note stating none were reported — absence of a report is not evidence of absence of a side effect, and the module shall not imply otherwise.

> **AC-DIAB-033-1.** Given any caller attempts to read a prescribing value from a `Glp1Signal` at any phase, when they inspect `prescribingRecommendation`, then the value shall be `null`, mirroring AC-DIAB-029-1's guarantee for Insulin.
>
> **AC-DIAB-034-1.** Given a patient self-reports mild nausea in week 1 (per the demo fixture), when `buildGlp1Signal` is called with that report, then `sideEffectFlags` shall include that report verbatim and `limitations` shall note the count of reported side effects — the module shall not downgrade or omit a "mild" self-report.

#### 8.6.5 Nutrition Scientist (coaching-draft pattern)

**Purpose.** Provide general glycaemic-load and meal-timing wellness talking points for patient education — not a clinical diet prescription.

**Responsibilities (shall):**
- **FR-DIAB-036.** Nutrition coaching shall reuse the existing `CoachingDraft` honesty contract (Chapter 4, FR-ARC-018) with a diabetes-suffixed `agentId: "NUTRITION_DIABETES"` (pending resolution of OQ-DIAB-1/spec Open Question #5 on whether this should instead extend the general `CoachingAgentId` union).
- **FR-DIAB-037.** Every Nutrition coaching draft shall carry `isClinicalAdvice: false` and explicit disclaimers stating it does not replace dietitian or diabetes specialist nurse assessment.
- **FR-DIAB-038.** Nutrition coaching shall escalate to clinician review (via `clinicalEscalationHints`) on unintentional weight loss, disordered-eating signs, a hypo pattern tied to meals, or renal/cardiac dietary restriction needs — these are hard-coded escalation triggers in the current v0 draft and shall not be silently removed in a future revision without clinical sign-off.

**Inputs:** `lifestyleSampleSchema.dietNotes`; meal-pattern self-report.

**Outputs:** `DiabetesCoachingDraft` (title, summary, suggestions, disclaimers, clinicalEscalationHints, `confidence: 0.4` at v0).

**Trigger events:** coordinator call; a patient-companion coaching-surface refresh.

**HITL notes:** standard coaching pattern — draft surfaces directly to the patient-companion dashboard; escalates to clinician only if a hint fires.

> **AC-DIAB-038-1.** Given a patient's self-report includes an unintentional-weight-loss signal, when Nutrition coaching evaluates escalation hints (once v1 personalisation is implemented), then the draft shall include that escalation hint and shall not present dietary suggestions as if the weight-loss signal did not exist.

#### 8.6.6 Exercise Physiologist (coaching-draft pattern)

**Purpose.** Provide general resistance/cardio activity wellness talking points with diabetes-specific hypo-awareness framing.

**Responsibilities (shall):**
- **FR-DIAB-039.** Exercise coaching shall reuse the `CoachingDraft` pattern with `agentId: "EXERCISE_DIABETES"` and shall never invent a live wearable step goal or CGM reading as a clinical target — restating the module's own explicit rule against fabricating device data.
- **FR-DIAB-040.** Exercise coaching shall escalate to clinician review on reported hypo symptoms during/after activity, or chest pain/syncope/new breathlessness on exertion — hard-coded escalation triggers matching FR-DIAB-038's pattern for Nutrition.

**Inputs:** `wearableSampleSchema.steps`; `lifestyleSampleSchema.activityMinutesPerWeek`.

**Outputs:** `DiabetesCoachingDraft` with `agentId: "EXERCISE_DIABETES"`, `confidence: 0.4` at v0.

**Trigger events:** coordinator call; patient-companion coaching-surface refresh.

**HITL notes:** standard coaching pattern, same as Nutrition.

> **AC-DIAB-040-1.** Given a patient reports hypo symptoms during exercise, when Exercise coaching evaluates escalation hints, then the draft shall include the hypo-symptom escalation hint and shall route to clinician review — it shall not proceed to suggest an activity increase in the same draft without that escalation being visible.

#### 8.6.7 Behaviour Scientist (coaching-draft pattern)

**Purpose.** Provide general habit, adherence, and motivation wellness talking points — explicitly not a psychological assessment.

**Responsibilities (shall):**
- **FR-DIAB-041.** Behaviour coaching shall reuse the `CoachingDraft` pattern with `agentId: "BEHAVIOUR_DIABETES"` and shall never claim a diagnosis of diabetes distress or any mental-health condition — restating the module's own explicit rule.
- **FR-DIAB-042.** Behaviour coaching shall escalate any disclosed diabetes distress, burnout, or self-management disengagement to clinician review, and shall escalate any suicidal ideation, self-harm, or acute-crisis disclosure to an immediate clinician/emergency path — the exact screening trigger for the former is pending clinical-lead sign-off (Open Question, §8.9 OQ-DIAB-6/spec #6); the latter (acute crisis) is not conditional on that open question and applies unconditionally today.

**Inputs:** adherence signals (medication refill patterns, if available); self-reported stress/motivation via patient-companion check-in.

**Outputs:** `DiabetesCoachingDraft` with `agentId: "BEHAVIOUR_DIABETES"`, `confidence: 0.35` at v0 (the lowest of the three coaching areas, reflecting the least-validated self-report signal set).

**Trigger events:** coordinator call; patient-companion check-in submission.

**HITL notes:** standard coaching pattern, with the acute-crisis exception routing immediately rather than waiting for a standard review cycle — this chapter treats that distinction as safety-critical and non-negotiable regardless of how OQ-DIAB-6 resolves.

> **AC-DIAB-042-1.** Given a patient's self-report includes a suicidal-ideation or self-harm disclosure, when Behaviour coaching processes that check-in, then it shall route to an immediate clinician/emergency escalation path regardless of any other pending configuration or open question — this specific escalation shall never be gated behind OQ-DIAB-6's eventual resolution.

#### 8.6.8 Complication Intelligence

**Purpose.** Flag emerging diabetes complications (retinopathy, neuropathy, CKD, cardiovascular, fatty liver) as HORIZON contributing factors and, where warranted, a PATHWAY referral trigger.

**Responsibilities (shall):**
- **FR-DIAB-043.** Complication Intelligence shall produce one `ComplicationSignal` per domain (`DIABETES_COMPLICATION_DOMAINS`: retinopathy, neuropathy, ckd, cardiovascular, fatty_liver), each with a `flagLevel` (`none`/`watch`/`referral_indicated`) and `evidenceRefs[]` — at v0, `flagLevel` is limited to `none`/`watch` based purely on whether any evidence reference was supplied; `referral_indicated` and per-domain scoring thresholds are deferred to v1 pending clinical-lead sign-off (Open Question, §8.9 OQ-DIAB-4/spec #4).
- **FR-DIAB-044.** Every Complications signal shall carry `referralGate: "referral_pathway"` as a literal, restating that referral-triggering flags route through the existing human gate and PATHWAY agent — no new gate type is introduced (restates Chapter 5's gate catalogue and Chapter 7's PATHWAY entry).

**Inputs:** lab panels (eGFR/CKD via `labSampleSchema`); imaging metadata (retinopathy screening result metadata, not image analysis); coded clinical conditions (fatty liver, neuropathy flags).

**Outputs:** `ComplicationSignal { domain, flagLevel, evidenceRefs[], referralGate: "referral_pathway", limitations[] }` per domain, feeding HORIZON (and PATHWAY when `referral_indicated`, once that level is implemented).

**Trigger events:** coordinator call; new lab/imaging-metadata result recorded for a diabetic patient.

**HITL notes:** any referral-triggering flag routes through `referral_pathway` (Chapter 5's human-gate catalogue) — the referral itself still requires clinician confirmation before PATHWAY drafts anything (Chapter 7, FR-AGT-024).

**Business rules / edge cases:**
- No evidence references supplied for a domain → `flagLevel: "none"` — the module shall not infer a complication risk from absence of evidence.
- Which domains should auto-trigger a referral draft (still HITL-gated) vs. require clinician-initiated referral only is explicitly undecided (§8.9, OQ-DIAB-4) — this chapter does not pre-empt that clinical decision for any domain.

> **AC-DIAB-043-1.** Given no evidence references are supplied for the `retinopathy` domain, when `buildComplicationSignal` is called, then `flagLevel` shall be `"none"`.
>
> **AC-DIAB-043-2.** Given one evidence reference is supplied for the `ckd` domain, when `buildComplicationSignal` is called (v0 behavior), then `flagLevel` shall be `"watch"` — not `"referral_indicated"`, since domain-specific referral thresholds are not yet implemented.

#### 8.6.9 Prevention Intelligence

**Purpose.** Provide a rules-based composite risk-trajectory summary drawing on Glucose, HbA1c, and Complications signals plus optional population risk-state context — explicitly the area closest to, but not itself, a Diabetes Twin.

**Responsibilities (shall):**
- **FR-DIAB-045.** Prevention Intelligence shall compute `riskTrajectoryLabel` (`insufficient_data`/`stable`/`worsening`/`improving`) and `personalisedPriorities[]` from its composite inputs once v1 rules-based scoring ships; at v0 (today) it returns `"insufficient_data"` and an empty priorities list, exactly matching `buildPreventionSignal`'s current stub behavior.
- **FR-DIAB-046 (hard rule).** Prevention Intelligence shall remain a **rules-based composite summary, not a simulation**, for the entire v0/v1 lifetime of this module — `physiologicalTwin: false` is enforced as a literal type field (via `DIABETES_SIGNAL_HONESTY`), matching the platform-wide honesty pattern in `lib/precision-health/twin-simulation.ts` (Chapter 4, FR-ARC-011). A real Diabetes Twin is explicitly out of scope for this chapter and is Chapter 9's subject, once commissioned as its own follow-on spec.
- **FR-DIAB-047.** Prevention Intelligence's top-level summary shall feed HORIZON as an explanatory summary alongside the per-area contributing factors (Glucose, HbA1c, Complications) — it is a synthesis layer over those signals, not an independent fourth contributing-factor source with its own unrelated inputs.
- **FR-DIAB-048.** Any plan promotion arising from Prevention Intelligence (e.g. via the existing `buildPersonalisedHealthPlanDraft` pattern) shall require HITL exactly as `lib/precision-health/health-plan.ts` already enforces — `ehrWrite: false`, draft-only until clinician confirms (restates Chapter 4 FR-ARC-018 at this specific integration point).

**Inputs:** Glucose signal (§8.6.1), HbA1c signal (§8.6.2), Complications signals (§8.6.8), optional population risk-state context (`lib/precision-health/risk-state.ts`, `buildPopulationRiskState`).

**Outputs:** `PreventionSignal { riskTrajectoryLabel, personalisedPriorities[], populationContext, limitations[] }`, feeding HORIZON and the patient-companion "my plan" surface.

**Trigger events:** coordinator call, after Glucose/HbA1c/Complications signals are available in the same run.

**HITL notes:** any plan promotion requires HITL (FR-DIAB-048); the signal itself is observational and does not independently gate anything beyond what its constituent signals already gate.

> **AC-DIAB-046-1.** Given Prevention Intelligence is invoked at any phase (v0, v1, or a hypothetical v2 enhancement), when a consumer inspects its output, then `physiologicalTwin` shall be `false` and no field in the output shall claim a simulated glucose trajectory or intervention-response projection — that capability is scoped exclusively to a future, separately-specified Diabetes Twin (Chapter 9).
>
> **AC-DIAB-047-1.** Given Glucose and HbA1c signals both show `"insufficient_data"` (v0 stub state, as today), when `buildPreventionSignal` is called, then `riskTrajectoryLabel` shall be `"insufficient_data"` — Prevention Intelligence shall not report a trajectory more confident than the signals it is composed from.

### 8.7 Non-goals

Restating Chapter 1's platform-wide non-objectives and the spec's own "Non-goals for v1" section as Diabetes-module-specific commitments, several already embedded as hard rules above:

- **NO-DIAB-1.** No physiological digital twin. Prevention Intelligence and any future "Diabetes Twin" stay rules/composite-based through v0 and v1 (FR-DIAB-046); a real twin is a separate, future-commissioned spec (Chapter 9).
- **NO-DIAB-2.** No silent or automatic insulin/GLP-1 dose or prescribing change, ever, at any phase — `doseChangeRecommendation` and `prescribingRecommendation` remain hard `null` types (FR-DIAB-029/033). This is the module's single most important non-goal and is restated, not just cross-referenced, in every relevant section of this chapter deliberately.
- **NO-DIAB-3.** No live EMIS/SystmOne write. All Diabetes-module outputs are drafts subject to the platform-wide `liveEmis: false` guard (Chapter 6, FR-CORE-026); nothing in this chapter requests an exception.
- **NO-DIAB-4.** No clinical advice without a clinician. Every coaching-pattern output (Nutrition, Exercise, Behaviour) carries `isClinicalAdvice: false` and explicit disclaimers (FR-DIAB-037/39/41), exactly as the platform's existing general-wellness coaching drafts do.
- **NO-DIAB-5.** No new certifications implied. This module does not change the Track A/B demo-vs-live split (`docs/BUILT_VS_REMAINING_AUDIT.md`); it ships as synthetic-cohort, review-first, same boundary as the rest of the product (restates Chapter 2's scope boundary).
- **NO-DIAB-6.** No new orchestrator, audit system, or auth. CONDUCTOR, SHIELD, and NextAuth/Neon remain the only instances of each (restates Chapter 4 FR-ARC-021/027/028 verbatim at the Diabetes-module level).
- **NO-DIAB-7.** No new `HumanGateId`. Insulin/GLP-1/Complications referral triggers reuse `medication_decision`/`referral_pathway` (Chapter 5's existing gate catalogue) unless and until a clinical lead explicitly signs off on a new gate type (Open Question, §8.9 OQ-DIAB-2) — this chapter does not introduce one by default.

### 8.8 Data expectations

- **FR-DIAB-049.** For the duration of v0/v1, all Diabetes-module data shall be synthetic, extending the existing cohort-fixture pattern (`data/seed/demo-cohort-patients.json`, `lib/mock-data/patients.ts`) with diabetes-relevant fields (HbA1c history, medication regimen detail, self-reported glucose patterns) — restating Chapter 2's NS-4/NS-5 synthetic-data boundary and Chapter 6's provenance requirement (FR-CORE-014) at the Diabetes-module level.
- **FR-DIAB-050.** The module's own self-contained demo fixture (`fixtures.ts`: `DIABETES_DEMO_PATIENT`, `DIABETES_DEMO_GLUCOSE_READINGS`, `DIABETES_DEMO_HBA1C_READINGS`, `DIABETES_DEMO_INSULIN_REGIMEN`, `DIABETES_DEMO_GLP1_SIDE_EFFECTS`) shall remain distinct from the shared cohort fixtures used across dashboards and the clinical-proof test suite until a deliberate v1 step merges diabetes fields into the shared fixtures alongside module wiring — this chapter records this as the current, correct state, not a gap to close incidentally.
- **FR-DIAB-051.** CGM/glucose structured data ingestion shall require a modality-schema decision before v1 signal derivation can consume it: either (a) extend `wearableSampleSchema` with optional CGM fields (`glucoseMgDl`, `timeInRangePercent`), or (b) add a new `glucose` modality to `MODALITY_IDS` (Chapter 6, §6.3) — this chapter does not decide between (a) and (b); it is Open Question OQ-DIAB-1 (spec #1), owned by the clinical lead.
- **FR-DIAB-052.** Any future real CGM device API (Dexcom/Abbott/Libre), FHIR-based lab feed for HbA1c, or pharmacy-adherence data source shall be built as a new `ingestion-stub`-pattern adapter (Chapter 6, FR-CORE-022) behind a consent grant and an explicit `liveStream` flag flip — never silently enabled, restating Chapter 6's interoperability-adapter pattern for Diabetes-specific data sources by name.
- **FR-DIAB-053.** Every diabetes data sample, once ingested via any real (non-fixture) path, shall carry the same `provenance` contract (`source`, `liveStream: false` until genuinely live, `realPatientData: false` until genuinely consented pilot data) as every other modality on the platform (Chapter 6, FR-CORE-014) — Diabetes gets no data-honesty exception.

### 8.9 UI expectations (product level)

Full UI/screen specification is deferred to Chapter 18 (UI/Screen Definitions); this section states the product-level expectations Chapter 18 must satisfy for Diabetes specifically.

- **FR-DIAB-054.** A clinician reviewing a diabetic patient's HORIZON risk narrative shall be able to see which contributing factors originated from the Diabetes module (once wired) distinctly from pre-existing CVD/T2D factors — restating Chapter 7's explainability requirement (FR-AGT-041/042) with a Diabetes-specific attribution expectation, so a clinician is never left guessing whether a factor came from the general risk model or a disease module.
- **FR-DIAB-055.** A clinician reviewing a GUARDIAN alert sourced (in part) from Insulin or GLP-1 signals shall see the hypo-risk/side-effect evidence that produced it, and shall never see a bare alert with no supporting detail — restating Chapter 7's FR-AGT-040 for the Diabetes-specific case.
- **FR-DIAB-056.** A patient viewing their coaching surface shall see Nutrition/Exercise/Behaviour drafts labeled clearly as wellness coaching, not clinical advice, with the same `"NOT CLINICAL ADVICE"` disclaimer prominence as the platform's existing general-wellness coaching drafts (Chapter 4, FR-ARC-018) — Diabetes-specific coaching gets no different visual treatment implying more clinical authority than general coaching.
- **FR-DIAB-057.** Any UI surface displaying an HbA1c trend or "predicted next 3 months" estimate shall use wording confirmed by clinical lead sign-off (Open Question OQ-DIAB-3) before it ships — this chapter does not propose specific wording, since the spec explicitly flags this as needing clinical-lead confirmation, not an engineering or product-writing decision alone.
- **FR-DIAB-058.** No UI surface shall display a numeric dose value, a dose-change suggestion, or a prescribing recommendation sourced from Insulin or GLP-1 Intelligence, at any phase — this restates NO-DIAB-2 as a UI-layer requirement so the type-level lock (FR-DIAB-029/033) is not accidentally worked around by a UI component inventing display text where none should exist.

### 8.10 Edge cases

- **EC-DIAB-1 (Diabetes module disabled mid-session).** Given a clinician is reviewing a case with `ENABLE_DIABETES_MODULE` on, and the flag is turned off between page loads (e.g. a config rollback), then subsequent HORIZON/GUARDIAN outputs for that patient shall simply omit Diabetes-sourced content (restates FR-DIAB-022) — the platform shall not error, and shall not display a stale Diabetes-attributed factor from before the flag flip without re-deriving it.
- **EC-DIAB-2 (conflicting Insulin hypo flag and Glucose nocturnal-hypo pattern).** Given Insulin Intelligence sets `hypoRiskFlag: true` from a reported event and Glucose Intelligence (once v1 ships) independently flags `nocturnal_hypo_suspected`, then both signals shall be surfaced to GUARDIAN without the coordinator suppressing either as "redundant" — a clinician benefits from seeing both the self-reported event and the pattern-derived signal, even if they likely describe the same underlying issue.
- **EC-DIAB-3 (patient reports a GLP-1 side effect with no on-file GLP-1 medication).** Given a self-reported side effect arrives for a patient with no GLP-1 medication in their current list, then GLP-1 Intelligence shall still surface the report (data-integrity discrepancies are a clinician's/GUARDIAN's concern, not something this module silently discards) but shall note the mismatch in `limitations`.
- **EC-DIAB-4 (Complications evidence exists for a domain not in `DIABETES_COMPLICATION_DOMAINS`).** Given a lab/imaging result suggests a complication domain outside the five currently modeled (retinopathy, neuropathy, ckd, cardiovascular, fatty_liver — e.g. a diabetic-foot/peripheral-vascular finding), then the module shall not force-fit that evidence into an existing domain — extending `DIABETES_COMPLICATION_DOMAINS` is a reviewed spec change (like NO-DIAB-7's gate-type restriction), not a silent data-shoehorning decision.
- **EC-DIAB-5 (Behaviour Scientist acute-crisis disclosure arrives outside clinic hours).** Given a suicidal-ideation disclosure (§8.6.7, AC-DIAB-042-1) arrives via patient-companion self-report outside of practice hours, then the immediate-escalation requirement still applies — this chapter does not carve out an hours-based exception, and the exact out-of-hours escalation *mechanism* (on-call routing, crisis-line signposting) is Chapter 15's (Workflows) responsibility to specify, not silently left undefined here.

### 8.11 Open questions (from the Diabetes spec, restated with ownership)

Each restates a spec "Open questions" item precisely, framed against this chapter's requirement IDs, so it is tracked as a decision this Volume is waiting on rather than re-litigated or silently resolved.

- **OQ-DIAB-1.** Confirm whether CGM/glucose fields extend `wearableSampleSchema` or become a new `glucose` modality in `lib/precision-health/modalities.ts` (affects FR-DIAB-051's v1 data model). **Owner:** Clinical Lead + Engineering. **Status: still OPEN — the clinical-lead decision has not been made and `lib/precision-health/modalities.ts` remains untouched.** B3 (`docs/PHASED_BUILD_PLAN.md`, 6 August 2026) explicitly did not proceed past this gate for Glucose. Every other v1-scoped area (HbA1c, Complications, Prevention, coaching) does not depend on this decision and proceeded to real derivation. **Provisional engineering stop-gap recorded (`docs/PHASED_BUILD_PLAN_D.md` D2, `PED-DIAB-1`, 11 August 2026): NOT a resolution of this open question.** Separately from the modality-schema question, `glucose.ts` now derives real TIR/%CV/pattern flags — but only for readings whose provenance is a real Patient-State ingest (C6's `POST /api/patients/[id]/diabetes/glucose`, unrelated to `modalities.ts`) with at least 5 readings on file, using a fixed DEFAULT ADA/NICE target band (70–180 mg/dL) rather than any clinician-set individual target, and every derived output carries an explicit provisional/default-band limitation string. Fixture/demo data is untouched and remains the `insufficient_data` stub. This is a reversible, narrowly-scoped engineering decision to make incremental progress while the clinical lead's actual `OQ-DIAB-1` decision (and any future per-patient target-range decision) remains outstanding — it must not be read as resolving OQ-DIAB-1, and a future clinical-lead decision may require revisiting the default band or the ingest-only gating.
- **OQ-DIAB-2.** Confirm whether Insulin/GLP-1 decisions route through the existing `medication_decision` `HumanGateId`, or whether a new gate type (e.g. `insulin_dose_confirmation`) is clinically warranted (affects NO-DIAB-7). Adding a new `HumanGateId` is a `lib/types.ts` change and shall not be done without clinical sign-off. **Owner:** Clinical Safety Lead.
- **OQ-DIAB-3.** Confirm acceptable UI language for HbA1c's trend-based estimate (FR-DIAB-057) so it cannot be read as a diagnostic prediction. **Owner:** Clinical Lead + Product Writing.
- **OQ-DIAB-4.** Confirm which Complication flags (retinopathy vs. CKD vs. cardiovascular vs. others) should trigger a PATHWAY referral draft automatically (still HITL-gated) vs. requiring clinician-initiated referral only (affects FR-DIAB-043's `referral_indicated` threshold work). **Owner:** Clinical Safety Lead.
- **OQ-DIAB-5.** Confirm whether diabetes-specific coaching (`NUTRITION_DIABETES`/`EXERCISE_DIABETES`/`BEHAVIOUR_DIABETES`) should extend the existing `CoachingAgentId` union in place, or remain distinct indefinitely (affects FR-DIAB-036/39/41; restates Chapter 4's OQ-ARC-3 verbatim — this is the same open question, not a second one). **Owner:** Product + Engineering.
- **OQ-DIAB-6.** Confirm the specific self-report signal(s) (e.g. a diabetes distress screening tool) that should trigger Behaviour Scientist's non-acute escalation path (FR-DIAB-042) — this touches mental-health safety-netting and shall not be decided by engineering alone. **Owner:** Clinical Safety Lead + Mental Health Clinical Advisor.
- **OQ-DIAB-7 (new in this chapter, not in the original spec list).** Confirm the coordinator's required behavior on a per-area derivation failure (§8.4, FR-DIAB-017) — fail the whole composite (consistent with Chapter 7's "fail the proof" pattern for agent orchestration) or degrade gracefully by omitting the failed area and flagging the omission. This mirrors Chapter 4's OQ-ARC-5 at the Diabetes-module level and should likely be resolved the same way for consistency. **Owner:** Clinical Safety Lead + Engineering. **Status (`docs/PHASED_BUILD_PLAN.md` B3, 6 August 2026): DECIDED — fail-open, per-area,** consistent with Chapter 4's OQ-ARC-5 resolution as anticipated. A per-area derivation failure degrades that area gracefully and is recorded in `areaFailures` (visible in the composite result and the SHIELD audit payload); it never fails the whole composite. See FR-DIAB-017 (updated) and `lib/disease-modules/diabetes/index.ts`'s `safeBuildArea` helper.

### 8.12 Cross-references

- Chapter 1 (§1.1 BO-2, §1.4 NO-3/NO-4) — the "disease modules on one platform" commitment and the no-autonomous-prescribing/no-EHR-write commitments this chapter's NO-DIAB-1–7 restate for Diabetes specifically.
- Chapter 2 (§2.2/§2.3 NS-4/NS-5) — the synthetic/pilot-only data boundary restated in §8.8.
- Chapter 4 (§4.3.3 Diabetes module boundary honest current-state note, §4.8 extensibility model, FR-ARC-002/011/018/021/023/024/027/028/038–041) — the architecture-overview statements this chapter takes to full depth for the specific case of Diabetes.
- Chapter 5 (§5.1–§5.2 HITL gates and the human-gate catalogue, §5.4 SHIELD, §5.7 continuous learning/governed model release) — the safety mechanics every Diabetes signal and coaching draft in this chapter routes through without exception.
- Chapter 7 (§7.2.6 HORIZON, §7.2.5 GUARDIAN, §7.2.8 PATHWAY, §7.4 disease-module feed shape, FR-AGT-020/021/038/039) — the exact agent-integration points this chapter's §8.5 feed contracts implement.
- `docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md` — the authoritative clinical/product design this entire chapter is built against; every open question in §8.11 is restated, not reinvented, from this source.
- `docs/GOVERNED_MODEL_RELEASE_SOP.md` — the G-ML-1/2/3 gate sequence any v1→v2 model swap (§8.3) must pass.
- `docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md` — the Layer 3 (Disease Intelligence) and Layer 5 (Disease Digital Twins) status this chapter's phasing (§8.3) and Prevention Intelligence non-goal (NO-DIAB-1) are grounded against.
- Chapter 9 (Digital Twin — Diabetes, `[DRAFTED]`) takes the "real Diabetes Twin" boundary this chapter deliberately does not cross (FR-DIAB-046, NO-DIAB-1) to full requirements depth, once commissioned.

---

## 13. Chapter 9 — Digital Twin: Diabetes `[DRAFTED]`

### 9.0 Purpose of this chapter

This chapter completes Part C. It specifies requirements for the "Diabetes Twin" that Chapter 8 (§8.6.9, NO-DIAB-1) deliberately declined to build, and that Chapter 4 (§4.2, FR-ARC-011/016) named as a disease-specific instantiation of the platform's existing generic twin primitive. Consistent with every other chapter in this Volume, it separates **what exists in code today**, **what is being specified as buildable next on the existing pattern**, and **what is explicitly deferred to a future, separately-governed phase** — and it does not blur those three categories. No code is written or implied to be written by this chapter; no physiological model is invented.

### 9.1 What "Diabetes Twin" means here — three things not to conflate

The word "twin" is used loosely across health-tech; this Volume uses it precisely, and this section exists specifically to stop three related-but-distinct things from being read as one thing.

- **FR-TWIN-001.** The platform shall treat "generic twin-simulation primitive" (`lib/precision-health/twin-simulation.ts`), "Prevention Intelligence composite" (Chapter 8, §8.6.9), and "Diabetes Twin" (this chapter) as three distinct artefacts with distinct purposes, and shall never label the output of one as if it were another in any UI, API response, or SHIELD audit event.
  - The **generic twin-simulation primitive** is disease-agnostic infrastructure that exists in code today. It ranks a small, fixed catalogue of care-pathway interventions (currently heart-failure-flavoured: intensify diuretic, add SGLT2 inhibitor, urgent HF clinic, home BP telemonitoring, social prescribing, continue current plan) using rules over ORACLE risk-state fixtures. It answers "given this patient's overall risk, which of these care-pathway moves ranks highest" — it is not disease-specific and today carries no diabetes content at all.
  - **Prevention Intelligence** (Chapter 8) is a rules-based *composite summary* over the other 8 Diabetes intelligence areas' outputs. It answers "what is this patient's current trajectory and priority, given everything we already know" — a look at the present, not a projection of a hypothetical change. It explicitly does not answer "what if" questions (FR-DIAB-046, AC-DIAB-046-1).
  - The **Diabetes Twin** (this chapter) is the disease-scoped extension of the generic twin-simulation *pattern* — not the Prevention Intelligence composite — that exists specifically to answer patient- and clinician-posed "what if" questions (§9.5) about diabetes-relevant lifestyle and treatment changes, using the same `synthetic_rules` / `physiologicalTwin:false` honesty contract as the generic primitive.
- **FR-TWIN-002.** The platform shall not rename Prevention Intelligence to "Twin," shall not rename the generic twin-simulation primitive to "Diabetes Twin," and shall not present any output as a merger of the two without an explicit, separately reviewed product decision — each artefact keeps its own `artifactType` literal (`"aksh-synthetic-scenario-ranking"` today; a Diabetes-specific literal, e.g. `"aksh-diabetes-scenario-ranking"`, once built) so downstream consumers (UI, SHIELD, audit review) can tell them apart programmatically, not just by prose label.
- **FR-TWIN-003.** Every reference to "Diabetes Twin" in product copy, clinician-facing UI, or patient-facing UI shall be accompanied, on first appearance per session, by plain-language text stating it is a rules-based estimate and not a simulation of the patient's body — restating the same honesty obligation Chapter 8 imposes on Prevention Intelligence (AC-DIAB-046-1) and the generic primitive already imposes on itself (`getTwinSimulationStatus().note`).

### 9.2 Current reality: the generic twin-simulation primitive (today, disease-agnostic)

This section states, precisely, what exists in code today — nothing more.

- **FR-TWIN-004.** This Volume records that, as of this chapter's drafting, `lib/precision-health/twin-simulation.ts` is the *only* twin-related code in the platform, and it is not diabetes-specific: its `INTERVENTION_IDS` (`intensify_diuretic`, `add_sglt2`, `urgent_hf_clinic`, `home_bp_telemonitor`, `social_prescribing`, `continue_current`) are heart-failure-pathway interventions, not diabetes lifestyle or treatment scenarios; its only inputs are `oracleScore`, `oracleRisk`, and two pre-computed fixture fields (`digitalTwinPrediction.deteriorationSignals.length`, `digitalTwinPrediction.admissionRisk14Days`) already sitting on the mock patient record — it reads no glucose, HbA1c, insulin, weight, sleep, medication, stress, exercise, food, or inflammation data of any kind.
- **FR-TWIN-005.** This Volume records that no diabetes-specific scenario, intervention ID, or "what-if" catalogue exists in code today. Every scenario named in §9.5 of this chapter (lose weight, start GLP-1, increase protein, reduce carbs, improve sleep, stop insulin, walk after meals) is a **requirement for future work**, not a description of a capability that already runs. A reader of this chapter shall not conclude that typing a weight-loss target into any existing screen produces a ranked outcome today — it does not.
- **FR-TWIN-006.** The platform shall continue enforcing the existing runtime honesty check in `runClinicalSpineOrchestrate` (Chapter 5, FR-HITL-007: `throw new Error("Twin honesty check failed...")`) against any twin output — generic or, once built, diabetes-scoped — that fails to declare `physiologicalTwin:false` and `simulationMode:"synthetic_rules"`. This chapter does not request, and shall not be read as requesting, any change or exception to that check.
- **FR-TWIN-007.** The existing `getTwinSimulationStatus()` shape (`available`, `physiologicalTwin:false`, `simulationMode`, `note`, `ehrWrite:false`, `hitlRequired:true`, `planPromotionRequiresHitl:true`) shall remain the honesty-status contract every twin surface — generic or diabetes-scoped — exposes to any caller (UI, audit, API consumer) that asks "what kind of twin is this."

### 9.3 Requirements: a Diabetes-scoped scenario simulator (near-term, rules-based, no physiology)

This section specifies the next buildable increment: extending the existing rules pattern with diabetes content, still with zero physiological claims. It is written as a set of requirements for work not yet started, consistent with Chapter 8's treatment of its own v1.

- **FR-TWIN-008.** A Diabetes-scoped scenario simulator shall be built as an extension of the existing generic twin-simulation pattern — reusing the `TwinSimulationResult`/`RankedScenarioOption`-shaped contract family and the `synthetic_rules` mode — rather than as a new, parallel simulation engine. Whether this takes the form of a new `DIABETES_SCENARIO_IDS` catalogue alongside `INTERVENTION_IDS`, or a parameterization of `twin-simulation.ts` itself, is Open Question OQ-TWIN-1.
- **FR-TWIN-009.** The Diabetes-scoped simulator's inputs shall be limited to data the platform already has an honest path to: (a) Diabetes module intelligence-area signals (Chapter 8, §8.6) where and when they are wired into orchestration, (b) ORACLE risk-state fixtures (as the generic primitive already uses), and (c) values a patient or clinician explicitly enters for the specific what-if question being asked (e.g. a target weight-loss figure). It shall never read from a live CGM, wearable, or pharmacy feed — none exists (Chapter 6, §6.4; Chapter 8, FR-DIAB-051/052) — and shall never silently substitute a fabricated baseline where real input is missing (§9.10, EC-TWIN-1).
- **FR-TWIN-010.** The Diabetes-scoped simulator's output shall be limited to the same category of values the generic primitive already produces — a `benefitScore`, a `riskScore`, a `confidence` value, a human-readable `rationale`, and a relative-cost or relative-effort label — and shall never output a projected numeric glucose value, projected HbA1c value, or any other number implying a calculated physiological trajectory. Projecting such a number is exactly the boundary Target Twin (§9.4) exists on the far side of.
- **FR-TWIN-011.** Every rationale string produced by the Diabetes-scoped simulator shall name which Chapter 8 intelligence area(s), if any, it drew on, or shall explicitly state `"diabetes-module signal unavailable — risk-state only"` when the relevant Chapter 8 area is not yet wired into orchestration (restates Chapter 8's own current honest-unwired state, §8.3) — it shall never imply diabetes-specific analysis occurred when only generic ORACLE risk-state was actually used.
- **FR-TWIN-012.** Confidence values produced by the Diabetes-scoped simulator shall remain qualitative, rehearsal-grade estimates, carrying the same `limitations` disclosure the generic primitive already attaches (e.g. *"rehearsal scores — not calibrated NHS outcome estimates"*) — restated verbatim for the diabetes case, not softened or omitted because the scenario feels more concrete to a lay reader (e.g. "lose 6kg" sounds precise; the resulting score is still a rule output, not a calculation of physiology).
- **FR-TWIN-013.** Every Diabetes-scoped simulator invocation shall be bound to one specific `patientId` (real-pilot or demo-fixture) and shall never be exposed as a population-level or hypothetical-average-patient run — restated as NO-TWIN-7 below — so that its output is never mistaken for general clinical guidance detached from an individual's record.

### 9.4 Target Twin: a future, explicitly gated state-variable model

This section specifies requirements for a **later, separately commissioned phase**. Nothing in this section is requested to be built as part of this Volume, and nothing in this section changes the honesty fields (`physiologicalTwin:false`, `autoRetrain:false`) that hold true for every phase described in §9.2 and §9.3.

- **FR-TWIN-014.** A future Target Twin phase MAY model an explicit set of coupled state variables — insulin (regimen/exposure), glucose, weight, sleep, medication adherence, stress, exercise, food/macronutrient intake, and inflammatory markers — as inputs to a projection model. This requirement records the *shape* of that future ambition for planning purposes; it does not authorize starting that work, and it is not satisfied by any rules-based scenario built under §9.3.
- **FR-TWIN-015.** Before any Target Twin state-variable modeling work begins, the platform shall have in place: (a) a named clinical modeling owner accountable for the model's validity (Open Question OQ-TWIN-4), (b) a written validation methodology reviewed and signed off by the Clinical Safety Lead, and (c) confirmation of how the Governed Model Release SOP's gates (`docs/GOVERNED_MODEL_RELEASE_SOP.md`, G-ML-1/2/3) apply to a simulation-type model rather than the classification/prediction models the SOP was written for (Open Question OQ-TWIN-3). Absence of any one of these three shall be sufficient grounds to block the work from starting.
- **FR-TWIN-016.** Even once built, a Target Twin component shall continue to declare `physiologicalTwin:false` until it separately passes a dedicated clinical-validation gate — distinct from and additional to G-ML-1/2/3 — that this chapter does not define. Building a coupled-variable model is a necessary but not sufficient condition for ever setting `physiologicalTwin:true`; the flag change itself shall require its own explicit, documented, clinically-signed-off decision (restated as NO-TWIN-1 below).
- **FR-TWIN-017.** The `physiologicalTwin` flag shall never be flipped from `false` to `true` as a side effect of an unrelated code change, config change, or feature-flag rollout. Any pull request or migration that would change this literal value on any twin-related type shall require Clinical Safety Lead review as a named, visible line in that change — restating Chapter 5's FR-HITL-007 runtime check as a code-review-time obligation, not only a runtime one.
- **FR-TWIN-018.** If and when relationships between state variables are modeled (e.g. "weight loss of this magnitude tends to improve insulin sensitivity by this much"), each such modeled relationship shall cite its clinical literature or guideline basis in an inspectable, clinician-readable rationale — restating Chapter 7's agent-explainability principle (FR-AGT-040) for the twin context — and shall never be presented as a bare coefficient with no clinical citation trail.
- **FR-TWIN-019.** Until a Target Twin phase is separately commissioned and the three preconditions in FR-TWIN-015 are satisfied, no code, configuration, product copy, or sales/marketing material shall state or imply that any of the nine listed state variables are being tracked, simulated, or physiologically modeled by the platform.

### 9.5 Scenario catalog ("what if") — Diabetes-scoped, rules-based, non-physiological

Each scenario below is a **requirement for the near-term Diabetes-scoped simulator (§9.3)**, not a description of existing behavior. Every scenario's output is a rules-based rank/score/rationale, never a projected physiological number. Feasibility class states whether the scenario belongs in the near-term rules simulator or is out of reach until Target Twin (§9.4).

#### 9.5.1 "What happens if I lose 6kg?" — weight scenario

- **FR-TWIN-020.** Given a clinician or (subject to OQ-TWIN-2) patient supplies a target weight-loss figure for a named patient, the Diabetes-scoped simulator shall return a rules-based scenario result estimating relative direction and confidence of impact on the patient's existing Chapter 8 signals (e.g. Prevention Intelligence's `riskTrajectoryLabel`, HbA1c's qualitative `trend`) — never a projected HbA1c or glucose number. **Feasibility:** rules-based, near-term.
  > **AC-TWIN-020-1.** Given a patient with an existing `PreventionSignal.riskTrajectoryLabel`, when a "lose 6kg" scenario is run for that patient, then the result shall reference that existing label directly in its rationale (e.g. "current trajectory: worsening; weight-loss scenarios are directionally favourable per guideline association, not a calculated outcome") and shall carry `confidence` no higher than the platform's existing rehearsal-grade ceiling.

#### 9.5.2 "What happens if I start GLP-1?" — medication-initiation scenario

- **FR-TWIN-021.** Given a clinician requests a "start GLP-1" scenario for a named patient, the Diabetes-scoped simulator shall return a rules-based rationale referencing GLP-1 Intelligence's existing `suitabilitySignal` and `sideEffectFlags` (Chapter 8, §8.6.4) where wired, and shall under no circumstances output anything resembling a prescribing recommendation — this scenario answers "what would we watch for," never "should this patient start GLP-1," restating GLP-1 Intelligence's own hard lock (`prescribingRecommendation: null`, NO-DIAB-3) at the twin layer so the twin cannot become a backdoor around that lock. **Feasibility:** rules-based, near-term, contingent on GLP-1 Intelligence being wired (Chapter 8 v1).
  > **AC-TWIN-021-1.** Given a "start GLP-1" scenario is run, when its output is inspected, then it shall contain no field, string, or numeric value that could be read as recommending initiation, and it shall carry the same `isPrescribingRecommendation: false` honesty field GLP-1 Intelligence itself carries.

#### 9.5.3 "What happens if I increase protein?" / "What happens if I reduce carbs?" — nutrition macro scenarios

- **FR-TWIN-022.** Given a clinician or (subject to OQ-TWIN-2) patient requests an "increase protein" or "reduce carbs" scenario, the simulator shall return a rules-based rationale referencing Nutrition Intelligence's existing coaching signal (Chapter 8, §8.6.5) where wired, framed as a wellness-coaching-adjacent estimate, and shall carry the same `"NOT CLINICAL ADVICE"` disclaimer weight as Nutrition coaching drafts already carry (FR-DIAB-056). **Feasibility:** rules-based, near-term.
  > **AC-TWIN-022-1.** Given both a "reduce carbs" and an "increase protein" scenario are run for the same patient in the same session, when both results are displayed, then each shall be shown as an independent result with its own rationale and confidence — the platform shall not merge them into a single combined "diet change" score, since the two are distinct hypotheticals a clinician may want to compare separately.

#### 9.5.4 "What happens if I improve sleep?" — sleep scenario

- **FR-TWIN-023.** Given a clinician or (subject to OQ-TWIN-2) patient requests an "improve sleep" scenario, the simulator shall return a rules-based rationale referencing Behaviour Scientist's existing signal (Chapter 8, §8.6.7) where wired, and, where no sleep-related self-report data exists for the patient, shall return the lowest-confidence rehearsal band with an explicit `insufficient_data` flag rather than assuming an average sleep pattern. **Feasibility:** rules-based, near-term.

#### 9.5.5 "What happens if I stop insulin?" — safety-critical medication-cessation scenario

- **FR-TWIN-024 (hard-gated).** Given a "stop insulin" (or any other safety-critical medication-cessation) scenario is requested for a named patient, the platform shall (a) never generate or display a result for this scenario without the request having first been routed through the `medication_decision` `HumanGateId` (Chapter 5, §5.2.4) as a pending clinical judgment, and (b) never expose this scenario as a directly patient-initiated, self-service option under any circumstance — restating NO-DIAB-7's gate-reuse rule at the twin layer, with no exception carved out for the twin context. This is the single highest-severity requirement in this chapter and shall not be relaxed by any future UI convenience decision.
  > **AC-TWIN-024-1.** Given a patient-facing session attempts to request a "stop insulin" scenario directly, when the request reaches the API layer, then it shall be rejected before any scenario logic runs, and a SHIELD audit event shall be recorded flagging the blocked attempt for clinician visibility (restated as EC-TWIN-3 below).
  > **AC-TWIN-024-2.** Given a clinician, within an active clinical review, requests a "stop insulin" scenario for a patient with an existing Insulin Intelligence `hypoRiskFlag: true`, when the scenario result is generated, then the result's `riskScore` shall reflect that existing hypo-risk flag directly in its rationale, and the result shall carry a mandatory, non-dismissible high-severity warning banner distinct from the standard disclaimer used for lower-risk scenarios (§9.5.1–§9.5.4, §9.5.7).

#### 9.5.6 "What happens if I walk after meals?" — exercise-timing scenario

- **FR-TWIN-025.** Given a clinician or (subject to OQ-TWIN-2) patient requests a "walk after meals" scenario, the simulator shall return a rules-based rationale referencing Exercise Intelligence's existing signal (Chapter 8, §8.6.6) where wired, framed the same way as §9.5.3/§9.5.4's low-risk lifestyle scenarios. **Feasibility:** rules-based, near-term.

#### 9.5.7 General catalog requirements

- **FR-TWIN-026.** The scenario catalogue shall be implemented as an extensible, data-driven structure (mirroring `INTERVENTION_CATALOGUE`'s object-literal pattern in the existing code) so that adding a future scenario is a reviewed content change, not a new orchestration pattern or a new twin engine.
- **FR-TWIN-027.** Exactly two feasibility classes shall exist for any catalogued scenario at any time: **"rules-based, available"** (meets every constraint in §9.3) and **"requires Target Twin, not available"** (would require a projected physiological number to answer honestly, per §9.4). No scenario shall be marked available under a third, ambiguous classification — restating this chapter's core honesty boundary as a literal field on every catalogue entry, not just as prose.

### 9.6 HITL & safety-gating requirements

- **FR-TWIN-028.** Every Diabetes Twin output — generic-primitive-derived or Diabetes-scoped — remains a decision-support draft only. A clinician shall review and explicitly confirm before any scenario's suggested direction is promoted into a care-plan draft, restating `planPromotionRequiresHitl: true` (already enforced by the generic primitive) as a Diabetes-scoped requirement with no exception.
- **FR-TWIN-029.** No twin scenario output shall ever trigger an automatic medication change, an automatic care-plan write, or an automatic EHR write. `ehrWrite: false` holds for every twin surface at every phase described in this chapter, including any future Target Twin phase (§9.4) — restating Chapter 1's NO-2/NO-3 and Chapter 5's FR-HITL-006 at the twin layer.
- **FR-TWIN-030.** The "stop insulin" scenario (§9.5.5) and any future scenario that materially proposes altering an active safety-critical medication regimen shall always route through the existing `medication_decision` `HumanGateId` (Chapter 5, §5.2.4) — restating NO-DIAB-7's reuse-not-invent rule for gate types — and shall never be reachable by a patient acting alone, restated as FR-TWIN-024/AC-TWIN-024-1.
- **FR-TWIN-031.** Every twin output surfaced on a patient-facing screen shall carry the same `"NOT CLINICAL ADVICE"` disclaimer prominence Chapter 8 already requires for coaching drafts (FR-DIAB-056); every twin output surfaced on a clinician-facing screen shall carry an equivalent "decision-support draft, not a finalized plan" disclaimer — no twin surface, patient- or clinician-facing, is exempt from carrying some form of this disclaimer.
- **FR-TWIN-032.** SHIELD shall log every twin scenario invocation — successful or blocked (EC-TWIN-3) — as an immutable audit event carrying `patientId`, the scenario/intervention identifier(s) requested, the full honesty-field set (`physiologicalTwin`, `ehrWrite`, `hitlRequired`, `autoRetrain`), and `generatedAt`, consistent with the existing per-orchestration-run audit pattern (Chapter 7, FR-AGT-011) and Chapter 5's append-only audit requirement (§5.4).

### 9.7 Non-goals

- **NO-TWIN-1.** No physiological simulation (glucose-insulin dynamics, PK/PD modeling, or any coupled-variable projection) exists or is requested to be built by this chapter or the near-term phase it specifies (§9.3). `physiologicalTwin: false` holds throughout.
- **NO-TWIN-2.** No twin output, at any phase this chapter describes, shall auto-apply an intervention to a care plan, a prescription, or the EHR. `ehrWrite: false` and `planPromotionRequiresHitl: true` hold without exception.
- **NO-TWIN-3.** No patient-initiated "stop insulin" (or equivalent safety-critical medication-cessation) scenario shall ever run without prior clinician engagement via the `medication_decision` gate. This is the one non-goal in this chapter framed as an absolute prohibition rather than a phase boundary, and it does not sunset in any future phase described in §9.4.
- **NO-TWIN-4.** No twin score, at any phase, shall be presented as a statistically validated, NHS-outcome-calibrated probability. Scores remain rules-based/rehearsal-grade until a specific, separately-governed clinical validation exercise says otherwise — which this chapter does not undertake.
- **NO-TWIN-5.** No new `HumanGateId` is introduced by this chapter. Every twin scenario requiring human confirmation reuses the existing `medication_decision` or `referral_pathway` gates (Chapter 5, §5.2), consistent with NO-DIAB-7's reuse rule — unless and until a clinical lead separately signs off on a new gate type (Open Question, §5.10 OQ-HITL-1 / §8.11 OQ-DIAB-2, which this chapter does not re-decide).
- **NO-TWIN-6.** No live CGM, wearable, or pharmacy-adherence stream feeds the twin at any phase this chapter specifies. All inputs are fixture data, Chapter 8 module signals (once wired), or explicit user-entered scenario parameters, per FR-TWIN-009.
- **NO-TWIN-7.** No scenario is ever run at a population level or against a hypothetical average patient. Every invocation is bound to one specific `patientId` (real-pilot or demo), per FR-TWIN-013.

### 9.8 Relationship to continuous learning

- **FR-TWIN-033.** When a clinician promotes a scenario-informed intervention into a care-plan draft and that intervention is subsequently actioned, the resulting real-world outcome shall be recorded as an outcome record in the existing continuous-learning loop (Chapter 5, §5.7; `docs/CONTINUOUS_LEARNING.md`), tagged with the specific twin scenario that informed the decision — so that any future tuning of the twin's rule weights is grounded in tracked outcomes, not asserted improvement.
- **FR-TWIN-034.** `autoRetrain: false` holds for every twin-related rule weight or coefficient at every phase described in this chapter. Any adjustment to the scenario catalogue's benefit/risk/confidence base values (the `INTERVENTION_CATALOGUE`-equivalent for diabetes) shall be a reviewed code/content change passing the Governed Model Release SOP's gates (`docs/GOVERNED_MODEL_RELEASE_SOP.md`, G-ML-1/2/3), never a runtime self-adjustment from observed outcomes.
- **FR-TWIN-035.** Outcome data used to evaluate or eventually tune the twin's rules shall carry the same provenance and honesty fields required of every other data source on the platform (Chapter 6, FR-CORE-014) — synthetic data stays labeled synthetic, and no twin-specific carve-out from that labeling discipline exists.

### 9.9 UI expectations (product level)

Full screen specification is deferred to Chapter 18; this section states the product-level expectations Chapter 18 must satisfy for the Diabetes Twin specifically.

- **FR-TWIN-036.** A clinician-facing surface shall let a clinician select from the scenario catalogue (§9.5) for a specific patient, view ranked results with `benefitScore`/`riskScore`/`confidence`/`rationale`, and visually distinguish "explore freely" scenarios (§9.5.1–§9.5.4, §9.5.6) from the gate-locked "stop insulin" class of scenario (§9.5.5) — e.g. a visible lock/warning treatment on the latter that is absent from the former, so a clinician is never one accidental click away from generating an ungated high-severity scenario.
- **FR-TWIN-037.** Whether a patient-facing self-service what-if surface exists at all in the near-term phase is Open Question OQ-TWIN-2; if and when it does, it shall expose only the scenario subset explicitly cleared for patient self-service (§9.5.1, §9.5.3, §9.5.4, §9.5.6 — weight, nutrition macros, sleep, exercise timing) and shall never expose §9.5.2 (start GLP-1) or §9.5.5 (stop insulin) as a directly selectable patient option, restating FR-TWIN-024/030.
- **FR-TWIN-038.** Every twin output screen — clinician- or patient-facing — shall render the `getTwinSimulationStatus()`-equivalent honesty fields (`physiologicalTwin: false`, `simulationMode`, `ehrWrite: false`, `hitlRequired: true`) as human-readable text, not as raw JSON or a field a reader must already know how to interpret.

### 9.10 Edge cases

- **EC-TWIN-1 (insufficient data for a requested scenario).** Given a "lose 6kg" scenario is requested for a patient with no on-file weight history, then the simulator shall return its lowest-confidence rehearsal band with an explicit `insufficient_data` flag in its output, rather than assuming a plausible-looking baseline weight or trend the platform does not actually have.
- **EC-TWIN-2 (conflicting scenarios run in the same session).** Given a clinician runs "reduce carbs" and then "increase protein" for the same patient in the same session, then both results shall be displayed as independent, timestamped outputs — the platform shall not silently reconcile, average, or suppress either result as redundant; deciding which (if either) is more relevant to this patient remains the clinician's judgment.
- **EC-TWIN-3 (unsafe scenario requested without clinician gate).** Given a patient-facing session attempts to request "stop insulin" directly, then the request shall be rejected at the API layer before any scenario logic executes (not merely hidden from the UI), and a SHIELD audit event shall record the blocked attempt, tagged for clinician visibility at next review — restated from AC-TWIN-024-1.
- **EC-TWIN-4 (Diabetes module signal not yet wired).** Given the Diabetes module's relevant intelligence area (e.g. GLP-1 Intelligence for a "start GLP-1" scenario) is not yet wired into orchestration (current v0/v1 state, Chapter 8 §8.3), then the scenario's rationale shall explicitly state `"diabetes-module signal unavailable — risk-state only"` rather than silently falling back to generic ORACLE-only reasoning presented as if it were diabetes-specific.
- **EC-TWIN-5 (input later revised or retracted).** Given a scenario was run using a self-reported input value (e.g. reported sleep hours) that the patient subsequently revises, then the original scenario output shall remain unchanged and intact in SHIELD's append-only audit trail (Chapter 5, §5.4), but any clinician-facing surface still displaying that output shall flag it as based on a since-revised input rather than presenting it as current.

### 9.11 Open questions for clinical/model owners

- **OQ-TWIN-1.** Should the Diabetes-scoped scenario catalogue (§9.3) be implemented as a new file (e.g. `lib/disease-modules/diabetes/twin.ts`) that reuses `twin-simulation.ts`'s types, or should `twin-simulation.ts` itself be parameterized to accept a disease-scoped catalogue? Affects FR-TWIN-008. **Owner:** Engineering + Product.
- **OQ-TWIN-2.** Should any Diabetes Twin scenario be exposed as a patient-initiated, self-service surface in the near-term phase at all, or should the entire scenario catalogue remain clinician-only until a specific safety review clears patient self-service for the low-risk subset? Affects FR-TWIN-020/022/023/025 and FR-TWIN-037. **Owner:** Clinical Safety Lead + Product.
- **OQ-TWIN-3.** Does `docs/GOVERNED_MODEL_RELEASE_SOP.md`'s G-ML-1/2/3 gate sequence — written with predictive/classification models in mind — need a simulation-specific addendum before any Target Twin state-variable modeling work (§9.4) begins? Affects FR-TWIN-015. **Owner:** Clinical Safety Lead + ML Governance.
- **OQ-TWIN-4.** Who is the named clinical modeling owner accountable for validating any future Target Twin state-variable relationship (FR-TWIN-018)? Not yet named by this Volume. **Owner:** Clinical Leadership.
- **OQ-TWIN-5.** Should the "start GLP-1" scenario (§9.5.2) draw directly on GLP-1 Intelligence's own suitability signal once wired, or compute an independent risk-state-only estimate, so the twin's inference is never conflated with the module's own signal in a way that could look like two independent systems agreeing when they actually share one input? **Owner:** Clinical Lead + Engineering.
- **OQ-TWIN-6.** What specific trigger (a pilot milestone, a volume of clinician-requested scenarios the near-term simulator cannot honestly answer, or a strategic product decision) should cause the platform to consider commissioning the Target Twin phase (§9.4)? Not yet defined. **Owner:** Product Leadership.
- **OQ-TWIN-7.** Should the Diabetes-scoped simulator's `artifactType` and catalogue live under the Diabetes module (`lib/disease-modules/diabetes/`) or under precision-health (`lib/precision-health/`) alongside the generic primitive it extends? This is an architectural sibling to OQ-TWIN-1 but concerns module ownership/boundary (Chapter 4, §4.3.3), not just file location. **Owner:** Engineering.

### 9.12 Cross-references

- Chapter 1 (§1.4 NO-2/NO-3) — the no-autonomous-prescribing/no-EHR-write commitments this chapter restates as NO-TWIN-2/3.
- Chapter 4 (§4.2 Layer 1 "Core — Digital Twin (generic primitive)" row and Layer 5 "Disease Digital Twins — Missing" row, FR-ARC-011/016) — the architectural statement this chapter takes to full requirements depth.
- Chapter 5 (§5.2.4 `medication_decision` gate, §5.4 SHIELD, §5.7 continuous-learning safety boundary, FR-HITL-006/007) — the safety mechanics every twin scenario in this chapter routes through without exception.
- Chapter 6 (§6.4 interoperability adapter pattern, FR-CORE-014 provenance, FR-CORE-022) — why no live device stream feeds the twin (NO-TWIN-6).
- Chapter 7 (FR-AGT-011 audit-event pattern, FR-AGT-040 explainability) — the orchestration-level patterns this chapter's §9.6/§9.4 restate at the twin layer.
- Chapter 8 (§8.6.3 Insulin's `doseChangeRecommendation: null` lock, §8.6.4 GLP-1's `prescribingRecommendation: null` lock, §8.6.9 Prevention Intelligence's non-twin boundary, FR-DIAB-046, NO-DIAB-1, NO-DIAB-7) — the exact boundary this chapter was commissioned to sit on the far side of, and the module signals the near-term simulator (§9.3) draws on once wired.
- `docs/GOVERNED_MODEL_RELEASE_SOP.md` — the gate sequence FR-TWIN-034 requires for any rule-weight change, and the subject of Open Question OQ-TWIN-3 for a future Target Twin phase.
- `docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md` — Layer 5 (Disease Digital Twins) "Missing" status this chapter's §9.3/§9.4 phase split is grounded against.
- `lib/precision-health/twin-simulation.ts` — the only twin-related code that exists today; every requirement in §9.2 is a direct restatement of this file's actual current behavior, and every requirement in §9.3 is framed as an extension of its pattern, not a replacement.

---

## 14. Chapter 10 — Population Intelligence `[DRAFTED]`

### 10.0 Purpose of this chapter

This chapter opens Part D (Intelligence Layers). It specifies requirements for Layer 6 — Population Intelligence — the layer Chapter 4 (§4.2) recorded as **Partial**: `lib/precision-health/risk-state.ts` (`buildPopulationRiskState`), the COMPASS agent (`lib/agents/llm-equity.ts`), and the ICS dashboard already produce synthetic-cohort aggregates, but — as this chapter establishes in detail — not through a real, computed Segment→Predict→Recommend→Monitor→Learn pipeline. As with every chapter in this Volume, this chapter separates what exists in code today from what is being specified as a requirement for future work, and does not overstate the former to avoid the discomfort of stating the latter plainly.

### 10.1 Purpose: an intelligence loop, not a static dashboard

- **FR-POP-001.** The platform shall define Population Intelligence as a five-stage intelligence loop — **Segment** (group patients into meaningful cohorts) → **Predict** (forecast trajectory for a segment) → **Recommend** (draft an action for a consumer persona to consider) → **Monitor** (track whether an accepted recommendation was actioned and what happened) → **Learn** (feed the outcome back into the continuous-learning loop) — rather than as a set of static, pre-computed dashboard numbers refreshed by hand. This framing is this chapter's organizing structure and the basis for §10.3–§10.7.
- **FR-POP-002.** Each stage of the loop shall be independently identifiable in any Population Intelligence output (e.g., via a `stage` field or equivalent), so a consumer of the platform — an ICS Lead, an auditor, or a future integrator — can tell which stage produced a given number or recommendation, rather than receiving an undifferentiated "population dashboard" blob.
- **FR-POP-003.** The word "intelligence" in this layer's name shall not be read as implying a physiological or patient-level twin — restating Chapter 9's honesty boundary (`physiologicalTwin: false`) at the population layer, where the existing `PopulationRiskState` type already carries this same field (`lib/precision-health/risk-state.ts`).

### 10.2 Current capabilities vs. required product capabilities (honest baseline)

This section states plainly what exists in code today, because every requirement in §10.3–§10.7 is meaningless without an honest starting point.

- **FR-POP-004.** This Volume records that, as of this chapter's drafting, no code path computes population statistics by live aggregation over the platform's actual patient-record store. Specifically:
  - `lib/mock-data/population.ts`'s `populationData` object (`icsName: "West Yorkshire Health and Care Partnership"`, `totalPatients: 47832`, `practices: 23`, `conditionPrevalenceByIMD`, `riskDistribution`, `benchmarkByPractice`, `equityDeepDive`) is a **separately-authored, hand-written, illustrative-scale fixture**. It is not derived from, linked to, or reconciled with the platform's actual synthetic patient cohort (`lib/mock-data/demo-cohort-generator.ts`, `DEMO_COHORT_PATIENT_TARGET = 100`) used everywhere else on the platform for individual-patient HORIZON/GUARDIAN/Diabetes-module demos. **These are two independent synthetic datasets today, not one aggregated into the other.**
  - `populationData.admissionForecast` is generated by `generateAdmissionForecast()`, a closed-form sine/cosine function over a day index — a demonstration curve, not a forecast computed from any patient data, model, or historical admissions record.
  - When `isNeo4jConfigured()` is true, `fetchIcsPopulationFromGraph()` (`lib/neo4j/queries.ts`) queries **pre-seeded literal properties** on graph nodes (`Organization {type:'ICS'}`, `ImdQuintile`, `Organization {type:'Practice'}`, `AdmissionForecast`) — e.g. `ics.totalPatients`, `ics.riskHigh` — rather than running a `COUNT()`/aggregation query over patient-level nodes. The "live Neo4j" path is honestly labeled as a data-source choice (`dataSource: "neo4j"` vs `"mock"`) in `EquityDraft`, but it is not, itself, a live computed aggregation either — it reads the same kind of pre-set numbers from a different store.
  - `buildPopulationRiskState()` (`lib/precision-health/risk-state.ts`) **does** perform real arithmetic (`highRiskSharePercent` from `riskDistribution`/`totalPatients`; `avgPredicted` from `admissionForecast`) — but its inputs are the static/seeded numbers described above, not a fresh Segment computation.
  - COMPASS (`lib/agents/llm-equity.ts`, `runEquityAgent`) **does** produce real output — an LLM-drafted or deterministic-fallback `EquityDraft` (`summary`, `priorities`, `recommendedActions`, `safetyNotes`, `confidence`) — computed from whichever `equityDeepDive` rows it is given, whether from the mock fixture or the (also-seeded) Neo4j path.
  - **(B6 addition.)** `lib/precision-health/population-diabetes.ts`'s `buildDiabetesPopulationAggregate()` **does** compute a real Segment-stage count by live arithmetic over the platform's actual patient-record store (`lib/mock-data/patients.ts`, the ~100-patient cohort) — this is the platform's first genuinely-computed Population Intelligence number, distinct from every bullet above it in this list. It is narrow in scope (one condition, two counts) and does not change the overall verdict that no Segment/Predict *pipeline* exists yet.
- **FR-POP-005.** This chapter's Segment and Predict requirements (§10.3, §10.4) shall be read as specifying a **real, computed pipeline** to be built — replacing the static fixture and the sine/cosine demonstration curve — not as descriptions of something that already runs. Recommend (§10.5) is the most-built stage today, via COMPASS. Monitor (§10.6) and Learn (§10.7) do not exist in any population-specific form today.
- **FR-POP-006.** Until the real Segment/Predict pipeline in §10.3–§10.4 is built, every Population Intelligence UI surface displaying `populationData`-fixture-derived numbers shall carry a visible disclosure that the figures are an illustrative synthetic-scale demonstration, not a live computed aggregate of the platform's actual patient population — restating this chapter's central honesty finding as a product (not just documentation) requirement. **(B6 — implemented.** Every ICS population UI surface — overview, Population Health, Equity, Forecast — now carries this disclosure in copy, naming the 47,832-patient/100-patient cohort disconnect explicitly and labeling the admission-forecast curve as a demonstration, not a live forecast; see `docs/PHASED_BUILD_PLAN.md` B6.)

### 10.3 Pipeline stage: Segment

**Purpose.** Group the patients within a tenant-scoped population into named, meaningful cohorts — by practice, IMD quintile, active condition, HORIZON risk tier, and (once Chapter 8's Diabetes module is wired at scale, §10.8) diabetes-relevant sub-populations.

- **FR-POP-007.** A Segment implementation shall compute cohort membership counts from the platform's actual patient-record store (today: the 100-patient synthetic cohort in `lib/mock-data/`; later: a real/pilot patient population) via the existing Postgres/Neo4j aggregation path — restating Chapter 4's FR-ARC-017 and the Tech Stack ADR's ClickHouse "Avoid now" determination (named trigger: real multi-practice, multi-thousand-patient scale) — not a new analytics warehouse and not a hand-authored fixture.
- **FR-POP-008.** Every Segment computation shall apply the same tenant-isolation filter (`filterRecordsForPractice`, Chapter 4 FR-ARC-031) before any aggregation runs, so a practice's segment counts never include another practice's patients without an explicit, separately-governed ICS-wide view.
- **FR-POP-009.** Segment output shall be counts and cohort labels only (e.g., "IMD Q1, active T2D: 340 patients") — never a raw, exportable membership list of individual patients — and shall have minimum-cell suppression applied (§10.10) before display.
  > **AC-POP-009-1.** Given a Segment computation for a named cohort returns a count below the minimum-cell threshold (§10.10, OQ-POP-1), when the result is prepared for display, then the platform shall suppress the exact count (showing, e.g., "fewer than N" or merging with an adjacent cohort) rather than display the small exact number.

### 10.4 Pipeline stage: Predict

**Purpose.** Produce forward-looking, segment-scoped estimates (e.g., predicted admissions, projected high-risk-share trajectory) — honestly labeled as rules-based/demonstration or model-based per its actual provenance.

- **FR-POP-010.** A Predict implementation shall compute its forward-looking estimate from real Segment output (§10.3) rather than a fixed, hand-authored curve — restating FR-POP-005's replacement of `generateAdmissionForecast()`.
- **FR-POP-011.** Every Predict-stage output shall carry the same model-honesty field set already defined on `PopulationRiskState` (`physiologicalTwin: false`, `simulationRanking: false`, `hitlRequired: true`, `ehrWrite: false`) — an aggregate forecast is not exempt from the platform's honesty contract merely because it is population-scoped rather than patient-scoped.
- **FR-POP-012.** Before any Predict-stage output is described to a consumer as a "prediction" backed by a trained/validated model (as opposed to a rules-based or demonstration estimate), it shall pass the Governed Model Release SOP's gates (`docs/GOVERNED_MODEL_RELEASE_SOP.md`, G-ML-1/2/3) — restating Chapter 5 §5.7's continuous-learning safety boundary at the population layer.
  > **AC-POP-012-1.** Given a Predict-stage output is displayed to an ICS Lead, when they inspect its source/limitations text, then it shall explicitly state whether the figure is a demonstration curve, a rules-based estimate, or a governed model's output — it shall never be ambiguous about which of the three it is.

### 10.5 Pipeline stage: Recommend

**Purpose.** Draft a population-level action (targeted outreach, capacity planning, equity intervention) for an ICS Lead or Hospital Executive to review — the platform's most-built stage today, via COMPASS.

- **FR-POP-013.** A Recommend implementation shall derive its recommendations from the same Segment/Predict output that produced the underlying signal — restating COMPASS's existing `EquityDraft.recommendedActions` pattern (`lib/agents/llm-equity.ts`) as the canonical shape any Recommend-stage output follows — rather than a UI component hard-coding recommendation strings, as `DigitalTwinPanel.tsx`'s current ICS-mode call does today (its `recommendedActions` array is passed in by the component, not derived by `buildPopulationRiskState()` itself).
- **FR-POP-014.** Every Recommend-stage output remains a decision-support draft only. An ICS Lead or Hospital Executive shall review and explicitly accept or dismiss it before it is treated as an operational plan — restating that "COMPASS cannot itself action a recommendation" (Chapter 7, §7.2.10) at the pipeline-stage level.
- **FR-POP-015.** Recommend-stage output shall never claim or attempt a write-back to EMIS, SystmOne, a national system, or any operational scheduling/staffing/outreach system — restating FR-AGT-029 with no Population-Intelligence-specific exception.
  > **AC-POP-014-1.** Given a Recommend-stage output (e.g., a COMPASS `EquityDraft`) is generated, when it is displayed to the requesting ICS Lead, then it shall be presented as a reviewable draft with an explicit accept/dismiss action, never as an already-actioned or auto-scheduled item.

### 10.6 Pipeline stage: Monitor

**Purpose.** Track, over time, whether an accepted Recommend-stage output was actually actioned and what the subsequent Segment/Predict signal did.

- **FR-POP-016.** This Volume records that no Monitor-stage tracking exists in code today for population-level recommendations — no scheduled job, event log, or dashboard tracks whether an accepted COMPASS recommendation (e.g., "deploy targeted outreach to East Leeds Family Practice") was actually carried out or what happened afterward. This section specifies a requirement for future work, not a description of current behavior.
- **FR-POP-017.** Once built, Monitor-stage tracking shall remain tenant-scoped and aggregate-only, subject to the same de-identification rules as Segment/Predict (§10.10) — it shall never become a de facto patient-level tracking mechanism through the back door of "did this specific patient get contacted."
- **FR-POP-018.** Monitor-stage results shall feed the Learn stage (§10.7) as an outcome record rather than disappear once a recommendation is marked accepted — restating the platform's general principle that acceptance of a draft is not the end of the audit trail (Chapter 5, §5.4).

### 10.7 Pipeline stage: Learn

**Purpose.** Feed Monitor-stage outcomes back into the platform's governed continuous-learning loop so future Segment/Predict/Recommend logic improves on evidence, not assertion.

- **FR-POP-019.** A Learn implementation shall feed Monitor-stage outcome records (§10.6) into the platform's existing continuous-learning loop (Chapter 5, §5.7; `docs/CONTINUOUS_LEARNING.md`) as population-scoped outcome events, tagged distinctly from patient-level outcome events.
- **FR-POP-020.** `autoRetrain: false` holds for every population-level model, rule set, or coefficient at every phase this chapter describes. Any adjustment to Segment/Predict/Recommend logic based on Learn-stage outcomes shall be a reviewed change passing the Governed Model Release SOP's gates (G-ML-1/2/3), never a silent runtime update — restating the platform-wide honesty field with no Population-Intelligence-specific exception.
- **FR-POP-021.** Learn-stage outcome data shall carry the same provenance/honesty labeling required of every other data source on the platform (Chapter 6, FR-CORE-014) — population-level synthetic data stays labeled synthetic, with no carve-out for aggregate data being "less sensitive to label honestly."

### 10.8 Diabetes population intelligence extension (phased, contingent on Chapter 8)

- **FR-POP-022.** This Volume records that **no diabetes-specific population segment, prediction, or recommendation exists in code today.** `populationData.conditionPrevalenceByIMD`'s `t2d` column (e.g., `8.2` for Q1) is a hand-authored illustrative percentage in the static fixture — it is not sourced from, or reconciled with, Chapter 8's Diabetes module in any way, and it predates that module's existence in this Volume. **(B6 — partially superseded.** `lib/precision-health/population-diabetes.ts`'s `buildDiabetesPopulationAggregate()` now computes a real Segment-stage count — t2d/t1d-flagged patients and complication-domain-flagged patients — by live arithmetic over the actual ~100-patient synthetic cohort (`lib/mock-data/patients.ts`), reusing Chapter 8's `buildComplicationSignal`. This remains far short of the diabetes-specific Segment/Predict/Recommend pipeline §10.8 specifies for a later phase — it is one genuinely-computed count, not a pipeline — and `populationData.conditionPrevalenceByIMD`'s illustrative `t2d` fixture column is untouched and still disconnected from it.)
- **FR-POP-023.** Once Chapter 8's Diabetes module intelligence areas are wired into orchestration at a scale beyond a single-patient demo (Chapter 8, §8.3's v1/v2 phasing) — not before — the Segment stage MAY add diabetes-specific segment dimensions (e.g., HbA1c-band segments, GLP-1-suitability segments, complication-domain segments per Chapter 8 §8.6.8's `DIABETES_COMPLICATION_DOMAINS`). This is a requirement for a later phase; it is not satisfied by Chapter 8's current v0 stub state, where every Diabetes signal builder still returns `insufficient_data`/`null` — values that cannot honestly be aggregated across a population yet.
- **FR-POP-024.** When a diabetes population extension is built, it shall reuse the Segment→Predict→Recommend→Monitor→Learn pipeline defined in §10.3–§10.7 rather than introduce a parallel, diabetes-only population-analytics pipeline — restating the platform-reuse-not-parallel-system principle (Chapter 1, BO-2) at the population layer, matching how Chapter 8 itself reuses CONDUCTOR/SHIELD/HITL rather than inventing new versions of them.
- **FR-POP-025.** Any diabetes population segment, prediction, or recommendation surfaced to an ICS Lead or Hospital Executive shall carry the same clinical-lead-approved-wording requirement Chapter 8 already imposes on individual-patient HbA1c trend language (FR-DIAB-057) — an aggregate framing does not relax this requirement; a wrong aggregate claim about system-level diabetes prevalence could inform a resourcing decision affecting far more patients than a single wrong individual-level claim.

### 10.9 Consumers: current and future personas

- **FR-POP-026.** ICS Lead (Chapter 3, §3.2.5) and Hospital Executive (Chapter 3, §3.2.6) are the platform's currently-defined Population Intelligence consumer personas. Every requirement in this chapter shall be satisfiable via these two personas' existing primary surfaces (`/dashboard/ics`, `/dashboard/regional`, `/dashboard/hospital`) without this chapter inventing a new persona.
- **FR-POP-027.** Payer/insurer and pharma are recorded as **Phase 3, not-yet-live** future consumer categories, represented today only by read-only placeholder stubs (`lib/precision-health/pharma-payer.ts`: `getPayerVbcMetrics`, `getPharmaRweSummary`, both carrying `livePayerIntegration: false` / `livePharmaIntegration: false`). This chapter does not request building a live payer or pharma integration; these remain placeholders until a named commercial/contractual trigger is defined (Open Question OQ-POP-4).
- **FR-POP-028.** "Employer" as a Population Intelligence consumer has **no code representation of any kind today** — no stub, no placeholder, no persona definition in Chapter 3. This Volume records that as a gap to be explicitly decided (Open Question OQ-POP-3), not silently assumed either way.
- **FR-POP-029.** A distinct "government" consumer category is not introduced by this chapter. For NHS-context purposes, government-level interest is already substantially represented by the ICS Lead persona, since an ICS is itself a statutory NHS body — a second, separate "government" persona (e.g., for a national analytics body) is deferred to Open Question OQ-POP-6 pending a named real requirement.

### 10.10 Privacy & de-identification requirements

- **FR-POP-030.** No Population Intelligence surface shall return patient-identifiable detail (name, NHS number, date of birth, or any other direct identifier) in an aggregate response, at any phase — restating Chapter 4's FR-ARC-033 and Chapter 7's FR-AGT-028 as the single non-negotiable rule every requirement in this chapter is built under.
- **FR-POP-031.** A minimum-cell-size (k-anonymity-style) suppression threshold shall be applied to every Segment/Predict/Recommend/Monitor output before display, such that a segment whose underlying population count falls below the threshold is suppressed, bucketed with an adjacent segment, or shown as "fewer than N" rather than as an exact small number. **The exact numeric threshold is not fixed by this chapter** — it is Chapter 4's Open Question OQ-ARC-2, restated here as OQ-POP-1, and every FR in this section is written to hold regardless of where that threshold ultimately lands. **(B6 — canonical enforcement point added.** Before this phase, no suppression of any kind was implemented anywhere in code — a genuine gap this phase's audit found. `lib/precision-health/population-suppression.ts`'s `suppressSmallCell()`/`MIN_POPULATION_CELL_SIZE` is now the single enforcement point every population aggregate display calls (COMPASS Deep-Dive flag counts, Practice Benchmarking GUARDIAN/COMPASS columns, the new diabetes population aggregate). The threshold used, `10`, is an engineering-chosen conservative interim default per `EC-POP-1`'s own precautionary principle — **OQ-POP-1/OQ-ARC-2 remains open**; this does not decide the clinically/compliance-approved final number.)
  > **AC-POP-031-1.** Given any Population Intelligence view is requested for a segment whose true underlying count is, for example, 2 patients, when the view is rendered, then no part of the response — including derived percentages — shall allow that count to be reconstructed exactly.
- **FR-POP-032.** No Population Intelligence output shall be re-identifiable by cross-referencing multiple aggregate views (e.g., combining a small-practice segment count with a rare-condition segment count, or subtracting an ICS-wide total from the sum of known large practices to infer a small remaining practice's count) — the suppression rule (FR-POP-031), once fixed, shall account for this differencing-attack pattern across views, not just within a single view.
- **FR-POP-033.** Every Population Intelligence data access shall be scoped by the existing purpose-bound consent registry's `population_analytics` purpose code (`lib/precision-health/consent.ts`) — restating Chapter 6's consent-purpose model at the population layer.
  > **AC-POP-033-1.** Given a patient's consent grant for `population_analytics` is revoked, when the next Segment computation runs, then that patient shall not contribute to any segment count until/unless consent is re-granted.
- **FR-POP-034.** Every Population Intelligence surface shall apply the existing tenant-isolation check (`filterRecordsForPractice`, Chapter 4 FR-ARC-031) so that no persona ever sees another practice's or another ICS's aggregate without an explicit, separately-governed cross-tenant view.
  > **AC-POP-034-1.** Given an ICS Lead from ICS A requests any Population Intelligence aggregate, when the response is returned, then it shall include only ICS A's data — restating AC-ARC-031-1 at the ICS-tenant level, not just the practice level.

### 10.11 HITL & governance for population-level interventions

- **FR-POP-035.** Every Recommend-stage output remains a decision-support draft; the requesting ICS Lead or Hospital Executive must explicitly accept or dismiss it before it becomes an operational plan — restating FR-POP-014 as this chapter's HITL requirement, analogous to Chapter 5's item-level disposition gate (§5.2.1) but scoped to a population-level draft rather than an individual clinical one.
- **FR-POP-036.** No Population Intelligence output shall trigger an automatic operational action — no automatic outreach-campaign send, no automatic staffing change, no automatic resource reallocation — at any phase this chapter describes. This restates `ehrWrite: false`'s governing principle at the population/operational layer, even though no EHR write is directly at stake here.
- **FR-POP-037.** Every Population Intelligence pipeline-stage invocation (Segment, Predict, and Recommend at minimum) shall be logged to SHIELD as an immutable audit event, tagged with the requesting persona, tenant scope, and stage — restating the platform's existing per-invocation audit pattern (Chapter 7, FR-AGT-011) at the population layer.
- **FR-POP-038.** A Population Intelligence output (e.g., "IMD Q1 patients show higher T2D prevalence") shall never be used as a substitute for an individual clinical assessment of a named patient — an aggregate signal informs system-level planning; it does not authorize skipping a patient-level HITL-gated review (Chapter 5) for any specific patient.

### 10.12 Non-goals

- **NO-POP-1.** No live write-back to a population-level operational system (EMIS/SystmOne, a national system, a staffing/rostering system, an outreach/campaign system) exists or is requested by this chapter.
- **NO-POP-2.** No ClickHouse or other analytics-warehouse deployment is mandated by this chapter — restating Chapter 4's FR-ARC-017 and the Tech Stack ADR's "Avoid now" determination for ClickHouse; Postgres/Neo4j aggregation remains sufficient at current and near-term scale, with the named trigger (real multi-practice, multi-thousand-patient scale) unchanged from Chapter 4.
- **NO-POP-3.** No live payer, pharma, or insurer integration exists or is requested; `lib/precision-health/pharma-payer.ts`'s stubs remain Phase 3 placeholders (restates FR-POP-027).
- **NO-POP-4.** No diabetes-specific population segment, prediction, or recommendation is claimed to exist in code today (restates FR-POP-022).
- **NO-POP-5.** No Population Intelligence surface shall ever expose a patient-identifiable value in an aggregate response, regardless of segment size — this is an absolute, non-phased prohibition, not something that loosens once a suppression threshold is fixed (restates FR-POP-030).
- **NO-POP-6.** No new `HumanGateId` and no new tenant-isolation mechanism are introduced by this chapter — Population Intelligence reuses the existing gate catalogue posture (§10.11) and the existing `filterRecordsForPractice` check (§10.10) rather than building parallel ones.
- **NO-POP-7.** No "employer" population-consumer persona or surface is built by this chapter (restates FR-POP-028); this is recorded as an open decision, not a quiet default.

### 10.13 Edge cases

- **EC-POP-1 (segment count near the suppression threshold).** Given a Segment computation's result count sits exactly at the not-yet-fixed minimum-cell threshold boundary, then the platform shall apply the more conservative (higher-suppression) interpretation until OQ-POP-1 fixes the exact rule — restating this Volume's general precautionary principle for undecided safety/privacy-adjacent thresholds (e.g., Chapter 8's EC-DIAB-4 pattern).
- **EC-POP-2 (ICS-wide view spanning practices of very different sizes).** Given an ICS-wide aggregate combines a very large practice and a very small practice, then the small practice's contribution shall still be independently subject to minimum-cell suppression even though the combined ICS-wide number is large — a large combined total does not exempt its small constituent parts from suppression if they are ever broken out or could be inferred by subtraction (restates FR-POP-032).
- **EC-POP-3 (demonstration curve mistaken for a live forecast).** Given an ICS Lead views the current `admissionForecast` sine/cosine demonstration curve, then the UI shall carry the disclosure required by FR-POP-006/FR-POP-012 so it is not read as a validated NHS forecast — a UI-layer requirement Chapter 18 must implement, not a change to the underlying curve itself.
- **EC-POP-4 (COMPASS LLM path unavailable).** Given the LLM path for COMPASS/Recommend-stage generation is disabled or unreachable (`isLlmEquityConfigured()` returns false, or the model call throws), then the deterministic fallback (`deterministicFallback` in `lib/agents/llm-equity.ts`) shall still produce a usable, honestly-labeled recommendation set (its `safetyNotes` explicitly state "Deterministic COMPASS fallback...") rather than the surface failing silently or blocking the ICS Lead's workflow.
- **EC-POP-5 (differencing attack across combined views).** Given two practices' small segment counts, both individually suppressed, could still allow a sophisticated user to infer one practice's near-exact count by subtracting it from a known, larger ICS-wide total, then the suppression rule (once fixed, OQ-POP-1) shall account for this differencing pattern specifically, not just apply suppression to each view considered in isolation.

### 10.14 Open questions

- **OQ-POP-1 (restates Chapter 4's OQ-ARC-2).** Confirm the exact k-anonymity/minimum-cell-suppression threshold for Population Intelligence aggregates. This chapter does not re-decide it; every privacy requirement in §10.10 is written to hold regardless of the eventual number. **Owner:** Clinical Safety Lead + Compliance + Architecture. **Status note (B6):** still open. A conservative interim default of `10` is now enforced in code as the one canonical suppression point (`lib/precision-health/population-suppression.ts`) so this open question no longer means "no enforcement exists" — but the number itself remains engineering's placeholder, not this question's answer.
- **OQ-POP-2.** Confirm whether building a real Segment/Predict implementation (replacing the static `populationData` fixture and the sine/cosine demonstration curve, per §10.2–§10.4) is a near-term (v1) roadmap commitment, or remains demo-fixture scaffolding until a named pilot/scale trigger is hit. **Owner:** Product + Engineering.
- **OQ-POP-3.** Confirm whether "employer" should become a Population Intelligence consumer persona at all, and if so, what data boundary would apply — an employer's interest in an individual employee's health raises materially different privacy/consent questions than an NHS ICS's population-planning interest. **Owner:** Product Leadership + Legal/Compliance.
- **OQ-POP-4.** Confirm the named commercial/contractual trigger that would justify building a live payer or pharma integration beyond the current placeholder stubs (`lib/precision-health/pharma-payer.ts`). **Owner:** Product Leadership + Commercial.
- **OQ-POP-5.** Confirm whether Monitor-stage tracking (§10.6) should be built as part of the near-term roadmap, given no code exists for it today and it is a prerequisite for Learn-stage (§10.7) outcomes to be meaningful rather than assumed. **Owner:** Product + Clinical Safety Lead.
- **OQ-POP-6.** Confirm whether a non-ICS "government" consumer (e.g., a national analytics body such as an OHID-style function) is a real near-term requirement, or should remain unaddressed until a specific one is named. **Owner:** Product Leadership.
- **OQ-POP-7.** Confirm the differencing-attack mitigation approach for ICS-wide vs. practice-level suppression (EC-POP-5) once the minimum-cell threshold (OQ-POP-1) is fixed. **Owner:** Architecture + Compliance.

### 10.15 Cross-references

- Chapter 1 (§1.1 BO-2) — the platform-reuse-not-parallel-system principle restated at the population layer (FR-POP-024).
- Chapter 3 (§3.2.5 ICS Lead, §3.2.6 Hospital Executive) — the two currently-defined Population Intelligence consumer personas (§10.9).
- Chapter 4 (§4.2 Layer 6 row, FR-ARC-017/031/033, §4.10 OQ-ARC-2) — the architecture-level statement this chapter takes to full requirements depth, and the k-anonymity open question this chapter restates rather than re-decides (OQ-POP-1).
- Chapter 5 (§5.2.1 item-level HITL gate, §5.4 SHIELD, §5.7 continuous-learning safety boundary) — the safety mechanics §10.7/§10.11 restate at the population layer.
- Chapter 6 (FR-CORE-014 provenance; `lib/precision-health/consent.ts` purpose-code registry, specifically `population_analytics`) — the consent and data-honesty model §10.10 restates.
- Chapter 7 (§7.2.10 COMPASS, FR-AGT-028/029, AC-AGT-028-1, EC-AGT-4) — the existing agent-level requirements this chapter's Recommend stage (§10.5) and privacy section (§10.10) build directly on.
- Chapter 8 (§8.3 phasing, FR-DIAB-057) — the Diabetes-module wiring status and clinical-wording-approval requirement this chapter's §10.8 depends on and restates.
- Chapter 9 (§9.1, `physiologicalTwin: false`) — the honesty-field pattern restated for Population Intelligence in FR-POP-003/011.
- `docs/ADR_TECH_STACK_MODERNIZATION.md` — the ClickHouse "Avoid now" determination restated as NO-POP-2.
- `docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md` — Layer 6's "Partial" status this chapter's §10.2 is grounded against.
- `lib/precision-health/risk-state.ts`, `lib/agents/llm-equity.ts`, `lib/mock-data/population.ts`, `lib/neo4j/queries.ts` + `mock-fallback.ts`, `lib/precision-health/pharma-payer.ts`, `lib/precision-health/consent.ts`, `lib/clinical-proof/tenant-isolation.ts` — every current-state claim in §10.2/§10.9/§10.10 is a direct restatement of these files' actual behavior.

---

## 15. Chapter 11 — Patient Intelligence `[DRAFTED]`

### 11.0 Purpose of this chapter

This chapter is the second of Part D (Intelligence Layers). It specifies requirements for Layer 7 — Patient Intelligence — the layer Chapter 4 (§4.2) recorded as **Partial, generic**: `lib/precision-health/timeline.ts`, `health-plan.ts`, and `coaching.ts`, plus `lib/patient-companion/profile.ts`, already exist and are wired into the patient-facing surface, but (as this chapter establishes) are disease-agnostic, not personalized to an individual patient's data, and cover only a subset of the product vision's nine named patient-facing capabilities (Coach, Education, Gamification, Wearables, Voice, Medication, Lifestyle, Goals, Family). As with every chapter in this Volume, this chapter states plainly which of those nine exist, which are partially built, and which have no code representation at all — three of the nine (Gamification, Goals, Family) fall in the last category.

### 11.1 Purpose: closing the loop with the patient

- **FR-PAT-001.** The platform shall define Patient Intelligence as the layer that closes the loop directly with the patient between clinical encounters — surfacing coaching, education, and self-management support to the patient themselves — complementing, not duplicating, Clinical Intelligence (Chapter 12, clinician-facing) and Population Intelligence (Chapter 10, system/ICS-facing), per the nine-layer vocabulary (Chapter 4, FR-ARC-003).
- **FR-PAT-002.** Every Patient Intelligence output shall be built on the platform's existing shared primitives (`coaching.ts`'s `CoachingDraft` contract, `health-plan.ts`'s `HealthPlanDraft` contract, `timeline.ts`'s `PatientTimelineEvent` contract, `modalities.ts`'s modality-sample contracts) rather than a parallel patient-only data model or safety framework — restating Chapter 1's platform-reuse-not-parallel-system principle (BO-2) at the patient layer.
- **FR-PAT-003.** A patient's view of their own data shall always be scoped by the platform's existing patient-URL-access check (`evaluatePatientUrlAccess`, Chapter 3 §3.6) — restated in full in §11.11, since it governs every capability in this chapter, not just one.
- **FR-PAT-004.** The word "Intelligence" in this layer's name shall not be read as implying a physiological simulation of the patient — restating Chapter 9's honesty boundary (`physiologicalTwin: false`) at the patient layer, where `health-plan.ts`'s own schema already carries this literal field on every generated plan.

### 11.2 Current capabilities vs. required product capabilities (honest baseline)

This section states, capability by capability, what the product vision calls for and what exists in code today. Nothing in §11.3–§11.10 should be read as claiming more than this table states.

| Vision capability | Status | Grounding |
|---|---|---|
| **Coach** | **Partial** | `coaching.ts` (4 generic areas: Nutrition, Sleep, Exercise, Mental Health) + Chapter 8's 3 diabetes-specific coaching drafts (Nutrition, Exercise, Behaviour). Static, template-based talking points (v0) — not personalized to an individual patient's data yet. |
| **Education** | **Partial** | Delivered only as embedded signposting text inside coaching-draft `suggestions`/`disclaimers` fields (e.g., "Signpost to NHS / practice-approved... resources only"). No dedicated, separately-browsable content library, article system, or completion tracking exists. |
| **Gamification** | **Missing** | No streak, points, badge, or other engagement-mechanic code exists anywhere in the platform. |
| **Wearables** | **Partial** | `wearableSampleSchema` (heart rate, steps, SpO2, BP) and `SYNTHETIC_MODALITY_FIXTURES` exist with `provenance.liveStream: false` fixed by schema. No live device integration (Fitbit, Apple Health, a CGM, or any other wearable API) exists. |
| **Voice** (patient-facing) | **Missing** | VOICE (Chapter 7 §7.2.3) and VOICE CARE (Chapter 7 §7.2.14) both exist but are clinician-dictation and nurse-escalation capabilities respectively — neither is, or is intended to be read as, a patient-facing voice interface. |
| **Medication** (adherence views) | **Partial** | `getPatientCompanionProfile()` renders a static medication list (label/schedule/purpose) from onboarding preferences or hardcoded demo defaults. No adherence derivation (refill data, dose-taken logging, missed-dose detection) exists; Chapter 8's Behaviour Diabetes coaching explicitly defers "medication refill/adherence signals" to a future v1. |
| **Lifestyle** | **Partial** | `lifestyleSampleSchema` (smoking, alcohol, activity, diet, sleep self-report) exists and feeds coaching-draft generation as "coaching draft fodder," but exists today only as `SYNTHETIC_MODALITY_FIXTURES` — no patient-facing self-report *submission* surface (a check-in form or API route) exists in code, despite Chapter 3's persona description (§3.2.7) describing this as a patient task. |
| **Goals** | **Missing** | No patient goal-setting or goal-progress-tracking type or feature exists anywhere in the codebase. |
| **Family** | **Missing** | No caregiver/family-proxy access model, consent-purpose code, or persona exists. Chapter 3's 8-persona set (§3.2) does not include a family/caregiver role. |

- **FR-PAT-005.** This chapter's requirements for Gamification, Goals, and Family (§11.9) are recorded as future-work specifications only, at a lighter depth than the Partial capabilities — this chapter does not pretend a fuller current-state exists for them by writing an equally detailed Purpose/Responsibilities/Inputs/Outputs section for something with zero supporting code.
- **FR-PAT-006.** This chapter's requirements for Coach, Education, Lifestyle, Wearables, and Medication views (§11.3–§11.7) shall build on, and never contradict, the existing contracts named in the table above.

### 11.3 Capability: Coach (wellness coaching drafts)

**Purpose.** Offer the patient low-risk, HITL-gated wellness coaching talking points — general and, where Chapter 8's Diabetes module is enabled, diabetes-specific — without ever presenting them as clinical advice.

**Responsibilities.** Generate a `CoachingDraft` (or `DiabetesCoachingDraft`) for a requested area; attach disclaimers and escalation hints; surface it on the patient companion surface; route any fired escalation hint to clinician review.

**Inputs.** Patient ID; optional free-text `contextNotes`; the requested coaching area (`NUTRITION` | `SLEEP` | `EXERCISE` | `MENTAL_HEALTH`, or the Diabetes-specific equivalents).

**Outputs.** A `CoachingDraft`/`DiabetesCoachingDraft` object: `title`, `summary`, `suggestions[]`, `disclaimers[]`, `clinicalEscalationHints[]`, `hitlRequired: true`, `ehrWrite: false`, `isClinicalAdvice: false`, `confidence`.

**Triggers.** A patient (or, today, a demo operator on their behalf) requesting a coaching draft for a given area; a Chapter 8 signal builder feeding diabetes-specific context (once wired, per Chapter 8 §8.3).

- **FR-PAT-007.** The platform shall offer patient wellness coaching via the existing `CoachingDraft` contract for the four generic areas (`coaching.ts`) and, where Chapter 8's Diabetes module is enabled for a patient, the three diabetes-specific coaching drafts (`NUTRITION_DIABETES`, `EXERCISE_DIABETES`, `BEHAVIOUR_DIABETES`, per `lib/disease-modules/diabetes/{nutrition,exercise,behaviour}.ts`) — restating Chapter 8's own reuse note ("Reuses the coaching-draft honesty contract... with diabetes-specific talking points") as a platform-wide rule: there is one coaching-draft engine, not a parallel diabetes one.
- **FR-PAT-008.** Every coaching draft, generic or diabetes-specific, shall carry `isClinicalAdvice: false`, `hitlRequired: true`, and `ehrWrite: false`, and shall display a "NOT CLINICAL ADVICE — coaching draft only" disclaimer with equal visual prominence regardless of which of the seven coaching-draft functions produced it.
  > **AC-PAT-008-1.** Given any coaching draft (generic or diabetes-specific) is generated, when it is inspected, then `isClinicalAdvice` shall be `false` and `hitlRequired` shall be `true` — there is no coaching-draft code path that produces a different value for either field.
- **FR-PAT-009.** This Volume records that coaching drafts today are static, template-based talking points (v0), not personalized to an individual patient's actual glucose, activity, sleep, or adherence data. Every coaching-draft function accepts `contextNotes` as an optional free-text hint only; none derives its `suggestions` from a patient's modality samples (§11.5–§11.6) or Chapter 8 signals — both files' own code comments confirm this is unbuilt (`nutrition.ts`: "No personalisation from glucose/nutrition log data yet"; `behaviour.ts`: "No adherence-pattern derivation yet"). Personalizing coaching drafts is a requirement for future work (v1), not a description of current behavior.
- **FR-PAT-010.** A coaching draft's `clinicalEscalationHints` shall route, when fired, to the same clinician-review (HITL) path as any other clinical draft (Chapter 5, §5.2.1) — restating Chapter 8's diabetes-specific Behaviour Scientist crisis-escalation requirement (FR-DIAB-042) at the platform-wide Coach capability, so a generic (non-diabetes) MENTAL_HEALTH coaching draft's suicidal-ideation hint is handled with the same seriousness as the diabetes-specific one.
  > **AC-PAT-010-1.** Given a generic `MENTAL_HEALTH` coaching draft's `clinicalEscalationHints` include a suicidal-ideation or self-harm trigger, when the draft is generated, then the platform shall route it to immediate clinician escalation (HITL) — restating that this escalation handling is not diabetes-module-specific.
- **FR-PAT-011.** A coaching draft shall never be attached to a patient's care plan or record without an explicit clinician HITL Accept — restating `health-plan.ts`'s own safety note ("HITL Accept/Edit/Reject required before any staging or record impact") at the Coach capability specifically.

### 11.4 Capability: Education

**Purpose.** Give the patient general, practice-approved reference material relevant to their condition(s) — signposting, not personalized guidance.

- **FR-PAT-012.** The platform shall deliver patient education today as embedded signposting text within coaching-draft `suggestions` and `disclaimers` fields (e.g., "Signpost to NHS / practice-approved diabetes diet resources only," "Signpost to practice-approved IAPT / NHS Talking Therapies resources only") — restating that Education, as currently built, is a property of the Coach capability (§11.3), not a separate feature.
- **FR-PAT-013.** This Volume records that no dedicated, separately-browsable education-content library, article system, video library, or completion-tracking feature exists in the codebase today. Building one is a requirement for future work, tracked as Open Question OQ-PAT-7, not a description of current behavior.
- **FR-PAT-014.** Any future dedicated Education capability shall reuse the platform's existing consent-purpose model (`coaching_wellness`, Chapter 6) and disclaimer pattern (`isClinicalAdvice: false`-equivalent labeling) rather than introduce a separate content-governance framework.
- **FR-PAT-015.** Education content, current or future, shall never present itself as personalized clinical guidance for an individual patient's condition — it remains general, practice-approved, signposting material, restating `isClinicalAdvice: false` at the content level.

### 11.5 Capability: Lifestyle & patient self-report

**Purpose.** Capture patient-reported lifestyle context (smoking, alcohol, activity, diet, sleep) to feed Coach (§11.3) and, where relevant, Chapter 8's Nutrition/Exercise/Behaviour signal areas.

**Inputs (once built).** A patient-submitted lifestyle self-report, validated against `lifestyleSampleSchema`, under an active consent grant.

**Outputs.** A stored `StoredModalitySample` (modality `"lifestyle"`) available to Coach (§11.3) and the patient timeline (§11.11's cross-reference to `timeline.ts`).

- **FR-PAT-016.** The platform shall accept patient lifestyle self-report data via the existing `lifestyleSampleSchema` (`smokingStatus`, `alcoholUnitsPerWeek`, `activityMinutesPerWeek`, `dietNotes`, `sleepHoursTypical`) under an active consent grant, feeding coaching-draft generation (§11.3) and, where Chapter 8's Diabetes module is enabled, its Nutrition/Exercise/Behaviour signal areas.
- **FR-PAT-017.** This Volume records that no patient-facing self-report submission surface (a check-in form, a dedicated API route) exists in code today. `lifestyleSampleSchema` samples exist only as entries in `SYNTHETIC_MODALITY_FIXTURES` — hand-authored, not patient-submitted. Chapter 3's persona description of the Patient "completing self-report check-ins" (§3.2.7) describes an intended task, not a built feature; `app/for-patients/page.tsx`'s marketing copy ("Patient health companion for check-ins...") describes the same intent without a backing implementation. Building this submission surface is a requirement for future work, tracked as Open Question OQ-PAT-5.
  > **AC-PAT-017-1.** Given a future self-report check-in feature is built, when a patient submits a lifestyle sample, then it shall require an active, purpose-bound consent grant before acceptance, restating the existing ingestion-stub consent-gate pattern (`buildIngestionStubResponse`, Chapter 6 FR-CORE-022).
- **FR-PAT-018.** Once built, every patient self-report submission shall carry the same `provenance` contract already required of every modality sample (Chapter 6, FR-CORE-014: `source`, `liveStream: false` until genuinely live, `realPatientData: false` until genuinely a real patient submission) — no patient-self-report exception to the platform's data-honesty model.

### 11.6 Capability: Wearables

**Purpose.** Represent wearable-device data (heart rate, steps, SpO2, blood pressure) in a patient's timeline and coaching context, honestly distinguishing schema/fixture support from a live device connection.

- **FR-PAT-019.** Wearable data is defined via `wearableSampleSchema` (resting heart rate, steps, SpO2, systolic/diastolic BP) with `provenance.liveStream: false` fixed by the schema's own type. This Volume records that no live device connection (Fitbit, Apple Health, Garmin, a continuous glucose monitor, or any other wearable API) exists in the codebase today — only the schema and `SYNTHETIC_MODALITY_FIXTURES` exist.
- **FR-PAT-020.** Any future live wearable integration shall be built as a new ingestion-stub-pattern adapter (Chapter 6, FR-CORE-022) behind an explicit consent grant and an honest `liveStream` flag flip — restating the interoperability-adapter pattern by name for wearables specifically, consistent with Chapter 8's FR-DIAB-052 restating the same pattern for a future CGM integration.
- **FR-PAT-021.** No coaching draft, timeline entry, or patient-facing display shall claim wearable-derived precision it does not have (e.g., sleep-stage accuracy from a device that does not report it) — restating `coaching.ts`'s own existing code-level disclaimer ("Avoid claiming wearable sleep-stage accuracy — no invented live wearable stream") as a platform-wide product rule, not merely an internal code comment.

### 11.7 Capability: Medication views (adherence & education)

**Purpose.** Let the patient see their current medication list and general medication education, while making it structurally impossible for the app to be used to self-prescribe, change a dose, or stop a medication.

**Responsibilities.** Render the patient's current medication list (view-only); surface general, practice-approved medication education; reject and redirect any patient attempt to request a medication change.

**Inputs.** Onboarding-confirmed medication preferences or a clinician-confirmed medication record (today: `getPatientCompanionProfile()`'s preference/default data).

**Outputs.** A view-only medication list (`label`, `schedule`, `purpose`); a rejection-and-redirect response for any medication-change attempt.

**Triggers.** A patient viewing their companion profile; a patient submitting any input (structured or free-text) that requests a medication change.

- **FR-PAT-022.** A patient shall be able to view their own current medication list (label, schedule, purpose) via the patient companion surface (`getPatientCompanionProfile()`) — view-only, sourced from onboarding-confirmed preferences or a clinician-confirmed record, and never directly editable by the patient as a clinical fact.
- **FR-PAT-023.** This Volume records that no medication-adherence *derivation* exists today — no refill data, no dose-taken logging, no missed-dose detection. `getPatientCompanionProfile()`'s medication list is static display data only, and Chapter 8's `BEHAVIOUR_DIABETES` coaching draft explicitly defers "medication refill / adherence signals" to a future v1 (per its own code comment). Any patient-facing "adherence view" beyond a static list is a requirement for future work.
- **FR-PAT-024 (hard rule).** A patient shall **never** be able to self-prescribe, request a dose change, or stop a medication — including insulin — directly through any patient-facing surface, in any current or future release of this capability. This restates, at the Patient Intelligence layer, Chapter 8's Insulin Intelligence type-level lock (`doseChangeRecommendation: null`, NO-DIAB-2) and Chapter 9's twin-layer prohibition (FR-TWIN-024/030, NO-TWIN-3): a patient-facing medication view may display information; it may never accept a patient action that changes what a patient is prescribed or takes.
- **FR-PAT-025.** A patient-initiated medication-change request — a structured form submission, a free-text coaching-chat message, or a "what if I stop [medication]" question — shall, however phrased, be refused at the application layer and routed to the patient's care team via the existing "raise a concern" escalation path (Chapter 3, §3.2.7) rather than actioned, simulated for the patient, or displayed as a self-service option. This restates Chapter 9's FR-TWIN-024/EC-TWIN-3 pattern for any medication-cessation or dose-change request generally, not only requests framed as a twin "what-if" scenario.
  > **AC-PAT-025-1.** Given a patient attempts to submit any request that would alter their medication list (add, remove, or change a dose) via a patient-facing surface, when the request reaches the application layer, then it shall be rejected, shall never write to any medication record, and shall be redirected to a "raise a concern to your care team" flow.
- **FR-PAT-026.** Medication education content (e.g., "what is Metformin for") shall be general, practice-approved reference material, not personalized dosing guidance, and shall carry the same "not clinical advice" framing as other Education content (§11.4).

### 11.8 Capability: Voice

- **FR-PAT-027.** This Volume records that no patient-facing voice interface (voice input, a voice-based check-in, a voice AI companion) exists in the codebase today. This chapter explicitly distinguishes this gap from two adjacent, already-specified capabilities that share the word "voice": **VOICE** (Chapter 7, §7.2.3 — clinician dictation intake, feeding CANVAS) and **VOICE CARE** (Chapter 7, §7.2.14 — a synthetic Day-3 outbound nurse-escalation mechanism, `channel: "synthetic_outbound"`, `telephony: false` unconditionally) — neither is, nor is intended to be read as, a patient-facing voice feature. Restates Chapter 7's own OQ-AGT-4 naming-confusion note as directly relevant here.
- **FR-PAT-028.** Any future patient-facing voice capability shall be specified as its own addition to this chapter, or a dedicated follow-on chapter, before being built, and shall carry the same HITL/disclaimer/consent requirements as every other Patient Intelligence capability in this chapter (§11.3–§11.7, §11.11) — this chapter does not pre-approve any specific patient-voice product design.

### 11.9 Capabilities with no code representation today: Gamification, Goals, Family

- **FR-PAT-029.** This Volume records that Gamification (streaks, points, badges, leaderboards, or any other engagement mechanic layered on patient activity) has no code representation of any kind in the platform today.
- **FR-PAT-030.** This Volume records that patient goal-setting and goal-progress-tracking (a patient defining a personal health target — e.g., a step count, a weight target, an HbA1c target — and the platform tracking progress toward it) has no code representation of any kind in the platform today.
- **FR-PAT-031.** This Volume records that family/caregiver access (a proxy or family-member view of, or contribution to, a patient's record, coaching journey, or medication list) has no persona definition, consent-purpose code, or any other code representation in the platform today. Chapter 3's 8-persona set (§3.2) does not include a family/caregiver role, and no `UserRole` value maps to one.
- **FR-PAT-032.** Should Gamification, Goals, or Family be commissioned as a future capability, each shall be specified as its own chapter addition or amendment — with its own Purpose/Responsibilities/Inputs/Outputs/Triggers/Acceptance Criteria, matching this Volume's depth standard — before being built, rather than bolted on as an unspecified UI feature.
- **FR-PAT-033.** A Family capability in particular shall not be designed as a simple extension of the existing single-patient consent model (Chapter 6) without a dedicated consent-and-access review — a family member's access to a patient's data raises materially different consent questions (whose consent gates it, what a minor-patient's parent may see versus what an adult patient's family member may see, revocability) than the platform's current single-patient assumption. This is Open Question OQ-PAT-4, not a decision this chapter makes.

### 11.10 Diabetes-specific patient experience

- **FR-PAT-034.** Where Chapter 8's Diabetes module is enabled for a patient, the patient companion surface shall present the Nutrition/Exercise/Behaviour diabetes-specific coaching drafts (`NUTRITION_DIABETES`, `EXERCISE_DIABETES`, `BEHAVIOUR_DIABETES`) using the same Coach capability contract (§11.3) as generic coaching — restating Chapter 8's own design note that these drafts "surface on the patient-companion coaching surface, not the clinician review queue" (`nutrition.ts`), unless a `clinicalEscalationHints` trigger fires.
- **FR-PAT-035.** Any Chapter 9 Diabetes Twin "what-if" scenario ever exposed on a patient-facing surface shall be limited to the scenario subset Chapter 9 cleared for patient self-service (weight change, nutrition macro shifts, sleep, exercise timing — Chapter 9 §9.5.1/§9.5.3/§9.5.4/§9.5.6, FR-TWIN-037) and shall never expose "start GLP-1" (§9.5.2) or "stop insulin" (§9.5.5) as a directly selectable patient option — restating FR-TWIN-024/030/037 at the Patient Intelligence layer with no relaxation.
  > **AC-PAT-035-1.** Given a patient-facing surface attempts to display a "start GLP-1" or "stop insulin" Diabetes Twin scenario as a directly selectable patient option, when the request is evaluated, then it shall be blocked — restating Chapter 9's AC-TWIN-024-1 at the patient-facing layer with no new exception introduced.
- **FR-PAT-036.** This Volume records that the Diabetes Twin patient-facing surface itself does not exist in code today (Chapter 9, §9.2/§9.3: `twin-simulation.ts` is disease-agnostic and heart-failure-flavoured, with no patient-facing UI). §11.10's requirements apply once, and if, such a surface is built; they do not imply it is available now.
- **FR-PAT-037.** Diabetes-specific patient education content (glycaemic load, meal timing, glucose-monitoring routines) shall follow the same Education capability boundary (§11.4) — general, practice-approved talking points, never an individualized diet or monitoring prescription, restating `nutrition.ts`'s own disclaimer at the patient-experience level.

### 11.11 Privacy & consent for patient-generated data

- **FR-PAT-038.** Every patient-generated data point (a self-report sample, a wearable sample, a future voice input) shall require an active, purpose-bound consent grant (Chapter 6; `lib/precision-health/consent.ts`) before it is stored or used — `coaching_wellness` for coaching-feeding lifestyle data, per the existing purpose catalogue. No Patient Intelligence capability is exempt from this requirement.
- **FR-PAT-039.** A patient's own data (coaching drafts, timeline, medication list) shall be visible to that patient only through the existing patient-URL-access check (`evaluatePatientUrlAccess`, Chapter 3 §3.6) — a patient shall never be able to view another patient's coaching drafts, timeline, or medication list.
  > **AC-PAT-039-1.** Given patient A attempts to access patient B's coaching-draft, timeline, or medication-view URL, when the platform evaluates the request, then it shall deny access — restating Chapter 3's `assertPatientCannotAccessOtherPatient` pattern at every surface named in this chapter.
- **FR-PAT-040.** This chapter restates, rather than re-decides, Chapter 3's open question on the `patient` persona's `AppRole` mapping gap (§3.7, OQ-PER-1/OQ-PER-2): today, `mapSessionRoleToAppRole` defaults any unrecognized role string to `clinical_reviewer`, which would be an incorrect default for `patient` if ever triggered. Every Patient Intelligence permission-matrix-gated capability in this chapter depends on that gap being closed correctly — a patient session must never resolve to `clinical_reviewer`-level access — before any capability in this chapter is treated as production/pilot-ready. This is restated here as a blocking precondition, not merely a Chapter 3 footnote.
- **FR-PAT-041.** A patient revoking a consent grant (e.g., for `coaching_wellness`) shall immediately stop that grant's underlying data from being used in any *future* coaching-draft generation, restating Chapter 6's consent-revocation requirement at the Patient Intelligence layer.
- **FR-PAT-042.** No patient-generated data shall be used in a Population Intelligence aggregate (Chapter 10) unless the patient's `population_analytics` consent purpose is separately, explicitly granted — restating Chapter 10's FR-POP-033 as a Patient Intelligence-side obligation, not only a Population Intelligence-side one: a patient granting `coaching_wellness` does not implicitly grant `population_analytics`.

### 11.12 Non-goals

- **NO-PAT-1.** No patient-facing surface shall ever accept a medication self-prescribe, dose-change, or stop-medication (including insulin) request — this is an absolute, non-phased prohibition restating FR-PAT-024/025 with no future-release exception.
- **NO-PAT-2.** No live wearable or device integration exists or is requested by this chapter — `wearableSampleSchema`'s `liveStream: false` remains accurate until a named future integration is built per FR-PAT-020.
- **NO-PAT-3.** No patient-facing voice interface exists, or is authorized to be built, by this chapter — restating FR-PAT-027/028.
- **NO-PAT-4.** No Gamification, Goal-tracking, or Family/caregiver-access feature is built by this chapter — restating FR-PAT-029–031 as an explicit non-goal, not a silent omission.
- **NO-PAT-5.** No coaching draft or education content is, or shall ever be presented as, clinical advice — restating `isClinicalAdvice: false` as this chapter's absolute rule.
- **NO-PAT-6.** No patient-facing Diabetes Twin scenario beyond the Chapter 9-cleared self-service subset is authorized — restating FR-PAT-035 with no relaxation.
- **NO-PAT-7.** No auto-EHR-write, auto-care-plan-write, or autonomous action results from any Patient Intelligence capability — every output in this chapter remains either a HITL-gated draft or a view-only display, restating `ehrWrite: false` platform-wide.

### 11.13 Edge cases

- **EC-PAT-1 (medication-change request via free-text coaching input).** Given a patient's free-text input to any coaching surface contains a request to change or stop a medication, then the platform shall not action it and shall route it to the "raise a concern" clinician path — restating FR-PAT-025 for the free-text case specifically, since a structured-form rejection alone would not catch this path.
- **EC-PAT-2 (coaching-draft crisis disclosure outside clinic hours).** Given a `clinicalEscalationHints` trigger fires (e.g., a crisis disclosure) outside clinic hours, then the escalation requirement (FR-PAT-010) still applies — restating Chapter 8's EC-DIAB-5 pattern — but the exact out-of-hours routing mechanism is deferred to Chapter 15 (Workflows), not resolved by this chapter (Open Question OQ-PAT-6).
- **EC-PAT-3 (patient with no linked clinical preferences).** Given a patient session has no linked onboarding clinical preferences, then `getPatientCompanionProfile()`'s own `isDemoEmptyState: true` flag shall be honestly surfaced in the UI rather than silently presenting its default/demo medications and conditions as if they were the patient's real record.
- **EC-PAT-4 (patient attempts to view another patient's data via a modified URL).** Given a patient attempts to access another patient's coaching-draft, timeline, or medication-view URL, then `evaluatePatientUrlAccess` shall deny access (Chapter 3, §3.6) — restated here as it applies specifically to every Patient Intelligence surface named in this chapter.
- **EC-PAT-5 (consent revoked mid-session).** Given a patient revokes `coaching_wellness` consent while a coaching draft generated from that consent is already displayed on screen, then no *new* coaching draft shall be generated using the revoked-consent data, though the platform is not required to retroactively scrub an already-rendered screen within the same session — restating Chapter 6's general consent-revocation handling at this capability.

### 11.14 Open questions

- **OQ-PAT-1.** Confirm the roadmap priority for building the three Missing capabilities (Gamification, Voice, Goals — Family is a distinct, higher-scrutiny case per OQ-PAT-4) relative to completing the five Partial ones (Coach personalization, Education content library, Wearables live integration, Medication adherence derivation, Lifestyle self-report submission surface). This chapter does not sequence them. **Owner:** Product Leadership.
- **OQ-PAT-2 (restates Chapter 3's OQ-PER-1/OQ-PER-2).** Confirm the fix for the `patient` persona's `AppRole` mapping gap before any capability in this chapter is treated as production/pilot-ready — restated here as a blocking precondition per FR-PAT-040. **Owner:** Engineering + Clinical Safety.
- **OQ-PAT-3.** Confirm whether personalizing coaching drafts using a patient's own modality/Chapter 8 signal data (§11.3, FR-PAT-009) is a near-term (v1) commitment, and if so, define the exact data-to-suggestion mapping with clinical lead sign-off — mirrors Chapter 8's own open questions on signal-to-language mapping. **Owner:** Clinical Lead + Product + Engineering.
- **OQ-PAT-4.** If Family/caregiver access is ever commissioned, confirm the consent model it requires — does a family member need the patient's explicit, purpose-specific consent grant, a new consent-purpose code, and/or a new persona with its own `AppRole`? This is not a simple extension of the platform's current single-patient consent model (§11.9, FR-PAT-033). **Owner:** Product Leadership + Legal/Compliance + Clinical Safety.
- **OQ-PAT-5.** Confirm whether building the patient self-report check-in submission surface (§11.5, FR-PAT-017) is a near-term roadmap commitment, given Chapter 3's persona description already assumes this task exists for the Patient persona. **Owner:** Product + Engineering.
- **OQ-PAT-6.** Confirm the exact out-of-hours escalation mechanism for a coaching-draft crisis disclosure (EC-PAT-2) — explicitly deferred to Chapter 15 (Workflows) by this chapter. **Owner:** Clinical Safety Lead + Product.
- **OQ-PAT-7.** Confirm whether a dedicated Education content library/module (§11.4, FR-PAT-013) is worth building as a first-class capability, or whether embedded coaching-draft signposting remains sufficient for the near term. **Owner:** Product + Clinical Lead.

### 11.15 Cross-references

- Chapter 1 (§1.1 BO-2) — the platform-reuse-not-parallel-system principle restated at the patient layer (FR-PAT-002).
- Chapter 3 (§3.2.7 Patient persona, §3.6 tenant/patient isolation, §3.4/§3.7 the `patient`-`AppRole`-mapping gap, OQ-PER-1/2) — the persona this chapter's every capability serves, and the access-control gap this chapter restates as a blocking precondition (FR-PAT-040).
- Chapter 4 (§4.2 Layer 7 row, `physiologicalTwin: false` honesty pattern) — the architecture-level statement this chapter takes to full requirements depth.
- Chapter 5 (§5.2.1 item-level HITL gate) — the escalation mechanics §11.3/§11.10 restate for coaching-draft crisis disclosures.
- Chapter 6 (FR-CORE-014 provenance; FR-CORE-022 ingestion-stub adapter pattern; `lib/precision-health/consent.ts` purpose-code registry, specifically `coaching_wellness`) — the consent and data-honesty model §11.11 restates.
- Chapter 7 (§7.2.3 VOICE, §7.2.14 VOICE CARE, OQ-AGT-4) — the two adjacent "voice"-named capabilities §11.8 explicitly distinguishes from a patient-facing voice feature.
- Chapter 8 (`nutrition.ts`/`exercise.ts`/`behaviour.ts` diabetes coaching drafts, FR-DIAB-042/052/057, NO-DIAB-2) — the diabetes-specific Coach content and Insulin Intelligence lock this chapter's §11.7/§11.10 restate.
- Chapter 9 (FR-TWIN-024/030/037, NO-TWIN-3, AC-TWIN-024-1) — the twin-scenario patient self-service boundary §11.10 restates with no relaxation.
- Chapter 10 (FR-POP-033) — the `population_analytics` consent-purpose requirement restated as a Patient Intelligence-side obligation (FR-PAT-042).
- `docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md` — Layer 7's "Partial, generic" status this chapter's §11.2 is grounded against.
- `lib/precision-health/coaching.ts`, `health-plan.ts`, `timeline.ts`, `modalities.ts`, `consent.ts`; `lib/patient-companion/profile.ts`; `lib/disease-modules/diabetes/nutrition.ts`, `exercise.ts`, `behaviour.ts` — every current-state claim in §11.2–§11.10 is a direct restatement of these files' actual behavior.

---

## 16. Chapter 12 — Clinical Intelligence `[DRAFTED]`

### 12.0 Purpose of this chapter

This chapter is the third of Part D (Intelligence Layers). It specifies requirements for Layer 8 — Clinical Intelligence — which Chapter 4 (§4.2) recorded as **"Partial, exists functionally (`/review`, `/cases/[id]`)"**, with FR-ARC-019 stating the platform "shall keep the existing GP review workflow as the single clinical-intelligence workspace." This chapter takes that one-line architectural statement to full functional-spec depth: it does not re-specify HORIZON, GUARDIAN, SYNTHESIS, PATHWAY, Dr.Assist, CANVAS, VOICE, BRIDGE, or SHIELD (Chapter 7 already does), the gate catalog or audit mechanics (Chapter 5 already does), or the clinician personas (Chapter 3 already does). Instead, this chapter specifies **how those already-specified pieces compose into one clinical experience** for a GP, Nurse, or Clinical Pharmacist — and states honestly, panel by panel, where that composition is already unified and where it is currently split across surfaces that do not yet talk to each other as "one workspace."

### 12.1 Purpose of the Clinical Intelligence workspace

- **FR-CLIN-001.** The platform shall define the Clinical Intelligence workspace as the composed clinician-facing surface where a clinical draft's full context — patient timeline, supporting evidence, contributing agent outputs, pending approvals, the care-plan draft, twin/what-if output, risk score, and (where relevant) a research-evaluation boundary — is available without the clinician having to reconstruct that context from memory or from a separate system.
- **FR-CLIN-002.** The Clinical Intelligence workspace shall be built entirely from the platform's existing agent-directory outputs (Chapter 7), HITL gate infrastructure (Chapter 5), and persona/access model (Chapter 3) — restating Chapter 1's platform-reuse-not-parallel-system principle (BO-2): this chapter composes existing pieces into a workspace; it does not introduce a new agent, a new gate type, or a new persona to do so.
- **FR-CLIN-003.** This Volume records that the platform today implements the vision's eight named workspace panels (Timeline, Evidence, Agents, Approvals, Care Plan, Twin, Risk, Research) as a **composed experience only for the GP persona**, and only by combining two currently-distinct surfaces (§12.2) — it is not yet one single, unified workspace shell that a GP (or any clinician) opens once and never leaves. §12.2 states this gap precisely, panel by panel, rather than asserting the vision is already delivered.
- **FR-CLIN-004.** The word "Intelligence" in this layer's name shall not be read as implying autonomous clinical decision-making — restating Chapter 1's framing (§1.7, "an intelligence layer, not an autonomous clinician") at the workspace layer: every panel in this chapter surfaces a draft, a score, or an audit trail for clinician review, never an action already taken on the clinician's behalf.

### 12.2 Workspace composition: the vision's eight panels vs. the actual build

This section states, panel by panel, what the product vision calls for and what exists in code today. It is the honesty baseline every other section in this chapter is measured against.

**Current-state finding.** The GP persona's clinical experience is delivered today across **three separate surfaces**, not one:

1. `/dashboard/gp` — a dashboard overview: patient header, the AI Review Queue (`ReviewQueue`) scoped to the selected patient, care-pathway progress, a Digital Twin panel, and a right-hand `AgentControlPanel` sidebar (SOAP editor, risk gauge, GUARDIAN alert, voice recorder, HITL actions).
2. `/dashboard/gp/patients/[id]` — a patient-detail page with a materially different, wider panel set: `ClinicalOrchestratePanel` (runs CONDUCTOR), `OracleRiskPanel` (HORIZON), a second `ReviewQueue` instance, `CarePathwayTracker`, `DigitalTwinPanel`, `ScenarioRankingPanel` (twin what-if), `CausalHypothesisPanel` (a Phase 3 "hypothesis only, not causal proof" stub), `HealthPlanDraftPanel`, `SpineOutcomesCapturePanel`, `ConnectorsIngestPanel`, `PatientTimelinePanel`, and `ConsentGrantsPanel`.
3. `/review` and `/cases/[id]` — a generic, agent-type-agnostic case-review workflow (`CaseDetail`): a draft editor, `CaseHumanReviewPanels` (the case-level human gates from Chapter 5, §5.2.2–§5.2.4), a safety-and-validation panel, a decision panel (Accept/Edit/Reject/Override with reviewer name and rationale), a field-change-history panel, and an activity timeline — plus two **separate pages**, not panels, reached by link: `/cases/[id]/evidence` and `/cases/[id]/dossier`.

None of these three surfaces embeds or links to all of the others as a single shell. A GP moves between them via top-level navigation and in-page links (e.g. the GP dashboard's "Open review queue" link to the patient page; the patient page has no link into `/cases/[id]`; `CaseDetail`'s "Back To Queue" returns to `/review`, not to `/dashboard/gp`).

| Vision panel | Status | Grounding |
|---|---|---|
| **Timeline** | **Partial** | `PatientTimelinePanel` (patient-detail page only) renders `buildPatientTimeline()`'s merged event feed (Chapter 6, FR-CORE-014-adjacent; Chapter 11 §11.5). Not present on the GP dashboard overview or in the `/cases/[id]` case workflow, which has its own separate `ActivityTimelinePanel` (audit-event history for that one case, not a patient-level longitudinal timeline). |
| **Evidence** | **Partial** | `/cases/[id]/evidence` exists as a **separate page**, not a workspace panel. `CausalHypothesisPanel` (patient-detail page) offers an explanatory "hypothesis only, not causal proof" stub, distinct from the case-workflow's evidence page. There is no single "Evidence" panel common to both surfaces. |
| **Agents** | **Partial** | `AgentControlPanel` (GP dashboard sidebar) and `ClinicalOrchestratePanel` (patient-detail page) both surface agent output, but are two different components with different scopes (item-level SOAP/risk/GUARDIAN cards vs. a full CONDUCTOR orchestration run) rather than one "Agents" panel shared across surfaces. |
| **Approvals** | **Exists** (as the item-level disposition gate) | `ReviewQueue`/`ReviewQueueItem` (Chapter 5, §5.2.1) is present, consistently, on both the GP dashboard and the patient-detail page, and `CaseDetail`'s `DecisionPanel` implements the same Accept/Edit/Reject/Override primitive for the case-workflow surface. This is the most consistently-unified panel across all three surfaces today. |
| **Care Plan** | **Partial** | `HealthPlanDraftPanel` (patient-detail page only, `health-plan.ts`'s `HealthPlanDraft`) and `CarePathwayTracker` (both GP dashboard and patient-detail page, a distinct `CarePathway` concept — see §12.7's honest distinction between the two) exist; neither appears in the `/cases/[id]` case workflow. |
| **Twin** | **Partial** | `DigitalTwinPanel` (both GP dashboard and patient-detail page) and `ScenarioRankingPanel` (patient-detail page only, the twin "what-if" ranking, Chapter 9) exist but are two different components; the case-workflow surface has neither. |
| **Risk** | **Partial** | `RiskScoreBadge` (GP dashboard header) is a compact score display; `OracleRiskPanel` (patient-detail page only) is the fuller HORIZON risk draft with HITL actions. The case-workflow surface shows risk only as embedded case-summary text, not a dedicated Risk panel. |
| **Research** | **Missing (as a workspace entry point)** | No surface in this chapter has a "Research" panel or a live navigation link into a research surface. Per `docs/RESEARCH_EVALUATION_BOUNDARY.md`, the Research boundary today is a one-directional, offline data-export pipeline (`synthetic app data → research dataset export → offline task evaluation → evidence artifact → governance review`) — explicitly **not** a live workflow connection back into any clinician-facing surface. §12.8 states this precisely. |

- **FR-CLIN-005.** This chapter's requirements for unifying these panels into one workspace (§12.3–§12.9) shall be read as specifying a target composition to build toward, not a description of an already-delivered single-shell workspace — restating this section's finding, not softening it, in every subsequent section.

### 12.3 Role-specific workspace variants

- **FR-CLIN-006.** The platform shall present a role-appropriate subset of the Clinical Intelligence workspace panels per persona (Chapter 3, §3.2), rather than one identical workspace shell for every clinical role — restating that a Nurse's and a Pharmacist's accountable scope (§3.2.2/§3.2.3) differs materially from a GP's, and their workspace shall reflect that, not merely hide GP-only buttons behind a permission check.
- **FR-CLIN-007 (GP).** The GP workspace shall be the most complete of the three role variants, combining (today, across the two surfaces named in §12.2) patient header/risk, the AI Review Queue scoped to Accept/Edit/Reject any clinical draft type, care-pathway progress, Digital Twin and scenario-ranking output, health-plan draft, patient timeline, and consent grants — restating Chapter 3's GP "Key tasks in Aksh" (§3.2.1) as this chapter's workspace-composition target.
- **FR-CLIN-008 (Nurse).** This Volume records that the Nurse workspace (`/dashboard/nurse`) is materially narrower than the GP's today: a patient header, a GUARDIAN-alerts panel, and links to three task-specific pages (`/dashboard/nurse/observations`, `/handover`, `/alerts`) — it has no Timeline, Twin, Care Plan, or Risk panel of its own. This is consistent with Chapter 3's Nurse scope (observation capture, handover, alert triage — not prescribing-adjacent or full-risk-assessment decisions) and is not, by itself, a defect; §12.11 (Open Questions) asks whether any of the missing panels (e.g. a lightweight Timeline) should be added.
- **FR-CLIN-009 (Clinical Pharmacist).** This Volume records that the Pharmacist workspace (`/dashboard/pharmacist`) is a distinct, medication-safety-scoped surface: a medication-review queue, an interaction checker, and a BNF reference page — with its own honesty banner ("Synthetic meds panel · GUARDIAN drafts · HITL Accept/Edit/Reject · SHIELD on decisions · liveEmis:false"). It has no Timeline, Twin, or general Risk panel, consistent with Chapter 3's Pharmacist scope (medication safety, not general risk/care-pathway ownership).
- **FR-CLIN-010 (Practice Manager / Admin).** The Practice Manager/Admin persona (`/dashboard/admin`) shall never be presented any of the eight clinical workspace panels in a form that implies clinical decision authority — restating Chapter 3's FR-PER-009/§3.2.4 "must not do" list at the workspace-composition level: an admin may see aggregate queue-throughput and audit-health signals, never a patient-level Approvals, Care Plan, or Twin panel with an Accept/Edit/Reject control active for them.
- **FR-CLIN-011.** Every role-specific workspace variant shall enforce panel visibility server-side (Chapter 3, FR-PER-005), not merely omit a panel from that role's client-side layout — a Nurse session requesting a GP-only endpoint directly shall be denied exactly as any other cross-role access attempt (Chapter 3, FR-PER-011).

### 12.4 Queue / inbox / case workflow requirements (HITL, Chapter 5)

**Purpose.** Give every clinical persona one place to see what is waiting for their decision, and one consistent mechanism (Chapter 5's item-level disposition gate) for making that decision, regardless of which of the three surfaces (§12.2) they are working in.

**Responsibilities.** Surface actionable (`Pending`/`Edited`) items scoped to the requesting persona and, where relevant, the selected patient; record Accept/Edit/Reject with actor/timestamp/rationale exactly per Chapter 5 §5.2.1; keep case-level gates (§5.2.2–§5.2.4) visible and blocking until resolved.

**Inputs.** The persona's session/role; an optional patient/case scope; the current `ReviewQueueItem`/case state.

**Outputs.** A sorted, filtered queue view (`sortReviewQueueItems`); a recorded disposition (learning event + SHIELD audit, dual-written per Chapter 5 §5.2.1); an updated case/gate status.

**Triggers.** A clinician opening their dashboard or a specific patient/case; a new agent draft entering the queue (Chapter 7 orchestration); a case-level gate becoming `required` (Chapter 5, §5.2.2–§5.2.4).

- **FR-CLIN-012.** The platform shall surface exactly one queue-item disposition mechanism (`accept`/`edit`/`reject`, Chapter 5 §5.2.1) across all three current surfaces (§12.2) — restating Chapter 5's FR-HITL-005/FR-ARC-022 at the workspace-composition level: the GP dashboard's `ReviewQueue`, the patient-detail page's `ReviewQueue` instance, and the case workflow's `DecisionPanel` shall all resolve to the same underlying disposition-recording path, not three independently-implemented decision mechanisms that happen to look similar.
- **FR-CLIN-013.** A queue view scoped to a specific patient (`patientId` filter) shall show only that patient's actionable items; a queue view scoped to "my queue" (no patient filter, `showAll`) shall show every actionable item assigned to or eligible for the requesting clinician's role — restating the existing `ReviewQueue` filtering behavior (`items.filter((i) => i.patientId === patientId)`) as a product requirement, not an implementation detail.
- **FR-CLIN-014.** Case-level human gates (`red_flag_escalation`, `referral_pathway`, `medication_decision` — Chapter 5, §5.2.2–§5.2.4) shall remain visible and in a blocking (`required`) state within the workspace, regardless of which of the three surfaces (§12.2) the clinician is viewing the case from — restating Chapter 5's FR-HITL-008 at the workspace layer: a gate resolved (or left open) in one surface shall reflect consistently in any other surface showing the same case.
- **FR-CLIN-015.** The workspace shall never display a case or item as "complete" or ready to export while a mandatory case-level gate remains open — restating Chapter 5's FR-HITL-003 at the workspace-composition level, applied consistently whether the clinician is viewing the case via `/dashboard/gp/patients/[id]` or `/cases/[id]`.
  > **AC-CLIN-015-1.** Given a case has an open `red_flag_escalation` gate, when a clinician views that case from either `/dashboard/gp/patients/[id]` or `/cases/[id]`, then both views shall show the gate as open and neither shall present the case as export-ready — restating Chapter 5's AC-HITL-008-1 as a cross-surface consistency requirement.

### 12.5 Diabetes clinician view requirements (once Chapter 8 is wired)

- **FR-CLIN-016.** This Volume records that, as of this chapter's drafting, no Diabetes-module signal appears in any clinical workspace panel described in this chapter — restating Chapter 4 §4.3.3 and Chapter 8 §8.3's own phasing table: every Diabetes signal builder is still a v0 typed stub returning `insufficient_data`/`null`, and `buildDiabetesRiskContribution` is not called from `lib/clinical-spine/orchestrate.ts`, `lib/agents/llm-oracle.ts`, or `lib/agents/llm-guardian.ts`. This section specifies how Diabetes signals shall appear **once wired**, not a description of current behavior.
- **FR-CLIN-017.** Once wired, Diabetes-module contributing factors shall appear within the existing `OracleRiskPanel`/HORIZON risk-draft display as additional contributing factors (per `DiabetesRiskContribution`'s HORIZON-shape output, Chapter 8), not as a separate, disease-specific risk panel — restating Chapter 4's FR-ARC-019 ("disease-module outputs surface within it... rather than as a separate per-disease review queue") at the Risk-panel level specifically.
- **FR-CLIN-018.** Once wired, Diabetes-module safety flags (Insulin/GLP-1/Complications) shall appear within the existing GUARDIAN alert/`AgentControlPanel` display alongside any other GUARDIAN flag, using the same severity bands (`red`/`amber`/`green`) — restating Chapter 8's own reuse-not-parallel principle at the Agents-panel level.
- **FR-CLIN-019.** Once wired, a Diabetes-triggered case-level gate (Insulin/GLP-1 dose-adjacent discussion, Complications referral) shall route through the existing `medication_decision` or `referral_pathway` gate (Chapter 5, §5.2.3/§5.2.4; Chapter 8's NO-DIAB-7) and shall appear in the workspace's Approvals panel identically to any non-diabetes gate of the same type — no new gate visualization is introduced for Diabetes specifically.
- **FR-CLIN-020.** Once wired, the Diabetes Twin's scenario-ranking output (Chapter 9) shall appear within the existing `ScenarioRankingPanel`, extended to carry diabetes-specific scenario labels (per Chapter 9 §9.5's seven scenarios) rather than a separate diabetes-twin UI component.
- **FR-CLIN-021.** The clinician-facing Diabetes coaching-escalation path (Chapter 11, §11.3/§11.10 — a `clinicalEscalationHints` trigger firing on a patient's coaching draft) shall surface in the clinician's Approvals/queue panel as a distinct, clearly-labeled item type, not conflated with a routine SOAP/coding draft — a clinician reviewing their queue shall be able to tell, without opening the item, that it originated from a patient coaching-surface escalation rather than a consultation.

### 12.6 Evidence & explainability display requirements

- **FR-CLIN-022.** Every agent-generated clinical draft displayed in the workspace (a HORIZON risk score, a GUARDIAN flag, a SYNTHESIS SOAP section, a PATHWAY referral) shall display its contributing/supporting evidence alongside the draft itself — restating Chapter 7's per-agent "independent evidence" requirement (`assertSharedContext`, Chapter 5's FR-HITL-032) as a display, not just a computation, requirement: evidence that exists in the orchestration result but is never shown to the clinician does not satisfy explainability.
- **FR-CLIN-023.** This Volume records that Evidence is delivered today as a **separate page** (`/cases/[id]/evidence`) within the case-review workflow, not as an in-context panel alongside the draft on the same screen, and that the patient-detail page's nearest equivalent (`CausalHypothesisPanel`) is a distinct, narrower, Phase 3 "hypothesis only" stub rather than the same Evidence concept. Unifying these into one Evidence panel available from wherever a draft is displayed is a requirement for future work (Open Question OQ-CLIN-2), not a description of current behavior.
- **FR-CLIN-024.** A causal-hypothesis output (`CausalHypothesisPanel`, `CausalAiResult`) shall always be labeled "hypothesis only, not causal proof" with equal visual prominence to the hypothesis text itself, and shall never be presented, in this or any future workspace redesign, as a validated causal explanation — restating the component's own existing disclaimer as a binding product requirement.
- **FR-CLIN-025.** A Validation Dossier (`/cases/[id]/dossier`) shall remain available as the durable, exportable evidence record for a case's full review history, distinct from the in-workspace Evidence display (§12.6) — this chapter does not request merging the Dossier into a single live panel, since its purpose (a frozen, exportable artifact) is different from Evidence's purpose (in-context explainability while reviewing).
- **FR-CLIN-026.** No evidence display shall claim a higher degree of certainty or validation than its underlying source supports — restating Chapter 1's explainability commitment (BO-5) at the display layer: a rules-based contributing-factor list, a model-confidence score, and a "hypothesis only" stub shall each be labeled according to what they actually are, never homogenized into a single undifferentiated "AI insight."

### 12.7 Care plan draft lifecycle (create → HITL → accept/edit/reject)

- **FR-CLIN-027.** The platform shall offer exactly one care-plan-draft creation path (`createHealthPlanDraft`/`buildPersonalisedHealthPlanDraft`, `health-plan.ts`) per the existing `HealthPlanDraft` contract (`prevention`, `treatment`, `medications`, `follow_up`, `coaching` sections; `status: "DRAFT"`; `hitlRequired: true`; `ehrWrite: false`; `physiologicalTwin: false`) — restating Chapter 11's FR-PAT-011 grounding at the clinician-authoring side of the same contract.
- **FR-CLIN-028.** A care-plan draft shall be creatable from any of the three triggers the existing schema already defines (`hitl_accept`, `manual_request`, `risk_state_review`) and shall record which trigger produced it, so a clinician reviewing the plan later can see whether it followed a queue-item Accept, a manual request, or a risk-state review — restating the existing `HealthPlanDraft.trigger` field as a display requirement, not merely a stored value.
- **FR-CLIN-029.** A care-plan draft shall remain in `status: "DRAFT"` until an accountable clinician (GP; Clinical Pharmacist for the medications section specifically, Chapter 3 §3.2.3) explicitly accepts, edits, or rejects it — restating Chapter 5's item-level disposition gate (§5.2.1) at the care-plan-draft level; a care-plan draft is not exempt from HITL merely because it aggregates several already-reviewed items.
- **FR-CLIN-030.** This chapter distinguishes, and requires the workspace to keep visibly distinct, two existing concepts that share visual space in today's build: a **`HealthPlanDraft`** (the personalised plan artifact, `health-plan.ts`) and a **`CarePathway`** (`CarePathwayTracker`'s tracked-progress concept, e.g. a referral or care-pathway stage sequence). These are not the same object today, and this chapter does not merge them without a named product decision (Open Question OQ-CLIN-3) — a clinician shall never be shown one where they might expect the other.
- **FR-CLIN-031.** A care-plan draft's `coaching` section shall link to, but never duplicate the content of, the corresponding Patient Intelligence coaching drafts (Chapter 11, §11.3) — restating `health-plan.ts`'s own note ("Nutrition / sleep coaching drafts available under `coaching_wellness` consent... Explicitly not clinical advice") as a workspace-composition requirement: the clinician sees a reference to the coaching content, not a second, independently-maintained copy of it.
  > **AC-CLIN-029-1.** Given a care-plan draft with `status: "DRAFT"`, when a GP views it in the workspace, then every section shall be editable and the plan shall carry an explicit Accept/Edit/Reject control — it shall never render as if already finalized or already written to a record.

### 12.8 Research handoff boundary (clinical → research)

- **FR-CLIN-032.** This Volume records that no live, in-workspace "send to research" or "open in research workspace" action exists in code today. Per `docs/RESEARCH_EVALUATION_BOUNDARY.md`, the boundary between clinical and research data is a **one-directional, offline pipeline** (`synthetic app data → research dataset export → offline task evaluation → evidence artifact → governance review`), explicitly designed to keep experimental research work out of the live clinician-facing workflow, not to connect the two as a navigable handoff.
- **FR-CLIN-033.** The Clinical Intelligence workspace shall never present a "Research" panel or action that implies a live, two-way connection to ATLAS (Clinical Research Agent) — restating Chapter 7's FR-AGT-033 (ATLAS remains `phase: 2`, `live: false`) at the workspace-composition level: this chapter does not request building a research entry point ahead of ATLAS being scoped.
- **FR-CLIN-034.** If a future research-data export is triggered from a clinical workspace action (e.g. a Practice Manager or Researcher persona requesting a cohort export, Chapter 3 §3.2.8), that action shall be logged to SHIELD exactly as any other clinical-data access is (Chapter 5, FR-HITL-014) and shall never be initiated by a clinical persona (GP/Nurse/Pharmacist) as a side effect of a routine Accept/Edit/Reject — restating the existing governed, audited export path (Chapter 3, §3.2.8) as the only sanctioned research-data path.
- **FR-CLIN-035.** This chapter does not request building a live clinical-to-research handoff UI ahead of ATLAS being scoped (Chapter 7, OQ-AGT-3) — restating Chapter 2's NS-6/NS-7 boundary at the workspace layer. The "Research" entry in the vision's eight-panel list (§12.1) is recorded as a target, not a near-term build commitment, pending that scoping decision.

### 12.9 Non-goals

- **NO-CLIN-1.** No workspace panel in this chapter replaces, mirrors, or attempts to become an EHR UI — restating Chapter 1's NO-3 at the workspace-composition level: every panel remains a draft/decision-support surface layered alongside, never instead of, the practice's actual clinical record system.
- **NO-CLIN-2.** No live write-back to EMIS, SystmOne, or any EHR occurs from any workspace panel described in this chapter — restating `liveEmis: false`/NO-4 with no workspace-specific exception; BRIDGE staging remains sim-only regardless of which of the three surfaces (§12.2) triggered it.
- **NO-CLIN-3.** No new agent, gate type, or persona is introduced by this chapter — every panel composes existing agent-directory (Chapter 7), gate-catalog (Chapter 5), and persona (Chapter 3) primitives.
- **NO-CLIN-4.** No single unified workspace shell is claimed to exist today — restating §12.2's central finding: this chapter specifies a target composition across three currently-separate surfaces, not a description of an already-delivered single workspace.
- **NO-CLIN-5.** No live, two-way research-workspace connection is built or requested by this chapter — restating FR-CLIN-032/035; the research boundary remains the offline export pipeline until ATLAS is separately scoped.
- **NO-CLIN-6.** No causal-hypothesis or explainability output is ever presented as more certain than its actual source (a rules-based list, a stub, a model score) — restating FR-CLIN-024/026 as an absolute, non-phased rule.
- **NO-CLIN-7.** No non-clinical persona (Practice Manager/Admin, ICS Lead, Hospital Executive) is ever shown an Approvals, Care Plan, or Twin panel with an active Accept/Edit/Reject control for a patient-level draft — restating Chapter 3's FR-PER-009 at the workspace-composition level.

### 12.10 Edge cases

- **EC-CLIN-1 (same case open in two surfaces at once).** Given a clinician has `/dashboard/gp/patients/[id]` and `/cases/[id]` open in two browser tabs for the same underlying case, then a disposition or gate decision recorded in one tab shall be reflected (on next load/refresh) in the other — restating Chapter 5's FR-HITL-034 concurrent-edit concern at the cross-surface level; this chapter does not claim real-time (websocket-pushed) sync exists today, only that the two surfaces must not silently diverge on refresh.
- **EC-CLIN-2 (Diabetes signal insufficient before Chapter 8 is wired).** Given the Diabetes module remains unwired (§12.5, FR-CLIN-016), when a clinician views a diabetic patient's workspace today, then no Diabetes-specific contributing factor, safety flag, or twin scenario shall silently appear as if wired — the workspace shall show only the generic HORIZON/GUARDIAN/Twin output that exists today, with no placeholder implying diabetes-specific intelligence that is not actually running.
- **EC-CLIN-3 (Nurse or Pharmacist attempts a GP-scoped action).** Given a Nurse or Pharmacist session attempts to record a disposition on a draft type outside their accountable scope (e.g. a Nurse attempting to Accept a `medication_decision` gate), then the platform shall deny the action server-side — restating Chapter 5's §5.2.1 "who may act" column and Chapter 3's FR-PER-009 at the workspace-interaction level, not merely hiding the control client-side.
- **EC-CLIN-4 (case-level gate resolved via one surface, viewed via another before refresh).** Given a GP resolves the `red_flag_escalation` gate via `/cases/[id]`, then opens the same patient via `/dashboard/gp/patients/[id]` without refreshing a stale client cache, then the platform's server-side gate status (not a client cache) shall be the source of truth presented — restating that gate state (Chapter 5) is server-authoritative, not surface-local.
- **EC-CLIN-5 (Evidence page reached from an item with no independent evidence).** Given a queue item somehow reaches the workspace without passing Chapter 5's independent-evidence check (FR-HITL-032, which should have already blocked this at orchestration time), then the Evidence page shall display an explicit "no independent evidence recorded" state rather than a blank or misleadingly-empty-but-styled-as-complete page.

### 12.11 Open questions

- **OQ-CLIN-1.** Confirm the roadmap priority and design approach for unifying the three current surfaces (§12.2: GP dashboard, patient-detail page, `/review`/`/cases/[id]`) into a single workspace shell — is this a navigation/information-architecture change only, or does it require consolidating the two parallel `ReviewQueue` instances and the two parallel Twin/Care-Plan-adjacent panel sets into one component set first? **Owner:** Product + Engineering + Design.
- **OQ-CLIN-2.** Confirm whether Evidence should become an in-context panel (available alongside any draft, on whichever surface displays it) rather than a separate page (`/cases/[id]/evidence`) reached only from the case workflow — and whether `CausalHypothesisPanel`'s Phase 3 stub should be folded into the same Evidence concept once/if causal-hypothesis output matures. **Owner:** Product + Clinical Safety Lead.
- **OQ-CLIN-3.** Confirm whether `HealthPlanDraft` and `CarePathway` (§12.7, FR-CLIN-030) should remain two distinct concepts long-term, or should be merged into one care-plan model — this affects both this chapter's Care Plan panel design and Chapter 8's Diabetes-module care-pathway integration. **Owner:** Product + Clinical Lead.
- **OQ-CLIN-4.** Confirm whether the Nurse and Pharmacist workspaces (§12.3, FR-CLIN-008/009) should gain any of the panels they currently lack (e.g. a lightweight, role-scoped Timeline for the Nurse persona) or whether their current narrower scope is the intended long-term design, not a gap. **Owner:** Product + Clinical Safety Lead.
- **OQ-CLIN-5.** Confirm the target trigger/timeline for scoping ATLAS (Chapter 7, OQ-AGT-3) as a precondition for any future clinical-to-research workspace entry point (§12.8) — this chapter does not set that date but flags the dependency explicitly. **Owner:** Product Leadership.
- **OQ-CLIN-6.** Confirm whether real-time (e.g. websocket-pushed) synchronization across the three current surfaces is required before any pilot milestone (EC-CLIN-1), or whether server-authoritative state with a refresh-to-see-latest model is acceptable for the current build's single-reviewer-per-case usage pattern (consistent with Chapter 5's OQ-HITL-4 framing of concurrency as a lower-priority hardening item today). **Owner:** Engineering + Clinical Safety Lead.
- **OQ-CLIN-7.** Confirm whether the clinician-facing Diabetes coaching-escalation item type (§12.5, FR-CLIN-021) needs a dedicated UI treatment in the Approvals panel now, or can wait until Chapter 8's v0 → v1 wiring step (Chapter 4 §4.3.3) is actually taken — building the display for an escalation type that cannot yet fire would be premature UI work. **Owner:** Product + Engineering.

### 12.12 Cross-references

- Chapter 1 (§1.7 "an intelligence layer, not an autonomous clinician", BO-2, BO-5, NO-3, NO-4) — the platform-level framing this chapter's §12.1/§12.6/§12.9 restate at the workspace layer.
- Chapter 3 (§3.2.1–§3.2.4 GP/Nurse/Pharmacist/Admin personas, §3.4 persona→surface mapping, §3.2.8 Researcher, FR-PER-005/009/011) — the personas and access rules this chapter's §12.3/§12.9/§12.10 restate rather than re-specify.
- Chapter 4 (§4.2 Layer 8 row, FR-ARC-019) — the one-line architectural statement this chapter takes to full functional-spec depth.
- Chapter 5 (§5.1–§5.2 gate catalog, §5.4 SHIELD, §5.7 continuous-learning boundary, FR-HITL-003/005/008/014/032/034, OQ-HITL-4) — the HITL mechanics this chapter's §12.4/§12.6/§12.10 compose into workspace-level requirements without redefining them.
- Chapter 7 (§7.1–§7.2 the 12-agent directory, §7.2.13 PRISM/ATLAS, FR-AGT-005/033, OQ-AGT-3) — the agent outputs this chapter's §12.2/§12.5/§12.6/§12.8 compose into workspace panels.
- Chapter 8 (§8.3 phasing, NO-DIAB-7) — the Diabetes-module wiring status this chapter's §12.5 depends on and restates as not-yet-done.
- Chapter 9 (§9.5 seven scenarios, `ScenarioRankingPanel`) — the twin what-if output this chapter's §12.5/§12.2 compose into the workspace's Twin panel.
- Chapter 11 (§11.3 Coach, FR-PAT-010/011) — the patient-facing coaching-escalation and care-plan-coaching-section content this chapter's §12.5/§12.7 restate from the clinician-facing side.
- `docs/RESEARCH_EVALUATION_BOUNDARY.md` — the offline, one-directional research pipeline this chapter's §12.8 restates as the current (and, absent a new decision, continuing) boundary.
- `/dashboard/gp`, `/dashboard/gp/patients/[id]`, `/review`, `/cases/[id]`, `/dashboard/nurse`, `/dashboard/pharmacist` — every current-state claim in §12.2/§12.3 is a direct restatement of these surfaces' actual composition.

---

## 17. Chapter 13 — Research Intelligence `[DRAFTED]`

### 13.0 Purpose of this chapter

This chapter completes Part D (Intelligence Layers). It specifies requirements for Layer 4 — Research Intelligence — which Chapter 4 (§4.2, §4.3.5) recorded as **"Partial (policy exists, pipeline does not)"**, bounded by the existing typed evaluation boundary and an ethics-gated federated-research stub "until ATLAS (Phase 2, not built) is scoped." This chapter takes that boundary to full functional-spec depth against the product vision's six Owkin-inspired capability areas (Literature Intelligence, Cohort Builder, Biomarker Discovery, Hypothesis Generator, Trial Matching, Scientific Writer) — stating, area by area, which is a real (if narrow) typed policy boundary today, which is a static display with no backing capability, and which has no code representation whatsoever. Consistent with every chapter in this Volume, naming a capability area here is not a commitment to build it; §13.9's open questions state plainly that build order and timing remain undecided.

### 13.1 Workspace boundary: Research Intelligence is separate from Clinical Intelligence

- **FR-RES-001.** The platform shall define Research Intelligence as the layer Chapter 4's nine-layer vocabulary (FR-ARC-003) already names it: bounded by the typed dataset/task/model/metric/interpretation evaluation boundary (`lib/research-evaluation-plan.ts` — this chapter corrects Chapter 4's citation of this file as living under `lib/precision-health/`; it does not) and the ethics-gated federated-research stub (`lib/precision-health/federated-research.ts`), until ATLAS (Chapter 7, §7.2.13) is separately scoped.
- **FR-RES-002.** The Research Intelligence workspace (`/dashboard/researcher`) shall remain structurally and navigationally separate from the Clinical Intelligence workspace (Chapter 12) — restating Chapter 12's FR-CLIN-032/033/035 from the research side: no clinical surface shall present a live "send to research" action, and no research surface shall present a live "open this patient's clinical record" action, for the duration this Volume is in effect.
- **FR-RES-003.** Per `docs/RESEARCH_EVALUATION_BOUNDARY.md`, the only sanctioned data path between the two workspaces shall remain the one-directional, offline pipeline (`synthetic app data → research dataset export → offline task evaluation → evidence artifact → governance review`) — this chapter does not request a two-way, real-time, or automated bridge between clinical and research data.
- **FR-RES-004.** Naming a capability area in this chapter's product vision (§13.3) shall not, by itself, be read as scheduling it — restating Chapter 2's phasing model (§2.4): a capability area described here as a future requirement remains gated on the same named-trigger discipline (an ADR update, an ATLAS scoping decision, or an explicit product commitment) as any other "Avoid now" or "Missing" capability elsewhere in this Volume.

### 13.2 Researcher persona & access model

- **FR-RES-005.** The platform shall default every research-facing surface to aggregate, de-identified access for the Researcher persona (Chapter 3, §3.2.8) — restating Chapter 3's FR-PER-007 (individual clinical-record API access denied by default to aggregate/operational personas, which includes Researcher) at the research-workspace level.
- **Honest current-state note.** The evaluation-export endpoint (`GET /api/research/evaluation`) implements its own local role-eligibility set (`RESEARCH_EVALUATION_ROLES`: `researcher`, `practice-manager`, `ics-lead`, `hospital-executive`, `operations_lead`) checked directly against the session's fine-grained role string, rather than routing through the canonical permission matrix (`lib/permission-matrix.ts`). This is a genuine, working server-side check — access is correctly denied to ineligible roles — but it is a second, route-local authorization surface that Chapter 3's FR-PER-008 ("the matrix itself must remain the single source of truth... not duplicated with different values elsewhere") did not anticipate. This chapter does not resolve which should govern going forward; it records the divergence as **OQ-RES-1** (§13.9) rather than silently treating one as authoritative.
- **FR-RES-006.** This chapter restates Chapter 3's open **OQ-PER-1**/**OQ-PER-2** (the `researcher` `AppRole` mapping gap — `mapSessionRoleToAppRole` defaults any unrecognized role to `clinical_reviewer`) as a blocking precondition for treating Research Intelligence access control as production-ready, exactly as Chapter 11 (§11.x) restated the same gap for the `patient` persona — a researcher session must never be capable of falling through to `clinical_reviewer`-level case-queue access via an unmapped-role default.
- **FR-RES-007.** Individual-level (non-aggregate) research data access shall require a recorded ethics reference before being granted (Chapter 3, §3.2.8's persona description). **Honest current-state note.** Today `dataAccessLevel` and `ethicsReference` are fields on a single static fixture object (`researcherCohortData`, hardcoded to `dataAccessLevel: "aggregate"`, `ethicsReference: null`, `ethicsApproved: false`) — there is no code path today that elevates a researcher session from aggregate to individual access based on a verified ethics reference. This restates Chapter 3's **OQ-PER-3** precisely, recorded here as **OQ-RES-2** for this chapter's own tracking.

### 13.3 Capability areas — product vision vs. actual build

Each area below follows the same structure as Chapter 7's agent entries: Purpose, Responsibilities, Inputs, Outputs, Triggers, and an honest Status line, followed by requirements — phased (buildable-next) requirements where a capability is Missing, or current-behavior requirements where something already exists.

#### 13.3.1 Literature Intelligence

**Purpose (vision).** Help a researcher discover and summarize published literature relevant to a cohort, hypothesis, or evaluation task.

**Status: Missing.** No code implements literature search, retrieval, or summarization of any kind. No external bibliographic API (PubMed or otherwise) is integrated.

- **FR-RES-008.** The platform shall not claim, display, or imply a literature-search or literature-summarization capability anywhere in the product until this capability is actually built.
- **FR-RES-009 (phased).** If built, Literature Intelligence shall query only external bibliographic APIs (e.g. PubMed) explicitly approved via a future `docs/ADR_TECH_STACK_MODERNIZATION.md` update — restating Chapter 2's NS-6 ("external research APIs" named among today's "Avoid now" components) at this capability's level; this chapter does not request that integration now, and does not assume PubMed specifically will be the chosen source without that separate decision.

#### 13.3.2 Cohort Builder

**Purpose (vision).** Let a researcher define and refine a synthetic study cohort by clinical, demographic, or risk-band criteria for evaluation or trial-matching use.

**Responsibilities (today).** Display a fixed cohort-overview summary (`researcherCohortData`: total patients in scope, anonymised cohort size, active studies, organisation name, last export date) via `ResearcherKpiRow` on `/dashboard/researcher`.

**Inputs (today).** None — the figures are a static, hand-authored fixture, not the result of any query or filter the researcher supplies.

**Outputs (today).** A read-only KPI display.

**Status: Partial.** A "Cohort Overview" *display* exists; a Cohort *Builder* (interactive filtering, criteria selection, saved cohort definitions) does not.

- **FR-RES-010.** The platform shall keep the existing cohort-overview display honestly labeled as illustrative/synthetic figures (consistent with the existing `researcher-honesty-banner` and `researcher-ethics-empty` states already present on `/dashboard/researcher`) and shall never present its static numbers as the result of a live, researcher-configurable query.
- **FR-RES-011 (phased).** If a real Cohort Builder capability is built, it shall query only the synthetic patient/population data sources already established for Population Intelligence (Chapter 10) — restating Chapter 10's existing aggregation-path boundary — rather than introducing a second, parallel patient-data store scoped to research use.
  > **AC-RES-010-1.** Given the current build, when a researcher views `/dashboard/researcher`, then the cohort figures displayed shall be the fixed values from `researcherCohortData` and no UI control shall imply the researcher can filter or redefine the cohort.

#### 13.3.3 Biomarker Discovery

**Purpose (vision).** Identify candidate biomarkers — novel or known-but-unconfirmed — correlating with an outcome of interest across a research cohort.

**Status: Missing (as a discovery engine).** The only namesake code, `lib/precision-health/biomarkers.ts`, states in its own header comment: *"Biomarker-lite — surface a few numeric fields from consented modality samples. Not a biomarker derivation engine / IntelliProve / clinical lab pipeline."* It extracts already-known fields (heart rate, steps, SpO₂, sleep hours, activity minutes, blood pressure) from a single patient's own consented wearable/lifestyle samples, for display as timeline chips (Chapter 11, §11.5) — it performs no cross-patient statistical correlation, no candidate-biomarker scoring, and no discovery of any kind.

- **FR-RES-012.** The platform shall never present `BiomarkerLite`'s output, or any future extension of the same module, as a "discovered," "identified," or "candidate" biomarker — restating the module's own code comment as a binding product non-goal (NO-RES-1), not merely an internal implementation note that a future refactor could quietly drop.
- **FR-RES-013 (phased).** A true Biomarker Discovery capability, if built, shall operate only within the offline research-evaluation boundary (§13.4) — cohort-level, synthetic, versioned datasets — and shall never run directly against live per-patient clinical data outside that boundary, consistent with Chapter 4's existing research/clinical separation (§4.3.5).

#### 13.3.4 Hypothesis Generator

**Purpose (vision).** Propose candidate research hypotheses — correlations or relationships worth formally investigating — from cohort-level research data.

**Status: Missing at the cohort/research level.** This chapter deliberately distinguishes this capability from the already-specified `CausalHypothesisPanel` (Chapter 12, §12.6, FR-CLIN-024): that component generates a single-patient, clinician-facing "hypothesis only, not causal proof" stub for a GP's bedside review, on one patient's clinical context. It is not a cohort-level research tool, was not built as one, and this chapter does not claim it can be repurposed as one without a separate design decision.

- **FR-RES-014.** The platform shall keep the clinician-facing causal-hypothesis stub (Chapter 12) and any future cohort-level Hypothesis Generator as two distinct capabilities — different audience, different evidentiary standard, different HITL posture (bedside clinician review vs. researcher cohort analysis) — and shall never merge, relabel, or cross-market one as the other.
- **FR-RES-015 (phased).** A cohort-level Hypothesis Generator, if built, shall label every output as a candidate hypothesis requiring further investigation, never a validated finding, and shall carry the same non-negotiable false-by-default honesty-field pattern already established by `ResearchEvaluationTask.productionClaimAllowed: false` (§13.4) — a generated hypothesis is not, and shall never be labeled as, a production research claim.

#### 13.3.5 Trial Matching

**Purpose (vision).** Match eligible patients to relevant clinical trials against a cohort's defined criteria.

**Status: Missing.** No code implements trial-registry lookup, eligibility matching, or any trial-related data structure.

- **FR-RES-016.** The platform shall not claim, display, or imply a trial-matching capability anywhere in the product until this capability is actually built.
- **FR-RES-017 (phased).** If built, Trial Matching shall never auto-enroll, auto-contact, or auto-recruit a patient into a trial — restating NO-RES-2 (§13.7) at this capability's level: a matched-eligibility list is, at most, a researcher-facing candidate list requiring the patient's own explicit, purpose-specific, revocable consent (Chapter 6) recorded *before* any contact is made, and requiring the patient's own clinical team (Chapter 3, GP persona), not the platform, to initiate that contact.

#### 13.3.6 Scientific Writer

**Purpose (vision).** Draft manuscript or report sections (e.g. methods, results narrative) from evaluation or cohort output, for researcher review and editing.

**Status: Missing.** No code implements any form of automated research-narrative generation.

- **FR-RES-018.** The platform shall not claim, display, or imply a scientific-writing capability anywhere in the product until this capability is actually built.
- **FR-RES-019 (phased).** If built, Scientific Writer output shall carry the same draft/HITL posture as every other AI-generated artifact in this platform — restating Chapter 5's mandatory-HITL principles (§5.1) at the research-writing layer: a researcher shall explicitly review and edit any generated narrative before any external use, and the platform shall never auto-submit a manuscript, abstract, or report to any external body (a journal, a registry, a funder) on the researcher's behalf.

### 13.4 Evaluation harness requirements (dataset / task / metric / governance)

**Purpose.** Give the Researcher (and the eligible operational personas named in §13.2's honest note) a single, typed, governed boundary for evaluating platform-derived artifacts — draft-extraction quality, safety-rule detection, and (later) reviewer-decision-support calibration — without touching real patient data or the live clinical review workflow. This is, today, the most genuinely-implemented part of this chapter.

**Responsibilities.** Define a dataset boundary and target metric per task; stage each task (`available_now` / `planned` / `not_allowed_yet`); assemble a versioned, exportable artifact; log every export to SHIELD.

**Inputs.** No real patient data. Per `getResearchEvaluationPlan()`'s `currentDatasetSources`: synthetic `ReviewCase` records, simulated patient profiles, expected benchmark outcomes, frozen evidence artifacts, and reviewer field-change history and notes.

**Outputs.** A `ResearchEvaluationArtifact` (the plan plus a summary of task counts) as a downloadable, authenticated JSON export; a SHIELD audit event per export.

**Triggers.** A Researcher (or an eligible operational persona, §13.2) requesting an export via `/dashboard/researcher/evaluation`'s "Export" action, or a direct authenticated call to `GET /api/research/evaluation`.

- **FR-RES-020.** The platform shall expose exactly one evaluation-boundary source of truth (`getResearchEvaluationPlan`/`buildResearchEvaluationArtifact`, `lib/research-evaluation-plan.ts`) — restating Chapter 4's FR-ARC-015 at the implementation-path level, with the path correction noted in §13.1.
- **FR-RES-021.** Every evaluation task shall carry an explicit `stage` (`available_now` / `planned` / `not_allowed_yet`) and a literal `productionClaimAllowed: false` field, and the platform shall never promote a task's stage without a corresponding, recorded governance decision — restating the schema's own literal field as binding, not incidental.
- **FR-RES-022.** The platform shall keep the current staging visible and exact in the researcher-facing display, not flattened into a uniform "available" list: today, exactly two tasks are `available_now` (structured draft-extraction quality; safety and missing-data detection), one is `planned` (reviewer decision-support calibration), and one is explicitly `not_allowed_yet` (clinical model training or fine-tuning).
- **FR-RES-023.** Every evaluation export shall write a SHIELD audit event recording the actor and the export filename — restating Chapter 5's FR-HITL-014 at this path specifically. **Confirmed already implemented**: `GET /api/research/evaluation` calls `persistShieldAuditEvent` on every export, not merely as a stated target.
- **FR-RES-024.** The evaluation-boundary artifact and its export shall never include real patient-identifiable data, a live-model-deployment claim, or a production clinical-AI-safety claim — restating the schema's own literal fields (`realPatientData: false`, `liveModelDeployment: false`, `productionClinicalAiClaim: false`) as binding product requirements this chapter requires stay true, not merely defaults that happen to be false today.
- **FR-RES-025.** Access to the evaluation-export endpoint shall be denied, server-side, to any session whose role is outside the platform's approved research-evaluation role set — restating Chapter 3's FR-PER-005 at this endpoint specifically, while noting (§13.2, OQ-RES-1) that today's implementation of that check is route-local rather than routed through the canonical permission matrix.

> **AC-RES-022-1.** Given the evaluation plan's four tasks, when a researcher views `/dashboard/researcher/evaluation`, then the displayed available/planned/blocked task counts shall exactly match `getResearchEvaluationPlan()`'s current staging (2 available, 1 planned, 1 blocked).
> **AC-RES-023-1.** Given an authenticated, eligible-role session, when it triggers an evaluation export, then a SHIELD audit event with `action: "export"` and the export filename shall be recorded, and the returned JSON shall include `realPatientData: false` and `productionClinicalAiClaim: false`.
> **AC-RES-025-1.** Given a session whose role is outside the approved research-evaluation role set (e.g. `gp` or `patient`), when it requests `GET /api/research/evaluation`, then the platform shall return `403 Forbidden`.

### 13.5 Federated research: ethics-gated stub, non-goals for v1

**Purpose.** Rehearse, in a fully synthetic, ethics-gated form, what a future multi-site federated research computation might look like — without building live federated-learning infrastructure.

**Responsibilities.** Require both a server-side ethics-gate environment variable and a caller-supplied ethics claim before any job can complete; return `blocked_ethics` with explanatory limitations when either is unmet; on success, return a synthetic, cohort-level cross-site aggregate — never a patient-level record.

**Inputs.** A job title; a caller-asserted `ethicsApprovedClaim` boolean (still insufficient alone — the server-side `FEDERATED_RESEARCH_ETHICS_APPROVED` environment variable must independently be set).

**Outputs.** A `FederatedResearchJob` (`status`: `queued` / `running` / `completed` / `blocked_ethics`; `patientLevelExport: false`; `syntheticAggregatesOnly: true`; a synthetic `FederatedAggregate` — cohort size, mean risk score, high-risk share, sites participating — when completed).

**Triggers.** A researcher creating a job via `/dashboard/researcher`'s `FederatedJobsPanel`, or a direct authenticated call to `POST /api/research/federated/jobs`.

- **FR-RES-026.** The platform shall require both the environment-level ethics gate and a caller-supplied ethics claim to be true before any federated job can complete — a job created with either condition unmet shall be recorded as `blocked_ethics`, never silently completed or left in an ambiguous pending state.
- **FR-RES-027.** Every federated job's aggregate output shall remain synthetic and cohort-level only (`syntheticAggregatesOnly: true`, `patientLevelExport: false`) — restating this chapter's data-minimisation posture (NO-RES-6) at the federated-research layer; this chapter does not request a patient-level federated-export capability.
- **FR-RES-028.** The platform shall never describe a federated job's output as the result of a live, multi-site federated-learning training round. Every completed job's own `limitations[]` field already states this plainly ("not a multi-site FL round on real PHI"); this chapter requires that disclosure remain in place as the feature matures, not be quietly dropped once the UI looks more polished.
- **FR-RES-029.** Federated job creation and status transitions shall be logged to SHIELD — restating Chapter 5's FR-HITL-014. **Confirmed already implemented**: `POST /api/research/federated/jobs` calls `persistShieldAuditEvent` for every job creation, whether the result is `completed` or `blocked_ethics`.
- **FR-RES-030 (non-goal for v1, stated as a requirement).** The platform shall not build, within this Volume's scope, live federated-learning training infrastructure — cross-site model-weight aggregation, secure multi-party computation, or a durable multi-site job orchestrator. The existing in-memory (`Map`), single-process job store is sufficient for the rehearsal purpose this capability serves today; replacing it is out of scope absent a named trigger (a genuine, separately governed multi-site pilot commitment).
- **FR-RES-031.** No field on any federated-research job or status object shall be settable to a value implying an automatic clinical-model update — restating Chapter 5's FR-HITL-029/`autoRetrain: false` at the federated-research layer: no federated job, however it completes, feeds model weights back into a live clinical agent without the full G-ML-1/2/3 sequence (Chapter 5, §5.7).

> **AC-RES-026-1.** Given the `FEDERATED_RESEARCH_ETHICS_APPROVED` environment variable is unset, when a researcher submits a new federated job with `ethicsApprovedClaim: true`, then the job's status shall be `blocked_ethics` and no synthetic aggregate shall be generated.
> **AC-RES-026-2.** Given the environment variable is set and the caller submits `ethicsApprovedClaim: true`, when the job is created, then its status shall be `completed` with a synthetic aggregate whose `note` field discloses it is not a live federated training round.

### 13.6 Ethics / consent / governance gates

- **FR-RES-032.** Any research use of patient-sourced data, even in aggregate or de-identified form, shall be bound by the existing `clinical_research_deidentified` consent purpose code (Chapter 6, `lib/precision-health/consent.ts`) — restating Chapter 3's FR-PER-012 (revoked consent) at the research layer: a patient whose `clinical_research_deidentified` grant is revoked shall be excluded from any subsequent research-dataset construction or evaluation-artifact generation that would otherwise include them.
- **FR-RES-033.** Individual-level (non-aggregate) research data access shall require a recorded ethics reference before being granted — restating Chapter 3's §3.2.8 Researcher persona description. §13.2's honest note (OQ-RES-2) records this as a data-fixture field today, not yet a verified, server-enforced approval workflow.
- **FR-RES-034.** Every governance-relevant research action (an evaluation export, a federated-job creation, a future individual-level data-access grant) shall be recorded to SHIELD with actor, timestamp, and the specific governance state (ethics reference present/absent, access level) at the time of the action — restating Chapter 5's FR-HITL-014/FR-HITL-017 at the research-governance layer.
- **FR-RES-035.** No research-facing surface shall claim a formal research-ethics-committee approval, an MHRA/DTAC/DCB0129-adjacent research classification, or a named Data Protection Officer sign-off unless that specific fact is true — restating Chapter 5's FR-HITL-024 and Chapter 1's NO-6 at the research layer.

### 13.7 Non-goals

- **NO-RES-1.** No output of the "biomarker-lite" helper, or any future extension of it, shall ever be presented as a clinically validated, discovered, or novel biomarker — restating FR-RES-012 as an absolute rule, not a labeling nicety subject to future relaxation.
- **NO-RES-2.** No capability in this chapter, present or future, shall auto-enroll, auto-recruit, or auto-contact a patient for a trial, study, or federated-research cohort without that patient's explicit, purpose-specific, revocable consent (Chapter 6) recorded before the action, never obtained retroactively.
- **NO-RES-3.** No federated-research job, evaluation-harness run, or future Research Intelligence capability shall trigger a model or scoring-rule update on any live clinical agent — restating Chapter 5's FR-HITL-011/FR-HITL-029 and `autoRetrain: false` with no research-specific exception.
- **NO-RES-4.** No live external research-API integration (a literature/PubMed-style API, a trial-registry API, an external biomarker database) is built or requested by this chapter — restating Chapter 2's NS-6 boundary; any future integration requires its own, separately governed ADR decision, never an assumption.
- **NO-RES-5.** No live, two-way navigational connection between the Clinical Intelligence workspace (Chapter 12) and any Research Intelligence surface is built or requested by this chapter — restating Chapter 12's FR-CLIN-032/033/035; the boundary remains the offline, one-directional export pipeline.
- **NO-RES-6.** No patient-level data ever leaves the platform via a federated-research job — `patientLevelExport: false` is treated as an absolute, non-phased rule; only synthetic, cohort-level aggregates are ever produced by this capability.
- **NO-RES-7.** No Research Intelligence capability described in this chapter — built or aspirational — shall claim ATLAS (Clinical Research Agent) is live; ATLAS remains Phase 2, `live: false` (Chapter 7, FR-AGT-033) for the duration this Volume is in effect.

### 13.8 Edge cases

- **EC-RES-1 (ethics gate flips mid-session).** Given a researcher's session begins with the federated ethics-gate environment variable unset, and it is later set (e.g. by an administrator) while the researcher's tab remains open, then a job the researcher had queued while blocked shall not silently retro-complete — restating FR-HITL-012's "no auto-resolve on external state change" pattern at the federated-research layer. **Current-state note:** the job-creation function evaluates the gate synchronously at creation time only, with no pending-job re-evaluation loop, so this edge case is naturally satisfied by the current implementation's simplicity rather than by an explicit design decision — flagged as **OQ-RES-3**.
- **EC-RES-2 (consent revoked after an artifact is already exported).** Given a patient's `clinical_research_deidentified` consent is revoked after their synthetic-derived data has already contributed to a generated evaluation artifact, then the platform shall exclude that patient from any subsequent artifact generation (FR-RES-032), but this chapter does not claim retroactive redaction of an already-downloaded artifact is possible — restating the boundary of what a revocation can and cannot undo after export, consistent with Chapter 3's AC-PER-012-1 pattern.
- **EC-RES-3 (non-eligible role attempts the export endpoint directly).** Given a session with a role outside the approved research-evaluation role set attempts `GET /api/research/evaluation` directly, bypassing the UI, then the platform shall deny the request server-side per FR-RES-025/AC-RES-025-1 — restating Chapter 3's FR-PER-005 general principle that a hidden button is not an access control.
- **EC-RES-4 (SHIELD audit write fails during a research export or federated job).** Given the SHIELD audit write for a research-evaluation export or a federated-job creation fails, then — per Chapter 5's §5.4 honest current-state gap (OQ-HITL-2) — the underlying action does not currently fail as a result, since the audit write is best-effort and does not block the response. This chapter does not claim a research-specific fix; it defers to OQ-HITL-2's resolution applying uniformly across the platform, including these two paths.
- **EC-RES-5 (a capability area is requested ahead of its precondition).** Given a stakeholder requests Trial Matching or Scientific Writer be built before ATLAS is scoped (Chapter 7, OQ-AGT-3) or before the evaluation harness (§13.4) matures beyond its current two `available_now` tasks, then this shall be treated as a scope-change request requiring the same Chapter 2 NS-6/NS-7 boundary review as any other "Avoid now" component, not as a routine feature addition to an existing dashboard.

### 13.9 Open questions

- **OQ-RES-1.** Confirm whether the research-evaluation export endpoint's ad hoc role-eligibility set (`RESEARCH_EVALUATION_ROLES`, §13.2) should be refactored to route through the canonical permission matrix (`lib/permission-matrix.ts`), consistent with Chapter 3's FR-PER-008 single-source-of-truth requirement, or whether a research-specific role set is an intentional, documented exception. **Owner:** Architecture + Engineering.
- **OQ-RES-2.** Confirm the operational meaning of "ethics reference confirmed" for individual-level research data access (restated from Chapter 3's OQ-PER-3) — specifically, what verification step, if any, is required before `dataAccessLevel` may move from `aggregate` to `individual`, given this is currently a static, non-elevatable fixture value in code. **Owner:** Clinical Safety + Compliance.
- **OQ-RES-3.** Confirm whether a queued-but-blocked federated job (EC-RES-1) should be re-evaluated automatically if the ethics gate later opens, or whether requiring explicit resubmission is the intended permanent design. **Owner:** Product + Engineering.
- **OQ-RES-4.** Confirm the priority and named trigger for building any of the six vision capability areas (§13.3) beyond their current Missing/Partial state — this chapter records them as target capability areas but, consistent with Chapter 2's phasing model, does not commit a build order or date. **Owner:** Product Leadership.
- **OQ-RES-5.** Confirm whether the existing "Cohort Overview" static display (§13.3.2) should be relabeled more conservatively (e.g. "illustrative cohort figures") ahead of any real Cohort Builder capability being built, to reduce the risk of a researcher mistaking the fixed numbers for a live, queryable count. **Owner:** Product + Design.
- **OQ-RES-6.** Confirm whether Biomarker Discovery, if and when built, should be scoped as a Research Intelligence capability (cohort-level, offline, as this chapter assumes) or as a per-patient feature belonging instead to Clinical Intelligence (Chapter 12) or Patient Intelligence (Chapter 11) — the three chapters' boundaries should not be allowed to blur once real design work starts. **Owner:** Product + Clinical Safety Lead.
- **OQ-RES-7.** Confirm that the SHIELD audit-write reliability fix tracked in Chapter 5 (OQ-HITL-2) is understood to cover the research-evaluation and federated-job paths specifically (EC-RES-4), not only the clinical review-queue paths originally described in Chapter 5. **Owner:** Clinical Safety Lead + Engineering.

### 13.10 Cross-references

- Chapter 1 (NO-4, NO-6, BO-5) — the platform-level data-minimisation, no-fake-certification, and explainability commitments this chapter's §13.6/§13.7 restate at the research layer.
- Chapter 2 (§2.4 phasing model, NS-6 external-research-APIs boundary) — the discipline this chapter's §13.1/§13.3/§13.7 apply to every named-but-unbuilt capability area.
- Chapter 3 (§3.2.8 Researcher persona, §3.7 OQ-PER-1/2/3, FR-PER-005/007/008/012) — the persona, access-mapping gap, and consent-revocation behavior this chapter's §13.2/§13.6 restate rather than re-specify.
- Chapter 4 (§4.2 Layer 4 row, §4.3.5, FR-ARC-015/026) — the one-line architectural statement this chapter takes to full functional-spec depth, with the file-path correction noted in §13.1.
- Chapter 5 (§5.4 SHIELD, §5.7 continuous-learning boundary, FR-HITL-011/012/014/017/024/029, OQ-HITL-2) — the audit, honesty-field, and no-autonomous-retraining mechanics this chapter's §13.4/§13.5/§13.6 compose into research-specific requirements.
- Chapter 6 (`lib/precision-health/consent.ts`, the `clinical_research_deidentified` purpose code) — the consent mechanism this chapter's §13.6 (FR-RES-032) restates as binding for research data use.
- Chapter 7 (§7.2.13 PRISM/ATLAS, FR-AGT-033, OQ-AGT-3) — ATLAS's Phase 2 status, which this chapter's §13.1/§13.7 (NO-RES-7) restate as the precondition for any live research-agent capability.
- Chapter 10 (Population Intelligence's existing aggregation-path boundary) — the data source a future Cohort Builder (§13.3.2, FR-RES-011) shall reuse rather than duplicate.
- Chapter 12 (§12.6 `CausalHypothesisPanel`/FR-CLIN-024, §12.8 FR-CLIN-032–035) — the clinician-facing causal-hypothesis stub this chapter's §13.3.4 explicitly distinguishes from a future cohort-level Hypothesis Generator, and the clinical/research workspace boundary this chapter's §13.1 restates from the research side.
- `docs/RESEARCH_EVALUATION_BOUNDARY.md`, `lib/research-evaluation-plan.ts`, `lib/precision-health/federated-research.ts`, `lib/precision-health/biomarkers.ts`, `app/api/research/evaluation/route.ts`, `app/api/research/federated/jobs/route.ts`, `/dashboard/researcher` — every current-state claim in §13.2–§13.5 is a direct restatement of these files' and surfaces' actual behavior.

---

## 18. Chapter 14 — Continuous Learning (Governed) `[DRAFTED]`

### 14.0 Purpose of this chapter

This chapter completes Part D (Intelligence Layers) and specifies product requirements for Layer 9 — Continuous Learning — which Chapter 4 (§4.2, FR-ARC-020) already recorded as the platform's **"most mature layer"** today. Chapter 5 (§5.7) elevated part of this loop into HITL-safety terms (FR-HITL-027–030); this chapter is that mechanism's home chapter and specifies it at full functional-spec depth: the learning-event schema, outcome capture, the evaluation harness, the G-ML-1/2/3 gate sequence, and — most importantly — the absolute, non-phased boundary between what this loop is allowed to do (record, link, evaluate, recommend) and what it must never do (retrain, silently version-bump, or write to the EHR).

The product vision frames continuous learning as a flywheel: **Patient → Data → KG → Agents → Clinician → Intervention → Outcome → Evidence → Validation → Improve Agents → Improve Twin → Improve Disease Models.** This chapter uses that language as an organizing frame, not as an existence claim for every stage. §14.1 maps each vision stage onto the actual delivered mechanism (or the absence of one) before any requirement is stated, exactly as Chapter 13 did for its own six-capability vision. The headline honest finding, stated up front: the loop from Clinician through Validation (six of the eleven vision stages) is real, tested, and durable; the three "Improve" stages are a defined, gate-checked *process* with no demonstrated release history in this build, not a working self-improvement mechanism.

### 14.1 The flywheel: vision stages mapped to delivered mechanism

| Vision stage | Actual mechanism | Status |
| --- | --- | --- |
| Patient | The patient whose synthetic or pilot-consented data may enter the loop (Chapter 3, §3.2.7). | Exists (as a data-subject concept; no real patients in this Volume's scope, NO-9). |
| Data | Modality-typed ingestion (Chapter 6, §6.4). | Partial — restated from Chapter 6/11's own honesty notes; this chapter does not re-litigate that status. |
| KG | Knowledge Graph query layer, live-or-mock (Chapter 4, FR-ARC-029). | Partial — mock fallback is honestly disclosed, not hidden. |
| Agents | CONDUCTOR-orchestrated 12-agent directory (Chapter 7). | Exists. |
| Clinician | HITL disposition — Accept/Edit/Reject/Defer (Chapter 5, §5.2). | Exists. |
| Intervention | An accepted draft staged (BRIDGE, sim-only, `liveEmis:false`) or a twin-informed care action taken. | Exists as a sim-only staging step (Chapter 6, §6.4); never a live EHR write. |
| Outcome | Append-only eventual-outcome capture (`linkLearningOutcome`, `lib/clinical-spine/outcomes-loop.ts`). | Exists. |
| Evidence | SHIELD audit trail, dual-written alongside every learning event and every outcome capture (Chapter 5, §5.4). | Exists. |
| Validation | Golden-case evaluation harness (`npm run eval:agents`) plus governed evaluation (`submitGovernedEvaluation`) reviewed against G-ML-1/2/3. | Exists as a recorder and a gate; the harness itself is an explicitly-labeled rehearsal scorecard, not a clinical validation certificate (§14.4). |
| Improve Agents | A prompt/model/config version bump for an agent (Chapter 7), manually executed by an engineer per the Governed Model Release SOP, only after all three gates are signed. | Mechanism (the gate, the recorder, the SOP checklist) exists and is unit-tested (`CP-LEARN-001`). No agent version has actually been bumped through this sequence in this build (§14.7, FR-LEARN-030). |
| Improve Twin | A twin scenario rule-weight/coefficient adjustment (Chapter 9, FR-TWIN-034), same gate sequence. | Same as above — defined, not yet exercised. |
| Improve Disease Models | A Diabetes-module v1→v2 statistical/ML model replacing a rule-based v1 signal (Chapter 8, §8.3), same gate sequence. | Not reachable yet — Chapter 8's v1 phase itself is "not started," so this stage is two undelivered phases away (§14.8, FR-LEARN-036). |

**FR-LEARN-001.** The platform shall treat the table above as the canonical mapping between the product vision's flywheel language and the delivered mechanism; any future chapter, pitch deck, or external-facing material describing this flywheel shall use this mapping rather than deriving a competing or more optimistic one.

**FR-LEARN-002.** No product copy, UI surface, or external-facing material shall describe this platform as "self-learning," "auto-improving," or any equivalent phrase implying unsupervised improvement, without the explicit governed-release qualifier (e.g. "improves only through clinician-reviewed, gate-approved updates") — restating BO-9's own wording ("never through silent or automatic retraining") as a binding constraint on language, not only on code.

**FR-LEARN-003.** The platform shall define Continuous Learning, for product purposes, as exactly the loop this chapter specifies (§14.2–§14.8) — restating NO-5, SC-4, and Chapter 4's FR-ARC-020 as this chapter's own authoritative, non-competing definition.

### 14.2 Learning event schema / append-only requirements

- **FR-LEARN-004.** The platform shall record every learning event through one shared schema (`LearningEvent`, `lib/clinical-proof/learning-loop.ts`) regardless of originating agent, disease module, or capability — restating Chapter 4's FR-ARC-020 and Chapter 7's "no per-module learning-event schema" position as this chapter's own binding requirement.
- **FR-LEARN-005.** Every learning event shall require exactly one of four decisions (`accept` | `edit` | `reject` | `defer`) at creation time — restating `assertLearningDecisionRequiresHitl`'s existing throw-on-invalid-decision behavior: a decision-less or invalidly-decisioned learning event shall be impossible to create, not merely discouraged by convention.
- **FR-LEARN-006.** Every learning event shall carry, unconditionally, four literal honesty fields: `autoRetrainTriggered:false`, `modelUpdated:false`, `ehrWrite:false`, `hitlRequired:true`. This chapter records that this guarantee is enforced not only at the application layer but at the Postgres insert itself — `FALSE, FALSE, FALSE, TRUE` are literal SQL constants in the `aksh.learning_events` insert statement, not bound parameters a caller could vary — a materially stronger guarantee than an application-level default alone, and this chapter requires that strength be preserved in any future refactor of the persistence layer.
- **FR-LEARN-007.** The platform shall never expose an `UPDATE` or `DELETE` path for a persisted learning event — restating the existing API contract ("PUT / PATCH / DELETE — Not exposed," `docs/CONTINUOUS_LEARNING.md`) as a binding product requirement, not an implementation detail a future API redesign could quietly drop.
- **FR-LEARN-008.** An eventual outcome shall always be recorded as a new, separate event carrying `linksToEventId` pointing at the originating prediction/decision event — never as a mutation of that event's fields — restating `buildLinkedOutcomeEvent`'s existing refusal to link an outcome onto an event that is already itself an outcome link.
- **FR-LEARN-009.** Every learning event shall record an optional `modelVersion` string for audit purposes, and the recording path itself shall never auto-populate or auto-increment this field — restating the loop's own design intent ("never auto-bumped by this recorder") as a product requirement.
- **FR-LEARN-010.** The platform shall persist every learning event durably in Postgres (`aksh.learning_events`) when configured, and fall back to a controlled, scope-namespaced JSON file under `data/` when it is not — restating the existing dual-storage behavior, and its containment ("never write outside `packages/platform-uk/data`"), as binding requirements rather than today's incidental implementation choice.
- **FR-LEARN-011.** Every learning-event write and every outcome-link write shall dual-write a SHIELD audit event in the same operation — restating Chapter 5's FR-HITL-014 specifically at the learning-event-recording path.

> **AC-LEARN-005-1.** Given a request to record a learning event with `decision:"maybe"` (not one of `accept`/`edit`/`reject`/`defer`), when the record is built, then the platform shall throw and no event shall be persisted.

> **AC-LEARN-008-1.** Given a learning event that is itself an outcome link (`linksToEventId` already set), when a caller attempts to link a further outcome onto it, then the platform shall reject the attempt rather than chain a link onto a link.

### 14.3 Outcome capture after HITL decisions

**Purpose.** Close the loop from a clinician's — or, for self-reported observational outcomes, a patient's — HITL decision to what actually happened, without ever mutating the decision record itself.

**Responsibilities.** Classify each care action's loop stage (`awaiting_outcome` / `outcome_linked` / `immediate_outcome` / `no_action_required`); accept an eventual-outcome capture from a named reporter role; compute two distinct, separately-reported completion ratios for operational visibility — one honestly labeled as workload, one as verified real-world outcome capture (B2, closed 6 August 2026 — see completion note below and `docs/PHASED_BUILD_PLAN.md`).

**Inputs.** `sourceEventId`; `outcomeKind` (`care_action_completed` / `care_action_deferred` / `adverse_event_none` / `adverse_event_suspected` / `follow_up_scheduled` / `unknown`); an optional outcome metric; `reporterRole` (`clinician` | `patient` | `admin`).

**Outputs.** An `OutcomesLoopStatus` (counts, open actions, recently linked outcomes, `dispositionCompleteRatio`, `realOutcomeCaptureRatio`); a `CaptureSpineOutcomeResult` per capture.

**Triggers.** `GET`/`POST /api/clinical-spine/outcomes`; a clinician confirming a follow-up, or a patient self-reporting an observational outcome tied to an earlier accepted draft.

- **FR-LEARN-012.** The platform shall classify every non-link learning event into exactly one loop stage (`awaiting_outcome`, `outcome_linked`, `immediate_outcome`, `no_action_required`) based solely on whether a linked outcome event exists and what `outcomeKind` was recorded at creation — restating `classifyCareAction`'s existing logic as a product requirement. A Reject (`outcomeKind:"care_action_deferred"`) shall classify as `no_action_required`, distinct from `immediate_outcome` — a rejected draft has nothing to follow up on, but that is a disposition, not a human reporting what actually happened to the patient, and the two shall never share a loop-stage value (B2 fix; before B2 both were folded into `immediate_outcome`, per `VOLUME_I_DRAFT_AUDIT.md`'s own finding).
- **FR-LEARN-013.** The platform shall accept an eventual-outcome capture from three named reporter roles (clinician, patient, admin) and shall record which one reported it, with a distinct audit note per role — a patient-reported outcome shall never be conflated with, or presented as, a clinician-confirmed one.
- **FR-LEARN-014.** A care action with no linked outcome and no informative `outcomeKind` shall remain visibly `awaiting_outcome` indefinitely — the platform shall never auto-close, time out, or silently default it to a completed state (restates Chapter 5's FR-HITL-012 at the outcomes layer).
- **FR-LEARN-015.** The platform shall compute and display two distinct, separately-labeled ratios, per patient or globally, as operational transparency signals, and shall never blend them into one unlabeled number on any dashboard (B2 honesty fix; restates and supersedes the pre-B2 single blended `loopCompleteRatio`):
  - **`dispositionCompleteRatio`** — every care action with any Accept/Edit/Reject disposition recorded (`loopStage !== "awaiting_outcome"`, including `no_action_required`) ÷ total actions. A workload/throughput signal — this is what the pre-B2 blended metric actually measured for Reject cases.
  - **`realOutcomeCaptureRatio`** — only `outcome_linked` plus genuinely-reported `immediate_outcome` (excludes `no_action_required` and `awaiting_outcome`) ÷ total actions. A measurement-honesty signal: how often a human actually reported what happened. This ratio is expected to start low and stay low — outcome reporting is genuinely best-effort/self-serve today — and shall never be presented as "complete," "high," or as a clinical-quality or model-performance metric on any dashboard.

> **AC-LEARN-012-1.** Given a learning event with `outcomeKind:"unknown"` and no linked outcome, when the outcomes-loop status is built, then that action's `loopStage` shall be `awaiting_outcome`.

> **AC-LEARN-012-2.** Given a learning event with `outcomeKind:"care_action_deferred"` (Reject) and no linked outcome, when the outcomes-loop status is built, then that action's `loopStage` shall be `no_action_required`, never `immediate_outcome`.

> **AC-LEARN-013-1.** Given a patient submits a self-reported eventual outcome, when the resulting event's audit note is inspected, then it shall read "Patient-reported outcome on clinical spine," distinctly from a clinician- or admin-reported one.

> **AC-LEARN-015-1.** Given a cohort containing at least one Reject-driven (`no_action_required`) closure and at least one genuinely-linked outcome, when `dispositionCompleteRatio` and `realOutcomeCaptureRatio` are compared, then `realOutcomeCaptureRatio` shall be strictly less than `dispositionCompleteRatio`.

### 14.4 Validation & evaluation before any model/prompt change

**Purpose.** Give Engineering and the Clinical Safety Lead a repeatable, non-production-impacting way to check whether an agent's behavior on fixed synthetic golden cases still meets bar, before any version-bump conversation can even start.

**Responsibilities.** Run golden-case fixtures against SYNTHESIS, GUARDIAN, and HORIZON/ORACLE via LLM (when configured) or deterministic fallback; score pass/fail per fixture; never write to any EHR; feed the resulting delta into G-ML-1's evidence requirement (§14.5).

**Inputs.** Golden-case fixtures (`lib/eval/golden-cases.ts`); an optional agent or case filter.

**Outputs.** A pass/fail scorecard per case (`lib/eval/score-agents.ts`); a non-zero CLI exit code on any failure; an API scorecard response including `ehrWrite:false` / `hitlRequired:true`.

**Triggers.** `npm run eval:agents` (CLI, CI-suitable); `POST /api/eval/agents` (authenticated).

- **FR-LEARN-016.** The platform shall run its golden-case evaluation harness against fixed, versioned synthetic fixtures — never against live patient data — for every agent this Volume names as eval-covered today (SYNTHESIS, GUARDIAN, HORIZON/ORACLE).
- **FR-LEARN-017.** The evaluation harness's output shall be labeled, on every surface that displays it, as a rehearsal scorecard — restating the harness's own documented boundary ("not a clinical validation certificate... passing local golden cases does not mean unsupervised clinical use is approved," `docs/AGENT_EVAL_HARNESS.md`) as a binding disclosure requirement, not an incidental caveat a future dashboard redesign could drop.
- **FR-LEARN-018.** A governed-evaluation submission (`submitGovernedEvaluation`) shall require a non-empty rationale and an explicit `proposedAction` (`no_change` / `schedule_human_review` / `propose_model_update`) — restating `assertGovernedEvaluationAllowed`'s existing validation: an evaluation with no stated rationale shall be rejected outright, regardless of proposed action.
- **FR-LEARN-019.** Every governed-evaluation submission, whatever its outcome, shall itself be recorded as a further learning event (`agentLabel:"GOVERNED_EVAL"`) and a SHIELD audit event — restating the existing dual-recording behavior, so the evaluation process is itself as auditable as the clinical decisions it reviews.
- **FR-LEARN-020.** Reviewing a batch of linked learning-event outcomes shall be a required input to any governed evaluation (`learningEventIdsReviewed`), and the platform shall record which specific events were considered. An evaluation that cites zero reviewed events, while not currently blocked by the schema, shall be flagged for Clinical Safety Lead scrutiny at review time (Open Question OQ-LEARN-3) rather than silently accepted as sufficiently evidenced.

### 14.5 G-ML release gate catalog

| Gate | Authority | Evidence required | Pass criteria |
| --- | --- | --- | --- |
| **G-ML-1** | Engineering lead | Diff of model/prompt/config + eval-harness delta (§14.4) | `npm run eval:agents` meets golden thresholds; no HITL/EHR invariant regression |
| **G-ML-2** | Clinical Safety Officer | Hazard log delta + residual risk note (`docs/HAZARD_LOG_TEMPLATE.md`, hazards H-011/H-012) | New/changed hazards linked to test IDs; unsigned hazards explicitly called out, not hidden |
| **G-ML-3** | Release authority / pilot sponsor | Gate 2 checklist slice + named rollback owner | Explicit written approval of the exact version string to promote |

- **FR-LEARN-021.** The platform shall block any `propose_model_update` action unless all three gates (G-ML-1, G-ML-2, G-ML-3) carry an explicit `signed:true` record — restating Chapter 5's FR-HITL-028 and `allGovernedGatesSigned` as this chapter's own home-chapter requirement.
- **FR-LEARN-022.** An evaluation submitted with `proposedAction:"propose_model_update"` and fewer than three signed gates shall be rejected with an explicit `blockedReason` naming which gate(s) are missing — restating `assertGovernedEvaluationAllowed`'s literal returned message — never a generic "not allowed" with no actionable detail.
- **FR-LEARN-023.** This chapter restates, as its own honest current-state finding, that hazards **H-011** ("Silent model update / auto-retrain") and **H-012** ("Learning without HITL decision") in the hazard log remain **Unsigned** as of this Volume's drafting, with H-011's residual risk explicitly recorded as "Medium until CSO release process." This chapter does not claim these hazards are closed; closing them is a Clinical Safety Lead action outside this Volume's authority (Open Question OQ-LEARN-4).
- **FR-LEARN-024.** A fully-signed G-ML-1/2/3 evaluation (`status:"approved_for_manual_release"`) shall record approval **for manual release only** — it shall never itself perform, trigger, or schedule the version bump. A human operator shall separately and manually execute the release per the Governed Model Release SOP's checklist (target version recorded, learning-event sample reviewed, `test:clinical-proof` green, eval report attached, hazard log updated, rollback documented, signatures stored) — restating the recorder's own returned message ("still requires ops to bump version... outside of this loop entirely") as a binding, two-step design: gate approval and release execution are always two separate human actions, never one.

> **AC-LEARN-021-1.** Given a governed evaluation with `proposedAction:"propose_model_update"` and only G-ML-1 and G-ML-2 signed, when it is submitted, then the platform shall return `accepted:false` with a `blockedReason` naming G-ML-3 as missing, and no `approved_for_manual_release` record shall be created (restates AC-HITL-028-1 as this chapter's own AC).

> **AC-LEARN-024-1.** Given a governed evaluation reaches `status:"approved_for_manual_release"`, when the evaluation record is inspected immediately afterward, then no model version, prompt version, or feature-flag value anywhere in the platform shall have changed as a side effect of that record being created.

### 14.6 Forever-false until gates pass: `autoRetrain`, silent model swap

- **FR-LEARN-025.** `autoRetrainTriggered` and `modelUpdated` shall be literal `false` on every learning event, outcomes-loop status object, and governed-evaluation record, unconditionally — restating Chapter 5's FR-HITL-029 as this chapter's own binding requirement: no proposed action, no gate-signing state, and no volume of accumulated outcomes shall ever cause either field to read `true` anywhere in the reviewed code paths.
- **FR-LEARN-026.** The platform shall keep no code path — in the outcomes loop, the governed-evaluation recorder, or any future extension of either — capable of setting `autoRetrainTriggered` or `modelUpdated` to `true`. This is an architectural absence, not merely a default value a future change could flip; introducing such a path would itself require a new, separately-governed product decision revising this chapter, not a routine code change.
- **FR-LEARN-027.** The platform shall never bump a model, prompt, or feature-flag version in a production environment as a silent side effect of deployment or environment-variable configuration — restating Chapter 7's NO-AGT-5 at the release layer: every version change traces to a specific, dated, human-signed G-ML-1/2/3 record.
- **FR-LEARN-028.** `test:clinical-proof`'s `CP-LEARN-001` case (asserting `autoRetrainTriggered` is always false) shall remain part of the platform's release-readiness checklist for the duration this Volume is in effect — this chapter does not request removing or weakening that check.

### 14.7 What may improve — and only via governed release

- **FR-LEARN-029.** The platform shall permit exactly three categories of "improvement" to result from this loop, and no others: (a) an agent's prompt/model/config version (Chapter 7); (b) a twin's scenario rule-weights/coefficients (Chapter 9, FR-TWIN-034); (c) a disease module's v1→v2 statistical/ML model replacing a rule-based signal (Chapter 8, §8.3's v2 phase). Every one of the three requires the full G-ML-1/2/3 sequence (§14.5) with no category-specific shortcut.
- **FR-LEARN-030.** This chapter records, honestly, that as of this Volume's drafting no agent version, twin rule-weight, or disease-module model has actually been bumped through this gate sequence in this build. The mechanism — the gate, the recorder, the SOP checklist — exists and is unit-tested; this chapter does not claim a demonstrated production release history, only a defined, ready process (restates the §14.1 table's finding).
- **FR-LEARN-031.** A twin rule-weight or coefficient adjustment (Chapter 9, FR-TWIN-034) shall be gated identically to an agent prompt/model change — this chapter does not create a lighter-weight path for twin content on the theory that it is "just numbers," since a twin's benefit/risk/confidence weights shape a clinician-facing recommendation exactly as a prompt does.
- **FR-LEARN-032.** A disease-module v1→v2 model swap (Chapter 8) shall additionally satisfy Chapter 8's own module-boundary requirements (a disease module produces typed data through existing agent-platform mechanisms, never its own model call or its own gating) before G-ML-1/2/3 is even reached — this chapter's gate sequence governs the *change*, not a bypass of the module-boundary rules governing where the change may live.

### 14.8 Diabetes module learning path

- **FR-LEARN-033.** Once the Diabetes module is wired (Chapter 4, §4.3.3; Chapter 8, §8.3's v0→v1 step), its outcomes shall route through this chapter's single continuous-learning loop with no diabetes-specific learning-event schema, no diabetes-specific outcome-capture endpoint, and no diabetes-specific governed-evaluation path — restating Chapter 4's FR-ARC-020 and Chapter 8's "no diabetes-specific exception" statement as this chapter's own binding requirement.
- **FR-LEARN-034.** A Diabetes-module-informed twin scenario's real-world outcome (Chapter 9, FR-TWIN-033) shall be tagged, in its learning event, with the specific scenario that informed the clinical decision — restated from this chapter's side: the tag is what allows a future governed evaluation to attribute an outcome to a specific rule-weight rather than to the loop in general.
- **FR-LEARN-035.** Chapter 8's v1→v2 phase statement ("any statistical/ML model replacing a v1 rule ships only behind the full G-ML-1/2/3 gate sequence") is restated here as this chapter's own requirement, not merely Chapter 8's — this chapter is the authoritative source for what "the full G-ML-1/2/3 gate sequence" requires in practice (§14.5), and Chapter 8 defers to it rather than defining a competing version.
- **FR-LEARN-036.** This chapter records, honestly, that the Diabetes module's v1 (rule-based, wired) phase does not yet exist (Chapter 8, §8.3: "not started" as of this Volume's drafting) — meaning the v2 governed-model-swap path this section describes is, today, two undelivered phases away, not an imminent next step.

### 14.9 Non-goals

- **NO-LEARN-1.** No code path anywhere in the continuous-learning loop shall be capable of setting `autoRetrainTriggered` or `modelUpdated` to `true` — restating FR-LEARN-025/026 as an absolute, non-phased rule; this is this chapter's single most important guarantee.
- **NO-LEARN-2.** No learning event, once persisted, shall ever be updated or deleted — restating FR-LEARN-007. A correction is a new, append-only event, never an edit to history.
- **NO-LEARN-3.** No governed-evaluation approval, however fully signed, shall itself execute a release — restating FR-LEARN-024. Gate-signing and release execution remain two separate human actions.
- **NO-LEARN-4.** No disease module, agent, or future platform capability shall introduce its own learning-event schema, outcome-capture endpoint, or governed-evaluation path — restating FR-LEARN-033 and Chapter 4's FR-ARC-020 at this chapter's own authority.
- **NO-LEARN-5.** No marketing, product, or in-app copy shall describe this platform as "self-learning," "auto-improving," or an equivalent phrase implying unsupervised improvement — restating FR-LEARN-002 as a constraint on language, not only on code.
- **NO-LEARN-6.** No eval-harness pass result shall be presented, on any surface, as a clinical validation certificate or a substitute for the G-ML-1/2/3 sequence — restating FR-LEARN-017.
- **NO-LEARN-7.** No twin rule-weight change or disease-module model swap shall bypass the module-boundary and gate requirements a routine agent-prompt change would otherwise satisfy — restating FR-LEARN-031/032; nothing in this chapter creates a faster path for "just a number" changes.

### 14.10 Edge cases

- **EC-LEARN-1 (a second outcome reported for an event that already has one linked).** Given a source learning event already has one linked eventual-outcome event, when a second eventual-outcome capture is submitted against the same source, then the platform shall append a second, independent linked-outcome event rather than overwrite or merge with the first — restating the append-only guarantee (FR-LEARN-008) even for multiple, potentially conflicting, reports about the same care action. Reconciling multiple outcome reports for the same action is a reviewer judgment (Open Question OQ-LEARN-1), not something the recorder resolves automatically.
- **EC-LEARN-2 (governed evaluation reviews an event outside the submitter's tenant scope).** Given a governed evaluation's `learningEventIdsReviewed` includes an event id the submitting actor's tenant scope should not have access to, then the platform shall deny or scope the submission consistent with Chapter 3's tenant-isolation requirements (FR-PER-006). This chapter does not claim this cross-tenant check is implemented in `submitGovernedEvaluation` today (current-state note; Open Question OQ-LEARN-2).
- **EC-LEARN-3 (Postgres unavailable during a learning-event write).** Given `DATABASE_URL` is not configured or Postgres is unreachable at write time, then the platform shall fall back to the controlled JSON file store under `data/` rather than failing the underlying clinical Accept/Edit/Reject/Defer action the learning event was recording — restating the existing dual-storage fallback (FR-LEARN-010) as a fail-safe requirement, not merely a convenience.
- **EC-LEARN-4 (SHIELD dual-write fails during a learning-event or governed-evaluation write).** Given the SHIELD audit dual-write for a learning event or governed evaluation fails, then — per Chapter 5's honest current-state gap (OQ-HITL-2) — the underlying learning-event/evaluation write does not currently fail as a result. This chapter does not claim a continuous-learning-specific fix and defers to OQ-HITL-2's platform-wide resolution applying to these paths as well (Open Question OQ-LEARN-6).
- **EC-LEARN-5 (a stakeholder requests an "emergency" model update outside the gate sequence).** Given a stakeholder — including a senior clinical or engineering leader — requests a model or prompt change be released without all three G-ML gates signed, citing urgency, then the platform's process shall have no expedited or emergency-override path — restating FR-LEARN-021's blocking behavior as absolute even under time pressure. An urgent clinical-safety concern is addressed by other means (e.g. disabling the affected agent or feature flag entirely — a rollback action already covered by the SOP's rollback-plan requirement) rather than by bypassing the gate sequence.

### 14.11 Open questions

- **OQ-LEARN-1.** Confirm the intended reviewer workflow when multiple, potentially conflicting eventual-outcome reports are linked to the same source learning event (EC-LEARN-1) — does a governed-evaluation reviewer need explicit tooling to reconcile these, or is this deferred until outcome-capture volume makes it a practical problem? **Owner:** Product + Clinical Safety Lead.
- **OQ-LEARN-2.** Confirm whether `submitGovernedEvaluation`'s `learningEventIdsReviewed` input is, or needs to be, checked against the submitting actor's tenant scope (EC-LEARN-2) before this chapter can claim the governed-evaluation path is fully consistent with Chapter 3's tenant-isolation requirements. **Owner:** Engineering + Clinical Safety Lead.
- **OQ-LEARN-3.** Confirm whether a governed evaluation submitted with zero reviewed learning events (§14.4, FR-LEARN-020) should be a hard validation error rather than merely flagged for reviewer scrutiny, given an evaluation with no cited evidence base is a weak basis for any proposed action, including `schedule_human_review`. **Owner:** Clinical Safety Lead.
- **OQ-LEARN-4.** Confirm the target date and owner for resolving hazards H-011 and H-012's "Unsigned" status (§14.5, FR-LEARN-023) — this chapter restates their current state but, consistent with this Volume's scope, does not itself have the authority to sign a hazard. **Owner:** Clinical Safety Lead.
- **OQ-LEARN-5.** Confirm whether `docs/GOVERNED_MODEL_RELEASE_SOP.md`'s G-ML-1/2/3 sequence, written with predictive/classification agent changes in mind, needs a documented addendum for twin rule-weight changes and disease-module v1→v2 swaps specifically (§14.7) — restated and generalized from Chapter 9's OQ-TWIN-3 beyond the twin case alone. **Owner:** Clinical Safety Lead + ML Governance.
- **OQ-LEARN-6.** Confirm that the SHIELD audit-write reliability fix tracked in Chapter 5 (OQ-HITL-2) is understood to cover the learning-event and governed-evaluation dual-write paths specifically (EC-LEARN-4). **Owner:** Clinical Safety Lead + Engineering.
- **OQ-LEARN-7.** Confirm whether the admin learning dashboard (`/dashboard/admin/learning`) should ever surface governed-evaluation records and gate-signing status directly to a Practice Manager/Admin persona, or whether that view should remain restricted to Clinical Safety Lead/Engineering roles outside the application entirely — gate-signing is a governance action, not a clinical Accept/Edit/Reject, so Chapter 3's FR-PER-009 bar on non-clinical personas making clinical decisions may not directly apply, but this chapter does not assume it clearly does not. **Owner:** Product + Clinical Safety Lead.

### 14.12 Cross-references

- Chapter 1 (§1.3 BO-9, §1.4 NO-5, §1.5 SC-4) — the platform-level commitments this chapter takes to full functional-spec depth.
- Chapter 3 (§3.3 Clinical Safety Lead stakeholder, FR-PER-006 tenant isolation, FR-PER-009) — the stakeholder who owns gate sign-off and the isolation/role-boundary rules §14.10/§14.11 depend on.
- Chapter 4 (§4.2 Layer 9 "Exists," §4.5 six-stage data flow, FR-ARC-020/030) — the platform-level flow this chapter elaborates to full depth; this chapter's §14.1–§14.8 are that flow's stages 5–6 (Outcome capture, Continuous learning) at requirement depth.
- Chapter 5 (§5.4 SHIELD, §5.7 continuous-learning safety boundary, FR-HITL-011/012/014/027–030, OQ-HITL-2) — the HITL-safety framing this chapter is the home chapter for; §5.7's FR-HITL-027–030 are restated here as this chapter's own FR-LEARN-006/021/025.
- Chapter 7 (NO-AGT-5) — the per-agent restatement of the governed-release gate this chapter defines once, authoritatively.
- Chapter 8 (§8.3 v0/v1/v2 phasing table) — the Diabetes-module model-swap path this chapter's §14.8 governs.
- Chapter 9 (§9.8 FR-TWIN-033/034/035, OQ-TWIN-3) — the twin-specific restatement of this chapter's gate sequence, and the ML-governance-addendum question §14.11 generalizes.
- Chapter 13 (§13.5 federated-research non-retrain restatement) — a further capability area this chapter's absolute rule (NO-LEARN-1) already covers without needing a chapter-13-specific carve-out.
- `docs/CONTINUOUS_LEARNING.md`, `docs/GOVERNED_MODEL_RELEASE_SOP.md`, `docs/AGENT_EVAL_HARNESS.md`, `docs/HAZARD_LOG_TEMPLATE.md` (hazards H-011/H-012) — the source documents this chapter elevates into product-requirement form without altering their mechanics.
- `lib/clinical-proof/learning-loop.ts`, `lib/repositories/learning-event-repository.ts`, `lib/clinical-spine/outcomes-loop.ts`, `lib/repositories/governed-evaluation-repository.ts`, `lib/eval/golden-cases.ts`, `lib/eval/score-agents.ts` — every current-state claim in this chapter is a direct restatement of these files' actual behavior.

---

## 19. Chapter 15 — Workflows & User Journeys `[DRAFTED]`

### 15.0 Purpose of this chapter

Chapters 1–14 specified the platform layer by layer: who the actors are (Chapter 3), what safety gate stands where (Chapter 5), what each agent and disease signal does in isolation (Chapters 4, 6–9), and what each intelligence layer's honest build state is today (Chapters 10–14). This chapter does not re-derive any of that. It threads eight concrete, end-to-end journeys **through** those already-specified pieces, as numbered step sequences with the persona, triggering event, responsible system/agent, and gate named at each step — so that a reader (or Cursor, per §0.3) can see the whole path a piece of clinical signal or a human decision travels, not just the layer it passes through.

This chapter opens Part E (Experience & Workflows). It is written, per the Table of Contents' own sizing note (§1), as one of the longer chapters in the Volume, because a journey is only useful at implementation depth if every step names its actor, its system, and — where clinical — its gate, rather than gesturing at the layer chapters in general terms.

**What this chapter is not.** It is not a UI wireframe spec (Chapter 18, `[DRAFTED]`) and it is not a business-rule catalogue (Chapter 16, `[DRAFTED]`) — a journey here names *which* rule or gate applies at a step and cross-references the chapter that defines it in full; it does not restate the rule's own Given/When/Then in duplicate. It is also not a claim that every journey is fully wired end-to-end today: per this Volume's standing honesty discipline (§0.1, SC-7), each journey states plainly, step by step, which segments are supported by an existing, linked UI/API path today and which segments describe a target sequence for future work.

### 15.1 Journey notation (binding for §15.2–§15.9)

Every journey in this chapter uses the same fixed structure so that a partial re-read of one journey does not require re-deriving the notation:

- **Journey ID.** `FLOW-JRN-<n>`, stable once assigned (restates §0.6's non-renumbering rule).
- **Actors.** The Chapter 3 persona(s) and/or platform agent(s) (Chapter 7) involved, by name only — not re-defined.
- **Preconditions.** What must already be true (consent granted, a session/role, an existing case) before step 1 can occur.
- **Steps.** A numbered table: **Step | Actor | Action | System / Agent | Gate or check**. A step with no gate leaves that column blank — this chapter does not manufacture a gate where none of Chapters 5/7/8/9/10/11/12/13/14 name one.
- **Decisions.** The branch points where the journey's continuation depends on a human or system decision (e.g. Accept vs. Reject vs. Defer), stated separately from the linear step table because a decision, not a step, is where the journey's outcome diverges.
- **Exceptions.** Named failure/edge conditions specific to this journey, cross-referenced to the owning chapter's `EC-*` where one already exists, or newly stated here (`EC-FLOW-*`, §15.11) where this journey is the first to surface it.
- **Acceptance Criteria.** `Given/When/Then` blocks, `AC-FLOW-<n>`, stating the one or two most safety- or honesty-critical assertions about the journey as a whole — not a restatement of every step's own AC (each step's home chapter already carries that).
- **Current-state honesty label.** One of **[LIVE]** (every step has an existing, linked UI/API path today), **[PARTIAL]** (some steps are live, some are specified-but-not-wired), or **[FUTURE]** (the journey describes a target sequence with little or no live wiring today) — restating this Volume's own status-honesty discipline (§0.5, SC-7) at journey granularity, distinct from any single chapter's DRAFTED/TODO status.
- **Related FR IDs.** The specific requirement IDs from other chapters this journey's steps pass through, listed once at the end rather than re-cited at every step.

- **FR-FLOW-001.** Every journey in this chapter shall carry an explicit current-state honesty label (§15.1) at the journey level, in addition to whatever step-level honesty fields (`ehrWrite`, `hitlRequired`, `liveEmis`, `autoRetrain`, `physiologicalTwin`) the underlying systems already emit per Chapter 5 §5.4/§5.6 — a journey composed entirely of individually-honest steps can still misleadingly read as "fully live" if the composition itself is not labeled.
- **FR-FLOW-002.** No journey in this chapter shall introduce a new persona, agent, gate type, or consent purpose code not already named in Chapters 3, 5, 6, or 7 — restating this Volume's standing "compose, do not invent" discipline (e.g. Chapter 12's NO-CLIN-3, Chapter 10's NO-POP-6) at the workflow layer. A journey that appears to need a new primitive records that as an open question (§15.13) rather than inventing it here.
- **FR-FLOW-003.** Where a journey's steps span more than one of the three clinical surfaces Chapter 12 §12.2 found (`/dashboard/gp`, `/dashboard/gp/patients/[id]`, `/review`/`/cases/[id]`), this chapter shall name each surface transition explicitly as its own step, not elide it into a single "clinician reviews" step — restating Chapter 12's own finding that these are not-yet-unified surfaces as a fact this chapter's journeys must not paper over.

### 15.2 Journey 1 (`FLOW-JRN-1`) — Clinician encounter → CONDUCTOR → review → Accept/Edit/Reject → learning

**Current-state honesty label: [LIVE].** This is the platform's most-built journey — the six-stage product-level data flow (Chapter 4, §4.5) at full step depth, for the general (non-diabetes) clinical-intake case.

**Actors.** GP (primary; Chapter 3 §3.2.1); CONDUCTOR (orchestrator, Chapter 7 §7.1); SYNTHESIS, GUARDIAN, HORIZON, NEXUS (+ optional Dr.Assist) (Chapter 7 §7.2); SHIELD (audit, Chapter 5 §5.4).

**Preconditions.** An authenticated GP session (Chapter 3, FR-PER-004); a consultation encounter (transcript, or CANVAS-generated structured intake) with an associated patient the GP's tenant scope covers (FR-PER-006).

**Steps.**

| Step | Actor | Action | System / Agent | Gate / check |
| --- | --- | --- | --- | --- |
| 1 | GP | Conducts or dictates a consultation | VOICE (dictation) → CANVAS (structured intake generation) | — |
| 2 | CANVAS | Builds a `SharedPatientContext` (patientId, label, proposed drug, transcript, flags) with a `GenerationTraceItem` on every inferred field | CANVAS (Chapter 7, FR-AGT-015) | — |
| 3 | CONDUCTOR | Runs SYNTHESIS, GUARDIAN, HORIZON, NEXUS (+ Dr.Assist if coding-relevant) against the context, enforcing per-agent and overall timeouts | CONDUCTOR (Chapter 7, §7.1) | — |
| 4 | CONDUCTOR | Resolves queue priority, review order, and safety route across the returned drafts; emits exactly one SHIELD audit event for the run | CONDUCTOR → SHIELD | Honesty-field set attached (`ehrWrite:false`, `hitlRequired:true`, `physiologicalTwin:false`, `autoRetrain:false`, `liveEmis:false` — FR-AGT-011) |
| 5 | GP | Opens the case from the review queue (`/dashboard/gp` or `/cases/[id]`) | Clinical Intelligence workspace (Chapter 12, §12.2) | — |
| 6 | GP | Reviews each item (SOAP draft, coding suggestion, interaction/allergy flag, risk contribution, correlation note) against its cited evidence | Evidence panel (Chapter 12, §12.4) | Item-level disposition gate (Chapter 5, §5.2.1) applies to every item |
| 7 | GP | Records Accept / Edit / Reject / Defer (with reason where relevant) on each item | Decision panel (Chapter 12) | Item-level disposition gate cleared per item |
| 8 | GP | Confirms or marks-not-applicable any case-level gate the drafts triggered (`red_flag_escalation`, `referral_pathway`, `medication_decision`) — detailed in Journey 2 (§15.3) | Human-gate panel (Chapter 5, §5.2.2–5.2.4) | Case-level gate(s) |
| 9 | Platform | Records a learning event for the disposition (`recordLearningEvent`), dual-written to SHIELD | `lib/clinical-proof/learning-loop.ts` (Chapter 14, §14.2) | — |
| 10 | Platform | If the accepted item is care-plan-eligible, offers a health-plan draft (`createHealthPlanDraft`) | `health-plan.ts` (Chapter 12, §12.7) | Item-level disposition gate applies again to the offered plan (it is its own draft, not auto-finalized) |
| 11 | BRIDGE | May stage the accepted content, sim-only | BRIDGE (Chapter 7, §7.2.11) | `liveEmis:false` unconditionally |
| 12 | Platform | Eventually links a real-world outcome to the learning event, feeding the governed-evaluation loop | `lib/clinical-proof/outcomes-loop.ts` (Chapter 14, §14.3–14.5) | G-ML-1/2/3 (only reached on a much longer horizon, not part of this single-encounter journey) |

**Decisions.** At Step 7, each item independently branches Accept / Edit / Reject / Defer — this journey does not require a uniform disposition across all items in one case; a GP may Accept a SOAP draft while Rejecting a coding suggestion in the same review pass (Chapter 5, §5.2.1).

**Exceptions.** An agent timeout or failure at Step 3 does not block the others' results from reaching the queue (Chapter 7's per-agent timeout isolation); a SHIELD dual-write failure at Step 4/9 is Chapter 5's known current-state gap (OQ-HITL-2) and is not solved by this journey.

> **AC-FLOW-001-1.** Given a GP completes Step 7 (records a disposition) on every item in a case but a required case-level gate (Step 8) remains open, when the GP attempts to export or mark the case complete, then the platform shall block the action and surface the open gate — restating Chapter 5's AC-HITL-008-1 at the whole-journey level: item-level completion never substitutes for case-level gate clearance.

> **AC-FLOW-001-2.** Given Step 4's SHIELD audit event and Step 9's learning event both exist for the same case, when either is inspected, then both shall carry the identical honesty-field set (`ehrWrite:false`, `autoRetrain:false`, `liveEmis:false`), restating Chapter 5's FR-HITL-006 as a cross-step consistency requirement — a journey step never silently drops or overrides an honesty field a prior step already set.

**Related FR IDs.** FR-AGT-011/015/022; FR-HITL-002/005/006/008; FR-CLIN-007/027–031; FR-LEARN-001–008.

### 15.3 Journey 2 (`FLOW-JRN-2`) — Clinician clears a `HumanGateId` (red_flag_escalation, referral_pathway, medication_decision)

**Current-state honesty label: [LIVE]** for the gate mechanics themselves (Chapter 5); **[PARTIAL]** for the out-of-hours routing sub-step (Step 5 below), which this journey specifies as the resolution this chapter was twice asked to provide (Chapter 8's EC-DIAB-5; Chapter 11's OQ-PAT-6).

**Actors.** GP (primary for `red_flag_escalation`/`referral_pathway`); Clinical Pharmacist (primary for `medication_decision`, GP co-accountable); Nurse (may raise/observe, never the confirming actor on a case-level gate, Chapter 3 §3.2.2).

**Preconditions.** A case exists with at least one case-level gate at `required` status, per `deriveHumanGates` (Chapter 5, §5.2).

**Steps.**

| Step | Actor | Action | System / Agent | Gate / check |
| --- | --- | --- | --- | --- |
| 1 | CONDUCTOR | Derives which case-level gate(s) apply from the case's drafts (a GUARDIAN allergy/DDI flag → `medication_decision`; a Complications/GLP-1 referral trigger → `referral_pathway`; a safety-critical flag → `red_flag_escalation`) | `deriveHumanGates` (Chapter 5, §5.2.2–5.2.4) | Gate status set to `required` |
| 2 | Clinician | Opens the case and sees the open gate(s) surfaced in a blocking, `required` state, consistently across whichever of the three surfaces (Chapter 12 §12.2) they use | Human-gate panel | FR-CLIN-014/015 cross-surface consistency |
| 3 | Accountable clinician | Reviews the underlying flag/draft and its evidence | Evidence panel | — |
| 4 | Accountable clinician | Records `confirmed` or `not_applicable` with rationale where the gate type requires it | Human-gate panel | The named gate itself (§5.2.2–5.2.4) |
| 5 | Platform | If the triggering condition is a crisis-type disclosure (e.g. a suicidal-ideation or acute-safety signal, Chapter 8 §8.6.7 AC-DIAB-042-1) arriving outside clinic hours, routes to an on-call/out-of-hours escalation path in parallel with, not instead of, Step 4 | On-call routing / crisis-line signposting (this journey's own specification — see below) | `red_flag_escalation` remains `required` until Step 4 completes regardless of Step 5's outcome |
| 6 | Platform | Records the gate disposition to SHIELD with actor, timestamp, and gate type | SHIELD | FR-HITL-014 |
| 7 | Platform | Un-blocks case export/finalization-readiness only once every `required` gate on the case reads `confirmed` or `not_applicable` | Case-completeness check | FR-HITL-008 |

**Out-of-hours escalation mechanism (resolving Chapter 8 EC-DIAB-5 and Chapter 11 OQ-PAT-6).** This chapter specifies, as the answer both prior chapters deferred here: an out-of-hours crisis/red-flag disclosure shall (a) never wait for the next in-hours clinician login before any escalation occurs — it shall immediately surface a practice-configured on-call contact path or an external crisis-line signpost (e.g. Samaritans/NHS 111 equivalent, exact channel TBD, §15.13) to the disclosing party where the disclosure originates from a patient-facing surface, and (b) still create the `red_flag_escalation` gate at `required` status for the next clinician login regardless of whether the out-of-hours path was actioned — the two are additive, not substitutive. This is a new escalation *mechanism* (a notification/signpost), not a new `HumanGateId` (restating FR-FLOW-002); the gate itself remains exactly `red_flag_escalation` per Chapter 5's existing catalogue.

- **FR-FLOW-004.** The platform shall present all case-level gates for a case in an identical `required`/`confirmed`/`not_applicable` state regardless of which of the three clinical surfaces (Chapter 12, §12.2) is showing that case at the time — restating Chapter 12's FR-CLIN-014 as this journey's own step-4 requirement.
- **FR-FLOW-005.** A `medication_decision` gate confirmation shall never itself constitute an executable dose or prescription change, restating Chapter 5's §5.2.4 audit-requirements row — the confirming clinician's action is a recorded clinical judgment, not a prescribing transaction, at every point in this journey.
- **FR-FLOW-006.** An out-of-hours crisis/red-flag disclosure (§15.3's "out-of-hours escalation mechanism") shall trigger an immediate on-call/crisis-line signpost independent of, and without waiting for, the `red_flag_escalation` gate's clinician-confirmation step — the signpost and the gate are parallel, not sequential, safeguards.
- **FR-FLOW-007.** The `red_flag_escalation` gate created by an out-of-hours disclosure shall remain at `required` status until an accountable clinician confirms it at next login, even if the out-of-hours signpost path was successfully actioned — restating that Step 5's parallel path never marks Step 4's gate as satisfied by proxy.
- **FR-FLOW-008.** A Nurse (Chapter 3, §3.2.2) may raise or observe any case-level gate but shall never be the actor whose confirmation clears `medication_decision` or `referral_pathway` — restating Chapter 3's FR-PER-009 and Chapter 12's EC-CLIN-3 at this journey's decision point.

**Decisions.** `confirmed` vs. `not_applicable` at Step 4 is itself the journey's central decision; per Chapter 5's OQ-HITL-5, who is authorized to mark `not_applicable` (versus requiring a named clinician's explicit `confirmed`) for `referral_pathway` in ambiguous cases remains open and is restated, not resolved, here (§15.13).

**Exceptions.** `EC-HITL` patterns already named in Chapter 5 (a gate confirmation attempted by a non-accountable persona; a SHIELD dual-write failure) apply unchanged; this journey adds one new exception (`EC-FLOW-1`, §15.11) for the out-of-hours path specifically.

> **AC-FLOW-002-1.** Given a case has an open `red_flag_escalation` gate, when a clinician views that case from either `/dashboard/gp/patients/[id]` or `/cases/[id]` before either is refreshed, then both views shall show the gate as open and neither shall present the case as export-ready — restating Chapter 12's AC-CLIN-015-1 as this journey's own cross-surface AC.

> **AC-FLOW-002-2.** Given a crisis-type disclosure arrives at 2am (outside clinic hours), when the disclosure is processed, then an on-call/crisis-line signpost shall be surfaced within the same session (not deferred to next-business-day clinician login), and a `red_flag_escalation` gate shall separately be created at `required` status for the next clinician login.

**Related FR IDs.** FR-HITL-002/006/008/013/014; FR-PER-009; FR-CLIN-014/015; FR-DIAB-021/035/044 (referral_pathway reuse); EC-DIAB-5; OQ-PAT-6; OQ-HITL-1/5.

### 15.4 Journey 3 (`FLOW-JRN-3`) — Patient consent → coaching / health-plan draft (no self-prescribe)

**Current-state honesty label: [PARTIAL].** Consent, the coaching-draft pattern, and the health-plan-draft view are live; the patient self-report check-in submission surface this journey's Step 2 assumes is, per Chapter 11 §11.2, not backed by an API today.

**Actors.** Patient (Chapter 3, §3.2.7); GP or Clinical Pharmacist (accountable clinician for any escalated item); the Coach capability (`coaching.ts`, Chapter 11 §11.3); CANVAS/CONDUCTOR are not directly in this journey — patient-facing coaching bypasses the clinician review queue by design (Chapter 8, FR-DIAB-020) unless escalated.

**Preconditions.** An authenticated patient session bound to exactly one patient id (Chapter 3, FR-PER-006); at least one active, purpose-bound consent grant relevant to the requested capability (`coaching_wellness` for coaching; Chapter 6, FR-ARC-005/FR-CORE-011).

**Steps.**

| Step | Actor | Action | System / Agent | Gate / check |
| --- | --- | --- | --- | --- |
| 1 | Patient | Grants (or already holds) a `coaching_wellness` purpose-bound consent | Consent registry (Chapter 6, §6.2) | `allowsClinicalWrite:false` on the purpose code (FR-CORE-011) |
| 2 | Patient | Submits self-report/lifestyle data (where a backing surface exists) | Patient-companion surface (Chapter 11, §11.4 — current-state gap noted) | Consent check before acceptance (FR-PAT-038) |
| 3 | Platform | Generates a `CoachingDraft` (or diabetes-specific `NUTRITION_DIABETES`/`EXERCISE_DIABETES`/`BEHAVIOUR_DIABETES` variant where the Diabetes module is enabled for the patient) | `coaching.ts` / Chapter 8 coaching drafts | `hitlRequired:true`, `ehrWrite:false`, `isClinicalAdvice:false` on every draft (FR-PAT-034) |
| 4 | Patient | Views the draft on the patient-companion coaching surface | Patient-companion UI | Draft is view-only for the patient — no patient-side Accept/Edit/Reject of a clinical disposition (this persona records no HITL disposition, Chapter 3 §3.2.7) |
| 5 | Platform | Checks the draft's `clinicalEscalationHints` for any trigger (e.g. unintentional weight loss, a hypo pattern, a crisis disclosure) | Escalation-hint check (Chapter 8, §8.6.5–8.6.7; Chapter 11, FR-PAT-010) | If triggered, routes to clinician review (HITL) exactly as any clinical draft would |
| 6a | (no trigger) | Draft remains patient-visible only; no clinician queue entry created | — | — |
| 6b | (trigger fires) | Item enters the GP/Pharmacist review queue and follows Journey 1 (§15.2) from Step 6 onward | Clinical Intelligence workspace | Item-level disposition gate; case-level gate if applicable (Journey 2) |
| 7 | Patient | Optionally requests or is offered a personalised health-plan draft, distinct from the coaching draft | `health-plan.ts` | `HealthPlanDraft.status:"DRAFT"`; accountable clinician (not the patient) must Accept/Edit/Reject before it is anything more than a draft (FR-CLIN-029) |

**Decisions.** Step 5's escalation check is the journey's sole branch point; there is no patient-side decision that finalizes clinical content — this restates, as an absolute rule, that the patient persona records no clinical disposition anywhere in this journey.

**Exceptions.** A crisis disclosure at Step 5 arriving outside clinic hours restates Journey 2's out-of-hours mechanism (§15.3) — Chapter 11's EC-PAT-2 and Chapter 8's EC-DIAB-5 both resolve to that same mechanism, not a second one specific to this journey.

- **FR-FLOW-009.** No step in this journey shall accept a patient-originated medication self-prescribe, dose-change, or stop-insulin request, under any framing (a "request," a "preference," a "what-if") — restating Chapter 11's NO-PAT-1 and Chapter 8/9's type-level locks as this journey's own absolute, non-negotiable rule, satisfied by the fact that no step in the table above accepts such an input at all.
- **FR-FLOW-010.** A coaching draft's `clinicalEscalationHints` trigger (Step 5) shall route to the identical HITL path (Journey 1, Step 6 onward) used for any clinician-facing draft — restating Chapter 11's FR-PAT-010, so a patient-companion-originated escalation is never handled by a lesser-scrutiny path than a clinician-originated one.
- **FR-FLOW-011.** A health-plan draft offered to a patient at Step 7 shall never render, on the patient-facing surface, as already-accepted or already-in-effect — it shall be presented identically to how Chapter 12's clinician-facing view presents it (`status:"DRAFT"`, editable-by-clinician-only) restating FR-CLIN-029/AC-CLIN-029-1 at the patient-visible side of the same object.
- **FR-FLOW-012.** This chapter records, honestly, that Step 2 (patient self-report submission) has no backing API today (restates Chapter 11 §11.2's finding) — this journey specifies the target sequence; a reader must not infer from this chapter's step table that the submission surface currently exists.

> **AC-FLOW-003-1.** Given a patient views a coaching draft with no fired `clinicalEscalationHints`, when the patient takes any in-app action on that draft, then no option shall be presented that could be construed as a self-prescribe, dose-change, or clinical finalization action — restating NO-PAT-1 as an exhaustive UI-surface assertion, not merely a backend validation.

> **AC-FLOW-003-2.** Given a `MENTAL_HEALTH` or diabetes Behaviour-coaching draft's `clinicalEscalationHints` include a suicidal-ideation or self-harm trigger, when the draft is generated, then the platform shall route it to immediate clinician escalation (Journey 1) regardless of time of day, restating Chapter 11's AC-PAT-010-1 and this chapter's own §15.3 out-of-hours mechanism together.

**Related FR IDs.** FR-CORE-011; FR-PAT-010/034/038; FR-DIAB-020/036/038/039/041; FR-CLIN-027–031; NO-PAT-1.

### 15.5 Journey 4 (`FLOW-JRN-4`) — Diabetes future-wired: CGM/lab signal → HORIZON/GUARDIAN → clinician review

**Current-state honesty label: [FUTURE].** This journey describes the target sequence Chapter 8's v1 phase (rules/demo signals wired into HORIZON/GUARDIAN) will produce once built. Per Chapter 8 §8.3's own status table, this wiring is, as of this Volume's drafting, **not started** — every Diabetes signal builder is a typed stub returning `insufficient_data`/`null`, and `buildDiabetesRiskContribution` is not called from `orchestrate.ts`, `llm-oracle.ts` (HORIZON), or `llm-guardian.ts` (GUARDIAN). This journey is written at the same step depth as Journey 1 specifically so that, once v1 wiring lands, the journey is ready to validate against rather than needing to be authored from scratch at that point.

**Actors.** GP (primary reviewer); Clinical Pharmacist (co-accountable for any Insulin/GLP-1 dose-adjacent discussion); HORIZON, GUARDIAN, PATHWAY (Chapter 7); the Diabetes module's Glucose, HbA1c, Insulin, GLP-1, Complications signal builders (Chapter 8, §8.2–8.6).

**Preconditions (future-state).** A patient with the Diabetes module enabled; a CGM reading, lab result (HbA1c), or medication-adherence signal ingested for that patient; Chapter 8's v1 wiring completed (not true today — see honesty label above).

**Steps (target sequence).**

| Step | Actor | Action | System / Agent | Gate / check |
| --- | --- | --- | --- | --- |
| 1 | (future ingestion path) | A CGM reading or lab (HbA1c) result becomes available for the patient | Diabetes data ingestion (Chapter 8, §8.1 — ingestion path itself out of this chapter's scope) | Purpose-bound consent (`care_delivery` or `coaching_wellness`, Chapter 6) |
| 2 | Glucose / HbA1c signal builder | Derives a typed signal (`GlucoseSignal`/`HbA1cSignal`) from the reading, with evidence references and explicit limitations | `lib/disease-modules/diabetes/glucose.ts` / `hba1c.ts` (Chapter 8, §8.2–8.3) | `confidence`/`insufficient_data` honesty fields per Chapter 8's own contract |
| 3 | Platform | Feeds the signal into HORIZON's `contributingFactors` and/or GUARDIAN's `safetyNotes`/interaction shape — restating Chapter 4's FR-ARC-039: no new agent, orchestrator stage, or review-queue surface is introduced for this | HORIZON / GUARDIAN (Chapter 7) | — |
| 4 | CONDUCTOR | Runs the same orchestration pass as Journey 1, Steps 3–4, with the Diabetes-informed HORIZON/GUARDIAN output included alongside any other draft for that encounter | CONDUCTOR | Same SHIELD audit event as Journey 1 |
| 5 | GP | Reviews the Diabetes-informed HORIZON risk contribution or GUARDIAN flag exactly as any other item — Journey 1, Steps 5–7 | Clinical Intelligence workspace | Item-level disposition gate |
| 6 | GP / Clinical Pharmacist | If the signal is Insulin/GLP-1 dose-adjacent, or a Complications flag triggers a specialist referral, clears the case-level gate — Journey 2 | `medication_decision` or `referral_pathway` | Existing gate catalogue only — no new `HumanGateId` (restates NO-DIAB-7) |
| 7 | Platform | Records the disposition as a learning event, tagged with the specific Diabetes signal that informed it | `recordLearningEvent` (Chapter 14, FR-LEARN-034 analogue once wired) | — |

**Decisions.** Identical decision structure to Journey 1 (Accept/Edit/Reject/Defer per item); this journey adds no new decision type — restating Chapter 8's own design intent that Diabetes contributes *into* existing decision points rather than creating new ones.

**Exceptions.** `insufficient_data`/`null` at Step 2 (the current, actual state of every signal builder) means Step 3 today has nothing to feed HORIZON/GUARDIAN — this is Chapter 8's own honestly-recorded v0 state, not an exception this journey is inventing; a reader implementing against this journey today should expect Steps 1–3 to produce no visible clinician-facing output until v1 wiring lands.

- **FR-FLOW-013.** Once wired, a Diabetes-informed HORIZON or GUARDIAN output shall reach the clinician review queue through the identical Journey 1 mechanism (CONDUCTOR → queue → item-level disposition gate) with no Diabetes-specific queue, review surface, or disposition type — restating Chapter 4's FR-ARC-039 and Chapter 14's FR-LEARN-033 (no diabetes-specific learning-event schema) as this journey's own binding requirement.
- **FR-FLOW-014.** An Insulin/GLP-1 dose-adjacent discussion or a Complications-driven referral trigger reaching this journey's Step 6 shall route through the existing `medication_decision` or `referral_pathway` gate only — restating Chapter 8's NO-DIAB-7 and Chapter 9's NO-TWIN-5 at the workflow layer; this journey does not pre-empt Open Question OQ-DIAB-2/OQ-HITL-1 on whether a new gate type is eventually warranted.
- **FR-FLOW-015.** This chapter records, as its own honest restatement of Chapter 8 §8.3, that Steps 1–3 of this journey do not produce a real, non-null Diabetes-derived HORIZON contribution or GUARDIAN flag in the build as of this Volume's drafting — this journey's [FUTURE] label is not a formality; it reflects a genuinely unbuilt wiring step, not merely an unreviewed one.
- **FR-FLOW-016.** A CGM reading or lab result shall never itself trigger an Insulin dose change, GLP-1 initiation, or any other prescribing-adjacent action without passing through Steps 4–6 of this journey — restating Chapter 8's explanatory-only design for Insulin/GLP-1 signals (NO-DIAB per Chapter 8's non-goals) at the ingestion-to-decision journey level.
- **FR-FLOW-017.** Once Chapter 8's v1 phase lands, this journey's step table (not a newly-authored one) shall be the acceptance basis for validating that the wiring behaves as specified — restating this journey's stated purpose (§15.5 intro) as a binding instruction to whichever future revision of this Volume records v1 as delivered.

> **AC-FLOW-004-1.** Given the Diabetes module's v1 wiring is not yet complete (current state), when a clinician reviews any case for a patient with the Diabetes module notionally enabled, then the workspace shall show only the generic HORIZON/GUARDIAN output that exists today, with no placeholder or partial-credit UI implying Diabetes-specific intelligence that is not actually running — restating Chapter 12's EC-CLIN-2 as this journey's own AC.

> **AC-FLOW-004-2.** Given Chapter 8's v1 wiring is completed in a future build, when a CGM reading produces a non-null `GlucoseSignal` with `confidence` above the module's stated threshold, then that signal shall appear in HORIZON's `contributingFactors` for the next orchestration run for that patient, following this journey's Steps 3–5 exactly as specified.

**Related FR IDs.** FR-ARC-039; FR-DIAB-021/035/044; NO-DIAB-7; NO-TWIN-5; FR-LEARN-033/034; OQ-DIAB-2; OQ-HITL-1.

### 15.6 Journey 5 (`FLOW-JRN-5`) — ICS population intelligence (partial honesty)

**Current-state honesty label: [PARTIAL].** Restating Chapter 10's central finding: of the five stages this journey walks (Segment → Predict → Recommend → Monitor → Learn), only **Recommend** (via COMPASS) produces genuinely derived output today; Segment is a static, separately-authored illustrative fixture; Predict, Monitor, and Learn are not real, computed pipeline stages.

**Actors.** ICS Lead (primary, Chapter 3 §3.2.5); Hospital Executive (analogous, hospital-scoped, §3.2.6); COMPASS (Chapter 7, §7.2.10).

**Preconditions.** An authenticated ICS Lead or Hospital Executive session, scoped to their ICS/hospital tenant (Chapter 3, FR-PER-006 at the ICS-tenant level, Chapter 10 AC-POP-034-1).

**Steps.**

| Step | Actor | Action | System / Agent | Gate / check |
| --- | --- | --- | --- | --- |
| 1 | ICS Lead | Opens the population dashboard (`/dashboard/ics`, alternate `/dashboard/regional`) | ICS dashboard | Tenant filter (`filterRecordsForPractice`/ICS-equivalent) |
| 2 | Platform | Displays the **Segment**-stage view | `lib/mock-data/population.ts` fixture (47,832-patient illustrative scale) | UI must disclose this is a static fixture disconnected from the platform's actual 100-patient synthetic cohort (Chapter 10, §10.2) — **not disclosed as clearly as this chapter requires today** (Open Question, §15.13) |
| 3 | Platform | Displays the **Predict**-stage view (e.g. `admissionForecast`) | Demonstration sine/cosine curve, or pre-seeded Neo4j literal properties | Must explicitly state whether the figure is a demonstration curve, a rules-based estimate, or a governed model's output (Chapter 10, AC-POP-012-1) |
| 4 | ICS Lead | Requests a **Recommend**-stage output (targeted outreach, capacity planning, equity intervention) | COMPASS `EquityDraft` (`lib/agents/llm-equity.ts`) | Genuinely derived output — the most-built stage (Chapter 10, §10.7) |
| 5 | ICS Lead | Reviews the `EquityDraft` and its `safetyNotes` (including the deterministic-fallback disclosure if the LLM path is unavailable, EC-POP-4) | Population Intelligence UI | Explicit accept/dismiss action required before the recommendation is treated as an operational plan (FR-POP-014, restating the item-level disposition-gate pattern at population scale) |
| 6 | ICS Lead | (Target, not built) Would view a **Monitor**-stage output tracking whether an accepted recommendation changed the underlying metric | Not a real computed stage today (Chapter 10, §10.2) | — |
| 7 | ICS Lead | (Target, not built) Would see a **Learn**-stage feedback loop closing back into Segment/Predict | Not a real computed stage today | — |
| 8 | ICS Lead | Exports a governed, SHIELD-audited aggregate report | Export action (Chapter 3, §3.2.5 "Actions they may take") | SHIELD audit (FR-HITL-014 at population scale) |

**Decisions.** Accept vs. dismiss at Step 5 is this journey's only real decision point today; Steps 6–7 have no decision to make because no computed output exists yet to decide on.

**Exceptions.** EC-POP-3 (a demonstration curve mistaken for a live forecast) and EC-POP-4 (COMPASS LLM path unavailable, deterministic fallback) both apply unchanged to Steps 3 and 4 respectively.

- **FR-FLOW-018.** Every stage this journey displays shall be independently labeled with which of the five stages produced it — restating Chapter 10's FR-POP-002 as this journey's own step-level requirement, so an ICS Lead moving through Steps 2–7 always knows which stage they are looking at.
- **FR-FLOW-019.** Step 2's Segment-stage display shall carry an explicit, prominent disclosure that the illustrative 47,832-patient scale is disconnected from the platform's actual synthetic cohort — this chapter restates Chapter 10 §10.2's finding and additionally requires (as a workflow-composition requirement this chapter is positioned to make) that this disclosure be no less prominent than the honesty label this journey itself carries (§15.1), not buried in a tooltip or footnote.
- **FR-FLOW-020.** Step 5's accept/dismiss action shall be the only action in this journey capable of converting a Recommend-stage draft into anything an ICS Lead or Hospital Executive could act on operationally — restating Chapter 10's FR-POP-014/FR-POP-035 as this journey's own HITL-equivalent requirement at population scale.
- **FR-FLOW-021.** This journey shall never present Steps 6–7 (Monitor, Learn) as available actions in the UI until they are real, computed stages — restating Chapter 10's own stage-honesty framing; an unbuilt stage is omitted from the interface, not rendered as a disabled or "coming soon" placeholder that could be mistaken for a near-term deliverable without an explicit product decision to message it that way.
- **FR-FLOW-022.** Every action in this journey (dashboard view, export) shall remain scoped to the requesting ICS Lead's or Hospital Executive's own ICS/hospital tenant — restating Chapter 10's AC-POP-034-1 as this journey's own tenant-boundary requirement.
- **FR-FLOW-023.** No non-clinical persona reachable by this journey (ICS Lead, Hospital Executive) shall ever be shown, or be able to reach via this journey, an individual patient-level Accept/Edit/Reject control — restating Chapter 3's FR-PER-009 and Chapter 12's NO-CLIN-7 at the population-workflow layer; this journey's Step 5 decision is a planning decision, never a clinical one (Chapter 3, §3.2.5 HITL-responsibilities row).

> **AC-FLOW-005-1.** Given an ICS Lead reaches Step 3 (Predict-stage view), when they inspect the source/limitations text, then it shall state explicitly whether the figure is a demonstration curve, a rules-based estimate, or a governed model's output — restating Chapter 10's AC-POP-012-1 as this journey's own step-3 AC.

> **AC-FLOW-005-2.** Given an ICS Lead attempts to locate a Monitor- or Learn-stage view (Steps 6–7), when they navigate the population dashboard, then no UI element shall imply either stage is computing live data — restating FR-FLOW-021 as a negative UI assertion.

**Related FR IDs.** FR-POP-002/012/014/025/026/033/035; AC-POP-012-1/014-1/034-1; NO-CLIN-7; FR-PER-006/009.

### 15.7 Journey 6 (`FLOW-JRN-6`) — Researcher ethics-gated evaluation / export (missing honesty)

**Current-state honesty label: [PARTIAL], leaning toward missing.** Restating Chapter 13's central finding: the evaluation harness and the federated-research ethics gate are the two genuinely-built, SHIELD-audited parts of this journey; the six-capability research vision this journey's early steps might suggest (Literature Intelligence, Cohort Builder as an interactive tool, Biomarker Discovery as a discovery engine, Hypothesis Generator at cohort level, Trial Matching, Scientific Writer) has, per Chapter 13 §13.3, **no code representation, or only a static/display-only stand-in, for most of those six areas** — this journey therefore walks the two capabilities that are real (evaluation, federated export) rather than the four-plus that are not.

**Actors.** Researcher (Chapter 3, §3.2.8); the evaluation-harness boundary (`lib/research-evaluation-plan.ts`); the federated-research job stub (`lib/precision-health/federated-research.ts`).

**Preconditions.** An authenticated researcher session; for individual-level data access specifically, an "ethics reference confirmed" `dataAccessLevel` preference — which this chapter restates, per Chapter 3's OQ-PER-3, as **a UI/preference-level signal only, not a server-verified ethics-approval check today**.

**Steps.**

| Step | Actor | Action | System / Agent | Gate / check |
| --- | --- | --- | --- | --- |
| 1 | Researcher | Opens `/dashboard/researcher` | Researcher surface (`ResearcherKpiRow`, `GovernanceBoundariesCard`) | Aggregate/de-identified default (Chapter 3, §3.2.8) |
| 2 | Researcher | Sets `dataAccessLevel` preference to request individual-level access, citing an ethics reference | Onboarding/preference UI (`lib/onboarding/role-paths.ts`) | **UI-level signal only — no server-side ethics-approval verification exists today** (Chapter 3, OQ-PER-3; carried into this journey unresolved) |
| 3 | Researcher | Selects an evaluation task from the typed dataset/task/metric boundary | `lib/research-evaluation-plan.ts` (Chapter 13, §13.4) | Task `stage` (`available_now`/`planned`/`not_allowed_yet`) and literal `productionClaimAllowed:false` (FR-RES-021) |
| 4 | Researcher | Runs an evaluation against one of exactly two `available_now` tasks (structured draft-extraction quality; safety and missing-data detection) — a `planned` or `not_allowed_yet` task is not executable | Evaluation harness | FR-RES-022's staging honesty |
| 5 | Platform | Assembles a versioned, exportable evidence artifact and logs the export to SHIELD | Evaluation route (`app/api/research/evaluation/route.ts`) | SHIELD audit (confirmed implemented, Chapter 13) |
| 6 | Researcher | (Separately) requests a federated-research job | `FederatedJobsPanel` / `lib/precision-health/federated-research.ts` | Requires both the environment-level ethics gate (`FEDERATED_RESEARCH_ETHICS_APPROVED`) and a caller-supplied `ethicsApprovedClaim:true` — either missing routes to `blocked_ethics`, never silent completion (FR-RES-026) |
| 7 | Platform | Records job creation and status transition to SHIELD regardless of outcome (`completed` or `blocked_ethics`) | `POST /api/research/federated/jobs` | Confirmed implemented (FR-RES-029) |
| 8 | Researcher | Would, for the remaining research vision areas (Literature Intelligence, Trial Matching, Scientific Writer, an interactive Cohort Builder, a real Biomarker Discovery engine), find no live capability to invoke today | — | Not built (Chapter 13, §13.3) — this journey does not fabricate a step here |

**Decisions.** Step 6's gate is binary and unconditional: both the environment-level and caller-supplied ethics conditions must be true, or the job is `blocked_ethics` — there is no partial-approval or override path (restating FR-RES-026 as an absolute rule, not a workflow preference).

**Exceptions.** EC-RES-1 (ethics gate flips mid-session — a queued-but-blocked job does not silently retro-complete, current-state note, OQ-RES-3) and EC-RES-5 (a stakeholder requests an unbuilt capability area ahead of its precondition — treated as a Chapter 2 NS-6/NS-7 scope-change request, not a routine addition) both apply unchanged.

- **FR-FLOW-024.** Step 2's `dataAccessLevel` elevation shall not, by itself, grant individual-level clinical-record access anywhere in the platform until Chapter 3's OQ-PER-3 is resolved with a genuine server-side ethics-approval check — this chapter restates, rather than closes, that gap; a journey step referencing an unresolved open question does not resolve it by restating it.
- **FR-FLOW-025.** No evaluation task at `stage:"not_allowed_yet"` (clinical model training or fine-tuning, per Chapter 13 §13.4) shall be executable from this journey's Step 4 under any researcher-supplied override — restating FR-RES-021's binding staging field as this journey's own hard block.
- **FR-FLOW-026.** A federated-research job (Step 6) shall be recorded as `blocked_ethics` — never silently completed, never left ambiguously pending — whenever either ethics condition is unmet, restating FR-RES-026 as this journey's own decision-point rule.
- **FR-FLOW-027.** This chapter records, honestly, that Step 8 represents the majority of the product vision's originally-stated six research capability areas, and that this journey does not walk them because they do not exist to walk — restating Chapter 13 §13.3's finding as this chapter's own honesty discipline (SC-7) applied at journey level, rather than presenting an aspirational eight-step journey as if fully built.
- **FR-FLOW-028.** Every governance-relevant action in this journey (Step 2's elevation request, Step 5's export, Step 6's job creation) shall be logged to SHIELD with actor, timestamp, and the specific governance state at the time of the action — restating Chapter 13's FR-RES-034 as this journey's own cross-step requirement.
- **FR-FLOW-029.** This journey shall never present a `not_allowed_yet` or `planned` evaluation task, or an unbuilt capability area (Step 8), using UI language implying near-term availability without a named product decision to message it that way — restating FR-FLOW-021's population-journey principle at the research-journey layer.

> **AC-FLOW-006-1.** Given a researcher requests a federated job with `ethicsApprovedClaim:true` but `FEDERATED_RESEARCH_ETHICS_APPROVED` is unset, when the job is submitted, then its status shall be `blocked_ethics` and no synthetic aggregate shall be generated — restating Chapter 13's AC-RES-026-1 as this journey's own AC.

> **AC-FLOW-006-2.** Given a researcher's `dataAccessLevel` preference is set to request individual-level access, when any individual clinical-record API is subsequently called under that researcher's session, then the platform's actual current-state behavior (not yet a verified server-side ethics check, per OQ-PER-3) shall not be misrepresented to the researcher as already-enforced — the UI shall not claim an approval gate exists where only a preference toggle does.

**Related FR IDs.** FR-RES-021/022/026/029/034; OQ-PER-3; OQ-RES-3; EC-RES-1/5; NS-6/NS-7 (Chapter 2).

### 15.8 Journey 7 (`FLOW-JRN-7`) — Demo vs. live identity

**Current-state honesty label: [LIVE]** for the demo/synthetic identity path (the platform's only operative path today); **[FUTURE]** for any "live" counterpart, which does not exist and is not requested by this Volume (Track B, NS-3).

**Actors.** Every persona (Chapter 3); Practice Manager/Admin specifically for the demo-reset action; Compliance/Regulatory (Chapter 3, §3.3) as the stakeholder owning the honest positioning of this journey's claims.

**Preconditions.** None beyond an authenticated session — this journey is about *which environment/identity mode* a session operates in, not a precondition for entering it.

**Steps.**

| Step | Actor | Action | System / Agent | Gate / check |
| --- | --- | --- | --- | --- |
| 1 | Any persona | Authenticates into the platform | NextAuth + Neon (Chapter 6, §6.1) | Single identity boundary — no disease module or agent introduces a second one (FR-ARC-004) |
| 2 | Platform | Attaches the standing honesty-field set to every clinical-facing orchestration result for that session: `liveEmis:false`, `ehrWrite:false`, `autoRetrain:false`, `physiologicalTwin:false`, `hitlRequired:true` | CONDUCTOR / every agent (Chapter 5, FR-HITL-006) | Literal, typed, code-enforced — not a comment or a configuration default (FR-HITL-023) |
| 3 | Practice Manager/Admin | May trigger a demo-reset action, restoring the synthetic cohort to a known baseline state | Admin/ops surface (Chapter 3, permission-matrix "demo reset" capability) | Scoped to the practice-manager's own tenant; never a live-data operation |
| 4 | Any persona | Interacts with the platform exactly as any other journey in this chapter describes — every one of Journeys 1–6, 8 executes *within* this Track A/demo identity mode | All | `liveEmis:false` unconditionally, restated at every touchpoint |
| 5 | (Not built; Track B) | A future, separately-governed decision would introduce a live-identity mode with live EMIS/SystmOne write-back, named regulatory/contractual/technical sign-off, and a productionRbacEnforced:true authorization posture | Not built — `docs/BUILT_VS_REMAINING_AUDIT.md`'s Track B, NO-GO | Would require its own governance gate sequence, analogous to but distinct from G-ML-1/2/3 (Chapter 14) — not specified further by this Volume (NS-3) |

**Decisions.** There is no in-product decision point that moves a session from Step 4 (demo/synthetic) to Step 5 (live) — that transition is, by design, not a workflow this chapter's journeys can traverse; it is a separately-governed program decision outside this Volume's scope (restating NS-3, NO-4).

**Exceptions.** None specific to this journey beyond the standing current-state note (Chapter 3, §3.5) that today's authorization is demo-grade (`productionRbacEnforced:false`) — restated here as a precondition of every other journey in this chapter, not a defect this journey introduces.

- **FR-FLOW-030.** Every journey in this chapter (§15.2–§15.7, §15.9) shall be understood as executing entirely within this journey's Step 4 (Track A/demo identity mode) unless and until a separately governed Track B decision is made — restating NS-3 as this chapter's own binding scope statement, applicable retroactively to every other journey section.
- **FR-FLOW-031.** No UI surface reachable by any journey in this chapter shall present a demo-reset action (Step 3) as available to any persona other than Practice Manager/Admin — restating the existing permission-matrix scoping as this journey's own access-control requirement.
- **FR-FLOW-032.** `liveEmis:false`, `autoRetrain:false`, and `productionRbacEnforced:false` shall remain visible, accurate, and unconditional across every journey's honesty-field emissions for the duration this Volume is in effect — restating Chapter 5's FR-HITL-023 and Chapter 3 §3.5's honest current-state note as this journey's own cross-cutting requirement.
- **FR-FLOW-033.** No journey in this chapter, and no future revision adding a journey, shall silently assume Step 5 (live identity/Track B) has occurred without a named revision-history entry recording the separately governed decision that authorized it — restating NO-4/NS-3 at the document-maintenance level.
- **FR-FLOW-034.** A demo-reset action (Step 3) shall never be capable of affecting another practice's tenant-scoped data — restating Chapter 3's tenant-isolation requirement (FR-PER-006) at the demo-reset operation specifically.

> **AC-FLOW-007-1.** Given any session, any persona, and any journey in this chapter, when the resulting orchestration output or audit event is inspected, then `liveEmis` shall read `false` — restating Chapter 5's AC-HITL-006-1 as the single cross-journey invariant this entire chapter depends on.

> **AC-FLOW-007-2.** Given a Practice Manager/Admin triggers a demo-reset action, when the reset completes, then only that practice's own synthetic-cohort data shall be affected — no cross-tenant reset shall occur.

**Related FR IDs.** FR-ARC-004; FR-HITL-006/023; FR-PER-006; NO-4; NS-3; OQ-PER-4.

### 15.9 Journey 8 (`FLOW-JRN-8`) — Digital Twin what-if + HITL

**Current-state honesty label: [PARTIAL].** The generic (disease-agnostic, heart-failure-flavoured) `synthetic_rules` scenario ranker (`lib/precision-health/twin-simulation.ts`) is real, live code; every Diabetes-specific scenario this journey's Step 3 might suggest (lose weight, start GLP-1, increase protein, reduce carbs, improve sleep, stop insulin, walk after meals) is, per Chapter 9 §9.2, a requirement for future work, not existing behavior — and `physiologicalTwin:false` is literal and unconditional regardless of which scenario is run.

**Actors.** GP (primary; Clinical Pharmacist co-accountable specifically for the stop-insulin/medication-cessation scenario); the twin-simulation scenario ranker (Chapter 9, §9.2–9.5).

**Preconditions.** A patient case open in the Clinical Intelligence workspace (Chapter 12); the GP has reached the Twin/scenario-ranking panel (Chapter 12, FR-CLIN-007).

**Steps.**

| Step | Actor | Action | System / Agent | Gate / check |
| --- | --- | --- | --- | --- |
| 1 | GP | Opens the Twin panel for a patient | Clinical Intelligence workspace, Twin panel (Chapter 12) | — |
| 2 | GP | Selects a what-if scenario from the ranker's available set | `twin-simulation.ts`'s `synthetic_rules` ranker | `physiologicalTwin:false` on every result, unconditionally (Chapter 9, FR-TWIN §9.2) |
| 3a | (non-safety-critical scenario, e.g. lifestyle-adjacent) | Ranker returns a benefit/risk/confidence-weighted result | Twin panel | Result is explicitly labeled a rules-based scenario ranking, never a physiological simulation or a clinical prediction |
| 3b | (safety-critical scenario, e.g. "stop insulin" or any medication-cessation scenario) | Platform refuses to generate or display a result until the request is first routed through the `medication_decision` gate as a pending clinical judgment | `medication_decision` `HumanGateId` (Chapter 5, §5.2.4) | Hard-gated (Chapter 9, FR-TWIN-024) — this is the single highest-severity requirement in Chapter 9 and is not relaxed here |
| 4 | GP / Clinical Pharmacist | Clears the `medication_decision` gate (Journey 2, §15.3) before Step 3b's result is shown | Human-gate panel | `medication_decision` |
| 5 | Platform | Displays the scenario result, benefit/risk/confidence weights, and rationale | Twin panel | — |
| 6 | GP | Records Accept / Edit / Reject / Defer on whether the scenario's implied action informs the care plan | Decision panel | Item-level disposition gate (Journey 1, Step 7 pattern) applied to the twin-informed action, not to the raw scenario output itself |
| 7 | Platform | If accepted into a care-plan action, tags the eventual learning event with the specific scenario that informed the decision | `recordLearningEvent` (Chapter 14, FR-LEARN-034) | — |
| 8 | (future, gated) | A twin rule-weight adjustment based on accumulated outcomes would route through the full G-ML-1/2/3 sequence exactly as an agent prompt change would | Chapter 14, §14.5/§14.7 | G-ML-1/2/3 — no lighter-weight path for "just a number" (FR-LEARN-031) |

**Decisions.** Step 3a/3b is the journey's central branch: whether the selected scenario is safety-critical (medication-cessation) determines whether Step 3b's hard gate applies before any result is even shown — this is a stricter pattern than Journey 1's item-level gate, which applies *after* a draft is shown; here the draft itself is withheld pending the gate.

**Exceptions.** A patient-initiated attempt to reach Step 2 directly (bypassing the GP) is not a recoverable exception in this journey — it is structurally impossible, restating NO-TWIN-3/NO-PAT-1: no patient-facing surface anywhere in the platform exposes this panel at all (Journey 3, §15.4, never reaches this panel).

- **FR-FLOW-035.** Step 3b's hard gate shall apply to every safety-critical medication-cessation scenario, not only "stop insulin" specifically — restating Chapter 9's FR-TWIN-024's own "any other safety-critical medication-cessation scenario" scope as this journey's own step-level rule.
- **FR-FLOW-036.** No twin scenario result of any kind shall be reachable from a patient-facing session at any step of this journey — restating NO-TWIN-3 and NO-PAT-1 together as an absolute, structural (not merely policy-level) exclusion.
- **FR-FLOW-037.** Every twin scenario result, safety-critical or not, shall carry `physiologicalTwin:false` — restating Chapter 5's FR-HITL-006 and Chapter 9's own honesty framing as unconditional across every branch of Step 3.
- **FR-FLOW-038.** A twin-informed care-plan action accepted at Step 6 shall be tagged, in its learning event, with the specific scenario that informed it — restating Chapter 14's FR-LEARN-034 as this journey's own step-7 requirement, so a future governed evaluation can attribute an outcome to a specific rule-weight rather than to the twin in general.
- **FR-FLOW-039.** A future twin rule-weight adjustment (Step 8) shall satisfy the full G-ML-1/2/3 sequence with no expedited path on the theory that a weight is "just a number" — restating Chapter 14's FR-LEARN-031 as this journey's own closing step's requirement.
- **FR-FLOW-040.** This chapter records, honestly, that every Diabetes-specific scenario a reader might expect at Step 2 (per the product vision's original scenario list) does not exist in code today — restating Chapter 9 §9.2's finding as this journey's own honesty discipline, so this journey's step table is not mistaken for a description of scenarios currently selectable.

> **AC-FLOW-008-1.** Given a GP selects the "stop insulin" scenario (or any safety-critical medication-cessation scenario), when the selection is made, then the platform shall not generate or display any result for that scenario until the `medication_decision` gate is first routed to pending status — restating Chapter 9's FR-TWIN-024 as this journey's own step-3b AC, with no exception for UI convenience.

> **AC-FLOW-008-2.** Given a twin scenario result is displayed at Step 5, when a clinician inspects it, then `physiologicalTwin` shall read `false` and the result shall be labeled a rules-based scenario ranking — restating AC-ARC-031-1's honesty-field pattern (Chapter 4) at the twin-journey level.

**Related FR IDs.** FR-TWIN-024/030/033/034; NO-TWIN-1/3/5; FR-LEARN-031/034; FR-HITL-006.

### 15.10 Cross-journey rules

These rules are not scoped to a single journey — they are invariants this chapter requires of every journey in §15.2–§15.9, restated once here rather than eight times.

- **FR-FLOW-041.** No journey in this chapter shall complete (reach a "done"/finalization-ready state) while any required item-level disposition (Chapter 5, §5.2.1) or case-level gate (§5.2.2–5.2.4) on the underlying case remains unresolved — restating Chapter 5's FR-HITL-008 as the one rule every journey in this chapter shares, regardless of which persona or intelligence layer the journey otherwise concerns.
- **FR-FLOW-042.** No journey shall present a step as "complete" or "actioned" on the strength of an AI-generated draft alone — every journey's terminal state, where one exists, is a recorded human decision (Accept/Edit/Reject/Defer, a gate confirmation, or an accept/dismiss at population scale), restating BO-4 (Chapter 1) as this chapter's own cross-journey design constraint.
- **FR-FLOW-043.** Every journey's honesty-field set (`ehrWrite`, `hitlRequired`, `liveEmis`, `autoRetrain`, `physiologicalTwin`) shall be internally consistent across every step of that journey — a journey shall never show one step's honesty fields contradicting another step's for the same underlying orchestration result, restating FR-HITL-006 at the whole-journey-consistency level (Journey 1's AC-FLOW-001-2 restated as a chapter-wide rule).
- **FR-FLOW-044.** Where two journeys in this chapter converge on the same mechanism (e.g. Journey 4 and Journey 8 both eventually route through `medication_decision`; Journey 1 and Journey 4 both route through CONDUCTOR), this chapter's steps shall reference the shared mechanism identically — restating FR-FLOW-002's "compose, do not invent" rule at the cross-journey-consistency level, so two journeys never describe the same underlying gate or agent with subtly different behavior.
- **FR-FLOW-045.** A persona's HITL responsibilities (or explicit absence thereof, per Chapter 3 §3.2) shall be identical across every journey that persona appears in — e.g. the Patient persona (Journey 3) records no clinical disposition in any journey in this chapter; the ICS Lead (Journey 5) records only planning decisions, never clinical ones, in any journey; this chapter does not grant a persona expanded authority in one journey that Chapter 3 denies them elsewhere.
- **FR-FLOW-046.** Every journey's current-state honesty label (§15.1: LIVE/PARTIAL/FUTURE) shall be re-verified, not copy-pasted forward unchanged, at the next revision of this chapter that follows any change to the underlying chapter (4, 6–14) that journey depends on — restating this Volume's standing revision discipline (§0.7) at the journey-label level specifically, since a journey label is a claim about composition, which can go stale even when no single underlying chapter changes.

### 15.11 Non-goals

- **NO-FLOW-1.** No journey in this chapter introduces a new `HumanGateId`, agent, persona, or consent purpose code — restating FR-FLOW-002 as an absolute rule; every journey composes only primitives Chapters 3, 5, 6, and 7 already define.
- **NO-FLOW-2.** No journey in this chapter claims a capability is live where the grounding chapter records it as Partial, Missing, or Not started — Journeys 4, 5, 6, and 8 each carry an explicit [FUTURE]/[PARTIAL] label precisely to prevent this chapter's step-table format (which can read as procedural and therefore "real") from implying more build-completeness than the chapters it composes actually support.
- **NO-FLOW-3.** No journey ever allows a patient-facing surface to accept a medication self-prescribe, dose-change, or stop-insulin request — restating NO-PAT-1/NO-TWIN-3 as this chapter's own absolute rule, satisfied structurally (no relevant step exists) in Journeys 3 and 8 rather than by a runtime check this chapter adds on top.
- **NO-FLOW-4.** No journey substitutes an out-of-hours signpost/notification mechanism (§15.3) for the underlying case-level gate's clinician-confirmation requirement — the two remain additive, never substitutive, restating FR-FLOW-007 as an absolute rule with no journey-specific exception.
- **NO-FLOW-5.** No journey in this chapter creates a lighter-weight or expedited path around the G-ML-1/2/3 governed-release sequence for a twin rule-weight or disease-module model change surfaced via a journey — restating Chapter 14's FR-LEARN-031/NO-LEARN-7 at the workflow-composition level (Journey 8, Step 8).
- **NO-FLOW-6.** No journey grants an ICS Lead, Hospital Executive, Practice Manager/Admin, or Researcher an individual patient-level Accept/Edit/Reject control at any step — restating FR-PER-009/NO-CLIN-7 as a rule that holds across every journey those personas appear in (Journeys 5, 6, 7), not only within their home chapters.
- **NO-FLOW-7.** No journey is treated as validated, tested, or acceptance-signed-off by virtue of appearing in this chapter — a journey's presence here is a specification, restating this Volume's standing DRAFTED-is-not-Accepted distinction (§0.5) at journey granularity; Chapter 20 (Acceptance & Validation, §20.3's Journeys row) records this area's genuine test coverage today; journey-level sign-off itself still awaits the DRAFTED-to-Accepted mechanism Chapter 20 names but does not create (§20.10 OQ-VAL-4).

### 15.12 Edge cases

- **EC-FLOW-1 (out-of-hours crisis disclosure with no configured on-call path).** Given a practice has not configured an on-call contact or crisis-line signpost target (§15.3's out-of-hours mechanism), when an out-of-hours crisis disclosure occurs, then the platform shall fall back to a generic, always-available crisis-line signpost (exact default TBD, Open Question §15.13) rather than surfacing no signpost at all — the `red_flag_escalation` gate still activates per FR-FLOW-007 regardless of which signpost path was available.
- **EC-FLOW-2 (a journey spans a surface transition mid-decision).** Given a clinician begins Journey 1 or Journey 8 on `/dashboard/gp/patients/[id]` and completes it on `/cases/[id]` (or vice versa) without finishing every step on one surface, then the case's gate and disposition state shall reflect consistently on whichever surface the clinician resumes on — restating Chapter 12's EC-CLIN-1/FR-CLIN-014 at the cross-journey level; this chapter does not claim real-time sync exists, only that state must not silently diverge on refresh.
- **EC-FLOW-3 (Journey 4's signals remain null indefinitely).** Given Chapter 8's v1 wiring has not landed by the time a reader attempts to exercise Journey 4 end-to-end, then Steps 1–3 shall produce no clinician-visible output, and this shall not be treated as a defect in this journey's specification — it restates Chapter 8 §8.3's own "not started" finding; this chapter's Journey 4 is validated against once wiring lands (FR-FLOW-017), not before.
- **EC-FLOW-4 (a researcher's ethics-elevation preference is later revoked or expires).** Given a researcher's `dataAccessLevel` preference (Journey 6, Step 2) was elevated and is later reset to aggregate-only, then any evaluation or export action already completed under the prior elevation remains a valid, auditable historical record (restating Chapter 14's append-only learning-event principle at the research-governance layer) — only future actions are affected by the reset. This chapter does not specify a retroactive-revocation mechanism, which would be a data-deletion policy question outside this chapter's scope.
- **EC-FLOW-5 (a demo-reset action is triggered mid-journey).** Given a Practice Manager/Admin triggers a demo-reset (Journey 7, Step 3) while another user's session has an in-progress, unsaved journey step (e.g. a GP mid-review on Journey 1), then the platform shall not silently discard the in-progress clinical disposition without a warning — restating the general principle that a demo-reset action is a destructive operation requiring the same care Chapter 5's concurrent-edit concern (FR-HITL-034) already requires for a stale-cache scenario, generalized to this new trigger. Exact UX handling is deferred to Chapter 18 (UI/Screen Definitions, `[DRAFTED]`).
- **EC-FLOW-6 (a twin scenario is requested for a patient with an already-open `medication_decision` gate from an unrelated draft).** Given a patient's case already has an open `medication_decision` gate from a GUARDIAN interaction flag (unrelated to any twin scenario), when a GP separately requests the "stop insulin" twin scenario (Journey 8, Step 3b) for the same patient, then the platform shall not conflate the two pending gate instances into one — restating Chapter 5's per-trigger gate-instantiation model; this chapter does not specify whether the UI should visually distinguish the two `medication_decision` triggers, which is deferred to Chapter 18.

### 15.13 Open questions

- **OQ-FLOW-1.** Confirm the exact out-of-hours crisis/red-flag signpost channel(s) (§15.3's escalation mechanism) — an internal on-call rota integration, a hardcoded external crisis-line reference (e.g. Samaritans/NHS 111-equivalent), or both, and whether this is configurable per practice or fixed platform-wide. This chapter specifies the mechanism's *shape* (parallel to, never substituting for, the gate) but not its exact channel. **Owner:** Clinical Safety Lead + Product.
- **OQ-FLOW-2.** Confirm whether Journey 2's restatement of Chapter 5's OQ-HITL-5 (who may mark `referral_pathway` `not_applicable` in ambiguous cases) should be resolved as part of this chapter's own workflow authority, or remains, as recorded, Chapter 5's open question to close. **Owner:** Clinical Safety Lead.
- **OQ-FLOW-3.** Confirm whether Journey 5's Segment-stage disclosure (FR-FLOW-019, the 47,832-vs-100-patient distinction) should be a persistent banner, a per-view label, or a one-time acknowledgment gate an ICS Lead must clear once per session — this chapter specifies the disclosure must exist and be prominent, not its exact UI treatment (deferred to Chapter 18). **Owner:** Product + UI.
- **OQ-FLOW-4.** Confirm the target date for Chapter 8's v1 Diabetes wiring (Journey 4's prerequisite) so this chapter's [FUTURE] label on Journey 4 has an expected revision trigger, rather than remaining indefinitely provisional. **Owner:** Product + Engineering.
- **OQ-FLOW-5.** Confirm whether Journey 6's Step 2 (`dataAccessLevel` elevation) needs a lightweight, in-app "ethics reference" record (per Chapter 3's OQ-PER-3) before any pilot exposes individual-level research data access beyond synthetic data — this chapter restates the gap at the workflow level but does not itself propose the record's shape. **Owner:** Clinical Safety + Compliance.
- **OQ-FLOW-6.** Confirm the intended UX for EC-FLOW-5 (demo-reset triggered mid-journey) and EC-FLOW-6 (overlapping `medication_decision` gate instances) — both are deferred to Chapter 18 (UI/Screen Definitions) but this chapter flags that Chapter 18 should not treat either as a novel discovery; both are named here first. **Owner:** Product.
- **OQ-FLOW-7.** Confirm whether this chapter's eight journeys are the complete initial set, or whether a ninth — e.g. a Hospital Executive-specific Command-Centre journey, distinct enough from Journey 5 to warrant its own step table rather than the "analogous" treatment §15.6 gives it — should be added before this chapter is considered ready for Clinical Safety/Architecture review. **Owner:** Product.

### 15.14 Cross-references

- Chapter 1 (§1.3 BO-4, §1.4 NO-1/NO-4, §1.5 SC-7) — the platform-level commitments (human decision required; no live EHR write; honest status tracking) every journey in this chapter is a concrete instance of.
- Chapter 3 (§3.2 all eight personas, §3.4 persona/surface mapping, §3.5 auth/authz, FR-PER-004/006/009/010) — every actor named in every journey's Steps table.
- Chapter 4 (§4.5 six-stage data flow, FR-ARC-039) — the product-level flow Journey 1 elaborates to full step depth, and the "feed into existing agents" pattern Journey 4 restates for Diabetes.
- Chapter 5 (§5.1–§5.2 gate catalog, §5.4 SHIELD, FR-HITL-002/005/006/008/013/014/023/034, OQ-HITL-1/5) — the gate mechanics Journey 1's Step 6–8 and Journey 2 in full compose without redefining.
- Chapter 6 (§6.2 consent registry, FR-ARC-005/FR-CORE-011) — the purpose-bound consent grant every step touching patient data (Journeys 3, 4) checks first.
- Chapter 7 (§7.1 CONDUCTOR, §7.2 the twelve agents) — every named agent in every journey's Steps table.
- Chapter 8 (§8.2–8.6 signal builders, §8.3 v0/v1/v2 phasing, NO-DIAB-7) — the current-state honesty basis for Journey 4's [FUTURE] label and Journey 2's referral/medication-decision reuse.
- Chapter 9 (§9.2 twin-simulation.ts current behavior, FR-TWIN-024/030, NO-TWIN-1/3/5) — the hard-gated stop-insulin rule Journey 8's Step 3b restates without relaxing.
- Chapter 10 (§10.2 Segment-stage honesty, §10.7 Recommend-stage, FR-POP-002/012/014/025/026/033/035) — the five-stage framing Journey 5 walks stage by stage.
- Chapter 11 (§11.3 Coach capability, FR-PAT-010/034/038, NO-PAT-1, OQ-PAT-6) — the coaching-draft pattern and the out-of-hours open question Journey 3 carries and this chapter's §15.3 resolves.
- Chapter 12 (§12.2 three-surface finding, §12.7 care-plan lifecycle, FR-CLIN-007/014/027–031, EC-CLIN-1/2/3) — the workspace composition every clinician-facing journey (1, 2, 4, 8) moves through, and the cross-surface consistency requirement §15.1's FR-FLOW-003 restates.
- Chapter 13 (§13.3 six-capability honest baseline, §13.4 evaluation harness, §13.5 federated-research ethics gate, FR-RES-021/022/026/029/034, OQ-RES-3) — the two real capabilities Journey 6 walks, and the four-plus unbuilt ones it does not fabricate a step for.
- Chapter 14 (§14.2–14.5 learning loop and gate sequence, FR-LEARN-031/033/034) — the learning-event tagging every journey's terminal steps route through, and the G-ML-1/2/3 sequence Journey 8's Step 8 restates.
- `docs/BUILT_VS_REMAINING_AUDIT.md` (Track A/B) — the basis for Journey 7's demo-vs-live framing.
- `docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md` — the v0/v1/v2 phasing Journey 4 is written against.

---

## 20. Chapter 16 — Business Rules Catalog `[DRAFTED]`

### 16.0 Purpose of this chapter

Chapters 1–15 each stated their own business rules inline, in their own `NO-*`/`FR-*` numbering and their own prose — the consent-purpose rule in Chapter 6, the insulin/GLP-1 null-type locks in Chapter 8, the hard-gated stop-insulin rule in Chapter 9, the honesty-field invariant restated eight separate times across Chapter 15's journeys. That was correct for each chapter's own self-containment, but it leaves no single place an engineer, reviewer, or QA analyst can check *before* writing a line of code to ask "does this violate a rule the platform has already committed to, anywhere in the Volume?"

This chapter is that single place. It does not invent new rules. It **consolidates and indexes** the cross-cutting business rules already stated across Chapters 1–15 into one catalogue, assigning each a first formal `BR-<nnn>` id (per §0.6's numbering scheme) where one did not already exist, and cross-referencing every entry back to the `FR-*`/`NO-*`/`OQ-*` id(s) it restates rather than re-deriving them. A rule catalogued here that is later found to conflict with its home chapter is a **documentation defect to fix**, not a signal that the home chapter is wrong (§16.3).

**What this chapter is not.** It is not a new source of requirements — every `BR-<nnn>` below traces to at least one existing `FR-*`/`NO-*` (or, for the small number of informally-stated rules this pass promotes to a first formal id, to the specific prose location cited). It is not a UI/screen spec (Chapter 18, `[DRAFTED]`) or a data-contract spec (Chapter 17, `[DRAFTED]`) — a business rule here states *what shall or shall not happen*, not *what a screen looks like* or *what a field's shape is*. It does not re-derive Given/When/Then acceptance criteria per rule (each rule's home chapter already carries its own AC blocks); it references the home AC block instead of duplicating it.

### 16.1 Top-priority hard constraints (quick reference)

Per this Volume's Precedence rule (§0.4), the following constraints are the ones no future chapter, feature, or engineering shortcut may relax without the named separately-governed decision. They are restated in full in their category tables below (§16.2); this table exists only so a reader does not have to scan all 85 entries to find the handful that gate everything else.

| BR-ID | Constraint | Category |
| --- | --- | --- |
| BR-001 | HITL is mandatory: no autonomous clinical decision (diagnosis, prescribing, dose change, care-plan finalization) without explicit human clinician review | Safety/HITL |
| BR-027 | No auto-prescribe: the platform shall never generate an executable prescription or an auto-applied dose change | Clinical Actions |
| BR-043 / BR-059 / BR-081 | No auto EHR write: no twin output, no Patient Intelligence output, and no workspace panel may write live to the EHR | Twin / Patient App / Interop |
| BR-076 | `liveEmis:false` remains hard, code-enforced, in every environment until a separately governed decision changes it | Demo vs Live |
| BR-068 | `autoRetrain:false`: no code path anywhere in the continuous-learning loop can set `autoRetrainTriggered`/`modelUpdated` to `true` | Learning/ML |
| BR-040 | No fake or implied certification (UKCA/MHRA/DCB0129/DCB0160/DTAC/CIS2 or equivalent) | Diabetes/Medication (restates NO-6 platform-wide) |
| BR-034 | Insulin/GLP-1 null locks: `doseChangeRecommendation` and `prescribingRecommendation` remain hard `null` types | Diabetes/Medication |
| BR-056 / BR-044 | Patient no-stop-insulin: no patient-facing surface may accept a self-prescribe/dose-change/stop-insulin request, and no "stop insulin" twin scenario runs without prior clinician engagement | Patient App / Twin |

### 16.2 Rule catalogue by category

Each entry states: **BR-ID** · **Statement** (shall/shall not) · **Priority** (`HARD` — absolute, requires a named governed decision to relax; `MUST` — mandatory for the current scope, no relaxation path assumed) · **Origin** (the chapter FR/NO/OQ id this restates) · **Enforcement note** (how it is or should be enforced — code/type-lock, process, or architecture) · **Phase** (`now` — binding today; `v1` — binding once a named near-term item lands; `future` — binding only if/when a later-phase capability is separately commissioned).

#### 16.2.1 Safety / HITL

| BR-ID | Statement | Priority | Origin | Enforcement | Phase |
| --- | --- | --- | --- | --- | --- |
| BR-001 | The platform shall not make an autonomous clinical decision (diagnosis, prescribing, dose change, or care-plan finalization) without a human clinician's explicit review and decision. | HARD | NO-1, FR-HITL-009 | Process (Accept/Edit/Reject) + type-lock (no code path bypasses `ACCEPTED`/`completed` without a recorded actor) | now |
| BR-002 | Every clinical-facing AI output shall pass the item-level disposition gate (Accept/Edit/Reject) before it can be staged or treated as final. | MUST | §5.2.1, FR-HITL-008 | Code (`lib/clinical-spine/queue-decision.ts`, `ReviewQueueItemStatus`) | now |
| BR-003 | A case shall not be treated as finalization-ready while any case-level gate (`red_flag_escalation`/`referral_pathway`/`medication_decision`) remains at `required` status. | HARD | FR-HITL-008 | Code (`FinalizationState`) | now |
| BR-004 | No case-level gate shall auto-resolve to `completed` based on elapsed time, queue pressure, or any heuristic. | HARD | FR-HITL-012 | Process + code (no timer-based transition exists) | now |
| BR-005 | Only the accountable clinical persona for a draft type may action its HITL gate/disposition; non-clinical personas (`practice-manager`, `ics-lead`, `hospital-executive`, `researcher`) are barred, including in an "admin convenience" capacity. | HARD | FR-HITL-013, FR-PER-009 | Type-lock (permission matrix) — see BR-015 for its current honest-enforcement gap | now |
| BR-006 | Every case-level gate decision, item-level disposition, learning-event capture, and governed-evaluation submission shall generate an append-only SHIELD audit event. | HARD | FR-HITL-014/015 | Code (SHIELD hash-linked chain, `aksh.shield_audit_events`) — best-effort-write gap tracked at OQ-HITL-2 (§16.4) | now |
| BR-007 | Every SHIELD audit event shall carry a content hash computed over its own fields plus the previous event's id, so tampering with any historical event is detectable. | MUST | FR-HITL-016 | Code | now |
| BR-008 | The full honesty-field set (`ehrWrite`, `hitlRequired`, `physiologicalTwin`, `autoRetrain`, `liveEmis`) shall be attached as literal typed fields to every orchestration result and persisted unchanged into the audit trail. | HARD | FR-HITL-006 | Type-lock (`ClinicalSpineOrchestrateResult`) | now |
| BR-009 | A twin/simulation output that does not honestly declare `physiologicalTwin:false` and `simulationMode:"synthetic_rules"` is a release-blocking defect, not a shippable caveat. | HARD | FR-HITL-007 | Code (`runClinicalSpineOrchestrate` runtime throw) | now |
| BR-010 | No step, journey, or surface shall present an AI-generated draft as "complete" or "actioned" absent a recorded human decision (Accept/Edit/Reject/Defer, a gate confirmation, or an accept/dismiss at population scale). | HARD | BO-4, FR-FLOW-042 | Process (design constraint on every future screen/journey) | now |
| BR-011 | A journey's or workflow's honesty-field set shall be internally consistent across every one of its steps; no step may contradict another step's honesty fields for the same underlying result. | MUST | FR-HITL-006, FR-FLOW-043 | Process (code review) | now |

#### 16.2.2 Identity / Access

| BR-ID | Statement | Priority | Origin | Enforcement | Phase |
| --- | --- | --- | --- | --- | --- |
| BR-012 | Every clinical-record-bearing API response shall be scoped to the requesting practice (tenant isolation) and, for the `patient` persona, to their own bound `patientId` only. | HARD | FR-PER-006 | Code (`lib/clinical-proof/tenant-isolation.ts`) | now |
| BR-013 | Tenant isolation shall apply identically across every product layer (core clinical records, Population aggregates, Disease Intelligence signals, Research exports) — no layer implements its own bespoke scoping. | MUST | FR-ARC-006, FR-ARC-031 | Code (shared check, not per-layer) | now |
| BR-014 | Cross-practice SHIELD audit reads shall be denied by the same tenant-isolation mechanism that governs clinical-record reads. | MUST | FR-HITL-017 | Code | now |
| BR-015 | `productionRbacEnforced:false` shall remain an honest, literal current-state field and shall not be silently promoted to `true` outside a named engineering workstream with Architecture + Product sign-off. | HARD (honesty) | §3.5 current-state note, OQ-PER-4, OQ-CORE-1 | Code literal (`lib/permission-matrix.ts`) + process | now (target: future, gated) |
| BR-016 | No non-accountable persona (Practice Manager/Admin, ICS Lead, Hospital Executive, Researcher) may clear any HITL gate or access an individual-patient Accept/Edit/Reject control, in any workspace or journey. | HARD | FR-HITL-013, FR-PER-009, NO-CLIN-7, NO-FLOW-6 | Type-lock (permission matrix) | now |
| BR-017 | A demo-reset action shall never be capable of affecting another practice's tenant-scoped data. | MUST | FR-FLOW-034 | Code | now |
| BR-018 | A destructive operation (e.g. demo-reset) shall not silently discard another user's in-progress, unsaved clinical disposition without a warning. | MUST | FR-HITL-034, EC-FLOW-5 | Process/UX (exact handling deferred to Chapter 18) | v1 |

#### 16.2.3 Consent / Privacy

| BR-ID | Statement | Priority | Origin | Enforcement | Phase |
| --- | --- | --- | --- | --- | --- |
| BR-019 | No capability shall use patient data for a given purpose without an active consent grant scoped to both the specific `purposeCode` and the specific modality being used. | HARD | FR-CORE-008 | Code (`isModalityGranted`) | now |
| BR-020 | Consent grants are additive: a new grant for the same `purposeCode` does not silently invalidate an earlier grant unless it explicitly carries a `revokeGrantId` for that earlier grant. | MUST | §6.7-EC-5 | Code | now |
| BR-021 | A revoked consent grant shall be audited with `revokedAt`/`revokedBy` using the existing `ConsentGrant` shape — no bespoke audit shape for revocation. | MUST | FR-PER-012, AC-PER-012-2 | Code | now |
| BR-022 | Granting one consent purpose (e.g. `coaching_wellness`) does not implicitly grant another (e.g. `population_analytics`); each purpose is independently, explicitly granted. | HARD | FR-PAT-042, FR-POP-033 | Code/process | now |
| BR-023 | A patient whose `clinical_research_deidentified` grant is revoked shall be excluded from any subsequent research-dataset construction or evaluation-artifact generation. | HARD | FR-RES-032 | Code/process | now |
| BR-024 | No capability, present or future, shall auto-enroll, auto-recruit, or auto-contact a patient for a trial, study, or federated-research cohort without that patient's explicit, purpose-specific, revocable consent recorded **before** the action. | HARD | NO-RES-2 | Process | now / future |
| BR-025 | A minimum-cell-size (k-anonymity-style) suppression threshold shall be applied to every population aggregate output before display; the requirement to suppress is not optional even though the exact numeric threshold is not yet fixed. | HARD (requirement) / OPEN (threshold) | FR-ARC-033, FR-POP-031, OQ-ARC-2 / OQ-POP-1 | Code (mechanism), pending threshold decision | now (mechanism) / blocks pilot until threshold set |
| BR-026 | No Population Intelligence surface shall expose a patient-identifiable value in an aggregate response, regardless of the underlying segment's size. | HARD | NO-POP-5 | Code | now |

#### 16.2.4 Clinical Actions

| BR-ID | Statement | Priority | Origin | Enforcement | Phase |
| --- | --- | --- | --- | --- | --- |
| BR-027 | The platform shall never generate an executable prescription or an auto-applied dose change; any medication- or dose-related output is a draft for clinician review only. | HARD | NO-2, FR-HITL-010 | Type-lock | now |
| BR-028 | A `medication_decision` gate confirmation shall never itself constitute an executable dose or prescription change — it records a clinical judgment on a draft, not a prescribing transaction. | HARD | NO-2, §5.2.4 | Process/code | now |
| BR-029 | The platform shall not surface a clinical-facing risk score, safety flag, or recommendation that cannot be traced to stated inputs, rules, or evidence, regardless of the model's accuracy. | HARD | NO-7 | Process/design | now |
| BR-030 | A disease module (Diabetes or any future module) shall not introduce its own orchestrator, audit trail, or authentication/authorization system; it reuses CONDUCTOR, SHIELD, and the existing identity/consent primitives. | HARD | NO-8, NO-DIAB-6 | Architecture | now |
| BR-031 | No agent shall produce a side effect (a write, a third-party notification, a queued external action) that a clinician did not either trigger or subsequently accept. | HARD | NO-AGT-3 | Code | now |
| BR-032 | No agent shall dynamically alter CONDUCTOR's orchestration order or decide to skip another agent at runtime; any change to review order/which agents run is a reviewed code change. | HARD | NO-AGT-4, FR-AGT-002 | Process (code review, Chapter 5 §5.9) | now |
| BR-033 | A causal-hypothesis or explainability output shall never be presented as more certain than its actual source (a rules-based list, a stub, a model score). | HARD | NO-CLIN-6 | UI/process | now |

#### 16.2.5 Diabetes / Medication

| BR-ID | Statement | Priority | Origin | Enforcement | Phase |
| --- | --- | --- | --- | --- | --- |
| BR-034 | `doseChangeRecommendation` (Insulin) and `prescribingRecommendation` (GLP-1) shall remain hard `null` literal types for the entire lifetime of this module unless a dedicated, separately-reviewed spec change with clinical sign-off explicitly authorizes otherwise. | HARD (single most safety-sensitive rule in the module) | NO-DIAB-2, FR-DIAB-029/033 | Type-lock | now |
| BR-035 | No silent or automatic insulin/GLP-1 dose or prescribing change shall occur, ever, at any phase. | HARD | NO-DIAB-2 | Type-lock | now |
| BR-036 | A future governed-model enhancement to `sensitivityEstimate`'s explanatory quality may not begin producing a dose value; that would be a scope change requiring a new Volume-level requirement, not a model upgrade. | HARD | §8.6.3 (FR-DIAB-029 elaboration) | Process/governance | future (blocked) |
| BR-037 | Insulin/GLP-1/Complications referral triggers reuse the `medication_decision`/`referral_pathway` gates; no new `HumanGateId` is introduced without explicit clinical-lead sign-off. | MUST | NO-DIAB-7, OQ-DIAB-2 | Process (a new gate type is a `lib/types.ts` change requiring sign-off) | now (OQ-DIAB-2 open) |
| BR-038 | Every coaching-pattern output (Nutrition, Exercise, Behaviour) shall carry `isClinicalAdvice:false` with explicit disclaimers. | HARD | NO-DIAB-4 | Type-lock | now |
| BR-039 | The Diabetes module shall not change the Track A/B demo-vs-live split; it ships as synthetic-cohort, review-first, on the same boundary as the rest of the product. | MUST | NO-DIAB-5 | Process | now |
| BR-040 | No new regulatory or safety certification (UKCA/MHRA/DCB0129/DCB0160/DTAC/CIS2 or equivalent) shall be claimed, implied, or allowed to be implied by marketing/sales material — restated platform-wide, not only for Diabetes. | HARD | NO-6, NO-DIAB-5 | Process (marketing/compliance review) | now |
| BR-041 | Prevention Intelligence shall remain a rules-based composite summary, not a simulation, for the entire v0/v1 lifetime of this module (`physiologicalTwin:false`). | HARD | FR-DIAB-046 | Type-lock (`DIABETES_SIGNAL_HONESTY`) | now |

#### 16.2.6 Twin

| BR-ID | Statement | Priority | Origin | Enforcement | Phase |
| --- | --- | --- | --- | --- | --- |
| BR-042 | No physiological simulation (glucose-insulin dynamics, PK/PD modeling, or any coupled-variable projection) exists or is requested to be built by the current or near-term phase; `physiologicalTwin:false` holds throughout. | HARD | NO-TWIN-1 | Type-lock | now / future (gated) |
| BR-043 | No twin output, at any phase, shall auto-apply an intervention to a care plan, a prescription, or the EHR; `ehrWrite:false` and `planPromotionRequiresHitl:true` hold without exception. | HARD | NO-TWIN-2 | Type-lock | now |
| BR-044 | No patient-initiated "stop insulin" (or equivalent safety-critical medication-cessation) scenario shall ever run without prior clinician engagement via the `medication_decision` gate — an absolute prohibition, not a phase boundary, and it does not sunset in any future phase. | HARD (single highest-severity rule in the Twin chapter) | NO-TWIN-3, FR-TWIN-024/030 | Code (hard gate; result withheld until gate clears) | now |
| BR-045 | No twin score, at any phase, shall be presented as a statistically validated, NHS-outcome-calibrated probability; scores remain rules-based/rehearsal-grade until a specific, separately-governed clinical validation exercise says otherwise. | HARD | NO-TWIN-4 | UI/process | now |
| BR-046 | The `physiologicalTwin` flag shall never flip from `false` to `true` as a side effect of an unrelated code, config, or feature-flag change; any pull request or migration changing this literal requires Clinical Safety Lead review as a named, visible line in that change. | HARD | FR-TWIN-016/017 | Process (code-review gate) | now / future |
| BR-047 | No live CGM, wearable, or pharmacy-adherence stream shall feed the twin at any specified phase; all inputs are fixture data, wired module signals, or explicit user-entered scenario parameters. | MUST | NO-TWIN-6, FR-TWIN-009 | Code | now |
| BR-048 | No scenario shall ever be run at a population level or against a hypothetical average patient; every invocation is bound to one specific `patientId`. | MUST | NO-TWIN-7, FR-TWIN-013 | Code | now |
| BR-049 | No twin scenario result of any kind shall be reachable from a patient-facing session, at any step of any journey — an absolute, structural (not merely policy-level) exclusion. | HARD | NO-TWIN-3, NO-PAT-1, FR-FLOW-036 | Architecture (no route/panel exists on the patient surface) | now |

#### 16.2.7 Population

| BR-ID | Statement | Priority | Origin | Enforcement | Phase |
| --- | --- | --- | --- | --- | --- |
| BR-050 | No live write-back to a population-level operational system (EMIS/SystmOne, a national system, a staffing/outreach system) exists or is requested. | MUST | NO-POP-1 | Architecture | now |
| BR-051 | No diabetes-specific population segment, prediction, or recommendation shall be claimed to exist in code today. | MUST (honesty) | NO-POP-4, FR-POP-022 | Process | now |
| BR-052 | Every Segment/Predict/Recommend/Monitor output shall carry the same model-honesty field set already defined on `PopulationRiskState` (`physiologicalTwin:false`, `simulationRanking:false`, `hitlRequired:true`, `ehrWrite:false`). | HARD | FR-POP-011 | Type-lock | now |
| BR-053 | Every Segment computation shall apply the existing tenant-isolation filter (`filterRecordsForPractice`) before any aggregation runs. | HARD | FR-POP-008, FR-ARC-031 | Code | now |
| BR-054 | No new `HumanGateId` and no new tenant-isolation mechanism shall be introduced for Population Intelligence; it reuses the existing gate catalogue and `filterRecordsForPractice` check. | MUST | NO-POP-6 | Architecture | now |
| BR-055 | No "employer" population-consumer persona or surface shall be built absent a separate, explicit product decision. | MUST | NO-POP-7, FR-POP-028 | Process | future (open decision) |

#### 16.2.8 Patient App

| BR-ID | Statement | Priority | Origin | Enforcement | Phase |
| --- | --- | --- | --- | --- | --- |
| BR-056 | No patient-facing surface shall ever accept a medication self-prescribe, dose-change, or stop-medication (including insulin) request — an absolute, non-phased prohibition. | HARD (top-priority) | NO-PAT-1, FR-PAT-024 | Type-lock + architecture (no such route exists) | now |
| BR-057 | No coaching draft or education content is, or shall ever be presented as, clinical advice. | HARD | NO-PAT-5 | Type-lock (`isClinicalAdvice:false`) | now |
| BR-058 | No patient-facing Diabetes Twin scenario beyond the Chapter 9-cleared self-service subset is authorized. | HARD | NO-PAT-6, FR-PAT-035 | Architecture | now |
| BR-059 | No auto-EHR-write, auto-care-plan-write, or autonomous action shall result from any Patient Intelligence capability; every output remains either a HITL-gated draft or a view-only display. | HARD | NO-PAT-7 | Type-lock (`ehrWrite:false`) | now |
| BR-060 | No Gamification, Goal-tracking, or Family/caregiver-access feature is built — recorded as an explicit non-goal, not a silent omission. | MUST (honesty) | NO-PAT-4 | Process | now / future |
| BR-061 | No patient-facing voice interface exists, or is authorized to be built, under current scope. | MUST | NO-PAT-3 | Process | now |

#### 16.2.9 Research

| BR-ID | Statement | Priority | Origin | Enforcement | Phase |
| --- | --- | --- | --- | --- | --- |
| BR-062 | No output of the "biomarker-lite" helper, or any future extension of it, shall ever be presented as a clinically validated, discovered, or novel biomarker. | HARD | NO-RES-1 | UI/process | now |
| BR-063 | No federated-research job, evaluation-harness run, or future Research Intelligence capability shall trigger a model or scoring-rule update on any live clinical agent. | HARD | NO-RES-3, FR-HITL-011/029 | Architecture | now |
| BR-064 | No live external research-API integration (literature/PubMed-style, trial-registry, external biomarker database) is built or requested absent a separately governed ADR decision. | MUST | NO-RES-4 | Process | future |
| BR-065 | No patient-level data shall ever leave the platform via a federated-research job; `patientLevelExport:false` is an absolute, non-phased rule. | HARD | NO-RES-6 | Type-lock | now |
| BR-066 | No Research Intelligence capability shall claim ATLAS is live; it remains Phase 2, `live:false`, for the duration this Volume is in effect. | MUST (honesty) | NO-RES-7, FR-AGT-033 | Process | now |
| BR-067 | No live, two-way navigational connection between the Clinical Intelligence workspace and any Research Intelligence surface is built or requested; the boundary remains an offline, one-directional export pipeline. | MUST | NO-RES-5, NO-CLIN-5 | Architecture | now |

#### 16.2.10 Learning / ML

| BR-ID | Statement | Priority | Origin | Enforcement | Phase |
| --- | --- | --- | --- | --- | --- |
| BR-068 | No code path anywhere in the continuous-learning loop shall be capable of setting `autoRetrainTriggered` or `modelUpdated` to `true` — an architectural absence, not merely a default value. | HARD (single most important guarantee in Chapter 14) | NO-LEARN-1, FR-LEARN-025/026 | Type-lock + architecture | now |
| BR-069 | `autoRetrainTriggered`, `modelUpdated`, `ehrWrite`, and `hitlRequired` shall remain hard-coded as literal SQL constants at the Postgres insert itself, not merely an application-level default — this stronger guarantee shall be preserved in any future persistence-layer refactor. | HARD | FR-LEARN-006 | Code (DB-level literal) | now |
| BR-070 | No learning event, once persisted, shall ever be updated or deleted; a correction is a new, append-only event. | HARD | NO-LEARN-2, FR-LEARN-007 | Architecture (no PUT/PATCH/DELETE exposed) | now |
| BR-071 | No governed-evaluation approval, however fully signed, shall itself execute a release; gate-signing and release execution remain two separate human actions. | HARD | NO-LEARN-3, FR-LEARN-024 | Process | now |
| BR-072 | No disease module, agent, or future platform capability shall introduce its own learning-event schema, outcome-capture endpoint, or governed-evaluation path. | MUST | NO-LEARN-4, FR-LEARN-033 | Architecture | now |
| BR-073 | No marketing, product, or in-app copy shall describe the platform as "self-learning," "auto-improving," or an equivalent phrase implying unsupervised improvement. | HARD | NO-LEARN-5, FR-LEARN-002 | Process (copy review) | now |
| BR-074 | No eval-harness pass result shall be presented, on any surface, as a clinical validation certificate or a substitute for the G-ML-1/2/3 sequence. | HARD | NO-LEARN-6, FR-LEARN-017 | UI/process | now |
| BR-075 | A future twin rule-weight adjustment or disease-module model swap shall satisfy the full G-ML-1/2/3 sequence with no expedited path on the theory that it is "just a number." | HARD | NO-LEARN-7, FR-LEARN-031/034, FR-TWIN-034, FR-POP-020 | Process | now / future |

#### 16.2.11 Demo vs Live

| BR-ID | Statement | Priority | Origin | Enforcement | Phase |
| --- | --- | --- | --- | --- | --- |
| BR-076 | `liveEmis:false` and `liveWriteBack:false` shall remain hard, code-enforced values in every environment until a separately governed decision explicitly changes them, with named regulatory, contractual, and technical sign-off. | HARD (top-priority) | NO-4, FR-HITL-023, FR-ARC-035, FR-CORE-026 | Type-lock, rejected at the API layer | now |
| BR-077 | `liveEmis:false`, `autoRetrain:false`, and `productionRbacEnforced:false` shall remain visible, accurate, and unconditional across every journey's honesty-field emissions for the duration this Volume is in effect. | HARD | FR-FLOW-032 | Type-lock | now |
| BR-078 | The platform shall not ingest, process, or display real (non-synthetic, non-explicitly-pilot-consented) patient data under this Volume's current scope; any transition is a separate, explicitly governed decision. | HARD | NO-9 | Process/governance | now |
| BR-079 | No environment variable or configuration path shall silently flip the `liveEmis`/`liveWriteBack` defaults. | HARD | FR-HITL-023 | Code review | now |
| BR-080 | Every journey's current-state honesty label (`[LIVE]`/`[PARTIAL]`/`[FUTURE]`) shall be re-verified, not copy-pasted forward, at the next revision following any change to an underlying chapter it depends on. | MUST | FR-FLOW-046 | Process (revision discipline, §0.7) | now |

#### 16.2.12 Interop / EHR

| BR-ID | Statement | Priority | Origin | Enforcement | Phase |
| --- | --- | --- | --- | --- | --- |
| BR-081 | The platform shall not position itself, or be built, as a replacement for a practice's EHR/EMR system of record; it is an intelligence layer alongside the EHR, not a competing record system. | HARD | NO-3, NO-CLIN-1 | Architecture / product framing | now |
| BR-082 | `liveEmis:false`/`liveWriteBack:false` shall remain the default and, for this Volume's scope, the only operative state for every EMIS/SystmOne-adjacent adapter. | HARD | FR-ARC-035 | Code | now |
| BR-083 | Medplum sync shall remain off by default; its rehearsal mode shall never be confused with EMIS/SystmOne write-back — `getMedplumRehearsalStatus().liveEmis` reads `false` unconditionally. | HARD | FR-CORE-019 | Code (literal) | now |
| BR-084 | No live coded-terminology server (SNOMED/ICD-10/LOINC/RxNorm), vector/embedding store, HL7v2 feed, or pharmacy adapter exists; each remains phase-gated on a named future trigger. | MUST (honesty) | §6.4/§6.5 findings | Process | future |
| BR-085 | BRIDGE's staging output shall carry `liveEmis:false` and `ehrWriteAttempted:false` unconditionally in this build. | HARD | FR-AGT-031 | Type-lock | now |

### 16.3 Conflict resolution

- **BR-CR-1 (hard constraints win).** Restating this Volume's own Precedence rule (§0.4) at the business-rule-catalogue level: if any future chapter, feature specification, design decision, or piece of code appears to contradict a `HARD`-priority rule in §16.2 (and, without exception, any rule listed in §16.1), the hard constraint wins. The conflicting chapter, spec, or code is the thing that must be corrected — this catalogue does not get quietly narrowed to match what was actually built.
- **BR-CR-2 (escalation, not silent resolution).** A discovered conflict between code and this catalogue shall be escalated to the Clinical Safety Lead (for any rule touching HITL, medication, twin, or patient-safety categories, §16.2.1/16.2.4/16.2.5/16.2.6/16.2.8) or to Architecture + Product (for any rule touching identity/access, interop, or demo-vs-live categories, §16.2.2/16.2.11/16.2.12) before the conflicting code path ships or continues shipping. It is not resolved by an engineer's unilateral judgment call, and it is not resolved by simply deleting or softening the catalogue entry.
- **BR-CR-3 (catalogue vs. home chapter).** Where this catalogue's restatement of a rule appears to differ in scope or wording from its home chapter's own `FR-*`/`NO-*` statement, the home chapter's statement is authoritative (this catalogue is a consolidation, not a second, competing source of truth) — the discrepancy is a documentation defect in this chapter to be corrected at the next revision, per §16.4's first open question.
- **BR-CR-4 (`MUST` vs `HARD`).** A `MUST`-priority rule may, in principle, be relaxed by a named, documented product decision without rising to the same governance bar as a `HARD` rule (which requires the specific named sign-off its origin chapter states — e.g. regulatory/contractual/technical sign-off for `liveEmis`, Clinical Safety Lead sign-off for a new `HumanGateId`). A `MUST` rule is not, however, optional by default; it is relaxed only by an explicit decision, never by omission.
- **BR-CR-5 (no rule expires by silence).** No rule in this catalogue lapses, weakens, or is superseded merely because a later chapter does not repeat it. Every `FR-*`/`NO-*` id cited as an origin in §16.2 remains independently binding in its home chapter regardless of this catalogue's existence; this chapter is an index, not a replacement.

### 16.4 Open questions that block rule finalization

- **OQ-BR-1.** This chapter promotes several previously prose-only or single-mention constraints to a first formal `BR-<nnn>` id (e.g. BR-036, BR-084) without a dedicated review pass confirming no home-chapter nuance was lost in the restatement. Confirm each `BR-<nnn>` entry against its cited origin at the next revision before this catalogue is treated as authoritative for engineering sign-off. **Owner:** Product + the relevant home-chapter owner.
- **OQ-BR-2 (restates OQ-HITL-2).** `persistShieldAuditEvent`'s best-effort write (Chapter 5, §5.4) means BR-006's "every disposition generates an audit event" guarantee can currently be violated silently on a Postgres failure. This catalogue does not resolve whether the fix is a hard failure on the clinical action or a durable retry/outbox mechanism — that decision remains Chapter 5's to make. **Owner:** Clinical Safety Lead + Engineering.
- **OQ-BR-3 (restates OQ-ARC-2/OQ-POP-1).** BR-025's suppression *requirement* is fixed, but its numeric k-anonymity/small-cell threshold is not. This catalogue cannot mark BR-025 as fully closed until that threshold is set. **Owner:** Clinical Safety Lead + Compliance + Architecture.
- **OQ-BR-4 (restates OQ-DIAB-2/OQ-HITL-1).** BR-037's gate-reuse default (Insulin/GLP-1 route through `medication_decision`) is provisional pending a clinical-lead decision on whether a dedicated `insulin_dose_confirmation`-style gate is warranted instead. **Owner:** Clinical Safety Lead.
- **OQ-BR-5 (restates OQ-PER-4/OQ-CORE-1).** BR-015's target state (`productionRbacEnforced:true`) has no committed workstream or timeline yet; this catalogue records the honest gap but does not itself schedule the work. **Owner:** Architecture + Engineering.
- **OQ-BR-6 (restates OQ-LEARN-2).** BR-053's tenant-isolation guarantee is confirmed for Population Intelligence's Segment stage but not yet confirmed for `submitGovernedEvaluation`'s `learningEventIdsReviewed` cross-tenant check (Chapter 14, EC-LEARN-2) — this catalogue flags the gap rather than asserting the check exists. **Owner:** Engineering + Clinical Safety Lead.
- **OQ-BR-7.** This chapter does not attempt to assign a single owning team/role to every one of the 85 rules in §16.2 (only to the open questions above) — confirm whether a per-rule ownership column should be added at the next revision, or whether category-level ownership (mirroring §16.4's per-question owners) is sufficient for engineering sign-off purposes. **Owner:** Product.
- **OQ-BR-8.** Confirm whether this catalogue should be extended, at the next revision, with a machine-readable export (e.g. a JSON/YAML manifest of `BR-<nnn>` → priority → enforcement-type) so a CI check could someday assert a `HARD`-priority rule's type-lock is actually present in code, rather than this catalogue remaining prose-only. This chapter does not implement such tooling and does not assume it will exist. **Owner:** Engineering + Architecture.

### 16.5 Cross-references

- Chapter 1 (§1.4 NO-1–NO-10) — the ten platform-level Non-Objectives this catalogue's Safety/HITL, Clinical Actions, Learning/ML, Demo vs Live, and Interop/EHR categories restate by id throughout (NO-1, NO-2, NO-3, NO-4, NO-5, NO-6, NO-7, NO-8, NO-9).
- Chapter 3 (§3.5/§3.6 auth/authz, tenant isolation, FR-PER-006/009/012) — the origin of every Identity/Access and Consent/Privacy rule in §16.2.2/16.2.3.
- Chapter 5 (§5.2 gate catalogue, §5.3 FR-HITL-009–013, §5.4 SHIELD FR-HITL-014–017, §5.6 FR-HITL-006/007, OQ-HITL-1/2/3) — the origin of every Safety/HITL rule in §16.2.1, and the gate-reuse rules restated across §16.2.5/16.2.6/16.2.7.
- Chapter 4 (§4.6 FR-ARC-006/031/033, §4.8 FR-ARC-035, OQ-ARC-2) — the origin of the tenant-isolation and k-anonymity rules (BR-013, BR-025, BR-053) and the `liveEmis` architecture-level rules (BR-082).
- Chapter 6 (§6.2 FR-CORE-008/019/026) — the origin of the consent-grant and Medplum/EMIS-adapter rules (BR-019, BR-083).
- Chapter 7 (§7.1/§7.2 NO-AGT-1–5, FR-AGT-011/031) — the origin of the per-agent Clinical Actions rules (BR-030–BR-032, BR-085).
- Chapter 8 (§8.6/§8.9 NO-DIAB-1–7, FR-DIAB-029/033/046) — the origin of every Diabetes/Medication rule in §16.2.5.
- Chapter 9 (§9.4/§9.11 NO-TWIN-1–7, FR-TWIN-016/017/024/030/034) — the origin of every Twin rule in §16.2.6.
- Chapter 10 (§10.11/§10.14 NO-POP-1–7, FR-POP-008/011/020/031) — the origin of every Population rule in §16.2.7.
- Chapter 11 (§11.7/§11.14 NO-PAT-1–7, FR-PAT-024/035/042) — the origin of every Patient App rule in §16.2.8.
- Chapter 12 (§12.9 NO-CLIN-1–7, FR-CLIN-006) — the origin of BR-081, BR-016, and BR-033.
- Chapter 13 (§13.6/§13.9 NO-RES-1–7, FR-RES-031/032) — the origin of every Research rule in §16.2.9.
- Chapter 14 (§14.6/§14.10 NO-LEARN-1–7, FR-LEARN-006/025/026) — the origin of every Learning/ML rule in §16.2.10.
- Chapter 15 (§15.10 FR-FLOW-032/034/041–046, §15.11 NO-FLOW-1–7) — the cross-journey restatements this catalogue further consolidates (BR-010, BR-011, BR-017, BR-077, BR-080).
- Chapter 17 (Data Expectations, `[DRAFTED]`) — where a business rule in this catalogue implies a data-shape or schema constraint (e.g. BR-034's `null`-type lock, BR-052's honesty-field set), Chapter 17 specifies that constraint's exact data contract (entity, attribute, sensitivity/retention tier) rather than restating it here.
- `docs/ADR_TECH_STACK_MODERNIZATION.md`, `docs/GOVERNED_MODEL_RELEASE_SOP.md`, `docs/CONTINUOUS_LEARNING.md`, `docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md`, `docs/BUILT_VS_REMAINING_AUDIT.md` — the engineering/governance source documents several `HARD`-priority rules (BR-030, BR-068–075, BR-076, BR-034/035) trace to alongside their Volume I chapter.

---

## 21. Chapter 17 — Data Expectations `[DRAFTED]`

### 17.0 Purpose of this chapter

Chapters 1–16 have each referenced product data by name — `ConsentGrant`, `LearningEvent`, `HumanGateDecision`, `PopulationRiskState`, `DiabetesGlucoseReading`, and the rest — wherever a requirement needed to point at "the thing that carries this information," without stopping to specify that thing's shape, source, or sensitivity in one place. This chapter is that place. It answers, at product-contract depth, three questions for every entity the platform requires, produces, or retains: **what is it, where does it honestly come from, and how sensitive/how long-lived is it.**

**What this chapter is.** A product-level data dictionary: an entity catalogue (§17.2) stating each entity's purpose, key attributes (required vs optional), source, and a sensitivity/retention classification (§17.1) — plus the cross-cutting rules that govern *all* entities regardless of type: provenance/lineage (§17.4), quality/honesty (§17.5), demo-vs-live (§17.6), and interop payload shape (§17.7).

**What this chapter is not** (see also §17.8 Non-goals). It is not a database schema. It does not propose Postgres DDL, ClickHouse table definitions, Neo4j node/relationship labels, or JSON Schema/Zod validators — those are engineering-volume artifacts that must satisfy this chapter's contracts without this chapter dictating their physical form (restating the Volume's own product-vs-engineering boundary, §0.4). It does not invent new entities: every entity below either already exists in code (with a file:line origin cited) or is explicitly marked as a required-but-currently-absent shape (the diabetes glucose/CGM gap, §17.3, being the clearest example). It does not re-derive Chapter 16's business rules; where a `BR-<nnn>` implies a data-shape constraint, this chapter states that constraint as the entity's own attribute or classification and cites the `BR-<nnn>` as origin, per Chapter 16 §16.5's own forward pointer.

### 17.1 Data classification scheme (sensitivity & retention tiers)

Every entity in §17.2 is tagged with one of four tiers. The tiers are a product-level classification for reasoning about "how carefully must this be handled and for how long," not a DPIA or a specific retention-period schedule — the exact number of days/years per tier is explicitly left open (OQ-DATA-4) pending Compliance/DPO input, expected in a future Non-Functional Requirements or governance chapter (Chapter 19/22, both `[DRAFTED]`).

| Tier | Name | Description | Handling posture |
| --- | --- | --- | --- |
| **T1** | Direct Identifier | Data that on its own identifies a specific natural person (name, NHS number, date of birth, postcode). | Never leaves tenant/patient scope (BR-012); never appears in an aggregate or research-export entity (BR-025, BR-065). |
| **T2** | Clinical / Sensitive | Patient-linked clinical or consent data that is not itself a direct identifier but is sensitive by nature (diagnoses, medications, readings, drafts, gate decisions, consent purpose+modality). | Tenant/patient-scoped (BR-012); consent-gated per purpose+modality (BR-019); never fabricated when absent (§17.5). |
| **T3** | Derived / Decision-Support | Computed from T1/T2 inputs to support a decision — twin scenario results, population aggregates, learning events. | Carries the platform's honesty-field set (BR-008); aggregate-tier entities (PopulationAggregate) require minimum-cell suppression before display (BR-025, still pending its numeric threshold, OQ-POP-1). |
| **T4** | Audit / Governance | Records of what happened, for accountability rather than clinical use (SHIELD audit events, governed-evaluation records). | Append-only, never updated or deleted (BR-070); hash-chained where applicable (BR-007). |

- **FR-DATA-001.** The platform shall classify every product entity that carries patient-linked or clinically-derived information into exactly one of the four tiers in this section, and every future chapter or engineering spec introducing a new entity shall state its tier at the point of introduction.
- **FR-DATA-002.** A T1-classified attribute (direct identifier) shall never be copied into, or become derivable from, a T3 (aggregate) or T4 (audit) entity in identifying form — restating BR-025/BR-026/BR-065 as a cross-tier data-handling rule rather than three separate per-layer statements.
- **FR-DATA-003.** This Volume's data dictionary is only as accurate as the code it describes; a chapter or engineering spec finding that an entity's actual shape has drifted from this chapter's description shall treat that as a documentation defect in this chapter to correct at the next revision (restating Chapter 16's BR-CR-3 pattern), not as license to silently reinterpret the entity elsewhere.

### 17.2 Entity catalogue

Each entity below states: **Description** · **Key attributes** (✓ required, — optional) · **Source** (synthetic/user/device/FHIR/system-derived) · **Tier** (§17.1) · **Related FR/BR**.

#### 17.2.1 Patient

The subject of the platform's clinical, coaching, and population data — currently instantiated only as a member of the 100-patient synthetic demo cohort, never a real patient record.

| Attribute | Req? | Notes |
| --- | --- | --- |
| `id` | ✓ | Stable identifier within the tenant-scoped cohort. |
| `name`, `nhsNumber`, `dob`/`age`, `gender`, `postcode` | ✓ | T1 direct identifiers — synthetic values today, never real (BR-078). |
| `conditions[]`, `medications[]`, `allergies[]` | ✓ | T2 clinical summary. |
| `oracleScore`, `oracleRisk` | — | HORIZON-derived risk output, not a raw patient attribute. |
| `encounters[]`, `appointments[]` | — | Linked Encounter/Case references (§17.2.2). |
| `digitalTwinPrediction`, `vitals`, `clinicalProfiles`, `equity`/`imd`/`ics` fields | — | Precision-health/population enrichment fields, populated per module wiring. |

- **Source:** synthetic (`lib/mock-data/demo-cohort-generator.ts`, `DEMO_COHORT_PATIENT_TARGET = 100`) today; a future FHIR `Patient`-resource-backed projection is not built (§17.7).
- **Tier:** T1 (the entity as a whole is identifier-bearing even though every current instance is synthetic).
- **Related:** FR-PER-006/FR-ARC-006/031 (tenant isolation), BR-012/013, BR-078 (no real patient data).
- **FR-DATA-004.** Every Patient record's T1 fields shall be synthetic (demo cohort) or explicitly, separately governed pilot-consented data for the duration this Volume is in effect — restating BR-078 as this entity's own data-contract requirement.

#### 17.2.2 Encounter / Case

The unit of clinical work a clinician reviews: a `ReviewCase` wrapping one or more FHIR-lite resources (including an `EncounterResource`) plus its review state.

| Attribute | Req? | Notes |
| --- | --- | --- |
| `id`, `userId` | ✓ | Case identity and owning clinician. |
| `practiceId` | — | Tenant scope; absent only for not-yet-assigned cases. |
| `patientLabel` | ✓ | Display label, not a raw T1 identifier lookup. |
| `status` | ✓ | Review lifecycle state. |
| `draft` (`FhirBundleDraft`, §17.2.4) | ✓ | The staged clinical content under review. |
| `auditEvents[]` | ✓ | Linked ShieldAuditEvent references (§17.2.7). |
| `humanGateDecisions[]` | — | Linked GateDecision entries (§17.2.5); present once any case-level gate has fired. |
| `frozenArtifact` | — | Immutable post-finalization snapshot, present only after finalization. |

- **Source:** system-generated (CONDUCTOR orchestration) + user-edited (clinician draft edits and gate decisions).
- **Tier:** T2.
- **Related:** FR-HITL-008/009/012 (gate-before-finalization), BR-002/003/004.
- **FR-DATA-005.** A Case shall not be marked finalization-ready while any linked GateDecision remains at an unresolved status — restating BR-003 as this entity's own field-level constraint on `status` vs `humanGateDecisions`.

#### 17.2.3 ConsentGrant

The record of a patient's (or their delegate clinician's) explicit, purpose- and modality-scoped authorization for the platform to use their data.

| Attribute | Req? | Notes |
| --- | --- | --- |
| `id`, `patientId` | ✓ | Grant identity and subject. |
| `purposeCode` | ✓ | One of the platform's six defined purposes (`care_delivery`, `care_improvement`, `clinical_research_deidentified`, `population_analytics`, `coaching_wellness`, `risk_stratification_demo`). |
| `modalities[]` | ✓ | One or more of the platform's seven defined modalities (§17.3 lists them). |
| `status` | ✓ | Active/revoked state. |
| `grantedBy`, `grantedAt` | ✓ | Provenance of the grant itself. |
| `revokedAt`, `revokedBy` | — | Present only once revoked. |
| `revokeGrantId` (on the *input* that creates a revocation) | — | Points at the earlier grant being revoked — grants are additive, never destructively overwritten (BR-020). |
| `ehrWrite`, `hitlRequired` | ✓ | Honesty fields, hard `false`/`true` respectively. |

- **Source:** user (patient self-service or clinician-recorded-on-behalf-of action).
- **Tier:** T2 (governs access to other T2 data; the grant record itself is not a direct identifier but is sensitive metadata).
- **Related:** FR-CORE-008, BR-019/020/021/022/023/024.
- **FR-DATA-006.** No capability shall read or act on patient data for a purpose+modality combination without first checking for an active ConsentGrant covering exactly that combination — restating FR-CORE-008/`isModalityGranted` as this entity's own access-contract requirement, and BR-022 (purposes are independently granted, never implied).

#### 17.2.4 ClinicalDraft

The AI-drafted or clinician-edited bundle of clinical content staged for review — today represented as the `FhirBundleDraft` a Case's `draft` and (once finalized) `frozenArtifact` fields hold, rather than a separately named type in code.

| Attribute | Req? | Notes |
| --- | --- | --- |
| `resources[]` | ✓ | FHIR-lite resource entries (`EncounterResource`, `ObservationResource`, etc., §17.7). |
| Per-resource disposition state | ✓ | Accept/Edit/Reject at the item level (Chapter 5 §5.2.1), not a bundle-wide status. |
| `frozen` flag / equivalent | — | Distinguishes a still-editable draft from a post-gate immutable snapshot. |

- **Source:** agent-generated (CONDUCTOR + downstream agents), clinician-edited before disposition.
- **Tier:** T2.
- **Related:** FR-HITL-002/008, BR-002, BR-010 (never presented as "complete/actioned" absent a recorded decision).
- **FR-DATA-007.** A ClinicalDraft shall never be readable by, or surfaced to, any persona as though it were an already-finalized clinical record until its owning Case reaches a finalized status with all gates cleared — restating BR-010 at the entity level.
- **FR-DATA-008.** This Volume records, as an honest naming gap, that no single `ClinicalDraft` type exists in code today distinct from `FhirBundleDraft`/`frozenArtifact` — this section names the product concept; a future engineering pass may or may not introduce a matching type name (OQ-DATA-2).

#### 17.2.5 GateDecision

The record of a clinician's Accept/Edit/Reject or gate-clearance action on clinical content requiring human oversight.

| Attribute | Req? | Notes |
| --- | --- | --- |
| `id` (a `HumanGateId`: `red_flag_escalation` \| `referral_pathway` \| `medication_decision`) | ✓ | Which gate this decision resolves. |
| `status` | ✓ | `open` \| `confirmed` \| `not_applicable`. |
| `decidedAt`, `decidedBy` | — | Present once the gate has been actioned; absent while `open`. |
| `note` | — | Free-text clinician rationale. |

- **Source:** user (accountable clinician action only — BR-005/BR-016).
- **Tier:** T2 (clinical decision record; audit-critical).
- **Related:** FR-HITL-008/012/013, BR-003/004/005/016.
- **FR-DATA-009.** A GateDecision's `decidedBy` shall only ever record the accountable clinical persona for that case/draft type; no non-clinical persona's identifier is a valid value — restating BR-005/BR-016 as a field-level constraint.
- **FR-DATA-010.** No GateDecision shall transition to `confirmed`/`not_applicable` via a time-based or heuristic process — restating BR-004; `decidedAt`/`decidedBy` are always populated by an explicit human action, never a system default.

#### 17.2.6 LearningEvent

The append-only record of a clinician's disposition on an AI-generated prediction/recommendation, captured for the governed continuous-learning loop.

| Attribute | Req? | Notes |
| --- | --- | --- |
| `id`, `recordedAt` | ✓ | Event identity and timestamp. |
| `patientId`, `caseId`, `queueItemId`, `practiceId` | — | Linkage fields; not all are populated for every event type. |
| `agentLabel`, `predictionId` | ✓ | Which agent's output, and which specific prediction, this event concerns. |
| `decision`, `decisionActor` | ✓ | The clinician's disposition and who made it. |
| `outcome*` fields | — | Downstream outcome capture, where available. |
| `linksToEventId` | — | Chains a correction/follow-up event to its predecessor. |
| `autoRetrainTriggered`, `modelUpdated`, `ehrWrite` | ✓ | Hard-coded `false` — literal SQL constants at the insert itself, not an application default. |
| `hitlRequired` | ✓ | Hard-coded `true`. |

- **Source:** system-derived (captured automatically from a recorded clinician disposition — never a raw, separately-submitted data entry).
- **Tier:** T3 (derived/decision-support; feeds the learning loop rather than being consumed directly as a clinical record).
- **Related:** FR-LEARN-006/007, BR-068/069/070.
- **FR-DATA-011.** No field on a LearningEvent shall be updatable or deletable once persisted — restating BR-070; a correction is always a new event carrying `linksToEventId`.
- **FR-DATA-012.** `autoRetrainTriggered`/`modelUpdated`/`ehrWrite`/`hitlRequired` shall remain literal, non-parameterized constants at the persistence layer in any future storage refactor — restating BR-069 as this entity's own non-negotiable field-level contract.

#### 17.2.7 ShieldAuditEvent

The tamper-evident, hash-chained audit record generated for every gate decision, item disposition, learning-event capture, and governed-evaluation submission.

| Attribute | Req? | Notes |
| --- | --- | --- |
| `id`, `recordedAt` | ✓ | Event identity and timestamp. |
| `practiceId`, `caseId`, `queueItemId` | — | Tenant/case linkage; not all populated for every category. |
| `action`, `actor`, `agentLabel`, `category`, `label` | ✓ | What happened, who/what did it, and its classification. |
| `detail`, `resourceRef`, `payload` | — | Free-form and structured supporting content. |
| `prevEventId` | ✓ | The immediately preceding event in the tenant's audit chain. |
| `contentHash` | ✓ | Hash computed over this event's own fields plus `prevEventId`. |

- **Source:** system-generated only — never directly user- or agent-writable outside the platform's own audit-emission code path.
- **Tier:** T4.
- **Related:** BR-006/007/014.
- **FR-DATA-013.** Every ShieldAuditEvent's `contentHash` shall be computed over its own fields plus `prevEventId`, and no event shall be modifiable or deletable once persisted — restating BR-007/BR-006 as this entity's own field-level contract.
- **FR-DATA-014.** A ShieldAuditEvent shall never be readable across tenant boundaries — restating BR-014 (tenant isolation applies identically to audit reads as to clinical-record reads).

#### 17.2.8 PopulationAggregate

The cohort-level (never patient-level) output of the Population Intelligence Segment/Predict/Recommend stages — today represented by `PopulationRiskState` (computed) and the `PopulationData` fixture (illustrative-scale, Chapter 10 §10.2).

| Attribute | Req? | Notes |
| --- | --- | --- |
| `scopeLabel` | ✓ | The cohort/segment this aggregate describes (e.g. a practice, an IMD quintile). |
| `highRiskSharePercent`, `signals[]` | ✓ | The computed aggregate figures. |
| `limitations` | ✓ | Explanatory text on data-source/method limitations. |
| `physiologicalTwin`, `hitlRequired`, `ehrWrite` | ✓ | Honesty fields, restating BR-052. |
| Minimum-cell suppression flag/threshold | — | **Not present in code today** — an open gap (§17.2.8 note below; restates OQ-POP-1/OQ-ARC-2/OQ-BR-3). |

- **Source:** today, a separately-authored synthetic fixture (`lib/mock-data/population.ts`) disconnected from the platform's actual demo cohort (Chapter 10 §10.2); specified for future work as a real computed Segment aggregation.
- **Tier:** T3 (aggregate-only by design — but see the open suppression gap immediately below).
- **Related:** FR-POP-004/009/011, BR-025/026/052.
- **FR-DATA-015.** A PopulationAggregate entity shall never carry a patient-identifiable value at any cohort size — restating BR-026 as an absolute field-level constraint, independent of the still-open numeric suppression threshold (OQ-DATA-3).
- **FR-DATA-016.** This Volume records that no minimum-cell suppression mechanism exists on this entity in code today, even though BR-025 requires one; this chapter treats "add the suppression field/check" as a required data-contract addition, not an optional enhancement, pending only the threshold decision already open at Chapter 4/10/16 (OQ-ARC-2/OQ-POP-1/OQ-BR-3).

#### 17.2.9 Diabetes signal / reading

The typed, per-modality clinical signal a Diabetes intelligence area (`GLUCOSE`, `HBA1C`, `INSULIN`, `GLP1`, `NUTRITION`, `EXERCISE`, `BEHAVIOUR`, `COMPLICATIONS`, `PREVENTION`) produces or consumes — see §17.3 for the modality-gap finding this entity centers on.

| Attribute | Req? | Notes |
| --- | --- | --- |
| `patientId` | ✓ | Subject reference (`DiabetesPatientContext`). |
| Module-specific reading fields (e.g. glucose value, HbA1c value, time-in-range) | — | **Currently placeholder-typed**, returning `insufficient_data`/`null` in every v0 stub (`glucose.ts`) rather than a populated value. |
| `doseChangeRecommendation` (Insulin), `prescribingRecommendation` (GLP-1) | ✓ (as a hard `null` type) | Restates BR-034 — these fields exist as a type-level `null` lock, not an omitted field. |
| `isClinicalAdvice` (on coaching-pattern outputs) | ✓ | Hard `false`, restating BR-038. |
| Honesty fields (`hitlRequired`, `ehrWrite`, `autoRetrain`, `physiologicalTwin`) | ✓ | `DiabetesSignalHonesty`. |

- **Source:** today, no live source (v0 stubs); specified future sources are device (CGM, once a modality exists), lab (HbA1c), and clinician-entered (insulin/GLP-1 titration history) — never patient self-report for anything feeding `doseChangeRecommendation`/`prescribingRecommendation` (BR-035).
- **Tier:** T2 (highest-sensitivity clinical signal category in the module).
- **Related:** FR-DIAB-029/033/046, BR-034/035/038/041.
- **FR-DATA-017.** A Diabetes signal/reading entity whose underlying data is unavailable shall render `insufficient_data` (or the field's `null` equivalent) rather than a fabricated, interpolated, or last-known-value substitute — restating §17.5's platform-wide quality rule as this entity's own binding case, since it is the entity most likely to be asked to "just show something plausible."
- **FR-DATA-018.** `doseChangeRecommendation` and `prescribingRecommendation` shall remain hard `null`-typed for the entity's entire lifetime absent a dedicated, separately clinically-reviewed spec change — restating BR-034 as this entity's own immutable field-level contract, the single most safety-sensitive line in this chapter.

#### 17.2.10 TwinScenarioResult

The ranked, rules-based output of a what-if scenario run against one specific patient's existing record — today a generic (non-diabetes-specific) `TwinSimulationResult`.

| Attribute | Req? | Notes |
| --- | --- | --- |
| `patientId`, `patientLabel` | ✓ | Exactly one bound patient per invocation (BR-048) — never a population-level or hypothetical-average run. |
| `physiologicalTwin` | ✓ | Hard `false`. |
| `simulationMode` | ✓ | `"synthetic_rules"` literal. |
| `options[]` (ranked interventions) | ✓ | The scenario ranking itself. |
| `oracleScore`/`oracleRisk` used | — | Inputs the ranking was computed from. |
| Honesty fields (`hitlRequired`, `ehrWrite`, `planPromotionRequiresHitl`) | ✓ | Restates BR-043. |

- **Source:** system-derived (a computation over the patient's existing record and clinician/user-entered scenario parameters) — never a live CGM/wearable/pharmacy-adherence stream (BR-047).
- **Tier:** T3.
- **Related:** BR-042/043/044/045/047/048/049.
- **FR-DATA-019.** A TwinScenarioResult entity shall never be reachable from a patient-facing session at any step, and shall never represent a "stop insulin" (or equivalent safety-critical cessation) scenario without a prior, resolved `medication_decision` GateDecision — restating BR-049/BR-044 as this entity's own access and field-population contract.

#### 17.2.11 ResearchExport

The aggregate-only, ethics-gated output a federated-research job or evaluation-harness run produces for offline research use — never a patient-level export.

| Attribute | Req? | Notes |
| --- | --- | --- |
| `patientLevelExport` | ✓ | Hard `false` — absolute, non-phased (BR-065). |
| `syntheticAggregatesOnly` | ✓ | Hard `true`. |
| `ethicsGatePassed` | ✓ | Must be `true` before any aggregate is computed for delivery. |
| `aggregate` (e.g. `cohortSizeSynthetic`, summary statistics) | ✓ | Cohort-level figures only. |
| `limitations` | ✓ | Explanatory text on dataset/method boundaries. |

- **Source:** synthetic, derived only from patients holding an active, unrevoked `clinical_research_deidentified` ConsentGrant (BR-023).
- **Tier:** T3.
- **Related:** NO-RES-1/3/6, BR-023/024/062/063/064/065/066/067.
- **FR-DATA-020.** A ResearchExport entity shall never carry a field capable of resolving to an individual patient row, regardless of aggregate size or query specificity — restating BR-065 as an absolute field-level constraint with no suppression-threshold exception (unlike PopulationAggregate, §17.2.8, which permits small aggregates subject to suppression; ResearchExport permits no patient-level granularity at all).
- **FR-DATA-021.** A patient whose `clinical_research_deidentified` grant is revoked shall be excluded from any ResearchExport computed after the revocation — restating BR-023 as this entity's own construction-time contract.

### 17.3 Diabetes-specific data expectations: the glucose modality gap

This section states, as this chapter's defining finding, the single clearest open data-contract gap in the platform today.

- **FR-DATA-022.** The platform's modality enum (`MODALITY_IDS`: `wearable`, `lifestyle`, `clinical`, `lab`, `imaging_meta`, `omics_meta`, `environment`) shall be treated as **not yet covering continuous glucose monitoring (CGM)** — no `glucose` modality value exists today, and `wearable` today covers only heart rate/steps/SpO2/blood pressure. This is recorded as a required, open data-contract decision (OQ-DATA-1), not a resolved shape: either CGM is added as a new attribute scoped under the existing `wearable` modality, or a dedicated `glucose` modality is introduced, each with different consent-granularity consequences (a patient could grant `wearable` for steps/HR without thereby granting CGM access, if `glucose` is separate).
- **FR-DATA-023.** Until FR-DATA-022's modality question is resolved, no capability shall assume CGM data is covered by an existing `wearable` ConsentGrant — restating BR-019 (consent must be scoped to the specific modality actually being used) as a concrete blocker on treating any future CGM feature as already consent-covered.
- **FR-DATA-024.** `DiabetesGlucoseReading` and `DiabetesHbA1cReading` (§17.2.9) shall remain placeholder types returning `insufficient_data`/`null` until both (a) FR-DATA-022's modality decision is made and (b) a real device/lab/FHIR data source is wired — this chapter does not authorize populating these fields from a fabricated or estimated value in the interim (restating §17.5).
- **FR-DATA-025.** A future HbA1c data source, once wired, shall be modeled as **lab-sourced** (a discrete, dated lab-result value) rather than continuous/streamed — distinguishing its data-contract shape from CGM's continuous-stream shape, since the two diabetes signals have materially different provenance, frequency, and consent-modality implications (`lab` vs. the still-open `wearable`/`glucose` question).

### 17.4 Provenance & lineage requirements

- **FR-DATA-026.** Every entity in §17.2 shall carry an explicit, inspectable source designation — one of **synthetic** (demo-cohort-generated), **user** (patient/clinician-entered), **device** (wearable/CGM/future hardware), or **FHIR** (interop-sourced) — and this designation shall never be inferred implicitly from context; restating BR-078/BR-009's honesty-field pattern as a general provenance requirement across every entity, not only twin/HITL outputs.
- **FR-DATA-027.** Where an entity is derived from another entity (LearningEvent from a GateDecision/disposition; TwinScenarioResult from a Patient's existing record; PopulationAggregate from Segment computation; ResearchExport from a consented cohort), the derived entity shall retain a traceable reference to its source entity/entities (`caseId`, `predictionId`, `patientId`, cohort membership) rather than presenting only a final computed number with no lineage back to its inputs.
- **FR-DATA-028.** No entity shall silently change its declared source designation (e.g. a `synthetic` Patient becoming `user`-sourced) as a side effect of an unrelated code or configuration change — restating BR-046's "no silent flip" pattern (there specific to `physiologicalTwin`) as a general provenance-integrity rule.
- **FR-DATA-029.** A chain of derived entities (e.g. Patient → Diabetes reading → TwinScenarioResult → LearningEvent → ShieldAuditEvent) shall remain traceable end-to-end via the linkage fields specified in §17.2, so an auditor can walk from a final audit record back to the originating patient-linked data it concerns — this is a restatement, at the data-contract level, of Chapter 5's audit-trail requirement (FR-HITL-014/015/016), not a new audit mechanism.

### 17.5 Quality rules: honesty over fabrication

- **FR-DATA-030.** Where an entity's expected data is missing, insufficient, or not yet wired, the entity shall render an explicit `insufficient_data` (or a field-level hard `null`, per §17.2.9's `doseChangeRecommendation`/`prescribingRecommendation` pattern) — never a fabricated, interpolated, default, or "looks plausible" substitute value. This is this chapter's single governing quality principle, binding on every entity in §17.2 without exception.
- **FR-DATA-031.** A missing-data state shall be visually and semantically distinguishable, at the data-contract level, from a genuinely computed zero or negative result (e.g. "0% high-risk share" is a real computed value; "no data available to compute a high-risk share" is `insufficient_data`) — the two shall never share a representation that could cause a consumer to misread absence-of-data as a computed result.
- **FR-DATA-032.** No entity's quality rule shall be relaxed for demo/presentation purposes; a demo environment showing `insufficient_data` honestly is preferred, by this Volume's own values (§0.1), to a demo environment silently substituting a plausible-looking fabricated value to "look more finished."

### 17.6 Demo vs. live data rules

- **FR-DATA-033.** Every entity's data shall originate from the synthetic demo cohort (or explicitly, separately governed pilot-consented data) for the duration this Volume is in effect — restating BR-078 as a data-contract-level rule spanning every entity in §17.2, not only Patient.
- **FR-DATA-034.** Every FHIR-lite/interop-facing entity (§17.7) shall carry `liveEmis:false`/`ehrWriteAttempted:false` (or the entity's equivalent honesty fields) unconditionally, restating BR-076/BR-082/BR-083/BR-085 at the data-contract level — no entity's schema shall omit these fields on the theory that "this one doesn't need them."
- **FR-DATA-035.** A demo-reset action shall be scoped to the resetting practice/tenant's own entities only, and shall never be capable of discarding another practice's data or another user's in-progress GateDecision — restating BR-017/BR-018 as this chapter's own data-lifecycle rule.

### 17.7 Interop payload expectations (FHIR, product level)

This Volume's interop posture (Chapter 6 §6.2) is FHIR-lite today, not a full FHIR R4 server — this section states what a product-level Observation/Encounter payload is expected to carry, not a conformance-tested resource profile (that is engineering-volume scope, §17.8).

- **FR-DATA-036.** An `ObservationResource`-shaped payload shall carry, at minimum, `resourceType: "Observation"`, an `id`, a human-readable `codeText`, a `valueText`, and a `status` — the product-level minimum needed for a clinician or downstream agent to read "what was measured, what the result was, and how firm that result is," without requiring a full FHIR-conformant `Coding`/`Quantity` structure at this Volume's current phase.
- **FR-DATA-037.** Any future Diabetes glucose/HbA1c Observation payload (§17.3) shall reuse this same `ObservationResource` shape rather than introducing a bespoke Diabetes-only observation structure — restating BR-030 (a disease module reuses existing platform primitives) at the data-contract level.
- **FR-DATA-038.** Every EMIS/SystmOne-adjacent staging payload (`EmisStagingEnvelope`) shall carry `liveEmis: false` and `ehrWriteAttempted: false` unconditionally in this build, and every Medplum-rehearsal payload's status shall report `liveEmis: false` unconditionally — restating BR-082/083 as this chapter's own interop-payload contract.
- **FR-DATA-039.** No interop payload entity shall be extended with a live write-capable field (e.g. an EMIS write-confirmation id) while `liveEmis` remains `false` platform-wide — such a field would be a dead/misleading attribute on an entity that can never legitimately populate it under this Volume's current scope.

### 17.8 Non-goals

- **NO-DATA-1.** This chapter does not design, and no future chapter of this Volume shall be read as authorizing, a physical database schema — Postgres DDL, ClickHouse table definitions, Neo4j node/relationship/property-graph labels, or JSON Schema/Zod validator code. Those remain engineering-volume artifacts that must satisfy this chapter's product-level contracts.
- **NO-DATA-2.** This chapter does not invent or request a live coded-terminology server (SNOMED CT/ICD-10/LOINC/RxNorm) — restating BR-084; every `codeText` field in §17.7 is a human-readable string today, not a coded reference into a live terminology service.
- **NO-DATA-3.** This chapter does not fix specific retention *periods* (e.g. "7 years") for any tier in §17.1 — that is a Compliance/DPO-owned decision this Volume records as open (OQ-DATA-4), expected in a future NFR or governance chapter.
- **NO-DATA-4.** This chapter does not itself add a `glucose` modality (or extend `wearable`) in code — §17.3 states the requirement and the open question; the actual modality-enum decision and implementation remain future engineering work pending the decision in OQ-DATA-1.
- **NO-DATA-5.** This chapter does not modify or re-derive the ConsentGrant, SHIELD, LearningEvent, or HumanGate schemas already governed by Chapters 5, 6, and 14 — it indexes and cross-references their existing shapes as entities in §17.2, per this Volume's own precedence rule (§0.4), rather than treating this chapter as a second, competing source of truth for those types.
- **NO-DATA-6.** This chapter does not claim a canonical, single shared "data dictionary" module exists in code; several entities catalogued here (notably Patient, split across `lib/mock-data/types.ts`, and Case/GateDecision/ObservationResource, defined in `lib/types.ts`) are defined independently today with no single shared type module enforcing consistency between this document and the code (OQ-DATA-6).
- **NO-DATA-7.** This chapter does not specify row-level transformation/mapping code (e.g. a function that actually builds a FHIR `Bundle` from a `ReviewCase`) — that is engineering/interop-adapter scope; §17.7 states the expected payload shape, not the code that produces it.

### 17.9 Edge cases

- **EC-DATA-1.** A ConsentGrant is revoked (BR-020/021) while a ClinicalDraft that already used that modality's data is mid-review. This chapter does not resolve whether the already-staged draft must be withdrawn, flagged, or allowed to complete review on already-collected data — the exact UX/process handling is deferred to Chapter 18 (UI/Screen Definitions).
- **EC-DATA-2.** A LearningEvent references a `caseId` whose Case is later archived or otherwise made inaccessible through the normal case-workspace UI. Because LearningEvent and ShieldAuditEvent are append-only (BR-070, FR-DATA-011), the audit/learning trail must not itself be deleted or orphaned merely because its referenced case is no longer surfaced in the active workspace — this chapter states the append-only entities survive, but does not specify the exact archival mechanism for the Case entity itself.
- **EC-DATA-3.** A future Diabetes glucose/HbA1c device or lab feed delivers a value outside physiologically plausible bounds (a device error, not a genuine extreme reading). This chapter does not resolve whether such a value should be rejected outright, flagged as implausible-pending-clinician-review, or passed through with a data-quality annotation — recorded as open (OQ-DATA-5).
- **EC-DATA-4.** A PopulationAggregate's underlying segment count sits exactly at the (still undecided, OQ-POP-1) minimum-cell suppression threshold boundary. This chapter cannot specify tie-break/rounding behavior until the threshold itself is set.
- **EC-DATA-5.** A ResearchExport's ethics gate fails (or a relevant patient's consent is revoked) after the aggregate has already been computed but before delivery. This chapter requires (FR-DATA-020/021) that the entity never reach a patient-identifiable state, but does not specify whether the already-computed, undelivered aggregate object must itself be discarded rather than merely withheld — recorded as open (OQ-DATA-7).

### 17.10 Open questions

- **OQ-DATA-1.** Should continuous glucose monitoring be modeled as a new attribute under the existing `wearable` modality, or as a dedicated new `glucose` modality with its own consent scope? This restates Chapter 8's own open question (the diabetes spec's CGM-modality TODO) at the data-contract level; it blocks FR-DATA-022/023/024 from moving past "gap identified" to "gap resolved." **Owner:** Architecture + Clinical Safety Lead (consent-granularity implications).
- **OQ-DATA-2.** Should a first-class `ClinicalDraft` type be introduced in code, distinct from `FhirBundleDraft`/`frozenArtifact`, to match this chapter's product-level naming (§17.2.4)? Or is the current naming sufficient and this chapter's naming should instead be revised to match code? **Owner:** Engineering + Product (documentation-vs-code naming alignment).
- **OQ-DATA-3 (restates OQ-ARC-2/OQ-POP-1/OQ-BR-3).** The numeric minimum-cell suppression threshold for PopulationAggregate (§17.2.8) remains unset. This chapter cannot mark FR-DATA-016 as fully closed until Compliance/Architecture/Clinical Safety Lead set it. **Owner:** Clinical Safety Lead + Compliance + Architecture.
- **OQ-DATA-4.** What are the actual retention *periods* (not just tiers) for T1–T4 data, and do they differ between the synthetic demo environment (where indefinite retention may be harmless) and any future pilot/live environment (where a real DPIA-driven retention schedule would apply)? **Owner:** Compliance/DPO + Product, expected to land in a future NFR/governance chapter.
- **OQ-DATA-5 (restates EC-DATA-3).** When a future device/lab-sourced Diabetes reading falls outside plausible bounds, should the platform reject, flag-pending-review, or pass through with an annotation? **Owner:** Clinical Safety Lead + Engineering, once a real data source is being wired (not before).
- **OQ-DATA-6 (restates NO-DATA-6).** Should the platform introduce a canonical, shared data-dictionary module in code (so this chapter's entity catalogue and the actual type definitions cannot silently drift apart), or is per-file type definition with periodic documentation reconciliation (this chapter's current approach) sufficient going forward? **Owner:** Engineering + Architecture.
- **OQ-DATA-7 (restates EC-DATA-5).** Must an already-computed, undelivered ResearchExport aggregate be actively discarded when its ethics gate subsequently fails, or is withholding delivery sufficient? **Owner:** Clinical Safety Lead + Compliance.

### 17.11 Cross-references

- Chapter 5 (§5.2/§5.4 gate catalogue, SHIELD hash-chain) — the origin of GateDecision (§17.2.5) and ShieldAuditEvent (§17.2.7).
- Chapter 6 (§6.2 FR-CORE-008/019/026, consent and interop) — the origin of ConsentGrant (§17.2.3) and the FHIR-lite/`EmisStagingEnvelope`/Medplum shapes underlying §17.7.
- Chapter 8 (§8.6/§8.9 NO-DIAB-1–7, diabetes types) — the origin of the Diabetes signal/reading entity (§17.2.9) and the glucose modality gap this chapter's §17.3 restates at data-contract depth.
- Chapter 9 (§9.4/§9.11 NO-TWIN-1–7) — the origin of TwinScenarioResult (§17.2.10).
- Chapter 10 (§10.2/§10.10 FR-POP-004/009/011) — the origin of PopulationAggregate (§17.2.8) and its still-open suppression-threshold gap.
- Chapter 13 (§13.5 federated-research, evaluation plan) — the origin of ResearchExport (§17.2.11).
- Chapter 14 (§14.2/§14.6 FR-LEARN-006/007, `LearningEvent`) — the origin of LearningEvent (§17.2.6).
- Chapter 16 (§16.2 the full `BR-<nnn>` catalogue) — every entity's classification and field-level contract in §17.2 restates the specific `BR-<nnn>` cited as its origin, per Chapter 16 §16.5's own forward pointer, rather than re-deriving it independently.
- Chapter 4 (§4.6 FR-ARC-006/031, Chapter 12 §12.2 case workflow) — the origin of the Case/Encounter model (§17.2.2).
- Chapter 18 (UI / Screen Definitions, `[DRAFTED]`) — where this chapter's entity attributes become concrete screen fields, empty/loading/error states, and the exact UX handling for edge cases this chapter leaves open (EC-DATA-1 in particular).

---

## 22. Chapter 18 — UI / Screen Definitions `[DRAFTED]`

### 18.0 Purpose of this chapter

Chapters 1–17 have specified, at functional-requirement depth, what the platform must do: which personas exist (Chapter 3), which agents produce which drafts (Chapter 7), which gates a clinician must clear (Chapter 5), which journeys a user walks (Chapter 15), which business rules bind every layer (Chapter 16), and which data entities carry the information those requirements operate on (Chapter 17). None of those chapters state what a screen actually contains, or which route in the running application corresponds to which persona's task. This chapter is that mapping: a screen-by-screen inventory, grounded in a fresh read of the actual `app/` route tree as it exists today, of what a Cursor/FE engineer must build, extend, or leave alone — stated as required behaviours per screen, not a visual/pixel specification.

**What this chapter is.** A screen catalogue (§18.2–§18.11) covering every persona-facing route this Volume's 8 personas (Chapter 3, §3.1) actually use or are specified to use, each carrying a stable Screen ID, its route, the persona(s) who reach it, its purpose, its key components/panels (cited by existing component file/path where one exists), its primary actions, the `FR-*`/`BR-*` this chapter or an earlier chapter binds it to, and an honest Exists/Partial/Missing status — plus the cross-cutting rules (§18.12–§18.14) every screen in the catalogue must obey regardless of persona: draft-not-advice labelling, explainability display, accessibility `shall` statements, empty/error/loading states, and the absolute rule that no patient-facing screen ever offers a dose-change affordance.

**What this chapter is not** (§18.16 states this formally as non-goals). It is not a Figma file, a wireframe, or a visual redesign — no colour, spacing, typography, or componentised design-system decision is made or implied here; those remain Design/Engineering scope operating *within* this chapter's behavioural requirements. It does not redesign the Clinical Signal brand or any existing visual system. It does not invent a screen that has no grounding in either an existing route or an already-specified requirement from an earlier chapter (Diabetes clinician panels and Twin what-if, §18.10–§18.11, are the two exceptions, and both are explicitly labelled FUTURE/PARTIAL rather than presented as already-designed). It restates Chapter 12's honest multi-surface finding rather than re-deriving the clinical workspace from scratch, and Chapter 17's entity catalogue wherever a screen displays or edits one of its attributes, per Chapter 17 §17.11's own forward pointer.

### 18.1 Screen inventory conventions

- **FR-UI-001.** Every screen in this chapter's catalogue shall carry a stable Screen ID (`SCR-<AREA>-<n>`, area codes: `AUTH`, `ONB`, `GP`, `NUR`, `PHM`, `ADM`, `ICS`, `HOSP`, `PAT`, `RES`, `DIAB`, `TWIN`) that is never renumbered or reused once this chapter reaches DRAFTED status and has been reviewed at least once — restating this Volume's own ID-stability rule (§0.6) at the screen-catalogue level.
- **FR-UI-002.** Every catalogue entry's Status column shall be one of **Exists** (the route/component described renders substantially as stated, in this build, today), **Partial** (the route exists but the behaviour described is incomplete, disconnected from live data, or honesty-gapped in a way an earlier chapter has already recorded), or **Missing** (no route or component exists; the entry specifies a target for future work) — restating this Volume's own DRAFTED-vs-target discipline (§0.5) at the per-screen level, never blended into a single ambiguous "planned" label.
- **FR-UI-003.** Where a screen's Status is Partial or Missing for a reason an earlier chapter has already recorded (e.g. the Diabetes module's v0-stub status, Chapter 8 §8.3; the ICS population fixture disconnect, Chapter 10 §10.2), this chapter shall cite that chapter's finding rather than re-deriving or re-litigating it.
- **FR-UI-004.** This chapter's catalogue is a snapshot of the `app/` route tree as read at drafting time; a future route rename, removal, or addition shall be treated as a documentation-currency defect in this chapter to correct at the next revision (restating Chapter 16's `BR-CR-3` currency-maintenance pattern and Chapter 17's `NO-DATA-6` naming-drift caveat), not license to treat this chapter as silently authoritative over the code.

### 18.2 Screen catalogue: Auth, identity & demo entry

**Purpose.** Get an unauthenticated visitor (any persona) into a role-scoped session, or into a scripted sales/demo walkthrough, without ever implying a live NHS/CIS2 identity exists (Chapter 3, FR-PER-013).

| Screen ID | Route | Persona | Purpose | Key components | Primary actions | Related FRs | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-AUTH-1 | `/signin` | All (unauthenticated) | Canonical sign-in | `AuthCardLayout`, `SignInForm` | Submit credentials; link to sign-up | FR-PER-003 | Exists |
| SCR-AUTH-2 | `/signup` | All (prospective) | Create account | sign-up form components | Submit registration | FR-PER-003 | Exists |
| SCR-AUTH-3 | `/forgot-password` | All | Request password reset | reset-request form | Submit email | FR-UI-006 | Exists |
| SCR-AUTH-4 | `/reset-password` | All | Complete password reset | reset form | Submit new password | FR-UI-006 | Exists |
| SCR-AUTH-5 | `/verify-email` | All | Confirm email address | verification confirmation view | — (link-triggered) | FR-UI-006 | Exists |
| SCR-AUTH-6 | `/auth/error` | All | Surface an auth failure | error message view | Retry / return to sign-in | FR-UI-007 | Exists |
| SCR-AUTH-7 | `/demo` → `/demo/patel` (also `/demo/precision-health-loop`, `/demo/script`) | Prospect / sales-demo audience | Scripted, step-through product walkthrough | `OverviewDemoLauncher` | Step through a fixed narrative | FR-UI-008/009 | Partial |

- **FR-UI-005.** `/signin` shall remain the single canonical sign-in route; `/auth/signin` is a legacy alias that shall continue to redirect (preserving query parameters) to `/signin` rather than rendering its own form, so no second, independently-maintained sign-in surface exists.
- **FR-UI-006.** The forgot-password, reset-password, and verify-email screens shall each render an explicit success, failure, and (for reset-password) expired-or-already-used-token state — an engineer shall not treat "the happy path renders" as sufficient for this screen group, since a password-recovery flow is disproportionately likely to be exercised in a broken state (Chapter 3 §3.5's authentication requirements apply to this flow as much as to sign-in itself).
- **FR-UI-007.** `/auth/error` shall never display a raw provider/library error string to the end user; it shall map every underlying NextAuth error case to a plain-English message consistent with this Volume's plain-English-first framing (applying Chapter 11's coaching-language principle to system messaging here).
- **FR-UI-008.** This Volume records that no dedicated "demo identity switcher" screen exists in the build today — a demo persona is reached only via `/signin` with a seeded per-role `@demo.akshhealth.com` credential (`docs/DEMO_LAUNCH_CREDENTIALS.md`), never via an in-app role-switch control. `/demo/patel` is a separate, scripted narrative walkthrough (`OverviewDemoLauncher`) layered on top of that seeded-credential mechanism, not a replacement for it — this chapter does not request building an in-app persona switcher, since Chapter 3's FR-PER-004 already requires exactly one `UserRole` per session.
- **FR-UI-009.** Every screen reachable from `/demo/*` shall carry the same demo/synthetic disclosure this Volume requires everywhere else (Chapter 3 FR-PER-013, `liveEmis:false` framing) — a scripted walkthrough is not exempt from the "never imply a live NHS/CIS2 identity" rule merely because its audience is prospective, not clinical.

### 18.3 Screen catalogue: Role onboarding

**Purpose.** Take a newly authenticated user from "which of the 8 personas are you" (Chapter 3 §3.1) to a role-appropriate dashboard, capturing identity, organisation, preferences, and initial consent along the way, per the existing `CLINICAL_ORG_STEPS`/patient-shortened step sequence (`lib/onboarding/roles.ts`).

| Screen ID | Route | Persona | Purpose | Key components | Primary actions | Related FRs | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-ONB-1 | `/onboarding/role-select` (alias `/onboarding`) | All | Choose one of 8 `UserRole`s | `RoleTile`, `OnboardingCard` | Select role; continue | FR-PER-001, FR-UI-010 | Exists |
| SCR-ONB-2 | `/onboarding/identity` | All | Capture name/contact/professional-registration fields | `identity-step-client` | Enter identity fields; continue | FR-UI-011 | Exists |
| SCR-ONB-3 | `/onboarding/organisation` | GP/Nurse/Pharmacist/Admin/ICS/Hospital/Researcher (not Patient) | Capture practice/organisation | organisation-step client | Enter org details; continue | FR-UI-011 | Exists |
| SCR-ONB-4 | `/onboarding/preferences` | Same as SCR-ONB-3 | Capture role-specific preferences | preferences-step client | Set preferences; continue | FR-UI-011 | Exists |
| SCR-ONB-5 | `/onboarding/consent` | All (incl. Patient) | Capture initial purpose-bound consent | `consent-step-client` | Grant/decline purpose(s); continue | FR-UI-012, Ch17 FR-DATA-006 | Exists |
| SCR-ONB-6 | `/onboarding/tutorial` | All | Role-specific guided tour ("agents that matter + what you approve") | tutorial step client | Step through; skip | FR-UI-013 | Exists |
| SCR-ONB-7 | `/onboarding/complete` | All | Confirm completion, route to dashboard | completion step client | Continue to dashboard | FR-UI-013 | Exists |

- **FR-UI-010.** The role-select screen shall present all 8 `UserRole` tiles (Chapter 3 §3.1) with no persona omitted or hidden, and shall warn (not silently discard) a user with in-progress onboarding data before a role change clears it — restating the existing confirm-before-clearing behaviour (`RoleSelectContent.handleContinue`) as a binding requirement, not an implementation detail that could be quietly dropped.
- **FR-UI-011.** The organisation and preferences steps shall not be presented to a `patient` session — restating the existing shortened `patient` step sequence (`["role-select","identity","consent","tutorial","complete"]`) as a product requirement: a patient is never asked to name a "practice" or set clinician-oriented preferences that do not apply to their own use of the platform.
- **FR-UI-012.** The consent step shall capture at least one purpose-bound `ConsentGrant` (Chapter 17 §17.2.3) before a session may complete onboarding, and shall state, in plain language, which purpose codes are being granted and what each one is used for — restating Chapter 6's consent-transparency requirement at the onboarding-screen level.
- **FR-UI-013.** The tutorial and completion steps shall route the user, on completion, to exactly the dashboard path their `UserRole` maps to (`resolveDashboardPath`/`dashboardPath`, Chapter 3 §3.4) — never a generic landing page a user must then navigate away from to find their actual workspace.

### 18.4 Screen catalogue: GP dashboard, patient detail, and case/review workflow

**Purpose.** Cover the GP persona's screen set (Chapter 3 §3.2.1), restating Chapter 12 §12.2's honest finding that this is not one screen but several, and cataloguing each explicitly rather than treating "the GP workspace" as a single row.

| Screen ID | Route | Persona | Purpose | Key components/panels | Primary actions | Related FRs | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-GP-1 | `/dashboard/gp` | GP | Dashboard overview: patient strip, queue, care pathway, twin, agent sidebar | `PatientPanel`, `ReviewQueue`, `CarePathwayTracker`, `DigitalTwinPanel`, `AgentControlPanel`, `RiskScoreBadge` | Select patient; Accept/Edit/Reject queue items | Ch12 FR-CLIN-007/012, FR-UI-014 | Exists |
| SCR-GP-2 | `/dashboard/gp/review-queue` | GP | Standalone review queue (patient-scoped or all) | `ReviewQueue`, `ClinicalOrchestratePanel`, `ConsentBanner` | Accept/Edit/Reject | Ch12 FR-CLIN-012/013 | Exists |
| SCR-GP-3 | `/dashboard/gp/patients/[id]` | GP | Patient-detail precision-health workspace | `ClinicalOrchestratePanel`, `OracleRiskPanel`, `ReviewQueue`, `CarePathwayTracker`, `DigitalTwinPanel`, `ScenarioRankingPanel`, `CausalHypothesisPanel`, `HealthPlanDraftPanel`, `SpineOutcomesCapturePanel`, `ConnectorsIngestPanel`, `PatientTimelinePanel`, `ConsentGrantsPanel` | Run orchestration; Accept/Edit/Reject; run twin scenario; view timeline/consent | Ch12 §12.2 (full panel list), FR-UI-015 | Exists |
| SCR-GP-4 | `/dashboard/gp/care-pathways` | GP | Practice-wide care-pathway list | `CarePathwayTracker` | View pathway progress | Ch12 FR-CLIN-007 | Exists |
| SCR-GP-5 | `/dashboard/gp/reports` | GP | Weekly practice KPI summary | `MetricCard` | View-only | FR-UI-016 | Partial |
| SCR-GP-6 | `/dashboard/gp/settings` | GP | GP preference management | preference form | Update preferences | FR-UI-017 | Exists |
| SCR-GP-7 | `/review` | GP (also Nurse/Pharmacist per gate ownership) | Generic, agent-type-agnostic case queue | `ReviewPageClient` | Filter, open a case | Ch12 §12.2 item 3, FR-UI-018 | Exists |
| SCR-GP-8 | `/cases/[id]` | GP (also Nurse/Pharmacist) | Case detail: draft editor, gates, decision | `CasePageClient`/`CaseDetail`, `CaseHumanReviewPanels`, `DecisionPanel`, activity timeline | Accept/Edit/Reject/Override; clear case-level gate | Ch5 §5.2, Ch12 §12.4, FR-UI-048–052 | Exists |
| SCR-GP-9 | `/cases/[id]/evidence` | GP | Independent supporting evidence for a case | `CaseEvidence*` section components | View-only | Ch12 FR-CLIN-022/023 | Exists |
| SCR-GP-10 | `/cases/[id]/dossier` | GP | Frozen, exportable Validation Dossier | `KnownLimitationsFooter`, `ReportActions` | Export/print | Ch12 FR-CLIN-025 | Exists |
| SCR-GP-11 | `/cases/[id]/report` | GP | Case-level report view | report components | View-only | FR-UI-016 | Exists |

- **FR-UI-014.** SCR-GP-1's `AgentControlPanel` sidebar and `ReviewQueue` shall remain the same underlying disposition-recording path as SCR-GP-2's and SCR-GP-8's decision controls — restating Chapter 12's FR-CLIN-012 at the screen-catalogue level: a GP shall never be able to tell, from the outcome, which of these three screens they actually approved a draft from, because the recorded effect (LearningEvent + SHIELD audit) is identical regardless of entry screen.
- **FR-UI-015.** SCR-GP-3 shall remain the single screen where a GP can reach every precision-health panel this Volume has specified for the Diabetes module (§18.10), the Digital Twin (§18.11), and Chapter 17's entity displays (timeline, consent grants, health-plan draft) for one named patient — this chapter does not request splitting this already-wide screen further; it restates Chapter 12 FR-CLIN-003's finding that this is the *most* complete of the current surfaces, not a finished single workspace.
- **FR-UI-016.** SCR-GP-5 and SCR-GP-11 shall carry an explicit "mock/QA data" or equivalent honesty disclosure for as long as their underlying figures remain a static or illustrative dataset rather than a live computed practice metric (SCR-GP-5's own in-code comment already states "mock data ... for QA review") — restating this Volume's honesty-over-fabrication principle (Chapter 17 §17.5) at the reports-screen level.
- **FR-UI-017.** SCR-GP-6 shall only ever alter session-scoped preference values already defined in `GP_PREFERENCE_LABELS`; it shall never expose a control that changes another clinician's settings or a practice-wide policy without a separate, explicitly-scoped admin action (Chapter 3 FR-PER-005).
- **FR-UI-018.** SCR-GP-7's filter set (`all`/`blocked`/`high-risk`/`pending`/`deferred`/`accepted`) shall remain server-validated against the same allow-list used today (`allowedFilters`) — an unrecognised filter value shall fall back to `all`, never silently error the page.

### 18.5 Screen catalogue: Nurse and Clinical Pharmacist

**Purpose.** Cover the two narrower clinical-persona workspaces Chapter 12 §12.3 (FR-CLIN-008/009) already found to be materially thinner than the GP's by design.

| Screen ID | Route | Persona | Purpose | Key components | Primary actions | Related FRs | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-NUR-1 | `/dashboard/nurse` | Nurse | Overview: patient header + GUARDIAN alerts | `NursePatientHeader`, `GuardianAlertsPanel` | Triage alert | Ch12 FR-CLIN-008 | Exists |
| SCR-NUR-2 | `/dashboard/nurse/observations` | Nurse | Structured observation capture | `VitalsForm`, `PatientTimelinePanel` | Submit vitals/observation | Ch12 FR-CLIN-008 | Exists |
| SCR-NUR-3 | `/dashboard/nurse/handover` | Nurse | Shift handover draft review | `HandoverPanel` | Confirm/edit handover draft | Ch5 §5.2 (item-level gate) | Exists |
| SCR-NUR-4 | `/dashboard/nurse/alerts` | Nurse | GUARDIAN alert list | `GuardianAlertsPanel` | Escalate to GP/pharmacist | Ch3 §3.2.2 "must not do" | Exists |
| SCR-PHM-1 | `/dashboard/pharmacist` | Clinical Pharmacist | Medication-safety overview | pharmacist dashboard cards | Navigate to sub-screens | Ch12 FR-CLIN-009 | Exists |
| SCR-PHM-2 | `/dashboard/pharmacist/interactions` | Clinical Pharmacist | Interaction checker | `InteractionChecker` | Run/clear interaction check | Ch3 §3.2.3 | Exists |
| SCR-PHM-3 | `/dashboard/pharmacist/bnf` | Clinical Pharmacist | BNF reference lookup | `BnfReference` | Look up drug reference | — (reference-only) | Exists |
| SCR-PHM-4 | `/dashboard/pharmacist/reviews` | Clinical Pharmacist | Medication-review queue | `MedReviewQueue` | Accept/Edit/Reject med-review draft | Ch12 FR-CLIN-009, FR-UI-048 | Exists |

- **FR-UI-019.** SCR-NUR-3's handover confirmation shall remain a confirm/edit action on a SYNTHESIS-generated draft (Chapter 5 §5.2.1's disposition primitive), never a free-form note field that bypasses the same audit/learning-event capture every other item-level disposition produces.
- **FR-UI-020.** SCR-NUR-4 shall never present a control that lets a Nurse session resolve a `medication_decision` case-level gate (Chapter 5 §5.2.3) — restating Chapter 3's "must not finalize a medication-related GUARDIAN flag as if it were a prescribing decision" at the screen level; the only action available is escalation to a GP/pharmacist-scoped screen.
- **FR-UI-021.** SCR-PHM-2/SCR-PHM-4 shall present every interaction/med-review recommendation as an Accept/Edit/Reject draft carrying the same explanatory-evidence requirement as any other GUARDIAN output (Chapter 12 FR-CLIN-022) — never as an auto-applied change to the medication list.
- **FR-UI-022.** None of SCR-NUR-1–4 or SCR-PHM-1–4 shall include a Timeline, Twin, or general Risk panel unless a future product decision (Chapter 12 OQ-CLIN-4) explicitly adds one — this chapter restates, not overrides, that open question.

### 18.6 Screen catalogue: Practice Manager / Admin

**Purpose.** Cover the operational-oversight persona (Chapter 3 §3.2.4) whose screens must never expose a clinical Accept/Edit/Reject control (FR-PER-009).

| Screen ID | Route | Purpose | Key components | Primary actions | Status |
| --- | --- | --- | --- | --- | --- |
| SCR-ADM-1 | `/dashboard/admin` | Operational overview | `AuditLogTable`, `IntegrationStatus`, `SystemStatusStrip`, `MetricCard`, `UrgentGuardianAlertsPanel` | Navigate to sub-screens; view (not decide) alerts | Exists |
| SCR-ADM-2 | `/dashboard/admin/audit` | SHIELD audit sample review | audit table | View-only | Exists |
| SCR-ADM-3 | `/dashboard/admin/consent` | Purpose/modality consent registry | `ConsentGrantsPanel` (`mode="admin"`) | View grants; (per Ch17 FR-DATA-006) no un-scoped grant creation | Exists |
| SCR-ADM-4 | `/dashboard/admin/integrations` | Integration/BRIDGE honesty status | `IntegrationStatus` | View-only | Exists |
| SCR-ADM-5 | `/dashboard/admin/learning` | Governed continuous-learning status | learning-loop dashboard | View-only | Exists |
| SCR-ADM-6 | `/dashboard/admin/users` | User invitation/roster management | user table | Invite/manage users | Exists |
| SCR-ADM-7 | `/dashboard/admin/organisation-enquiries` | Practice sign-up enquiries | `OrganisationEnquiriesPanel` | Triage enquiry | Exists |
| SCR-ADM-8 | `/dashboard/admin/pilot-applications` | Pilot application review | pilot-application list | Triage application | Exists |
| SCR-ADM-9 | `/dashboard/admin/precision-health` | Precision-health module admin status | admin status view | View-only | Exists |
| SCR-ADM-10 | `/dashboard/admin/billing` | Billing/subscription | placeholder card | None (Phase 2) | Missing |

- **FR-UI-023.** No screen in the SCR-ADM group shall ever render an Accept/Edit/Reject control, a case detail view, or an individual patient clinical record — restating Chapter 3's FR-PER-009 and `CLINICAL_RECORD_DENIED_ROLES` at the screen-catalogue level, applied to every current and future admin sub-screen without exception.
- **FR-UI-024.** SCR-ADM-3's admin-mode `ConsentGrantsPanel` shall remain read/administrative-scope only for the synthetic demo patient it is bound to (`patientId="P001"`) today, and shall never be presented as a mechanism for an admin to grant or revoke consent on a real patient's behalf without a separately governed delegation model this chapter does not specify (Open Question, §18.18).
- **FR-UI-025.** SCR-ADM-10 shall retain its explicit "Phase 2" placeholder disclosure for as long as no real billing/subscription mechanism is wired — this chapter does not request building billing functionality; it records the screen's honest current state per this Volume's own quality principle (Chapter 17 §17.5, applied here to a non-clinical but still-honesty-bound screen).

### 18.7 Screen catalogue: ICS Lead and Hospital Executive (population & operational views)

**Purpose.** Cover the two aggregate/operational personas (Chapter 3 §3.2.5/§3.2.6), restating Chapter 10's honest population-data findings and Chapter 9's twin-reuse findings at the screen level rather than re-deriving them.

| Screen ID | Route | Persona | Purpose | Key components | Primary actions | Related FRs | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-ICS-1 | `/dashboard/ics` (alias `/dashboard/regional` → redirects here) | ICS Lead | Population overview | `IcsKpiRow`, `SpineSharedEventsPanel` | Navigate to sub-views | Ch10 §10.2 | Exists |
| SCR-ICS-2 | `/dashboard/ics/population` | ICS Lead | Population risk charts | `PopulationCharts` | Configure date range/overlay | Ch10 FR-POP-004/009 | Partial |
| SCR-ICS-3 | `/dashboard/ics/equity` | ICS Lead | IMD-linked equity deep dive | `EquityDeepDive` | View-only | Ch10 (COMPASS) | Partial |
| SCR-ICS-4 | `/dashboard/ics/forecast` | ICS Lead | Admission-forecast + twin | `AdmissionForecast`, `DigitalTwinPanel` | View-only | Ch10 EC-POP-3, FR-UI-027 | Partial |
| SCR-ICS-5 | `/dashboard/ics/benchmarking` | ICS Lead | Practice benchmarking table | `PracticeBenchmarkTable` | View-only | Ch10 §10.2 | Exists |
| SCR-HOSP-1 | `/dashboard/hospital` | Hospital Executive | Command-centre overview | `DigitalTwinPanel`, `ScenarioRankingPanel`, `CausalHypothesisPanel`, `SpineSharedEventsPanel` | Accept/dismiss operational recommendation | Ch3 §3.2.6 | Exists |
| SCR-HOSP-2 | `/dashboard/hospital/wards` | Hospital Executive | Ward status | `WardStatusPanel` | View-only | Ch3 §3.2.6 | Exists |
| SCR-HOSP-3 | `/dashboard/hospital/capacity` | Hospital Executive | Capacity forecast | `CapacityPanel` | View-only | Ch3 §3.2.6 | Exists |
| SCR-HOSP-4 | `/dashboard/hospital/staffing` | Hospital Executive | Staffing alerts | `StaffingPanel` | Accept/dismiss staffing recommendation | Ch3 §3.2.6 | Exists |

- **FR-UI-026.** SCR-ICS-2 and SCR-ICS-3 shall carry the disclosure Chapter 10 FR-POP-006/012 already requires — that the underlying cohort is the separately-authored, illustrative-scale fixture (47,832 patients), disconnected from the platform's actual 100-patient synthetic cohort — with equal visual prominence to the figures themselves, not as a footnote a viewer must scroll to find.
- **FR-UI-027.** SCR-ICS-4's `AdmissionForecast` curve shall carry the disclosure Chapter 10's EC-POP-3 already specifies — that the sine/cosine demonstration curve must not be read as a validated NHS forecast — satisfying Chapter 10's own still-open OQ-FLOW-3 (persistent banner vs. per-view label vs. session acknowledgment) with, at minimum, a persistent per-view label until that open question is resolved with a firmer mechanism.
- **FR-UI-028.** SCR-HOSP-1's `ScenarioRankingPanel` and `DigitalTwinPanel` instances shall carry the same `physiologicalTwin: false`/`simulationMode: "synthetic_rules"` disclosure as the GP-facing instance of the same components (SCR-GP-3) — this chapter does not permit a persona-specific relaxation of Chapter 9's honesty fields merely because the audience is operational rather than clinical.
- **FR-UI-029.** SCR-HOSP-1 and SCR-HOSP-4's "Accept/dismiss" controls on an operational recommendation shall never be styled, labelled, or otherwise presented in a way that could be confused with a clinical Accept/Edit/Reject decision (Chapter 5 §5.2.1) — restating Chapter 3's "is the human decision-maker for operational recommendations only" boundary at the control-design level: this chapter requires the two interaction patterns to be visually and semantically distinguishable, not merely conceptually distinct in the underlying data model.
- **FR-UI-030.** `/dashboard/regional` shall remain a server-side redirect to `/dashboard/ics`, never a second, independently-rendered ICS-equivalent screen that could drift out of sync with SCR-ICS-1.

### 18.8 Screen catalogue: Patient ("My Health")

**Purpose.** Cover the single patient-facing companion surface (Chapter 3 §3.2.7), restating Chapter 11's honest nine-capability baseline (§11.2) at the screen level and this Volume's absolute rule that no patient-facing surface may accept a dose-change request (Chapter 11 NO-PAT-1).

| Screen ID | Route | Persona | Purpose | Key components (tabs) | Primary actions | Related FRs | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-PAT-1 | `/dashboard/patient` ("My Health") | Patient | Single tabbed companion surface | `PatientCompanion`: **Health** tab (`HealthPlanDraftPanel`, `ConsentGrantsPanel`, `SpineOutcomesCapturePanel`, `ConnectorsIngestPanel`, `PatientTimelinePanel`, `SafetyRouteCoachingGate`), **Check-ins** tab, **Medications** tab (view-only + "coming soon" actions), **Appointments** tab, **Ask** tab | View care plan/consent/timeline; submit check-in; view medications; ask a question | Ch11 §11.2, FR-UI-031–036 | Partial |

- **FR-UI-031.** SCR-PAT-1 shall remain the patient persona's only clinical-adjacent screen — this chapter does not introduce a second patient-facing route; every capability Chapter 11 rates Partial/Missing (Coach, Education, Gamification, Wearables, Voice, Goals, Family) is a requirement for this one screen's future tabs/panels, not a request for new top-level routes, consistent with Chapter 3's single "Primary surface" mapping.
- **FR-UI-032.** SCR-PAT-1's Health tab's `HealthPlanDraftPanel` and `ConsentGrantsPanel` instances shall render read-view controls appropriate to the patient's own actions (view care plan, view/grant/revoke own consent) and shall never expose the Accept/Edit/Reject controls SCR-GP-3's clinician-facing instances of the equivalent panels carry — restating Chapter 3's "view (not finalize) care-plan drafts" boundary as a component-configuration requirement, not merely a documentation note, since the same underlying panel components are reused across personas (applying Chapter 12 FR-CLIN-002's platform-reuse principle here).
- **FR-UI-033.** SCR-PAT-1's Check-ins tab shall clearly disclose, wherever it is presented to a real (non-demo) user, whether a submitted check-in has a backing API to persist to — restating Chapter 11's finding that "the patient self-report check-in surface... has no backing API today" (Ch11 §11.2) as a screen-level honesty requirement: this tab shall not silently accept and discard input as if it had been recorded.
- **FR-UI-034.** SCR-PAT-1's Medications tab shall present the patient's current medication list as view-only, and its "Repeat prescription requests" / "Side effect reporting" affordances shall remain explicit "coming soon" placeholders (not implying an existing request-submission pipeline) until a real backing flow is built — restating this Volume's honesty-over-fabrication principle at the placeholder-affordance level.
- **FR-UI-035.** SCR-PAT-1's Ask tab shall route any clinical concern to the patient's care team via the existing GP-gated escalation path (Chapter 15 Journey 3) and shall never present an AI-generated answer to a clinical question as if it came directly from a clinician, nor as clinical advice (`isClinicalAdvice:false`, Chapter 11 §11.7).
- **FR-UI-036.** No control, button, form field, or affordance anywhere on SCR-PAT-1 shall ever allow a patient to submit a medication self-prescribe, dose-change, or stop-insulin request — restating Chapter 11's NO-PAT-1 and Chapter 8/9's type-level `null` locks (Chapter 17 FR-DATA-018) as an absolute, non-phased UI-affordance rule, the single most safety-critical requirement in this section.

### 18.9 Screen catalogue: Researcher

**Purpose.** Cover the ethics-gated, data-minimised persona (Chapter 3 §3.2.8), restating Chapter 13's honest six-capability finding — this Volume's most conservative persona by design.

| Screen ID | Route | Purpose | Key components | Primary actions | Related FRs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| SCR-RES-1 | `/dashboard/researcher` | Overview: KPIs, federated jobs, governance boundaries | `ResearcherKpiRow`, `FederatedJobsPanel`, `GovernanceBoundariesCard` | Navigate to sub-screens | Ch13 §13.4/§13.5 | Partial |
| SCR-RES-2 | `/dashboard/researcher/data-access` | Data-access level/scope display | access-level cards | View (elevate per OQ-PER-3) | Ch3 FR-PER-007, OQ-PER-3 | Partial |
| SCR-RES-3 | `/dashboard/researcher/evaluation` | Evaluation-harness charts + export | `EvaluationCharts`, `ExportEvaluationButton` | Run/view evaluation; export | Ch13 §13.4 (genuinely wired) | Exists |
| SCR-RES-4 | `/dashboard/researcher/settings` | Notification/data-scope/ethics settings | placeholder card | None (Phase B) | FR-UI-039 | Missing |

- **FR-UI-037.** SCR-RES-1 shall never render a "Research workspace" entry point implying a live, two-way connection into the clinical workflow — restating Chapter 12's FR-CLIN-032/033 at the researcher-facing screen level: `FederatedJobsPanel` and `GovernanceBoundariesCard` display the existing one-directional, offline export/evaluation boundary, they do not create a bidirectional link this chapter has any grounds to claim exists.
- **FR-UI-038.** SCR-RES-2's data-access-level control shall remain a UI/preference-level signal only, and shall display, plainly, that individual-level elevation is not yet backed by a hardened server-side ethics-approval check (Chapter 3 OQ-PER-3) — this chapter does not resolve that open question; it requires the screen to state the gap rather than imply the control is a completed governance mechanism.
- **FR-UI-039.** SCR-RES-4 shall retain its explicit "Coming in Phase B" placeholder disclosure — restating this Volume's honesty-over-fabrication principle; this chapter does not request building researcher settings functionality ahead of that phase.
- **FR-UI-040 (non-goal restated).** No screen in the SCR-RES group is a Literature Intelligence, interactive Cohort Builder, Biomarker Discovery, Hypothesis Generator, Trial Matching, or Scientific Writer interface — restating Chapter 13 §13.3's finding that none of these six vision capabilities has a corresponding built screen today; this chapter does not introduce placeholder screens for them.

### 18.10 Screen catalogue: Diabetes clinician panels (FUTURE — once Chapter 8 is wired)

**Purpose.** State, honestly, that no Diabetes-specific clinical screen exists today, and specify where Diabetes signal must surface once Chapter 8's v0→v1 wiring (Chapter 4 §4.3.3) actually happens — restating Chapter 12 §12.5 at the screen level rather than re-deriving it.

| Screen ID | Route (target) | Persona | Purpose | Key components (target) | Status |
| --- | --- | --- | --- | --- | --- |
| SCR-DIAB-1 | *(no new route — target integration points within SCR-GP-3, SCR-GP-1's `AgentControlPanel`, and SCR-PHM-4)* | GP / Clinical Pharmacist | Diabetes signal display once wired | Extended `OracleRiskPanel` (contributing factors), extended GUARDIAN alert list, `medication_decision`/`referral_pathway` gate items in `CaseHumanReviewPanels` | Missing |

- **FR-UI-041.** This chapter records, restating Chapter 12 FR-CLIN-016, that as of this chapter's drafting no Diabetes-module signal appears in any screen catalogued in §18.4–§18.9 — every Diabetes signal builder remains a v0 typed stub returning `insufficient_data`/`null` (Chapter 8 §8.3, Chapter 17 §17.3). This chapter does not introduce a new Diabetes-specific screen or route; it restates Chapter 12's requirement (FR-CLIN-017–020) that Diabetes signal, once wired, extends existing panels (`OracleRiskPanel`, the GUARDIAN alert list, `ScenarioRankingPanel`, the case-level gate display) rather than spawning a parallel per-disease UI.
- **FR-UI-042.** No screen in this catalogue shall be built, ahead of Chapter 8's v1 wiring, with a placeholder Diabetes panel that could be mistaken for a live signal — restating Chapter 12's EC-CLIN-2 at the build-sequencing level: an engineer implementing this chapter shall not add a "Diabetes" tab or card to any screen until there is real signal to show in it.

### 18.11 Screen catalogue: Digital Twin what-if (PARTIAL — embedded, not standalone)

**Purpose.** State where the twin what-if capability (Chapter 9) actually surfaces today — restating Chapter 9 §9.2's "generic, disease-agnostic, heart-failure-flavoured `synthetic_rules` scenario ranker" finding at the screen level.

| Screen ID | Route | Embedded within | Purpose | Key components | Status |
| --- | --- | --- | --- | --- | --- |
| SCR-TWIN-1 | *(no standalone route)* | SCR-GP-1, SCR-GP-3, SCR-HOSP-1, SCR-ICS-4 | What-if scenario ranking + digital-twin summary | `DigitalTwinPanel`, `ScenarioRankingPanel` | Partial |

- **FR-UI-043.** Every instance of `ScenarioRankingPanel`/`DigitalTwinPanel` across every screen it appears on (§18.4, §18.7) shall carry identical honesty fields (`physiologicalTwin: false`, `simulationMode: "synthetic_rules"`) — restating Chapter 9's BR-046 "no silent flip" rule at the cross-screen-instance level: no single embedding of this component may drop the disclosure the others carry.
- **FR-UI-044.** A "stop insulin" (or equivalent safety-critical cessation) scenario shall never render its ranked result on any screen in this catalogue until the linked `medication_decision` GateDecision (Chapter 17 §17.2.10, FR-DATA-019) is resolved — restating Chapter 9's stricter withhold-until-gated rule (Chapter 15 Journey 8) as a rendering-level requirement, not merely a computation-level one: the UI shall not compute-then-hide-behind-a-blur; it shall not render the ranked list at all until the gate clears.

### 18.12 Consent management screens (cross-cutting) and HITL decision UI

This section does not introduce new Screen IDs for consent; it cross-references consent-bearing panels already catalogued in §18.3–§18.9, per Chapter 17 §17.2.3's `ConsentGrant` entity, so a reader does not have to re-derive where consent is actually managed from the persona sections alone. It then restates Chapter 5's gate mechanics (§5.2) at the UI-affordance level for the decision controls every clinical screen shares.

- **FR-UI-045.** `ConsentGrantsPanel` shall be the single shared component every consent-bearing screen in this catalogue (SCR-ONB-5, SCR-GP-3, SCR-ADM-3, SCR-PAT-1's Health tab) uses to display or act on a `ConsentGrant` — restating Chapter 12's platform-reuse principle (FR-CLIN-002) specifically for consent, so that a future consent-model change (e.g. Chapter 17's still-open glucose-modality question, OQ-DATA-1) needs to change one component's behaviour, not four independently-drifted ones.
- **FR-UI-046.** Each screen's instance of `ConsentGrantsPanel` shall expose only the action set appropriate to its `mode` (admin view-only vs. clinician-facing vs. patient self-service) — restating FR-UI-032's patient-scope restriction and FR-UI-024's admin-scope restriction as one shared, mode-driven component contract rather than three independently-coded variants that could drift apart.
- **FR-UI-047.** Every consent screen shall render a grant's `status` (active/revoked) and, where revoked, its `revokedAt`/`revokedBy` (Chapter 17 §17.2.3) visibly — a revoked grant shall never render identically to an active one.
- **FR-UI-048.** Every item-level disposition control on every screen in this catalogue that presents a clinical draft (SCR-GP-1/2/3/8, SCR-NUR-3, SCR-PHM-2/4) shall expose exactly three primary actions — **Accept**, **Edit**, **Reject** — plus, where Chapter 5 §5.2.1 defines it, **Override** with a mandatory reviewer name and rationale field, and shall never expose a fourth, less-visible path (e.g. an auto-timeout, a bulk "accept all") that could resolve a draft's disposition without an explicit per-item human action.
- **FR-UI-049.** A case-level gate (`red_flag_escalation`, `referral_pathway`, `medication_decision`, Chapter 5 §5.2.2–§5.2.4) shall render as a visually distinct, blocking element on SCR-GP-8 (and any other screen surfacing the same case) — never collapsed into the same visual weight as an ordinary item-level Accept/Edit/Reject row, restating Chapter 5's FR-HITL-008 at the visual-hierarchy level.
- **FR-UI-050.** No screen shall present a case, item, or draft as "complete," "actioned," or export-ready while any linked GateDecision (Chapter 17 §17.2.5) remains at `open` — restating Chapter 12's AC-CLIN-015-1 and Chapter 5's FR-HITL-003 as a rendering rule binding on every screen in this catalogue, not only SCR-GP-8.
- **FR-UI-051.** Every disposition action's confirmation state shall display the recording actor and timestamp back to the user immediately (optimistic-then-confirmed, or confirmed-only — either is acceptable; a silently-failed disposition that the UI shows as succeeded is not) — restating this Volume's audit-trail requirement (Chapter 5 FR-HITL-014) as a UI-feedback requirement: the clinician must be able to see, on the same screen, that their decision was actually recorded, not merely assume it from the absence of an error.
- **FR-UI-052.** A gate or item resolved via one screen (e.g. SCR-GP-8) shall render its resolved state on any other screen surfacing the same case (e.g. SCR-GP-3) on that screen's next load — restating Chapter 12's EC-CLIN-1/EC-CLIN-4 server-authoritative-state finding as a UI-consistency requirement, without claiming real-time cross-tab push exists (Chapter 12 OQ-CLIN-6 remains open).

### 18.13 Cross-cutting UI rules

These rules bind every screen in this catalogue, regardless of persona, and are stated once here rather than repeated per screen.

- **FR-UI-053 (draft-not-advice labelling).** Every AI-generated clinical draft, coaching output, or recommendation displayed on any screen shall carry an explicit, equally-prominent label stating it is a draft/suggestion requiring human review — never presented, by omission of a label, as an already-actioned clinical fact or as clinical advice — restating Chapter 5's BO-4/NO-1 and Chapter 11's `isClinicalAdvice:false` requirement as a single, universal screen-level rule rather than a per-chapter restatement.
- **FR-UI-054 (explainability display).** Every screen displaying an agent-generated score, flag, or recommendation shall display its supporting evidence/contributing factors in the same view or one navigation step away — restating Chapter 12's FR-CLIN-022 platform-wide: evidence that exists in the underlying computation but is never surfaced to the viewer does not satisfy this chapter's explainability requirement, on any screen, not only the clinical ones.
- **FR-UI-055 (accessibility — perceivable).** Every screen shall remain operable and its content perceivable without reliance on colour alone (e.g. a risk-severity band shall carry a text/icon label in addition to a colour), consistent with WCAG 2.1 AA's non-colour-alone principle — this chapter states this as a product-level `shall`, not a visual implementation; the exact component-level technique remains Engineering/Design scope.
- **FR-UI-056 (accessibility — operable).** Every primary action this chapter specifies (Accept/Edit/Reject/Override, consent grant/revoke, check-in submission) shall be reachable and operable via keyboard alone, without requiring a pointer device — restating WCAG 2.1 AA's keyboard-operability principle at the product level for the specific safety-critical actions this Volume has already named.
- **FR-UI-057 (accessibility — understandable).** Every disclosure this Volume requires (demo/synthetic data, `liveEmis:false`, "hypothesis only, not causal proof," draft-not-advice, consent purpose text) shall be written in plain English at a reading level appropriate to the least clinically-literate persona who may encounter it (the Patient persona, per Chapter 11's plain-English principle) — a disclosure a Patient screen cannot understand does not satisfy this Volume's honesty requirements merely because it is technically present.
- **FR-UI-058 (empty states).** Every screen presenting a list, queue, or aggregate (a review queue, a consent-grant list, a population chart, a researcher KPI row) shall define an explicit empty state distinguishable from a loading or error state — restating Chapter 17's FR-DATA-031 (a missing-data state must never share a representation with a genuinely computed zero) at the screen level.
- **FR-UI-059 (loading states).** Every screen fetching data asynchronously shall render an explicit loading state (the existing `HeaderSkeleton`/`SignInFormSkeleton` pattern is the model to extend, not replace) rather than a blank screen or a flash of incorrect/default data — an engineer implementing a new screen against this chapter shall not treat a loading state as optional polish.
- **FR-UI-060 (error states).** Every screen shall define an explicit error state for its own primary data fetch/action failure modes (a failed disposition, a failed consent grant, a failed evaluation export) and shall never silently swallow an error as though the action succeeded — restating FR-UI-051's disposition-specific requirement as a general rule across every screen and action in this catalogue.
- **FR-UI-061 (no dose-change UI affordance for patients — absolute).** No screen, tab, panel, or component ever rendered within a `patient`-role session shall present a control capable of submitting a medication dose-change, self-prescribe, or medication-cessation (including "stop insulin") request, regardless of which persona's screen the underlying component is shared with — restating FR-UI-036, Chapter 11's NO-PAT-1, and Chapter 17's FR-DATA-018 as this chapter's single most absolute, non-phased rule, binding even on a future shared-component refactor that might otherwise be tempted to expose a clinician-facing control to a patient session by omission.

### 18.14 Unification requirements (Chapter 12's single-workspace aspiration vs. today's split surfaces)

- **FR-UI-062.** This chapter restates, and does not soften, Chapter 12 §12.2's central finding: the GP persona's screens (§18.4) are delivered today across at least **four** surfaces once this chapter's own catalogue is accounted for in full — the GP dashboard (SCR-GP-1), the patient-detail workspace (SCR-GP-3), the standalone review queue (SCR-GP-2), and the generic case workflow (SCR-GP-7/8/9/10) — one more surface than Chapter 12's three-surface framing named, because Chapter 12 did not separately catalogue SCR-GP-2 as distinct from SCR-GP-1. This chapter's own contribution is this correction: SCR-GP-2 is a materially different screen (patient-scoped or all-queue, no patient header, no sidebar) from SCR-GP-1, not a re-presentation of it.
- **FR-UI-063.** A future unification effort (Chapter 12 OQ-CLIN-1) that consolidates any of SCR-GP-1/2/3/7/8 into fewer screens shall preserve every FR this chapter and Chapter 12 already bind to the panels being consolidated (the Accept/Edit/Reject mechanism, FR-UI-014/048; the gate-visibility rule, FR-UI-049; the explainability display, FR-UI-054) — consolidation is a screen-count change, not licence to drop a requirement because it was previously satisfied by a screen that no longer exists post-consolidation.
- **FR-UI-064.** This chapter does not specify the information-architecture solution to Chapter 12's OQ-CLIN-1 (single shell vs. navigation-only change) — it records the screen inventory that any such solution must account for (§18.4's eleven GP-area screens) and defers the actual consolidation design to the product/design/engineering effort Chapter 12 already flagged as needed.

### 18.15 Non-goals

- **NO-UI-1.** This chapter is not a Figma file, wireframe set, or visual mockup of any screen — no layout, spacing, typography, colour palette, or componentised design-system artifact is produced or implied by this document; every requirement here is behavioural ("what a screen must show and do"), not visual ("what a screen must look like").
- **NO-UI-2.** This chapter does not redesign, restyle, or propose changes to the existing Clinical Signal brand or visual design system — any future brand/visual-design work is separate, Design-owned scope this chapter neither authorizes nor blocks.
- **NO-UI-3.** This chapter does not introduce a new screen, route, or component that has no grounding in either an existing route (§18.2–§18.9) or an already-specified future requirement from an earlier chapter (§18.10–§18.11's Diabetes/Twin sections, both explicitly labelled FUTURE/PARTIAL) — it does not invent a screen "because the product vision implies one should exist" without that earlier-chapter grounding.
- **NO-UI-4.** This chapter does not modify any file under `app/`, `components/`, or `lib/` — restating this Volume's own no-code-changes discipline (every prior chapter's closing "what this turn does not do" note) specifically for a chapter that, by its nature, discusses the `app/` route tree in unusually granular detail.
- **NO-UI-5.** This chapter does not resolve Chapter 12's OQ-CLIN-1 (workspace-unification approach), OQ-CLIN-2 (Evidence-panel unification), or OQ-CLIN-3 (`HealthPlanDraft`/`CarePathway` merge) — it restates each as still-open and shows, via §18.4/§18.12, exactly which screens any resolution would touch, without pre-empting the decision itself.
- **NO-UI-6.** This chapter does not specify a component library, design-token system, or CSS/styling implementation approach — "key components" cells in this chapter's tables cite existing component file names for traceability to the current build, not as a prescription for how a future redesign must be componentised.
- **NO-UI-7.** This chapter does not catalogue the internal engineering/demo-readiness tooling reachable at `/workspace` and its linked `/review/ops`, `/review/roadmap`, `/review/rehearsal`, `/review/pilot`, `/review/team-mode`, `/review/presenter`, `/review/governance-pack`, `/review/meeting-packet`, `/review/dossiers`, `/review/summary`, `/review/simulated-patients`, `/review/readiness`, `/review/benchmarks`, `/review/command-centre`, `/review/failures`, `/review/feedback`, and `/review/demo-mode`/`/review/demo-readiness` routes — these are internal engineering/sales-readiness dashboards for the program itself, not a screen any of Chapter 3's 8 product personas uses in the course of their own job, and are out of this chapter's persona-facing scope (this is a scope boundary, not a claim that this tooling is unimportant).

### 18.16 Edge cases

- **EC-UI-1 (consent revoked while a screen is mid-render).** Given a patient's `coaching_wellness` grant is revoked (Chapter 17 EC-DATA-1) while SCR-GP-3's `ConsentGrantsPanel` or SCR-PAT-1's Health tab is already open in a session, the screen shall reflect the revoked status on next data refresh and shall not continue silently offering an action (e.g. viewing a coaching draft) predicated on the now-revoked purpose — this chapter does not require real-time, in-session invalidation of an already-rendered view (Chapter 12 OQ-CLIN-6's server-authoritative-on-refresh model applies here too).
- **EC-UI-2 (empty review queue).** Given a GP, Nurse, or Pharmacist screen's queue (SCR-GP-1/2, SCR-PHM-4) has zero actionable items, the screen shall render an explicit "nothing pending" empty state (FR-UI-058) distinguishable from a loading state — this chapter does not specify the empty state's exact copy, only that one must exist and must not be confused with "still fetching."
- **EC-UI-3 (Diabetes-adjacent screen viewed before wiring).** Given a clinician views SCR-GP-3 for a diabetic patient before Chapter 8's v1 wiring lands, no panel on that screen shall display a placeholder implying Diabetes-specific intelligence is running — restating Chapter 12's EC-CLIN-2 and this chapter's FR-UI-042 together as the binding rule for this exact scenario.
- **EC-UI-4 (twin scenario requested with an open unrelated gate).** Given a patient already has an open `medication_decision` gate from an unrelated GUARDIAN flag, and a GP separately requests a twin what-if scenario for the same patient on SCR-GP-3, the screen shall present the two `medication_decision` instances (the existing flag's gate and any new one the scenario generates) as visually distinguishable, per-trigger elements — restating Chapter 15's EC-FLOW-6 at the rendering level, still without a named final visual treatment (Chapter 15's OQ-FLOW-6 remains open).
- **EC-UI-5 (demo-reset triggered mid-session on another user's screen).** Given a Practice Manager triggers a demo-reset (SCR-ADM-1) while a GP's SCR-GP-8 session has an unsaved, in-progress disposition, the GP's screen shall warn before the reset silently discards that in-progress state — restating Chapter 15's EC-FLOW-5 and Chapter 16's BR-018 at the screen level, still without a named exact UX mechanism (Chapter 15's OQ-FLOW-6 covers this too, jointly with EC-UI-4's question).

### 18.17 Open questions

- **OQ-UI-1.** Should SCR-GP-2 (`/dashboard/gp/review-queue`) be merged into SCR-GP-1, or kept as a deliberately separate, narrower "just the queue" screen for a GP who wants to work through items without the full dashboard's patient-strip/sidebar chrome? This chapter's FR-UI-062 records the screen-count correction; it does not decide the consolidation question, which folds into Chapter 12's existing OQ-CLIN-1. **Owner:** Product + Design.
- **OQ-UI-2.** Should the Nurse and Pharmacist screen groups (§18.5) gain a lightweight Timeline panel, restating Chapter 12's OQ-CLIN-4 at the screen-catalogue level with this chapter's concrete screen IDs (SCR-NUR-1–4, SCR-PHM-1–4) as the candidate targets? **Owner:** Product + Clinical Safety Lead.
- **OQ-UI-3.** What is the exact visual/interaction treatment for EC-UI-4 (overlapping `medication_decision` gate instances) and EC-UI-5 (demo-reset mid-session warning)? This chapter states both must be distinguishable/must warn respectively; it does not design the exact modal, banner, or inline-badge treatment — restating Chapter 15's OQ-FLOW-6 verbatim at the UI layer. **Owner:** Product + Design.
- **OQ-UI-4.** Should SCR-PAT-1's Check-ins tab be blocked from accepting submissions entirely until a backing API exists (an honest "not yet available" state), or should it continue accepting and locally-only-storing input as it does today, clearly labelled as not yet persisted? FR-UI-033 requires disclosure either way; it does not choose between these two options. **Owner:** Product + Engineering.
- **OQ-UI-5.** Should the researcher data-access elevation control (SCR-RES-2) be hidden entirely until Chapter 3's OQ-PER-3 (a hardened server-side ethics-approval check) is resolved, or should it remain visible-but-disclosed as it is today (FR-UI-038)? **Owner:** Clinical Safety Lead + Compliance.
- **OQ-UI-6.** Should this Volume introduce a formal, numbered accessibility conformance target (e.g. "WCAG 2.1 AA, binding for pilot") in a future Non-Functional Requirements chapter (Chapter 19), rather than this chapter's product-level `shall` statements (FR-UI-055–057) standing alone without a named testable conformance level? **Owner:** Product + Compliance, expected to land in Chapter 19.
- **OQ-UI-7.** Should the internal engineering/demo-readiness tooling this chapter excludes (NO-UI-7, `/workspace` and its `/review/*` sub-tree) receive its own lightweight screen inventory in a future appendix (Chapter 22), given it is extensive enough (over 20 routes) to warrant documentation even though it is out of this chapter's persona-facing scope? **Owner:** Product + Engineering.

### 18.18 Cross-references

- Chapter 3 (§3.1–§3.4 the 8 personas and their persona→surface mapping, §3.5 FR-PER-005/009, §3.6 FR-PER-011/012/013) — the persona set and access rules every screen entry in §18.2–§18.11 is scoped against.
- Chapter 5 (§5.2 the full gate catalogue, FR-HITL-003/008/014/032) — the HITL mechanics §18.12's UI-affordance requirements restate without redefining.
- Chapter 8 (§8.3 phasing, NO-DIAB-7) and Chapter 9 (§9.2/§9.4 twin current-state, NO-TWIN-1) — the current-build status §18.10/§18.11 restate at the screen level.
- Chapter 11 (§11.2 the nine-capability baseline table, NO-PAT-1) — the honest patient-capability rating and the absolute no-dose-change rule §18.8/§18.13 restate.
- Chapter 12 (§12.2 the three-(now-four-)surface finding, §12.3 role-specific variants, §12.4 queue/gate mechanics, §12.6 evidence display, §12.9 non-goals, §12.11 open questions) — this chapter's single most load-bearing cross-reference; §18.4–§18.6, §18.12, §18.14 all extend Chapter 12's findings to full screen-catalogue granularity rather than re-deriving them.
- Chapter 13 (§13.3 the six-capability research baseline) — the honest researcher-screen rating §18.9 restates.
- Chapter 15 (Journeys 1–8, EC-FLOW-5/6, OQ-FLOW-3/6) — the journey-level UX questions §18.16's edge cases restate at the screen level.
- Chapter 16 (BR-018 demo-reset non-destructiveness) — the business rule EC-UI-5 restates.
- Chapter 17 (§17.2.3 ConsentGrant, §17.2.5 GateDecision, §17.2.10 TwinScenarioResult, §17.5 honesty-over-fabrication, EC-DATA-1) — the entity catalogue every consent/gate/twin screen in this chapter displays or acts on.
- `/dashboard/gp`, `/dashboard/gp/review-queue`, `/dashboard/gp/patients/[id]`, `/dashboard/gp/care-pathways`, `/dashboard/gp/reports`, `/dashboard/gp/settings`, `/review`, `/cases/[id]`, `/cases/[id]/evidence`, `/cases/[id]/dossier`, `/cases/[id]/report`, `/dashboard/nurse*`, `/dashboard/pharmacist*`, `/dashboard/admin*`, `/dashboard/ics*`, `/dashboard/hospital*`, `/dashboard/patient`, `/dashboard/researcher*`, `/onboarding*`, `/signin`, `/signup`, `/demo*` — every current-state claim in §18.2–§18.11 is a direct restatement of these routes' actual, as-read composition.

---

## 23. Chapter 19 — Non-Functional Requirements `[DRAFTED]`

### 19.0 Purpose of this chapter

Chapters 1–18 specify what the platform must **do** — for whom, through which agents, gated by which human decisions, on which screens. This chapter, opening Part F (Quality & Governance), specifies how well the platform must do it: the cross-cutting quality attributes (performance, reliability, security, privacy/compliance posture, observability, accessibility, maintainability, and AI/ML-specific non-functional behaviour) that bind every chapter above regardless of persona, agent, or disease module. Per §0.6, every requirement here carries a flat `NFR-<nnn>` id (not chapter-coded per-area, since non-functional attributes are inherently cross-cutting rather than owned by one capability area).

**Grounding discipline for this chapter specifically.** Two failure modes are equally unacceptable for an NFR chapter: (a) inventing precise-sounding numbers (a 99.9% uptime SLA, a 200ms p95, a signed pen-test date) that no test, log, or evidence artefact in this repository actually backs; and (b) refusing to state any number at all and leaving every attribute as vague prose. This chapter resolves that tension the same way Chapter 1 §1.5 resolved it for Success Criteria: every requirement below is tagged **[MEASURED]** (a real test, script, or evidence artefact in this repository already produces this number or this behaviour, cited by file path), **[ASPIRATIONAL — NEEDS BASELINE]** (a legitimate target with no current measurement — stated as a goal, not a claim), or **[PROCESS GATE — NOT YET EVIDENCED]** (a required governance/assurance step — DPIA, pen test, DR drill — that is process-defined but has not yet produced a signed or dated result). An untagged `shall` statement is a behavioural requirement enforced in code today (verifiable by reading the cited file), not a numeric target.

This chapter is grounded in `docs/ADR_TECH_STACK_MODERNIZATION.md`'s Keep/Add-later/Avoid-now framing (§0.4): no requirement below implies or requires an "Avoid now" component (ClickHouse, Redis, Kafka, Temporal, a dedicated APM/tracing platform, a dedicated inference/MLOps stack) without naming the ADR's own trigger for revisiting it. It is also grounded in the platform's actual evidence-pack artefacts (`docs/evidence-pack/`) as they exist today — several of which are honestly labelled **GAP** (not yet run) rather than pretended complete — and in Chapter 5's fail-safe mechanics (§4.5's data-flow table, cross-referencing Chapter 5's FR-HITL numbers), which this chapter treats as the platform's actual reliability requirements already enforced in code, not a new proposal.

### 19.1 Measurement-status convention

- **[MEASURED]** — a test (`npm run test:clinical-proof` and its constituent suites, `e2e/accessibility.spec.ts`, `lib/clinical-proof/perf-slos.ts`) or a dated evidence-pack artefact already produces this number or confirms this behaviour today. Cited by file path so a reader can re-run it.
- **[ASPIRATIONAL — NEEDS BASELINE]** — a legitimate target for the platform to eventually meet, with no current measurement, no completed baseline run, and no clinical/commercial claim implied. Must not be quoted externally as an achieved result, mirroring Chapter 1 §1.5.2's rule for Success Criteria.
- **[PROCESS GATE — NOT YET EVIDENCED]** — a required assurance step (external security review, disaster-recovery drill, DPIA/CSO sign-off) that this Volume requires happen before a related claim can be made, where the evidence-pack artefact for that step is currently a dated **GAP** placeholder, not a completed record.
- An **untagged** `shall`/`shall not` statement is a behavioural (not numeric) requirement already enforced in code, cited by file.

### 19.2 Performance & scalability

**Honest scale statement.** Every performance figure in this section is measured (or, where marked, not yet measured) against the platform's actual current data scale: the ~100-patient synthetic cohort in `lib/mock-data/`, not the separately-authored, illustrative-only 47,832-patient ICS fixture Chapter 10 §10.2 already flagged as disconnected from it. No performance requirement in this chapter should be read as validated at real multi-practice or multi-thousand-patient scale.

| SLO id | Label | Soft target | Hard ceiling | How measured |
| --- | --- | --- | --- | --- |
| `dashboard_load` | GP / role dashboard TTFB (HTML) | ≤ 3s | ≤ 8s | `GET /dashboard/*` server response time |
| `agent_draft` | Agent draft API (deterministic / LLM-off) | ≤ 5s | ≤ 15s | `POST /api/agents/guardian` with `ENABLE_LLM_*=false` |
| `review_action` | Review action path (HITL accept→stage contract) | ≤ 2s | ≤ 6s | In-process HITL chain unit timing |

Source of truth: `lib/clinical-proof/perf-slos.ts` (`PERF_SLO_TARGETS`), exercised by `npm run test:clinical-proof` (test id `CP-PERF-001`) and documented in `docs/evidence-pack/09-performance-load.md`.

- **NFR-001 [MEASURED].** The platform shall meet the `dashboard_load` soft target (≤3s) for GP/role dashboard TTFB under smoke-test conditions, with the hard ceiling (≤8s) as the outer bound before a soft-fail is recorded — per `lib/clinical-proof/perf-slos.ts`.
- **NFR-002 [MEASURED].** The platform shall meet the `agent_draft` soft target (≤5s) for the deterministic/LLM-off draft API path, with an ≤15s hard ceiling — this target does not cover the LLM-on path (§19.9, NFR-052).
- **NFR-003 [MEASURED].** The platform shall meet the `review_action` soft target (≤2s) for the in-process HITL accept→stage contract, with an ≤6s hard ceiling.
- **NFR-004.** These three SLOs are soft-by-default in CI (a soft-target miss is a warning, not a build failure) and are only hard-enforced when `PERF_SMOKE_STRICT=true` is explicitly set — a cold serverless start or shared-CI latency spike shall not be conflated with a production performance failure, per `docs/evidence-pack/09-performance-load.md`'s own honesty note ("Soft targets may miss on cold serverless / shared CI — that is not production load PASS").
- **NFR-005 [ASPIRATIONAL — NEEDS BASELINE].** Platform performance and scalability at real multi-practice or multi-thousand-patient scale is an aspirational target with no current baseline: `docs/evidence-pack/09-performance-load.md` states plainly that only a **perf smoke** exists today ("not a full load / soak test") and that "full load / pen-adjacent soak remains **GAP** until ops run." No production-scale performance claim shall be made from the current smoke suite alone.
- **NFR-006.** Population-level and ICS-dashboard aggregation shall remain on the existing Postgres/Neo4j aggregation path at current and near-term (synthetic-cohort) scale — restating Chapter 4's FR-ARC-017 and Chapter 10's NO-POP-2, this chapter does not mandate ClickHouse or any other analytics-warehouse deployment. The Tech Stack ADR's named trigger (real multi-practice, multi-thousand-patient scale producing an observed Postgres/Neo4j aggregation bottleneck) remains unfired and unchanged by this chapter.
- **NFR-007 [ASPIRATIONAL].** The existing Lighthouse LCP soft budget (`scripts/run-lighthouse.mjs`; a 4-second local/dev-only budget asserted in `e2e/accessibility.spec.ts`, explicitly skipped in CI) is a development aid, not a production performance SLA — it shall not be cited as evidence of production page-load performance.
- **NFR-008.** Any future performance or scalability requirement that would implicitly require an "Add later" or "Avoid now" infrastructure component from `docs/ADR_TECH_STACK_MODERNIZATION.md` (e.g. Redis for a demonstrated cache-miss problem, ClickHouse for demonstrated analytics-scale limits, MinIO for real binary storage) shall name that ADR's specific trigger explicitly rather than assuming the component is already warranted.

### 19.3 Reliability & availability

**Deployment reality.** The platform runs today as a single deployed Next.js application (Vercel) with Neon Postgres and Neo4j Aura as its data layer — the entire "Keep now" stack per the Tech Stack ADR's Frontend/Backend/Data tables. There is no second service, no message queue, and no independently-deployed worker tier; every reliability requirement below is scoped to that single-deploy-unit reality, not to a distributed-systems topology the product does not have.

- **NFR-009.** No reliability or availability requirement in this Volume shall implicitly assume an infrastructure topology (a second backend service, a message broker, a durable-workflow engine) beyond the Tech Stack ADR's "Keep now" bucket without naming that ADR's specific trigger for the corresponding "Avoid now"/"Add later" component (NestJS, Kafka, Temporal — all "Avoid now").
- **NFR-010 [ASPIRATIONAL — NEEDS BASELINE].** No formal uptime/availability percentage SLA (e.g. "99.9% uptime") exists or is claimed for the platform today. Any such figure would require a defined measurement window, an incident-tracking process, and a baseline period — none of which exist yet. This chapter does not invent one.
- **NFR-011 [PROCESS GATE — NOT YET EVIDENCED].** Disaster recovery (a Neon/Vercel backup-restore drill) has not been run: `docs/evidence-pack/12-disaster-recovery.md` is a dated placeholder stating "GAP — Neon/Vercel restore drill not evidenced." The platform shall not claim disaster-recovery readiness, and this chapter does not state an RTO/RPO figure, until that drill is run and evidenced.
- **NFR-012.** Where consent for the relevant purpose code is not `active`, the platform shall exclude the affected patient's data from processing entirely, rather than proceeding on stale or unauthorized consent — restating Chapter 5's FR-HITL-012 as this chapter's own fail-safe reliability requirement.
- **NFR-013.** On agent timeout or an agent proceeding without independent corroborating evidence, CONDUCTOR orchestration shall throw and return no result, rather than returning a partial or degraded draft as though it were complete — restating Chapter 5's FR-HITL-031/032: a safety-relevant failure fails closed to "nothing produced," never open to "something incomplete, unlabelled, produced."
- **NFR-014.** A case shall not reach a finalization-ready or "actioned" state while any required case-level gate remains `open` — restating Chapter 5's FR-HITL-008 and Chapter 18's FR-UI-050 as this chapter's own availability-of-correct-state requirement.
- **NFR-015.** If Postgres is unreachable at write time (e.g. `DATABASE_URL` unset or the database down), the platform shall fall back to the controlled JSON file store under `data/` for learning-event and consent-registry writes, rather than failing the underlying clinical Accept/Edit/Reject/Defer action being recorded — restating Chapter 14's FR-LEARN-010/EC-LEARN-3 and Chapter 6's FR-CORE-013 (the consent mirror is "best-effort" and never blocks the JSON-file source of truth).
- **NFR-016.** If Neo4j is unreachable, the platform shall render an honest mock-fallback banner rather than silently substituting fabricated or stale aggregate data — restating the existing `mock-fallback` pattern (`lib/neo4j/mock-fallback.ts`, Chapter 10 §10.2) as a reliability requirement, not merely a UI nicety.
- **NFR-017.** A failed audit or best-effort-mirror write shall itself be surfaced (logged or flagged) rather than silently swallowed, even though — per NFR-015 — it must never itself block the clinical action it is recording; restating Chapter 18's general error-state rule (FR-UI-060) at the audit-durability layer.

### 19.4 Security

- **NFR-018.** The platform shall resolve identity exactly once per request, at the session/JWT boundary, with every downstream authorization check consuming that resolved identity — restating Chapter 6's FR-CORE-001.
- **NFR-019.** The platform shall carry a single `UserRole` per identity and shall not allow a request to assert a different role than the one on its resolved session — restating FR-CORE-002.
- **NFR-020.** The platform shall fail closed — deny, not allow — for any role string it does not recognize on a clinical-record API, rather than defaulting to permissive access — restating FR-CORE-006.
- **NFR-021.** A `patient`-role identity shall be restricted to their own bound `patientId` on every patient-identifiable surface and shall fail closed (403) when no bound patient id exists on the session — restating FR-CORE-005.
- **NFR-022.** Tenant isolation shall be applied identically at every product layer that returns patient- or practice-scoped data — core clinical records, Population Intelligence aggregates, Disease Intelligence signals, Research Intelligence exports — restating Chapter 4's FR-ARC-006/031.
- **NFR-023.** Cross-practice SHIELD audit-trail reads shall be denied by the same tenant-isolation mechanism that scopes clinical-record access — restating Chapter 5's FR-HITL-017.
- **NFR-024.** Every optional or rehearsal-only integration (Medplum sync, FastAPI synthesis) shall remain off by default and activate only via an explicit environment flag, never a silent runtime detection of partner credentials — restating Chapter 4's FR-ARC-036.
- **NFR-025 [MEASURED].** 100% of clinical-facing AI outputs that reach a clinician shall be captured in the SHIELD hash-chained audit trail — restating Chapter 1's SC-3, verified today by audit-coverage tests within `npm run test:clinical-proof`. This chapter treats SC-3 as its own binding security/audit requirement, not merely a success criterion.
- **NFR-026 [PROCESS GATE — NOT YET EVIDENCED].** No external, independent security penetration test has been performed: `docs/evidence-pack/08-security-pen-test.md` is a dated placeholder stating "GAP — schedule external pen test. Do not claim PASS." The platform shall not claim a security "pass" or "hardened" status from internal testing alone until this gate is scheduled, run, and evidenced.
- **NFR-027.** `buildRolePermissionMatrix()`'s own honest `productionRbacEnforced: false` field (Chapter 6 §6.1) shall remain literal until the permission matrix is extended to cover all 8 personas (Chapter 6's OQ-CORE-1) and independently verified — the fact that tenant/patient isolation (FR-CORE-004/005) is genuinely enforced today shall not be conflated with, or presented as, full RBAC-matrix completeness.
- **NFR-028.** Secrets and credentials (database connection strings, OAuth client secrets, third-party API keys) shall be supplied only via environment configuration, never committed to the repository, and never written into any SHIELD or other audit record in plaintext.

### 19.5 Privacy & compliance posture

**Honest framing.** This Volume does not hold, and this chapter does not claim, any formal regulatory certification. Every "compliance" requirement below is either an enforced honesty-field behaviour already in code, or a named process gate that must be completed — signed by the accountable role, with a dated artefact — before a stronger claim could ever be made. No DPIA, DCB0129, DCB0160, MHRA classification, DTAC, or CIS2 accreditation is asserted as obtained anywhere in this section.

- **NFR-029.** The platform shall never claim, imply, or allow marketing/sales material to imply a regulatory or safety certification that has not actually been obtained — the literal `false` honesty fields already in code (`signedDpia`, `signedCsoGate2`, `signedDcb0129`, `signedMhra`, `namedCsoAssigned` in `SPINE_PARTNER_HONESTY`) shall remain `false` until each is genuinely true, updated one at a time, never as a bundled assumption — restating Chapter 5's FR-HITL-024 and Chapter 1's NO-6.
- **NFR-030 [PROCESS GATE — NOT YET EVIDENCED].** A documented partner go/no-go (a signed DPIA, a signed CSO Gate 2, and — where applicable — an MHRA determination) shall be completed and recorded before any EMIS/SystmOne adapter transitions from staged/queued to a live write path, regardless of its configuration state — restating Chapter 6's FR-CORE-020 and Chapter 5 §5.6. None of these three has been signed as of this version.
- **NFR-031.** Real, identifiable patient data shall not be ingested, processed, or displayed under this Volume's current scope; any transition to real patient data is a separate, explicitly governed decision requiring consent, a DPIA, and regulatory review, and is not implied or unlocked by any requirement in this chapter — restating Chapter 1's NO-9 and Chapter 2's NS-4.
- **NFR-032.** Existing compliance-adjacent marketing copy (`lib/compliance-labels.js`: "GDPR-aligned design," "NHS DSPT pathway," "ISO 27001 pathway," "clinical safety governance... not a signed DCB0129 / MHRA case") shall retain its existing pathway/framing qualifier language and shall never be shortened, in a future edit, in a way that drops that qualifier and implies a completed certification.
- **NFR-033.** Exact data-retention periods (days/years) per Chapter 17's four-tier sensitivity/retention classification remain an open, Compliance/DPO-owned decision (Chapter 17's OQ-DATA-4) — this chapter restates that gap rather than inventing retention figures to fill it.
- **NFR-034.** A patient's full data lineage shall remain reconstructable from the consent registry, the modality-sample provenance record, and SHIELD, so a compliance reviewer can answer "why does the platform have this, and what happened to it" without a separate lineage-tracking system — restating Chapter 6's FR-CORE-015 as a compliance-readiness requirement.
- **NFR-035.** No population-level or research export shall cross the `clinical_research_deidentified`/`population_analytics` purpose boundary without applying a de-identification/aggregation threshold — this chapter restates, rather than resolves, Chapter 4's still-open k-anonymity/small-cell-suppression question (OQ-ARC-2).

### 19.6 Observability

- **NFR-036.** SHIELD shall remain the single audit/observability system of record for clinical-facing decisions; this chapter does not request a separate logging, tracing, or metrics platform — restating Chapter 4's FR-ARC-012.
- **NFR-037.** Hazard-log entries (`docs/HAZARD_LOG_TEMPLATE.md`, e.g. H-011 "silent model update," H-013 "graph mock treated as live") shall record known safety-relevant gaps with their linked test IDs; an unsigned hazard (e.g. H-011/H-012, currently **Unsigned** per Chapter 14) shall be recorded as such, never hidden or presented as resolved.
- **NFR-038.** Every screen and asynchronous action shall define an explicit loading, empty, and error state — restating Chapter 18's FR-UI-058–060 — as this chapter's own product-level "observable to the user" requirement, distinct from backend telemetry.
- **NFR-039.** A dual-storage fallback write (the Postgres-unavailable JSON-file path for learning events or consent, NFR-015) shall itself be distinguishable or flagged in its own record, not indistinguishable from a normal primary-store write, so a future audit can tell which path a given record took.
- **NFR-040.** This chapter does not mandate a new application-performance-monitoring or distributed-tracing platform (e.g. Sentry, Datadog); consistent with the Tech Stack ADR's governing rule ("infrastructure is added when a concrete, observed bottleneck demands it"), any future observability-platform addition shall be evaluated against a named, observed gap in SHIELD's current audit-of-record coverage, not adopted speculatively.

### 19.7 Accessibility

- **NFR-041.** WCAG 2.1 AA is the platform's binding accessibility conformance target for pilot readiness, applying to every screen in Chapter 18's 59-screen catalogue — this resolves Chapter 18's OQ-UI-6, which flagged the need for a formal, numbered conformance target rather than product-level `shall` statements (FR-UI-055–057) standing alone.
- **NFR-042 [MEASURED — partial].** Automated evidence exists today for exactly 2 of the 59 catalogued screens: `e2e/accessibility.spec.ts` runs an `@axe-core/playwright` check against the homepage and `/signup`, checking only **critical**-impact violations against the `wcag2a`/`wcag2aa`/`wcag21a`/`wcag21aa` rule tags.
- **NFR-043 [ASPIRATIONAL — NEEDS AUDIT].** Full-catalogue WCAG 2.1 AA conformance — automated coverage of the remaining 57 screens, plus a manual keyboard-only and screen-reader walkthrough of the safety-critical actions Chapter 18 §18.13 names (Accept/Edit/Reject/Override, consent grant/revoke, check-in submission) — has not been performed. Current compliance beyond the 2 axe-checked routes is **unknown**, not assumed passing.
- **NFR-044.** The existing axe-core critical-violation check shall be extended to new screens as they ship, not removed or weakened, and its severity scope shall only be widened beyond "critical" once a remediation plan exists for the lower-severity findings that widening would surface.
- **NFR-045.** Chapter 18's technique-agnostic accessibility `shall` statements (FR-UI-055 non-colour-alone, FR-UI-056 keyboard operability, FR-UI-057 plain-English disclosure) remain this Volume's binding requirements; this chapter adds the numbered conformance target (NFR-041) on top of them, it does not restate or replace their technique-level content.

### 19.8 Maintainability & testability (for Cursor-built changes)

**Existing test surface.** The platform's automated proof suite (`npm run test:clinical-proof`) already chains fourteen suites — cohort, FHIR shape, FHIR R4, graph, HITL, HITL chain, SHIELD, RBAC, golden-paths, learning, perf-SLOs (NFR-001–003), hazard-trace, Medplum, and tenant-isolation — plus a separate workflow suite (`npm run test:workflow`), a Playwright e2e suite (`npm run test:e2e`, with a clinical-proof-scoped subset `test:e2e:clinical-proof`), a golden-case agent evaluation harness (`npm run eval:agents`), and a typecheck gate (`npm run typecheck`, `tsc -p tsconfig.verify.json`). This section's requirements bind how a Cursor-driven change must interact with that existing surface — it does not propose a new testing framework or CI system.

- **NFR-046.** A Cursor-authored change touching any clinical-facing path shall keep `npm run test:clinical-proof`'s full chained suite green before being considered complete.
- **NFR-047.** A Cursor-authored change shall keep `npm run typecheck` green; a type error introduced by the change shall not be silenced by a newly added type-escape hatch whose only purpose is to make that change pass.
- **NFR-048.** A change altering a workflow-level contract (API shape, integration boundary, repository parity) shall keep `npm run test:workflow` green.
- **NFR-049.** A new or changed screen shall keep the relevant Playwright specs (`test:e2e`, and `test:e2e:clinical-proof` where the screen is clinical-proof-scoped) passing; an existing spec shall not be deleted or skipped to make a change pass without an explicit, reviewed reason recorded in the change itself.
- **NFR-050.** Every `FR-*`/`NFR-*` this Volume defines should be traceable to at least one test case once implemented; an implementation prompt or change description should cite the requirement id it satisfies where practical — restating §0.2's QA-audience expectation as a testability requirement, not merely an aspiration.
- **NFR-051.** This chapter's own citations (test script names, evidence-pack file paths, source file paths) are subject to this Volume's existing currency-maintenance pattern (Chapter 16's BR-CR-3, Chapter 18's FR-UI-004): a future rename or removal of a cited script or file is a documentation-currency defect to correct at the next revision, not a silently stale reference.

### 19.9 AI/ML non-functional requirements

- **NFR-052 [ASPIRATIONAL — NEEDS BASELINE].** The `agent_draft` SLO (NFR-002, soft 5s/hard 15s) applies only to the deterministic/LLM-off draft path. Latency for the LLM-on path (`ENABLE_LLM_SYNTHESIS`/`GUARDIAN`/`ORACLE`/`DR_ASSIST`/`NEXUS=true`, routed through the Vercel AI Gateway) is not separately measured or budgeted today; a pilot enabling any `ENABLE_LLM_*` flag shall establish its own latency baseline before assuming the deterministic-path SLO applies.
- **NFR-053.** CONDUCTOR's orchestration control flow shall remain deterministic and reproducible for a given input and configuration — restating the Tech Stack ADR's twice-reaffirmed rejection of a LangGraph-style non-deterministic agent planner (`docs/BUILD_INSTRUCTIONS_GAP.md`; Chapter 7 §7.1) as a binding non-functional requirement of this Volume, not merely an architecture-document note: a HITL clinical-safety pipeline needs predictable, auditable control flow, and this chapter treats that predictability itself as an NFR.
- **NFR-054.** No model, prompt, or scoring-rule version shall change except via the fully-signed G-ML-1/2/3 sequence, followed by a separate, manual ops-executed release step — restating Chapter 14's FR-LEARN-021/024. This chapter's AI/ML NFRs do not create, and shall not be read as implying, a faster or parallel path around that sequence.
- **NFR-055.** `autoRetrainTriggered` and `modelUpdated` shall remain literal `false` unconditionally at the database-insert level (restating Chapter 14 §14.2) — an NFR framed around "AI quality" or "AI improving over time" shall never be interpreted as licence to relax this hard-coded guarantee.
- **NFR-056.** The golden-case evaluation harness (`npm run eval:agents`) is a rehearsal scorecard, not a clinical-validation certificate — restating Chapter 14 §14.4. This chapter cites it as the platform's AI-quality-regression mechanism without upgrading its status.
- **NFR-057.** The Vercel AI Gateway's model routing and deterministic-fallback pattern remains the platform's only sanctioned AI-serving path at current scale; no dedicated inference infrastructure or MLOps platform is required — restating the Tech Stack ADR's AI-models table and its v2 tie-in note that even a future governed model swap "does not introduce a new model-serving stack."

### 19.10 Demo vs. production NFR differences

- **NFR-058.** Every NFR in §19.2–19.4 measured via `test:clinical-proof`/`perf-slos.ts` is measured under Track A demo/synthetic-cohort conditions (the ~100-patient cohort, `liveEmis:false`) — none of it constitutes evidence of Track B (live-EHR, real multi-practice) readiness, restating `docs/BUILT_VS_REMAINING_AUDIT.md`'s Track A GO / Track B NO-GO split (Chapter 1 §0.4).
- **NFR-059.** A production or paid-pilot deployment at real patient volume requires, at minimum, a fresh performance baseline at that volume (NFR-005), an external security penetration test (NFR-026), and an evidenced disaster-recovery drill (NFR-011) before any demo-measured NFR in this chapter may be re-asserted as production-measured.
- **NFR-060.** Demo-mode-specific behaviour (deterministic fixtures, seeded `@demo.akshhealth.com` credentials, the `/demo/*` scripted walkthrough) shall never be the basis for a production NFR claim — restating Chapter 18's FR-UI-009 demo-disclosure rule at the NFR level.

### 19.11 Non-goals

- **NO-NFR-1.** This chapter does not perform, and does not report the results of, a full load or soak test at production scale — restating `docs/evidence-pack/09-performance-load.md`'s own "not a full load / soak test" framing (§19.2, NFR-005).
- **NO-NFR-2.** This chapter does not conduct, and does not report the results of, an external security penetration test — restating `docs/evidence-pack/08-security-pen-test.md`'s GAP status (§19.4, NFR-026).
- **NO-NFR-3.** This chapter does not conduct a disaster-recovery drill and does not state an RTO/RPO figure — restating `docs/evidence-pack/12-disaster-recovery.md`'s GAP status (§19.3, NFR-011); no such figure is invented.
- **NO-NFR-4.** This chapter does not constitute, and does not claim progress toward obtaining, a DPIA, DCB0129/DCB0160 sign-off, MHRA device classification, DTAC assessment, or CIS2 production accreditation — restating Chapter 1's NO-6/NO-9 (§19.5).
- **NO-NFR-5.** This chapter does not introduce a new APM/observability platform, a ClickHouse or other analytics-warehouse deployment, or any other "Avoid now" component from the Tech Stack ADR (§19.2 NFR-006, §19.6 NFR-040).
- **NO-NFR-6.** This chapter sets a WCAG 2.1 AA conformance target (NFR-041); it does not itself constitute, or claim to have already produced, a passing conformance audit result (§19.7, NFR-043).
- **NO-NFR-7.** This chapter does not define a commercial-contract SLA (uptime percentage, support response time, financial penalty terms) — any such figure remains Sales/Legal/Commercial-owned pilot-contract scope, not a product-requirement decision made here.

### 19.12 Edge cases

- **EC-NFR-1 (perf smoke run on a cold serverless instance).** Given a `test:clinical-proof` run hits a genuinely cold Vercel serverless start, the `dashboard_load`/`agent_draft` soft targets may be missed without `PERF_SMOKE_STRICT=true` failing the build — this is an expected soft-fail per NFR-004, not evidence of a production regression, and shall not be triaged as one without re-running against a warm instance.
- **EC-NFR-2 (LLM provider outage during an `ENABLE_LLM_*=true` run).** Given an AI Gateway-routed model call fails or times out with LLM flags enabled, the affected agent shall fall back to its deterministic path (already the existing pattern per Chapter 7) rather than the request hanging past the LLM-off SLO's hard ceiling indefinitely — this chapter does not define a separate LLM-specific timeout budget beyond restating that a fallback must occur (§19.9, NFR-052 marks the LLM-on latency itself as unmeasured).
- **EC-NFR-3 (accessibility regression on an unaudited screen).** Given a new screen ships outside the 2 routes `e2e/accessibility.spec.ts` currently checks (NFR-042), an accessibility regression on that screen would not be caught by the existing automated gate — this is the concrete failure mode NFR-043's "unknown, not assumed passing" framing names, not a hypothetical.
- **EC-NFR-4 (a Cursor change greens `typecheck` by widening a type rather than fixing the underlying issue).** Given a Cursor-authored change makes `npm run typecheck` pass by loosening a previously-strict type (e.g. introducing an `any` or a non-null assertion) rather than resolving the underlying type mismatch, NFR-047 is violated in spirit even though the command exits 0 — this chapter treats "green by weakening the check" as a maintainability regression, not a pass, and expects review to catch it.
- **EC-NFR-5 (a security or DR gate scheduled but not yet run at the time a pilot decision is made).** Given a commercial pilot decision is imminent before NFR-011/NFR-026's process gates have produced a dated result, this chapter does not itself block that business decision — it requires (per NO-NFR-3/NO-NFR-2) that the decision-maker be shown the current GAP status honestly, not a fabricated "complete" status, so the risk is taken knowingly rather than by omission.

### 19.13 Open questions

- **OQ-NFR-1.** Who owns commissioning a full load/soak test at realistic multi-practice scale (§19.2, NFR-005), and what specific bottleneck or patient-volume figure should serve as the trigger, consistent with the Tech Stack ADR's ClickHouse trigger framing? **Owner:** Engineering + Product.
- **OQ-NFR-2.** When is the external security penetration test (§19.4, NFR-026) scheduled, and what is the pre-pilot blocking bar — must it pass before any paid pilot, or before any real-patient-data pilot specifically? **Owner:** Compliance + Engineering.
- **OQ-NFR-3.** What RTO/RPO targets should the still-unrun Neon/Vercel disaster-recovery drill (§19.3, NFR-011) validate against, and who sets them? **Owner:** Engineering + Product.
- **OQ-NFR-4.** Who commissions the full WCAG 2.1 AA conformance audit across all 59 Chapter 18 screens (§19.7, NFR-043), extending beyond the 2-route axe-core smoke check, and by what date relative to a pilot commitment? This directly extends Chapter 18's OQ-UI-6, which this chapter's NFR-041 answers only at the "what conformance level" layer, not the "when audited" layer. **Owner:** Product + Compliance + Design.
- **OQ-NFR-5.** What LLM-on latency budget should apply once a pilot enables `ENABLE_LLM_*` flags (§19.9, NFR-052), and who owns measuring that baseline before a pilot go-live? **Owner:** Engineering.
- **OQ-NFR-6.** Does resolving Chapter 17's OQ-DATA-4 (per-tier data-retention periods) also resolve this chapter's NFR-033, or does a retention *period* decision still leave a separate technical-enforcement NFR (e.g. an automated purge job) open? **Owner:** Compliance/DPO + Engineering.
- **OQ-NFR-7.** Should a formal uptime/availability SLA (§19.3, NFR-010) be defined as a product-engineering commitment ahead of any pilot, or only negotiated per-contract as part of a commercial pilot agreement (per NO-NFR-7)? **Owner:** Product + Commercial.

### 19.14 Cross-references

- `docs/ADR_TECH_STACK_MODERNIZATION.md` — the Keep/Add-later/Avoid-now framing (§0.4) every performance, reliability, and observability NFR in this chapter is scoped against; the ClickHouse and APM-platform "Avoid now" determinations restated as NFR-006/NFR-040.
- Chapter 4 (§4.5 the six-stage data-flow/fail-safe table, FR-ARC-006/012/017/031–033) — the fail-safe mechanics and tenant-isolation/observability requirements this chapter's Reliability and Security sections restate rather than re-derive.
- Chapter 5 (FR-HITL-008/012/017/024/028–032) — the HITL gate mechanics and honesty-field requirements underlying this chapter's Reliability, Security, and Privacy sections.
- Chapter 6 (§6.1 identity/FR-CORE-001–006, §6.2 consent/FR-CORE-008–013, §6.3 lineage/FR-CORE-014–017) — the identity, consent, and lineage mechanics this chapter's Security and Privacy sections restate.
- Chapter 7 (§7.1, FR-AGT-001/002, NO-AGT-5) — CONDUCTOR's deterministic control flow and the no-silent-model-version-change rule this chapter's AI/ML section restates as NFR-053/055.
- Chapter 10 (§10.2, NO-POP-2) — the ICS-fixture/synthetic-cohort scale distinction and the ClickHouse non-mandate this chapter's Performance section restates.
- Chapter 14 (§14.4–§14.7, FR-LEARN-010/021/024, hazards H-011/H-012) — the eval-harness honesty framing, the G-ML-1/2/3 gate sequence, and the JSON-fallback durability pattern this chapter's Maintainability, AI/ML, and Reliability sections restate.
- Chapter 16 (§16.1 the eight hardest constraints, BR-CR-3 currency pattern) — the hard-constraint quick-reference this chapter's Security/Privacy sections are bound by, and the documentation-currency rule NFR-051 restates.
- Chapter 17 (§17.1 the four-tier sensitivity/retention classification, OQ-DATA-4) — the open retention-period question this chapter's Privacy section restates as NFR-033/OQ-NFR-6.
- Chapter 18 (§18.13 FR-UI-055–060, OQ-UI-6) — the accessibility `shall` statements and the accessibility-conformance-target open question this chapter's Accessibility section directly resolves (NFR-041) and extends (OQ-NFR-4).
- `docs/evidence-pack/06-hazard-log.md`, `08-security-pen-test.md`, `09-performance-load.md`, `12-disaster-recovery.md` — the dated evidence artefacts (two of them honestly-labelled GAP) this chapter's [MEASURED]/[PROCESS GATE — NOT YET EVIDENCED] tags are drawn from.
- `docs/BUILT_VS_REMAINING_AUDIT.md` — the Track A/B split this chapter's Demo vs. Production section (§19.10) restates.
- `lib/clinical-proof/perf-slos.ts`, `e2e/accessibility.spec.ts`, `lib/compliance-labels.js` — the source files this chapter's [MEASURED] tags cite directly.

---

## 24. Chapter 20 — Acceptance & Validation `[DRAFTED]`

### 20.0 Purpose of this chapter

This chapter defines how a requirement in this Volume — a Functional Requirement, an Acceptance Criterion, a Business Rule, or a Non-Functional Requirement — is accepted as **done**: which validation levels exist, which of them a given requirement must pass, how that passing is recorded and kept traceable, what "Definition of Done" binds a Cursor-delivered (or any engineering-agent-delivered) change, and what decision criteria separate a Track A demo **GO** from a Track B live-NHS-EMR **NO-GO**. Per Chapter 1's SC-8 and this Volume's own §0.4 relationship table, this chapter's governing instruction is to **map onto** the evidence-pack gate structure (`docs/evidence-pack/`: Gate 1 platform readiness, Gate 2 clinical safety, Gate 3 pilot authority) and the existing `docs/BUILT_VS_REMAINING_AUDIT.md` Track A/B split as the binding readiness bar, not to define a second, competing bar.

This chapter does not itself validate anything — it is documentation, not a test run. It names the mechanisms (commands, suites, artefacts, roles) that already exist, states plainly where a mechanism is thin or absent, and binds future chapters' and future changes' behaviour against those mechanisms. Consistent with §0.5's standing status model, **DRAFTED is not Accepted**: this chapter defines the acceptance framework itself, but recording any specific chapter as formally Accepted still requires a sign-off mechanism this chapter does not create (§20.10 OQ-VAL-4, deferred to Chapter 21).

### 20.1 Validation levels

- **FR-VAL-001.** A requirement's validation shall proceed through as many of the following seven levels as are applicable to its nature, in ascending order of integration breadth: **Unit → Integration → E2E → Clinical-proof → Agent eval → Manual clinical safety review → Partner gate.** A requirement is not "validated" at a given level merely because a lower level passed.
- **FR-VAL-002. Unit.** An isolated function- or module-level test (e.g. an individual file under `tests/*.test.ts`, run directly via `npx tsx --test` or chained into a suite). Not every `FR-*` in this Volume has a corresponding unit test today — §20.4 names the concrete gaps rather than assuming coverage exists because a chapter is DRAFTED.
- **FR-VAL-003. Integration.** `npm run test:workflow` — compiles and runs `workflow-scenarios`, `api-contracts`, `integration-boundary`, `readonly-route-contracts`, `repository-parity`, `export-mapping`, `phase-d-api`, and `route-smoke`, then chains into the full Clinical-proof level (`npm run test:clinical-proof`) as its own final step.
- **FR-VAL-004. E2E.** `npm run test:e2e` (Playwright, full `e2e/` suite: accessibility, api-health, auth, gp-dashboard, patient-dashboard, onboarding-redirect, role-routing, marketing, and the six `clinical-proof-*.spec.ts` files) and its clinical-proof-scoped subset `npm run test:e2e:clinical-proof`.
- **FR-VAL-005. Clinical-proof.** `npm run test:clinical-proof` — the platform's chained proof harness, running 29 distinct suites end-to-end: the fourteen `.tmp-tests`-compiled suites Chapter 19 §19.8 names (cohort, FHIR shape, FHIR R4, graph, HITL, HITL chain, SHIELD, RBAC, golden-paths, learning, perf-SLOs, hazard-trace, Medplum, tenant-isolation), plus fifteen additional directly `tsx`-run suites (agent orchestration, NEXUS, three precision-health phases and a whole-loop pass, six clinical-spine phases, EMIS partner-sandbox, demo-launch D1, and onboarding-role-paths).
- **FR-VAL-006. Agent eval.** `npm run eval:agents` — the golden-case scorecard (`docs/AGENT_EVAL_HARNESS.md`) scoring **SYNTHESIS, GUARDIAN, and ORACLE only** against fixed synthetic fixtures, with a deterministic-flags-off mode recommended for CI. Restating Chapter 19 NFR-056: this is a rehearsal scorecard, not a clinical-validation certificate, at any level of this chapter's framework.
- **FR-VAL-007. Manual clinical safety review.** Clinical Safety Officer (CSO) and/or clinician review of the hazard log (`docs/HAZARD_LOG_TEMPLATE.md`), the residual-risk register (`docs/evidence-pack/15-residual-risk.md`), and clinician UAT notes (`docs/evidence-pack/13-uat-signoff.md`) — inherently a human judgment step, not automatable by a future test suite.
- **FR-VAL-008. Partner gate.** The three evidence-pack gate checklists (`gate-1-platform-readiness.md`, `gate-2-clinical-safety.md`, `gate-3-pilot-authority.md`), each a named-role sign-off table with an explicit GO/NO-GO/GO-WITH-WAIVERS result field — restated in full at §20.6.
- **FR-VAL-009.** A `HARD`-priority Business Rule (Chapter 16 §16.1) tagged phase `now` shall reach at least Clinical-proof level before being treated as validated; a rule tagged phase `v1` or `future` is validated only to the depth its own phase currently permits, and shall not be reported as fully validated ahead of that phase landing.
- **FR-VAL-010.** This chapter names existing tools and commands only (all defined in `package.json` today); it does not introduce a new test runner, CI platform, or testing framework.

### 20.2 Traceability

- **FR-VAL-011.** Every `FR-*`, `AC-*`, and `BR-*` in this Volume shall be mappable to at least one of: (a) a named automated test ID, (b) a named manual/evidence-pack artefact, or (c) an explicit status marker (`GAP`, `BLOCKED: partner`, `DEFERRED — <phase>`) — restating Chapter 19's NFR-050 as this chapter's own binding rule rather than an aspiration QA "should" pursue.
- **FR-VAL-012.** `docs/QA_TRACEABILITY_MATRIX.md` (and its JSON companion `docs/qa-traceability-matrix.json`) is the platform's only traceability artefact that exists today; it uses its own `REQ-<nnn>` numbering (at least 30 entries, `REQ-001`–`030`+) predating this Volume's `FR-<CHAPTER>-<nnn>` scheme (§0.6). As of this chapter's drafting, **no row in that matrix cites a Volume I `FR-*`/`AC-*` id**, and this chapter does not re-key it — that re-mapping is named as open work (§20.10 OQ-VAL-1), not performed here.
- **FR-VAL-013.** `docs/QA_TRACEABILITY_MATRIX.md`'s existing status vocabulary (`PASS`, `PARTIAL`, `BLOCKED: partner`, `GAP`, `MANUAL`) is adopted as this chapter's own binding vocabulary for §20.4, extended with one addition — `DEFERRED — <phase>` — for a requirement whose home chapter already states a future-phase status per Chapter 16's Phase column, so a deliberately-deferred requirement is not conflated with an unplanned gap.
- **FR-VAL-014.** A future chapter adding a new `FR-*` does not, by virtue of being drafted, acquire a traceability row — a row is added only once implementation of that FR begins, consistent with this Volume documenting requirements ahead of code (restating §0.1's "not padded to look more complete" principle at the traceability layer).
- **FR-VAL-015.** Once implementation of an FR begins, the implementing change shall add or update a traceability row citing the FR id, the test id or evidence artefact, and a status per FR-VAL-013's vocabulary, before that change is considered Done (§20.5, AC-VAL-1).
- **FR-VAL-016.** A traceability row's status shall never be set to `PASS` on the strength of a test that exercises only a mock or fallback path (e.g. the Neo4j `mock-fallback`) where the requirement's own language describes live behaviour — restating Chapter 10 §10.2's and Chapter 19 NFR-016's honest-mock-banner principle at the traceability layer (§20.9 EC-VAL-2).
- **FR-VAL-017.** Business Rules (`BR-001`–`085`) are traced via their origin `FR-*`/`NO-*` id (Chapter 16's own Origin column), not a second, parallel traceability row — a BR is validated exactly when its origin requirement is validated.
- **FR-VAL-018.** Non-Functional Requirements (`NFR-001`–`060`) are traced via Chapter 19's own three-way honesty tag rather than a separate Chapter 20 tag: `[MEASURED]` is treated as PASS-traced; `[ASPIRATIONAL — NEEDS BASELINE]` and `[PROCESS GATE — NOT YET EVIDENCED]` are treated as GAP-traced, for this chapter's purposes.
- **FR-VAL-019.** Where a requirement genuinely has no test, no named evidence artefact, and no phase-deferral stated by its home chapter, that absence is itself the traceability record — a plain `GAP`, restating this Volume's standing honesty principle (§0.1) at the traceability layer, never left silently unaddressed.

### 20.3 Acceptance suites by area

The table below records, per capability area, the home chapter carrying that area's own `Given/When/Then` acceptance criteria (not reprinted here), the validation level(s) that genuinely exercise it today, and an honest status using §20.2's vocabulary. This restates each home chapter's own findings; it does not re-derive or re-score them.

| Area | Home chapter (ACs live there) | Validated by | Status |
| --- | --- | --- | --- |
| HITL | Ch. 5 (`AC-HITL-*`) | `clinical-proof-hitl`/`-hitl-chain`/`-shield` tests, `e2e/clinical-proof-hitl.spec.ts`, hazard-trace test | PASS (RBAC cross-role check `PARTIAL` per `QA_TRACEABILITY_MATRIX.md` REQ-021) |
| Agents / CONDUCTOR | Ch. 7 | `clinical-proof-orchestration` test + spec, `eval:agents` | PARTIAL — golden-case eval covers 3 of 12 agents (SYNTHESIS/GUARDIAN/ORACLE); NEXUS has a dedicated unit test, the other 8 do not |
| Diabetes module phases | Ch. 8 / 9 | none dedicated | GAP — no test in `tests/` imports `lib/disease-modules/diabetes/*`; restates Ch. 8's "v1 wiring not started" at the coverage layer |
| Twin honesty | Ch. 9 | `precision-health-phase3` test | PASS — `physiologicalTwin:false`/`ehrWrite:false` and absence of "living digital twin approved" copy are genuinely asserted, for the existing generic (non-diabetes) twin only |
| Population | Ch. 10 | `clinical-proof-graph`, `precision-health-phase*`, `clinical-proof-tenant-isolation` tests | PARTIAL — restates Ch. 10's Segment/Predict/Monitor/Learn-not-computed finding at the test layer |
| Patient | Ch. 11 | `precision-health-phase1`/`phase2` tests, `e2e/patient-dashboard.spec.ts` | PARTIAL — validated only to the depth each capability exists; Gamification/Goals/Family have no code and therefore nothing to test |
| Research | Ch. 13 | `readonly-route-contracts`, `api-contracts`, `route-smoke` tests | PARTIAL — route/auth-shape level only; no test scores the evaluation harness's four typed tasks' output quality |
| Learning | Ch. 14 | `clinical-proof-learning` test | PASS for the six built stages; no test can exist yet for the three "Improve" stages, restating Ch. 14's "no demonstrated release history" finding |
| Journeys | Ch. 15 | `clinical-proof-golden-paths` test, `e2e/clinical-proof-patel`/`-multi-patient` specs, `demo-launch-d1`, `onboarding-role-paths` tests | PASS for Journeys 1–2 (`[LIVE]`); no dedicated journey-level test beyond each journey's own constituent-chapter coverage for Journeys 3–6, 8 |
| UI | Ch. 18 | `e2e/gp-dashboard`/`patient-dashboard`/`onboarding-redirect`/`role-routing`/`accessibility` specs, `route-smoke` test | PARTIAL — restates Ch. 18's Exists(47)/Partial(9)/Missing(3) rating; behavioural coverage is far narrower than the 59-screen catalogue, and `accessibility.spec.ts` covers 2 of 59 |
| NFRs | Ch. 19 | `clinical-proof-perf-slos` test, `accessibility.spec.ts`, `clinical-proof-tenant-isolation` test | PARTIAL per Ch. 19's own three-way tag — `[MEASURED]` items pass; `[PROCESS GATE]`/`[ASPIRATIONAL]` items have no test by definition |

- **FR-VAL-020.** The table above shall be kept current at each future chapter revision that changes a cited suite's name, scope, or result; a stale row is a documentation-currency defect (restating Chapter 19 NFR-051 and Chapter 16 BR-CR-3) to correct at the next revision, not to leave silently wrong.
- **FR-VAL-021.** The Diabetes-module zero-unit-test finding (table row 3) shall not be treated as a regression to fix incidentally — it is named here as the concrete test-coverage consequence of Chapter 8's own "v1 wiring not started" status, and any future work closing it is scoped as its own Cursor-delivered change against a named `FR-DIAB-*`/`FR-TWIN-*` id, not folded silently into an unrelated change.
- **FR-VAL-022.** The agent-eval 3-of-12 coverage finding (table row 2) shall not be represented as "the agent platform is evaluated" without the qualifier — restating `docs/AGENT_EVAL_HARNESS.md`'s own stated scope (SYNTHESIS, GUARDIAN, ORACLE) rather than the full `AGENT_DIRECTORY`.
- **FR-VAL-023.** The UI row's route-smoke/accessibility distinction shall be preserved in any future summary: `route-smoke.test.js`'s broad HTTP-200 sweep proves a route *responds*, not that it behaves correctly or accessibly — restating Chapter 18's and Chapter 19's own screen-versus-behaviour distinction at the test-coverage layer.
- **FR-VAL-024.** The Twin-honesty PASS finding (table row 4) is this chapter's one area where an automated test genuinely proves an honesty-field claim end to end; it shall be cited as evidence for Chapter 9's honesty fields specifically, and not generalized into a claim that Diabetes-specific twin scenarios (Chapter 9 §9.5) are validated, since none of those scenarios exist in code (restating Chapter 9 NO-TWIN-1).

### 20.4 Acceptance criteria (`Given/When/Then`)

- **AC-VAL-1.** Given a future Volume I chapter adds a new `FR-*` and implementation of it begins, when the implementing change is opened for review, then it shall cite the FR/AC id(s) it satisfies and add or update a traceability row per §20.2 — restating FR-VAL-015.
- **AC-VAL-2.** Given a Cursor-authored change touches any clinical-facing path, when the change is proposed as complete, then `npm run test:clinical-proof` shall be green before the change is considered Done — restating Chapter 19 NFR-046 as this chapter's own Definition-of-Done gate (§20.5).
- **AC-VAL-3.** Given a sponsor is deciding whether to declare a Track A demo GO, when Gate 1's ten criteria (`gate-1-platform-readiness.md`) are reviewed, then a GO decision requires all ten checked with dated evidence, or explicit named waivers recorded — never a silent partial pass.
- **AC-VAL-4.** Given a sponsor is considering any Track B (live NHS EMR) claim, when Gates 1–3 and the signed N7 `liveEmis`-flip authorization are reviewed, then the decision shall be NO-GO unless all three gates and the signed N7 exist — restating `docs/BUILT_VS_REMAINING_AUDIT.md`'s Track B "NO-GO by design" framing as this chapter's own binding acceptance rule (§20.6).
- **AC-VAL-5.** Given an evidence-pack artefact is a dated placeholder marked `GAP` (e.g. `08-security-pen-test.md`, `12-disaster-recovery.md`), when any Volume I chapter or Cursor-delivered change cites pilot- or production-readiness, then that citation shall not represent the `GAP` artefact as PASS or complete — restating FR-VAL-042.
- **AC-VAL-6.** Given the golden-case agent-eval harness is run with any `ENABLE_LLM_*` flag enabled, when its result is used as supporting evidence, then it shall not be presented as a clinical-validation certificate (restating NFR-056), and the deterministic-flags-off run remains the CI-authoritative result (§20.9 EC-VAL-3).

### 20.5 Definition of Done for Cursor-delivered changes

This section extends Chapter 19 §19.8's maintainability NFRs (`NFR-046`–`051`) into an explicit checklist rather than leaving them as separate, unordered statements.

- **FR-VAL-025.** A Cursor-delivered (or any engineering-agent-delivered) change scoped against a Volume I requirement is **Done** only once all of FR-VAL-026–032 are satisfied.
- **FR-VAL-026.** The change description cites the specific `FR-*`/`AC-*`/`BR-*` id(s) it implements — restating §0.3's own Cursor-usage instruction.
- **FR-VAL-027.** The applicable validation level(s) per §20.1 are green: at minimum `npm run typecheck`, and — for any clinical-facing path — the full `npm run test:clinical-proof` chain (restating NFR-046/047).
- **FR-VAL-028.** A change altering a workflow-level contract additionally keeps `npm run test:workflow` green (restating NFR-048).
- **FR-VAL-029.** A new or changed screen keeps the relevant Playwright specs green, and does not delete or skip an existing spec without a recorded, reviewed reason (restating NFR-049).
- **FR-VAL-030.** A traceability row is added or updated per §20.2 (FR-VAL-015).
- **FR-VAL-031.** Done is not the same as Accepted (§0.5): a Done, merged, green-suite change still leaves its home chapter at DRAFTED until Product/Architecture/Clinical Safety sign-off — a mechanism this chapter does not create (§20.10 OQ-VAL-4, deferred to Chapter 21).
- **FR-VAL-032.** A change shall not be marked Done by weakening an existing check to make it pass — restating the "green by weakening" anti-pattern (Chapter 19 EC-NFR-4/NFR-047) as a maintainability regression under this chapter's Definition of Done, not a pass, and expects review to catch it.

### 20.6 Demo GO vs. Live NHS EMR NO-GO criteria

- **FR-VAL-033.** This Volume's acceptance framework adopts, rather than redefines, the existing Track A/Track B split and its current verdicts recorded in `docs/BUILT_VS_REMAINING_AUDIT.md`: **Track A** (demo/pilot marketing, synthetic cohort, `liveEmis:false`) is **GO WITH LIGHT POLISH**; **Track B** (live NHS EMR/EMIS write-back, CIS2, funded regulatory path) is **NO-GO by design** until partner credentials, sandbox UAT, CSO/Gates 1–3, and a signed N7 `liveEmis`-flip authorization all exist.
- **FR-VAL-034.** A Track A "demo GO" decision requires, at minimum: Gate 1 (10 criteria) checked with dated evidence or recorded waivers, the `/demo/*` script rehearsed, and CI (`test:clinical-proof`, `typecheck`) green — restating `docs/BUILT_VS_REMAINING_AUDIT.md`'s own "Spine + U1–U8 + D1 DONE → rehearse → keep CI green → honest talk-track" sequence as this chapter's binding acceptance criteria for that decision.
- **FR-VAL-035.** A Track B "live NHS EMR GO" decision additionally requires all of: partner (EMIS/CIS2/Mirth) credentials and sandbox UAT, Gate 2 and Gate 3 checklists both fully signed, a signed N7 authorization to flip `liveEmis`, and the process gates NFR-011/NFR-026 (disaster-recovery drill, penetration test) evidenced — a decision-maker missing any one of these receives a NO-GO, never a partial or contingent GO.
- **FR-VAL-036.** Neither this chapter nor any Cursor-delivered change may silently narrow this split — restating Chapter 1's NO-6/NO-9 and Chapter 2's non-scope items — for example by treating a passed Gate 1 alone as sufficient for a Track B claim.
- **FR-VAL-037.** Where a demo-mode-specific behaviour (deterministic fixtures, seeded demo credentials, the `/demo/*` scripted walkthrough) is the only evidence behind a claim, that claim shall be labelled demo-scoped and shall not be generalized into a Track B or production claim — restating NFR-060 as this chapter's own GO/NO-GO framing rule.
- **FR-VAL-038.** The Gate 1/2/3 checklists' own "Result: ☐ GO · ☐ NO-GO · ☐ GO WITH WAIVERS" mechanism (`gate-3-pilot-authority.md`) is this Volume's adopted GO/NO-GO recording format; this chapter does not propose a competing decision template.
- **FR-VAL-039.** A GO WITH WAIVERS result shall list each waiver and its accountable owner explicitly (the existing gate-checklist "Waivers / conditions" field) rather than recording a bare GO that silently absorbs open items.

### 20.7 Evidence pack expectations

- **FR-VAL-040.** This Volume adopts the existing 16-artefact evidence pack (`docs/evidence-pack/README.md`, artefacts #1–16) as the binding evidence structure for any pilot- or production-readiness claim; this chapter does not define a 17th artefact or a competing structure — restating Chapter 1 SC-8's "map onto these gates rather than defining a competing readiness bar" instruction at the evidence-pack layer specifically.
- **FR-VAL-041.** A claim citing evidence-pack coverage shall cite the specific artefact number(s) (e.g. "per evidence-pack #5, AI-agent evaluation") rather than an unqualified "the evidence pack shows...".
- **FR-VAL-042.** An artefact whose current content is a dated `GAP` placeholder (artefacts #8 security pen-test, #12 disaster recovery, per Chapter 19 NFR-011/026) shall continue to be cited as `GAP` — never as PASS, and never silently omitted from a readiness summary — restating the evidence-pack README's own honesty rule ("do not invent PASS for blocked partners").
- **FR-VAL-043.** The machine-generated snapshot artefacts under `docs/evidence-pack/generated/` (produced by `npm run evidence:pack`) are automated evidence for artefacts with an automatable component (#1, #4, #5, #10, #11) and do not themselves satisfy artefacts that are inherently manual (#13 UAT sign-off, #14 pilot monitoring plan, #6 hazard-log CSO sign-off, and the Gate 1–3 sign-off rows) — an automated snapshot existing is not equivalent to the human sign-off being recorded.
- **FR-VAL-044.** Where a partner-dependent artefact (EMIS/CIS2/Mirth-linked rows, e.g. `QA_TRACEABILITY_MATRIX.md`'s REQ-017/019/024/025) is blocked, it shall carry `BLOCKED: partner`, not `GAP` — preserving the distinction between "not yet possible without a partner" and "possible but not yet done."
- **FR-VAL-045.** `docs/evidence-pack/README.md`'s regeneration command (`npm run evidence:pack`) and this chapter's citations of it are subject to the same documentation-currency rule as Chapter 19 NFR-051 and Chapter 16 BR-CR-3 — a future rename of the command or an artefact path is a currency defect to correct, not a silently stale reference.

### 20.8 Non-goals

- **NO-VAL-1.** This chapter does not itself run `test:clinical-proof`, `eval:agents`, or any other suite, and does not create or modify any file under `lib/`, `app/`, `components/`, or `tests/` — it is documentation only.
- **NO-VAL-2.** This chapter does not claim, and does not create a path toward claiming, any regulatory certification (UKCA/MHRA, DCB0129/DCB0160, DTAC, CIS2) via its own content — restating Chapter 1's NO-6/NO-9 and Chapter 19's NO-NFR-4 at the acceptance-framework layer.
- **NO-VAL-3.** This chapter does not invent new automated coverage where none exists (the Diabetes signal-builder unit tests, the full 59-screen accessibility audit) — it names each gap honestly (§20.3) rather than fabricating a fix.
- **NO-VAL-4.** This chapter does not re-key or re-number the existing `QA_TRACEABILITY_MATRIX.md`'s `REQ-<nnn>` ids into this Volume's `FR-*` scheme — that remains distinct, not-yet-scheduled work (§20.10 OQ-VAL-1).
- **NO-VAL-5.** This chapter does not perform, and does not claim to have performed, the external penetration test or the disaster-recovery drill — restating Chapter 19's NO-NFR-2/NO-NFR-3.
- **NO-VAL-6.** This chapter does not define commercial-contract SLAs (uptime percentage, support response time, financial penalty terms) — restating Chapter 19's NO-NFR-7.
- **NO-VAL-7.** This chapter does not assert that any hazard-log entry becomes Signed by virtue of being cited here — hazards H-011 and H-012 remain **Unsigned** per Chapter 14, restated, not resolved, by this chapter.

### 20.9 Edge cases

- **EC-VAL-1 (a freshly drafted chapter has zero automated tests targeting its FRs).** Given a Volume I chapter reaches DRAFTED status before any implementing code exists, when its requirements are checked against §20.2's traceability rule, then the absence of a traceability row is the expected state (restating FR-VAL-014), not a defect — it is distinguished from an implemented-but-untested regression, which §20.2/§20.5 do treat as a defect.
- **EC-VAL-2 (a green test exercises a mock/fallback path, not the live path).** Given a test passes only because it exercises a mock or fallback code path (e.g. Neo4j `mock-fallback`) rather than the live integration the requirement describes, when its result is recorded, then it shall not be reported as validating live behaviour — restating FR-VAL-016.
- **EC-VAL-3 (`eval:agents` run with LLM flags on vs. off disagree).** Given `npm run eval:agents` produces different pass/fail results with `ENABLE_LLM_*` flags on versus off, when the result is used as CI or gate evidence, then the deterministic-flags-off run is authoritative — restating `docs/AGENT_EVAL_HARNESS.md`'s own recommendation; an LLM-on-only failure does not, by itself, block a Gate 1 decision.
- **EC-VAL-4 (a gate checklist item is checked without dated evidence).** Given a Gate 1/2/3 checklist item's checkbox is marked complete without a corresponding dated evidence link, when that gate's result is reviewed, then it shall not be treated as passed — restating the evidence-pack README's own honesty rule at the individual-criterion level, not only the artefact level.
- **EC-VAL-5 (implementing code ships before its Volume I traceability row is added).** Given a future chapter's FR (e.g. a hypothetical `glucose` modality resolving Chapter 17's OQ-DATA-1) is implemented in code before this chapter's traceability obligation (FR-VAL-015) is fulfilled, when the gap is noticed, then the row shall still be added retroactively — the obligation attaches to the change, not to chapter-drafting order, so a late row is a currency fix, not a waived requirement.

### 20.10 Open questions

- **OQ-VAL-1.** Who owns re-keying/cross-mapping `QA_TRACEABILITY_MATRIX.md`'s `REQ-<nnn>` ids to this Volume's `FR-*`/`AC-*` ids, and on what timeline? **Owner:** QA + Product.
- **OQ-VAL-2.** Should the golden-case agent-eval harness be extended beyond SYNTHESIS/GUARDIAN/ORACLE to the other 9 agents in the `AGENT_DIRECTORY` (Chapter 7), and who prioritizes that work? **Owner:** Engineering + Clinical Safety.
- **OQ-VAL-3.** Who owns writing the first dedicated unit tests for the 9 Diabetes signal-builder files (§20.3 row 3), and is that gated on Chapter 8's v1 wiring landing first, or can test scaffolding precede it? **Owner:** Engineering.
- **OQ-VAL-4.** What is the actual sign-off mechanism (tooling, workflow, recorded artefact) for moving a chapter from DRAFTED to Accepted per §0.5 — restating §0.5's own "mechanism TBD" note? **Owner:** Product + Clinical Safety + Architecture. Deferred to Chapter 21 (Open Questions / Decisions Log).
- **OQ-VAL-5.** Should `route-smoke.test.js`'s broad HTTP-200 sweep be formally counted as its own, lighter validation level distinct from Integration and E2E (§20.1), rather than folded into Integration as this chapter provisionally does? **Owner:** Engineering + QA.
- **OQ-VAL-6.** At what cadence (per-release, quarterly) should automated accessibility coverage (Chapter 19 NFR-042/043, currently 2 of 59 screens) be expanded, and does driving that cadence sit with this chapter's Definition of Done (§20.5) or remain solely Chapter 19's concern? **Owner:** Product + Design + Engineering.
- **OQ-VAL-7.** Does a Track A "demo GO" decision require re-confirmation (re-running Gate 1 plus smoke) on every deploy, or only when a clinical-facing path changes — restating a gap the existing Gate 1–3 checklists do not currently state a re-validation cadence for? **Owner:** Engineering + Release.

### 20.11 Cross-references

- Chapter 5 (HITL gate catalogue, `FR-HITL-008/012/017/024/028–032`) — the gate mechanics this chapter's HITL acceptance-suite row (§20.3) and Traceability section restate rather than re-derive.
- Chapter 14 (§14.4–§14.7, the G-ML-1/2/3 gate sequence, hazards H-011/H-012) — the governed-release process this chapter's Learning acceptance-suite row and NO-VAL-7 restate.
- Chapter 15 (§15.1 per-journey `[LIVE]`/`[PARTIAL]`/`[FUTURE]` labels) — the honesty labels this chapter's Journeys acceptance-suite row (§20.3) is measured against.
- Chapter 16 (§16.1 the eight hardest constraints, §16.3 conflict-resolution rule, BR-CR-3 currency pattern) — the Business Rule catalogue this chapter's Traceability section (FR-VAL-017) and currency rules (FR-VAL-020/045) restate.
- Chapter 19 (§19.1 the three-way `[MEASURED]`/`[ASPIRATIONAL]`/`[PROCESS GATE]` tag, §19.8 maintainability NFRs `046`–`051`) — the measurement-status convention this chapter's NFR traceability rule (FR-VAL-018) reuses directly, and the maintainability NFRs this chapter's Definition of Done (§20.5) turns into an explicit checklist.
- `docs/CONTINUOUS_LEARNING.md`, `docs/GOVERNED_MODEL_RELEASE_SOP.md` — the governed continuous-learning loop and release-gate sequence this chapter's Learning row and Chapter 14 cross-reference restate without altering.
- `docs/AGENT_EVAL_HARNESS.md` — the golden-case scorecard's stated scope (SYNTHESIS/GUARDIAN/ORACLE only) and deterministic-flags-off CI recommendation this chapter's §20.1 (FR-VAL-006), §20.3 (FR-VAL-022), and §20.9 (EC-VAL-3) cite directly.
- `docs/QA_TRACEABILITY_MATRIX.md` + `docs/qa-traceability-matrix.json` — the only traceability artefact that exists today, its `REQ-<nnn>` scheme, and its still-open re-mapping to this Volume's `FR-*` ids (FR-VAL-012, OQ-VAL-1).
- `docs/evidence-pack/README.md`, `gate-1-platform-readiness.md`, `gate-2-clinical-safety.md`, `gate-3-pilot-authority.md`, and artefacts `08-security-pen-test.md`/`12-disaster-recovery.md` — the 16-artefact evidence structure and GO/NO-GO/GO-WITH-WAIVERS recording format this chapter's §20.6–20.7 adopt rather than replace.
- `docs/BUILT_VS_REMAINING_AUDIT.md` — the Track A (GO WITH LIGHT POLISH) / Track B (NO-GO by design) split this chapter's §20.6 restates as its own binding acceptance rule.
- `docs/HAZARD_LOG_TEMPLATE.md` — the hazard-log mechanism this chapter's NO-VAL-7 restates as Unsigned for H-011/H-012.

---

## 25. Chapter 21 — Open Questions & Decisions Log `[DRAFTED]`

### 21.0 Purpose of this chapter

Chapters 3–20 have, between them, raised 118 explicit open questions (`OQ-<CODE>-<n>`, per §0.6's numbering scheme) and stated dozens of decisions already made and binding on this Volume — some inherited from prior ADRs and specs, some made inline by a chapter itself (a rename, a phasing choice, a which-layer-owns-this call). Both sets are currently scattered across 18 different chapters, in prose, with no single place a reader can check *before* proposing a new feature, a new gate, or a new data field: "has this already been decided, is it still open, and if open, who is blocking it?"

This chapter is that single place. It is, like Chapter 16 (Business Rules Catalog) and Chapter 20 (Acceptance & Validation) before it, a **consolidation chapter, not a new-content chapter**: it does not answer, re-litigate, or pre-empt a single one of the 118 open questions it restates, and it does not invent a decision that was not already stated somewhere in this Volume or a named ADR/spec. Its two products are:

1. **A master Open Questions backlog** (§21.2–§21.8) — every `OQ-*` id already minted by an earlier chapter, restated with its existing Owner, plus an added Blocks/Priority/Status classification, organized by this Volume's own Part A–F structure so a reader can scan one theme at a time rather than eighteen separate chapters' §*.1x sections.
2. **A Closed Decisions Log** (§21.9) — a short, numbered (`DEC-<nnn>`) register of the decisions this Volume and its governing ADRs have *already* made and that no future chapter may silently relax, each a pointer to its existing origin, not a new ruling.

Per this Volume's Precedence rule (§0.4) and Chapter 16's own conflict-resolution rule (§16.3), a decision recorded here as `DEC-<nnn>` is binding exactly to the degree its origin `NO-*`/`BR-*`/`FR-*`/`NFR-*` is binding — this chapter adds an index, not new authority.

### 21.1 How to use this chapter

- **FR-OQ-001.** Every entry in this chapter's Open Questions backlog (§21.2–§21.8) shall carry a chapter-scoped id already minted in its home chapter (`OQ-<CODE>-<n>`, §0.6) — this chapter does not mint new base ids for a question already open elsewhere; it consolidates and classifies them.
- **FR-OQ-002.** Every backlog entry shall carry an explicit **Owner** (a role or role-combination, restated from its home chapter — never a named individual) and a **Status** drawn from exactly four values: `Open` (no accepted answer yet, no known blocking dependency), `Blocked` (cannot be resolved until a named other `OQ-*`/`DEC-*` is settled first), `Proposed` (an answer or mechanism has been proposed in a chapter but not yet ratified by every required sign-off role per §21.10), or `Closed` (ratified; recorded as a `DEC-<nnn>` in §21.9 — the original `OQ-*` id is retained and marked Closed in place, per §0.6's "never renumbered or reused" rule, never deleted).
- **FR-OQ-003.** A question restated verbatim across two or more chapters (e.g. the minimum-cell suppression threshold, appearing as `OQ-ARC-2`/`OQ-POP-1`/`OQ-BR-3`/`OQ-DATA-3`) is tracked under multiple ids for home-chapter traceability but represents exactly **one** underlying decision (§21.8) — closing any one of the linked ids via §21.10 closes all of them simultaneously, recorded once as a single `DEC-<nnn>`.
- **FR-OQ-004.** A new open question identified by a future chapter revision shall be given the next sequential number under its home chapter's existing `OQ-<CODE>` prefix, then added to this chapter's master catalogue at that chapter's next revision. This chapter's catalogue is a restatement layer one revision behind a fast-moving home chapter by design, not a real-time mirror — a stale catalogue entry is a documentation-currency defect to fix at the next revision (restating Chapter 16 BR-CR-3/Chapter 19 NFR-051's currency pattern), not evidence this chapter is unreliable.
- **FR-OQ-005.** A Closed Decisions Log entry (`DEC-<nnn>`, §21.9) shall cite the specific `NO-*`/`BR-*`/`FR-*`/`NFR-*` id and home chapter/ADR it restates, per this Volume's standing citation discipline (§0.1) — a `DEC-<nnn>` is a pointer to a decision already stated in a DRAFTED chapter or a named ADR/spec, never a new decision authored by this chapter.
- **FR-OQ-006.** This chapter's own proposed chapter-acceptance sign-off mechanism (§21.10, addressing `OQ-VAL-4`) is itself only `Proposed`, not `Closed` — a chapter shall not be marked **Accepted** in the Table of Contents on the strength of this chapter's proposal alone; that requires the ratification §21.10 itself names.

### 21.2 Master Open Questions — Part A: Foundations (Chapters 3–5, 16 questions)

| ID | Ch. | Question (restated, short) | Owner | Blocks | Priority | Status |
| --- | --- | --- | --- | --- | --- | --- |
| OQ-PER-1 | 3 | Confirm target `AppRole` for `patient`/`researcher` — silently defaults to `clinical_reviewer` today | Engineering + Clinical Safety | Permission-matrix correctness for 2 personas | HIGH | Open |
| OQ-PER-2 | 3 | Confirm whether `patient`/`researcher` need their own `AppRole` bucket(s) vs. the binary split | Architecture + Product | Permission-matrix design | HIGH | Open |
| OQ-PER-3 | 3 | Confirm what "ethics reference confirmed" means operationally for researcher data-access elevation | Clinical Safety + Compliance | Any pilot exposing individual-level research data | HIGH | Open |
| OQ-PER-4 | 3 | Confirm the path/trigger for moving `productionRbacEnforced` `false` → `true` | Architecture + Engineering | Any Track B (live EHR) milestone | HIGH | Open |
| OQ-PER-5 | 3 | Confirm whether "Clinical Safety Lead"/"Compliance" should become a first-class `UserRole` | Product + Clinical Safety | In-app hazard-log/evidence-pack sign-off UX | LOW | Open |
| OQ-ARC-1 | 4 | Confirm timeline/owner for the Diabetes v0→v1 wiring step (`ENABLE_DIABETES_MODULE`) | Product + Engineering | Chapter 8's "current state" framing (v0 vs v1) | MEDIUM | Open |
| OQ-ARC-2 | 4 | Confirm the k-anonymity / minimum-cell suppression threshold for population aggregates | Clinical Safety Lead + Compliance + Architecture | FR-ARC-033, BR-025, all population-privacy requirements | HIGH | Open |
| OQ-ARC-3 | 4 | Confirm whether Diabetes-suffixed coaching-agent ids extend the generic `CoachingAgentId` union | Product + Engineering | FR-ARC-025 | MEDIUM | Open |
| OQ-ARC-4 | 4 | Confirm whether a second disease module gets its own chapter, or a new Volume | Product | Second module's requirements drafting | LOW | Open |
| OQ-ARC-5 | 4 | Confirm CONDUCTOR's behavior when a disease module's composite function throws or returns incomplete data | Clinical Safety Lead + Engineering | CONDUCTOR's error-handling contract | HIGH | Open |
| OQ-HITL-1 | 5 | Confirm whether Insulin/GLP-1 dose-adjacent discussions need a new `HumanGateId`, or reuse `medication_decision` | Clinical Safety Lead | Chapter 8's gate-catalog decision | HIGH | Open |
| OQ-HITL-2 | 5 | Confirm remediation for the SHIELD best-effort audit-write gap (hard-fail vs. durable outbox/retry) | Clinical Safety Lead + Engineering | Any pilot milestone depending on audit completeness (SC-3) | HIGH | Open |
| OQ-HITL-3 | 5 | Confirm the required SHIELD audit retention period (none specified today) | Clinical Safety Lead + Compliance | Real/pilot-consented data scope | HIGH | Open |
| OQ-HITL-4 | 5 | Confirm whether optimistic-concurrency conflict detection on queue-item disposition is required pre-pilot | Clinical Safety Lead + Product | FR-HITL-034 | MEDIUM | Open |
| OQ-HITL-5 | 5 | Confirm who may mark a case-level gate `not_applicable` vs. requiring named-clinician `confirmed` status | Clinical Safety Lead | `referral_pathway` ambiguous-case handling | MEDIUM | Open |
| OQ-HITL-6 | 5 | Confirm behavior when `request_more_data` persists across sessions (max "stuck" duration / proactive alert) | Clinical Safety Lead + Product | Patient companion escalation design | MEDIUM | Open |

### 21.3 Master Open Questions — Part B: Platform Capabilities (Chapters 6–7, 10 questions)

| ID | Ch. | Question (restated, short) | Owner | Blocks | Priority | Status |
| --- | --- | --- | --- | --- | --- | --- |
| OQ-CORE-1 | 6 | Confirm plan/timeline to extend the permission matrix from 2 `AppRole`s to the full 8 `UserRole`s | Engineering + Product | Genuine production-RBAC claim (restates OQ-PER-4) | HIGH | Open |
| OQ-CORE-2 | 6 | Confirm whether "in-flight run completes, new runs re-checked" is correct for consent revocation mid-flow | Clinical Safety Lead + Product | Future pilot consent-revocation behavior | MEDIUM | Open |
| OQ-CORE-3 | 6 | Confirm the named trigger/phase for a live coded-terminology service | Product + Clinical Safety Lead | FR-CORE-030 | MEDIUM | Open |
| OQ-CORE-4 | 6 | Confirm the retention policy for revoked consent grants / superseded modality samples | Compliance + Engineering | FR-CORE-009 (relates OQ-HITL-3) | HIGH | Open |
| OQ-CORE-5 | 6 | Confirm whether additive multi-grant consent behavior matches expectations, or a single-active-grant constraint is needed | Compliance + Product | Consent-model design | MEDIUM | Open |
| OQ-AGT-1 | 7 | Confirm whether GUARDIAN-amber + HORIZON-VeryHigh should stay "High" or promote to "Urgent" | Clinical Lead (per chapter text) | EC-AGT-1 severity mapping | HIGH | Open |
| OQ-AGT-2 | 7 | Confirm behavior when Dr.Assist/NEXUS are excluded from a run but a downstream capability expects their codes | Product + Clinical Safety Lead | PATHWAY referral-input validity | MEDIUM | Open |
| OQ-AGT-3 | 7 | Confirm target phase/trigger for PRISM and ATLAS (both Phase 2, not built) | Product | Phase-2 roadmap commitment | LOW | Open |
| OQ-AGT-4 | 7 | Confirm whether VOICE CARE should be renamed to avoid confusion with VOICE (dictation) | Product | Naming clarity ahead of Chapter 15's repeated references | LOW | Open |
| OQ-AGT-5 | 7 | Confirm who owns sign-off for changes to `resolveReviewOrder`/`resolveQueuePriority` | Clinical Safety Lead + Engineering | Orchestration-logic change-review process (NO-AGT-4) | MEDIUM | Open |

### 21.4 Master Open Questions — Part C: Disease Intelligence (Chapters 8–9, 14 questions)

| ID | Ch. | Question (restated, short) | Owner | Blocks | Priority | Status |
| --- | --- | --- | --- | --- | --- | --- |
| OQ-DIAB-1 | 8 | Confirm whether CGM/glucose fields extend `wearableSampleSchema` or become a new `glucose` modality | Clinical Lead + Engineering | FR-DIAB-051 v1 data model (= OQ-DATA-1) | HIGH | Open (provisional engineering stop-gap only: `docs/PHASED_BUILD_PLAN_D.md` D2 `PED-DIAB-1` — not a resolution) |
| OQ-DIAB-2 | 8 | Confirm whether Insulin/GLP-1 decisions need a new gate type vs. reusing `medication_decision` (= OQ-HITL-1) | Clinical Safety Lead | NO-DIAB-7, any `HumanGateId` change | HIGH | Open |
| OQ-DIAB-3 | 8 | Confirm acceptable UI language for the HbA1c trend-based estimate so it cannot read as diagnostic | Clinical Lead + Product Writing | FR-DIAB-057 copy | MEDIUM | Open |
| OQ-DIAB-4 | 8 | Confirm which Complication flags should auto-draft a PATHWAY referral (still HITL-gated) vs. clinician-initiated only | Clinical Safety Lead | FR-DIAB-043 `referral_indicated` threshold | HIGH | Open |
| OQ-DIAB-5 | 8 | Confirm whether diabetes-specific coaching-agent ids extend `CoachingAgentId` (restates OQ-ARC-3) | Product + Engineering | FR-DIAB-036/39/41 | MEDIUM | Open |
| OQ-DIAB-6 | 8 | Confirm the specific self-report signal(s) that trigger Behaviour Scientist's non-acute escalation path | Clinical Safety Lead + Mental Health Clinical Advisor | FR-DIAB-042 mental-health safety-netting | HIGH | Open |
| OQ-DIAB-7 | 8 | Confirm the coordinator's behavior on a per-area derivation failure — fail the whole composite vs. degrade gracefully and flag the omission (mirrors OQ-ARC-5) | Clinical Safety Lead + Engineering | §8.4 FR-DIAB-017 | HIGH | **Decided (B3, 6 Aug 2026): fail-open, per-area — see `areaFailures`** |
| OQ-TWIN-1 | 9 | Should the Diabetes scenario catalogue be a new file reusing `twin-simulation.ts` types, or should that file be parameterized instead | Engineering + Product | FR-TWIN-008 | MEDIUM | Open |
| OQ-TWIN-2 | 9 | Should any Diabetes Twin scenario be patient-initiated self-service, or clinician-only until a safety review clears it | Clinical Safety Lead + Product | FR-TWIN-020/022/023/025/037 | HIGH | Open |
| OQ-TWIN-3 | 9 | Does the G-ML-1/2/3 gate sequence need a simulation-specific addendum before Target Twin work begins | Clinical Safety Lead + ML Governance | FR-TWIN-015 | MEDIUM | Open |
| OQ-TWIN-4 | 9 | Who is the named clinical modeling owner for validating Target Twin state-variable relationships | Clinical Leadership | FR-TWIN-018 | MEDIUM | Open |
| OQ-TWIN-5 | 9 | Should the "start GLP-1" scenario draw on GLP-1 Intelligence's own signal, or compute an independent estimate | Clinical Lead + Engineering | Avoiding a conflated-agreement illusion between twin and module | MEDIUM | Open |
| OQ-TWIN-6 | 9 | What trigger should cause commissioning of the (physiological) Target Twin phase | Product Leadership | Target Twin roadmap | LOW | Open |
| OQ-TWIN-7 | 9 | Should the Diabetes simulator live under `disease-modules` or under `precision-health` | Engineering | Module-ownership boundary (sibling to OQ-TWIN-1) | LOW | Open |

### 21.5 Master Open Questions — Part D: Intelligence Layers (Chapters 10–14, 35 questions)

| ID | Ch. | Question (restated, short) | Owner | Blocks | Priority | Status |
| --- | --- | --- | --- | --- | --- | --- |
| OQ-POP-1 | 10 | Confirm the exact k-anonymity/minimum-cell threshold (restates OQ-ARC-2 verbatim) | Clinical Safety Lead + Compliance + Architecture | §10.10 privacy requirements, BR-025 | HIGH | Open |
| OQ-POP-2 | 10 | Confirm whether a real Segment/Predict implementation is a v1 roadmap commitment, or remains demo-fixture | Product + Engineering | §10.2–10.4 roadmap | MEDIUM | Open |
| OQ-POP-3 | 10 | Confirm whether "employer" should become a Population Intelligence consumer persona | Product Leadership + Legal/Compliance | New persona/data-boundary decision | MEDIUM | Open |
| OQ-POP-4 | 10 | Confirm the named commercial trigger for a live payer/pharma integration | Product Leadership + Commercial | `pharma-payer.ts` productionization | LOW | Open |
| OQ-POP-5 | 10 | Confirm whether Monitor-stage tracking should be built in the near-term roadmap | Product + Clinical Safety Lead | §10.6/§10.7 Learn-stage meaningfulness | MEDIUM | Open |
| OQ-POP-6 | 10 | Confirm whether a non-ICS "government" consumer is a real near-term requirement | Product Leadership | New consumer-persona scope | LOW | Open |
| OQ-POP-7 | 10 | Confirm the differencing-attack mitigation approach once the minimum-cell threshold is fixed | Architecture + Compliance | EC-POP-5; depends on OQ-POP-1/OQ-ARC-2 | HIGH | Blocked (OQ-ARC-2) |
| OQ-PAT-1 | 11 | Confirm roadmap priority for Missing capabilities (Gamification/Voice/Goals) vs. completing Partial ones | Product Leadership | Patient-capability roadmap sequencing | LOW | Open |
| OQ-PAT-2 | 11 | Confirm the fix for patient `AppRole` mapping before any capability is treated as production-ready (restates OQ-PER-1/2) | Engineering + Clinical Safety | FR-PAT-040, all Patient Intelligence readiness | HIGH | Open |
| OQ-PAT-3 | 11 | Confirm whether personalizing coaching drafts on patient signal data is a v1 commitment, and its exact mapping | Clinical Lead + Product + Engineering | §11.3 FR-PAT-009 | MEDIUM | Open |
| OQ-PAT-4 | 11 | If Family/caregiver access is ever commissioned, confirm the consent model it requires | Product Leadership + Legal/Compliance + Clinical Safety | §11.9 FR-PAT-033 | MEDIUM | Open |
| OQ-PAT-5 | 11 | Confirm whether building the patient self-report check-in surface is a near-term commitment | Product + Engineering | §11.5 FR-PAT-017 | MEDIUM | Open |
| OQ-PAT-6 | 11 | Confirm the exact out-of-hours escalation channel for a coaching-draft crisis disclosure | Clinical Safety Lead + Product | EC-PAT-2 (mechanism partly resolved Ch.15; channel = OQ-FLOW-1) | HIGH | Open |
| OQ-PAT-7 | 11 | Confirm whether a dedicated Education content library is worth building vs. embedded signposting | Product + Clinical Lead | §11.4 FR-PAT-013 | LOW | Open |
| OQ-CLIN-1 | 12 | Confirm roadmap priority/approach for unifying the three clinician surfaces into one workspace shell | Product + Engineering + Design | Workspace unification design (also cited by OQ-UI-1) | MEDIUM | Open |
| OQ-CLIN-2 | 12 | Confirm whether Evidence should become an in-context panel vs. a separate page | Product + Clinical Safety Lead | Evidence UX design | LOW | Open |
| OQ-CLIN-3 | 12 | Confirm whether `HealthPlanDraft` and `CarePathway` should stay distinct or be merged | Product + Clinical Lead | Care Plan panel design + Ch.8 pathway integration | MEDIUM | Open |
| OQ-CLIN-4 | 12 | Confirm whether Nurse/Pharmacist workspaces should gain more panels (e.g. Timeline), or stay narrower by design | Product + Clinical Safety Lead | §12.3 FR-CLIN-008/009 (also cited by OQ-UI-2) | LOW | Open |
| OQ-CLIN-5 | 12 | Confirm target trigger/timeline for scoping ATLAS as a precondition for a research workspace entry point | Product Leadership | §12.8 (depends on OQ-AGT-3) | LOW | Open |
| OQ-CLIN-6 | 12 | Confirm whether real-time cross-surface sync is required pre-pilot, or refresh-to-see-latest is acceptable | Engineering + Clinical Safety Lead | EC-CLIN-1 (relates OQ-HITL-4) | MEDIUM | Open |
| OQ-CLIN-7 | 12 | Confirm whether the Diabetes coaching-escalation item type needs dedicated Approvals UI now | Product + Engineering | §12.5 FR-CLIN-021 | LOW | Open |
| OQ-RES-1 | 13 | Confirm whether the research-evaluation endpoint's ad hoc role check should route through the canonical permission matrix | Architecture + Engineering | FR-PER-008 single-source-of-truth consistency | MEDIUM | Open |
| OQ-RES-2 | 13 | Confirm the operational meaning of "ethics reference confirmed" for research data access (restates OQ-PER-3) | Clinical Safety + Compliance | `dataAccessLevel` elevation gate | HIGH | Open |
| OQ-RES-3 | 13 | Confirm whether a blocked federated job should auto re-evaluate once the ethics gate opens, or require resubmission | Product + Engineering | EC-RES-1 | LOW | Open |
| OQ-RES-4 | 13 | Confirm priority/trigger for building the six vision capability areas beyond current Missing/Partial state | Product Leadership | §13.3 roadmap | LOW | Open |
| OQ-RES-5 | 13 | Confirm whether "Cohort Overview" should be relabeled more conservatively ahead of a real Cohort Builder | Product + Design | §13.3.2 copy accuracy | LOW | Open |
| OQ-RES-6 | 13 | Confirm whether Biomarker Discovery (if built) belongs to Research, Clinical, or Patient Intelligence | Product + Clinical Safety Lead | Chapter-boundary clarity for future build | MEDIUM | Open |
| OQ-RES-7 | 13 | Confirm the SHIELD audit-write fix (OQ-HITL-2) is understood to also cover research/federated-job paths | Clinical Safety Lead + Engineering | EC-RES-4 | MEDIUM | Open |
| OQ-LEARN-1 | 14 | Confirm the reviewer workflow for reconciling conflicting eventual-outcome reports on one learning event | Product + Clinical Safety Lead | EC-LEARN-1 | LOW | Open |
| OQ-LEARN-2 | 14 | Confirm whether `learningEventIdsReviewed` is checked against the submitting actor's tenant scope | Engineering + Clinical Safety Lead | EC-LEARN-2, tenant-isolation consistency (also OQ-BR-6) | HIGH | Open |
| OQ-LEARN-3 | 14 | Confirm whether a governed evaluation with zero reviewed learning events should be a hard validation error | Clinical Safety Lead | FR-LEARN-020 | MEDIUM | Open |
| OQ-LEARN-4 | 14 | Confirm the target date/owner for resolving hazards H-011/H-012's Unsigned status | Clinical Safety Lead | FR-LEARN-023 hazard-log closure | HIGH | Open |
| OQ-LEARN-5 | 14 | Confirm whether the G-ML-1/2/3 sequence needs an addendum for twin/disease-module version swaps (generalizes OQ-TWIN-3) | Clinical Safety Lead + ML Governance | §14.7 | MEDIUM | Open |
| OQ-LEARN-6 | 14 | Confirm the SHIELD audit-write fix (OQ-HITL-2) covers the learning-event/governed-evaluation dual-write paths | Clinical Safety Lead + Engineering | EC-LEARN-4 | MEDIUM | Open |
| OQ-LEARN-7 | 14 | Confirm whether the admin learning dashboard should ever surface gate-signing status to non-clinical roles | Product + Clinical Safety Lead | FR-PER-009 boundary clarity | LOW | Open |

### 21.6 Master Open Questions — Part E: Experience & Workflows (Chapters 15–18, 29 questions)

| ID | Ch. | Question (restated, short) | Owner | Blocks | Priority | Status |
| --- | --- | --- | --- | --- | --- | --- |
| OQ-FLOW-1 | 15 | Confirm the exact out-of-hours crisis/red-flag signpost channel(s), and whether per-practice-configurable | Clinical Safety Lead + Product | §15.3 escalation mechanism (relates OQ-PAT-6) | HIGH | Open |
| OQ-FLOW-2 | 15 | Confirm whether "who marks `referral_pathway` `not_applicable`" (OQ-HITL-5) resolves here or stays Ch.5's to close | Clinical Safety Lead | Journey 2 workflow authority | MEDIUM | Open |
| OQ-FLOW-3 | 15 | Confirm the UI treatment for Journey 5's Segment-stage disclosure (banner/per-view/one-time gate) | Product + UI | FR-FLOW-019 (deferred to Ch.18) | LOW | Open |
| OQ-FLOW-4 | 15 | Confirm the target date for Chapter 8's v1 wiring so Journey 4's `[FUTURE]` label has a revision trigger | Product + Engineering | Journey 4 status revision | MEDIUM | Open |
| OQ-FLOW-5 | 15 | Confirm whether Journey 6's data-access elevation needs a lightweight in-app ethics-reference record (restates OQ-PER-3) | Clinical Safety + Compliance | Pre-pilot individual-level research access | HIGH | Open |
| OQ-FLOW-6 | 15 | Confirm the intended UX for demo-reset mid-journey and overlapping `medication_decision` gate instances | Product | Deferred to Ch.18 (= OQ-UI-3) | LOW | Open |
| OQ-FLOW-7 | 15 | Confirm whether the eight journeys are the complete initial set, or a ninth (Hospital Exec Command-Centre) is needed | Product | Journey-catalogue completeness before review | LOW | Open |
| OQ-BR-1 | 16 | Confirm each newly-promoted `BR-<nnn>` entry against its cited origin at the next revision | Product + home-chapter owner | Catalogue authoritativeness for sign-off | MEDIUM | Open |
| OQ-BR-2 | 16 | Restates OQ-HITL-2 — the SHIELD best-effort audit-write remediation choice | Clinical Safety Lead + Engineering | BR-006 guarantee | HIGH | Open |
| OQ-BR-3 | 16 | Restates OQ-ARC-2/OQ-POP-1 — numeric suppression threshold unset, BR-025 cannot close | Clinical Safety Lead + Compliance + Architecture | BR-025 closure | HIGH | Blocked (OQ-ARC-2) |
| OQ-BR-4 | 16 | Restates OQ-DIAB-2/OQ-HITL-1 — Insulin/GLP-1 gate-reuse default is provisional | Clinical Safety Lead | BR-037 | HIGH | Open |
| OQ-BR-5 | 16 | Restates OQ-PER-4/OQ-CORE-1 — `productionRbacEnforced:true` has no committed workstream | Architecture + Engineering | BR-015 | HIGH | Open |
| OQ-BR-6 | 16 | Restates OQ-LEARN-2 — tenant isolation not yet confirmed for the governed-evaluation cross-tenant check | Engineering + Clinical Safety Lead | BR-053 | HIGH | Open |
| OQ-BR-7 | 16 | Confirm whether a per-rule ownership column is needed, or category-level ownership suffices | Product | Engineering sign-off granularity | LOW | Open |
| OQ-BR-8 | 16 | Confirm whether the catalogue should gain a machine-readable (JSON/YAML) export for future CI enforcement | Engineering + Architecture | Future tooling | LOW | Open |
| OQ-DATA-1 | 17 | Should CGM extend the `wearable` modality, or become a dedicated `glucose` modality (= OQ-DIAB-1) | Architecture + Clinical Safety Lead | FR-DATA-022/023/024 | HIGH | Open |
| OQ-DATA-2 | 17 | Should a first-class `ClinicalDraft` type be introduced, or should this chapter's naming align to code instead | Engineering + Product | §17.2.4 naming alignment | LOW | Open |
| OQ-DATA-3 | 17 | Restates OQ-ARC-2/OQ-POP-1/OQ-BR-3 — numeric suppression threshold for `PopulationAggregate` remains unset | Clinical Safety Lead + Compliance + Architecture | FR-DATA-016 closure | HIGH | Blocked (OQ-ARC-2) |
| OQ-DATA-4 | 17 | What are the actual retention periods for T1–T4 data, demo vs. future pilot/live | Compliance/DPO + Product | Future governance chapter (relates OQ-NFR-6) | HIGH | Open |
| OQ-DATA-5 | 17 | Restates EC-DATA-3 — reject, flag-pending-review, or pass-through an out-of-bounds device/lab reading? | Clinical Safety Lead + Engineering | Future real-data-source wiring | MEDIUM | Open |
| OQ-DATA-6 | 17 | Restates NO-DATA-6 — should a canonical shared data-dictionary module exist in code | Engineering + Architecture | Entity-catalogue/code drift risk | LOW | Open |
| OQ-DATA-7 | 17 | Restates EC-DATA-5 — must an undelivered `ResearchExport` be actively discarded if the ethics gate later fails | Clinical Safety Lead + Compliance | `ResearchExport` lifecycle rule | MEDIUM | Open |
| OQ-UI-1 | 18 | Should SCR-GP-2 be merged into SCR-GP-1, or kept separate (= OQ-CLIN-1) | Product + Design | FR-UI-062 screen-count consolidation | LOW | Open |
| OQ-UI-2 | 18 | Should Nurse/Pharmacist screens gain a lightweight Timeline panel (restates OQ-CLIN-4) | Product + Clinical Safety Lead | SCR-NUR/PHM 1–4 | LOW | Open |
| OQ-UI-3 | 18 | What is the exact treatment for overlapping gate instances and demo-reset warnings (restates OQ-FLOW-6) | Product + Design | EC-UI-4/EC-UI-5 | LOW | Open |
| OQ-UI-4 | 18 | Should the Check-ins tab block submissions until a backing API exists, or keep local-only storage with disclosure | Product + Engineering | FR-UI-033 | MEDIUM | Open |
| OQ-UI-5 | 18 | Should the researcher data-access control be hidden until OQ-PER-3 resolves, or stay visible-but-disclosed | Clinical Safety Lead + Compliance | SCR-RES-2 / FR-UI-038 | MEDIUM | Open |
| OQ-UI-6 | 18 | Should a formal accessibility conformance target exist — **partially resolved, see DEC-013** | Product + Compliance | Superseded by NFR-041; audit-timing gap now OQ-NFR-4 | LOW | Open (partial) |
| OQ-UI-7 | 18 | Should the internal `/workspace` engineering tooling get its own screen inventory in a future appendix | Product + Engineering | Chapter 22 Appendices scope | LOW | Open |

### 21.7 Master Open Questions — Part F: Quality & Governance (Chapters 19–20, 14 questions)

| ID | Ch. | Question (restated, short) | Owner | Blocks | Priority | Status |
| --- | --- | --- | --- | --- | --- | --- |
| OQ-NFR-1 | 19 | Who owns commissioning a full load/soak test at realistic multi-practice scale, and what triggers it | Engineering + Product | NFR-005 | MEDIUM | Open |
| OQ-NFR-2 | 19 | When is the external security pen test scheduled, and what's the pre-pilot blocking bar | Compliance + Engineering | NFR-026 (evidence-pack #8, GAP) | HIGH | Open |
| OQ-NFR-3 | 19 | What RTO/RPO targets should the unrun Neon/Vercel DR drill validate against | Engineering + Product | NFR-011 (evidence-pack #12, GAP) | HIGH | Open |
| OQ-NFR-4 | 19 | Who commissions the full WCAG 2.1 AA audit across all 59 screens, by when | Product + Compliance + Design | NFR-043 (extends OQ-UI-6; level already set by DEC-013) | MEDIUM | Open |
| OQ-NFR-5 | 19 | What LLM-on latency budget applies once `ENABLE_LLM_*` flags are live for a pilot | Engineering | NFR-052 | MEDIUM | Open |
| OQ-NFR-6 | 19 | Does resolving OQ-DATA-4 (retention periods) also resolve NFR-033, or is a purge-job NFR still separately open | Compliance/DPO + Engineering | NFR-033 | MEDIUM | Blocked (OQ-DATA-4) |
| OQ-NFR-7 | 19 | Should a formal uptime/availability SLA be defined pre-pilot, or negotiated per-contract | Product + Commercial | NFR-010 | LOW | Open |
| OQ-VAL-1 | 20 | Who owns re-keying `QA_TRACEABILITY_MATRIX.md`'s `REQ-<nnn>` ids to this Volume's `FR-*`/`AC-*` ids | QA + Product | Traceability-matrix currency | MEDIUM | Open |
| OQ-VAL-2 | 20 | Should the golden-case agent-eval harness extend beyond SYNTHESIS/GUARDIAN/ORACLE to the other 9 agents | Engineering + Clinical Safety | Agent-eval coverage | MEDIUM | Open |
| OQ-VAL-3 | 20 | Who owns writing the first unit tests for the 9 Diabetes signal-builder files, and is it gated on v1 wiring | Engineering | Diabetes test coverage | MEDIUM | Open |
| OQ-VAL-4 | 20 | What is the actual sign-off mechanism for moving a chapter DRAFTED → Accepted — **addressed, see §21.10** | Product + Clinical Safety + Architecture | §0.5 mechanism | HIGH | Proposed |
| OQ-VAL-5 | 20 | Should `route-smoke.test.js`'s HTTP-200 sweep be its own lighter validation level | Engineering + QA | §20.1 validation-hierarchy refinement | LOW | Open |
| OQ-VAL-6 | 20 | At what cadence should automated accessibility coverage expand | Product + Design + Engineering | §20.5 DoD vs. Ch.19 ownership | LOW | Open |
| OQ-VAL-7 | 20 | Does a Track A demo-GO decision need re-confirmation on every deploy, or only on clinical-path changes | Engineering + Release | Gate 1–3 re-validation cadence | MEDIUM | Open |

### 21.8 Recurring question clusters (de-duplication note)

Per FR-OQ-003, the following clusters are chapter-scoped restatements of one underlying decision, not independent questions — closing the first-listed (origin) id closes every id in its cluster:

- **Minimum-cell / k-anonymity suppression threshold.** Origin `OQ-ARC-2` (Ch.4) → restated verbatim as `OQ-POP-1` (Ch.10), `OQ-BR-3` (Ch.16), `OQ-DATA-3` (Ch.17); blocks `OQ-POP-7` (Ch.10). Five ids, one decision. **Highest-leverage single open question in the Volume** — it gates BR-025, FR-ARC-033, FR-POP-031, and FR-DATA-015/016.
- **SHIELD best-effort audit-write gap.** Origin `OQ-HITL-2` (Ch.5) → restated as `OQ-BR-2` (Ch.16); its coverage extended (not restated) by `OQ-RES-7` (Ch.13) and `OQ-LEARN-6` (Ch.14) asking whether the same fix also covers their paths.
- **`productionRbacEnforced` false→true trigger.** Origin `OQ-PER-4` (Ch.3) → restated as `OQ-CORE-1` (Ch.6) and `OQ-BR-5` (Ch.16).
- **Patient/researcher `AppRole` mapping gap.** Origin `OQ-PER-1`/`OQ-PER-2` (Ch.3) → restated as `OQ-PAT-2` (Ch.11).
- **"Ethics reference confirmed" operational meaning.** Origin `OQ-PER-3` (Ch.3) → restated as `OQ-RES-2` (Ch.13) and `OQ-FLOW-5` (Ch.15).
- **Insulin/GLP-1 gate-type decision.** Origin `OQ-HITL-1` (Ch.5) = `OQ-DIAB-2` (Ch.8, same question, not a restatement of a different one — both chapters raised it independently and later confirmed it is one question) → restated as `OQ-BR-4` (Ch.16).
- **Diabetes-suffixed coaching-agent-id union.** Origin `OQ-ARC-3` (Ch.4) → restated as `OQ-DIAB-5` (Ch.8).
- **`referral_pathway` `not_applicable` authority.** Origin `OQ-HITL-5` (Ch.5) → restated as `OQ-FLOW-2` (Ch.15).
- **Learning-event tenant-isolation check.** Origin `OQ-LEARN-2` (Ch.14) → restated as `OQ-BR-6` (Ch.16).
- **G-ML gate sequence needing a non-classification-model addendum.** Origin `OQ-TWIN-3` (Ch.9) → generalized as `OQ-LEARN-5` (Ch.14).
- **GP-surface consolidation.** Origin `OQ-CLIN-1` (Ch.12) → restated at screen-catalogue level as `OQ-UI-1` (Ch.18).
- **Nurse/Pharmacist Timeline panel.** Origin `OQ-CLIN-4` (Ch.12) → restated as `OQ-UI-2` (Ch.18).
- **Demo-reset / overlapping-gate UX treatment.** Origin `OQ-FLOW-6` (Ch.15) → restated as `OQ-UI-3` (Ch.18).
- **Accessibility conformance target.** `OQ-UI-6` (Ch.18) asked "what level" — answered by `DEC-013` (Ch.19, WCAG 2.1 AA). The narrower "when is the full 59-screen audit run" question survives, unresolved, as `OQ-NFR-4`.

Fourteen clusters account for 32 of the 118 ids; the remaining 86 are each a single, independent open question.

### 21.9 Closed Decisions Log

Decisions already made and binding on this Volume, each a pointer to its existing origin — not a new ruling by this chapter. Per §0.4's Precedence rule, a `HARD`-tagged decision below cannot be relaxed by any future chapter without the named separately-governed process that decision's own origin already specifies.

| DEC-ID | Decision | Origin | Note |
| --- | --- | --- | --- |
| DEC-001 | HITL is mandatory: no autonomous clinical decision (diagnosis, prescribing, dose change, care-plan finalization) without explicit human clinician review. | NO-1, BR-001, Ch.5 | `HARD`. |
| DEC-002 | No automatic prescribing: the platform shall never generate an executable prescription or auto-apply a dose change. | NO-2, BR-027 | `HARD`. |
| DEC-003 | No live EHR write: `liveEmis:false` remains hard, code-enforced, in every environment until a separately governed decision (named regulatory/contractual/technical sign-off) changes it. | NO-4, BR-076, FR-HITL-023, FR-ARC-035 | `HARD`. |
| DEC-004 | No silent/automatic model retraining: `autoRetrain:false`/`autoRetrainTriggered:false` is a literal, tested guarantee; only a manually-operated G-ML-1/2/3 release can bump a version. | NO-5, BR-068, FR-HITL-029 | `HARD`. |
| DEC-005 | No fake or implied regulatory certification (UKCA/MHRA/DCB0129/DCB0160/DTAC/CIS2 or equivalent); rehearsal artefacts are labeled as rehearsal, not certification. | NO-6, BR-040 | `HARD`. |
| DEC-006 | CONDUCTOR is a deterministic, hard-coded orchestrator — not a dynamic, LLM-planned graph (a LangGraph-style agent-to-agent handoff was considered and explicitly rejected). | FR-AGT-001/002, NO-AGT-4, Ch.7 §7.1; restated by NS-6 | Tech-stack-adjacent decision; see also DEC-010. |
| DEC-007 | The 12 named agents are internal, typed, in-process platform services, not independently-deployed microservices. | FR-AGT-001 | — |
| DEC-008 | Canonical agent rename map: HORIZON (was ORACLE), COMPASS (was EQUITY), PATHWAY (was REFERRAL). Legacy ids remain in code as aliases only, never used in product-facing language going forward. | Ch.7 revision note (§0.7, v0.6); `docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md` | — |
| DEC-009 | Aksh Diabetes is scoped as 9 typed intelligence-area signal/coaching-derivation functions, not 9 new LLM agents and not 9 new `AGENT_DIRECTORY` entries. | FR-DIAB-002, FR-AGT-038/039 | — |
| DEC-010 | The Tech Stack ADR's Keep / Add-later (named trigger) / Avoid-now framing is binding; no chapter may silently assume an "Avoid now" component (NestJS, FastAPI-as-backend, Temporal, LangGraph, Kafka, GraphQL, Qdrant, ClickHouse, BiomedCLIP/MedGemma, external research APIs) without naming that ADR's own trigger. | NS-6, `docs/ADR_TECH_STACK_MODERNIZATION.md` | `HARD`. |
| DEC-011 | A future vector/embedding need extends Postgres with `pgvector` first; Qdrant remains Avoid-now absent a documented reason to deviate. | FR-CORE-029, Tech Stack ADR | — |
| DEC-012 | The generic Digital Twin primitive stays disease-agnostic and rules-based (`synthetic_rules`); `physiologicalTwin:false` is a literal, tested honesty field, and a twin output failing this check is blocked before release, not shipped with a caveat. | FR-HITL-007, FR-ARC-011/016, NO-TWIN-1 | `HARD`. |
| DEC-013 | WCAG 2.1 AA is the platform's binding accessibility conformance **target** (resolves the "what level" half of Ch.18's `OQ-UI-6`; full-catalogue audit timing remains open as `OQ-NFR-4`). | NFR-041, Ch.19 §19.7 | — |
| DEC-014 | The current build's authorization is demo-grade by explicit, documented admission (`productionRbacEnforced:false`) — the permission matrix documents intended boundaries, not enforced production RBAC, and this is stated plainly rather than implied otherwise. | Ch.3 §3.5, `lib/permission-matrix.ts` | Trigger to close tracked at `OQ-PER-4`/`OQ-CORE-1`. |
| DEC-015 | No parallel per-module safety/audit infrastructure: every disease module reuses CONDUCTOR, SHIELD, and the existing identity/consent primitives rather than building its own. | NO-8 | `HARD`. |
| DEC-016 | No EHR replacement positioning: the platform sits alongside a practice's EHR/EMR, never as a competing system of record. | NO-3 | `HARD`. |
| DEC-017 | No real (non-synthetic, non-explicitly-pilot-consented) patient data under this Volume's current scope, absent a separate, explicitly governed decision (consent, DPIA, regulatory review). | NO-9 | `HARD`. |
| DEC-018 | No single-disease lock-in: shared platform layers (Core, Platform Agents, Continuous Learning) must not hard-code Diabetes-only assumptions. | NO-10 | — |
| DEC-019 | Insulin/GLP-1 `doseChangeRecommendation` and `prescribingRecommendation` fields are hard `null`-typed locks — the type system itself, not just process, prevents these fields from ever carrying an executable value. | BR-034 | `HARD`. |
| DEC-020 | Track A (demo/pilot, synthetic cohort, `liveEmis:false`) is **GO WITH LIGHT POLISH**; Track B (live NHS EMR/EMIS write-back) is **NO-GO by design** until partner credentials, sandbox UAT, Gates 2–3, and a signed N7 `liveEmis`-flip authorization all exist. | FR-VAL-033, `docs/BUILT_VS_REMAINING_AUDIT.md` | `HARD`. |
| DEC-021 | The existing 16-artefact evidence pack and its Gate 1–3 (platform readiness / clinical safety / pilot authority) checklists are the binding pilot-readiness bar; this Volume does not define a competing readiness bar. | SC-8, FR-VAL-040 | — |
| DEC-022 | Requirement/AC/BR/OQ ids are never renumbered or reused once a chapter reaches DRAFTED and has been reviewed at least once; a dropped requirement is marked `DEPRECATED` in place. | §0.6 | Binding on this chapter's own `OQ-*`/`DEC-*` scheme (FR-OQ-002). |

### 21.10 Decision process (who can close what)

This section proposes, but does not itself execute, the closure mechanism `OQ-VAL-4` asks for and §0.5 has left as "mechanism TBD" since v0.1. It is recorded as `Proposed` (FR-OQ-006), pending the ratification below.

- A question whose Owner list is **Product-only** (e.g. `OQ-AGT-3`, `OQ-POP-6`, `OQ-RES-4`) may be closed by a documented Product decision alone, recorded as a new `DEC-<nnn>` citing the closing chapter/document.
- A question whose Owner list includes **Clinical Safety Lead**, **Clinical Lead**, or a named clinical advisor role may not be closed without that role's explicit, dated sign-off — Product or Engineering alone closing such a question (even by shipping code that assumes an answer) is itself a Chapter 5 §5.9-style clinical-safety-relevant change requiring review, restating BR-005's accountable-persona principle at the governance layer.
- A question whose Owner list includes **Architecture** and touches the permission matrix, tenant isolation, a data-model/threshold decision, or a Tech Stack ADR trigger may not be closed without Architecture's sign-off, restating this Volume's own precedence rule (§0.4) that architecture/engineering source-of-truth documents govern "how."
- A question whose Owner list includes **Compliance**, **Compliance/DPO**, or **Legal/Compliance** may not be closed without that function's sign-off, consistent with NO-9's standing bar on any real-patient-data-adjacent decision.
- Once a question is closed per the rules above, it is recorded as a new `DEC-<nnn>` in §21.9 at this chapter's next revision (FR-OQ-005), and every linked/duplicate `OQ-*` id in its cluster (§21.8) is marked `Closed → DEC-<nnn>` in place — never deleted, never renumbered (FR-OQ-002, restating §0.6).
- **Proposed answer to `OQ-VAL-4` (chapter DRAFTED → Accepted):** a chapter moves from DRAFTED to Accepted once Product, Architecture, and Clinical Safety Lead each record a dated sign-off (name, role, chapter, version) against that specific chapter version — for example in a future `docs/volume-i/SIGNOFF_LOG.md` — with all three sign-offs required before the TOC status line may read **[Accepted]**. This mechanism is itself unratified and unexercised as of this version; it resolves the mechanism's *shape*, not its adoption.

### 21.11 Non-goals

- **NO-OQ-1.** This chapter does not resolve, pre-empt, or imply an answer to any of the 118 open questions it restates — every clinical, product, or architectural judgment call recorded here remains exactly as open as its home chapter left it.
- **NO-OQ-2.** This chapter does not renumber, merge, or delete any existing `OQ-*` id, even where two or more ids describe the same underlying decision (§21.8) — duplicates are cross-referenced, never collapsed into a single id.
- **NO-OQ-3.** This chapter does not itself grant "Accepted" status to any chapter in this Volume. §21.10 proposes a sign-off mechanism; it does not execute it, and no chapter's TOC status is changed by this chapter's drafting.
- **NO-OQ-4.** This chapter does not create, modify, or propose to create any code, test, CI check, or tooling (including the JSON/YAML export raised in `OQ-BR-8`) — it is documentation only, consistent with every other chapter in this Volume.
- **NO-OQ-5.** This chapter does not assign a hard deadline to any question whose Owner entry does not already state one — a Priority of HIGH in §21.2–§21.7 reflects blocking severity, not a committed date.
- **NO-OQ-6.** This chapter is not a substitute for Chapter 16 (Business Rules Catalog) or Chapter 20 (Acceptance & Validation §20.2 Traceability) — it indexes open questions and already-made decisions, not business rules or test-coverage status, and does not duplicate either chapter's own tables.

### 21.12 Cross-references

- Chapters 3–20 — the home chapters for every `OQ-*` id restated in §21.2–§21.7 and every decision's origin cited in §21.9; this chapter adds classification and an index, not new content, to any of them.
- Chapter 16 (§16.1, §16.3, §16.4) — the top-priority hard-constraint quick reference and conflict-resolution rule this chapter's §21.9 Closed Decisions Log extends with a broader, cross-Volume decision register (BR entries plus non-BR decisions like the CONDUCTOR/LangGraph and rename-map choices).
- Chapter 20 (§20.10, `OQ-VAL-4`) — the "mechanism TBD" chapter-acceptance question this chapter's §21.10 proposes an answer to, without itself closing it.
- `docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md` — origin of the agent-rename map (DEC-008) and the 9-layer/12-agent vocabulary every Part B–D chapter builds on.
- `docs/ADR_TECH_STACK_MODERNIZATION.md` — origin of the Keep/Add-later/Avoid-now decision (DEC-010) and the pgvector-before-Qdrant decision (DEC-011).
- `docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md` — origin of the Diabetes-as-9-signals decision (DEC-009) and several `OQ-DIAB-*` questions restated here.
- `docs/GOVERNED_MODEL_RELEASE_SOP.md`, `docs/CONTINUOUS_LEARNING.md` — origin of the G-ML-1/2/3 sequence underlying DEC-004 and the `OQ-TWIN-3`/`OQ-LEARN-5` questions about its scope.
- `docs/BUILT_VS_REMAINING_AUDIT.md` — origin of the Track A/B decision (DEC-020).
- `docs/QA_TRACEABILITY_MATRIX.md` — the still-open re-keying question (`OQ-VAL-1`) this chapter restates rather than performs.

---

## 26. Chapter 22 — Appendices `[DRAFTED]`

### 22.0 Purpose of this chapter

Chapter 21 recommended this as the Volume's final chapter and scoped it in advance (§0.7 v0.20): "a light, reference-only chapter — a glossary of the Volume's own vocabulary, an index of every `FR-*`/`NO-*`/`BR-*`/`NFR-*`/`OQ-*`/`DEC-*` id range by chapter for fast lookup, and pointers to the artefacts this Volume deliberately does not duplicate — not a chapter that introduces new requirements of its own." This chapter follows that scope exactly.

Like Chapters 16, 20, and 21 before it, this is a **consolidation chapter, not a new-content chapter** — every appendix below is built by grepping the already-drafted text of Chapters 0–21 and the repository's `docs/` tree, not by authoring new product requirements, business rules, or glossary meanings. Where a term, an id range, or a document path already appears in an earlier chapter, this chapter indexes it; it does not redefine it. Eight appendices follow (A–H), each an index or pointer table, deliberately kept short per this chapter's own non-goals (§22.9) — this is not, and must not become, a second PRD.

Completing this chapter completes Volume I: all 22 chapters listed in the Table of Contents (§1) are, as of this revision, marked **[DRAFTED]**.

- **FR-APP-001.** This chapter's four content appendices with lookup value (A, B, C, D) and its four short guidance appendices (E, F, G, H) shall each consist of tables or short pointer lists — no appendix shall restate a Given/When/Then acceptance criterion, a full business-rule statement, or a full functional-requirement statement already written in its home chapter; a reader needing the full statement follows the appendix's citation back to the home chapter or document.
- **FR-APP-002.** Every glossary entry (Appendix A) and every id-range entry (Appendix B) shall cite the chapter (or ADR/spec) in which the term or id scheme originates — an entry with no traceable origin shall not be included.
- **FR-APP-003.** Every related-document entry (Appendix C) shall cite an actual file path under `docs/` verified to exist at drafting time — this chapter shall not reference a document by an assumed or inferred path.
- **FR-APP-004.** Appendix H shall reference the existing demo-credentials and seed-data documents by path only and shall not reprint any credential value (username, password, API key, or token) inline in this Volume, restating this Volume's own document-control discipline (§0.1: this is a requirements document, not an operations runbook) at the appendix layer.
- **FR-APP-005.** This chapter's drafting shall not change the **[DRAFTED]**/**[TODO]** status of any other chapter, and shall not itself grant **Accepted** status to any chapter (including itself) — restating Chapter 21 NO-OQ-3's boundary at the closing chapter.
- **FR-APP-006.** Once this chapter reaches **[DRAFTED]**, the Table of Contents (§1) and its chapter-count line shall read 22 of 22 chapters drafted, and this Volume's Status line (document header) shall read **Draft complete — pending review** rather than **DRAFT — INCOMPLETE**.

### 22.1 Appendix A — Glossary

Reference only — full mechanics live in each cited chapter. Not exhaustive of every defined term in the Volume; covers the terms most likely to be looked up out of context.

| Term | Meaning (short) | Origin |
| --- | --- | --- |
| **CONDUCTOR** | The single deterministic, hard-coded orchestrator that runs the other agents against one `SharedPatientContext` and resolves a safety route. Not a dynamic/LLM-planned graph (DEC-006). | Ch.4 §4.5, Ch.7 §7.2.1 |
| **SYNTHESIS** | Clinical Documentation Agent — turns a transcript into a structured SOAP draft. | Ch.7 §7.2.2 |
| **VOICE** | Dictation-intake sub-capability of CANVAS (not a peer 12-agent entry); distinct from VOICE CARE. | Ch.7 §7.2.3 |
| **CANVAS** | Clinical Intake Agent — the platform's single intake-normalization point; attaches a `GenerationTraceItem` to every inferred field. | Ch.7 §7.2.4 |
| **GUARDIAN** | Medication Intelligence (Safety) Agent — drug–drug/allergy check; its `overallStatus` is the sole trigger for `Urgent` queue priority. | Ch.7 §7.2.5 |
| **HORIZON** (legacy `ORACLE`) | Predictive Risk Agent — CVD/T2D composite risk narrative. Canonical name per DEC-008. | Ch.7 §7.2.6 |
| **NEXUS** | Clinical Intelligence Agent — surfaces 2–3 cross-signal correlations as a `ClinicalImpression` draft; always returns `status: "draft"` (FR-AGT-022). | Ch.7 §7.2.7 |
| **PATHWAY** (legacy `REFERRAL`) | Care Coordination Agent — drafts a referral/care-coordination package. Canonical name per DEC-008. | Ch.7 §7.2.8 |
| **Dr.Assist** | Coding sub-capability of SYNTHESIS (not a peer 12-agent entry) — suggests SNOMED CT/ICD-10 codes. | Ch.7 §7.2.9 |
| **COMPASS** (legacy `EQUITY`) | Population Health Agent — aggregate, never named-patient, health-disparity brief. Canonical name per DEC-008. | Ch.7 §7.2.10 |
| **BRIDGE** | Interoperability Agent — stages a HITL-accepted case's FHIR bundle to internal/EMIS-staging; never a live EHR write. | Ch.7 §7.2.11 |
| **SHIELD** | Regulatory & Audit Agent — the platform's single immutable, hash-chained audit trail. | Ch.5 §5.4, Ch.7 §7.2.12 |
| **VOICE CARE** | Synthetic Day-3 outbound check-in escalation creating a nurse task — an adjacent capability, not a 12-agent-directory entry; distinct from VOICE. | Ch.7 §7.2.14 |
| **PRISM, ATLAS** | Phase 2 / `live: false` roadmap agents (Imaging Intelligence; Clinical Research) — not built, not available today. | Ch.2, Ch.7 §7.1 (FR-AGT-005) |
| **`AGENT_DIRECTORY`** | The canonical 12-agent registry defined in `lib/agents.ts`; source of truth for agent names/status. | Ch.4, Ch.7 |
| **HITL** | Human-in-the-Loop — mandatory human clinician review before any clinical decision is actioned; DEC-001, the Volume's single hardest constraint. | Ch.5 |
| **`HumanGateId`** | One of three case-level gates that must be `confirmed` or `not_applicable` before a case is finalization-ready: `red_flag_escalation`, `referral_pathway`, `medication_decision`. | Ch.5 §5.2 |
| **`SafetyRoute`** | One of four routes every case resolves to: `low_risk_coaching`, `clinical_review_queue`, `urgent_flag`, `request_more_data` — never undefined/absent. | Ch.5 §5.6 (FR-HITL-018) |
| **`SharedPatientContext`** | The one identical context object CONDUCTOR runs every included agent against; a per-run assertion (`assertSharedContext`) throws on mismatch. | Ch.7 §7.2.1 |
| **`liveEmis`** | Hard, code-enforced flag; `false` in every environment today. No live EHR write occurs until a separately governed decision changes it (DEC-003). | Ch.1 NO-4, Ch.6 |
| **`autoRetrain` / `autoRetrainTriggered`** | Literal, tested guarantee that no model retrains silently/automatically; only a manual G-ML-1/2/3 release bumps a version (DEC-004). | Ch.14 |
| **`physiologicalTwin`** | Honesty field; `false` today — the existing twin (`lib/precision-health/twin-simulation.ts`) is a generic, disease-agnostic, rules-based (`synthetic_rules`) scenario ranker, not a physiological model (DEC-012). | Ch.9 |
| **`ehrWrite` / `hitlRequired`** | Honesty fields on every orchestration/learning-event record; `ehrWrite:false`, `hitlRequired:true` hard-coded at the data layer, not just an application default. | Ch.4, Ch.14 |
| **G-ML-1 / G-ML-2 / G-ML-3** | The three-gate governed-model-release sequence a model/agent-version/twin-rule-weight change must pass before release; no release has traversed the full sequence in this build to date. | `docs/GOVERNED_MODEL_RELEASE_SOP.md`, Ch.14 |
| **Disease module** | The pattern by which a condition (Diabetes first) is added as typed signal/coaching-derivation functions reusing CONDUCTOR/SHIELD/identity — never a parallel per-module safety stack (DEC-015) and never 9 new agents (DEC-009). | Ch.8, Ch.4 §4.3.3 |
| **Track A / Track B** | Track A = demo/pilot, synthetic cohort, `liveEmis:false`, rated **GO WITH LIGHT POLISH**. Track B = live NHS EMR/EMIS write-back, rated **NO-GO by design** until named preconditions are met (DEC-020). | `docs/BUILT_VS_REMAINING_AUDIT.md`, Ch.20 |
| **Minimum-cell / k-anonymity threshold** | The still-open (`OQ-ARC-2` cluster) numeric floor below which a population-aggregate cell must be suppressed rather than shown — the Volume's single highest-leverage open question. | Ch.4, Ch.21 §21.8 |
| **`productionRbacEnforced`** | Honesty field; `false` today — the permission matrix documents intended boundaries, demo-grade, not enforced production RBAC (DEC-014). | Ch.3 §3.5 |
| **WCAG 2.1 AA** | The platform's binding accessibility conformance target (DEC-013); full 59-screen audit beyond the existing 2-route axe-core check remains open (`OQ-NFR-4`). | Ch.18, Ch.19 |
| **Honesty field** | This Volume's own term for a literal, code-level boolean/enum (`liveEmis`, `autoRetrain`, `physiologicalTwin`, `ehrWrite`, `hitlRequired`, `productionRbacEnforced`, GUARDIAN's `dataSource`, twin/Diabetes `insufficient_data`/`null`) that states current build-truth rather than an aspiration, and that a chapter must restate rather than round up. | Used throughout; named explicitly from Ch.9 onward |
| **`[MEASURED]` / `[ASPIRATIONAL — NEEDS BASELINE]` / `[PROCESS GATE — NOT YET EVIDENCED]`** | Chapter 19's three-way honesty tag applied to every quantitative/process NFR claim. | Ch.19 |
| **`[LIVE]` / `[PARTIAL]` / `[FUTURE]`** | Chapter 15's per-journey current-state honesty label, layered on top of (not instead of) each underlying chapter's own status. | Ch.15 §15.1 |
| **DPIA / DCB0129 / DCB0160 / MHRA / DTAC / CIS2 / UKCA** | Named UK health-tech regulatory/assurance frameworks this Volume references as **not obtained** wherever mentioned (DEC-005) — never implied as in-progress or achieved. | Ch.1 NO-6, Ch.19, Ch.20 |

### 22.2 Appendix B — Requirement ID prefix index

Ranges below are grepped directly from the drafted text at this revision, not hand-counted — a future revision that adds a requirement to any chapter must re-verify its range at that time (restating Ch.21 FR-OQ-004's currency discipline for ids generally).

| Prefix | Chapter | Scheme used | Range (this revision) |
| --- | --- | --- | --- |
| — | 1 — Product Vision & Objectives | `BO-<n>` (Business Objectives), `SC-<n>` (Success Criteria) — no chapter-coded `FR-` prefix | BO-1–9, SC-1–13 |
| — | 2 — Scope & Non-Scope | `NO-<n>` (Volume-wide Non-Objectives) — no chapter-coded `FR-` prefix | NO-1–10 |
| `PER` | 3 — Personas & Stakeholders | `FR-PER-<nnn>` | FR-PER-001–015 |
| `ARC` | 4 — Platform Architecture | `FR-ARC-<nnn>` | FR-ARC-001–041 |
| `HITL` | 5 — Clinical Safety & Human Oversight | `FR-HITL-<nnn>` | FR-HITL-001–037 |
| `CORE` | 6 — Core Platform Capabilities | `FR-CORE-<nnn>` | FR-CORE-001–033 |
| `AGT` | 7 — Universal Agent Platform | `FR-AGT-<nnn>` | FR-AGT-001–042 |
| `DIAB` | 8 — Disease Intelligence: Diabetes | `FR-DIAB-<nnn>` | FR-DIAB-001–058 (largest in the Volume) |
| `TWIN` | 9 — Digital Twin: Diabetes | `FR-TWIN-<nnn>` | FR-TWIN-001–038 |
| `POP` | 10 — Population Intelligence | `FR-POP-<nnn>` | FR-POP-001–038 |
| `PAT` | 11 — Patient Intelligence | `FR-PAT-<nnn>` | FR-PAT-001–042 |
| `CLIN` | 12 — Clinical Intelligence | `FR-CLIN-<nnn>` | FR-CLIN-001–035 |
| `RES` | 13 — Research Intelligence | `FR-RES-<nnn>` | FR-RES-001–035 |
| `LEARN` | 14 — Continuous Learning | `FR-LEARN-<nnn>` | FR-LEARN-001–036 |
| `FLOW` | 15 — Workflows & User Journeys | `FR-FLOW-<nnn>` | FR-FLOW-001–046 |
| `BR` | 16 — Business Rules Catalog | `BR-<nnn>` (catalogue index, no new `FR-BR-*`) | BR-001–085 |
| `DATA` | 17 — Data Expectations | `FR-DATA-<nnn>` | FR-DATA-001–039 |
| `UI` | 18 — UI / Screen Definitions | `FR-UI-<nnn>` | FR-UI-001–064 |
| `NFR` | 19 — Non-Functional Requirements | `NFR-<nnn>` (Volume-wide scheme, not chapter-coded `FR-`) | NFR-001–060 |
| `VAL` | 20 — Acceptance & Validation | `FR-VAL-<nnn>` | FR-VAL-001–045 |
| `OQ` | 21 — Open Questions / Decisions Log | `FR-OQ-<nnn>` (chapter's own FRs); `OQ-<CODE>-<n>` (restated, Volume-wide, 118 total); `DEC-<nnn>` (Closed Decisions Log) | FR-OQ-001–006; OQ-* across 18 chapter codes; DEC-001–022 |
| `APP` | 22 — Appendices (this chapter) | `FR-APP-<nnn>` | FR-APP-001–006 |

Cross-cutting schemes (§0.6), not chapter-scoped: `AC-<FR-ID>-<n>` (Given/When/Then acceptance criteria, ~135 across the Volume), `EC-<CODE>-<n>` (edge cases, one set per DRAFTED chapter from Ch.8 onward), `NO-<CODE>-<n>` (per-chapter hard non-goals, one set per DRAFTED chapter).

### 22.3 Appendix C — Related documents index

Documents this Volume cross-references rather than duplicates, per §0.4's Precedence rule. All paths confirmed to exist under `docs/` at this revision.

**Architecture / tech-stack ADRs**

| Document | What it governs | Cited by |
| --- | --- | --- |
| `docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md` | 9-layer platform vocabulary, per-layer build status, canonical 12-agent directory/naming (source of DEC-008). | Ch.0 §0.4, Ch.4, Ch.7 |
| `docs/ADR_TECH_STACK_MODERNIZATION.md` | Keep / Add-later (named trigger) / Avoid-now infrastructure split (DEC-010); pgvector-before-Qdrant (DEC-011). | Ch.0 §0.4, Ch.4, Ch.6, Ch.19 |

**Disease module / clinical governance specs**

| Document | What it governs | Cited by |
| --- | --- | --- |
| `docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md` | 9 Diabetes intelligence areas, module boundary, HITL gates, v0/v1/v2 phasing (DEC-009). | Ch.0 §0.4, Ch.8, Ch.9 |
| `docs/CONTINUOUS_LEARNING.md` | The governed continuous-learning loop this Volume's Ch.14 describes at product-requirement level. | Ch.0 §0.4, Ch.14 |
| `docs/GOVERNED_MODEL_RELEASE_SOP.md` | G-ML-1/2/3 gate sequence (source of the G-ML glossary entry, §22.1). | Ch.0 §0.4, Ch.5, Ch.14 |
| `docs/AGENT_EVAL_HARNESS.md` | Golden-case scorecard scope (SYNTHESIS/GUARDIAN/HORIZON only — 3 of 12 agents). | Ch.20 |
| `docs/HAZARD_LOG_TEMPLATE.md` | Hazard entries H-011/H-012, recorded Unsigned as of Ch.14's drafting. | Ch.14 |
| `docs/RESEARCH_EVALUATION_BOUNDARY.md` | The one-directional, offline research-export boundary Ch.13 elevates into requirement form. | Ch.12, Ch.13 |

**Build-state / traceability**

| Document | What it governs | Cited by |
| --- | --- | --- |
| `docs/BUILT_VS_REMAINING_AUDIT.md` | Track A GO / Track B NO-GO honest build-state split (DEC-020). | Ch.0 §0.4, Ch.1, Ch.20 |
| `docs/QA_TRACEABILITY_MATRIX.md` | The platform's only existing traceability artefact, pre-Volume-I `REQ-<nnn>` scheme (re-keying left open as `OQ-VAL-1`). | Ch.20, Ch.21 |
| `docs/PRODUCT_AUDIT_AND_ROADMAP.md`, `docs/HOW_TO_BUILD_AKSH_HEALTH.md` | Historical/engineering narrative docs this Volume supersedes for requirement purposes (not requirements documents themselves). | Ch.0 §0.1 |

**Evidence pack** (`docs/evidence-pack/`, 16 artefacts + `README.md` + 3 gate checklists — the binding pilot-readiness bar per DEC-021)

| Document | Note |
| --- | --- |
| `docs/evidence-pack/README.md` | Index of all 16 artefacts. |
| `docs/evidence-pack/gate-1-platform-readiness.md`, `gate-2-clinical-safety.md`, `gate-3-pilot-authority.md` | The three partner-facing readiness gates Ch.20 §20.6 adopts rather than redefines. |
| `docs/evidence-pack/08-security-pen-test.md`, `docs/evidence-pack/12-disaster-recovery.md` | Dated **GAP** placeholders — no external pen test or DR drill has been run (Ch.19). |

**Internal engineering tooling — explicitly out of scope for this Volume**

- `/workspace` and its `/review/ops`-style sub-tree, raised as `OQ-UI-7` (Ch.18) asking whether a future appendix should inventory it. This appendix does **not** do so — Ch.18's own `NO-UI-7` excludes it as not persona-facing, and this chapter does not reopen that exclusion. `OQ-UI-7` remains open for a future revision, not resolved here.

### 22.4 Appendix D — Agent rename map

Restates DEC-008 (Ch.21 §21.9) as a standalone lookup table, for readers who only need the mapping.

| Canonical name (use in product copy / this Volume) | Legacy internal id (code only — never product-facing) | Agent type |
| --- | --- | --- |
| HORIZON | `ORACLE` | Predictive Risk Agent |
| COMPASS | `EQUITY` | Population Health Agent |
| PATHWAY | `REFERRAL` | Care Coordination Agent |

Legacy ids remain in code as internal ids, environment variable names, and API route segments (FR-AGT-003) — this Volume does not require a code rename, only that product-facing copy and specification text use the canonical name via `resolveClinicalAgentLabel`/`formatAgentTimelineLabel`.

### 22.5 Appendix E — Hard constraints one-pager

Pointers only — the full statement of each constraint lives at its cited origin (Ch.16 §16.1 or Ch.21 §21.9). Restating any constraint's text here would duplicate, not index, per this chapter's own scope.

**The eight top-priority constraints (Ch.16 §16.1):** HITL mandatoriness (BR-001) · no auto-prescribe (BR-027) · no auto EHR write (BR-043/059/081) · `liveEmis:false` (BR-076) · `autoRetrain:false` (BR-068) · no fake certification (BR-040) · Insulin/GLP-1 `null`-type locks (BR-034) · patient no-stop-insulin rule (BR-056/044).

**The full Closed Decisions Log:** `DEC-001`–`022`, Ch.21 §21.9 — 14 of the 22 are tagged `HARD` there. Any future chapter, feature, or Cursor-directed implementation that appears to conflict with a `HARD`-tagged entry must be corrected before proceeding, per §0.4's Precedence rule; it is escalated as an open question, never silently resolved by narrowing scope.

**For the full business-rule catalogue** (all 85 entries, 12 categories): Ch.16. **For the full decision register with origins:** Ch.21 §21.9.

### 22.6 Appendix F — How Cursor (or any engineering agent) should use this Volume

Extends §0.3, which remains the primary statement of this rule; this appendix adds the lookup path this chapter provides.

1. **Find the right requirement fast.** Use Appendix B to locate a requirement's chapter by its `FR-<CODE>` prefix, then go to that chapter for the full Purpose/Inputs/Outputs/Triggers/AC block. Do not implement from an id alone without reading its home chapter's AC block (§0.3).
2. **Implement from FR + AC, not from a chapter's prose summary.** A Given/When/Then AC block (`AC-<FR-ID>-<n>`) is the implementation-ready unit; the chapter's narrative Purpose/Responsibilities text is context, not a spec substitute.
3. **Never violate a hard constraint.** Check Appendix E / Ch.16 §16.1 / Ch.21 §21.9 before implementing anything touching HITL, EHR writes, model retraining, or a `null`-typed medication field. A hard constraint cannot be relaxed by an engineering agent's own judgment — only by the separately-governed process its own origin names (§0.4).
4. **Escalate, don't resolve, an open question.** If implementation requires an answer to an `OQ-*` id (Ch.21), that is a stop-and-ask signal, not a judgment call for the implementing agent — restating Ch.21 §21.10's closure rule (only specific named roles may close a question, and never by shipping code that silently assumes an answer).
5. **Scope implementation to one chapter/requirement/AC block at a time.** Per §0.3, never "implement Volume I" wholesale — reference the specific `FR-*`/`AC-*` id(s) being built.
6. **Treat every honesty field as a contract, not a suggestion.** `liveEmis`, `autoRetrain`/`autoRetrainTriggered`, `physiologicalTwin`, `ehrWrite`, `hitlRequired`, `productionRbacEnforced`, and any `dataSource`/`mode`/`insufficient_data`/`null` disclosure field named in a chapter must remain literal and honest in any new code — restating this Volume's own drafting discipline (visible throughout, named explicitly from Ch.9 onward) as an implementation rule.
7. **Where a chapter defers to an ADR/spec (§0.4, Appendix C), read that document too.** A chapter's own text deliberately does not duplicate the ADR's "how" detail.

### 22.7 Appendix G — Document change control / how to propose amendments

Restates and consolidates §0.5 (chapter status model) and Ch.21 §21.10 (decision-closure mechanism) as this Volume's one amendment path — this appendix does not introduce a second, competing process.

- **Editing this file.** This Markdown file is the source of truth (§0.3); any amendment is made here directly, in place, and recorded in the Revision History (§0.7) with a version bump. A `.docx` export is a downstream artefact and is never edited independently (§0.3) — an amendment made to a `.docx` copy and not reflected here does not count as an amendment.
- **Adding or changing a requirement.** New `FR-*`/`NFR-*`/`BR-*`/`AC-*`/`OQ-*` ids follow the next-sequential-number rule under their chapter's existing prefix (§0.6, restated at Ch.21 FR-OQ-004) — never renumbered or reused once a chapter has reached DRAFTED and been reviewed at least once (§0.6, DEC-022). A requirement being dropped is marked `DEPRECATED` in place, never deleted.
- **Proposing an answer to an open question.** Follow Ch.21 §21.10's role-gated closure rule: Product-only-owned questions close on a documented Product decision; any question whose Owner list includes Clinical Safety Lead/Clinical Lead, Architecture (for permission-matrix/tenant-isolation/data-model/Tech-Stack-ADR-trigger questions), or Compliance/DPO/Legal may not be closed without that role's dated sign-off. A closed question becomes a new `DEC-<nnn>` (Ch.21 §21.9) and every linked/duplicate `OQ-*` id in its cluster (Ch.21 §21.8) is marked `Closed → DEC-<nnn>` in place.
- **Moving a chapter from DRAFTED to Accepted.** Per Ch.21 §21.10's proposed (not yet ratified) mechanism: Product, Architecture, and Clinical Safety Lead each record a dated sign-off (name, role, chapter, version) against that specific chapter version, in a future `docs/volume-i/SIGNOFF_LOG.md` — all three required before the TOC status line may read **[Accepted]**. As of this revision, no chapter carries this status; this Volume's draft-complete status (§22.0) is not a form of sign-off.
- **Adding a new chapter or a Volume II.** Out of scope for this appendix to define — Product owns that decision, and this Volume does not draft, outline, or number Volume II content pre-emptively (§22.9).

### 22.8 Appendix H — Demo credentials & seed-data pointer

No credential value is reprinted in this Volume (FR-APP-004). For the platform's existing demo/pilot login and cohort-seeding documentation, see:

- `docs/DEMO_LAUNCH_CREDENTIALS.md` — demo account access.
- `docs/DEMO_COHORT_SEED.md` — the synthetic patient cohort seeding this Volume's chapters describe as "the platform's actual 100-patient synthetic cohort" (restating Ch.10 §10.2's Track A data-scale finding).

Both remain engineering/operations documents, not part of this Volume's requirement content — restating §0.1's boundary that this Volume is a requirements document, not an operations runbook.

### 22.9 Non-goals

- **NO-APP-1.** This chapter does not introduce a new functional requirement, business rule, non-functional requirement, or acceptance criterion that governs product behavior — its 6 `FR-APP-*` entries govern only this chapter's own construction (table format, citation discipline), not the platform.
- **NO-APP-2.** This chapter does not resolve, answer, or close any of the 118 open questions Chapter 21 restates, including `OQ-UI-7` (whether the internal `/workspace` tooling gets its own screen inventory here) — it records that question as still open, per Ch.18's own `NO-UI-7` exclusion, rather than deciding it.
- **NO-APP-3.** This chapter does not grant **Accepted** status to itself or to any other chapter — restating Ch.21 NO-OQ-3's boundary. Draft-complete (all 22 chapters DRAFTED) is not Accepted; the TOC and document Status line reflect this distinction exactly (FR-APP-006).
- **NO-APP-4.** This chapter does not draft, outline, number, or speculate on Volume II's scope or content. Volume I's completion (§22.0) is a milestone for Volume I only; what a Volume II would cover, if one exists, is a future Product decision this chapter does not pre-empt.
- **NO-APP-5.** This chapter does not produce a `.docx` export, a signed sign-off log, or any artefact beyond this Markdown file — per §0.3, an export is a separate downstream step, performed later, never generated as a byproduct of a chapter draft.
- **NO-APP-6.** This chapter does not reprint the full text of any business rule (Ch.16), decision (Ch.21 §21.9), or acceptance criterion — every appendix is an index or a pointer table, consistent with this Volume's own scoping note for this chapter (Ch.21 §0.7 v0.20) and this chapter's own Purpose (§22.0).

### 22.10 Cross-references

- Chapters 0–21 — the origin of every glossary term (Appendix A), id range (Appendix B), and cited decision (Appendix E) in this chapter; this chapter adds an index, not new content, to any of them.
- Ch.21 §21.9 (Closed Decisions Log) and §21.10 (decision process) — the source this chapter's Appendix E and Appendix G restate as pointers.
- Ch.16 §16.1 (top-priority quick reference) — the source of Appendix E's eight-constraint list.
- Ch.18 `OQ-UI-7` / `NO-UI-7` — the still-open question about the internal tooling inventory this appendix explicitly declines to resolve (§22.3, NO-APP-2).
- `docs/` — every path cited in Appendix C, confirmed to exist at this revision.

---

## 27. What this turn does not do

For clarity to anyone picking up this document next:

- This turn **drafts Chapter 22 (Appendices)** — the Volume's final chapter — and, in doing so, **completes Volume I: all 22 chapters are now [DRAFTED].** Chapter 22 is deliberately light and reference-only, per Chapter 21's own recommendation (§0.7 v0.20): a glossary (Appendix A), a requirement-ID prefix index (Appendix B), a related-documents index (Appendix C), the agent rename map (Appendix D), a hard-constraints pointer page (Appendix E), guidance for engineering agents including Cursor (Appendix F), the document change-control/amendment process (Appendix G), and a demo-credentials/seed-data pointer with no credential values reprinted (Appendix H) — built entirely by cross-referencing Chapters 0–21 and the existing `docs/` tree, introducing no new functional requirement, business rule, or open-question answer of its own (`NO-APP-1`–`6`). Draft-complete is **not** the same as Accepted: no chapter in this Volume has been reviewed or signed off (§0.5, §21.10 remains `Proposed`), and this turn does not change that. Part A (Chapters 1–5), Part B (Chapters 6–7), Part C (Chapters 8–9), Part D (Chapters 10–14), Part E (Chapters 15–18), and Part F (Chapters 19–22) are all drafted and complete — 22 of 22 chapters.
- This turn does **not** answer, close, or re-decide a single one of the 118 open questions it consolidates. Chapter 21 (Open Questions & Decisions Log) is a light-read, grep-heavy indexing pass over every `OQ-<CODE>-<n>` id already raised in Chapters 3–20: it restates each one's existing Owner, adds a Blocks/Priority/Status classification, groups them by this Volume's own Part A–F structure (§21.2–§21.7), and flags 14 clusters (§21.8) where multiple chapter-scoped ids restate one underlying decision (most prominently the minimum-cell suppression threshold, appearing as `OQ-ARC-2`/`OQ-POP-1`/`OQ-BR-3`/`OQ-DATA-3`) without collapsing or renumbering any of them. It separately registers 22 decisions already made elsewhere in this Volume or a named ADR/spec as a Closed Decisions Log (§21.9, `DEC-001`–`022`) — including HITL mandatoriness, CONDUCTOR's deliberately-deterministic (not LangGraph-style) control flow, `liveEmis:false`, `autoRetrain:false`, Diabetes-as-9-typed-signals-not-9-agents, the HORIZON/COMPASS/PATHWAY rename map, the Tech Stack ADR's Keep/Add-later/Avoid-now split, and WCAG 2.1 AA — each cited back to its origin, not authored here. It proposes, without executing or ratifying, an interim chapter-acceptance sign-off mechanism (§21.10) answering §0.5's standing "mechanism TBD" note and Chapter 20's `OQ-VAL-4`, recorded as `Proposed` rather than `Closed`. No file under `lib/`, `app/`, or `components/` is created or modified by this chapter.
- This turn does **not** claim any part of the platform is newly tested, certified, or hardened by virtue of Chapter 20 being drafted. Chapter 20 is a documentation-only acceptance framework: it names the seven validation levels and test commands that already exist (`test:clinical-proof`'s 29 chained suites, `test:workflow`, `test:e2e`, `eval:agents`, the manual CSO review step, and the Gate 1–3 partner checklists), states a binding traceability rule without re-keying the existing `docs/QA_TRACEABILITY_MATRIX.md`'s pre-Volume-I `REQ-<nnn>` ids into this Volume's `FR-*` scheme (left as OQ-VAL-1), and records — as a new, concrete finding — that no test in `tests/` imports any of the 9 Diabetes signal-builder files under `lib/disease-modules/diabetes/`, restating Chapter 8's "v1 wiring not started" at the test-coverage layer rather than closing that gap. It adopts, rather than redefines, `docs/BUILT_VS_REMAINING_AUDIT.md`'s existing Track A "GO WITH LIGHT POLISH" / Track B "NO-GO by design" split as its own binding Demo-GO/Live-NHS-EMR-NO-GO criteria (§20.6), and the existing 16-artefact evidence pack (§20.7) as the binding evidence structure — it does not define a competing readiness bar, per Chapter 1's SC-8 instruction. 7 non-goals (`NO-VAL-1`–`7`) state explicitly that this chapter does not itself run any test suite, does not claim regulatory certification, and does not perform the still-unrun penetration test or disaster-recovery drill.
- This turn does **not** invent numeric SLA/SLO figures that no test or evidence artefact backs. Chapter 19 (Non-Functional Requirements) carries 60 non-functional requirements (`NFR-001`–`060`), each tagged **[MEASURED]** (backed by a real test or dated evidence-pack artefact — e.g. `lib/clinical-proof/perf-slos.ts`'s three smoke SLOs, `e2e/accessibility.spec.ts`'s 2-route axe-core check), **[ASPIRATIONAL — NEEDS BASELINE]** (a legitimate target with no current measurement, e.g. production-scale performance, LLM-on latency, a formal uptime SLA), **[PROCESS GATE — NOT YET EVIDENCED]** (a required assurance step whose evidence-pack artefact is a dated GAP placeholder today — the external security penetration test and the Neon/Vercel disaster-recovery drill are both explicitly unrun), or left untagged where it restates a behavioural fail-safe rule already enforced in code (Chapter 5's HITL fail-safe mechanics, Chapter 14's `autoRetrainTriggered:false`). It resolves Chapter 18's OQ-UI-6 by naming WCAG 2.1 AA as the platform's binding accessibility conformance target (NFR-041), while stating plainly that full-catalogue conformance across all 59 Chapter 18 screens is unaudited beyond the 2 routes the existing axe-core check covers (NFR-042/043). It does not mandate any Tech-Stack-ADR "Avoid now" component (ClickHouse, a dedicated APM platform, Redis, Kafka, Temporal) without naming that ADR's own trigger, and does not conduct or report the results of a load test, penetration test, or disaster-recovery drill itself — 7 non-goals (`NO-NFR-1`–`7`) record each of these boundaries explicitly, alongside 5 edge cases and 7 open questions.
- This turn does **not** produce a Figma file, wireframe, or visual mockup of any screen, and does not redesign the existing Clinical Signal brand or visual design system. Chapter 18 (UI / Screen Definitions) states behavioural requirements only — what a screen must show and do — grounded in a fresh read of the `app/` route tree: a 59-screen catalogue (§18.2–§18.11) across the `SCR-AUTH`, `SCR-ONB`, `SCR-GP`, `SCR-NUR`, `SCR-PHM`, `SCR-ADM`, `SCR-ICS`, `SCR-HOSP`, `SCR-PAT`, `SCR-RES`, `SCR-DIAB`, and `SCR-TWIN` areas, each rated an honest Exists (47) / Partial (9) / Missing (3). It corrects Chapter 12's own three-surface framing of the GP experience to four once `/dashboard/gp/review-queue` is catalogued as a materially distinct fourth screen (FR-UI-062), without softening Chapter 12's underlying finding that no single unified clinician workspace exists today. It restates, rather than re-derives, Chapter 3's personas, Chapter 5's gate mechanics, Chapter 9's twin honesty fields, Chapter 11's patient no-dose-change rule, Chapter 12's workspace findings, and Chapter 17's entity catalogue wherever a screen displays one of those entities' fields. It explicitly excludes (NO-UI-7) the internal engineering/demo-readiness tooling at `/workspace` and its `/review/ops`-style sub-tree, since none of Chapter 3's 8 product personas uses that tooling in the course of their own job. No file under `lib/`, `app/`, or `components/` is created or modified by Chapter 18.
- This turn does **not** design a physical database schema, invent a live SNOMED/ICD-10/LOINC/RxNorm terminology server, fix specific data-retention periods, or add a `glucose` modality in code. Chapter 17 §17.1–§17.2 states a product-level entity catalogue and a four-tier sensitivity/retention classification; §17.3 states the diabetes glucose/CGM modality gap as an open, required data-contract decision (OQ-DATA-1) rather than resolving or implementing it; §17.8's seven non-goals record each of these boundaries explicitly. No file under `lib/`, `app/`, or `components/` is created or modified by Chapter 17, consistent with every other chapter in this Volume.
- This turn does **not** derive any new business rule from first principles. Every one of Chapter 16's 85 `BR-<nnn>` entries traces to an existing `FR-*`/`NO-*` id (or, for a small number of previously prose-only constraints, the specific section this pass first promotes to a formal id, flagged as such in OQ-BR-1) — this chapter's contribution is the index and the cross-cutting Priority/Enforcement/Phase framing, not new requirement content. It also does not resolve any of the six open questions it restates from earlier chapters (OQ-HITL-1/2, OQ-ARC-2/OQ-POP-1, OQ-DIAB-2, OQ-PER-4/OQ-CORE-1, OQ-LEARN-2); it consolidates them at the catalogue level rather than re-deciding them.
- This turn does **not** claim Chapter 15's eight journeys are all equally built. Journey 1 (clinician encounter-to-learning) and Journey 2 (gate-clearing) are labeled `[LIVE]`; Journey 3 (patient consent-to-coaching) and Journey 6 (researcher ethics-to-export) are labeled `[PARTIAL]`; Journey 5 (ICS population intelligence) is labeled `[PARTIAL]` restating Chapter 10's stage-by-stage honesty; Journey 4 (Diabetes future-wired) and Journey 8 (twin what-if) are labeled `[PARTIAL]`/`[FUTURE]` restating Chapter 8's "not started" v1 wiring and Chapter 9's generic (non-diabetes) twin-simulation current state respectively; Journey 7 (demo vs. live identity) states plainly that no live-identity counterpart exists or is requested by this Volume. Chapter 15 §15.3 resolves — as a mechanism, not a new gate type — the out-of-hours crisis-escalation question two prior chapters (Chapter 8's EC-DIAB-5, Chapter 11's OQ-PAT-6) explicitly deferred to it.
- This turn does **not** rewrite, replace, or contradict `docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md`, `docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md`, `docs/ADR_TECH_STACK_MODERNIZATION.md`, `docs/CONTINUOUS_LEARNING.md`, `docs/GOVERNED_MODEL_RELEASE_SOP.md`, or `docs/BUILD_INSTRUCTIONS_GAP.md` — it cross-references and elevates them into product-requirement form per §0.4 and each chapter's own closing cross-reference section, without altering their mechanics. Chapter 8 in particular restates all 6 of the Diabetes spec's open questions verbatim (as `OQ-DIAB-1`–`6`) rather than pre-empting any of them.
- This turn does **not** claim any diabetes-specific "what if" scenario (lose weight, start GLP-1, increase protein, reduce carbs, improve sleep, stop insulin, walk after meals) exists as working code. Chapter 9 §9.2 states plainly that `lib/precision-health/twin-simulation.ts` is the only twin-related code that exists today, that it is disease-agnostic and heart-failure-flavoured, and that every scenario in §9.5 is a requirement for future work, not a description of current behavior.
- This turn does **not** claim the ICS/Population dashboard performs live population aggregation. Chapter 10 §10.2 states plainly that `lib/mock-data/population.ts`'s ICS-scale fixture (47,832 patients) is a separately-authored illustrative dataset disconnected from the platform's actual 100-patient synthetic cohort, that the "live" Neo4j path reads pre-seeded literal graph properties rather than computing a live aggregation, and that the Segment/Predict/Monitor/Learn stages of Chapter 10's own five-stage framing do not exist in real, computed form today — only Recommend (via COMPASS) produces genuinely derived output.
- This turn does **not** claim Patient Intelligence covers the product vision's full nine-capability set. Chapter 11 §11.2 rates each capability honestly: Coach/Education/Wearables/Medication-views/Lifestyle are **Partial** (schema- or draft-only, not personalized, and — for Lifestyle — missing the patient-facing submission surface entirely); Gamification, Goals, and Family have **no code representation of any kind**; Voice has none on the patient-facing side specifically (VOICE and VOICE CARE, both already specified in Chapter 7, are clinician/nurse-facing, not patient-facing). Chapter 11 §11.7 also states an absolute, non-phased rule — restating Chapter 8's and Chapter 9's type-level locks — that no patient-facing surface may ever accept a medication self-prescribe, dose-change, or stop-insulin request.
- This turn does **not** claim the Clinical Intelligence workspace vision (Timeline → Evidence → Agents → Approvals → Care Plan → Twin → Risk → Research, all in one place) is already delivered as a single unified surface. Chapter 12 §12.2 states plainly that the GP persona's experience today is composed across **three separate surfaces** (`/dashboard/gp`, `/dashboard/gp/patients/[id]`, and `/review`/`/cases/[id]`) with no single shell linking all of them, that Evidence and the Validation Dossier are separate pages rather than in-context panels, and that Research has **no live workspace entry point at all** — only an offline, one-directional data-export boundary (`docs/RESEARCH_EVALUATION_BOUNDARY.md`) pending ATLAS being scoped (Phase 2, not built). Chapter 12 also records that the Nurse and Pharmacist workspaces are materially narrower than the GP's, by design, not by omission.
- This turn does **not** claim Research Intelligence covers the product vision's six Owkin-inspired capability areas. Chapter 13 §13.3 rates each honestly: Literature Intelligence, Trial Matching, and Scientific Writer have **no code representation of any kind**; Cohort Builder is a static, illustrative KPI display with no interactive filtering or query capability; Biomarker Discovery's only namesake code (`lib/precision-health/biomarkers.ts`) is explicitly labeled, in its own header comment, as a display formatter and "not a biomarker derivation engine"; Hypothesis Generator has nothing at the cohort/research level (the existing `CausalHypothesisPanel` is a distinct, single-patient, clinician-facing stub, Chapter 12). It records the evaluation harness (§13.4) and the federated-research ethics gate (§13.5) as the two genuinely-implemented parts of this layer — both with real, confirmed SHIELD audit writes — and flags a new architecture observation (OQ-RES-1) that the research-evaluation endpoint's role check is implemented locally rather than through the canonical permission matrix.
- This turn does **not** claim the continuous-learning loop is an "auto-improving AI." Chapter 14 §14.1 maps the product vision's eleven-stage flywheel onto delivered mechanism and finds the six stages from Clinician through Validation genuinely built and durable (append-only learning events with `autoRetrainTriggered`/`modelUpdated`/`ehrWrite` hard-coded as literal `FALSE` SQL constants at the database-insert level, not just an application default; a golden-case eval harness explicitly labeled a rehearsal scorecard, not a certificate; a governed-evaluation recorder that blocks any `propose_model_update` unless all three G-ML gates are signed) — while the three "Improve Agents / Improve Twin / Improve Disease Models" stages are recorded as a defined, unit-tested *process* with **no demonstrated release history**: no agent version, twin rule-weight, or disease-module model has actually been bumped through the gate sequence in this build. Chapter 14 also restates, as an honest current-state finding, that hazard-log entries H-011 and H-012 remain **Unsigned**.
- This turn does **not** invent or imply any regulatory certification. Every DPIA/CSO/DCB0129/MHRA reference restates existing literal `false` honesty fields already in the codebase — none are claimed as obtained.
- This turn does **not** re-litigate the Tech Stack ADR. Chapter 4 and Chapter 6 (§6.5) explicitly defer every backend/data-store/event-bus/vector-store/terminology-service decision to `docs/ADR_TECH_STACK_MODERNIZATION.md` rather than re-arguing NestJS/Kafka/Temporal/Qdrant/pgvector/ClickHouse; Chapter 7 (§7.1, FR-AGT-001/002) restates the same for a LangGraph-style dynamic agent planner — CONDUCTOR's deterministic control flow is a deliberate, restated choice, not an oversight.
- This turn does **not** claim a live coded-terminology server (SNOMED/ICD-10/LOINC/RxNorm), a vector/embedding store, an HL7v2 feed, or a pharmacy adapter exist — Chapter 6 §6.4/§6.5 record each as **Missing**, phase-gated on a named future trigger, per the instruction not to invent infrastructure that isn't present. Chapter 7 restates the terminology point specifically for Dr.Assist (§7.2.9, FR-AGT-026).
- This turn does **not** claim PRISM or ATLAS are built — Chapter 7 §7.2.13 restates them as Phase 2 / `live: false`, matching the agent directory in code exactly.
- This turn does **not** claim the Diabetes module is wired into HORIZON/GUARDIAN, nor that a real (physiological) Diabetes Twin exists — Chapter 8 §8.3 records v1 wiring as **not started** (every signal builder is still a v0 stub returning `insufficient_data`/`null`) and Chapter 9 §9.2/§9.4/NO-TWIN-1 explicitly place a physiological twin out of scope for this Volume, gated behind three named preconditions (FR-TWIN-015) that are not yet met.
- This turn does **not** implement any code. No file under `lib/`, `app/`, or `components/` is created or modified by this document. It does, however, note observations about current build state (Chapter 4 §4.3.3's Diabetes v0 stubs; Chapter 6 §6.1's permission-matrix scope; Chapter 7 §7.4's unwired disease-module integration point; Chapter 8 §8.3's phase-by-phase status table; Chapter 9 §9.2's twin-simulation.ts current-behavior restatement; Chapter 10 §10.2's population-fixture/live-aggregation gap; Chapter 11 §11.2's nine-capability honest baseline table) — these are observations, not changes made by this document.
- This turn does **not** claim Volume I is complete, nor that any described mechanism is fully hardened for production/pilot use — open questions (Chapter 3 §3.7, Chapter 4 §4.10, Chapter 5 §5.10, Chapter 6 §6.7, Chapter 7 §7.8, Chapter 8 §8.11 — 7 questions, Chapter 9 §9.11 — 7 questions, Chapter 10 §10.14 — 7 questions, Chapter 11 §11.14 — 7 questions, Chapter 12 §12.9 — 7 questions, Chapter 13 §13.9 — 7 questions, Chapter 14 §14.11 — 7 questions) are recorded as such, not resolved by assertion.

**Depth note:** Chapter 8 remains the most detailed chapter in the Volume to date: 58 functional requirements (`FR-DIAB-001`–`058`), 7 hard non-goals (`NO-DIAB-1`–`7`), 19 acceptance criteria, 5 edge cases, and 7 open questions. Chapter 9 (completing Part C) carries 38 functional requirements, 7 non-goals, 5 acceptance criteria, 5 edge cases, and 7 open questions. Chapter 10, opening Part D, carries 38 functional requirements (`FR-POP-001`–`038`), 7 hard non-goals (`NO-POP-1`–`7`), 7 Given/When/Then acceptance criteria across its five-stage Segment→Predict→Recommend→Monitor→Learn framing, 5 edge cases, and 7 open questions (one restated verbatim from Chapter 4's OQ-ARC-2, six new). Chapter 11 carries 42 functional requirements (`FR-PAT-001`–`042`), 7 hard non-goals (`NO-PAT-1`–`7`), 6 Given/When/Then acceptance criteria, 5 edge cases, and 7 open questions — its defining feature is the honest nine-capability baseline table (§11.2) rating Coach/Education/Wearables/Medication-views/Lifestyle as Partial and Gamification/Goals/Family as having no code representation at all, and an absolute, non-phased rule (NO-PAT-1) that no patient-facing surface may ever accept a medication self-prescribe/dose-change/stop-insulin request. Chapter 12 carries 35 functional requirements (`FR-CLIN-001`–`035`), 7 hard non-goals (`NO-CLIN-1`–`7`), 2 Given/When/Then acceptance criteria, 5 edge cases, and 7 open questions — its defining feature is the honest eight-panel baseline table (§12.2) finding that the vision's single unified clinician workspace is delivered today across **three separate, not-fully-linked surfaces** (the GP dashboard, the patient-detail precision-health page, and the generic `/review`/`/cases/[id]` case workflow), with Evidence and the Validation Dossier as separate pages rather than in-context panels, Research with no live workspace entry point at all (an offline, one-directional export boundary only), and the Nurse/Pharmacist workspaces materially narrower than the GP's by design. Chapter 13, carries 35 functional requirements (`FR-RES-001`–`035`), 7 hard non-goals (`NO-RES-1`–`7`), 6 Given/When/Then acceptance criteria, 5 edge cases, and 7 open questions — its defining feature is the honest six-capability baseline (§13.3) finding that Literature Intelligence, Trial Matching, and Scientific Writer have no code representation at all, Cohort Builder is a static display rather than an interactive builder, and Biomarker Discovery's only namesake code is an explicit non-discovery display formatter, while the evaluation harness (§13.4) and the federated-research ethics gate (§13.5) are confirmed as genuinely SHIELD-audited today — the most built-out parts of this layer. Chapter 14, completing Part D, carries 36 functional requirements (`FR-LEARN-001`–`036`), 7 hard non-goals (`NO-LEARN-1`–`7`), 6 Given/When/Then acceptance criteria, 5 edge cases, and 7 open questions — its defining feature is the eleven-stage flywheel mapping (§14.1) finding that the six stages from Clinician through Validation are real and durable (append-only learning events with honesty fields hard-coded as literal SQL constants, not just an application default) while the three "Improve Agents / Improve Twin / Improve Disease Models" stages are a defined, unit-tested gate *process* (G-ML-1/2/3) with no demonstrated release history in this build, and that hazard-log entries H-011/H-012 remain Unsigned. Chapter 15, opening Part E, carries 46 functional requirements (`FR-FLOW-001`–`046`), 7 hard non-goals (`NO-FLOW-1`–`7`), 16 Given/When/Then acceptance criteria (two per journey), 6 edge cases, and 7 open questions across its eight journeys — its defining feature is the per-journey current-state honesty label (`[LIVE]`/`[PARTIAL]`/`[FUTURE]`, §15.1) applied on top of, not instead of, each underlying chapter's own status, plus the resolution (§15.3) of two prior chapters' explicitly-deferred out-of-hours escalation question. Chapter 16, continuing Part E, carries 85 catalogued business rules (`BR-001`–`085`) across 12 categories, no new functional requirements of its own (every entry cross-references an existing `FR-*`/`NO-*`), a top-priority quick-reference table (§16.1) of the 8 hardest constraints, a binding conflict-resolution rule set (§16.3, 5 items), and 8 open questions (§16.4) — its defining feature is being the first chapter in the Volume whose "requirements" are entirely restatements-with-an-index rather than newly-derived FRs, deliberately, per its own Purpose statement (§16.0). Chapter 17, continuing Part E, carries 39 functional requirements (`FR-DATA-001`–`039`), 7 hard non-goals (`NO-DATA-1`–`7`), 5 edge cases, and 7 open questions — its defining feature is the 11-entity product-level data dictionary (§17.2: Patient, Encounter/Case, ConsentGrant, ClinicalDraft, GateDecision, LearningEvent, ShieldAuditEvent, PopulationAggregate, Diabetes signal/reading, TwinScenarioResult, ResearchExport), each entity classified into one of four sensitivity/retention tiers (§17.1) and cross-referenced back to the specific `FR-*`/`BR-*` its field-level contract restates, plus the plainly-stated finding that no glucose/CGM modality exists in the platform's modality enum today — the clearest open data-contract gap in the Volume, recorded as OQ-DATA-1 rather than resolved by this chapter. Chapter 18, completing Part E, carries 64 functional requirements (`FR-UI-001`–`064`), 7 hard non-goals (`NO-UI-1`–`7`), 5 edge cases, and 7 open questions — its defining feature is the 59-screen catalogue (§18.2–§18.11) spanning every one of Chapter 3's 8 personas' actual routes, each rated an honest Exists (47) / Partial (9) / Missing (3), plus the correction (FR-UI-062) that Chapter 12's three-surface GP-workspace finding is, once the standalone review-queue screen is catalogued separately, actually four surfaces today, and the chapter's single most absolute rule (FR-UI-061) that no control ever rendered within a `patient`-role session may submit a medication dose-change, self-prescribe, or cessation request regardless of which persona's screen the underlying shared component appears on.

Chapter 19 (Non-Functional Requirements), opening Part F (Quality & Governance), carries 60 non-functional requirements (`NFR-001`–`060`), 7 hard non-goals (`NO-NFR-1`–`7`), 5 edge cases, and 7 open questions — its defining feature is a three-way honesty tag (`[MEASURED]` / `[ASPIRATIONAL — NEEDS BASELINE]` / `[PROCESS GATE — NOT YET EVIDENCED]`) applied to every quantitative claim, grounded in real repository artefacts rather than invented figures: the three existing perf-smoke SLOs (`lib/clinical-proof/perf-slos.ts`, soft/hard TTFB, agent-draft, and review-action targets), the 2-route axe-core accessibility check (`e2e/accessibility.spec.ts`), and two evidence-pack GAP placeholders (`08-security-pen-test.md`, `12-disaster-recovery.md`) honestly stating that no external penetration test or disaster-recovery drill has been run. It resolves Chapter 18's OQ-UI-6 by naming WCAG 2.1 AA as the binding accessibility conformance target (NFR-041) while stating full-catalogue conformance beyond 2 of 59 screens remains unaudited (NFR-042/043), and it restates — rather than re-derives — Chapter 4's fail-safe data-flow table, Chapter 5's HITL gate mechanics, Chapter 6's identity/consent/tenant-isolation requirements, Chapter 7's CONDUCTOR-determinism and no-silent-model-version-change rules, Chapter 14's G-ML-1/2/3 gate sequence and `autoRetrainTriggered:false` guarantee, and Chapter 17's open data-retention question throughout.

Chapter 20 (Acceptance & Validation), completing the second chapter of Part F, carries 45 functional requirements (`FR-VAL-001`–`045`), 6 Given/When/Then acceptance criteria, 7 hard non-goals (`NO-VAL-1`–`7`), 5 edge cases, and 7 open questions — its defining feature is an eleven-area acceptance-suite table (§20.3: HITL, Agents/CONDUCTOR, Diabetes, Twin, Population, Patient, Research, Learning, Journeys, UI, NFRs) naming, per area, exactly which existing suite genuinely exercises it and an honest `PASS`/`PARTIAL`/`GAP` status reusing `docs/QA_TRACEABILITY_MATRIX.md`'s own vocabulary rather than inventing a new one — surfacing, as a new finding, that no test anywhere in `tests/` imports any of the 9 Diabetes signal-builder files, and that the golden-case agent-eval harness scores only 3 of the platform's 12 agents. It defines a seven-level validation hierarchy (Unit → Integration → E2E → Clinical-proof → Agent eval → Manual clinical safety review → Partner gate), a binding traceability rule that leaves the existing traceability matrix's pre-Volume-I `REQ-<nnn>` re-keying as explicit open work (OQ-VAL-1) rather than performing it, a Definition-of-Done checklist for Cursor-delivered changes, and Demo-GO/Live-NHS-EMR-NO-GO criteria that adopt — rather than redefine — `docs/BUILT_VS_REMAINING_AUDIT.md`'s existing Track A/B split and the evidence-pack's Gate 1–3 checklists, per Chapter 1 SC-8's binding instruction not to define a competing readiness bar.

Chapter 21 (Open Questions & Decisions Log), continuing Part F, carries 6 functional requirements (`FR-OQ-001`–`006`) and 6 hard non-goals (`NO-OQ-1`–`6`) of its own — its defining feature is that, unlike every prior chapter, it derives none of its content from a fresh code read: it is a pure consolidation pass over the 118 `OQ-*` ids Chapters 3–20 already minted, organized into six Part-scoped master tables (§21.2–§21.7) plus a 14-cluster de-duplication note (§21.8) surfacing that the minimum-cell suppression threshold alone is restated under four different ids (`OQ-ARC-2`/`OQ-POP-1`/`OQ-BR-3`/`OQ-DATA-3`) and the SHIELD audit-write gap under two (`OQ-HITL-2`/`OQ-BR-2`), plus two more chapters citing the same fix. Its second half is a 22-entry Closed Decisions Log (§21.9, `DEC-001`–`022`) registering every hard, already-made decision this Volume and its governing ADRs carry — from HITL mandatoriness and the `liveEmis:false`/`autoRetrain:false` literal guarantees, through the deliberate CONDUCTOR-not-LangGraph and Diabetes-as-9-signals-not-9-agents architecture choices, to the Tech Stack ADR's Keep/Add-later/Avoid-now split and the WCAG 2.1 AA conformance target — each a pointer to its existing origin, never a new ruling. It proposes, but does not ratify, a three-role (Product/Architecture/Clinical Safety Lead) chapter-acceptance sign-off mechanism (§21.10) as an answer to `OQ-VAL-4` and §0.5's long-standing "mechanism TBD" note.

Chapter 22 (Appendices), completing Part F and the Volume in full, carries 6 functional requirements (`FR-APP-001`–`006`) and 6 hard non-goals (`NO-APP-1`–`6`) governing only this chapter's own construction — its defining feature is that, unlike every other chapter, it authors no new product content at all: Appendix A glossaries ~30 terms back to their origin chapter, Appendix B verifies (by grep, not estimate) the exact `FR-<CODE>` id range drafted per chapter, Appendix C indexes every ADR/spec/evidence-pack/audit document this Volume cites rather than duplicates, and Appendices D–H are short pointer pages (the agent rename map, a hard-constraints one-pager, guidance for engineering agents including Cursor, the amendment process, and a no-credentials-reprinted demo pointer) rather than restatements of any chapter's full text.

**Part F is now complete (Chapters 19–22). Volume I is complete: 22 of 22 chapters are [DRAFTED].** No chapter has been marked **[Accepted]** — that requires the Product/Architecture/Clinical Safety Lead sign-off Chapter 21 §21.10 proposes, which remains `Proposed`, not ratified, as of this revision. The next steps for this Volume, per its own Appendix G (§22.7) and Chapter 21 §21.10, are: (1) chapter-by-chapter Product/Architecture/Clinical Safety Lead review and sign-off; (2) a `.docx` export (§0.3) once review begins, produced from this file and never edited independently of it; and (3) Volume II, whose scope and content are a future Product decision — this Volume does not draft, outline, or speculate on what Volume II should contain.
