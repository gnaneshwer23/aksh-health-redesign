"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { commandCentreSafeToShow } from "@/lib/command-centre-evidence";
import { deriveDataHealthSummary, deriveEvidenceReadinessGate } from "@/lib/data-health";
import { deriveEvidenceReadinessTrend } from "@/lib/readiness-history-analytics";
import { buildRoadmapEvidencePayload } from "@/lib/roadmap-evidence";
import { useBenchmarkSignoff } from "@/lib/use-benchmark-signoff";
import { useFeedbackState } from "@/lib/use-feedback-state";
import { useReadinessHistory } from "@/lib/use-readiness-history";
import { useReviewCases } from "@/lib/use-review-cases";
import { useRoadmapState } from "@/lib/use-roadmap-state";
import { deriveScenarioBenchmark, deriveScenarioBenchmarkActionQueue, deriveRemediationStalledAlerts } from "@/lib/workflow";

type ReadinessStatus = "ready" | "warn" | "blocked" | "manual";

type ReadinessCheck = {
  title: string;
  detail: string;
  status: ReadinessStatus;
  actionHref?: string;
  actionLabel?: string;
};

const manualChecks = [
  "Ran npm run verify in this build cycle",
  "Ran npm run build in this build cycle",
  "Opened the product tour and presenter guide in demo mode",
  "Confirmed synthetic-only language is used throughout the walkthrough",
  "Confirmed no live NHS, production clinical, or real-patient-data claim is made"
];

function tagClass(status: ReadinessStatus) {
  if (status === "ready") return "ok";
  if (status === "blocked") return "danger";
  if (status === "manual") return "warn";
  return "warn";
}

function statusLabel(status: ReadinessStatus) {
  if (status === "ready") return "ready";
  if (status === "blocked") return "blocked";
  if (status === "manual") return "manual";
  return "needs prep";
}

export function DemoReadinessChecklist({
  demoMode = false,
  recordingMode = false
}: {
  demoMode?: boolean;
  recordingMode?: boolean;
}) {
  const { cases, isLoaded: casesLoaded, error: casesError } = useReviewCases();
  const { archive: feedbackArchive, isLoaded: feedbackLoaded, error: feedbackError } = useFeedbackState();
  const { archive: signoffArchive, isLoaded: signoffLoaded, error: signoffError } = useBenchmarkSignoff();
  const { archive: readinessArchive, isLoaded: readinessLoaded, error: readinessError } = useReadinessHistory();
  const { state: roadmapState, isLoaded: roadmapLoaded, error: roadmapError } = useRoadmapState();
  const [checkedManualItems, setCheckedManualItems] = useState<Record<string, boolean>>({});
  const sharedQuery = `${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;
  const latestSignoff = signoffArchive[0];
  const latestReadinessSnapshot = readinessArchive[0];
  const roadmapEvidence = useMemo(() => buildRoadmapEvidencePayload(roadmapState), [roadmapState]);
  const benchmark = useMemo(() => deriveScenarioBenchmark(cases), [cases]);
  const benchmarkActions = useMemo(() => deriveScenarioBenchmarkActionQueue(cases), [cases]);
  const stalledRemediation = useMemo(() => deriveRemediationStalledAlerts(cases), [cases]);
  const dataHealth = useMemo(
    () => deriveDataHealthSummary(cases, feedbackArchive, latestSignoff),
    [cases, feedbackArchive, latestSignoff]
  );
  const readinessGate = useMemo(
    () => deriveEvidenceReadinessGate(cases, feedbackArchive, latestSignoff),
    [cases, feedbackArchive, latestSignoff]
  );
  const readinessTrend = useMemo(() => deriveEvidenceReadinessTrend(readinessArchive), [readinessArchive]);
  const openFeedbackCount = useMemo(
    () => feedbackArchive.filter((entry) => entry.resolutionStatus !== "resolved").length,
    [feedbackArchive]
  );
  const isLoaded = casesLoaded && feedbackLoaded && signoffLoaded && readinessLoaded && roadmapLoaded;
  const error = casesError || feedbackError || signoffError || readinessError || roadmapError;

  const automaticChecks: ReadinessCheck[] = useMemo(
    () => [
      {
        title: "Seed dataset is demo-safe",
        detail:
          dataHealth.missingSeedCount > 0
            ? `${dataHealth.missingSeedCount} seeded case(s) are missing and should be restored before walkthrough.`
            : dataHealth.extraCaseCount > 0
              ? `${dataHealth.extraCaseCount} session case(s) exist; acceptable only if you intend to show modified demo state.`
              : "Shared seed cohort is present with no extra session cases.",
        status: dataHealth.missingSeedCount > 0 ? "blocked" : dataHealth.extraCaseCount > 0 ? "warn" : "ready",
        actionHref: "/review",
        actionLabel: "Open queue"
      },
      {
        title: "Benchmark suite is clean",
        detail: `${benchmark.passed}/${benchmark.total} benchmark cases passing; ${benchmarkActions.total} open benchmark action(s).`,
        status: benchmark.failed > 0 || benchmarkActions.total > 0 ? "blocked" : "ready",
        actionHref: `/review/benchmarks${sharedQuery}`,
        actionLabel: "Open benchmarks"
      },
      {
        title: "Benchmark evidence is signed off",
        detail: latestSignoff
          ? `${latestSignoff.reviewerName || "Reviewer"} marked ${latestSignoff.decision.replaceAll("_", " ")}.`
          : "No benchmark sign-off has been saved yet.",
        status: latestSignoff?.decision === "accepted_for_internal_evidence" ? "ready" : latestSignoff ? "warn" : "blocked",
        actionHref: `/review/benchmarks/report${sharedQuery}`,
        actionLabel: "Open report"
      },
      {
        title: "Readiness snapshot is captured",
        detail: latestReadinessSnapshot
          ? `Latest snapshot says ${latestReadinessSnapshot.gate.label}; readiness trend is ${readinessTrend.direction.replaceAll("_", " ")}.`
          : "No readiness snapshot is saved yet; capture one after final review.",
        status: latestReadinessSnapshot
          ? latestReadinessSnapshot.gate.status === "ready"
            ? "ready"
            : latestReadinessSnapshot.gate.status === "blocked"
              ? "blocked"
              : "warn"
          : "warn",
        actionHref: `/review/readiness${sharedQuery}`,
        actionLabel: "Open readiness"
      },
      {
        title: "No operational queue will distract the demo",
        detail: `${stalledRemediation.length} stalled remediation action(s), ${openFeedbackCount} open feedback item(s).`,
        status: stalledRemediation.length > 0 ? "blocked" : openFeedbackCount > 0 ? "warn" : "ready",
        actionHref: `/review/ops${sharedQuery}`,
        actionLabel: "Open ops"
      },
      {
        title: "Safe route list is available",
        detail: `${commandCentreSafeToShow.length} safe-to-show surfaces are documented for the walkthrough path.`,
        status: commandCentreSafeToShow.length >= 8 ? "ready" : "warn",
        actionHref: "/review/command-centre",
        actionLabel: "Command centre"
      },
      {
        title: "Do-not-claim guardrails are visible",
        detail: `${roadmapEvidence.doNotClaimYet.length} guardrail(s) are available for the presenter and roadmap report.`,
        status: roadmapEvidence.doNotClaimYet.length > 0 ? "ready" : "warn",
        actionHref: "/review/roadmap/report",
        actionLabel: "Open roadmap"
      },
      {
        title: "Simulated patient cohort is available",
        detail: "Fake longitudinal profiles are available for realistic own-system testing without real patient records.",
        status: "ready",
        actionHref: "/review/simulated-patients",
        actionLabel: "Open cohort"
      },
      {
        title: "Governance pack is available",
        detail: "Safety-case sections, hazard rehearsal, controls, and production-readiness gaps are visible.",
        status: "ready",
        actionHref: "/review/governance-pack",
        actionLabel: "Open pack"
      },
      {
        title: "Research evaluation boundary is exportable",
        detail: "JSON artifact documents the non-production clinical AI boundary for advisor review.",
        status: "ready",
        actionHref: "/api/research/evaluation",
        actionLabel: "Export JSON"
      },
      {
        title: "Database adapter contract is exportable",
        detail: "Adapter contract documents JSON persistence and the future Postgres migration boundary.",
        status: "ready",
        actionHref: "/api/system/database-contract",
        actionLabel: "Export JSON"
      },
      {
        title: "Command centre report is printable",
        detail: "Product state report covers built state, safe surfaces, and do-not-claim guardrails.",
        status: "ready",
        actionHref: `/review/command-centre/report${sharedQuery}`,
        actionLabel: "Open report"
      },
      {
        title: "Board-pack export is available",
        detail: "Combined benchmark and readiness JSON is available for advisor handoff.",
        status: "ready",
        actionHref: `/api/evidence/board-pack${sharedQuery}`,
        actionLabel: "Export JSON"
      },
      {
        title: "Case dossier export is available",
        detail: "Consolidated per-case dossier JSON includes evidence, source trace, validation protocol, benchmark status, and reviewer decision.",
        status: "ready",
        actionHref: `/cases/case-005/dossier${sharedQuery}`,
        actionLabel: "Open dossier"
      },
      {
        title: "Deterministic seed and reset commands exist",
        detail: "npm run data:seed and npm run data:reset restore the synthetic cohort from data/seed/review-cases.seed.json.",
        status: "ready",
        actionHref: "/review/governance-pack",
        actionLabel: "Governance pack"
      },
      {
        title: "Audit integrity report is available",
        detail: "Audit trail checks validate accepted cases, frozen artifacts, and reviewer decision evidence.",
        status: "ready",
        actionHref: "/api/system/audit-integrity",
        actionLabel: "Export JSON"
      },
      {
        title: "Role permission matrix is documented",
        detail: "Clinical reviewer and operations lead action boundaries are exported for rehearsal.",
        status: "ready",
        actionHref: "/api/system/permission-matrix",
        actionLabel: "Export JSON"
      },
      {
        title: "Integration boundary contract is available",
        detail: "External adapters stay disabled-by-default; env vars and failure modes are documented for rehearsal.",
        status: "ready",
        actionHref: "/api/system/integration-contract",
        actionLabel: "Export JSON"
      }
    ],
    [
      benchmark.failed,
      benchmark.passed,
      benchmark.total,
      benchmarkActions.total,
      dataHealth.extraCaseCount,
      dataHealth.missingSeedCount,
      latestReadinessSnapshot,
      latestSignoff,
      openFeedbackCount,
      readinessTrend.direction,
      roadmapEvidence.doNotClaimYet.length,
      sharedQuery,
      stalledRemediation.length
    ]
  );

  const blockedCount = automaticChecks.filter((item) => item.status === "blocked").length;
  const warningCount = automaticChecks.filter((item) => item.status === "warn").length;
  const readyCount = automaticChecks.filter((item) => item.status === "ready").length;
  const completedManualCount = manualChecks.filter((item) => checkedManualItems[item]).length;
  const overallStatus = blockedCount > 0 ? "blocked" : warningCount > 0 ? "warn" : completedManualCount === manualChecks.length ? "ready" : "manual";

  if (!isLoaded) {
    return <div className="panel">Loading clean-demo readiness...</div>;
  }

  if (error) {
    return <div className="panel">{error}</div>;
  }

  return (
    <div className="grid">
      <section className="span-12 hero-banner stack">
        <span className="hero-kicker">Clean-demo readiness</span>
        <div className="actions">
          <Link className="button secondary" href="/review/demo-mode">
            Demo mode
          </Link>
          <Link className="button secondary" href="/review/command-centre">
            Command centre
          </Link>
          <Link className="button secondary" href={`/review/readiness${sharedQuery}`}>
            Evidence readiness
          </Link>
          <a className="button secondary" href="/api/command-centre/state">
            Export state JSON
          </a>
        </div>
        <h2>Prep the product for a stakeholder walkthrough without overclaiming it.</h2>
        <p>
          This page separates automatically derived readiness signals from manual rehearsal checks. Use it immediately
          before an advisor, investor, or pilot-partner walkthrough.
        </p>
        <div className="hero-stats">
          <div className="hero-stat">
            <strong>Overall status</strong>
            <p>{blockedCount ? "Resolve blockers before showing the demo." : warningCount ? "Demo is usable, but explain follow-ups clearly." : "Automatic checks are clean."}</p>
            <span className="hero-stat-value">{statusLabel(overallStatus)}</span>
          </div>
          <div className="hero-stat">
            <strong>Automatic checks</strong>
            <p>
              {readyCount} ready, {warningCount} needs prep, {blockedCount} blocked.
            </p>
            <span className="hero-stat-value">{automaticChecks.length}</span>
          </div>
          <div className="hero-stat">
            <strong>Manual rehearsal</strong>
            <p>Human confirmation for build gates, browser walkthrough, and language guardrails.</p>
            <span className="hero-stat-value">
              {completedManualCount}/{manualChecks.length}
            </span>
          </div>
        </div>
      </section>

      <section className="span-8 panel stack">
        <div className="row">
          <div>
            <h3>Automatic Readiness Checks</h3>
            <p>Derived from the current synthetic cases, feedback archive, benchmark sign-off, readiness history, and roadmap guardrails.</p>
          </div>
          <span className={`tag ${tagClass(overallStatus)}`}>{statusLabel(overallStatus)}</span>
        </div>
        <div className="list">
          {automaticChecks.map((item) => (
            <div className="row" key={item.title}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </div>
              <div className="actions">
                <span className={`tag ${tagClass(item.status)}`}>{statusLabel(item.status)}</span>
                {item.actionHref ? (
                  <Link className="button secondary" href={item.actionHref}>
                    {item.actionLabel ?? "Open"}
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="span-4 panel stack">
        <div className="row">
          <div>
            <h3>Manual Rehearsal Checks</h3>
            <p>Session-only checklist for the human steps the app cannot prove by itself.</p>
          </div>
          <span className="pill">
            {completedManualCount}/{manualChecks.length}
          </span>
        </div>
        <div className="list">
          {manualChecks.map((item) => (
            <label className="row" key={item}>
              <input
                checked={Boolean(checkedManualItems[item])}
                onChange={(event) =>
                  setCheckedManualItems((current) => ({
                    ...current,
                    [item]: event.target.checked
                  }))
                }
                type="checkbox"
              />
              <div>
                <strong>{item}</strong>
                <p>{checkedManualItems[item] ? "Confirmed for this walkthrough session." : "Confirm before showing externally."}</p>
              </div>
            </label>
          ))}
        </div>
      </section>

      <section className="span-6 panel stack">
        <div className="row">
          <div>
            <h3>Walkthrough Path</h3>
            <p>Open these in order for a clean stakeholder story.</p>
          </div>
          <span className="pill">demo route</span>
        </div>
        <div className="list">
          {[
            { title: "Clean-demo readiness", detail: "Automatic and manual prep checks.", href: "/review/demo-readiness?demo=1" },
            { title: "Product tour", detail: "Simple product narrative.", href: "/demo?demo=1" },
            { title: "Presenter guide", detail: "Talk track and guardrails.", href: "/review/presenter?demo=1" },
            { title: "Command centre report", detail: "Built state and do-not-claim boundaries.", href: "/review/command-centre/report?demo=1" },
            { title: "Benchmark report", detail: "Synthetic scenario proof.", href: "/review/benchmarks/report?demo=1" },
            { title: "Evidence readiness", detail: "Readiness gate and blockers.", href: "/review/readiness?demo=1" },
            { title: "Roadmap report", detail: "Build state and guardrail boundaries.", href: "/review/roadmap/report" }
          ].map((item, index) => (
            <div className="row" key={item.href}>
              <div>
                <strong>
                  {index + 1}. {item.title}
                </strong>
                <p>{item.detail}</p>
              </div>
              <Link className="button secondary" href={item.href}>
                Open
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="span-6 panel stack">
        <div className="row">
          <div>
            <h3>Language Guardrails</h3>
            <p>Use these phrases to keep the walkthrough professional and safe.</p>
          </div>
          <span className="tag danger">do not overclaim</span>
        </div>
        <div className="list">
          {roadmapEvidence.doNotClaimYet.slice(0, 6).map((item) => (
            <div className="row" key={item}>
              <div>
                <strong>{item}</strong>
                <p>Say “planned”, “rehearsed”, or “not yet production-ready” instead.</p>
              </div>
              <span className="tag danger">not yet</span>
            </div>
          ))}
        </div>
      </section>

      <section className="span-12 panel stack">
        <h3>Evidence Gate Snapshot</h3>
        <div className="list">
          <div className="row">
            <div>
              <strong>{readinessGate.label}</strong>
              <p>{readinessGate.summary}</p>
              {readinessGate.blockers.length ? <p>Blockers: {readinessGate.blockers.join("; ")}.</p> : null}
              {readinessGate.followUps.length ? <p>Follow-up: {readinessGate.followUps.join("; ")}.</p> : null}
            </div>
            <span className={`tag ${readinessGate.status === "ready" ? "ok" : readinessGate.status === "blocked" ? "danger" : "warn"}`}>
              {readinessGate.status.replaceAll("_", " ")}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
