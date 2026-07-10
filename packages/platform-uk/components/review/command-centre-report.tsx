"use client";

import Link from "next/link";
import { useMemo } from "react";

import { KnownLimitationsFooter } from "@/components/review/known-limitations-footer";
import { ReportActions } from "@/components/review/report-actions";
import { buildCommandCentreStatePayload } from "@/lib/command-centre-evidence";
import { useDashboardSummary } from "@/lib/use-dashboard-summary";
import { useRoadmapState } from "@/lib/use-roadmap-state";

export function CommandCentreReport() {
  const { summary, isLoaded: isDashboardLoaded, error: dashboardError } = useDashboardSummary();
  const { state, isLoaded: isRoadmapLoaded, error: roadmapError } = useRoadmapState();
  const isLoaded = isDashboardLoaded && isRoadmapLoaded;
  const error = dashboardError || roadmapError;
  const evidence = useMemo(() => {
    if (!summary) return null;
    return buildCommandCentreStatePayload(summary, state);
  }, [summary, state]);

  if (!isLoaded) {
    return <div className="panel">Loading product state report...</div>;
  }

  if (error || !summary || !evidence) {
    return <div className="panel">{error ?? "Failed to load product state report."}</div>;
  }

  return (
    <div className="report-page stack">
      <div className="report-header stack">
        <span className="hero-kicker">Command Centre Product State</span>
        <ReportActions backHref="/review/command-centre" exportHref="/api/command-centre/state" />
        <h1>Aksh Health UK/EU Product State Report</h1>
        <p>
          One printable artifact for what is built, what remains proof-stage, what must not be claimed yet, and what the
          next build priorities are.
        </p>
        <div className="actions">
          <Link className="button secondary" href="/review/team-mode">
            Team Mode
          </Link>
          <Link className="button secondary" href="/review/demo-mode">
            Demo Mode
          </Link>
          <Link className="button secondary" href="/review/roadmap/report">
            Roadmap Report
          </Link>
        </div>
      </div>

      <section className="report-section">
        <h2>Executive Summary</h2>
        <div className="grid">
          <div className="metric">
            <span className="meta">Product stage</span>
            <strong>{evidence.productStage}</strong>
          </div>
          <div className="metric">
            <span className="meta">Pending reviews</span>
            <strong>{evidence.summary.pendingReviews}</strong>
          </div>
          <div className={`metric ${evidence.summary.blockedCases ? "alert" : ""}`}>
            <span className="meta">Blocked cases</span>
            <strong>{evidence.summary.blockedCases}</strong>
          </div>
          <div className="metric">
            <span className="meta">Accepted artifacts</span>
            <strong>{evidence.summary.acceptedArtifacts}</strong>
          </div>
          <div className={`metric ${evidence.summary.m1ActiveActions ? "alert" : ""}`}>
            <span className="meta">M1 active actions</span>
            <strong>{evidence.summary.m1ActiveActions}</strong>
          </div>
          <div className={`metric ${evidence.summary.roadmapBlockedOrCritical ? "alert" : ""}`}>
            <span className="meta">Roadmap blockers</span>
            <strong>{evidence.summary.roadmapBlockedOrCritical}</strong>
          </div>
        </div>
        <p>
          Generated at {evidence.generatedAt}. Synthetic-only proof artifact; not production clinical software, live NHS
          integration, or real-patient-data readiness evidence.
        </p>
      </section>

      <section className="report-section">
        <h2>What Is Built</h2>
        <div className="list">
          {Object.entries(evidence.builtState).map(([key, value]) => (
            <div className="row" key={key}>
              <div>
                <strong>{key.replace(/([A-Z])/g, " $1").toLowerCase()}</strong>
                <p>{value}</p>
              </div>
              <span className="tag ok">built</span>
            </div>
          ))}
        </div>
      </section>

      <section className="report-section">
        <h2>Safe To Show</h2>
        <div className="list">
          {evidence.safeToShow.map((item) => (
            <div className="row" key={item.route}>
              <div>
                <strong>{item.label}</strong>
                <p>{item.purpose}</p>
                <p>{item.route}</p>
              </div>
              <Link className="button secondary" href={item.route}>
                Open
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="report-section">
        <h2>Do Not Claim Yet</h2>
        <div className="list">
          {evidence.guardrails.map((item) => (
            <div className="row" key={item}>
              <div>
                <strong>{item}</strong>
                <p>Use preparation, rehearsal, or future milestone language only.</p>
              </div>
              <span className="tag danger">not claimable</span>
            </div>
          ))}
        </div>
      </section>

      <section className="report-section">
        <h2>Next Build Priorities</h2>
        <div className="list">
          {evidence.nextBuildPriorities.map((item, index) => (
            <div className="row" key={item.title}>
              <div>
                <strong>
                  {index + 1}. {item.title}
                </strong>
                <p>{item.rationale}</p>
              </div>
              <Link className="button secondary" href={item.route}>
                Open
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="report-section">
        <h2>Current Signals</h2>
        <div className="grid">
          <div className="metric">
            <span className="meta">Urgent clinical</span>
            <strong>{evidence.summary.urgentClinicalItems}</strong>
          </div>
          <div className="metric">
            <span className="meta">High-risk reviews</span>
            <strong>{evidence.summary.highRiskReviews}</strong>
          </div>
          <div className="metric">
            <span className="meta">Evidence gaps</span>
            <strong>{evidence.summary.evidenceGaps}</strong>
          </div>
          <div className="metric">
            <span className="meta">M1 acknowledged</span>
            <strong>{evidence.summary.m1AcknowledgedActions}</strong>
          </div>
          <div className="metric">
            <span className="meta">Safe surfaces</span>
            <strong>{evidence.summary.safeToShowSurfaces}</strong>
          </div>
          <div className="metric alert">
            <span className="meta">Not claimable</span>
            <strong>{evidence.summary.notClaimableItems}</strong>
          </div>
        </div>
      </section>

      <KnownLimitationsFooter artifactLabel="This command centre product state report" />
    </div>
  );
}
