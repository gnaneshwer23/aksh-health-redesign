"use client";

import { useMemo } from "react";

import { useFeedbackState } from "@/lib/use-feedback-state";
import { useReviewCases } from "@/lib/use-review-cases";
import { useBenchmarkSignoff } from "@/lib/use-benchmark-signoff";
import { useReadinessHistory } from "@/lib/use-readiness-history";
import { deriveOpsAnalytics } from "@/lib/ops-analytics";

import { ReportActions } from "./report-actions";
import { DataHealthSummaryRows, EvidenceReadinessGateCard, EvidenceReadinessTrendCard } from "./quality-summary-cards";
import {
  BenchmarkActionLinks,
  ClinicalRuleCoverageSection,
  ClinicalScenarioBenchmarkList,
  MeetingOutcomeEscalationsList,
  MeetingOutcomeSignalsList,
  ReadOnlyOwnerWorkloadList,
  ReviewWorkflowSignalsList
} from "./ops-shared-sections";
import {
  DossierReadinessReportSection,
  DossierSpotlightReportSection,
  MeetingReadyDossierBatchesReportSection,
  StageFailureSignalsReportSection,
  ValidationProtocolSignalsReportSection,
  ValidationReadinessActionsReportSection,
  ValidationTrendMetricsReportSection
} from "./ops-report-validation-sections";
import {
  CoordinationRiskReportSection,
  OwnerStalledLoadReportSection,
  RemediationActionCohortsReportSection,
  RemediationCompletionReportSection,
  RemediationHandoffChurnReportSection,
  RemediationTurnaroundReportSection,
  StalledRemediationAlertsReportSection
} from "./ops-report-remediation-sections";

export function OpsReport({
  demoMode = false,
  recordingMode = false
}: {
  demoMode?: boolean;
  recordingMode?: boolean;
}) {
  const { cases, isLoaded } = useReviewCases();
  const { archive, isLoaded: feedbackLoaded } = useFeedbackState();
  const { archive: signoffArchive, isLoaded: signoffLoaded } = useBenchmarkSignoff();
  const { archive: readinessArchive, isLoaded: readinessHistoryLoaded } = useReadinessHistory();
  const query = `${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;

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
    clinicalRuleCoverage,
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
    return <div className="panel">Loading report...</div>;
  }

  return (
    <div className="report-page stack">
      <div className="report-header stack">
        <span className="hero-kicker">Stakeholder Report</span>
        <ReportActions backHref={`/review/ops${query}`} />
        <h1>Pilot Operations Report</h1>
        <p>
          Snapshot of current review workflow performance and cross-session feedback trends for the Aksh Health UK/EU
          proof platform.
        </p>
        <div className="pill-row">
          <span className="pill">Generated {new Date().toLocaleString("en-GB")}</span>
          <span className="pill">Review cases {cases.length}</span>
          <span className="pill">Saved feedback sessions {feedbackAnalytics.total}</span>
          <a className="button secondary" href={`/review/dossiers${query}`}>
            Dossier Batches
          </a>
          <a className="button secondary" href={`/review/meeting-packet${query}`}>
            Meeting Packet
          </a>
        </div>
      </div>

      <div className="report-grid">
        <section className="report-section">
          <h2>Executive Snapshot</h2>
          <div className="list">
            <EvidenceReadinessGateCard gate={evidenceReadinessGate} />
            <EvidenceReadinessTrendCard isLoaded={readinessHistoryLoaded} trend={evidenceReadinessTrend} />
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <strong>Acceptance rate</strong>
              <span className="hero-stat-value">{reviewAnalytics.acceptanceRate}%</span>
              <p>Accepted share across decided review cases.</p>
            </div>
            <div className="hero-stat">
              <strong>Avg decision time</strong>
              <span className="hero-stat-value">{reviewAnalytics.averageDecisionMinutes}m</span>
              <p>Average elapsed time from captured input to reviewer decision.</p>
            </div>
            <div className="hero-stat">
              <strong>High-readiness sessions</strong>
              <span className="hero-stat-value">{feedbackAnalytics.highReadiness}</span>
              <p>Saved sessions scored 4 or 5 in rehearsal, demo, or pilot follow-up.</p>
            </div>
            <div className="hero-stat">
              <strong>Open follow-up</strong>
              <span className="hero-stat-value">{feedbackAnalytics.openSessions}</span>
              <p>Feedback entries still treated as active objections or follow-up work.</p>
            </div>
            <div className="hero-stat">
              <strong>Avg validation score</strong>
              <span className="hero-stat-value">{validationProtocolAnalytics.averageOverallScore}</span>
              <p>Average internal validation protocol score across the active cohort.</p>
            </div>
            <div className="hero-stat">
              <strong>Overdue meeting actions</strong>
              <span className="hero-stat-value">{meetingOutcomeEscalation.overdueCount}</span>
              <p>Meeting-driven follow-through that has already breached its target window.</p>
            </div>
          </div>
        </section>

        <section className="report-section">
          <h2>Review Workflow Signals</h2>
          <ReviewWorkflowSignalsList
            evidenceReadinessGate={evidenceReadinessGate}
            evidenceReadinessTrend={evidenceReadinessTrend}
            includeSafetyCategories
            readinessHistoryLoaded={readinessHistoryLoaded}
            reviewAnalytics={reviewAnalytics}
          />
        </section>

        <section className="report-section">
          <h2>Clinical Scenario Benchmark</h2>
          <BenchmarkActionLinks demoMode={demoMode} query={query} recordingMode={recordingMode} />
          <ClinicalScenarioBenchmarkList
            actionQueue={scenarioBenchmarkActionQueue}
            latestSignoff={signoffArchive[0]}
            query={query}
            scenarioBenchmark={scenarioBenchmark}
            signoffLoaded={signoffLoaded}
          />
        </section>

        <section className="report-section">
          <h2>Data Health</h2>
          <div className="list">
            <DataHealthSummaryRows summary={dataHealthSummary} />
          </div>
        </section>

        <ClinicalRuleCoverageSection
          clinicalRuleCoverage={clinicalRuleCoverage}
          demoMode={demoMode}
          headingLevel="h2"
          recordingMode={recordingMode}
          sectionClassName="report-section"
        />

        <ValidationReadinessActionsReportSection query={query} validationActionQueues={validationActionQueues} />

        <section className="report-section">
          <h2>Meeting Outcome Signals</h2>
          <MeetingOutcomeSignalsList
            includeSeparateRepairCounts
            meetingOutcomeAnalytics={meetingOutcomeAnalytics}
            meetingOutcomeEscalation={meetingOutcomeEscalation}
          />
        </section>

        <section className="report-section">
          <h2>Meeting Outcome Escalations</h2>
          <MeetingOutcomeEscalationsList keyPrefix="report" meetingOutcomeEscalation={meetingOutcomeEscalation} />
        </section>

        <section className="report-section">
          <h2>Owner Workload Balancing</h2>
          <ReadOnlyOwnerWorkloadList meetingOwnerWorkload={meetingOwnerWorkload} />
        </section>

        <ValidationProtocolSignalsReportSection validationProtocolAnalytics={validationProtocolAnalytics} />
        <ValidationTrendMetricsReportSection
          validationProtocolAnalytics={validationProtocolAnalytics}
          validationTrendAnalytics={validationTrendAnalytics}
        />
        <StageFailureSignalsReportSection
          query={query}
          validationStageFailureAnalytics={validationStageFailureAnalytics}
        />

        <RemediationActionCohortsReportSection
          query={query}
          remediationActionCohorts={remediationActionCohorts}
        />
        <RemediationCompletionReportSection remediationResolutionAnalytics={remediationResolutionAnalytics} />
        <RemediationTurnaroundReportSection remediationTurnaroundAnalytics={remediationTurnaroundAnalytics} />
        <StalledRemediationAlertsReportSection
          query={query}
          remediationStalledAlerts={remediationStalledAlerts}
        />
        <OwnerStalledLoadReportSection remediationOwnerLoad={remediationOwnerLoad} />
        <RemediationHandoffChurnReportSection
          query={query}
          remediationHandoffChurnAnalytics={remediationHandoffChurnAnalytics}
        />
        <CoordinationRiskReportSection query={query} remediationChurnRisk={remediationChurnRisk} />

        <DossierReadinessReportSection validationDossierAnalytics={validationDossierAnalytics} />
        <DossierSpotlightReportSection query={query} validationDossierAnalytics={validationDossierAnalytics} />
        <MeetingReadyDossierBatchesReportSection demoMode={demoMode} recordingMode={recordingMode} />

        <section className="report-section">
          <h2>Resolution Status</h2>
          <div className="list">
            <div className="row">
              <div>
                <strong>Open sessions</strong>
                <p>Feedback entries still considered active and unresolved.</p>
              </div>
              <span className="pill">{feedbackAnalytics.openSessions}</span>
            </div>
            <div className="row">
              <div>
                <strong>Resolved sessions</strong>
                <p>Feedback entries marked closed out and no longer treated as active follow-up.</p>
              </div>
              <span className="pill">{feedbackAnalytics.resolvedSessions}</span>
            </div>
            <div className="row">
              <div>
                <strong>Overdue sessions</strong>
                <p>Open follow-up items where the due date has already passed.</p>
              </div>
              <span className="pill">{feedbackAnalytics.overdueSessions}</span>
            </div>
          </div>
        </section>

        <section className="report-section">
          <h2>Feedback Trend Signals</h2>
          <div className="list">
            {feedbackAnalytics.objections.length ? (
              feedbackAnalytics.objections.map((item) => (
                <div className="row" key={item.label}>
                  <div>
                    <strong>{item.label}</strong>
                    <p>Recurring unresolved objection or confusion pattern pulled from the saved archive.</p>
                  </div>
                  <span className="pill">{item.count}</span>
                </div>
              ))
            ) : (
              <div className="row">
                <div>
                  <strong>No archived objections yet</strong>
                  <p>Save feedback sessions to populate this section.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="report-section">
          <h2>Strongest Proof Moments</h2>
          <div className="list">
            {feedbackAnalytics.strongestMoments.length ? (
              feedbackAnalytics.strongestMoments.map((item) => (
                <div className="row" key={item.label}>
                  <div>
                    <strong>{item.label}</strong>
                    <p>Repeated moment described as most convincing across sessions.</p>
                  </div>
                  <span className="pill">{item.count}</span>
                </div>
              ))
            ) : (
              <div className="row">
                <div>
                  <strong>No strongest moments archived yet</strong>
                  <p>Use rehearsal or feedback capture to build a stronger evidence story.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="report-section">
          <h2>Common Next Actions</h2>
          <div className="list">
            {feedbackAnalytics.nextActions.length ? (
              feedbackAnalytics.nextActions.map((item) => (
                <div className="row" key={item.label}>
                  <div>
                    <strong>{item.label}</strong>
                    <p>Common unresolved follow-up action captured from stakeholders or internal rehearsal.</p>
                  </div>
                  <span className="pill">{item.count}</span>
                </div>
              ))
            ) : (
              <div className="row">
                <div>
                  <strong>No common next actions yet</strong>
                  <p>Save sessions with explicit actions to turn the archive into an operating backlog.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="report-section">
          <h2>Case Correlation</h2>
          <div className="list">
            {feedbackAnalytics.linkedCases.length ? (
              feedbackAnalytics.linkedCases.map((item) => (
                <div className="row" key={item.caseId}>
                  <div>
                    <strong>{item.caseId}</strong>
                    <p>Feedback sessions explicitly linked to this demo scenario.</p>
                  </div>
                  <div className="actions">
                    <span className="pill">{item.count} mentions</span>
                    <a className="button secondary" href={`/cases/${item.caseId}${query}`}>
                      Case
                    </a>
                    <a className="button secondary" href={`/cases/${item.caseId}/evidence${query}`}>
                      Evidence
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="row">
                <div>
                  <strong>No case-linked feedback yet</strong>
                  <p>Link sessions to demo cases to correlate objections and strongest proof points back to scenarios.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="report-section">
          <h2>Follow-Up Ownership</h2>
          <div className="list">
            {archive.filter((entry) => entry.resolutionStatus !== "resolved").slice(0, 5).map((entry) => (
              <div className="row" key={entry.id}>
                <div>
                  <strong>
                    {entry.relatedCaseId || "Unlinked case"} / {entry.audience}
                  </strong>
                  <p>Owner: {entry.followUpOwner || "Unassigned"}</p>
                  <p>Due: {entry.dueDate || "No due date set"}</p>
                  <p>{entry.nextActions || entry.objections || entry.confusionPoint || "No active follow-up detail captured."}</p>
                </div>
                <span className="tag warn">open</span>
              </div>
            ))}
            {!archive.some((entry) => entry.resolutionStatus !== "resolved") ? (
              <div className="row">
                <div>
                  <strong>No open follow-up ownership items</strong>
                  <p>All saved feedback entries are currently resolved or there are no archived sessions yet.</p>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
