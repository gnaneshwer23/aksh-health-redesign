import { deriveHumanGates } from "./human-gates";
import type { HumanGateId, ReviewCase } from "./types";
import { deriveFinalizationState } from "./workflow/safety";
import { deriveValidationReadiness } from "./workflow/validation";

type OutcomeGateState = "reviewer_confirmed" | "not_applicable" | "open" | "not_recorded";

function outcomeGateState(reviewCase: ReviewCase, gateId: HumanGateId): OutcomeGateState {
  const decision = reviewCase.humanGateDecisions?.find((item) => item.id === gateId);

  if (!decision) return "not_recorded";
  if (decision.status === "confirmed") return "reviewer_confirmed";
  if (decision.status === "not_applicable") return "not_applicable";
  return "open";
}

export function deriveSyntheticOutcomeCapture(reviewCase: ReviewCase) {
  const humanGates = deriveHumanGates(reviewCase);
  const validationReadiness = deriveValidationReadiness(reviewCase);

  return {
    artifactType: "aksh-uk-eu-l10-synthetic-outcome-capture" as const,
    schemaVersion: "2026-05-03.synthetic.l10" as const,
    caseId: reviewCase.id,
    patientLabel: reviewCase.patientLabel,
    syntheticOnly: true,
    realPatientData: false,
    liveLearning: false,
    productionClinicalAiClaim: false,
    benchmarkScenarioClass: reviewCase.expectedOutcome?.scenarioClass ?? "unclassified_synthetic_case",
    reviewerDecision: reviewCase.reviewSummary?.lastDecision ?? "pending",
    finalizationState: deriveFinalizationState(reviewCase),
    validationStage: validationReadiness.stage,
    validationLabel: validationReadiness.label,
    humanGateSummary: {
      required: humanGates.filter((gate) => gate.status === "required").length,
      recommended: humanGates.filter((gate) => gate.status === "recommended").length,
      completed: humanGates.filter((gate) => gate.status === "completed").length,
      clear: humanGates.filter((gate) => gate.status === "clear").length
    },
    reviewerConfirmedActions: {
      safetyNetting: outcomeGateState(reviewCase, "red_flag_escalation"),
      referralPathway: outcomeGateState(reviewCase, "referral_pathway"),
      medicationDecision: outcomeGateState(reviewCase, "medication_decision")
    },
    evaluationUse: "offline_synthetic_benchmark_and_quality_learning_only" as const,
    prohibitedUses: [
      "real patient model training",
      "live health system integration learning",
      "autonomous clinical decisioning",
      "production clinical safety assurance"
    ]
  };
}

export function buildSyntheticOutcomeCaptureCohort(reviewCases: ReviewCase[]) {
  const captures = reviewCases.map((reviewCase) => deriveSyntheticOutcomeCapture(reviewCase));

  return {
    artifactType: "aksh-uk-eu-l10-synthetic-outcome-capture-cohort" as const,
    schemaVersion: "2026-05-03.synthetic.l10" as const,
    syntheticOnly: true,
    realPatientData: false,
    liveLearning: false,
    totalCases: captures.length,
    accepted: captures.filter((capture) => capture.reviewerDecision === "accept").length,
    blocked: captures.filter((capture) => capture.finalizationState === "blocked").length,
    captures
  };
}
