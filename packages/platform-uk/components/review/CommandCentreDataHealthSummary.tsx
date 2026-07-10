"use client";

import { useMemo } from "react";
import { useDashboardSummary } from "@/lib/use-dashboard-summary";
import { deriveDataHealthSummary } from "@/lib/data-health";
import { useReviewCases } from "@/lib/use-review-cases";
import type { BenchmarkSignoffEntry } from "@/lib/benchmark-signoff-types";
import type { FeedbackEntry } from "@/lib/feedback-types";

export function CommandCentreDataHealthSummary() {
  const { summary, isLoaded: isDashboardLoaded, error: dashboardError } = useDashboardSummary();
  const { cases, isLoaded: areCasesLoaded, error: casesError } = useReviewCases();
  const feedbackArchive: FeedbackEntry[] = [];
  const latestBenchmarkSignoff: BenchmarkSignoffEntry | undefined = undefined;
  const isLoaded = isDashboardLoaded && areCasesLoaded;
  const error = dashboardError || casesError;

  const dataHealth = useMemo(() => {
    if (!summary) return null;
    return deriveDataHealthSummary(cases, feedbackArchive, latestBenchmarkSignoff);
  }, [cases, summary]);

  if (!isLoaded) {
    return <div className="panel">Loading data health summary...</div>;
  }
  if (error || !summary || !dataHealth) {
    return <div className="panel">{error ?? "Failed to load data health summary."}</div>;
  }

  return (
    <section className="span-6 panel stack">
      <div className="row">
        <div>
          <h3>Data Health Summary</h3>
          <p>Seed coverage, benchmark actions, remediation, and feedback status for internal evidence readiness.</p>
        </div>
        <span className={`tag ${dataHealth.state === "clean_seed" ? "ok" : dataHealth.state === "session_modified" ? "warn" : "alert"}`}>{dataHealth.state}</span>
      </div>
      <ul>
        <li>Seed cases present: {dataHealth.presentSeedCount} / {dataHealth.seedCaseCount}</li>
        <li>Extra cases: {dataHealth.extraCaseCount}</li>
        <li>Open benchmark actions: {dataHealth.openBenchmarkActions}</li>
        <li>Stalled remediation actions: {dataHealth.stalledRemediationActions}</li>
        <li>Open feedback items: {dataHealth.openFeedbackItems}</li>
        <li>Benchmark signoff: {dataHealth.benchmarkSignoffStatus}</li>
      </ul>
      <div className="actions">
        <a className="button secondary" href="/api/evidence/registry">
          Export Evidence Registry
        </a>
        <a className="button secondary" href="/api/benchmarks/evidence">
          Export Benchmark Evidence
        </a>
      </div>
      <p className="meta">
        Reset policy: this view is read-only. Use app reset actions for active demo cohorts and manually archive scoped
        JSON files only after evidence history is no longer needed.
      </p>
    </section>
  );
}
