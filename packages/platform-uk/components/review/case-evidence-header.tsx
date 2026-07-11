import Link from "next/link";

import { sourceProfileLabel } from "@/lib/synthetic-source-profiles";
import type { ConsultationInput } from "@/lib/types";

import type { CaseEvidencePayload } from "./case-evidence-types";

export function CaseEvidenceHeader({
  caseId,
  evidence,
  sourceProfile,
  demoMode,
  recordingMode,
  query
}: {
  caseId: string;
  evidence: CaseEvidencePayload;
  sourceProfile?: ConsultationInput["sourceProfile"];
  demoMode: boolean;
  recordingMode: boolean;
  query: string;
}) {
  return (
    <div className="hero-banner stack">
      <span className="hero-kicker">Evidence Artifact</span>
      <div className="actions">
        <Link className="button secondary" href={`/cases/${caseId}${query}`}>
          Back To Case
        </Link>
        {demoMode ? (
          <Link className="button secondary" href={`/review/summary?demo=1${recordingMode ? "&recording=1" : ""}`}>
            Demo Summary
          </Link>
        ) : null}
        <a className="button secondary" href={`/cases/${caseId}/report${query}`}>
          Stakeholder Report
        </a>
        <a className="button secondary" href={`/cases/${caseId}/dossier${query}`}>
          Validation Dossier
        </a>
        <a className="button primary" href={`/api/review-cases/${caseId}/export`} target="_blank">
          Export JSON
        </a>
      </div>
      {demoMode || recordingMode ? (
        <div className="panel" style={{ background: "var(--accent-soft)", boxShadow: "none" }}>
          {recordingMode
            ? "Recording mode is active. This view is trimmed for screen capture and keeps the strongest evidence panels visible first."
            : "Demo mode is active. This view emphasizes evidence, reviewer decisions, and validation over raw technical detail."}
        </div>
      ) : null}
      <h2>Case Evidence Summary</h2>
      <p>{evidence.summary}</p>
      <div className="pill-row">
        <span className={`tag ${evidence.status === "accepted" ? "ok" : evidence.status === "rejected" ? "danger" : "warn"}`}>
          {evidence.status}
        </span>
        <span className="pill" data-testid="case-evidence-artifact-state">
          {evidence.artifactState === "frozen" ? "Frozen reviewed artifact" : "Live workflow evidence"}
        </span>
        {sourceProfile ? <span className="pill">{sourceProfileLabel(sourceProfile)}</span> : null}
        <span className="pill">Updated {evidence.updatedAt}</span>
        {evidence.frozenAt ? <span className="pill">Frozen {evidence.frozenAt}</span> : null}
        {evidence.frozenBy ? <span className="pill">Frozen by {evidence.frozenBy}</span> : null}
        {evidence.reviewSummary.lastReviewer ? <span className="pill">Reviewer {evidence.reviewSummary.lastReviewer}</span> : null}
      </div>
      <div className="hero-stats">
        <div className="hero-stat">
          <strong>Artifact state</strong>
          <p>Whether this view is showing a frozen reviewed artifact or live evidence.</p>
          <span className="hero-stat-value">{evidence.artifactState === "frozen" ? "Frozen" : "Live"}</span>
        </div>
        <div className="hero-stat">
          <strong>Finalization</strong>
          <p>Clinical readiness state after blockers, warnings, and override requirements are applied.</p>
          <span className="hero-stat-value">
            {evidence.finalizationState === "blocked" ? "Blocked" : evidence.finalizationState === "warn" ? "Warn" : "Ready"}
          </span>
        </div>
        <div className="hero-stat">
          <strong>Acceptance blockers</strong>
          <p>Outstanding conditions that prevent or qualify acceptance.</p>
          <span className="hero-stat-value">{evidence.acceptanceBlockers.length}</span>
        </div>
        <div className="hero-stat">
          <strong>Validation readiness</strong>
          <p>Roadmap triage state for remediation, deployment prep, or downstream evidence reuse.</p>
          <span className="hero-stat-value">{evidence.validationReadiness.label}</span>
        </div>
        <div className="hero-stat">
          <strong>Validation protocol</strong>
          <p>Overall internal validation score and promotion recommendation.</p>
          <span className="hero-stat-value">{evidence.validationProtocol.overallScore}</span>
        </div>
      </div>
    </div>
  );
}
