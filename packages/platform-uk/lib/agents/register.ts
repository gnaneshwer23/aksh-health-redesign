/**
 * The agent register: one contract per agent, and the loop they form with the clinician in it. Source: Volume I PRD
 * Ch.5 (human review) and Ch.7 (agent platform, FR-AGT-001…038), journey FLOW-JRN-1, and the July 2026 naming
 * reference. CONDUCTOR reads its review order from here (lib/clinical-proof/agent-orchestration.ts), and
 * tests/agent-register.test.ts fails when a contract is incomplete, evidence is missing, or the code and the register
 * disagree. Product names are for the app and sales material; the public website describes functions, not names.
 *
 * Status follows lib/status/capabilities.ts: no agent runs on real patients in production. Agents run in simulation
 * (the clinical-proof site) until their release criteria are met.
 */
import type { CapabilityStatus } from "../status/capabilities";
import type { HumanGateId, ReviewQueueItemType } from "../types";

export type AgentId =
  | "CONDUCTOR"
  | "VOICE"
  | "CANVAS"
  | "SYNTHESIS"
  | "DrASSIST"
  | "GUARDIAN"
  | "HORIZON"
  | "NEXUS"
  | "PATHWAY"
  | "BRIDGE"
  | "SHIELD"
  | "COMPASS"
  | "PRISM"
  | "ATLAS";

/** Where an agent sits in the loop (FLOW-JRN-1): intake → drafts → clinician → coordination → staging → audit → learning. */
export type LoopStage = "orchestrate" | "intake" | "draft" | "safety" | "risk" | "correlate" | "code" | "coordinate" | "stage" | "audit" | "population" | "imaging" | "research";

/** When an agent runs. */
export type Trigger =
  | "case_run" // CONDUCTOR starts a case run
  | "conductor_parallel" // run by CONDUCTOR, in parallel, against one shared patient context
  | "conductor_after" // run by CONDUCTOR after the parallel set
  | "intake_session" // a clinician starts dictated or typed intake
  | "after_note_and_codes_accepted" // PATHWAY: only once the note and codes are accepted (FR-AGT-024)
  | "after_case_accepted" // BRIDGE: only after the case is accepted (FR-AGT-030)
  | "every_event" // SHIELD: every agent run and every decision (FR-AGT-032)
  | "on_request" // COMPASS: a population lead asks for a brief
  | "never"; // Phase 2, not built (FR-AGT-033)

/** Actions no agent may take (lib/agents/contracts/types.ts PROHIBITED_ACTION_PATTERNS uses the same list). */
export const PROHIBITED_FOR_ALL = ["prescribe or change a dose", "finalise a diagnosis", "modify a source record", "send a message to a patient", "write to a live clinical record"] as const;

export type AgentContract = {
  id: AgentId;
  /** Product name (app and sales material). */
  productName: string;
  /** Identifiers still used in code and APIs (FR-AGT-003 keeps them as aliases). */
  legacyIds: string[];
  role: string;
  stage: LoopStage;
  trigger: Trigger;
  /** Sub-capability of another agent (FR-AGT-004), not a peer. */
  partOf?: AgentId;
  inputs: string[];
  outputs: string[];
  /** The review-queue item a clinician decides, when the agent produces one. */
  reviewItem?: ReviewQueueItemType;
  /** Gate beyond item-level accept/edit/reject, when one applies. */
  humanGate?: HumanGateId;
  /** Who reviews the output. */
  reviewer: string;
  /** ENABLE_LLM_<flag> lets it call a model in simulation only (lib/ai/llm-gate.ts); null = rules only. */
  modelFlag: "SYNTHESIS" | "GUARDIAN" | "ORACLE" | "DR_ASSIST" | "NEXUS" | "EQUITY" | null;
  /** Data it may read. */
  reads: string[];
  /** What it must never do, beyond PROHIBITED_FOR_ALL. */
  prohibited: string[];
  /** What happens when it fails. */
  onFailure: string;
  /** Requirement ids in the Volume I PRD. */
  requirements: string[];
  /** Tests that verify the contract. Empty only for planned agents. */
  evidence: string[];
  status: CapabilityStatus;
  environment: "simulation" | "none";
};

const THROWS = "The whole run stops and no partial result is shown (FR-AGT-036/037); the clinician sees an explicit failure.";

export const AGENTS: AgentContract[] = [
  {
    id: "CONDUCTOR",
    productName: "Aksh Orchestrator",
    legacyIds: [],
    role: "Supervisor: runs the agents in a fixed order against one shared patient context, sets priority, review order and safety route, hands drafts to the clinician",
    stage: "orchestrate",
    trigger: "case_run",
    inputs: ["patientId", "transcript (optional)", "proposed drug (optional)", "agent inclusion flags", "timeouts"],
    outputs: ["OrchestrationResult (independent slots per agent)", "queue priority", "review order", "safety route", "one SHIELD event"],
    reviewer: "none of its own; every output is reviewed as a draft",
    modelFlag: null,
    reads: ["patient view (care network: CGM, HbA1c, laboratory results, medicines)", "agent outputs"],
    prohibited: ["decide at runtime which agents to skip on clinical grounds (fixed, deterministic order, FR-AGT-002)", "accept anything on a clinician's behalf"],
    onFailure: THROWS,
    requirements: ["FR-AGT-001", "FR-AGT-002", "FR-AGT-006", "FR-AGT-007", "FR-AGT-008", "FR-AGT-009", "FR-AGT-010", "FR-AGT-011"],
    evidence: ["tests/clinical-proof-orchestration.test.ts", "tests/clinical-spine-phase-c.test.ts", "tests/patient-spine-db.test.ts"],
    status: "in_validation",
    environment: "simulation",
  },
  {
    id: "VOICE",
    productName: "Aksh Voice",
    legacyIds: [],
    partOf: "CANVAS",
    role: "Consultation capture: dictation to a transcript with a confidence score",
    stage: "intake",
    trigger: "intake_session",
    inputs: ["dictated consultation (simulated transcription unless a speech service is configured)"],
    outputs: ["transcript with transcriptConfidence"],
    reviewItem: "voice_transcript",
    reviewer: "the consulting clinician listens back and checks the transcript",
    modelFlag: null,
    reads: ["the consultation audio of the current session only"],
    prohibited: ["present a transcript as ground truth without its confidence (FR-AGT-014)", "send patient audio to a cloud speech service without a governed processor decision"],
    onFailure: "Intake continues as typed input; no transcript is invented.",
    requirements: ["FR-AGT-004", "FR-AGT-014"],
    evidence: ["tests/workflow-scenarios.test.ts"],
    status: "in_validation",
    environment: "simulation",
  },
  {
    id: "CANVAS",
    productName: "Aksh Canvas",
    legacyIds: [],
    role: "Clinical intake: structures the consultation into draft resources with a trace from each value to its source",
    stage: "intake",
    trigger: "intake_session",
    inputs: ["ConsultationInput (transcript, pathway hint, confidence mode)"],
    outputs: ["draft resources", "GenerationTraceItem per inferred field"],
    reviewer: "the consulting clinician",
    modelFlag: null,
    reads: ["the consultation input", "the patient view"],
    prohibited: ["emit an inferred value without its source snippet (FR-AGT-015)"],
    onFailure: "No draft is created; the clinician is told intake failed.",
    requirements: ["FR-AGT-015"],
    evidence: ["tests/export-mapping.test.ts", "tests/workflow-scenarios.test.ts"],
    status: "in_validation",
    environment: "simulation",
  },
  {
    id: "SYNTHESIS",
    productName: "Aksh Synthesis",
    legacyIds: [],
    role: "Clinical documentation: structured consultation note (SOAP) draft",
    stage: "draft",
    trigger: "conductor_parallel",
    inputs: ["transcript", "patient label", "shared patient context"],
    outputs: ["SynthesisDraft (mode llm or deterministic, SOAP fields, safety notes, confidence)"],
    reviewItem: "soap_note",
    reviewer: "clinician: accept, edit or reject",
    modelFlag: "SYNTHESIS",
    reads: ["shared patient context"],
    prohibited: ["claim a note was filed to a record (FR-AGT-012)"],
    onFailure: THROWS,
    requirements: ["FR-AGT-012", "FR-AGT-013"],
    evidence: ["tests/clinical-proof-orchestration.test.ts", "tests/review-decision-db.test.ts"],
    status: "in_validation",
    environment: "simulation",
  },
  {
    id: "DrASSIST",
    productName: "DrAssist AI",
    legacyIds: ["DR_ASSIST"],
    partOf: "SYNTHESIS",
    role: "Coding support and context: SNOMED CT / ICD-10 suggestions with confidence",
    stage: "code",
    trigger: "conductor_after",
    inputs: ["patientId", "known conditions and medicines"],
    outputs: ["DrAssistDraft (codes with system and confidence)"],
    reviewItem: "diagnosis_codes",
    reviewer: "clinician: accept, edit or reject",
    modelFlag: "DR_ASSIST",
    reads: ["shared patient context"],
    prohibited: ["present a suggestion as a terminology-server-confirmed code (FR-AGT-026)", "invent a condition (FR-AGT-027)"],
    onFailure: THROWS,
    requirements: ["FR-AGT-004", "FR-AGT-026", "FR-AGT-027"],
    evidence: ["tests/clinical-proof-orchestration.test.ts"],
    status: "in_validation",
    environment: "simulation",
  },
  {
    id: "GUARDIAN",
    productName: "Aksh Guardian",
    legacyIds: [],
    role: "Medication safety: interactions, allergies and low-glucose risk; the only source of safety urgency",
    stage: "safety",
    trigger: "conductor_parallel",
    inputs: ["patientId", "proposed drug (optional)", "Aksh Diabetes safety notes"],
    outputs: ["GuardianDraft (data source, overall status red/amber/green, interactions, actions)"],
    reviewItem: "guardian_alert",
    humanGate: "medication_decision",
    reviewer: "prescriber (pharmacist or GP) confirms the medication decision",
    modelFlag: "GUARDIAN",
    reads: ["medicines list", "allergies", "knowledge graph or its labelled stand-in"],
    prohibited: ["hide its data source (FR-AGT-016)", "claim an alert was filed (FR-AGT-018)"],
    onFailure: THROWS,
    requirements: ["FR-AGT-016", "FR-AGT-017", "FR-AGT-018"],
    evidence: ["tests/clinical-proof-hitl.test.ts", "tests/clinical-proof-hazard-trace.test.ts", "tests/review-case-decision-db.test.ts"],
    status: "in_validation",
    environment: "simulation",
  },
  {
    id: "HORIZON",
    productName: "Aksh Horizon",
    legacyIds: ["ORACLE"],
    role: "Risk and trajectory: the single composite risk score, with contributing factors (diabetes analysers add factors only)",
    stage: "risk",
    trigger: "conductor_parallel",
    inputs: ["patientId", "Aksh Diabetes contributing factors (glucose, HbA1c, complications from laboratory results)"],
    outputs: ["risk score and band with contributing factors"],
    reviewItem: "oracle_update",
    reviewer: "clinician: accept, edit or reject",
    modelFlag: "ORACLE",
    reads: ["patient view including laboratory results", "knowledge graph or its labelled stand-in"],
    prohibited: ["invent a score, condition or medicine (FR-AGT-019)", "let another agent set a competing composite score (FR-AGT-020)"],
    onFailure: THROWS,
    requirements: ["FR-AGT-019", "FR-AGT-020", "FR-AGT-021"],
    evidence: ["tests/clinical-proof-orchestration.test.ts", "tests/clinical-spine-diabetes.test.ts", "tests/lab-agents.test.ts"],
    status: "in_validation",
    environment: "simulation",
  },
  {
    id: "NEXUS",
    productName: "Aksh Nexus",
    legacyIds: [],
    role: "Clinical correlation: two or three cross-signal links worth considering, always a draft",
    stage: "correlate",
    trigger: "conductor_parallel",
    inputs: ["patientId", "authorised context package"],
    outputs: ["NexusDraft (status draft, correlations)"],
    reviewer: "clinician, as input to their assessment; cannot trigger an action",
    modelFlag: "NEXUS",
    reads: ["supplied conditions, medicines and risk signals only"],
    prohibited: ["return anything but a draft (FR-AGT-022)", "correlate data it was not supplied (FR-AGT-023)"],
    onFailure: THROWS,
    requirements: ["FR-AGT-022", "FR-AGT-023"],
    evidence: ["tests/clinical-proof-orchestration.test.ts", "tests/clinical-spine-phase-c.test.ts"],
    status: "in_validation",
    environment: "simulation",
  },
  {
    id: "PATHWAY",
    productName: "Aksh Pathway",
    legacyIds: ["REFERRAL"],
    role: "Care coordination: referral package once the assessment is accepted",
    stage: "coordinate",
    trigger: "after_note_and_codes_accepted",
    inputs: ["accepted review case (note and codes accepted)", "complication flags"],
    outputs: ["referral package draft", "ServiceRequest in draft status"],
    reviewItem: "referral_package",
    humanGate: "referral_pathway",
    reviewer: "responsible clinician confirms the referral",
    modelFlag: null,
    reads: ["the accepted case"],
    prohibited: ["draft a referral from an unreviewed assessment (FR-AGT-024)", "treat its ServiceRequest as ready without a further accept (FR-AGT-025)"],
    onFailure: "No referral draft is created; the accepted note and codes are unaffected.",
    requirements: ["FR-AGT-024", "FR-AGT-025"],
    evidence: ["tests/intervention-draft-shape.test.ts", "tests/diabetes-decision-escalation.test.ts"],
    status: "in_validation",
    environment: "simulation",
  },
  {
    id: "BRIDGE",
    productName: "Aksh Bridge",
    legacyIds: [],
    role: "Interoperability: stages the accepted case as FHIR R4; never writes to a live record",
    stage: "stage",
    trigger: "after_case_accepted",
    inputs: ["accepted review case"],
    outputs: ["FHIR R4 staging record (liveEmis false, ehrWriteAttempted false)"],
    reviewer: "none; runs only after the clinician's accept",
    modelFlag: null,
    reads: ["the accepted case and its frozen evidence"],
    prohibited: ["stage a draft or rejected case (FR-AGT-030)"],
    onFailure: "The case stays accepted; the staging failure is shown to the reviewer.",
    requirements: ["FR-AGT-030", "FR-AGT-031"],
    evidence: ["tests/demo-launch-d1.test.ts"],
    status: "in_validation",
    environment: "simulation",
  },
  {
    id: "SHIELD",
    productName: "Aksh Shield",
    legacyIds: [],
    role: "Governance and audit: append-only, hash-chained record of every agent run and every decision",
    stage: "audit",
    trigger: "every_event",
    inputs: ["events from every agent and every decision"],
    outputs: ["audit row (who, what, when, version)"],
    reviewer: "clinical safety officer (periodic review)",
    modelFlag: null,
    reads: ["event metadata"],
    prohibited: ["allow an audit row to be edited or deleted"],
    onFailure: "A decision whose audit row cannot be written is rolled back and not recorded.",
    requirements: ["FR-AGT-032"],
    evidence: ["tests/clinical-proof-shield.test.ts", "tests/review-decision-db.test.ts", "tests/review-case-decision-db.test.ts"],
    status: "in_validation",
    environment: "simulation",
  },
  {
    id: "COMPASS",
    productName: "Aksh Compass",
    legacyIds: ["EQUITY"],
    role: "Population health: aggregate disparity brief; never names a patient",
    stage: "population",
    trigger: "on_request",
    inputs: ["organisation or region", "aggregate flags (small cells suppressed)"],
    outputs: ["population brief (summary, priorities, actions)"],
    reviewer: "the requesting population lead",
    modelFlag: "EQUITY",
    reads: ["aggregates only"],
    prohibited: ["include a named or identifiable patient (FR-AGT-028)", "claim write-back to any system (FR-AGT-029)"],
    onFailure: "No brief is produced; nothing is inferred.",
    requirements: ["FR-AGT-028", "FR-AGT-029"],
    evidence: ["tests/api-contracts.test.ts"],
    status: "in_validation",
    environment: "simulation",
  },
  {
    id: "PRISM",
    productName: "Aksh Prism",
    legacyIds: [],
    role: "Imaging intelligence (Phase 2)",
    stage: "imaging",
    trigger: "never",
    inputs: [],
    outputs: [],
    reviewer: "not applicable",
    modelFlag: null,
    reads: [],
    prohibited: ["be invoked or described as available (FR-AGT-033)"],
    onFailure: "Not built.",
    requirements: ["FR-AGT-033"],
    evidence: [],
    status: "planned",
    environment: "none",
  },
  {
    id: "ATLAS",
    productName: "Aksh Trials Agent",
    legacyIds: [],
    role: "Clinical research: protocol parsing, eligibility matching and trial analytics (Phase 2)",
    stage: "research",
    trigger: "never",
    inputs: [],
    outputs: [],
    reviewer: "not applicable",
    modelFlag: null,
    reads: [],
    prohibited: ["be invoked or described as available (FR-AGT-033)"],
    onFailure: "Not built.",
    requirements: ["FR-AGT-033"],
    evidence: [],
    status: "planned",
    environment: "none",
  },
];

/** CONDUCTOR's review order (Volume I §7.3 step 4), in code ids. GUARDIAN leads when the case is urgent. */
export const REVIEW_ORDER = {
  normal: ["SYNTHESIS", "GUARDIAN", "ORACLE", "NEXUS", "DrASSIST"],
  urgent: ["GUARDIAN", "ORACLE", "SYNTHESIS", "NEXUS", "DrASSIST"],
} as const;

/** The loop, in order (FLOW-JRN-1). Each step names who acts; the clinician sits in the middle. */
export const LOOP: { step: string; actor: AgentId | "CLINICIAN" | "AKSH_DIABETES"; detail: string }[] = [
  { step: "Capture", actor: "VOICE", detail: "Dictation to a transcript with its confidence" },
  { step: "Structure", actor: "CANVAS", detail: "Draft resources, each value traced to its source" },
  { step: "Analyse", actor: "AKSH_DIABETES", detail: "Glucose, HbA1c, laboratory results and complications become factors and safety notes" },
  { step: "Draft", actor: "CONDUCTOR", detail: "SYNTHESIS, GUARDIAN, HORIZON and NEXUS in parallel, then DrAssist; priority, review order and safety route set" },
  { step: "Audit the run", actor: "SHIELD", detail: "One record of the run" },
  { step: "Decide", actor: "CLINICIAN", detail: "Accept, edit or reject each draft; clear the gates; accept or reject the case" },
  { step: "Coordinate", actor: "PATHWAY", detail: "Referral draft once the note and codes are accepted; a clinician confirms it" },
  { step: "Stage", actor: "BRIDGE", detail: "Accepted content staged as FHIR R4; nothing written to a live record" },
  { step: "Audit the decision", actor: "SHIELD", detail: "Every decision recorded with who and when" },
  { step: "Learn", actor: "CLINICIAN", detail: "Outcome linked later; learning is reviewed and released by people, never automatic" },
  { step: "Population", actor: "COMPASS", detail: "Aggregate briefs for population leads, on request" },
];

export function agent(id: AgentId): AgentContract {
  const a = AGENTS.find((x) => x.id === id);
  if (!a) throw new Error(`Unknown agent ${id}`);
  return a;
}
