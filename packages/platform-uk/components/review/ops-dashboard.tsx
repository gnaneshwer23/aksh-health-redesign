"use client";

import { useMemo } from "react";

import { useFeedbackState } from "@/lib/use-feedback-state";
import { useReviewCases } from "@/lib/use-review-cases";
import { useBenchmarkSignoff } from "@/lib/use-benchmark-signoff";
import { useReadinessHistory } from "@/lib/use-readiness-history";
import { deriveOpsAnalytics } from "@/lib/ops-analytics";

import {
  AverageScoreByStreamCard,
  ClinicalScenarioBenchmarkCard,
  CoordinationRiskCard,
  DataHealthCard,
  DossierReadinessCard,
  DossierSpotlightCasesCard,
  FeedbackLinkedCasesPanel,
  FeedbackPhrasePanels,
  FeedbackSignalsCard,
  GovernanceTrainingCard,
  MeetingOutcomeEscalationsCard,
  MeetingOutcomeSignalsCard,
  MeetingPacketViewsCard,
  MeetingReadyDossierBatchesCard,
  OpenTransitionStepsCard,
  OpsDashboardHero,
  OwnerStalledLoadCard,
  OwnerWorkloadBalancingCard,
  ProtocolTrendMetricsCard,
  RemediationActionCohortsCard,
  RemediationCompletionSignalsCard,
  RemediationHandoffChurnCard,
  RemediationTurnaroundCard,
  ReviewWorkflowSignalsCard,
  StageFailureSignalsCard,
  StalledRemediationAlertsCard,
  ValidationActionQueuesCards,
  ValidationProtocolSignalsCard,
  ValidationStreamReadoutCard,
  ValidationTrendSignalsCard
} from "./ops-dashboard-sections";
import { ClinicalRuleCoverageSection } from "./ops-shared-sections";
import { useOpsDashboardControls } from "./useOpsDashboardControls";

export function OpsDashboard({
  demoMode = false,
  recordingMode = false
}: {
  demoMode?: boolean;
  recordingMode?: boolean;
}) {
  const { cases, isLoaded, isSaving, updateCase } = useReviewCases();
  const { archive, isLoaded: feedbackLoaded } = useFeedbackState();
  const { archive: signoffArchive, isLoaded: signoffLoaded } = useBenchmarkSignoff();
  const { archive: readinessArchive, isLoaded: readinessHistoryLoaded } = useReadinessHistory();
  const dashboardHref = `/${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;
  const feedbackHref = `/review/feedback${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;
  const sharedQuery = `${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;

  const opsAnalytics = useMemo(
    () =>
      deriveOpsAnalytics({
        cases,
        feedbackArchive: archive,
        readinessArchive,
        signoffArchive
      }),
    [archive, cases, readinessArchive, signoffArchive]
  );

  const {
    exportOpsReport,
    handoffDrafts,
    ownerDrafts,
    remediationHandoffDrafts,
    remediationOwnerDrafts,
    riskTriageDrafts,
    saveOwner,
    saveRemediationOwner,
    saveRiskTriage,
    setHandoffDrafts,
    setOwnerDrafts,
    setRemediationHandoffDrafts,
    setRemediationOwnerDrafts,
    setRiskTriageDrafts
  } = useOpsDashboardControls({ cases, opsAnalytics, updateCase });

  const {
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
  } = opsAnalytics;

  if (!isLoaded || !feedbackLoaded) {
    return <div className="panel">Loading operations dashboard...</div>;
  }

  return (
    <div className="grid">
      <OpsDashboardHero
        dashboardHref={dashboardHref}
        exportOpsReport={exportOpsReport}
        feedbackHref={feedbackHref}
        opsAnalytics={opsAnalytics}
        sharedQuery={sharedQuery}
      />

      <ReviewWorkflowSignalsCard
        evidenceReadinessGate={evidenceReadinessGate}
        evidenceReadinessTrend={evidenceReadinessTrend}
        readinessHistoryLoaded={readinessHistoryLoaded}
        reviewAnalytics={reviewAnalytics}
      />

      <ClinicalScenarioBenchmarkCard
        demoMode={demoMode}
        latestSignoff={signoffArchive[0]}
        query={sharedQuery}
        recordingMode={recordingMode}
        scenarioBenchmark={scenarioBenchmark}
        scenarioBenchmarkActionQueue={scenarioBenchmarkActionQueue}
        signoffLoaded={signoffLoaded}
      />

      <DataHealthCard dataHealthSummary={dataHealthSummary} />

      <ClinicalRuleCoverageSection
        clinicalRuleCoverage={clinicalRuleCoverage}
        demoMode={demoMode}
        recordingMode={recordingMode}
      />

      <FeedbackSignalsCard feedbackAnalytics={feedbackAnalytics} />
      <ValidationStreamReadoutCard dataCollectionAnalytics={dataCollectionAnalytics} />
      <GovernanceTrainingCard dataCollectionAnalytics={dataCollectionAnalytics} />

      <ValidationProtocolSignalsCard validationProtocolAnalytics={validationProtocolAnalytics} />
      <ValidationTrendSignalsCard validationTrendAnalytics={validationTrendAnalytics} />
      <StageFailureSignalsCard
        demoMode={demoMode}
        recordingMode={recordingMode}
        validationStageFailureAnalytics={validationStageFailureAnalytics}
      />
      <RemediationActionCohortsCard
        demoMode={demoMode}
        recordingMode={recordingMode}
        remediationActionCohorts={remediationActionCohorts}
      />
      <RemediationCompletionSignalsCard remediationResolutionAnalytics={remediationResolutionAnalytics} />
      <RemediationTurnaroundCard remediationTurnaroundAnalytics={remediationTurnaroundAnalytics} />

      <StalledRemediationAlertsCard
        demoMode={demoMode}
        isSaving={isSaving}
        recordingMode={recordingMode}
        remediationHandoffDrafts={remediationHandoffDrafts}
        remediationOwnerDrafts={remediationOwnerDrafts}
        remediationStalledAlerts={remediationStalledAlerts}
        saveRemediationOwner={saveRemediationOwner}
        setRemediationHandoffDrafts={setRemediationHandoffDrafts}
        setRemediationOwnerDrafts={setRemediationOwnerDrafts}
      />

      <OwnerStalledLoadCard remediationOwnerLoad={remediationOwnerLoad} />

      <RemediationHandoffChurnCard
        demoMode={demoMode}
        recordingMode={recordingMode}
        remediationHandoffChurnAnalytics={remediationHandoffChurnAnalytics}
      />

      <CoordinationRiskCard
        demoMode={demoMode}
        isSaving={isSaving}
        recordingMode={recordingMode}
        remediationChurnRisk={remediationChurnRisk}
        riskTriageDrafts={riskTriageDrafts}
        saveRiskTriage={saveRiskTriage}
        setRiskTriageDrafts={setRiskTriageDrafts}
      />

      <MeetingPacketViewsCard demoMode={demoMode} recordingMode={recordingMode} />

      <MeetingOutcomeSignalsCard
        meetingOutcomeAnalytics={meetingOutcomeAnalytics}
        meetingOutcomeEscalation={meetingOutcomeEscalation}
      />

      <MeetingOutcomeEscalationsCard meetingOutcomeEscalation={meetingOutcomeEscalation} />

      <OwnerWorkloadBalancingCard
        cases={cases}
        handoffDrafts={handoffDrafts}
        isSaving={isSaving}
        meetingOwnerWorkload={meetingOwnerWorkload}
        ownerDrafts={ownerDrafts}
        saveOwner={saveOwner}
        setHandoffDrafts={setHandoffDrafts}
        setOwnerDrafts={setOwnerDrafts}
      />

      <ProtocolTrendMetricsCard validationProtocolAnalytics={validationProtocolAnalytics} />
      <AverageScoreByStreamCard validationProtocolAnalytics={validationProtocolAnalytics} />
      <OpenTransitionStepsCard validationProtocolAnalytics={validationProtocolAnalytics} />

      <DossierReadinessCard validationDossierAnalytics={validationDossierAnalytics} />
      <DossierSpotlightCasesCard sharedQuery={sharedQuery} validationDossierAnalytics={validationDossierAnalytics} />
      <MeetingReadyDossierBatchesCard demoMode={demoMode} recordingMode={recordingMode} />
      <ValidationActionQueuesCards sharedQuery={sharedQuery} validationActionQueues={validationActionQueues} />

      <FeedbackPhrasePanels feedbackAnalytics={feedbackAnalytics} />
      <FeedbackLinkedCasesPanel feedbackAnalytics={feedbackAnalytics} sharedQuery={sharedQuery} />
    </div>
  );
}
