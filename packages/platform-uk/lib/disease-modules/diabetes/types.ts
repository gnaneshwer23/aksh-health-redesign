/**
 * Diabetes Disease Intelligence — shared types (v0 stub).
 *
 * Diabetes is a module on the Aksh Intelligence Platform, not a separate
 * product. These types back the 9 signal/coaching areas from the spec below.
 * They feed the EXISTING HORIZON (risk) and GUARDIAN (safety) agents — this
 * is not a set of 9 new LLM agents, and it introduces no new orchestrator,
 * audit trail, or auth boundary. CONDUCTOR and SHIELD remain the only
 * instances of each.
 *
 * Spec:   docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md
 * ADRs:   docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md
 *         docs/ADR_TECH_STACK_MODERNIZATION.md
 *
 * v0 status: typed stubs only. Nothing in this module is wired into
 * lib/clinical-spine/orchestrate.ts, lib/agents/llm-oracle.ts, or
 * lib/agents/llm-guardian.ts yet — see each file's TODO(v1) comment.
 */

export const DIABETES_MODULE_IDS = [
  "GLUCOSE",
  "HBA1C",
  "INSULIN",
  "GLP1",
  "NUTRITION",
  "EXERCISE",
  "BEHAVIOUR",
  "COMPLICATIONS",
  "PREVENTION"
] as const;

export type DiabetesModuleId = (typeof DIABETES_MODULE_IDS)[number];

/** Which existing platform surface each module's output is intended to feed. */
export type DiabetesFeedTarget = "HORIZON" | "GUARDIAN" | "coaching_surface";

export const DIABETES_MODULE_FEED_TARGET: Record<DiabetesModuleId, DiabetesFeedTarget> = {
  GLUCOSE: "HORIZON",
  HBA1C: "HORIZON",
  INSULIN: "GUARDIAN",
  GLP1: "GUARDIAN",
  NUTRITION: "coaching_surface",
  EXERCISE: "coaching_surface",
  BEHAVIOUR: "coaching_surface",
  COMPLICATIONS: "HORIZON",
  PREVENTION: "HORIZON"
};

/**
 * Shared honesty fields for risk/safety-shaped signals (Glucose, HbA1c,
 * Insulin, GLP-1, Complications, Prevention). Mirrors the literal-type
 * pattern already used in lib/precision-health/risk-state.ts and
 * lib/clinical-spine/outcomes-loop.ts (SPINE_OUTCOMES_HONESTY).
 */
export type DiabetesSignalHonesty = {
  hitlRequired: true;
  ehrWrite: false;
  autoRetrain: false;
  physiologicalTwin: false;
};

export const DIABETES_SIGNAL_HONESTY: DiabetesSignalHonesty = {
  hitlRequired: true,
  ehrWrite: false,
  autoRetrain: false,
  physiologicalTwin: false
};

/**
 * Shared honesty + shape for coaching-draft modules (Nutrition, Exercise,
 * Behaviour). Deliberately parallel to, but distinct from, the generic
 * CoachingAgentId/CoachingDraft in lib/precision-health/coaching.ts — see
 * the naming note on DiabetesCoachingAgentId below.
 */
export type DiabetesCoachingAgentId = "NUTRITION_DIABETES" | "EXERCISE_DIABETES" | "BEHAVIOUR_DIABETES";

/**
 * TODO(open question — spec §"Open questions" #5, needs clinical/product
 * decision): confirm whether diabetes coaching should extend the existing
 * `CoachingAgentId` union in lib/precision-health/coaching.ts in place
 * instead of using diabetes-suffixed ids. Kept distinct for now so
 * disease-specific coaching content stays separable in SHIELD audit /
 * analytics until that decision is made.
 */
export type DiabetesCoachingDraft = {
  moduleId: "NUTRITION" | "EXERCISE" | "BEHAVIOUR";
  agentId: DiabetesCoachingAgentId;
  feedsInto: "coaching_surface";
  mode: "coaching_draft_only";
  patientId: string;
  patientLabel: string;
  title: string;
  summary: string;
  suggestions: string[];
  disclaimers: string[];
  clinicalEscalationHints: string[];
  hitlRequired: true;
  ehrWrite: false;
  isClinicalAdvice: false;
  confidence: number;
};

/** Minimal patient context every module accepts. Extend cohort fixtures deliberately — never invent a live stream. */
export type DiabetesPatientContext = {
  patientId: string;
  patientLabel?: string;
};

/**
 * Placeholder input shapes for data the current cohort fixtures
 * (lib/mock-data/patients.ts) and modality contracts
 * (lib/precision-health/modalities.ts) do not carry yet.
 *
 * TODO(v1, blocked on clinical lead — spec §"Open questions" #1): confirm
 * whether CGM/glucose fields extend `wearableSampleSchema` or become a new
 * `glucose` modality in lib/precision-health/modalities.ts before these
 * shapes are wired to a real data source. Until then, callers pass these in
 * directly (see fixtures.ts) rather than reading them from a shared store.
 */
export type DiabetesGlucoseReading = {
  recordedAt: string;
  glucoseMgDl: number;
  context?: "fasting" | "post_prandial" | "bedtime" | "unspecified";
};

/** HbA1c in IFCC mmol/mol, the unit Aksh stores everywhere (lib/units.ts). Display converts per organisation. */
export type DiabetesHbA1cReading = {
  recordedAt: string;
  valueMmolMol: number;
};
