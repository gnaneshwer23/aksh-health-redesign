"use client";

import { DataHealthSummaryRows } from "./quality-summary-cards";
import type { OpsAnalytics } from "./ops-dashboard-section-types";
import {
  BenchmarkActionLinks,
  ClinicalScenarioBenchmarkList,
  MeetingOutcomeEscalationsList,
  MeetingOutcomeSignalsList,
  ReviewWorkflowSignalsList
} from "./ops-shared-sections";
import type { BenchmarkSignoffEntry } from "@/lib/benchmark-signoff-types";

export function OpsDashboardHero({
  dashboardHref,
  exportOpsReport,
  feedbackHref,
  opsAnalytics,
  sharedQuery
}: {
  dashboardHref: string;
  exportOpsReport: () => void;
  feedbackHref: string;
  opsAnalytics: OpsAnalytics;
  sharedQuery: string;
}) {
  const {
    dataCollectionAnalytics,
    feedbackAnalytics,
    meetingOutcomeEscalation,
    reviewAnalytics,
    validationProtocolAnalytics,
    validationTrendAnalytics
  } = opsAnalytics;

  return (
    <div className="span-12 hero-banner stack">
      <span className="hero-kicker">Ops View</span>
      <div className="actions">
        <a className="button secondary" href={dashboardHref}>
          Back To Dashboard
        </a>
        <a className="button secondary" href={feedbackHref}>
          Feedback Capture
        </a>
        <a className="button secondary" href={`/review/dossiers${sharedQuery}`}>
          Dossier Batches
        </a>
        <a className="button secondary" href={`/review/meeting-packet${sharedQuery}`}>
          Meeting Packet
        </a>
        <a className="button secondary" href={`/review/ops/report${sharedQuery}`}>
          Stakeholder Report
        </a>
        <button className="button secondary" onClick={exportOpsReport} type="button">
          Export Ops Report
        </button>
      </div>
      <h2>Pilot Operations Dashboard</h2>
      <p>
        One view for current review throughput and feedback-memory trends across rehearsals, demos, and pilot sessions.
      </p>
      <div className="hero-stats">
        <div className="hero-stat">
          <strong>Acceptance rate</strong>
          <p>Current workflow conversion across decided review cases.</p>
          <span className="hero-stat-value">{reviewAnalytics.acceptanceRate}%</span>
        </div>
        <div className="hero-stat">
          <strong>Avg decision time</strong>
          <p>Average minutes from captured input to reviewer decision.</p>
          <span className="hero-stat-value">{reviewAnalytics.averageDecisionMinutes}m</span>
        </div>
        <div className="hero-stat">
          <strong>Saved feedback sessions</strong>
          <p>Archived rehearsal and stakeholder sessions available for trend review.</p>
          <span className="hero-stat-value">{feedbackAnalytics.total}</span>
        </div>
        <div className="hero-stat">
          <strong>Pilot-prep cohort</strong>
          <p>Synthetic cases currently positioned for clinician training and ICS pilot rehearsal.</p>
          <span className="hero-stat-value">{dataCollectionAnalytics.streamCounts.ics_pilot_preparation}</span>
        </div>
        <div className="hero-stat">
          <strong>Avg validation score</strong>
          <p>Average validation protocol score across the current cohort.</p>
          <span className="hero-stat-value">{validationProtocolAnalytics.averageOverallScore}</span>
        </div>
        <div className="hero-stat">
          <strong>Avg score delta</strong>
          <p>Average change between first and latest validation snapshots.</p>
          <span className="hero-stat-value">{validationTrendAnalytics.averageScoreDelta}</span>
        </div>
        <div className="hero-stat">
          <strong>Overdue meeting actions</strong>
          <p>Meeting-driven follow-through that has already breached its target window.</p>
          <span className="hero-stat-value">{meetingOutcomeEscalation.overdueCount}</span>
        </div>
      </div>
    </div>
  );
}

export function ReviewWorkflowSignalsCard({
  evidenceReadinessGate,
  evidenceReadinessTrend,
  readinessHistoryLoaded,
  reviewAnalytics
}: {
  evidenceReadinessGate: OpsAnalytics["evidenceReadinessGate"];
  evidenceReadinessTrend: OpsAnalytics["evidenceReadinessTrend"];
  readinessHistoryLoaded: boolean;
  reviewAnalytics: OpsAnalytics["reviewAnalytics"];
}) {
  return (
    <div className="span-6 panel stack">
      <h3>Review Workflow Signals</h3>
      <ReviewWorkflowSignalsList
        blockerDetail="Most common blocker category in the live review queue."
        evidenceReadinessGate={evidenceReadinessGate}
        evidenceReadinessTrend={evidenceReadinessTrend}
        includeReadinessCards
        readinessHistoryLoaded={readinessHistoryLoaded}
        reviewAnalytics={reviewAnalytics}
      />
    </div>
  );
}

export function ClinicalScenarioBenchmarkCard({
  demoMode,
  latestSignoff,
  query,
  recordingMode,
  scenarioBenchmark,
  scenarioBenchmarkActionQueue,
  signoffLoaded
}: {
  demoMode?: boolean;
  latestSignoff?: BenchmarkSignoffEntry;
  query: string;
  recordingMode?: boolean;
  scenarioBenchmark: OpsAnalytics["scenarioBenchmark"];
  scenarioBenchmarkActionQueue: OpsAnalytics["scenarioBenchmarkActionQueue"];
  signoffLoaded: boolean;
}) {
  return (
    <div className="span-6 panel stack">
      <h3>Clinical Scenario Benchmark</h3>
      <BenchmarkActionLinks demoMode={demoMode ?? false} query={query} recordingMode={recordingMode ?? false} />
      <ClinicalScenarioBenchmarkList
        actionQueue={scenarioBenchmarkActionQueue}
        includeReadinessWorkspace
        latestSignoff={latestSignoff}
        query={query}
        scenarioBenchmark={scenarioBenchmark}
        signoffLoaded={signoffLoaded}
      />
    </div>
  );
}

export function DataHealthCard({ dataHealthSummary }: { dataHealthSummary: OpsAnalytics["dataHealthSummary"] }) {
  return (
    <div className="span-6 panel stack">
      <h3>Data Health</h3>
      <div className="list">
        <DataHealthSummaryRows summary={dataHealthSummary} />
      </div>
    </div>
  );
}

export function MeetingOutcomeSignalsCard({
  meetingOutcomeAnalytics,
  meetingOutcomeEscalation
}: {
  meetingOutcomeAnalytics: OpsAnalytics["meetingOutcomeAnalytics"];
  meetingOutcomeEscalation: OpsAnalytics["meetingOutcomeEscalation"];
}) {
  return (
    <div className="span-6 panel stack">
      <h3>Meeting Outcome Signals</h3>
      <MeetingOutcomeSignalsList
        meetingOutcomeAnalytics={meetingOutcomeAnalytics}
        meetingOutcomeEscalation={meetingOutcomeEscalation}
      />
    </div>
  );
}

export function MeetingOutcomeEscalationsCard({
  meetingOutcomeEscalation
}: {
  meetingOutcomeEscalation: OpsAnalytics["meetingOutcomeEscalation"];
}) {
  return (
    <div className="span-6 panel stack">
      <h3>Meeting Outcome Escalations</h3>
      <MeetingOutcomeEscalationsList keyPrefix="dashboard" meetingOutcomeEscalation={meetingOutcomeEscalation} />
    </div>
  );
}
