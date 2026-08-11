# Aksh Health — Final Product, Architecture and Implementation Specification for Cursor

**Status:** Frozen baseline. This is the primary product and architecture reference for Cursor when making changes to the Aksh Health codebase.
**Related docs:** `docs/AKSH_ARCHITECTURE_GAP_ANALYSIS.md` (codebase-vs-spec mapping), `docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md` (progressive-refactor plan), Volume I historical PRD (`docs/volume-i/VOLUME_I_PRODUCT_REQUIREMENTS.md` — 12-agent vocabulary is historical product vocabulary, not architecture, per §13 and §54 below).

---

## 1. Purpose of this document

This document defines the frozen baseline architecture, product direction, implementation principles, terminology, workflows, safety boundaries and engineering expectations for Aksh Health.

Cursor must treat this document as the primary product and architecture reference when making changes to the Aksh Health codebase.

Do not redesign the fundamental architecture unless explicitly instructed.

Do not introduce new agents, new architectural layers, new AI concepts or new product modules simply because they appear in competitor products, research articles or healthcare AI diagrams.

Any future functionality must map to one or more of these seven permanent areas:

1. Patient State
2. Intelligence
3. Decision
4. Intervention
5. Learning
6. Data and Interoperability
7. Safety and Governance

If a proposed feature cannot clearly map to one of these areas, it should not be introduced into the core architecture without explicit approval.

---

## 2. Aksh Health product definition

Aksh Health is: **a longitudinal Health Intelligence and Care Orchestration Platform** that continuously understands how a patient's health is changing, identifies what requires attention, supports evidence-grounded clinical decisions, coordinates safe interventions, and measures what happens afterwards.

Aksh Health should **not** be represented as primarily any of the following:

- a medical chatbot
- an AI assistant
- a generic clinical LLM
- a collection of autonomous agents
- an EHR replacement
- a digital twin company
- a diabetes application
- a medical scribe
- a diagnostic AI
- a single prediction model

These may exist as **capabilities, integrations or product experiences** within Aksh Health, but none of them is the fundamental identity of the platform. Confusing a capability for the identity of the product is a recurring failure mode this document exists to prevent.

The platform sits between:

- Healthcare Data + Systems of Record
- Specialised Clinical AI
- Clinical Evidence
- Clinicians
- Patients
- Care Workflows

...and creates a continuously evolving understanding of the patient. Aksh Health is the connective tissue between these six surrounding worlds, not a replacement for any one of them.

---

## 3. Core strategic principle

The platform must be designed around the following loop:

```
        ┌────────────────────────────────────────────────────┐
        │                                                      │
        ▼                                                      │
 PATIENT STATE ──▶ INTELLIGENCE ──▶ DECISION ──▶ INTERVENTION ──▶ LEARNING
        ▲                                                       │
        └───────────────────────────────────────────────────────┘
```

Everything in Aksh Health must ultimately support this loop. No feature, screen, service, or "agent" is justified purely on its own merits — it must be justified in terms of which stage(s) of this loop it strengthens.

The permanent operational lifecycle, which is the fine-grained version of the same loop, is:

```
CONNECT → UNDERSTAND → DETECT → REASON → PREDICT → RECOMMEND → DECIDE → ACT → MONITOR → LEARN
```

- **CONNECT** — establish and maintain a consented data source.
- **UNDERSTAND** — build/refresh the patient's current state from available data.
- **DETECT** — identify what has changed, and whether the change matters.
- **REASON** — apply clinical reasoning and evidence to the detected change.
- **PREDICT** — where validated, forecast trajectory or risk.
- **RECOMMEND** — propose an evidence-grounded, safety-checked option.
- **DECIDE** — classify the recommendation into a disposition (Observe/Inform/Recommend/Request Approval/Escalate/Act).
- **ACT** — carry out the disposition, always subject to the human-oversight rules in §16 and §54.
- **MONITOR** — track what happens after the action.
- **LEARN** — feed monitored outcomes back into evaluation and, where governed, improvement.

This lifecycle must remain **consistent across diseases, workflows, AI models and future modules**. A new disease module does not get to invent its own lifecycle; it instantiates this one.

---

## 4. The central architectural rule

**The Patient State is the centre of Aksh Health.** Not the LLM. Not an Agent. Not a Knowledge Graph. Not a Digital Twin. Not a Prediction Model.

Every one of those is a mechanism that reads from, or writes into, Patient State. None of them is allowed to become an alternative, competing notion of "what is true about this patient."

The Patient State is the authoritative computational representation of the answers to:

- What is happening now?
- What happened before?
- What has changed?
- What direction is the patient's health moving?
- What problems currently exist?
- What risks are emerging?
- What treatment is active?
- What goals exist?
- What preferences exist?
- What information is missing?
- What interventions have occurred?
- What were the resulting outcomes?

All intelligence in the system must reason from Patient State whenever possible. If a capability finds itself needing to maintain its own private, parallel notion of patient history to do its job, that is a signal the capability should be reading from (and, where appropriate, contributing to) Patient State instead of forking a shadow copy of the truth.

---

## 5. High-level platform architecture

The platform is organised into conceptual layers. These layers are a **view** over the seven permanent domains (§1) — they are not an eighth thing, and they must not drift out of alignment with the domain boundaries.

```
┌───────────────────────────────────────────────────────────────────────────┐
│ AKSH EXPERIENCE LAYER                                                      │
│  Patient App · Clinician Workspace · Operations/Admin · APIs · Notifications│
└───────────────────────────────────────────────────────────────────────────┘
                                     │
┌───────────────────────────────────────────────────────────────────────────┐
│ CARE ORCHESTRATOR                                                          │
│  Events · Workflow · Task coordination · Human approval · Escalation ·     │
│  Agent/tool coordination                                                   │
└───────────────────────────────────────────────────────────────────────────┘
                                     │
┌───────────────────────────────────────────────────────────────────────────┐
│ PATIENT STATE                                                              │
│  Longitudinal Record · Current/Historical State · Timeline ·               │
│  Change Detection Context · Problems · Risk · Treatment · Goals ·          │
│  Preferences · Missing Information · Health Graph relationships            │
└───────────────────────────────────────────────────────────────────────────┘
                                     │
┌───────────────────────────────────────────────────────────────────────────┐
│ CLINICAL INTELLIGENCE                                                      │
│  Change Detection · Risk Prediction · Clinical Reasoning ·                 │
│  Evidence Retrieval · Personalisation · Intervention Intelligence ·        │
│  Outcome Intelligence · Validated Simulation                               │
└───────────────────────────────────────────────────────────────────────────┘
                                     │
┌───────────────────────────────────────────────────────────────────────────┐
│ DECISION LAYER                                                             │
│  Observe · Inform · Recommend · Request Approval · Escalate · Act          │
└───────────────────────────────────────────────────────────────────────────┘
                                     │
┌───────────────────────────────────────────────────────────────────────────┐
│ INTERVENTION & WORKFLOW                                                    │
│  Care Plans · Medication Workflows · Referral · Patient Engagement ·       │
│  Monitoring · Follow-up · Clinical Tasks                                   │
└───────────────────────────────────────────────────────────────────────────┘
                                     │
┌───────────────────────────────────────────────────────────────────────────┐
│ OUTCOME & LEARNING                                                         │
│  Outcomes · Follow-up Measures · Intervention Results ·                    │
│  Performance Monitoring · Drift Detection · Evaluation ·                   │
│  Governed Improvements                                                     │
└───────────────────────────────────────────────────────────────────────────┘
                                     │
                                     └────────────►  back to PATIENT STATE
```

Layer-to-domain mapping (for anyone tempted to add an "eighth layer"):

| Layer | Primary domain(s) |
|---|---|
| Aksh Experience Layer | Presentation over all seven domains; owns no clinical truth itself |
| Care Orchestrator | Spans Intelligence, Decision, Intervention (orchestration, not a domain of its own) |
| Patient State | Domain 1 |
| Clinical Intelligence | Domain 2 |
| Decision Layer | Domain 3 |
| Intervention & Workflow | Domain 4 |
| Outcome & Learning | Domain 5 |
| (cross-cutting, not a layer) | Domain 6 (Data & Interoperability), Domain 7 (Safety & Governance) |

---

## 6. Cross-cutting architecture

The following concerns span **every** layer and every domain. They are platform concerns, not optional modules bolted onto one layer:

- Safety
- Privacy
- Consent
- Security
- Provenance
- Auditability
- Evidence
- Evaluation
- Observability
- Governance
- Human Oversight
- Access Control
- Model Monitoring
- Data Quality

A new feature that "forgets" one of these (e.g., a new Intelligence component with no provenance, or a new Intervention with no audit entry) is incomplete, regardless of how well its primary function works.

---

## 7. Patient State Engine

The Patient State Engine is the primary backend domain of Aksh Health. Its job is to transform raw health events into meaningful longitudinal context that every other domain can rely on.

At minimum, the Patient State representation includes the following fields (an exact TypeScript schema is not mandatory if the codebase needs a different concrete model — the *principle* is what is frozen: explicitly represent current state, previous state, and change):

```typescript
interface PatientState {
  patientId: string;

  // Identity and stable context
  demographics: Demographics;

  // Structured clinical facts
  currentConditions: Condition[];
  medications: MedicationRecord[];
  biomarkers: BiomarkerReading[];
  observations: Observation[];
  vitals: VitalReading[];
  symptoms: SymptomReport[];
  lifestyle: LifestyleFactor[];
  deviceData: DeviceDataStream[];

  // Derived / computed context
  riskProfile: RiskProfile;
  activeCarePlans: CarePlan[];
  goals: PatientGoal[];
  preferences: PatientPreference[];

  // Longitudinal action history
  interventions: InterventionRecord[];
  outcomes: OutcomeRecord[];

  // Explicit "what we don't know / what still needs attention"
  unresolvedIssues: UnresolvedIssue[];
  missingInformation: MissingInformationItem[];
  alerts: ClinicalAlert[];

  // Summarised, explainable view of the above
  currentSummary: string;
  historicalBaseline: HistoricalBaseline;
  detectedChanges: DetectedChange[];

  // Meta
  confidence: ConfidenceMetadata;
  updatedAt: string; // ISO 8601 timestamp of when this state was last (re)computed
}
```

Notes on the fields:

- **`currentConditions` / `medications` / `biomarkers` / `observations` / `vitals` / `symptoms` / `lifestyle` / `deviceData`** are the structured clinical substrate. Each entry carries its own source, timestamp, and confidence (see §8 and §19's provenance discipline) — Patient State is not a flat "latest value" cache.
- **`riskProfile`** is a derived object populated by Intelligence (Domain 2), never hand-authored.
- **`activeCarePlans` / `goals` / `preferences`** represent the negotiated, patient-specific treatment context — this is what keeps recommendations personalised rather than generic guideline output.
- **`interventions` / `outcomes`** are the append-only longitudinal action/result history — this is what closes the Learning loop (§25, §32).
- **`unresolvedIssues` / `missingInformation`** are first-class, not an afterthought — see §42. A Patient State that looks "complete" because missing data was silently ignored is a safety defect.
- **`alerts`** is the current set of live, unresolved clinical alerts tied to this patient.
- **`currentSummary`** is a human-readable, explainable synthesis — never the source of truth itself, always regenerable from the structured fields.
- **`historicalBaseline` / `detectedChanges`** exist specifically so that "what changed" is a first-class, queryable fact, not something recomputed ad hoc by every consumer (see §10).
- **`confidence`** captures how much the engine trusts the current computed state as a whole (distinct from per-fact confidence) — see §41.
- **`updatedAt`** timestamps the computation, not merely the latest underlying data point, so that consumers can distinguish "stale state" from "state built from stale data."

---

## 8. Longitudinal record

The system must **not** reason only from the latest value of a measurement. Point-in-time reasoning ("HbA1c is 8.4, therefore...") throws away the clinically important part of the picture: trajectory.

The platform must support longitudinal interpretation for (non-exhaustive, extend by the same pattern):

- HbA1c
- Weight
- Blood pressure (BP)
- Continuous glucose monitoring (CGM)
- Renal function
- Lipids
- Medication adherence
- Activity
- Sleep
- Symptoms
- Patient-reported outcomes (PROs)

For each of these, the longitudinal record must expose, at minimum:

- **current** — the latest known value and when it was taken
- **baseline** — the patient's own prior reference point(s), not a population norm
- **change** — the delta between current and baseline, with direction and magnitude
- **trajectory** — the shape of the recent trend (improving / stable / worsening / volatile), not just a two-point delta
- **clinical importance** — whether this specific change, for this specific patient, in this specific context, is clinically meaningful (this is a judgment made by Intelligence/Decision, not inferred by the UI from raw numbers)

---

## 9. Event model

Health data is represented as events wherever practical. Representative (non-exhaustive) event types:

- `LAB_RESULT_RECEIVED`
- `CGM_DATA_RECEIVED`
- `MEDICATION_STARTED` / `MEDICATION_CHANGED` / `MEDICATION_STOPPED` / `MEDICATION_ADHERENCE_REPORTED`
- `PATIENT_REPORTED_SYMPTOM` / `PATIENT_REPORTED_OUTCOME`
- `WEIGHT_UPDATED`
- `BP_UPDATED`
- `CARE_PLAN_UPDATED`
- `APPOINTMENT_COMPLETED`
- `PATIENT_MISSED_FOLLOWUP`
- `RISK_THRESHOLD_CROSSED`
- `CLINICAL_ALERT_CREATED`
- `INTERVENTION_PROPOSED` / `INTERVENTION_ACCEPTED` / `INTERVENTION_REJECTED` / `INTERVENTION_COMPLETED`
- `OUTCOME_RECORDED`

Each significant event **can** trigger the following chain:

```
event → Patient State update → Change detection → Relevant intelligence → Decision policy → Workflow
```

**Not every event should trigger an LLM.** Most events should be handled by deterministic ingestion, storage, and threshold logic; only a minority require language-model judgment (e.g., turning a cluster of events into a natural-language clinician summary). Defaulting every event handler to "call the LLM" is exactly the kind of architectural drift this document exists to prevent — see §12 and §54.

---

## 10. Change Detection Engine

The Change Detection Engine exists to answer, for any longitudinal signal:

- **What** changed?
- **How much** did it change?
- **How rapidly** did it change?
- Is the change **clinically meaningful**?
- Is the change **persistent** (sustained) or a transient blip?
- Is the change **unexpected** given the patient's history and current treatment?
- Are there **interacting changes** (e.g., weight loss + renal decline + medication change occurring together) that individually look unremarkable but together are significant?

This must be built using rules, thresholds, trend analysis, statistical methods, time-series models, established clinical models, and/or traditional ML — whichever is the simplest reliable mechanism for the signal in question (see §12).

**LLMs must not be the primary mechanism for numeric trend detection.** An LLM may narrate a change that a deterministic engine has already detected and quantified; it must not be the thing deciding, from raw numbers, whether HbA1c "really" went up. That is a deterministic computation and must be auditable and reproducible as one.

---

## 11. Clinical Intelligence Layer

The Clinical Intelligence Layer provides a set of **capabilities**. These capabilities do not each need to be an individual "agent" — see §13. The capabilities are:

1. **State Understanding** — synthesising Patient State into a coherent, explainable picture.
2. **Change Detection** — per §10.
3. **Clinical Reasoning** — connecting detected changes and current state to clinical hypotheses and next steps, grounded in evidence (§18).
4. **Risk Prediction** — producing calibrated, explainable risk estimates, using the simplest validated method available (risk calculator, established model, or ML where justified).
5. **Evidence Intelligence** — retrieving and ranking relevant, current clinical evidence (guidelines, literature, protocols) for a given clinical question (§18, §53).
6. **Personalisation** — adapting recommendations to the individual patient's goals, preferences, comorbidities, and history, not just population guidelines.
7. **Intervention Intelligence** — proposing candidate interventions (care plan changes, medication adjustments, referrals, coaching) as drafts for Decision/Intervention, never as direct actions.
8. **Outcome Intelligence** — interpreting recorded outcomes in the context of what was done, to support Learning (§25, §32).
9. **Simulation** — projecting plausible future trajectories, but **only** where the underlying simulation method is scientifically validated for that use case (§24).

---

## 12. Models and tools

The Clinical Intelligence Layer **may** use, as appropriate to the specific capability:

- Large language models (LLMs), including medical-domain LLMs
- Natural language processing (NLP)
- Traditional machine learning (ML)
- Deep learning (DL)
- Time-series models
- Validated clinical risk calculators
- Deterministic rules and guideline logic
- Retrieval-augmented generation (RAG)
- Knowledge graphs (KG)
- Drug-drug and drug-condition interaction checkers
- Imaging models
- Genomics analysis
- CGM-specific analytics
- Classical statistics
- Causal inference methods
- Validated simulation

**Do not assume every capability requires an LLM, an "agent," or a call to OpenAI (or any specific vendor).** The engineering default is: **use the simplest, most reliable, most auditable mechanism that correctly solves the problem.** Reach for an LLM only when the task is genuinely one of natural-language understanding or generation that a deterministic method cannot do (e.g., drafting a SOAP note, summarising a free-text transcript) — not because it is the most exciting option.

---

## 13. Agent architecture

**Correction (product owner, authoritative — supersedes any prior reading of this section that implied collapsing agents into pure Patient-State plumbing):** Patient State being the centre of the platform (§4) is a statement about where clinical truth lives, not a statement that named, specialised agents are unnecessary. The two ideas are complementary, not in tension: **specialised agents operate inside the Intelligence, Decision, Intervention and Learning layers, around a shared Patient State.** Being Patient-State-centric means every agent reads from and writes back to the same Patient State — it does not mean reducing the system to "one record plus a pile of stateless tools."

**Agents remain orchestration components — this means they are load-bearing, not disposable.** An agent is a named, reusable unit of coordination and judgment: it decides what to look at, invokes one or more deterministic services/tools and/or LLM-backed judgment steps, synthesises the result, and returns a draft grounded in Patient State. An agent is not itself a domain, a database, or an audit boundary — but it is also not "just a function call" to be deleted the moment a service could theoretically do part of its job. The distinguishing test (see §13.1) is whether the work is a **single deterministic calculation** (→ service/tool) or a **multi-source investigation or coordination task** (→ agent).

Do **not** delete, merge away, or "flatten into services" an existing named agent that has clear reasoning, coordination, or multi-step workflow responsibility, merely on the grounds that the platform is Patient-State centric. That is a misreading of §4 and is explicitly overridden by this section and by the guardrail in §54.

### 13.1 Agentic Orchestration Layer

The frozen architecture stack, with agents placed explicitly:

```
PATIENT STATE
      │
      ▼
CARE ORCHESTRATOR                (Supervisor/Orchestrator agent — coordinates all of the below)
      │
      ▼
SPECIALISED AGENTS                (Intelligence / Decision / Intervention / Learning judgment
      │                            and coordination — see roster below)
      ▼
TOOLS / MODELS / CLINICAL SERVICES (deterministic calculations: HbA1c trend, CGM time-in-range,
      │                            eGFR, FHIR mapping, SNOMED lookup, drug-interaction check, ...)
      ▼
DECISION  →  INTERVENTION  →  OUTCOME
      │
      └──────────────────────────────────────────────────────────► back to PATIENT STATE
```

Every specialised agent, and every tool/service it calls, reads from and contributes back to the **same** Patient State (§4, §7) — there is no agent-local or tool-local shadow copy of patient truth. This is what "Patient-State centric" actually requires; it says nothing about how many agents may exist.

**How to tell an agent from a service/tool:**

- **Service/tool** — a deterministic or narrowly-specialised calculation with a fixed input→output shape: HbA1c trend computation, CGM time-in-range, eGFR calculation, FHIR resource mapping, SNOMED/terminology lookup, a drug-drug interaction check. No judgment about *what to look at next*; same inputs always produce the same outputs; fully unit-testable (§46).
- **Agent** — an *agentic task*: multi-source investigation, coordination across several services/tools and/or other agents, or a judgment call about what matters and what to do next — e.g. "why is this patient's diabetes control worsening?" (pulls adherence, diet, CGM, medication-change history, and clinical reasoning together), or "coordinate this patient's care plan across referral, medication, and follow-up." If the task requires deciding *which* facts are relevant, *how* to weigh them, or *what to check next*, it is agentic work, not a single deterministic call.

**Illustrative roster of specialised agents** (not exhaustive, not fixed for all time, and — per the correction above — **not a list to be pruned down to "just Orchestrator + Observer" for the sake of minimalism**). Each is placed in the layer(s) where it primarily operates; all operate against shared Patient State:

| Agent | Primary layer(s) | Role |
|---|---|---|
| Supervisor / Care Orchestrator | Care Orchestrator (spans all layers) | Top-level coordination of which agents/tools run for a given trigger (§14) |
| Observer / Validator | Safety & Governance (cross-cutting) | Independent safety/quality check over agent and tool outputs before they reach Decision (§17) |
| Intake | Patient State / Data capture | Structured and conversational data capture into Patient State |
| Triage | Intelligence + Decision | Determines urgency/routing for a new finding or presentation |
| Scheduling | Intervention / Workflow | Coordinates appointment and follow-up logistics |
| Follow-up | Intervention + Learning | Tracks whether a planned action happened and what resulted |
| Ambient Documentation | Experience / Data capture | Converts consultation audio/notes into structured, provenance-tagged documentation |
| Population Health | Intelligence / Analytics | Cohort-level pattern and disparity analysis (later-stage) |
| Predictive | Intelligence | Risk/trajectory forecasting grounded in validated methods |
| Digital Twin | Advanced Intelligence / Simulation | Validated simulation of a specific physiological process (§23–24; later-stage) |
| Equity & Access | Decision / Safety / Care coordination | Surfaces access, disparity, and equity considerations into Decision |
| Clinical Reasoning | Intelligence | Connects findings to clinical hypotheses and options (§11.3) |
| Evidence | Intelligence | Retrieves and ranks grounding evidence for a recommendation (§11.5, §53) |
| Care Planning | Decision / Intervention | Turns an accepted recommendation into a structured plan |
| Patient Engagement | Intervention / Learning | Patient-facing communication, education, and coaching drafts |

This roster is a **superset-compatible view**: it must remain reconcilable with whatever named agents already exist in the codebase (see `docs/AKSH_ARCHITECTURE_GAP_ANALYSIS.md` for the concrete current-codebase mapping and the per-agent Keep/Convert verdicts). Reconciling naming across product vocabulary, this roster, and the codebase is a naming exercise, not a licence to delete working agents.

**Avoid creating new narrow, per-signal agents** such as a "Medication Agent," "Lab Agent," "Glucose Agent," "Weight Agent," "Kidney Agent," "Sleep Agent," "Imaging Agent," "Nutrition Agent," "BP Agent," or "Exercise Agent" **unless there is a strong, specific reason to do so.** In the overwhelming majority of cases, these are better implemented as services, models, tools, functions, APIs, or rules invoked by the agents above (per the service/tool test in this section). This guidance restricts *creating new* narrow agents going forward — it is not retroactive licence to delete or collapse existing, already-useful named agents; see the correction at the top of this section and the guardrail in §54.

---

## 14. Aksh Orchestrator

The Aksh Orchestrator determines, for a given trigger (typically an event from §9):

- **What happened** — the factual content of the trigger.
- **Which capability/tools** are relevant to interpret and respond to it.
- **What information is missing** before a safe, well-grounded response can be produced.
- **What reasoning, evidence, or prediction** is needed.
- Whether **human review** is required before anything proceeds further.
- What **workflow** (if any) should be initiated.
- Whether **escalation** is warranted.

### Example: HbA1c deterioration flow

```
1. LAB_RESULT_RECEIVED (HbA1c = 8.4%, prior = 7.1%)
2. Patient State updated with new biomarker reading
3. Change Detection Engine: +1.3 points over 3 months → significant, persistent, unexpected
     given current metformin + lifestyle plan
4. Aksh Orchestrator determines:
     - Capability needed: Risk Prediction, Clinical Reasoning, Evidence Intelligence
     - Missing information: recent medication adherence, recent diet/activity changes
     - Human review: required (this is a material deterioration)
5. Clinical Intelligence produces a draft ClinicalRecommendation (see §18) with
   evidence, confidence, and a SafetyAssessment (see §17)
6. Decision Layer classifies the recommendation as REQUEST_APPROVAL (see §16)
7. Recommendation is queued for clinician review in the Clinician Workspace (§28-29)
8. Clinician accepts, edits, or rejects
9. If accepted: Intervention is created (e.g., medication titration proposal,
   diabetes education referral) and written back to Patient State
10. Outcome & Learning domain begins monitoring for the relevant follow-up signal
    (e.g., next HbA1c, adherence reports)
```

This example is the canonical proof-of-loop story referenced in §26-27 and §56.

---

## 15. Decision Layer

The Decision Layer is **architecturally separate from the Intelligence Layer.** Intelligence proposes; Decision disposes. A Decision Layer output is a classification of what should happen next, not a fresh piece of clinical reasoning.

```typescript
type DecisionType =
  | "OBSERVE"
  | "INFORM"
  | "RECOMMEND"
  | "REQUEST_APPROVAL"
  | "ESCALATE"
  | "ACT";
```

The Decision Layer takes Intelligence output, current Patient State, and applicable policy (safety thresholds, escalation rules, consent/permission constraints) and produces exactly one `DecisionType` per recommendation, plus the routing and priority that follow from it.

---

## 16. Meaning of each decision

- **OBSERVE** — Note the finding in Patient State's context; no action, no notification. Used for signals that are within expected variation and require no one's attention right now, but should remain part of the longitudinal record.
- **INFORM** — Surface the finding to a relevant human (clinician and/or patient, depending on context) as informational context. No action is requested; nothing is queued for approval.
- **RECOMMEND** — Present a specific, evidence-grounded option to a clinician as a suggestion the clinician can choose to pursue at their own initiative. Lower urgency than REQUEST_APPROVAL; not queued as a pending decision requiring disposition.
- **REQUEST_APPROVAL** — A specific proposed action exists and is queued for explicit human Accept/Edit/Reject before anything happens. This is the default disposition for anything that would change a patient's active care.
- **ESCALATE** — The finding requires urgent human attention sooner than the normal review cadence — routed with higher priority and, where configured, additional notification channels.
- **ACT** — The disposition that authorises an action to proceed. **Act is not autonomous diagnosis, autonomous prescribing, or autonomous treatment unless governance explicitly allows it for that specific, narrowly-scoped action type.** In the current governance state, "Act" outputs still flow through the human-oversight rules in §54 (HITL is mandatory for every clinical-facing draft) — there is no blanket exemption for "Act"-classified items.

---

## 17. Safety Control Plane

The Safety Control Plane wraps **every** clinical intelligence operation. It is not a single gate at the end of a pipeline; it is checked continuously.

Checks include, at minimum:

- Contraindications
- Drug-drug and drug-condition interactions
- Allergies
- Red flags (clinical presentations that always warrant urgent attention regardless of the primary workflow)
- Dangerous values (values outside physiologically plausible or immediately dangerous ranges)
- Missing critical information (a recommendation that depends on a fact the system does not actually have)
- Uncertainty (the system's own confidence is too low to proceed without a human)
- Conflicting evidence or outputs (two intelligence components disagree)
- Out-of-distribution (OOD) inputs (the case looks unlike the data the relevant model/method was validated on)
- Unsupported recommendations (a recommendation not backed by retrievable evidence, per §18)
- Guideline mismatch (a recommendation that deviates from applicable clinical guidelines without an explicit, surfaced rationale)
- Escalation triggers
- Whether human approval is required

```typescript
interface SafetyAssessment {
  contraindications: ContraindicationFinding[];
  interactions: InteractionFinding[];
  allergies: AllergyFinding[];
  redFlags: RedFlagFinding[];
  dangerousValues: DangerousValueFinding[];
  missingCriticalInfo: MissingInformationItem[];
  uncertainty: UncertaintyAssessment;
  conflictingEvidence: ConflictFinding[];
  outOfDistribution: boolean;
  unsupportedRecommendation: boolean;
  guidelineMismatch: GuidelineMismatchFinding[];
  requiresEscalation: boolean;
  requiresHumanApproval: boolean;
  overallSafetyStatus: "CLEAR" | "CAUTION" | "BLOCKED";
}
```

Any `SafetyAssessment` with `overallSafetyStatus !== "CLEAR"` must prevent the associated recommendation from reaching `ACT` without explicit human review, regardless of what `DecisionType` Intelligence/Decision would otherwise have assigned.

---

## 18. Evidence and provenance

Every clinical output must be explainable. This is enforced by requiring every recommendation to carry its evidence and provenance as first-class structured data, not as an afterthought in free text.

```typescript
interface ClinicalRecommendation {
  id: string;
  decisionType: DecisionType;
  summary: string;

  // Grounding
  evidence: EvidenceReference[];          // external clinical evidence (guidelines, literature)
  patientEvidence: PatientEvidenceRef[];  // the specific Patient State facts that led here

  // Honesty about certainty
  confidence: number;                     // 0..1, calibrated where possible
  uncertainty: UncertaintyAssessment;

  // Optionality
  alternatives: AlternativeOption[];      // other reasonable options considered and why not chosen

  // Safety
  safety: SafetyAssessment;

  // Governance
  requiresApproval: boolean;

  createdAt: string;
  sourceCapability: string;               // which Intelligence capability/agent produced this
  modelVersion?: string;                  // stamped whenever an LLM or ML model contributed
}
```

A recommendation without `evidence`, or without a non-empty `patientEvidence`, is not a valid `ClinicalRecommendation` — it is an unverifiable assertion and must not be surfaced as a recommendation.

---

## 19. Health Graph

The Health Graph is a **relationship-support** structure. It is not the primary patient datastore, and it is not a replacement for Patient State.

The recommended pattern is a combination of:

- a relational/clinical store for structured clinical facts,
- a longitudinal event store for the raw event history (§9),
- FHIR-shaped resources for interoperability (§20), and
- a graph store **specifically where relationships between entities add real analytical or reasoning value** (e.g., condition–medication–biomarker interaction networks, care-team relationships, referral chains).

The Health Graph should be treated as one more read/write surface that ultimately serves and is served by Patient State — never as a competing source of truth about "what is true about this patient."

---

## 20. FHIR and interoperability

FHIR is the platform's core interoperability layer for exchanging clinical data with external systems (EHRs, registries, device platforms). Representative FHIR resource types relevant to Aksh Health include Patient, Condition, MedicationRequest/MedicationStatement, Observation, DiagnosticReport, CarePlan, Encounter, AllergyIntolerance, and Provenance — used as the *exchange* shape, not necessarily the *internal* shape.

The intended data flow direction is:

```
External system (FHIR) → Aksh clinical domain model → Patient State → UI / API
```

**Do not force FHIR into UI models.** FHIR resources are excellent for interoperability and terrible for direct UI binding (deeply nested, resource-oriented, verbose). The internal Aksh clinical model exists specifically to translate FHIR's interoperability shape into a shape suited to Patient State and to product surfaces, and back again on the way out.

---

## 21. Terminology layer

Clinical terminology (SNOMED CT, LOINC, ICD, medication coding systems such as dm+d/RxNorm) must be handled through a dedicated terminology layer that performs **concept matching**, not raw string comparison. "Type 2 diabetes mellitus" and "T2DM" and a SNOMED code for the same concept must resolve to one canonical concept before any downstream reasoning (change detection, risk prediction, interaction checking) is applied to it. String-matching clinical terms is a correctness and safety defect, not a shortcut.

---

## 22. OMOP

OMOP Common Data Model mapping is a **later-stage capability**, intended for population-level analytics and research use cases. It is explicitly **not** the operational Patient State model and must not be adopted as such. Introducing OMOP into the live, per-patient operational path before the platform's population/research needs justify it would be exactly the kind of premature architectural complexity this document is written to prevent.

---

## 23. Digital Twin

"Digital Twin" is, at most, an **advanced capability** within the platform — not the platform's primary marketing identity, and not a claim to be made lightly.

A Digital Twin claim, if made at all, must refer to a **validated computational representation of specific, defined aspects** of a patient's physiology or health trajectory (e.g., a validated glucose-insulin dynamics model for a defined patient population). **Do not claim, imply, or architect toward "an entire human body simulation."** Any Digital Twin capability inherits all the constraints of §24 (Simulation) and §54 (no fabricated maturity).

---

## 24. Simulation

Simulation capabilities live **within the Intelligence and Decision layers only**, and **only where the underlying simulation method is scientifically validated** for the specific use case and population being simulated.

Simulation output must always be presented as **trajectories with explicit confidence, assumptions, and uncertainty** — never as certain futures. A simulated projection is a hypothesis to inform a human decision, not a prediction to be acted on automatically.

---

## 25. Continuous learning

The Learning domain observes outcomes continuously:

```
Outcomes → Evaluation → Review → Revalidation → Controlled release
```

Every stage above requires an explicit human governance step before its output can affect production behaviour. **This is NOT automatic production retraining from outcomes.** A model, prompt, or policy that silently updates itself based on observed outcomes is a governance failure, regardless of how good its intentions or measured performance appear to be. See §32 and §54 for the concrete, non-negotiable form of this rule (`autoRetrain: false`, always).

---

## 26. Diabetes V1

Diabetes is the first complete vertical.

The goal is not to build every diabetes feature.

The goal is to prove the Aksh loop.

Initial data:

- Patient demographics
- Type 2 diabetes diagnosis
- HbA1c
- Blood glucose
- CGM if available
- Weight
- BMI
- Blood pressure
- Renal function
- Lipids
- Medication
- Medication adherence
- Activity
- Nutrition
- Sleep
- Symptoms
- Smoking
- Relevant comorbidities
- Patient goals

---

## 27. Diabetes V1 workflow

Example:

```
New HbA1c result: 8.4%
↓
FHIR Observation ingested
↓
Patient State Engine updates patient
↓
Longitudinal history retrieved
Previous:
6.7 → 7.1 → 7.6 → 8.4
↓
Change Detection
Significant deterioration detected
↓
Context gathered
Weight ↑
Activity ↓
Adherence uncertain
CGM TIR ↓
Renal function changing
↓
Clinical Intelligence
Possible contributors evaluated
↓
Risk models
Complication risk assessed
↓
Evidence Intelligence
Relevant guideline information retrieved
↓
Intervention Intelligence
Possible care options generated
↓
Safety Control Plane
Contraindications
Interactions
Missing data
Red flags
Uncertainty
↓
Decision Layer
REQUEST_APPROVAL
↓
Clinician Workspace
Review explanation
Review evidence
Review patient context
Review options
↓
Clinician
Accept
Modify
Reject
Escalate
↓
Approved workflow begins
↓
Patient receives plan
↓
Monitoring continues
↓
Outcome evaluated
↓
Patient State updated
```

This is the core Aksh demonstration.

---

## 28. Clinician workspace

Do not design the clinician experience around chat alone.

The clinician dashboard should prioritise:

- **Patient Snapshot** — Current clinical state, Active conditions, Current therapy, Major risks
- **What Changed** — HbA1c ↑, Weight ↑, CGM TIR ↓, Activity ↓, Renal function ↓
- **Why It Matters** — Explain clinical relevance.
- **Risk** — current risk, risk direction, risk drivers
- **Explanation** — Why Aksh generated the insight.
- **Evidence** — Evidence supporting the reasoning.
- **Options** — Possible actions.
- **Safety** — contraindications, interactions, missing information, uncertainty
- **Decision** — Accept, Modify, Reject, Escalate
- **Follow-up** — What happens next?

---

## 29. Clinician UI principle

The UI should use progressive disclosure.

Do not initially show:

- 20 models
- 12 agents
- 100 evidence objects
- full reasoning traces
- FHIR payloads

Show:

- What happened?
- Why does it matter?
- What should I look at?
- What evidence supports it?
- What are my options?

Allow deeper inspection when required.

---

## 30. Patient application

The patient experience should also not revolve entirely around chat.

Recommended areas:

- **My Health Today** — Current summary.
- **What Changed** — Changes from baseline.
- **What Matters** — Prioritised information.
- **My Plan** — Approved care plan.
- **My Progress** — Longitudinal trends.
- **Medications** — Current medication and adherence support.
- **Measurements** — glucose, weight, BP, activity, sleep
- **Check-ins** — Structured questions.
- **Ask Aksh** — Conversational explanation.
- **Upcoming** — appointments, tests, medication, follow-up, tasks

---

## 31. Patient-facing safety

Patient-facing AI must distinguish:

- Education
- Explanation
- Guidance based on approved plan
- Monitoring support
- Clinical recommendation
- Urgent escalation

Do not allow general conversational AI to silently produce unapproved treatment recommendations.

---

## 32. Learning layer

Every intervention should define:

- desired outcome
- measurement
- measurement date
- follow-up window
- success criteria
- failure criteria

Example:

- Intervention: approved diabetes care-plan update
- Primary outcome: HbA1c
- Secondary: CGM time-in-range
- Behavioural: medication adherence
- Follow-up: 12 weeks

Then: baseline → intervention → follow-up → outcome → effectiveness

This closes the loop.

---

## 33. Metrics

The MVP should measure product, clinical and safety performance.

- **Workflow metrics:** time from abnormal signal to review; time from review to intervention; unresolved follow-up tasks; clinician workload; workflow completion
- **Intelligence metrics:** signal sensitivity; signal precision; risk model discrimination; false positives; false negatives; evidence retrieval quality
- **Clinician metrics:** recommendation acceptance; modification rate; rejection rate; time saved; trust; reason-for-rejection
- **Patient metrics:** engagement; adherence; follow-up completion; measurement completion
- **Clinical metrics depending on workflow:** HbA1c; CGM time-in-range; hypoglycaemia; weight; BP; renal markers
- **Safety metrics:** unsafe recommendations; missed escalations; false escalations; interaction detection; critical-data omissions; safety block rate

---

## 34. Observability

Every AI workflow should be observable.

Log:

- request
- patient state version
- tools invoked
- models invoked
- evidence retrieved
- recommendation
- safety evaluation
- confidence
- decision
- human response
- outcome
- latency
- cost
- errors

Avoid logging unnecessarily sensitive health information into generic application logs.

Use appropriate privacy controls.

---

## 35. Model registry

Each model or AI capability should have metadata:

```typescript
interface ModelMetadata {
  modelId: string;
  modelType: string;
  version: string;
  purpose: string;
  clinicalUseCase: string;
  intendedPopulation: string;
  validationStatus: string;
  releaseDate: Date;
  limitations: string[];
  owner: string;
  active: boolean;
}
```

Outputs should be traceable to a model version.

---

## 36. Evidence registry

Evidence should also be versioned.

```typescript
interface EvidenceReference {
  id: string;
  title: string;
  source: string;
  version?: string;
  publicationDate?: Date;
  retrievedAt: Date;
  jurisdiction?: string;
  condition?: string;
  strength?: string;
  url?: string;
}
```

Avoid recommendations backed only by LLM pretraining memory.

---

## 37. Role-based access

At minimum:

- Patient
- Clinician
- Care Coordinator
- Clinical Admin
- Organisation Admin
- Clinical Safety Officer
- Platform Admin
- Research / Analytics

Every role must only see appropriate data and functionality.

---

## 38. Consent architecture

Consent must support: data collection, data sharing, device integration, research usage, AI processing, patient communication, third-party integrations

Consent should be: versioned, timestamped, revocable, auditable

---

## 39. Privacy and security

Architect for: encryption at rest, encryption in transit, least privilege, RBAC, audit trails, tenant separation, secret management, PII/PHI controls, data minimisation, retention rules, backup, disaster recovery, incident response

Do not send unnecessary patient data to AI providers.

---

## 40. Human-in-the-loop

HITL is a core architecture principle.

For each capability define:

- Can AI observe?
- Can AI inform?
- Can AI recommend?
- Must clinician approve?
- Can AI execute?
- Under what circumstances?
- What must be escalated?

Avoid one global HITL flag.

Use workflow-specific governance.

---

## 41. Confidence and uncertainty

Aksh should never communicate all outputs as equally certain.

Store and present: confidence, uncertainty, data completeness, evidence strength, model reliability, conflicting signals

Examples: High confidence, Moderate confidence, Low confidence, Insufficient information, Clinical review required

---

## 42. Missing information is a first-class concept

Aksh should identify: Missing renal function, Medication adherence unknown, No recent BP, No CGM data, Unknown allergy status

Sometimes the correct next action is: Acquire more information. Not: Generate a recommendation anyway.

---

## 43. Explainability

Every meaningful insight should answer:

- Why am I seeing this?
- What changed?
- What data contributed?
- What evidence supports it?
- How confident is Aksh?
- What information is missing?
- What should happen next?

---

## 44. Do not expose chain-of-thought

Aksh should generate clinical rationale, not internal model chain-of-thought.

Store and display: structured reasoning summary, supporting observations, evidence, confidence, uncertainty

Do not rely on raw hidden model reasoning for auditability.

---

## 45. Recommended backend domain structure

A possible structure:

```
src/
  patient/
  longitudinal-record/
  patient-state/
  clinical-events/
  observations/
  conditions/
  medications/
  care-plans/
  risk/
  intelligence/
  reasoning/
  evidence/
  decisions/
  interventions/
  outcomes/
  orchestrator/
  safety/
  consent/
  provenance/
  audit/
  fhir/
  terminology/
  graph/
  integrations/
  ai/
  models/
  monitoring/
```

Exact framework structure may vary.

Maintain domain boundaries.

---

## 46. Suggested intelligence service boundaries

- PatientStateService
- ChangeDetectionService
- RiskService
- ClinicalReasoningService
- EvidenceService
- PersonalisationService
- InterventionService
- DecisionService
- SafetyService
- OutcomeService
- OrchestrationService

Before adding a new agent, check whether one of these deterministic services already covers the need — but this is a check against *new* agent sprawl, not a licence to dismantle existing, working agents (§13, §54).

Agents should call these services; they remain the coordination layer that decides which services to call, in what order, and how to weigh the results.

---

## 47. Recommended API thinking

Example:

```
GET /patients/{id}/state
GET /patients/{id}/timeline
GET /patients/{id}/changes
GET /patients/{id}/risks
GET /patients/{id}/recommendations
GET /patients/{id}/care-plan
GET /patients/{id}/outcomes
POST /clinical-events
POST /recommendations/{id}/approve
POST /recommendations/{id}/modify
POST /recommendations/{id}/reject
POST /recommendations/{id}/escalate
```

Do not necessarily implement all immediately.

---

## 48. Recommended database concepts

Core entities may include:

patients, clinical_events, observations, conditions, medications, patient_state_versions, state_changes, risks, recommendations, evidence_refs, safety_assessments, decisions, interventions, care_plans, outcomes, goals, consents, provenance, model_runs, model_registry, audit_events

Prefer versioning where clinical history matters.

Avoid destructive overwrites of clinically relevant state.

---

## 49. Patient State versioning

Important.

Each significant state update should support historical reconstruction.

Example: Patient State v124, v125, v126

A recommendation should reference: `patientStateVersion = 126`

Therefore clinicians can later understand: What information did Aksh know when this recommendation was generated?

---

## 50. Recommendation lifecycle

Recommendations should have states:

DRAFT, GENERATED, SAFETY_REVIEWED, AWAITING_APPROVAL, APPROVED, MODIFIED, REJECTED, ESCALATED, EXECUTED, MONITORING, COMPLETED

This is important for traceability.

---

## 51. Intervention lifecycle

Likewise:

PLANNED, AUTHORISED, STARTED, IN_PROGRESS, COMPLETED, CANCELLED, FAILED, OUTCOME_PENDING, OUTCOME_RECORDED

---

## 52. Architecture for external models

External models should sit behind abstraction layers.

```typescript
interface ClinicalModelProvider {
  predict(input: ClinicalModelInput): Promise<ClinicalModelOutput>;
}
```

Then providers might be: OpenAI, Anthropic, Google, local model, specialist medical AI, custom ML

Do not tightly couple clinical workflows to a single model provider.

---

## 53. RAG architecture

RAG should support evidence grounding.

```
Clinical question → Context preparation → Patient state + Evidence retrieval → Relevant evidence → Reasoning model → Structured recommendation → Safety checks
```

Evidence and patient information must remain distinguishable.

---

## 54. Guardrails for Cursor

When modifying the application, Cursor should follow these rules.

- Do not create duplicate concepts — Before creating a new module ask: Does Patient State already cover this? Does Intelligence already cover this? Does Decision already cover this? Does Safety already cover this?
- Do not create unnecessary *new* agents where an existing agent, service, tool, or rule already covers the capability (§13).
- **Do not remove or collapse existing Aksh agents simply because the platform is Patient-State centric.** Preserve named agents that have clear reasoning, coordination or workflow responsibilities. Reclassify deterministic functions as services/tools, and require all agents to operate against shared Patient State, provenance, safety and decision policies (§13, §13.1).
- Do not move clinical truth into the frontend.
- Do not make LLM responses the database.
- Do not make AI-generated text the authoritative patient state.
- Do not bypass safety checks.
- Do not bypass clinician approval.
- Do not automatically retrain production models.
- Do not store recommendations without provenance.
- Do not perform destructive edits to longitudinal clinical history.

---

## 55. MVP priority

Build in this order.

- **Phase 1 — Patient State Foundation:** patient, clinical timeline, FHIR ingestion, observations, conditions, medications, patient-state model, patient-state summarisation, change detection
- **Phase 2 — Diabetes Intelligence:** HbA1c trends, weight trends, BP, renal function, CGM, medication context, risk, clinical alerts
- **Phase 3 — Evidence and Reasoning:** evidence retrieval, clinical explanations, structured recommendations, confidence, missing information
- **Phase 4 — Decision and Safety:** decision types, safety rules, approval workflow, escalation, audit
- **Phase 5 — Intervention:** care-plan workflow, patient tasks, monitoring, follow-up, communication
- **Phase 6 — Outcome Learning:** outcomes, intervention effectiveness, patient-state feedback, performance evaluation
- **Phase 7 — Advanced Intelligence (Later):** Digital Twin, causal modelling, simulation, genomics, advanced multimodal reasoning, population intelligence

---

## 56. First MVP outcome

The first MVP should demonstrate one complete story:

A patient's diabetes control begins deteriorating. Aksh detects the change, understands the broader patient context, identifies plausible contributors and risks, retrieves relevant evidence, creates a safe clinician-reviewed recommendation, coordinates the resulting intervention, monitors what happens and updates the patient's state.

If we cannot demonstrate this end to end, adding more AI capabilities does not improve the MVP.

---

## 57. Final product principle for Cursor

Use this when deciding whether to implement something:

- Does this help Aksh understand the patient?
- Does it help detect meaningful change?
- Does it improve clinical intelligence?
- Does it improve a decision?
- Does it coordinate care?
- Does it measure an outcome?
- Does it improve safety?
- Does it improve interoperability?

If the answer to all eight questions is no, reconsider the feature.

---

## 58. Permanent architecture

Cursor should treat the following as frozen unless explicitly instructed otherwise:

```
PATIENT STATE → INTELLIGENCE → DECISION → INTERVENTION → LEARNING ↺
```

supported horizontally by: DATA, INTEROPERABILITY, SAFETY, PRIVACY, CONSENT, PROVENANCE, SECURITY, EVALUATION, OBSERVABILITY, GOVERNANCE, HUMAN OVERSIGHT

And governed by the permanent lifecycle:

```
CONNECT → UNDERSTAND → DETECT → REASON → PREDICT → RECOMMEND → DECIDE → ACT → MONITOR → LEARN
```

---

## 59. Final internal product philosophy

Don't just collect patient data. Build patient context.

Don't just identify abnormalities. Understand change.

Don't just predict disease. Understand trajectory and risk.

Don't just generate AI answers. Ground intelligence in patient data and evidence.

Don't just generate recommendations. Support governed clinical decisions.

Don't just support decisions. Turn approved decisions into coordinated workflows.

Don't stop when the intervention begins. Measure whether it worked.

Then update Aksh's understanding of the patient and continue the cycle.

That is Aksh Health.
