import { deriveDataHealthSummary, deriveEvidenceReadinessGate } from "./data-health";
import { collectTopFeedbackPhrases } from "./feedback-analytics";
import { deriveEvidenceReadinessTrend } from "./readiness-history-analytics";
import type { BenchmarkSignoffEntry } from "./benchmark-signoff-types";
import type { FeedbackEntry } from "./feedback-types";
import type { EvidenceReadinessSnapshot } from "./readiness-history-types";
import type { ReviewCase } from "./types";
import {
  deriveClinicalRuleCoverageMatrix,
  deriveDataCollectionAnalytics,
  deriveMeetingOutcomeAnalytics,
  deriveMeetingOutcomeEscalation,
  deriveMeetingOwnerWorkload,
  deriveRemediationActionCohorts,
  deriveRemediationChurnRisk,
  deriveRemediationHandoffChurnAnalytics,
  deriveRemediationOwnerLoad,
  deriveRemediationResolutionAnalytics,
  deriveRemediationStalledAlerts,
  deriveRemediationTurnaroundAnalytics,
  deriveReviewAnalytics,
  deriveScenarioBenchmark,
  deriveScenarioBenchmarkActionQueue,
  deriveValidationActionQueues,
  deriveValidationDossierAnalytics,
  deriveValidationProtocolAnalytics,
  deriveValidationStageFailureAnalytics,
  deriveValidationTrendAnalytics
} from "./workflow";

export function deriveOpsAnalytics({
  cases,
  feedbackArchive,
  readinessArchive,
  signoffArchive
}: {
  cases: ReviewCase[];
  feedbackArchive: FeedbackEntry[];
  readinessArchive: EvidenceReadinessSnapshot[];
  signoffArchive: BenchmarkSignoffEntry[];
}) {
  const reviewAnalytics = deriveReviewAnalytics(cases);
  const scenarioBenchmark = deriveScenarioBenchmark(cases);
  const scenarioBenchmarkActionQueue = deriveScenarioBenchmarkActionQueue(cases);
  const clinicalRuleCoverage = deriveClinicalRuleCoverageMatrix(cases);
  const dataHealthSummary = deriveDataHealthSummary(cases, feedbackArchive, signoffArchive[0]);
  const evidenceReadinessGate = deriveEvidenceReadinessGate(cases, feedbackArchive, signoffArchive[0]);
  const evidenceReadinessTrend = deriveEvidenceReadinessTrend(readinessArchive);
  const dataCollectionAnalytics = deriveDataCollectionAnalytics(cases);
  const validationActionQueues = deriveValidationActionQueues(cases);
  const validationProtocolAnalytics = deriveValidationProtocolAnalytics(cases);
  const validationTrendAnalytics = deriveValidationTrendAnalytics(cases);
  const validationStageFailureAnalytics = deriveValidationStageFailureAnalytics(cases);
  const remediationActionCohorts = deriveRemediationActionCohorts(cases);
  const remediationResolutionAnalytics = deriveRemediationResolutionAnalytics(cases);
  const remediationTurnaroundAnalytics = deriveRemediationTurnaroundAnalytics(cases);
  const remediationStalledAlerts = deriveRemediationStalledAlerts(cases);
  const remediationOwnerLoad = deriveRemediationOwnerLoad(cases);
  const remediationHandoffChurnAnalytics = deriveRemediationHandoffChurnAnalytics(cases);
  const remediationChurnRisk = deriveRemediationChurnRisk(cases);
  const validationDossierAnalytics = deriveValidationDossierAnalytics(cases);
  const meetingOutcomeAnalytics = deriveMeetingOutcomeAnalytics(cases);
  const meetingOutcomeEscalation = deriveMeetingOutcomeEscalation(cases);
  const meetingOwnerWorkload = deriveMeetingOwnerWorkload(cases);
  const openArchive = feedbackArchive.filter((entry) => entry.resolutionStatus !== "resolved");
  const resolvedArchive = feedbackArchive.filter((entry) => entry.resolutionStatus === "resolved");
  const caseCounts = new Map<string, number>();

  for (const entry of feedbackArchive) {
    if (!entry.relatedCaseId) continue;
    caseCounts.set(entry.relatedCaseId, (caseCounts.get(entry.relatedCaseId) ?? 0) + 1);
  }

  const feedbackAnalytics = {
    total: feedbackArchive.length,
    highReadiness: feedbackArchive.filter((entry) => Number(entry.readinessScore) >= 4).length,
    openSessions: openArchive.length,
    resolvedSessions: resolvedArchive.length,
    overdueSessions: openArchive.filter(
      (entry) => entry.dueDate.trim() && new Date(`${entry.dueDate}T23:59:59`).getTime() < Date.now()
    ).length,
    objections: collectTopFeedbackPhrases(openArchive, (entry) => entry.objections || entry.confusionPoint, 5),
    strongestMoments: collectTopFeedbackPhrases(feedbackArchive, (entry) => entry.strongestMoment, 5),
    nextActions: collectTopFeedbackPhrases(openArchive, (entry) => entry.nextActions, 5),
    linkedCases: [...caseCounts.entries()]
      .map(([caseId, count]) => ({ caseId, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 5)
  };

  return {
    clinicalRuleCoverage,
    dataCollectionAnalytics,
    dataHealthSummary,
    evidenceReadinessGate,
    evidenceReadinessTrend,
    feedbackAnalytics,
    meetingOutcomeAnalytics,
    meetingOutcomeEscalation,
    meetingOwnerWorkload,
    remediationActionCohorts,
    remediationChurnRisk,
    remediationHandoffChurnAnalytics,
    remediationOwnerLoad,
    remediationResolutionAnalytics,
    remediationStalledAlerts,
    remediationTurnaroundAnalytics,
    reviewAnalytics,
    scenarioBenchmark,
    scenarioBenchmarkActionQueue,
    validationActionQueues,
    validationDossierAnalytics,
    validationProtocolAnalytics,
    validationStageFailureAnalytics,
    validationTrendAnalytics
  };
}
