/**
 * Phase 5 — Governed diabetes agent intelligence / AI orchestration.
 * Synthetic / simulation only. ehrWrite always false; drafts only until clinician decides.
 * AI-generated content is never presented as verified clinical fact.
 */

import type { MissingDataIndicator } from "./types";

export type AgentIntelDecisionAction = "accept" | "edit" | "reject";

export type AgentIntelDraftKind =
  | "history_summary"
  | "clinical_documentation"
  | "missing_information"
  | "evidence_retrieval"
  | "follow_up_draft";

export type InformationProvenance = "ai_generated" | "clinician_verified" | "source_system" | "synthetic_fixture";

export type AgentIntelVersionPin = {
  modelId: string;
  modelVersion: string;
  promptId: string;
  promptVersion: string;
  draftingMode: "deterministic_synthetic" | "llm_gated";
};

export type EvidenceCitation = {
  id: string;
  sourceId: string;
  title: string;
  excerpt: string;
  relevance: number;
  urlOrRef: string | null;
  synthetic: true;
};

export type SharedPatientContextSource = {
  module:
    | "mock_cohort"
    | "patient_360"
    | "diabetes_journey"
    | "glucose_intelligence"
    | "medication_care"
    | "continuous_care"
    | "agents_register";
  available: boolean;
  note: string;
};

/** Shared context — agents must not invent separate patient silos. */
export type SharedPatientContext = {
  patientId: string;
  patientLabel: string;
  age: number | null;
  gender: string | null;
  conditions: string[];
  medications: string[];
  allergies: string[];
  lastEncounterDate: string | null;
  deteriorationSignals: string[];
  sources: SharedPatientContextSource[];
  authorisedTools: string[];
  synthetic: true;
  ehrWrite: false;
  builtAt: string;
};

export type StructuredDraftPayload = {
  kind: AgentIntelDraftKind;
  title: string;
  sections: Array<{ id: string; heading: string; body: string }>;
  missingFields?: Array<{ code: string; message: string; field: string }>;
  citations?: EvidenceCitation[];
  followUpSuggestion?: {
    title: string;
    ownerRole: string;
    dueInDays: number;
    rationale: string;
  };
  soap?: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
};

export type AgentIntelDraftStatus =
  | "DRAFT"
  | "queued"
  | "accepted"
  | "edited"
  | "rejected"
  | "cancelled";

export type AgentIntelDraft = {
  id: string;
  patientId: string;
  patientLabel: string;
  kind: AgentIntelDraftKind;
  status: AgentIntelDraftStatus;
  ownerRole: string;
  ownerDisplay: string | null;
  versionPin: AgentIntelVersionPin;
  payload: StructuredDraftPayload;
  validation: AgentIntelValidationResult;
  provenance: InformationProvenance;
  /** After Accept/Edit, clinician-verified copy may be marked separately */
  verifiedClinical: boolean;
  confidence: number;
  createdAt: string;
  updatedAt: string;
  decidedBy: string | null;
  decidedAt: string | null;
  closedAt: string | null;
  decisionHistory: AgentIntelDecisionEntry[];
  hitlRequired: true;
  synthetic: true;
  ehrWrite: false;
  autonomousClinicalAction: false;
  prescribeOrTreat: false;
};

export type AgentIntelDecisionEntry = {
  id: string;
  action: string;
  actor: string;
  reason: string | null;
  at: string;
  editedPayload?: StructuredDraftPayload | null;
};

export type AgentIntelDecision = {
  id: string;
  draftId: string;
  action: AgentIntelDecisionAction;
  actor: string;
  reason: string | null;
  editedPayload: StructuredDraftPayload | null;
  createdAt: string;
  modelVersion: string;
  promptVersion: string;
};

export type AgentIntelValidationIssue = {
  code: string;
  path: string;
  message: string;
  severity: "error" | "warning";
};

export type AgentIntelValidationResult = {
  valid: boolean;
  schemaVersion: string;
  issues: AgentIntelValidationIssue[];
  checkedAt: string;
};

export type AgentIntelHistoryEntry = {
  id: string;
  patientId: string;
  subjectKind: "draft" | "orchestration_run" | "eval" | "version_pin";
  subjectId: string;
  action: string;
  actor: string;
  reason: string | null;
  createdAt: string;
  ehrWrite: false;
  synthetic: true;
  metadata?: Record<string, unknown>;
};

export type AgentIntelOrchestrationRun = {
  id: string;
  patientId: string;
  patientLabel: string;
  status: "completed" | "partial" | "failed";
  agentsInvoked: string[];
  draftIds: string[];
  sharedContextBuiltAt: string;
  versionPin: AgentIntelVersionPin;
  startedAt: string;
  completedAt: string;
  synthetic: true;
  ehrWrite: false;
  llmUsed: false;
  note: string;
};

export type AgentIntelEvalCase = {
  id: string;
  name: string;
  patientId: string;
  expectedDraftKinds: AgentIntelDraftKind[];
  mustCiteEvidence: boolean;
  mustFlagMissingData: boolean;
  mustRemainDraftUntilHitl: boolean;
  mustNotPrescribe: boolean;
};

export type AgentIntelEvalResult = {
  caseId: string;
  passed: boolean;
  failures: string[];
  measuredAt: string;
  synthetic: true;
};

export type AgentIntelWorklistItem = {
  id: string;
  patientId: string;
  patientLabel: string;
  kind: AgentIntelDraftKind;
  title: string;
  status: AgentIntelDraftStatus;
  ownerRole: string;
  createdAt: string;
  confidence: number;
  provenance: InformationProvenance;
  /** INT-13 spine projection of provenance for shared timeline/360 consumers. */
  provenanceSpine?: {
    sourceSystem: string;
    sourceReference?: string;
    confidence: number;
    recordedAt: string;
  };
  verifiedClinical: boolean;
  synthetic: true;
  ehrWrite: false;
  worklistUrgency: number;
};

export type AgentIntelSnapshot = {
  patientId: string;
  patientLabel: string;
  synthetic: true;
  ehrWrite: false;
  hitlRequired: true;
  autonomousClinicalAction: false;
  clinicalValidationClaim: false;
  capabilityStatus: "synthetic_demo";
  sharedContext: SharedPatientContext;
  versionRegistry: AgentIntelVersionPin[];
  activeVersionPin: AgentIntelVersionPin;
  drafts: AgentIntelDraft[];
  orchestrationRuns: AgentIntelOrchestrationRun[];
  decisionHistory: AgentIntelHistoryEntry[];
  evalSuite: {
    cases: AgentIntelEvalCase[];
    lastResults: AgentIntelEvalResult[];
  };
  distinctionNote: string;
  missingData: MissingDataIndicator[];
  note: string;
};
