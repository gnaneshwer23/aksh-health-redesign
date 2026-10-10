import { buildExportResources, buildValidationIssues } from "../export-mapping";
import { formatCaseTimestamp } from "../time-format";
import type { DataCollectionProfile, FinalizationState, ReviewCase, Severity, ValidationHistoryEntry } from "../types";
import {
  deriveAcceptanceBlockers,
  deriveClinicalConcerns,
  deriveFinalizationState,
  deriveReviewerChecklist,
  deriveReviewerGuidance,
  deriveSafetyFlags
} from "./safety";
import { deriveDataCollectionProfile } from "./data-collection";

export function deriveValidationReadiness(reviewCase: ReviewCase) {
  const profile = reviewCase.dataCollectionProfile ?? deriveDataCollectionProfile(reviewCase);
  const blockers = deriveAcceptanceBlockers(reviewCase);
  const concerns = deriveClinicalConcerns(reviewCase);
  const finalizationState = deriveFinalizationState(reviewCase);

  return deriveValidationReadinessFromInputs(profile, blockers, concerns, finalizationState);
}

export function deriveValidationReadinessFromInputs(
  profile: DataCollectionProfile,
  blockers: string[],
  concerns: Array<{ severity: Severity }>,
  finalizationState: FinalizationState
) {
  const openHighConcerns = concerns.filter((item) => item.severity === "high").length;

  if (profile.validationStream === "phase_1_remediation") {
    return {
      stage: "remediation" as const,
      label: "Remediation needed",
      urgency: "high" as const,
      nextStep: "Resolve blocking clinical issues and clear hazard-review items before pilot reuse.",
      blockerCount: blockers.length,
      highConcernCount: openHighConcerns
    };
  }

  if (profile.validationStream === "rwe_pipeline_candidate") {
    return {
      stage: "rwe_candidate" as const,
      label: "RWE candidate",
      urgency: "low" as const,
      nextStep: "Preserve the frozen artifact and use it for downstream evidence and RWE pipeline rehearsal.",
      blockerCount: blockers.length,
      highConcernCount: openHighConcerns
    };
  }

  if (profile.validationStream === "ics_pilot_preparation") {
    return {
      stage: "pilot_prep" as const,
      label: "Pilot-prep ready",
      urgency: finalizationStateToUrgency(finalizationState),
      nextStep:
        blockers.length || openHighConcerns
          ? "Complete reviewer confirmations and close remaining concerns before live pilot rehearsal."
          : "Use this case for clinician training, walkthroughs, and pre-pilot dry runs.",
      blockerCount: blockers.length,
      highConcernCount: openHighConcerns
    };
  }

  return {
    stage: "synthetic_validation" as const,
    label: "Synthetic validation",
    urgency: "medium" as const,
    nextStep: "Keep this case in the synthetic validation stream until it is mature enough for pilot-prep promotion.",
    blockerCount: blockers.length,
    highConcernCount: openHighConcerns
  };
}

function finalizationStateToUrgency(finalizationState: FinalizationState) {
  if (finalizationState === "blocked") return "high" as const;
  if (finalizationState === "warn") return "medium" as const;
  return "low" as const;
}

export function deriveValidationActionQueues(cases: ReviewCase[]) {
  const enriched = cases.map((item) => {
    const readiness = deriveValidationReadiness(item);
    const profile = item.dataCollectionProfile ?? deriveDataCollectionProfile(item);
    const finalizationState = deriveFinalizationState(item);
    const safetyFlags = deriveSafetyFlags(item);

    return {
      id: item.id,
      patientLabel: item.patientLabel,
      summary: item.summary,
      validationStream: profile.validationStream,
      stage: readiness.stage,
      label: readiness.label,
      urgency: readiness.urgency,
      nextStep: readiness.nextStep,
      blockerCount: readiness.blockerCount,
      highConcernCount: readiness.highConcernCount,
      warningCount: finalizationState === "warn" ? 1 : 0,
      safetyFlagCount: safetyFlags.length,
      status: item.status
    };
  });

  const remediationPriority = [...enriched]
    .filter((item) => item.stage === "remediation")
    .sort((left, right) => {
      if (right.blockerCount !== left.blockerCount) {
        return right.blockerCount - left.blockerCount;
      }
      if (right.highConcernCount !== left.highConcernCount) {
        return right.highConcernCount - left.highConcernCount;
      }
      return right.safetyFlagCount - left.safetyFlagCount;
    })
    .slice(0, 4);

  const pilotPromotionCandidates = [...enriched]
    .filter((item) => item.stage === "pilot_prep" || item.stage === "synthetic_validation")
    .sort((left, right) => {
      const leftScore = left.blockerCount * 3 + left.highConcernCount * 2 + left.warningCount + left.safetyFlagCount;
      const rightScore = right.blockerCount * 3 + right.highConcernCount * 2 + right.warningCount + right.safetyFlagCount;
      if (leftScore !== rightScore) {
        return leftScore - rightScore;
      }
      if (left.stage !== right.stage) {
        return left.stage === "pilot_prep" ? -1 : 1;
      }
      return left.patientLabel.localeCompare(right.patientLabel);
    })
    .slice(0, 4);

  return {
    remediationPriority,
    pilotPromotionCandidates
  };
}

export function deriveStreamTransitionChecklist(reviewCase: ReviewCase) {
  const artifact = reviewCase.frozenArtifact;
  const dataCollectionProfile = artifact?.dataCollectionProfile ?? reviewCase.dataCollectionProfile ?? deriveDataCollectionProfile(reviewCase);
  const finalizationState = artifact?.finalizationState ?? deriveFinalizationState(reviewCase);
  const acceptanceBlockers = artifact?.acceptanceBlockers ?? deriveAcceptanceBlockers(reviewCase);
  const guidanceChecklist =
    artifact?.reviewSummary.guidanceChecklist ??
    reviewCase.reviewSummary?.guidanceChecklist ??
    deriveReviewerChecklist(reviewCase);
  const requiredChecklist = guidanceChecklist.filter(
    (item) => item.category === "must_confirm" || item.category === "override"
  );
  const requiredChecklistDone = requiredChecklist.every((item) => item.completed && item.confirmationNote?.trim());
  const exportValidationStatus =
    artifact?.exportedResources?.summary?.validationStatus ??
    buildExportResources(reviewCase.draft, {
      caseId: reviewCase.id,
      timestamp: reviewCase.updatedAt,
      validationIssues: artifact?.validationIssues ?? buildValidationIssues(reviewCase.draft)
    }).summary.validationStatus;
  const isAccepted = reviewCase.status === "accepted";
  const hasFrozenArtifact = Boolean(artifact);

  return [
    {
      id: `${reviewCase.id}-to-pilot-blockers`,
      phase: "to_pilot_prep" as const,
      title: "Clear blocking clinical issues",
      status: acceptanceBlockers.length === 0 && finalizationState !== "blocked" ? "done" as const : "open" as const,
      detail:
        acceptanceBlockers.length === 0 && finalizationState !== "blocked"
          ? "No blocking clinical issues are preventing movement into pilot-prep use."
          : "Resolve active blockers and move the case out of blocked finalization before pilot-prep promotion."
    },
    {
      id: `${reviewCase.id}-to-pilot-checklist`,
      phase: "to_pilot_prep" as const,
      title: "Complete reviewer confirmations",
      status: requiredChecklistDone ? "done" as const : "open" as const,
      detail:
        requiredChecklistDone
          ? "Required reviewer confirmations and rationale notes are complete."
          : "Finish required reviewer checklist items and capture confirmation notes before pilot-prep promotion."
    },
    {
      id: `${reviewCase.id}-to-pilot-governance`,
      phase: "to_pilot_prep" as const,
      title: "Reach pilot-ready governance state",
      status:
        dataCollectionProfile.validationStream === "ics_pilot_preparation" ||
        dataCollectionProfile.validationStream === "rwe_pipeline_candidate"
          ? ("done" as const)
          : ("open" as const),
      detail:
        dataCollectionProfile.validationStream === "ics_pilot_preparation" ||
        dataCollectionProfile.validationStream === "rwe_pipeline_candidate"
          ? "The case already sits in a pilot-prep or later stream."
          : "Move the case out of synthetic validation/remediation into the regional pilot-preparation stream."
    },
    {
      id: `${reviewCase.id}-to-rwe-acceptance`,
      phase: "to_rwe_candidate" as const,
      title: "Accept and freeze the reviewed artifact",
      status: isAccepted && hasFrozenArtifact ? "done" as const : "open" as const,
      detail:
        isAccepted && hasFrozenArtifact
          ? "The reviewed artifact is accepted and frozen."
          : "Accept the case and preserve the frozen reviewed artifact before RWE-candidate promotion."
    },
    {
      id: `${reviewCase.id}-to-rwe-evidence`,
      phase: "to_rwe_candidate" as const,
      title: "Preserve reviewer rationale and checklist evidence",
      status: isAccepted && requiredChecklistDone ? "done" as const : "open" as const,
      detail:
        isAccepted && requiredChecklistDone
          ? "Reviewer rationale and required checklist evidence are preserved alongside the artifact."
          : "Ensure reviewer rationale and required checklist evidence are completed and preserved with the artifact."
    },
    {
      id: `${reviewCase.id}-to-rwe-export`,
      phase: "to_rwe_candidate" as const,
      title: "Reach non-blocking export validation",
      status: exportValidationStatus !== "blocking_issues" ? "done" as const : "open" as const,
      detail:
        exportValidationStatus !== "blocking_issues"
          ? `Export validation is ${exportValidationStatus}.`
          : "Resolve blocking export validation issues before downstream RWE rehearsal."
    },
    {
      id: `${reviewCase.id}-to-rwe-governance`,
      phase: "to_rwe_candidate" as const,
      title: "Promote to safety-case candidate",
      status: dataCollectionProfile.safetyGovernance === "safety_case_candidate" ? "done" as const : "open" as const,
      detail:
        dataCollectionProfile.safetyGovernance === "safety_case_candidate"
          ? "The case is already aligned to safety-case candidate handling."
          : "Advance the case from hazard-review workflow to safety-case candidate handling."
    }
  ];
}

export function deriveValidationProtocol(reviewCase: ReviewCase) {
  const artifact = reviewCase.frozenArtifact;
  const validationIssues = artifact?.validationIssues ?? buildValidationIssues(reviewCase.draft);
  const safetyFlags = artifact?.safetyFlags ?? deriveSafetyFlags(reviewCase);
  const blockers = artifact?.acceptanceBlockers ?? deriveAcceptanceBlockers(reviewCase);
  const finalizationState = artifact?.finalizationState ?? deriveFinalizationState(reviewCase);
  const readiness = deriveValidationReadiness(reviewCase);
  const transitionChecklist = deriveStreamTransitionChecklist(reviewCase);
  const reviewSummary = artifact?.reviewSummary ?? reviewCase.reviewSummary ?? {};
  const requiredChecklist =
    (artifact?.reviewSummary.guidanceChecklist ?? reviewSummary.guidanceChecklist ?? deriveReviewerChecklist(reviewCase)).filter(
      (item) => item.category === "must_confirm" || item.category === "override"
    );
  const completedRequiredChecklist = requiredChecklist.filter(
    (item) => item.completed && item.confirmationNote?.trim()
  ).length;
  const exportValidationStatus =
    artifact?.exportedResources?.summary?.validationStatus ??
    buildExportResources(reviewCase.draft, {
      caseId: reviewCase.id,
      timestamp: reviewCase.updatedAt,
      validationIssues
    }).summary.validationStatus;
  const clinicalCompletenessScore = clampScore(
    100 -
      blockers.length * 30 -
      validationIssues.filter((item) => item.category === "blocking").length * 20 -
      validationIssues.filter((item) => item.category === "warning").length * 8
  );
  const safetyReviewScore = clampScore(
    100 -
      safetyFlags.filter((item) => item.severity === "high").length * 22 -
      safetyFlags.filter((item) => item.severity === "medium").length * 10 -
      (requiredChecklist.length - completedRequiredChecklist) * 12
  );
  const reviewerConfidenceScore = clampScore(
    (reviewSummary.lastDecision ? 35 : 10) +
      (reviewSummary.lastReviewer ? 20 : 0) +
      (reviewSummary.reviewerNotes?.trim() ? 15 : 0) +
      (completedRequiredChecklist ? Math.round((completedRequiredChecklist / Math.max(requiredChecklist.length, 1)) * 20) : 0) +
      (reviewSummary.overrideReason?.trim() ? 10 : 0)
  );
  const exportQualityScore = clampScore(
    (exportValidationStatus === "valid" ? 100 : exportValidationStatus === "warnings_present" ? 76 : 38) -
      validationIssues.filter((item) => item.category === "warning").length * 4
  );
  const overallScore = Math.round(
    (clinicalCompletenessScore + safetyReviewScore + reviewerConfidenceScore + exportQualityScore) / 4
  );

  let promotionRecommendation:
    | "hold_in_remediation"
    | "complete_reviewer_validation"
    | "ready_for_pilot_prep"
    | "ready_for_rwe_candidate"
    | "continue_synthetic_validation";

  if (readiness.stage === "remediation" || finalizationState === "blocked") {
    promotionRecommendation = "hold_in_remediation";
  } else if (transitionChecklist.some((item) => item.phase === "to_pilot_prep" && item.status === "open")) {
    promotionRecommendation = "complete_reviewer_validation";
  } else if (readiness.stage === "rwe_candidate" && transitionChecklist.every((item) => item.status === "done")) {
    promotionRecommendation = "ready_for_rwe_candidate";
  } else if (readiness.stage === "pilot_prep") {
    promotionRecommendation = "ready_for_pilot_prep";
  } else {
    promotionRecommendation = "continue_synthetic_validation";
  }

  return {
    clinicalCompletenessScore,
    safetyReviewScore,
    reviewerConfidenceScore,
    exportQualityScore,
    overallScore,
    promotionRecommendation,
    summary:
      promotionRecommendation === "hold_in_remediation"
        ? "Case should stay in remediation until blocking issues are resolved."
        : promotionRecommendation === "complete_reviewer_validation"
          ? "Case is close, but reviewer confirmations and transition gates still need to be completed."
          : promotionRecommendation === "ready_for_rwe_candidate"
            ? "Case is evidence-complete and suitable for downstream RWE rehearsal."
            : promotionRecommendation === "ready_for_pilot_prep"
              ? "Case is strong enough for pilot-prep walkthroughs and clinician training use."
              : "Case should remain in synthetic validation while evidence depth improves."
  };
}

export function deriveValidationHistoryEntry(reviewCase: ReviewCase): ValidationHistoryEntry {
  const finalizationState = deriveFinalizationState(reviewCase);
  const blockers = deriveAcceptanceBlockers(reviewCase);
  const clinicalConcerns = deriveClinicalConcerns(reviewCase);
  const dataCollectionProfile = reviewCase.dataCollectionProfile ?? deriveDataCollectionProfile(reviewCase);
  const validationReadiness = deriveValidationReadinessFromInputs(
    dataCollectionProfile,
    blockers,
    clinicalConcerns,
    finalizationState
  );
  const validationProtocol = deriveValidationProtocol(reviewCase);

  return {
    id: `valhist-${reviewCase.id}-${Date.now()}`,
    recordedAt: reviewCase.updatedAt || formatCaseTimestamp(),
    finalizationState,
    readinessStage: validationReadiness.stage,
    readinessLabel: validationReadiness.label,
    blockerCount: blockers.length,
    highConcernCount: clinicalConcerns.filter((item) => item.severity === "high").length,
    overallScore: validationProtocol.overallScore,
    clinicalCompletenessScore: validationProtocol.clinicalCompletenessScore,
    safetyReviewScore: validationProtocol.safetyReviewScore,
    reviewerConfidenceScore: validationProtocol.reviewerConfidenceScore,
    exportQualityScore: validationProtocol.exportQualityScore,
    promotionRecommendation: validationProtocol.promotionRecommendation,
    summary: validationProtocol.summary
  };
}

function shouldAppendValidationHistory(
  previousEntry: ValidationHistoryEntry | undefined,
  nextEntry: ValidationHistoryEntry
) {
  if (!previousEntry) {
    return true;
  }

  return !(
    previousEntry.finalizationState === nextEntry.finalizationState &&
    previousEntry.readinessStage === nextEntry.readinessStage &&
    previousEntry.blockerCount === nextEntry.blockerCount &&
    previousEntry.highConcernCount === nextEntry.highConcernCount &&
    previousEntry.overallScore === nextEntry.overallScore &&
    previousEntry.clinicalCompletenessScore === nextEntry.clinicalCompletenessScore &&
    previousEntry.safetyReviewScore === nextEntry.safetyReviewScore &&
    previousEntry.reviewerConfidenceScore === nextEntry.reviewerConfidenceScore &&
    previousEntry.exportQualityScore === nextEntry.exportQualityScore &&
    previousEntry.promotionRecommendation === nextEntry.promotionRecommendation
  );
}

export function deriveValidationHistory(reviewCase: ReviewCase) {
  const currentHistory = reviewCase.frozenArtifact?.validationHistory ?? reviewCase.validationHistory ?? [];
  const nextEntry = deriveValidationHistoryEntry(reviewCase);
  const previousEntry = currentHistory[currentHistory.length - 1];

  if (!shouldAppendValidationHistory(previousEntry, nextEntry)) {
    return currentHistory;
  }

  return [...currentHistory, nextEntry];
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function deriveValidationProtocolAnalytics(cases: ReviewCase[]) {
  const protocols = cases.map((item) => {
    const protocol = deriveValidationProtocol(item);
    const profile = item.dataCollectionProfile ?? deriveDataCollectionProfile(item);
    const transitionChecklist = deriveStreamTransitionChecklist(item);
    return { caseId: item.id, patientLabel: item.patientLabel, profile, protocol, transitionChecklist };
  });

  const recommendationCounts = new Map<string, number>();
  const scoreBands = {
    low: 0,
    medium: 0,
    high: 0
  };
  const streamTotals = new Map<DataCollectionProfile["validationStream"], { total: number; count: number }>();
  const openStepCounts = new Map<string, number>();
  let oneStepFromPilotPrep = 0;
  let oneStepFromRweCandidate = 0;

  for (const item of protocols) {
    recommendationCounts.set(
      item.protocol.promotionRecommendation,
      (recommendationCounts.get(item.protocol.promotionRecommendation) ?? 0) + 1
    );

    if (item.protocol.overallScore >= 80) {
      scoreBands.high += 1;
    } else if (item.protocol.overallScore >= 60) {
      scoreBands.medium += 1;
    } else {
      scoreBands.low += 1;
    }

    const current = streamTotals.get(item.profile.validationStream) ?? { total: 0, count: 0 };
    current.total += item.protocol.overallScore;
    current.count += 1;
    streamTotals.set(item.profile.validationStream, current);

    const pilotOpen = item.transitionChecklist.filter((step) => step.phase === "to_pilot_prep" && step.status === "open");
    const rweOpen = item.transitionChecklist.filter((step) => step.phase === "to_rwe_candidate" && step.status === "open");

    if (pilotOpen.length === 1) {
      oneStepFromPilotPrep += 1;
    }
    if (rweOpen.length === 1) {
      oneStepFromRweCandidate += 1;
    }

    for (const step of [...pilotOpen, ...rweOpen]) {
      openStepCounts.set(step.title, (openStepCounts.get(step.title) ?? 0) + 1);
    }
  }

  const averageOverallScore = protocols.length
    ? Math.round(protocols.reduce((sum, item) => sum + item.protocol.overallScore, 0) / protocols.length)
    : 0;

  return {
    averageOverallScore,
    recommendationCounts: {
      hold_in_remediation: recommendationCounts.get("hold_in_remediation") ?? 0,
      complete_reviewer_validation: recommendationCounts.get("complete_reviewer_validation") ?? 0,
      ready_for_pilot_prep: recommendationCounts.get("ready_for_pilot_prep") ?? 0,
      ready_for_rwe_candidate: recommendationCounts.get("ready_for_rwe_candidate") ?? 0,
      continue_synthetic_validation: recommendationCounts.get("continue_synthetic_validation") ?? 0
    },
    scoreBands,
    streamAverages: {
      phase_1_synthetic: averageFromTotals(streamTotals.get("phase_1_synthetic")),
      phase_1_remediation: averageFromTotals(streamTotals.get("phase_1_remediation")),
      ics_pilot_preparation: averageFromTotals(streamTotals.get("ics_pilot_preparation")),
      rwe_pipeline_candidate: averageFromTotals(streamTotals.get("rwe_pipeline_candidate"))
    },
    transitionProximity: {
      oneStepFromPilotPrep,
      oneStepFromRweCandidate
    },
    topOpenTransitionSteps: [...openStepCounts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 5)
  };
}

export function deriveValidationTrendAnalytics(cases: ReviewCase[]) {
  let casesWithHistory = 0;
  let improvedCases = 0;
  let regressedCases = 0;
  let promotedCases = 0;
  let remediationCases = 0;
  let totalScoreDelta = 0;
  let totalRemediationSnapshots = 0;
  const blockerResolutionCounts = new Map<string, number>();

  for (const reviewCase of cases) {
    const history = reviewCase.frozenArtifact?.validationHistory ?? reviewCase.validationHistory ?? [];

    if (!history.length) {
      continue;
    }

    casesWithHistory += 1;
    const first = history[0];
    const latest = history[history.length - 1];
    const scoreDelta = latest.overallScore - first.overallScore;
    totalScoreDelta += scoreDelta;

    if (scoreDelta > 0) {
      improvedCases += 1;
    } else if (scoreDelta < 0) {
      regressedCases += 1;
    }

    if (first.readinessStage !== latest.readinessStage) {
      const promoted =
        (first.readinessStage === "remediation" && latest.readinessStage === "pilot_prep") ||
        (first.readinessStage === "synthetic_validation" && latest.readinessStage === "pilot_prep") ||
        latest.readinessStage === "rwe_candidate";
      if (promoted) {
        promotedCases += 1;
      }
    }

    for (const entry of history) {
      if (entry.readinessStage === "remediation") {
        remediationCases += 1;
        totalRemediationSnapshots += 1;
      }
    }

    if (latest.blockerCount < first.blockerCount) {
      blockerResolutionCounts.set(
        latest.readinessLabel,
        (blockerResolutionCounts.get(latest.readinessLabel) ?? 0) + (first.blockerCount - latest.blockerCount)
      );
    }
  }

  return {
    casesWithHistory,
    improvedCases,
    regressedCases,
    promotedCases,
    averageScoreDelta: casesWithHistory ? Math.round(totalScoreDelta / casesWithHistory) : 0,
    averageRemediationSnapshots: remediationCases ? Math.round((totalRemediationSnapshots / Math.max(casesWithHistory, 1)) * 10) / 10 : 0,
    topResolvedStages: [...blockerResolutionCounts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 3)
  };
}

export function deriveValidationStageFailureAnalytics(cases: ReviewCase[]) {
  const stageCounts = new Map<string, number>();
  const stepCounts = new Map<string, number>();

  for (const reviewCase of cases) {
    const transitionChecklist = deriveStreamTransitionChecklist(reviewCase);
    const openSteps = transitionChecklist.filter((item) => item.status === "open");

    for (const step of openSteps) {
      const stageLabel = step.phase === "to_pilot_prep" ? "Pilot prep transition" : "RWE candidate transition";
      stageCounts.set(stageLabel, (stageCounts.get(stageLabel) ?? 0) + 1);
      stepCounts.set(`${stageLabel}::${step.title}`, (stepCounts.get(`${stageLabel}::${step.title}`) ?? 0) + 1);
    }
  }

  const topFailedStages = [...stageCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 3);

  const topFailedSteps = [...stepCounts.entries()]
    .map(([key, count]) => {
      const [stage, label] = key.split("::");
      return { stage, label, count };
    })
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);

  return {
    topFailedStages,
    topFailedSteps
  };
}

export function deriveValidationFailureDrilldown(
  cases: ReviewCase[],
  filters?: { stage?: string; step?: string; action?: string }
) {
  const requestedStage = filters?.stage?.trim();
  const requestedStep = filters?.step?.trim();
  const requestedAction = filters?.action?.trim();

  return cases
    .map((reviewCase) => {
      const transitionChecklist = deriveStreamTransitionChecklist(reviewCase);
      const openSteps = transitionChecklist.filter((item) => item.status === "open");
      const protocol = deriveValidationProtocol(reviewCase);
      const readiness = deriveValidationReadiness(reviewCase);
      const blockers = deriveAcceptanceBlockers(reviewCase);
      const guidance = deriveReviewerGuidance(reviewCase);
      const checklist = deriveReviewerChecklist(reviewCase);
      const concerns = deriveClinicalConcerns(reviewCase);
      const remediationResolutions = reviewCase.frozenArtifact?.remediationActionResolutions ?? reviewCase.remediationActionResolutions ?? [];
      const matchingSteps = openSteps.map((item) => {
        const remediationActions =
          item.title === "Clear blocking clinical issues"
            ? [
                ...blockers.slice(0, 3).map((detail) => ({
                  label: "Resolve blocker",
                  detail
                })),
                ...concerns
                  .filter((entry) => entry.severity === "high")
                  .slice(0, 2)
                  .map((entry) => ({
                    label: "Close high-priority concern",
                    detail: `${entry.label}: ${entry.detail}`
                  }))
              ]
            : item.title === "Complete reviewer confirmations"
              ? checklist
                  .filter(
                    (entry) =>
                      (entry.category === "must_confirm" || entry.category === "override") &&
                      (!entry.completed || !entry.confirmationNote?.trim())
                  )
                  .slice(0, 4)
                  .map((entry) => ({
                    label: "Complete reviewer checklist",
                    detail: entry.confirmationNote?.trim()
                      ? entry.title
                      : `${entry.title} and capture a confirmation note`
                  }))
              : item.title === "Reach pilot-ready governance state"
                ? [
                    {
                      label: "Promote validation stream",
                      detail: "Move the case out of remediation/synthetic validation into the regional pilot-preparation stream."
                    },
                    {
                      label: "Confirm governance readiness",
                      detail: "Close remaining hazard-review items before pilot-prep promotion."
                    }
                  ]
                : item.title === "Accept and freeze the reviewed artifact"
                  ? [
                      {
                        label: "Complete acceptance review",
                        detail: "Resolve remaining blockers and capture a final reviewer decision."
                      },
                      {
                        label: "Freeze artifact",
                        detail: "Accept the case so the reviewed artifact is preserved for downstream evidence use."
                      }
                    ]
                  : item.title === "Preserve reviewer rationale and checklist evidence"
                    ? [
                        ...guidance.slice(0, 2).map((entry) => ({
                          label: "Capture reviewer rationale",
                          detail: entry.instruction
                        })),
                        ...checklist
                          .filter((entry) => !entry.completed || !entry.confirmationNote?.trim())
                          .slice(0, 2)
                          .map((entry) => ({
                            label: "Finish checklist evidence",
                            detail: `${entry.title} and save the confirmation note`
                          }))
                      ]
                    : item.title === "Reach non-blocking export validation"
                      ? [
                          {
                            label: "Resolve export blockers",
                            detail: "Fill missing required structured values and re-run validation until export is non-blocking."
                          }
                        ]
                      : item.title === "Promote to safety-case candidate"
                        ? [
                            {
                              label: "Advance governance state",
                              detail: "Promote the case from hazard-review workflow into safety-case candidate handling."
                            }
                          ]
                        : [
                            {
                              label: "Review transition detail",
                              detail: item.detail
                            }
                          ];

        return {
          id: item.id,
          title: item.title,
          stage: item.phase === "to_pilot_prep" ? "Pilot prep transition" : "RWE candidate transition",
          detail: item.detail,
          remediationActions: remediationActions.map((action) => {
            const resolution = [...remediationResolutions]
              .reverse()
              .find((entry) => entry.stepId === item.id && entry.actionLabel === action.label);

            return {
              ...action,
              status: resolution?.status ?? "open",
              updatedAt: resolution?.updatedAt,
              updatedBy: resolution?.updatedBy
            };
          })
        };
      }).filter((item) => {
        const stageMatches = requestedStage ? item.stage === requestedStage : true;
        const stepMatches = requestedStep ? item.title === requestedStep : true;
        const actionMatches = requestedAction
          ? item.remediationActions.some((action) => action.label === requestedAction)
          : true;
        return stageMatches && stepMatches && actionMatches;
      });

      if (!matchingSteps.length) {
        return null;
      }

      return {
        id: reviewCase.id,
        patientLabel: reviewCase.patientLabel,
        summary: reviewCase.summary,
        overallScore: protocol.overallScore,
        recommendation: protocol.promotionRecommendation,
        readinessLabel: readiness.label,
        matchingSteps
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((left, right) => right.matchingSteps.length - left.matchingSteps.length || left.overallScore - right.overallScore);
}

function averageFromTotals(value: { total: number; count: number } | undefined) {
  if (!value?.count) return 0;
  return Math.round(value.total / value.count);
}

export function deriveValidationDossierAnalytics(cases: ReviewCase[]) {
  const sectionCounts = new Map<string, number>();
  const caseSummaries = cases.map((item) => {
    const protocol = deriveValidationProtocol(item);
    const readiness = deriveValidationReadiness(item);
    const transitionChecklist = deriveStreamTransitionChecklist(item);
    const blockers = deriveAcceptanceBlockers(item);
    const concerns = deriveClinicalConcerns(item);
    const guidance = deriveReviewerGuidance(item);
    const checklist = deriveReviewerChecklist(item);
    const feedbackLinked = Boolean(item.reviewSummary?.lastReviewer) || Boolean(item.reviewSummary?.reviewerNotes?.trim());

    const missingSections: string[] = [];

    if (blockers.length > 0 || readiness.stage === "remediation") {
      missingSections.push("Blocker resolution");
    }

    if (checklist.some((entry) => (entry.category === "must_confirm" || entry.category === "override") && (!entry.completed || !entry.confirmationNote?.trim()))) {
      missingSections.push("Reviewer checklist evidence");
    }

    if (guidance.length > 0 && !feedbackLinked) {
      missingSections.push("Reviewer rationale");
    }

    if (transitionChecklist.some((entry) => entry.status === "open")) {
      missingSections.push("Transition gates");
    }

    if (protocol.exportQualityScore < 80) {
      missingSections.push("Export quality");
    }

    if (concerns.some((entry) => entry.severity === "high")) {
      missingSections.push("High-priority concern closure");
    }

    for (const section of missingSections) {
      sectionCounts.set(section, (sectionCounts.get(section) ?? 0) + 1);
    }

    return {
      caseId: item.id,
      patientLabel: item.patientLabel,
      summary: item.summary,
      overallScore: protocol.overallScore,
      recommendation: protocol.promotionRecommendation,
      missingSections,
      isStrong: protocol.overallScore >= 80 && missingSections.length === 0,
      isIncomplete: missingSections.length > 0
    };
  });

  return {
    strongDossiers: caseSummaries.filter((item) => item.isStrong).length,
    incompleteDossiers: caseSummaries.filter((item) => item.isIncomplete).length,
    topMissingSections: [...sectionCounts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 5),
    spotlightCases: [...caseSummaries]
      .sort((left, right) => {
        if (left.missingSections.length !== right.missingSections.length) {
          return left.missingSections.length - right.missingSections.length;
        }
        return right.overallScore - left.overallScore;
      })
      .slice(0, 4)
  };
}

export function deriveValidationDossierBatchViews(cases: ReviewCase[]) {
  const dossiers = cases.map((item) => {
    const dossier = deriveValidationDossierAnalytics([item]);
    const protocol = deriveValidationProtocol(item);
    const readiness = deriveValidationReadiness(item);
    const profile = item.dataCollectionProfile ?? deriveDataCollectionProfile(item);
    const blockers = deriveAcceptanceBlockers(item);
    const missingSections = dossier.spotlightCases[0]?.missingSections ?? [];

    return {
      id: item.id,
      patientLabel: item.patientLabel,
      summary: item.summary,
      overallScore: protocol.overallScore,
      recommendation: protocol.promotionRecommendation,
      readinessLabel: readiness.label,
      validationStream: profile.validationStream,
      blockerCount: blockers.length,
      missingSections
    };
  });

  return {
    strong: dossiers
      .filter((item) => item.overallScore >= 80 && item.missingSections.length === 0)
      .sort((left, right) => right.overallScore - left.overallScore),
    incomplete: dossiers
      .filter((item) => item.missingSections.length > 0)
      .sort((left, right) => right.missingSections.length - left.missingSections.length || right.overallScore - left.overallScore),
    nearPromotion: dossiers
      .filter(
        (item) =>
          item.recommendation === "complete_reviewer_validation" ||
          item.recommendation === "ready_for_pilot_prep" ||
          item.recommendation === "ready_for_rwe_candidate"
      )
      .sort((left, right) => right.overallScore - left.overallScore),
    remediation: dossiers
      .filter((item) => item.recommendation === "hold_in_remediation" || item.validationStream === "phase_1_remediation")
      .sort((left, right) => right.blockerCount - left.blockerCount || right.overallScore - left.overallScore)
  };
}

export function deriveValidationMeetingPacket(
  cases: ReviewCase[],
  filter: "strong" | "incomplete" | "near-promotion" | "remediation" = "strong"
) {
  const batches = deriveValidationDossierBatchViews(cases);
  const selected =
    filter === "incomplete"
      ? batches.incomplete
      : filter === "near-promotion"
        ? batches.nearPromotion
        : filter === "remediation"
          ? batches.remediation
          : batches.strong;

  const topMissingSections = new Map<string, number>();

  for (const item of selected) {
    for (const section of item.missingSections) {
      topMissingSections.set(section, (topMissingSections.get(section) ?? 0) + 1);
    }
  }

  const averageScore = selected.length
    ? Math.round(selected.reduce((total, item) => total + item.overallScore, 0) / selected.length)
    : 0;

  const totalBlockers = selected.reduce((total, item) => total + item.blockerCount, 0);

  const agenda =
    filter === "strong"
      ? [
          "Confirm these cases are ready for internal validation review without more dossier assembly.",
          "Select the strongest packets for pilot narrative, evidence walkthroughs, and reviewer rehearsal."
        ]
      : filter === "incomplete"
        ? [
            "Identify the dossier sections that are still missing across this cohort.",
            "Decide which missing evidence can be filled immediately and which cases should pause."
          ]
        : filter === "near-promotion"
          ? [
              "Review the last open steps blocking promotion into pilot-prep or RWE-candidate status.",
              "Assign final reviewer, validation, or governance actions to move these cases forward."
            ]
          : [
              "Focus on the blockers keeping these cases in remediation.",
              "Decide whether each case should be repaired, deprioritized, or recycled into a synthetic validation pass."
            ];

  const summary =
    filter === "strong"
      ? "High-confidence dossiers that are ready for internal review meetings and pilot-story selection."
      : filter === "incomplete"
        ? "Cases that still need dossier assembly work before they can support internal promotion discussions."
        : filter === "near-promotion"
          ? "Cases closest to movement into pilot-prep or RWE-candidate status."
          : "Cases still stuck in remediation and needing focused resolution decisions.";

  return {
    filter,
    caseCount: selected.length,
    averageScore,
    totalBlockers,
    summary,
    agenda,
    topMissingSections: [...topMissingSections.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 4),
    cases: selected
  };
}
