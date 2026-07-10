export type Severity = "low" | "medium" | "high";
export type WorkflowStatus = "pending_review" | "accepted" | "rejected" | "deferred";
export type ReviewerDecision = "accept" | "reject" | "defer";
export type FinalizationState = "ready" | "warn" | "blocked";
export type MeetingDisposition = "promote" | "hold" | "remediate" | "needs_evidence";
export type SyntheticSourceProfile =
  | "voice_note_intake"
  | "public_health_sdoh"
  | "wearable_monitoring"
  | "imaging_lab_result"
  | "genomics_family_history"
  | "ehr_handoff_placeholder";

export type HumanGateId = "red_flag_escalation" | "referral_pathway" | "medication_decision";
export type HumanGateDecisionStatus = "open" | "confirmed" | "not_applicable";

export type HumanGateDecision = {
  id: HumanGateId;
  status: HumanGateDecisionStatus;
  note?: string;
  decidedAt?: string;
  decidedBy?: string;
};

export type SafetyFlag = {
  id: string;
  label: string;
  severity: Severity;
  detail: string;
};

export type ClinicalRuleResult = {
  id: string;
  ruleId: string;
  label: string;
  severity: Severity;
  category: "medication_risk" | "missing_data" | "source_quality" | "escalation" | "review_governance" | "export_validation";
  finalizationImpact: "warning" | "cannot_finalize";
  source: "safety" | "validation" | "reviewer_checklist";
  detail: string;
  requiredReviewerAction: string;
  fieldPath?: string;
};

export type AuditEvent = {
  id: string;
  category: "system" | "reviewer_edit" | "reviewer_decision" | "reviewer_note" | "override";
  label: string;
  actor: string;
  timestamp: string;
  detail?: string;
};

export type ReviewSummary = {
  lastReviewer?: string;
  lastDecision?: ReviewerDecision;
  lastDecisionAt?: string;
  reviewerNotes?: string;
  overrideReason?: string;
  guidanceChecklist?: Array<{
    id: string;
    title: string;
    category: "must_confirm" | "override" | "missing_evidence";
    completed: boolean;
    confirmationNote?: string;
    completedAt?: string;
    completedBy?: string;
  }>;
};

export type FieldChange = {
  id: string;
  sectionId: string;
  fieldKey: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
  actor: string;
  timestamp: string;
};

export type SourceTraceStep = {
  step: string;
  detail: string;
};

export type GenerationTraceItem = {
  id: string;
  fieldLabel: string;
  fieldPath: string;
  section: "encounter" | "condition" | "medicationRequest" | "observation" | "safetyContext";
  sourceSnippet: string;
  inferredValue: string;
  rationale: string;
};

export type ValidationIssue = {
  id: string;
  label: string;
  severity: Severity;
  detail: string;
  category: "blocking" | "warning";
  fieldPath?: string;
};

export type ValidationHistoryEntry = {
  id: string;
  recordedAt: string;
  finalizationState: FinalizationState;
  readinessStage: "synthetic_validation" | "remediation" | "pilot_prep" | "rwe_candidate";
  readinessLabel: string;
  blockerCount: number;
  highConcernCount: number;
  overallScore: number;
  clinicalCompletenessScore: number;
  safetyReviewScore: number;
  reviewerConfidenceScore: number;
  exportQualityScore: number;
  promotionRecommendation: string;
  summary: string;
};

export type RemediationActionResolution = {
  id: string;
  stepId: string;
  stepTitle: string;
  stage: string;
  actionLabel: string;
  detail: string;
  status: "open" | "resolved";
  updatedAt: string;
  updatedBy: string;
  owner?: string;
  handoffNote?: string;
};

export type BenchmarkActionResolution = {
  id: string;
  actionId: string;
  actionLabel: string;
  status: "open" | "resolved";
  updatedAt: string;
  updatedBy: string;
  owner?: string;
  note?: string;
};

export type ConsultationInput = {
  sourceType: "note" | "transcript";
  sourceProfile?: SyntheticSourceProfile;
  capturedAt: string;
  summary: string;
  transcriptConfidence: number;
};

export type EncounterResource = {
  resourceType: "Encounter";
  id: string;
  className: string;
  reason: string;
  clinicianSummary: string;
};

export type ConditionResource = {
  resourceType: "Condition";
  id: string;
  codeText: string;
  clinicalStatus: "active" | "provisional" | "resolved";
  evidence: string;
};

export type MedicationRequestResource = {
  resourceType: "MedicationRequest";
  id: string;
  medicationText: string;
  dosageInstruction: string;
  reason: string;
  confidence: number;
};

export type ObservationResource = {
  resourceType: "Observation";
  id: string;
  codeText: string;
  valueText: string;
  status: "final" | "preliminary";
};

export type FhirBundleDraft = {
  encounter: EncounterResource;
  condition: ConditionResource;
  medicationRequest?: MedicationRequestResource;
  observations: ObservationResource[];
};

export type Section = {
  id: string;
  title: string;
  fields: Array<{
    key: string;
    label: string;
    value: string;
  }>;
};

export type SafetyContext = {
  allergies: string[];
  currentMedications: string[];
};

export type DataCollectionProfile = {
  provenance: "synthetic_sandbox" | "pilot_candidate" | "rwe_candidate";
  datasetLabel: string;
  ingestionStatus: "draft_only" | "sandbox_validated" | "pilot_ready" | "rwe_ready";
  validationStream: "phase_1_synthetic" | "phase_1_remediation" | "ics_pilot_preparation" | "rwe_pipeline_candidate";
  safetyGovernance: "hazard_review_required" | "hazard_review_in_progress" | "safety_case_candidate";
  trainingReadiness: "training_required" | "training_ready" | "training_not_needed";
  collectionNotes: string[];
};

export type ValidationReadiness = {
  stage: "synthetic_validation" | "remediation" | "pilot_prep" | "rwe_candidate";
  label: string;
  urgency: "low" | "medium" | "high";
  nextStep: string;
  blockerCount: number;
  highConcernCount: number;
};

export type ValidationProtocol = {
  clinicalCompletenessScore: number;
  safetyReviewScore: number;
  reviewerConfidenceScore: number;
  exportQualityScore: number;
  overallScore: number;
  promotionRecommendation:
    | "hold_in_remediation"
    | "complete_reviewer_validation"
    | "ready_for_pilot_prep"
    | "ready_for_rwe_candidate"
    | "continue_synthetic_validation";
  summary: string;
};

export type ClinicalConcern = {
  id: string;
  label: string;
  detail: string;
  severity: Severity;
  source: "blocker" | "safety" | "validation";
};

export type ReviewerGuidance = {
  id: string;
  title: string;
  instruction: string;
  category: "must_confirm" | "override" | "missing_evidence";
  severity: Severity;
};

export type ReviewerDraftAction = {
  id: string;
  title: string;
  actionLabel: string;
  instruction: string;
  category: "must_confirm" | "override" | "missing_evidence";
  actionType?: "general_review" | "safety_netting" | "referral_pathway" | "medication_decision";
  severity: Severity;
  status: "open" | "confirmed";
  confirmationNote?: string;
  completedAt?: string;
  completedBy?: string;
};

export type ChecklistItem = {
  id: string;
  title: string;
  category: "must_confirm" | "override" | "missing_evidence";
  completed: boolean;
  confirmationNote?: string;
  completedAt?: string;
  completedBy?: string;
};

export type TransitionChecklistItem = {
  id: string;
  phase: "to_pilot_prep" | "to_rwe_candidate";
  title: string;
  status: "done" | "open";
  detail: string;
};

export type ScenarioExpectedOutcome = {
  scenarioClass: string;
  expectedFinalizationState: FinalizationState;
  expectedSafetyLabels?: string[];
  expectedBlockerIncludes?: string[];
  expectedValidationLabels?: string[];
  expectedPromotionRecommendation?: string;
};

export type MeetingOutcome = {
  disposition: MeetingDisposition;
  note?: string;
  reviewedAt: string;
  reviewedBy: string;
  followThroughOwner?: string;
  handoffNote?: string;
  handoffBy?: string;
  handoffAt?: string;
  handoffHistory?: Array<{
    id: string;
    fromOwner: string;
    toOwner: string;
    note?: string;
    by: string;
    at: string;
  }>;
};

export type CoordinationRiskTriage = {
  status: "escalated" | "parked" | "focused_recovery";
  owner: string;
  note?: string;
  updatedAt: string;
  updatedBy: string;
};

export type FhirExportBundle = {
  exportVersion: string;
  fhirVersion: "4.0.1";
  resourceType: "Bundle";
  id: string;
  type: "collection";
  timestamp: string;
  syntheticOnly: boolean;
  integrationMode: "synthetic_evidence" | "integration_rehearsal";
  exportQualityIssues: Array<{
    id: string;
    label: string;
    severity: Severity;
    category: ValidationIssue["category"];
    fieldPath?: string;
    resourceReference?: string;
    detail: string;
  }>;
  identifier: {
    system: string;
    value: string;
  };
  meta: {
    profile: string[];
    tag: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  summary: {
    resourceCount: number;
    resourceTypes: string[];
    hasMedicationRequest: boolean;
    validationStatus: "valid" | "warnings_present" | "blocking_issues";
    validationIssueCount: number;
    blockingIssueCount: number;
    warningIssueCount: number;
    syntheticLabel: string;
    integrationReadinessLabel: string;
    resourceValidation: Array<{
      resourceReference: string;
      resourceType: string;
      issueCount: number;
      blockingIssueCount: number;
      warningIssueCount: number;
      status: "valid" | "warnings_present" | "blocking_issues";
    }>;
  };
  entry: Array<{
    fullUrl: string;
    resource: Record<string, unknown>;
  }>;
};

export type ReviewCase = {
  id: string;
  userId: string; // Owner of this case (from authenticated session)
  patientLabel: string;
  status: WorkflowStatus;
  updatedAt: string;
  summary: string;
  input: ConsultationInput;
  dataCollectionProfile?: DataCollectionProfile;
  safetyContext: SafetyContext;
  draft: FhirBundleDraft;
  generationTrace?: GenerationTraceItem[];
  auditEvents: AuditEvent[];
  reviewSummary?: ReviewSummary;
  meetingOutcome?: MeetingOutcome;
  coordinationRiskTriage?: CoordinationRiskTriage;
  expectedOutcome?: ScenarioExpectedOutcome;
  validationHistory?: ValidationHistoryEntry[];
  remediationActionResolutions?: RemediationActionResolution[];
  benchmarkActionResolutions?: BenchmarkActionResolution[];
  humanGateDecisions?: HumanGateDecision[];
  fieldChanges?: FieldChange[];
  frozenArtifact?: {
    frozenAt: string;
    frozenBy: string;
    draft: FhirBundleDraft;
    dataCollectionProfile?: DataCollectionProfile;
    reviewSummary: ReviewSummary;
    meetingOutcome?: MeetingOutcome;
    finalizationState: FinalizationState;
    safetyFlags: SafetyFlag[];
    acceptanceBlockers: string[];
    fieldChanges: FieldChange[];
    generationTrace?: GenerationTraceItem[];
    activityTimeline: AuditEvent[];
    sourceTrace: SourceTraceStep[];
    exportedResources: FhirExportBundle;
    validationIssues: ValidationIssue[];
    validationHistory?: ValidationHistoryEntry[];
    remediationActionResolutions?: RemediationActionResolution[];
    benchmarkActionResolutions?: BenchmarkActionResolution[];
    humanGateDecisions?: HumanGateDecision[];
  };
};
