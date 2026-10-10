import type { FeedbackEntry } from "./feedback-types";
import {
  buildEvidenceArtifactMetadata,
  EVIDENCE_ARTIFACT_VERSIONS
} from "./evidence-artifact-metadata";
import { doNotClaimYet } from "./roadmap";
import type { ReviewCase } from "./types";
import {
  buildEvidencePayload,
  deriveHumanGates,
  deriveReviewerChecklist,
  deriveReviewerGuidance,
  deriveScenarioBenchmark
} from "./workflow";

export function buildCaseValidationDossierPayload(
  reviewCase: ReviewCase,
  allCases: ReviewCase[],
  options?: {
    generatedAt?: string;
    generatedBy?: string;
    linkedFeedback?: FeedbackEntry[];
    scopeKey?: string;
  }
) {
  const evidence = buildEvidencePayload(reviewCase);
  const benchmark = deriveScenarioBenchmark(allCases);
  const benchmarkStatus = benchmark.cases.find((item) => item.caseId === reviewCase.id) ?? null;
  const reviewerChecklist = deriveReviewerChecklist(reviewCase);
  const reviewerGuidance = deriveReviewerGuidance(reviewCase);
  const humanGates = deriveHumanGates(reviewCase);
  const linkedFeedback = options?.linkedFeedback ?? [];

  return {
    ...buildEvidenceArtifactMetadata({
      artifactType: "aksh-uk-eu-case-validation-dossier",
      artifactVersion: EVIDENCE_ARTIFACT_VERSIONS.caseValidationDossier,
      generatedAt: options?.generatedAt,
      generatedBy: options?.generatedBy,
      scopeKey: options?.scopeKey,
      subjectCaseId: reviewCase.id
    }),
    caseId: reviewCase.id,
    patientLabel: reviewCase.patientLabel,
    knownLimitations: [...doNotClaimYet],
    limitationsNotice:
      "Synthetic proof artifact for internal review and advisor walkthrough. Not production clinical software, live health system/EHR integration, or real-patient-data evidence.",
    reviewDecision: {
      lastReviewer: evidence.reviewSummary.lastReviewer ?? null,
      lastDecision: evidence.reviewSummary.lastDecision ?? null,
      lastDecisionAt: evidence.reviewSummary.lastDecisionAt ?? null,
      reviewerNotes: evidence.reviewSummary.reviewerNotes ?? null,
      overrideReason: evidence.reviewSummary.overrideReason ?? null,
      humanGateDecisions: evidence.humanGateDecisions,
      humanGates
    },
    dossierSummary: {
      validationProtocolScore: evidence.validationProtocol.overallScore,
      promotionRecommendation: evidence.validationProtocol.promotionRecommendation,
      validationReadinessLabel: evidence.validationReadiness.label,
      finalizationState: evidence.finalizationState,
      artifactState: evidence.artifactState,
      blockerCount: evidence.acceptanceBlockers.length,
      openFeedbackCount: linkedFeedback.filter((entry) => entry.resolutionStatus !== "resolved").length,
      benchmarkPassed: benchmarkStatus?.passed ?? null,
      benchmarkScenarioClass: benchmarkStatus?.scenarioClass ?? null
    },
    benchmarkStatus,
    sourceTrace: evidence.sourceTrace,
    validationProtocol: evidence.validationProtocol,
    validationHistory: evidence.validationHistory,
    transitionChecklist: evidence.transitionChecklist,
    reviewerChecklist,
    reviewerGuidance,
    linkedFeedback,
    evidence
  };
}

export type CaseValidationDossierPayload = ReturnType<typeof buildCaseValidationDossierPayload>;
