import assert from "node:assert/strict";

import { reviewCases } from "../lib/mock-data";
import type { ReviewCase } from "../lib/types";
import {
  buildEvidencePayload,
  buildValidationIssues,
  createCoordinationRiskTriage,
  createReviewCaseFromIntake,
  createFrozenArtifact,
  deriveAcceptanceBlockers,
  deriveChecklistAcceptanceBlockers,
  deriveClinicalConcerns,
  deriveDataCollectionAnalytics,
  deriveMeetingOutcomeAnalytics,
  deriveMeetingOutcomeEscalation,
  deriveMeetingOutcomeNextAction,
  deriveMeetingOwnerWorkload,
  deriveMeetingOutcomePriority,
  deriveRemediationActionCohorts,
  deriveRemediationActionOwner,
  deriveRemediationChurnRisk,
  deriveRemediationHandoffChurnAnalytics,
  deriveRemediationOwnerLoad,
  createRemediationActionResolution,
  deriveRemediationResolutionAnalytics,
  deriveRemediationStalledAlerts,
  deriveRemediationTurnaroundAnalytics,
  deriveMeetingOutcomeSla,
  deriveDataCollectionProfile,
  deriveFinalizationState,
  deriveReviewAnalytics,
  deriveReviewerChecklist,
  deriveReviewerGuidance,
  deriveSafetyFlags,
  deriveValidationActionQueues,
  deriveValidationDossierBatchViews,
  deriveValidationDossierAnalytics,
  deriveValidationFailureDrilldown,
  deriveValidationMeetingPacket,
  deriveValidationProtocolAnalytics,
  deriveValidationStageFailureAnalytics,
  deriveValidationTrendAnalytics,
  deriveValidationProtocol,
  deriveValidationReadiness,
  normalizeReviewCaseForPersistence
} from "../lib/workflow";

function getCase(id: string): ReviewCase {
  const reviewCase = reviewCases.find((item) => item.id === id);
  assert.ok(reviewCase, `Expected seeded case ${id} to exist`);
  return structuredClone(reviewCase);
}

function formatCaseTimestamp(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function hoursAgo(hours: number) {
  return formatCaseTimestamp(new Date(Date.now() - hours * 60 * 60 * 1000));
}

function run() {
  const blockedObservationCase = getCase("case-002");
  const blockedObservationReasons = deriveAcceptanceBlockers(blockedObservationCase);
  assert.ok(
    blockedObservationReasons.includes("Blood pressure observation is incomplete and must be filled before acceptance."),
    "Deferred hypertension case should block acceptance until blood pressure is filled"
  );

  const highRiskMedicationCase = getCase("case-001");
  const highRiskFlags = deriveSafetyFlags(highRiskMedicationCase);
  assert.ok(
    highRiskFlags.some((flag) => flag.id.endsWith("-allergy")),
    "High-risk medication case should surface allergy conflict"
  );
  assert.ok(
    deriveAcceptanceBlockers(highRiskMedicationCase).includes(
      "A high-severity issue is present and requires an override reason before acceptance."
    ),
    "High-risk medication case should require an override reason"
  );

  const acceptedCase = getCase("case-005");
  assert.equal(acceptedCase.status, "accepted", "Accepted scenario should be seeded as accepted");
  assert.ok(acceptedCase.frozenArtifact, "Accepted scenario should carry a frozen artifact");

  const acceptedEvidence = buildEvidencePayload(acceptedCase);
  assert.equal(acceptedEvidence.artifactState, "frozen", "Accepted evidence should read from frozen artifact");
  assert.equal(acceptedEvidence.validationIssues.length, 0, "Accepted frozen artifact should validate cleanly");
  assert.equal(acceptedEvidence.reviewSummary.lastDecision, "accept", "Accepted artifact should preserve reviewer decision");
  assert.equal(acceptedEvidence.exportedResources.resourceType, "Bundle", "Accepted evidence should export a FHIR bundle");
  assert.equal(acceptedEvidence.exportedResources.fhirVersion, "4.0.1", "Accepted evidence should declare the FHIR version");
  assert.equal(
    acceptedEvidence.finalizationState,
    "ready",
    "Accepted frozen artifact should preserve a ready finalization state"
  );
  assert.equal(
    acceptedEvidence.validationReadiness.stage,
    "rwe_candidate",
    "Accepted frozen evidence should carry the RWE validation-readiness stage"
  );
  assert.ok(
    acceptedEvidence.transitionChecklist.some(
      (item) => item.phase === "to_rwe_candidate" && item.title === "Accept and freeze the reviewed artifact" && item.status === "done"
    ),
    "Accepted frozen evidence should mark the RWE freeze transition step as done"
  );
  assert.equal(
    acceptedEvidence.dataCollectionProfile.validationStream,
    "rwe_pipeline_candidate",
    "Accepted evidence should be promoted into the RWE-ready collection profile"
  );
  assert.equal(
    acceptedEvidence.exportedResources.summary.validationStatus,
    "valid",
    "Accepted valid evidence should export with a valid bundle summary"
  );
  assert.ok(
    acceptedEvidence.exportedResources.entry.some((entry) => entry.resource.resourceType === "Encounter"),
    "Accepted evidence bundle should include an encounter resource entry"
  );

  const promotableAcceptedCase = getCase("case-003");
  promotableAcceptedCase.status = "accepted";
  promotableAcceptedCase.reviewSummary = {
    lastReviewer: "Dr Test",
    lastDecision: "accept",
    lastDecisionAt: "2026-04-24 09:15",
    reviewerNotes: "Reviewed and approved for proof export.",
    overrideReason: ""
  };
  promotableAcceptedCase.frozenArtifact = createFrozenArtifact(promotableAcceptedCase, {
    frozenAt: "2026-04-24 09:15",
    frozenBy: "Dr Test"
  });

  const normalizedAcceptedCase = normalizeReviewCaseForPersistence(promotableAcceptedCase);
  assert.ok(normalizedAcceptedCase.frozenArtifact, "Accepted case should be normalized with a frozen artifact");
  assert.equal(
    normalizedAcceptedCase.frozenArtifact?.frozenBy,
    "Dr Test",
    "Frozen artifact should preserve reviewer attribution"
  );
  assert.ok(
    (normalizedAcceptedCase.validationHistory?.length ?? 0) >= 1,
    "Normalized cases should gain an initial validation history entry"
  );
  assert.equal(
    normalizedAcceptedCase.frozenArtifact?.validationHistory?.length,
    normalizedAcceptedCase.validationHistory?.length,
    "Frozen artifacts should preserve validation history"
  );

  const validationTarget = getCase("case-002");
  const validationIssues = buildValidationIssues(validationTarget.draft);
  assert.ok(
    validationIssues.some((issue) => issue.label === "Blood pressure value missing"),
    "Validation layer should flag missing blood pressure values"
  );
  const invalidEvidence = buildEvidencePayload(validationTarget);
  assert.equal(
    invalidEvidence.finalizationState,
    "blocked",
    "Incomplete cases should remain blocked in the evidence layer"
  );
  assert.equal(
    invalidEvidence.validationReadiness.stage,
    "remediation",
    "Blocked evidence should carry remediation validation-readiness"
  );
  assert.ok(
    invalidEvidence.transitionChecklist.some(
      (item) => item.phase === "to_pilot_prep" && item.title === "Clear blocking clinical issues" && item.status === "open"
    ),
    "Blocked evidence should leave the pilot-prep blocker-clearing step open"
  );
  assert.equal(
    invalidEvidence.dataCollectionProfile.validationStream,
    "phase_1_remediation",
    "Blocked synthetic cases should stay in the remediation validation stream"
  );
  assert.equal(
    invalidEvidence.exportedResources.summary.validationStatus,
    "blocking_issues",
    "Incomplete cases should export with a blocking-issues bundle summary"
  );
  const normalizedValidationCase = normalizeReviewCaseForPersistence(validationTarget);
  assert.equal(
    normalizedValidationCase.validationHistory?.length,
    1,
    "First normalization should create a single validation history entry"
  );
  const progressedValidationCase = normalizeReviewCaseForPersistence({
    ...normalizedValidationCase,
    updatedAt: "2026-04-26 10:00",
    draft: {
      ...normalizedValidationCase.draft,
      observations: normalizedValidationCase.draft.observations.map((item) =>
        item.codeText === "Blood pressure" ? { ...item, valueText: "138/84" } : item
      )
    },
    reviewSummary: {
      lastReviewer: "Dr Progress",
      lastDecision: "defer",
      lastDecisionAt: "2026-04-26 10:00",
      reviewerNotes: "Vitals completed and ready for the next review pass.",
      overrideReason: ""
    }
  });
  assert.equal(
    progressedValidationCase.validationHistory?.length,
    2,
    "Validation history should append when protocol and readiness materially change"
  );
  assert.equal(
    progressedValidationCase.validationHistory?.[0]?.readinessStage,
    "remediation",
    "Initial validation history should capture the blocked remediation state"
  );
  assert.equal(
    progressedValidationCase.validationHistory?.[1]?.readinessStage,
    "pilot_prep",
    "Later validation history should capture progression into pilot-prep readiness"
  );

  const analytics = deriveReviewAnalytics(reviewCases);
  assert.equal(analytics.decisionCounts.accept, 1, "Analytics should count the accepted seeded case");
  assert.equal(analytics.decisionCounts.defer, 1, "Analytics should count the deferred seeded case");
  assert.ok(
    analytics.blockerCategories.some((item) => item.label === "Missing vitals"),
    "Analytics should categorize missing blood pressure blockers as missing vitals"
  );
  assert.ok(
    analytics.safetyCategories.some((item) => item.label === "Possible allergy conflict"),
    "Analytics should surface recurring safety flag labels"
  );

  const dataCollectionAnalytics = deriveDataCollectionAnalytics(reviewCases);
  assert.equal(
    dataCollectionAnalytics.streamCounts.rwe_pipeline_candidate,
    1,
    "Accepted seeded artifacts should count toward the RWE candidate stream"
  );
  assert.ok(
    dataCollectionAnalytics.streamCounts.phase_1_remediation >= 1,
    "Blocked synthetic cases should count toward the remediation stream"
  );
  assert.ok(
    dataCollectionAnalytics.trainingCounts.training_ready >= 1,
    "Reviewable synthetic cases should contribute to the training-ready cohort"
  );
  assert.equal(
    deriveValidationProtocol(getCase("case-002")).promotionRecommendation,
    "hold_in_remediation",
    "Blocked remediation cases should be held in remediation by the validation protocol"
  );
  assert.equal(
    deriveValidationProtocol(getCase("case-005")).promotionRecommendation,
    "ready_for_rwe_candidate",
    "Accepted frozen artifacts should be recommended for RWE-candidate use"
  );
  const validationProtocolAnalytics = deriveValidationProtocolAnalytics(reviewCases);
  assert.ok(
    validationProtocolAnalytics.scoreBands.high >= 1,
    "Validation protocol analytics should surface at least one high-scoring case"
  );
  assert.ok(
    validationProtocolAnalytics.streamAverages.rwe_pipeline_candidate >= validationProtocolAnalytics.streamAverages.phase_1_remediation,
    "RWE candidate average score should be at least as high as remediation average score"
  );
  const trendSeedBase = normalizeReviewCaseForPersistence(getCase("case-002"));
  const trendSeedProgressed = normalizeReviewCaseForPersistence({
    ...trendSeedBase,
    updatedAt: "2026-04-26 11:00",
    draft: {
      ...trendSeedBase.draft,
      observations: trendSeedBase.draft.observations.map((item) =>
        item.codeText === "Blood pressure" ? { ...item, valueText: "136/82" } : item
      )
    },
    reviewSummary: {
      lastReviewer: "Dr Trend",
      lastDecision: "defer",
      lastDecisionAt: "2026-04-26 11:00",
      reviewerNotes: "Improved after vitals completion.",
      overrideReason: ""
    }
  });
  const validationTrendAnalytics = deriveValidationTrendAnalytics([
    trendSeedProgressed,
    normalizedAcceptedCase
  ]);
  assert.equal(
    validationTrendAnalytics.casesWithHistory,
    2,
    "Trend analytics should count cases with persisted validation history"
  );
  assert.ok(
    validationTrendAnalytics.improvedCases >= 1,
    "Trend analytics should detect improved cases across validation history"
  );
  assert.ok(
    validationTrendAnalytics.promotedCases >= 1,
    "Trend analytics should detect readiness promotion across validation history"
  );
  const validationStageFailureAnalytics = deriveValidationStageFailureAnalytics(reviewCases);
  assert.ok(
    validationStageFailureAnalytics.topFailedStages.some((item) => item.label === "Pilot prep transition"),
    "Stage failure analytics should detect pilot-prep transition failures in the seeded cohort"
  );
  assert.ok(
    validationStageFailureAnalytics.topFailedSteps.some((item) => item.label === "Clear blocking clinical issues"),
    "Stage failure analytics should surface the most common failed transition step"
  );
  const failureDrilldown = deriveValidationFailureDrilldown(reviewCases, {
    stage: "Pilot prep transition",
    step: "Clear blocking clinical issues"
  });
  assert.ok(
    failureDrilldown.some((item) => item.id === "case-002"),
    "Failure drilldown should return the exact cases blocked by a failed transition step"
  );
  assert.ok(
    failureDrilldown
      .find((item) => item.id === "case-002")
      ?.matchingSteps[0]
      ?.remediationActions.some((action) => action.label === "Resolve blocker"),
    "Failure drilldown should include remediation actions for the blocked transition step"
  );
  const remediationActionCohorts = deriveRemediationActionCohorts(reviewCases);
  assert.ok(
    remediationActionCohorts.some((item) => item.label === "Resolve blocker"),
    "Remediation action cohorts should surface common recovery actions across the cohort"
  );
  const actionDrilldown = deriveValidationFailureDrilldown(reviewCases, {
    action: "Resolve blocker"
  });
  assert.ok(
    actionDrilldown.some((item) => item.id === "case-002"),
    "Action-based drilldown should return the exact cases needing a selected remediation action"
  );
  const remediationTrackedCase = structuredClone(getCase("case-002"));
  remediationTrackedCase.remediationActionResolutions = [
    {
      id: "remed-1",
      stepId: "case-002-to-pilot-blockers",
      stepTitle: "Clear blocking clinical issues",
      stage: "Pilot prep transition",
      actionLabel: "Resolve blocker",
      detail: "Blood pressure observation is incomplete and must be filled before acceptance.",
      status: "resolved",
      updatedAt: "2026-04-26 12:00",
      updatedBy: "Remediation Workspace"
    }
  ];
  const remediationResolutionAnalytics = deriveRemediationResolutionAnalytics([remediationTrackedCase]);
  assert.ok(
    remediationResolutionAnalytics.some((item) => item.label === "Resolve blocker" && item.count === 1),
    "Remediation completion analytics should count resolved actions by label"
  );
  remediationTrackedCase.remediationActionResolutions = [
    {
      id: "remed-0",
      stepId: "case-002-to-pilot-blockers",
      stepTitle: "Clear blocking clinical issues",
      stage: "Pilot prep transition",
      actionLabel: "Resolve blocker",
      detail: "Blood pressure observation is incomplete and must be filled before acceptance.",
      status: "open",
      updatedAt: "2026-04-26 10:00",
      updatedBy: "Remediation Workspace"
    },
    ...remediationTrackedCase.remediationActionResolutions
  ];
  const remediationTurnaroundAnalytics = deriveRemediationTurnaroundAnalytics([remediationTrackedCase]);
  assert.ok(
    remediationTurnaroundAnalytics.some((item) => item.label === "Resolve blocker" && item.averageMinutes === 120),
    "Remediation turnaround analytics should calculate average closure time from open to resolved"
  );
  remediationTrackedCase.remediationActionResolutions = [
    {
      id: "remed-stalled",
      stepId: "case-002-to-pilot-checklist",
      stepTitle: "Complete reviewer confirmations",
      stage: "Pilot prep transition",
      actionLabel: "Complete reviewer checklist",
      detail: "Finish required reviewer checklist items and capture confirmation notes before pilot-prep promotion.",
      status: "open",
      updatedAt: "2026-04-24 08:00",
      updatedBy: "Remediation Workspace",
      owner: "Clinical Review Lead"
    }
  ];
  const remediationStalledAlerts = deriveRemediationStalledAlerts([remediationTrackedCase]);
  assert.ok(
    remediationStalledAlerts.some((item) => item.actionLabel === "Complete reviewer checklist"),
    "Stalled remediation alerts should flag open actions that exceed their turnaround threshold"
  );
  assert.equal(
    deriveRemediationActionOwner(remediationTrackedCase, "Complete reviewer checklist"),
    "Clinical Review Lead",
    "Remediation routing should assign a sensible fallback owner when no meeting owner is present"
  );
  assert.equal(
    remediationStalledAlerts[0]?.owner,
    "Clinical Review Lead",
    "Stalled remediation alerts should surface the routed owner"
  );
  const remediationOwnerLoad = deriveRemediationOwnerLoad([remediationTrackedCase]);
  assert.ok(
    remediationOwnerLoad.some((item) => item.owner === "Clinical Review Lead" && item.count >= 1),
    "Owner-level stalled load should aggregate stalled remediation alerts by routed owner"
  );
  const reassignedRemediationCase = structuredClone(remediationTrackedCase);
  reassignedRemediationCase.remediationActionResolutions = [
    ...(reassignedRemediationCase.remediationActionResolutions ?? []),
    {
      id: "remed-reassigned",
      stepId: "case-002-to-pilot-checklist",
      stepTitle: "Complete reviewer confirmations",
      stage: "Pilot prep transition",
      actionLabel: "Complete reviewer checklist",
      detail: "Finish required reviewer checklist items and capture confirmation notes before pilot-prep promotion.",
      status: "open",
      updatedAt: "2026-04-24 09:30",
      updatedBy: "Ops Dashboard",
      owner: "Operations Lead",
      handoffNote: "Rebalanced from clinical review due to backlog."
    }
  ];
  const reassignedAlerts = deriveRemediationStalledAlerts([reassignedRemediationCase]);
  assert.equal(
    reassignedAlerts[0]?.owner,
    "Operations Lead",
    "The latest reassignment should control the routed owner for stalled remediation alerts"
  );
  assert.equal(
    reassignedAlerts[0]?.handoffNote,
    "Rebalanced from clinical review due to backlog.",
    "The latest reassignment note should flow into stalled remediation alerts"
  );
  assert.equal(
    reassignedAlerts[0]?.handoffHistory.length,
    2,
    "Stalled remediation alerts should preserve reassignment history for repeated owner changes"
  );
  assert.equal(
    reassignedAlerts[0]?.handoffHistory[1]?.toOwner,
    "Operations Lead",
    "The latest remediation handoff history entry should reflect the most recent reassignment target"
  );
  const remediationHandoffChurnAnalytics = deriveRemediationHandoffChurnAnalytics([reassignedRemediationCase]);
  assert.equal(
    remediationHandoffChurnAnalytics.totalChurnEvents,
    1,
    "Remediation handoff churn should count repeated owner changes after the initial assignment"
  );
  assert.equal(
    remediationHandoffChurnAnalytics.topCases[0]?.latestOwner,
    "Operations Lead",
    "Remediation handoff churn should surface the latest owner for the highest-churn case"
  );
  assert.equal(
    remediationHandoffChurnAnalytics.topActions[0]?.label,
    "Complete reviewer checklist",
    "Remediation handoff churn should aggregate repeated owner changes by action label"
  );
  const remediationChurnRisk = deriveRemediationChurnRisk([reassignedRemediationCase]);
  assert.equal(
    remediationChurnRisk[0]?.caseId,
    "case-002",
    "Coordination risk should surface cases with handoff churn and stalled remediation"
  );
  assert.equal(
    remediationChurnRisk[0]?.level,
    "high",
    "Coordination risk should escalate repeated handoffs plus stalled remediation into a high-risk signal"
  );
  assert.ok(
    remediationChurnRisk[0]?.drivers.some((item) => item.includes("owner change")),
    "Coordination risk should explain owner-change churn as a driver"
  );
  const triagedRiskCase = {
    ...reassignedRemediationCase,
    coordinationRiskTriage: {
      ...createCoordinationRiskTriage({
        status: "escalated",
        owner: "Clinical Ops Lead",
        note: "Needs focused recovery review before the next validation meeting.",
        updatedBy: "Ops Dashboard"
      }),
      updatedAt: "2026-04-20 09:00"
    }
  };
  const triagedRisk = deriveRemediationChurnRisk([triagedRiskCase]);
  assert.equal(
    triagedRisk[0]?.triage?.status,
    "escalated",
    "Coordination risk should preserve persisted triage status"
  );
  assert.equal(
    triagedRisk[0]?.triage?.owner,
    "Clinical Ops Lead",
    "Coordination risk should preserve the assigned triage owner"
  );
  assert.equal(
    triagedRisk[0]?.triageSlaStatus,
    "overdue",
    "Coordination risk should flag stale escalated triage decisions as overdue"
  );
  assert.ok(
    (triagedRisk[0]?.triageAgeHours ?? 0) > (triagedRisk[0]?.triageThresholdHours ?? 0),
    "Coordination risk should expose triage age against the target threshold"
  );
  const validationDossierAnalytics = deriveValidationDossierAnalytics(reviewCases);
  assert.ok(
    validationDossierAnalytics.incompleteDossiers >= 1,
    "Dossier analytics should surface incomplete dossier packages in the seeded cohort"
  );
  assert.ok(
    validationDossierAnalytics.topMissingSections.length >= 1,
    "Dossier analytics should report the most common missing dossier sections"
  );
  const validationDossierBatchViews = deriveValidationDossierBatchViews(reviewCases);
  assert.ok(
    validationDossierBatchViews.remediation.some((item) => item.id === "case-002"),
    "Blocked remediation case should appear in the remediation dossier batch"
  );
  assert.ok(
    validationDossierBatchViews.strong.some((item) => item.id === "case-005"),
    "Accepted strong artifact should appear in the strong dossier batch"
  );
  const validationMeetingPacket = deriveValidationMeetingPacket(reviewCases, "near-promotion");
  assert.ok(
    validationMeetingPacket.cases.some((item) => item.id === "case-005"),
    "Accepted strong artifact should appear in the near-promotion meeting packet"
  );
  assert.ok(
    validationMeetingPacket.agenda.length >= 2,
    "Meeting packet should provide agenda framing for internal review sessions"
  );
  const casesWithMeetingOutcomes = structuredClone(reviewCases);
  casesWithMeetingOutcomes[0].meetingOutcome = {
    disposition: "promote",
    note: "Good candidate for the next internal promotion review.",
    reviewedAt: "2026-04-24 11:30",
    reviewedBy: "Aksh Internal Review",
    followThroughOwner: "Olivia Ops",
    handoffNote: "Reassigned after workload review.",
    handoffBy: "Ops Dashboard",
    handoffAt: "2026-04-25 09:10",
    handoffHistory: [
      {
        id: "handoff-1",
        fromOwner: "Clinical Review",
        toOwner: "Olivia Ops",
        note: "Reassigned after workload review.",
        by: "Ops Dashboard",
        at: "2026-04-25 09:10"
      }
    ]
  };
  casesWithMeetingOutcomes[1].meetingOutcome = {
    disposition: "needs_evidence",
    note: "Need clearer evidence before promotion discussion.",
    reviewedAt: hoursAgo(2),
    reviewedBy: "Aksh Internal Review",
    followThroughOwner: "Ravi Clinical"
  };
  const meetingOutcomeAnalytics = deriveMeetingOutcomeAnalytics(casesWithMeetingOutcomes);
  assert.equal(meetingOutcomeAnalytics.counts.promote, 1, "Meeting analytics should count promoted cases");
  assert.equal(
    meetingOutcomeAnalytics.counts.needs_evidence,
    1,
    "Meeting analytics should count cases still needing evidence"
  );
  assert.ok(
    meetingOutcomeAnalytics.missingCount >= 1,
    "Meeting analytics should still report uncaptured cases in the cohort"
  );
  assert.equal(
    deriveMeetingOutcomePriority(casesWithMeetingOutcomes[0]).priority,
    "promote",
    "Promoted meeting outcomes should sort to the top of follow-through views"
  );
  assert.equal(
    deriveMeetingOutcomePriority(casesWithMeetingOutcomes[1]).priority,
    "needs_evidence",
    "Evidence-gated meeting outcomes should be classified distinctly"
  );
  assert.equal(
    deriveMeetingOutcomePriority(getCase("case-003")).priority,
    "neutral",
    "Cases without a meeting outcome should remain neutral"
  );
  assert.equal(
    deriveMeetingOutcomeNextAction(casesWithMeetingOutcomes[0]).actionLabel,
    "Open evidence",
    "Promoted meeting outcomes should route to evidence review"
  );
  assert.equal(
    deriveMeetingOutcomeNextAction(casesWithMeetingOutcomes[1]).actionLabel,
    "Open dossier",
    "Evidence-gated meeting outcomes should route to dossier review"
  );
  casesWithMeetingOutcomes[0].meetingOutcome = {
    ...casesWithMeetingOutcomes[0].meetingOutcome!,
    reviewedAt: hoursAgo(120)
  };
  assert.equal(
    deriveMeetingOutcomeSla(casesWithMeetingOutcomes[0]).status,
    "overdue",
    "Old promoted actions should breach their follow-through SLA"
  );
  assert.equal(
    deriveMeetingOutcomeSla(casesWithMeetingOutcomes[1]).status,
    "within_sla",
    "Fresh evidence-needed actions should remain within SLA"
  );
  const meetingOutcomeEscalation = deriveMeetingOutcomeEscalation(casesWithMeetingOutcomes);
  assert.equal(
    meetingOutcomeEscalation.overdueCount,
    1,
    "Escalation summary should count overdue meeting actions"
  );
  assert.ok(
    meetingOutcomeEscalation.overdueItems.some((item) => item.id === casesWithMeetingOutcomes[0].id),
    "Escalation summary should surface the overdue promoted case"
  );
  assert.equal(
    meetingOutcomeEscalation.overdueItems[0]?.owner,
    "Olivia Ops",
    "Escalation summary should preserve the follow-through owner"
  );
  assert.equal(
    buildEvidencePayload(casesWithMeetingOutcomes[0]).meetingOutcome?.handoffBy,
    "Ops Dashboard",
    "Evidence payload should preserve meeting handoff attribution"
  );
  assert.equal(
    buildEvidencePayload(casesWithMeetingOutcomes[0]).meetingOutcome?.handoffHistory?.[0]?.toOwner,
    "Olivia Ops",
    "Evidence payload should preserve meeting handoff history"
  );
  const meetingOwnerWorkload = deriveMeetingOwnerWorkload(casesWithMeetingOutcomes);
  assert.equal(
    meetingOwnerWorkload[0]?.owner,
    "Olivia Ops",
    "Owner workload should prioritize owners carrying overdue actions"
  );
  assert.equal(
    meetingOwnerWorkload[0]?.overdueCount,
    1,
    "Owner workload should count overdue actions per owner"
  );
  assert.equal(
    deriveValidationReadiness(getCase("case-002")).stage,
    "remediation",
    "Blocked hypertension case should be triaged into remediation"
  );
  assert.equal(
    deriveValidationReadiness(getCase("case-005")).stage,
    "rwe_candidate",
    "Accepted frozen artifact should be triaged as an RWE candidate"
  );

  const respiratoryIntake = createReviewCaseFromIntake({
    patientLabel: "Intake Respiratory",
    rawInput:
      "Patient reports cough and fever for 3 days. Possible amoxicillin was discussed. History of penicillin allergy. Currently taking clarithromycin. No chest pain.",
    sourceType: "transcript"
  });
  assert.equal(respiratoryIntake.draft.encounter.reason, "Acute respiratory complaint");
  assert.equal(
    respiratoryIntake.draft.condition.codeText,
    "Possible bacterial respiratory infection",
    "Respiratory intake with antibiotic discussion and fever should generate a more distinct respiratory condition"
  );
  assert.ok(
    respiratoryIntake.safetyContext.allergies.includes("penicillin"),
    "Respiratory intake should infer penicillin allergy context"
  );
  assert.ok(
    respiratoryIntake.safetyContext.currentMedications.includes("clarithromycin"),
    "Respiratory intake should infer current medication context"
  );
  assert.ok(
    deriveSafetyFlags(respiratoryIntake).some((flag) => flag.id.endsWith("-allergy")),
    "Respiratory intake should produce an allergy-driven safety flag when amoxicillin is drafted"
  );
  assert.ok(
    (respiratoryIntake.generationTrace ?? []).some(
      (item) => item.fieldLabel === "Medication Request" && item.fieldPath === "MedicationRequest.medicationCodeableConcept.text"
    ),
    "Respiratory intake should include generation trace for the drafted medication"
  );

  const hypertensionIntake = createReviewCaseFromIntake({
    patientLabel: "Intake Hypertension",
    rawInput: "Routine hypertension follow-up. Blood pressure today 146/92. Taking amlodipine but occasionally misses doses.",
    sourceType: "note"
  });
  assert.equal(hypertensionIntake.draft.condition.codeText, "Hypertension");
  assert.equal(
    deriveFinalizationState(hypertensionIntake),
    "ready",
    "Complete hypertension intake with draftable content should be structurally ready"
  );
  assert.equal(
    deriveDataCollectionProfile(hypertensionIntake).validationStream,
    "ics_pilot_preparation",
    "Reviewable synthetic cases should be marked as pilot-prep candidates"
  );
  assert.equal(
    deriveValidationReadiness(hypertensionIntake).stage,
    "pilot_prep",
    "Reviewable hypertension intake should be triaged as pilot-prep"
  );

  const validationActionQueues = deriveValidationActionQueues(reviewCases);
  assert.ok(
    validationActionQueues.remediationPriority.some((item) => item.id === "case-002"),
    "Blocked hypertension case should appear in remediation action priorities"
  );
  assert.ok(
    validationActionQueues.pilotPromotionCandidates.length >= 1,
    "Validation action queues should surface at least one pilot-prep promotion candidate"
  );
  assert.ok(
    hypertensionIntake.draft.observations.some(
      (observation) => observation.codeText === "Blood pressure" && observation.valueText === "146/92"
    ),
    "Hypertension intake should carry forward the observed blood pressure value"
  );
  assert.ok(
    (hypertensionIntake.generationTrace ?? []).some(
      (item) => item.fieldLabel === "Blood Pressure Observation" && item.fieldPath === "Observation(Blood pressure).valueString"
    ),
    "Hypertension intake should include explicit blood pressure generation trace"
  );

  const lipidIntake = createReviewCaseFromIntake({
    patientLabel: "Intake Lipid",
    rawInput:
      "Cholesterol review. Prior muscle aches on atorvastatin intolerance noted. Considering statin restart. LDL pending.",
    sourceType: "transcript"
  });
  assert.equal(lipidIntake.draft.encounter.reason, "Lipid management review");
  assert.ok(
    deriveSafetyFlags(lipidIntake).some((flag) => flag.id.endsWith("-intolerance")),
    "Lipid intake should surface prior intolerance in the generated safety flags"
  );
  const lipidEvidence = buildEvidencePayload(lipidIntake);
  assert.ok(
    lipidEvidence.generationTrace.length > 0,
    "Evidence payload should carry generation trace for intake-generated cases"
  );
  assert.ok(
    lipidIntake.draft.observations.some(
      (observation) => observation.codeText === "LDL cholesterol" && observation.valueText === "Pending"
    ),
    "Lipid intake should preserve pending LDL context in a distinct structured observation"
  );
  assert.equal(
    lipidEvidence.finalizationState,
    "blocked",
    "High-risk lipid intake without override reasoning should remain blocked"
  );
  assert.ok(
    deriveClinicalConcerns(lipidIntake).some((concern) => concern.source === "blocker"),
    "Clinical concerns should rank blocker-level items for high-risk lipid cases"
  );
  assert.ok(
    deriveReviewerGuidance(lipidIntake).some((item) => item.category === "override"),
    "High-risk lipid intake should generate override-oriented reviewer guidance"
  );
  assert.ok(
    deriveReviewerChecklist(lipidIntake).some((item) => item.category === "override" && !item.completed),
    "High-risk lipid intake should expose an open override checklist item"
  );
  assert.ok(
    deriveChecklistAcceptanceBlockers(lipidIntake).some((item) => item.includes("Reviewer checklist is incomplete")),
    "High-risk lipid intake should block acceptance until required checklist items are completed"
  );

  const completedWithoutNoteLipidCase = structuredClone(lipidIntake);
  completedWithoutNoteLipidCase.reviewSummary = {
    ...completedWithoutNoteLipidCase.reviewSummary,
    guidanceChecklist: deriveReviewerChecklist(completedWithoutNoteLipidCase).map((item) => ({
      ...item,
      completed: true,
      completedAt: "2026-04-24 10:00",
      completedBy: "Dr Morgan",
      confirmationNote: ""
    }))
  };
  assert.ok(
    deriveChecklistAcceptanceBlockers(completedWithoutNoteLipidCase).some((item) => item.includes("Reviewer checklist note is missing")),
    "Completed required checklist items should still require a short confirmation note"
  );

  const warningOnlyIntake = createReviewCaseFromIntake({
    patientLabel: "Warning Only Intake",
    rawInput:
      "Possible stable eczema flare discussed in transcript. Repeat hydrocortisone cream requested with no systemic concerns.",
    sourceType: "transcript"
  });
  assert.equal(
    deriveFinalizationState(warningOnlyIntake),
    "warn",
    "Low-confidence but otherwise complete transcript intake should remain reviewable with warnings"
  );
  assert.ok(
    deriveReviewerGuidance(warningOnlyIntake).some((item) => item.category === "must_confirm"),
    "Warning-only intake should still generate confirmation guidance for the reviewer"
  );

  const completedWarningChecklistCase = structuredClone(warningOnlyIntake);
  const derivedChecklist = deriveReviewerChecklist(completedWarningChecklistCase);
  completedWarningChecklistCase.reviewSummary = {
    ...completedWarningChecklistCase.reviewSummary,
    guidanceChecklist: derivedChecklist.map((item) => ({
      ...item,
      completed: true,
      confirmationNote: "Confirmed against source transcript during review.",
      completedAt: "2026-04-24 10:00",
      completedBy: "Dr Morgan"
    }))
  };
  assert.ok(
    !deriveChecklistAcceptanceBlockers(completedWarningChecklistCase).some((item) => item.includes("Reviewer checklist is incomplete")),
    "Completed required checklist items should clear the checklist blocker"
  );

  const hintedGeneralIntake = createReviewCaseFromIntake({
    patientLabel: "Hinted General Intake",
    rawInput:
      "Patient reports cough and fever for 3 days. Possible amoxicillin was discussed. History of penicillin allergy.",
    sourceType: "transcript",
    options: {
      pathwayHint: "general"
    }
  });
  assert.equal(
    hintedGeneralIntake.draft.encounter.reason,
    "General primary care review",
    "General pathway hint should override auto-detected respiratory routing"
  );
  assert.equal(
    hintedGeneralIntake.draft.medicationRequest,
    undefined,
    "General pathway hint should avoid respiratory medication drafting"
  );

  const conservativeConfidenceIntake = createReviewCaseFromIntake({
    patientLabel: "Conservative Confidence Intake",
    rawInput: "Routine hypertension follow-up. Blood pressure today 146/92.",
    sourceType: "note",
    options: {
      confidenceMode: "conservative"
    }
  });
  assert.equal(
    conservativeConfidenceIntake.input.transcriptConfidence,
    0.82,
    "Conservative confidence mode should lower note confidence to the configured threshold"
  );

  const medicationSuppressedIntake = createReviewCaseFromIntake({
    patientLabel: "Medication Suppressed Intake",
    rawInput:
      "Patient reports cough and fever for 3 days. Possible amoxicillin was discussed. History of penicillin allergy. Currently taking clarithromycin.",
    sourceType: "transcript",
    options: {
      pathwayHint: "respiratory",
      includeMedicationDraft: false
    }
  });
  assert.equal(
    medicationSuppressedIntake.draft.medicationRequest,
    undefined,
    "Medication draft generation should be suppressible from intake controls"
  );
  assert.ok(
    !deriveSafetyFlags(medicationSuppressedIntake).some((flag) => flag.id.endsWith("-allergy")),
    "Suppressing medication draft generation should remove medication-driven allergy flags"
  );

  const overriddenContextIntake = createReviewCaseFromIntake({
    patientLabel: "Overridden Context Intake",
    rawInput:
      "Routine hypertension follow-up. Blood pressure today 146/92. Taking amlodipine but occasionally misses doses.",
    sourceType: "note",
    options: {
      pathwayHint: "hypertension",
      inferredContextOverrides: {
        allergies: ["latex"],
        currentMedications: ["losartan"],
        bloodPressure: "132/84",
        medicationMention: "Losartan"
      }
    }
  });
  assert.deepEqual(
    overriddenContextIntake.safetyContext.allergies,
    ["latex"],
    "Editable inferred allergies should override automatically inferred allergy context"
  );
  assert.deepEqual(
    overriddenContextIntake.safetyContext.currentMedications,
    ["losartan"],
    "Editable inferred current medications should override automatically inferred medication context"
  );
  assert.ok(
    overriddenContextIntake.draft.observations.some(
      (observation) => observation.codeText === "Blood pressure" && observation.valueText === "132/84"
    ),
    "Editable inferred blood pressure should override the extracted vital value"
  );

  const overriddenRespiratoryIntake = createReviewCaseFromIntake({
    patientLabel: "Overridden Respiratory Intake",
    rawInput:
      "Patient reports cough and fever for 3 days. Possible amoxicillin was discussed. History of penicillin allergy.",
    sourceType: "transcript",
    options: {
      pathwayHint: "respiratory",
      inferredContextOverrides: {
        allergies: ["sulfa"],
        medicationMention: "Doxycycline",
        temperature: "38.1 C"
      }
    }
  });
  assert.equal(
    overriddenRespiratoryIntake.draft.medicationRequest?.medicationText,
    "Doxycycline",
    "Editable medication mention should replace the inferred drafted medication"
  );
  assert.ok(
    overriddenRespiratoryIntake.draft.observations.some(
      (observation) => observation.codeText === "Temperature" && observation.valueText === "38.1 C"
    ),
    "Editable temperature should override the inferred temperature observation"
  );
  assert.ok(
    !deriveSafetyFlags(overriddenRespiratoryIntake).some((flag) => flag.id.endsWith("-allergy")),
    "Replacing inferred allergy context should update medication-driven safety flags"
  );

  const advancedHypertensionIntake = createReviewCaseFromIntake({
    patientLabel: "Advanced Hypertension Intake",
    rawInput:
      "BP 152 over 96 at review. Hypertension follow-up with fatigue. Taking losartan regularly.",
    sourceType: "note"
  });
  assert.ok(
    advancedHypertensionIntake.draft.observations.some(
      (observation) => observation.codeText === "Blood pressure" && observation.valueText === "152/96"
    ),
    "Draft hardening should parse blood pressure values expressed as 'over'"
  );
  assert.ok(
    advancedHypertensionIntake.draft.condition.evidence.includes("Blood pressure 152/96 documented"),
    "Draft hardening should carry richer blood pressure evidence into the condition evidence"
  );

  const advancedRespiratoryIntake = createReviewCaseFromIntake({
    patientLabel: "Advanced Respiratory Intake",
    rawInput:
      "Transcript notes cough, wheeze, and temperature 38.4 celsius. Start doxycycline 100mg discussed. No chest pain or shortness of breath.",
    sourceType: "transcript"
  });
  assert.equal(
    advancedRespiratoryIntake.draft.medicationRequest?.medicationText,
    "Doxycycline 100mg",
    "Draft hardening should recognize medication phrases with dosage"
  );
  assert.ok(
    advancedRespiratoryIntake.draft.observations.some(
      (observation) => observation.codeText === "Temperature" && observation.valueText === "38.4 C"
    ),
    "Draft hardening should normalize temperature values expressed in celsius"
  );
  assert.ok(
    advancedRespiratoryIntake.draft.observations.some(
      (observation) =>
        observation.codeText === "Red flag symptoms" &&
        observation.valueText.includes("wheeze") &&
        observation.valueText.includes("no chest pain") &&
        observation.valueText.includes("no breathlessness")
    ),
    "Draft hardening should produce more expressive red-flag classification"
  );

  console.log("Workflow scenario checks passed.");
}

run();
