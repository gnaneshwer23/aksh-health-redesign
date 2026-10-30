/**
 * Chronic disease domain framework (Phase 6).
 *
 * Common infrastructure contracts that disease-specific plugins register against.
 * Disease-specific guidelines, observations, risk models, care pathways and
 * validation requirements stay inside each plugin — not in this layer.
 *
 * Hard rules:
 *  - Do not activate new disease-specific clinical intelligence without validation.
 *  - Non-diabetes domains are planned/research scaffolds only.
 *  - No autonomous clinical actions; ehrWrite stays false.
 *  - Inactive domains return `not_activated` — never fabricate clinical outputs.
 */

export const DISEASE_DOMAIN_IDS = [
  "diabetes_metabolic",
  "cardiovascular",
  "chronic_kidney_disease",
  "obesity_metabolic",
  "other_chronic",
] as const;

export type DiseaseDomainId = (typeof DISEASE_DOMAIN_IDS)[number];

/**
 * Activation honesty for a registered domain.
 * - active_synthetic: diabetes path — synthetic_demo only where already established
 * - planned: scaffold exists; clinical intelligence not activated
 * - research: placeholder / subject to evidence (other chronic diseases)
 */
export type DomainActivationStatus = "active_synthetic" | "planned" | "research";

export type DomainFeedTarget = "HORIZON" | "GUARDIAN" | "coaching_surface" | "none";

/** Shared honesty — byte-compatible with diabetes / heart signal honesty. */
export type DomainSignalHonesty = {
  hitlRequired: true;
  ehrWrite: false;
  autoRetrain: false;
  physiologicalTwin: false;
  autonomousClinicalAction: false;
};

export const DOMAIN_SIGNAL_HONESTY: DomainSignalHonesty = {
  hitlRequired: true,
  ehrWrite: false,
  autoRetrain: false,
  physiologicalTwin: false,
  autonomousClinicalAction: false,
};

/** Common validation gate before any domain may leave planned/research. */
export type DomainValidationRequirements = {
  clinicalSafetyCase: boolean;
  evaluationThresholdsRecorded: boolean;
  dpiaOrRegulatoryOpinion: boolean;
  approvedOrgGoLive: boolean;
  /** Explicit product decision to activate clinical intelligence for this domain. */
  clinicalLeadActivationApproval: boolean;
};

export const EMPTY_VALIDATION_REQUIREMENTS: DomainValidationRequirements = {
  clinicalSafetyCase: false,
  evaluationThresholdsRecorded: false,
  dpiaOrRegulatoryOpinion: false,
  approvedOrgGoLive: false,
  clinicalLeadActivationApproval: false,
};

/** Disease-specific guideline catalogue contract (metadata only until activated). */
export type DomainGuidelinesContract = {
  catalogId: string;
  status: DomainActivationStatus;
  /** Illustrative guideline area ids — not a claim that rules are live. */
  guidelineAreaIds: readonly string[];
  notes: string;
};

/** Observation kinds the domain may eventually consume. */
export type DomainObservationsContract = {
  status: DomainActivationStatus;
  observationKindIds: readonly string[];
  notes: string;
};

/** Risk-model slots — inactive domains must not emit scores. */
export type DomainRiskModelsContract = {
  status: DomainActivationStatus;
  riskModelIds: readonly string[];
  notes: string;
};

/** Care-pathway slots — inactive domains must not draft pathways. */
export type DomainCarePathwaysContract = {
  status: DomainActivationStatus;
  pathwayIds: readonly string[];
  notes: string;
};

export type DomainNotActivatedReason = "not_activated" | "validation_required";

export type DomainFailure = {
  ok: false;
  reason: DomainNotActivatedReason;
  message: string;
  domainId: DiseaseDomainId;
  activationStatus: DomainActivationStatus;
  /** Always null — never invent clinical payloads for inactive domains. */
  clinicalOutput: null;
};

export type DomainSuccess<T> = {
  ok: true;
  domainId: DiseaseDomainId;
  activationStatus: DomainActivationStatus;
  data: T;
  honesty: DomainSignalHonesty;
};

export type DomainResult<T> = DomainSuccess<T> | DomainFailure;

export type DomainRiskEvaluationInput = {
  patientId: string;
  now?: number;
};

export type DomainRiskEvaluationData = {
  /** Opaque pointer to an existing diabetes composite — not a new clinical model. */
  sourceModule: "disease-modules/diabetes";
  contributionKind: "risk_contribution_pointer";
  patientId: string;
  note: string;
};

export type DiseaseDomainPlugin = {
  id: DiseaseDomainId;
  name: string;
  description: string;
  activationStatus: DomainActivationStatus;
  honesty: DomainSignalHonesty;
  feedTargets: readonly DomainFeedTarget[];
  guidelines: DomainGuidelinesContract;
  observations: DomainObservationsContract;
  riskModels: DomainRiskModelsContract;
  carePathways: DomainCarePathwaysContract;
  validationRequirements: DomainValidationRequirements;
  /**
   * Risk evaluation entry. Active synthetic diabetes may return a pointer into
   * the existing disease-modules/diabetes path. All other domains return
   * not_activated / validation_required.
   */
  evaluateRisk: (input: DomainRiskEvaluationInput) => DomainResult<DomainRiskEvaluationData>;
  /** Observation catalogue for the domain (kinds only — no fabricated readings). */
  listObservationKinds: () => DomainResult<{ observationKindIds: readonly string[] }>;
  /** Care pathway catalogue (ids only). */
  listCarePathways: () => DomainResult<{ pathwayIds: readonly string[] }>;
};
