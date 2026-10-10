"use client";

import Link from "next/link";
import { useMemo } from "react";

import { buildM1ActionInboxEvidencePayload, buildRoadmapEvidencePayload } from "@/lib/roadmap-evidence";
import { useDashboardSummary } from "@/lib/use-dashboard-summary";
import { useRoadmapState } from "@/lib/use-roadmap-state";

type ProductMode = "team" | "demo";

const teamTracks = [
  {
    title: "Clinical review work",
    detail: "Review pending synthetic cases, resolve blockers, and capture clinician decisions.",
    href: "/review",
    cta: "Open queue"
  },
  {
    title: "New synthetic intake",
    detail: "Create a new consultation-style input and inspect the generated structured draft.",
    href: "/intake",
    cta: "Start intake"
  },
  {
    title: "Simulated patient cohort",
    detail: "Inspect richer fake patient profiles that power own-system testing without real data.",
    href: "/review/simulated-patients",
    cta: "Open cohort"
  },
  {
    title: "Governance pack",
    detail: "Review the safety-case rehearsal, hazard log structure, controls, and production-readiness gaps.",
    href: "/review/governance-pack",
    cta: "Open pack"
  },
  {
    title: "Evidence readiness",
    detail: "Check whether benchmark sign-off, exports, and proof artifacts are ready for review.",
    href: "/review/readiness",
    cta: "Check readiness"
  },
  {
    title: "M1 action inbox",
    detail: "Acknowledge generated owner actions and keep roadmap follow-through visible.",
    href: "/review/roadmap/actions",
    cta: "Open actions"
  },
  {
    title: "M1 follow-through board",
    detail: "Track next step, target date, blocker, and evidence link after an action is acknowledged.",
    href: "/review/roadmap/follow-through",
    cta: "Open follow-through"
  },
  {
    title: "Operations dashboard",
    detail: "Review feedback, meeting follow-through, remediation queues, and owner workload.",
    href: "/review/ops",
    cta: "Open ops"
  }
];

const demoTracks = [
  {
    title: "Demo readiness checklist",
    detail: "Confirm clean data, benchmark sign-off, readiness snapshots, safe routes, and no-overclaim language.",
    href: "/review/demo-readiness?demo=1",
    cta: "Check readiness"
  },
  {
    title: "Product tour",
    detail: "Use this as the simple narrative entry point for how Aksh Health works.",
    href: "/demo?demo=1",
    cta: "Open tour"
  },
  {
    title: "Presenter guide",
    detail: "Short talk tracks for walking advisors through the proof without overexplaining internals.",
    href: "/review/presenter?demo=1",
    cta: "Open guide"
  },
  {
    title: "Demo package",
    detail: "Curated proof package with stable demo cases, runbook, and evidence handoff links.",
    href: "/review/pilot?demo=1",
    cta: "Open package"
  },
  {
    title: "Benchmark report",
    detail: "Show synthetic scenario coverage, pass/fail state, and clinical evidence discipline.",
    href: "/review/benchmarks/report?demo=1",
    cta: "Open report"
  },
  {
    title: "Governance pack",
    detail: "Show how production clinical safety will be governed without claiming production sign-off.",
    href: "/review/governance-pack",
    cta: "Open pack"
  },
  {
    title: "Roadmap report",
    detail: "Show the honest build state, gaps, budget mismatch, and do-not-claim boundaries.",
    href: "/review/roadmap/report",
    cta: "Open roadmap"
  }
];

export function ProductModePage({ mode }: { mode: ProductMode }) {
  const { summary, isLoaded: isDashboardLoaded, error: dashboardError } = useDashboardSummary();
  const { state, isLoaded: isRoadmapLoaded, error: roadmapError } = useRoadmapState();
  const roadmapEvidence = useMemo(() => buildRoadmapEvidencePayload(state), [state]);
  const actionEvidence = useMemo(() => buildM1ActionInboxEvidencePayload(state), [state]);
  const isLoaded = isDashboardLoaded && isRoadmapLoaded;
  const error = dashboardError || roadmapError;
  const isTeamMode = mode === "team";
  const tracks = isTeamMode ? teamTracks : demoTracks;

  if (!isLoaded) {
    return <div className="panel">Loading {isTeamMode ? "team" : "demo"} mode...</div>;
  }

  if (error || !summary) {
    return <div className="panel">{error ?? `Failed to load ${isTeamMode ? "team" : "demo"} mode.`}</div>;
  }

  return (
    <div className="layout-grid">
      <section className="span-12 hero-banner stack">
        <span className="hero-kicker">{isTeamMode ? "Team mode" : "Demo mode"}</span>
        <h2>{isTeamMode ? "Run the internal clinical proof work." : "Show the proof without overclaiming it."}</h2>
        <p>
          {isTeamMode
            ? "Team mode keeps reviewers, operators, and founders focused on active work: clinical cases, evidence gaps, roadmap actions, and follow-through."
            : "Demo mode gives a safer external-facing path through the current product: polished story, stable proof surfaces, and explicit synthetic-only boundaries."}
        </p>
        <div className="actions">
          <Link className="button primary" href={isTeamMode ? "/review" : "/demo?demo=1"}>
            {isTeamMode ? "Start with queue" : "Start product tour"}
          </Link>
          <Link className="button secondary" href="/review/command-centre">
            Command centre
          </Link>
          <Link className="button secondary" href={isTeamMode ? "/review/roadmap/actions" : "/review/presenter?demo=1"}>
            {isTeamMode ? "M1 action inbox" : "Presenter guide"}
          </Link>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <strong>{isTeamMode ? "Urgent clinical work" : "Safe story path"}</strong>
            <p>{isTeamMode ? "High-risk, blocked, or overdue clinical review work." : "Demo surfaces that explain the proof clearly."}</p>
            <span className="hero-stat-value">{isTeamMode ? summary.overview.urgentCount : tracks.length}</span>
          </div>
          <div className="hero-stat">
            <strong>{isTeamMode ? "M1 active actions" : "Evidence surfaces"}</strong>
            <p>{isTeamMode ? "Generated roadmap follow-ups still active." : "Reports and exports that support the demo story."}</p>
            <span className="hero-stat-value">{isTeamMode ? actionEvidence.summary.active : 3}</span>
          </div>
          <div className="hero-stat">
            <strong>Synthetic boundary</strong>
            <p>Not production clinical software, live health system integration, or real patient-data readiness.</p>
            <span className="hero-stat-value">Visible</span>
          </div>
        </div>
      </section>

      <section className="span-8 panel stack">
        <div className="row">
          <div>
            <h3>{isTeamMode ? "Team Work Path" : "Demo Path"}</h3>
            <p>{isTeamMode ? "Open these in order during internal work sessions." : "Open these in order during advisor or investor-style walkthroughs."}</p>
          </div>
          <span className="pill">{tracks.length} steps</span>
        </div>
        <div className="list">
          {tracks.map((track, index) => (
            <div className="row" key={track.href}>
              <div>
                <strong>
                  {index + 1}. {track.title}
                </strong>
                <p>{track.detail}</p>
              </div>
              <Link className="button secondary" href={track.href}>
                {track.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="span-4 panel stack">
        <div className="row">
          <div>
            <h3>{isTeamMode ? "Operating Signals" : "Demo Guardrails"}</h3>
            <p>{isTeamMode ? "Use these to choose what to work on first." : "Use these to keep the story honest."}</p>
          </div>
          <span className={isTeamMode ? "pill" : "tag danger"}>{isTeamMode ? "live" : "strict"}</span>
        </div>
        {isTeamMode ? (
          <div className="list">
            <div className="row">
              <div>
                <strong>{summary.overview.pendingCount} pending reviews</strong>
                <p>Cases still waiting for reviewer decision.</p>
              </div>
            </div>
            <div className="row">
              <div>
                <strong>{summary.productivity.needsEvidenceCount} evidence gap(s)</strong>
                <p>Cases or outcomes waiting on stronger proof.</p>
              </div>
            </div>
            <div className="row">
              <div>
                <strong>{roadmapEvidence.summary.blockedOrCriticalItems} roadmap blocker(s)</strong>
                <p>Critical or blocked roadmap items.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="list">
            {roadmapEvidence.doNotClaimYet.slice(0, 5).map((claim) => (
              <div className="row" key={claim}>
                <div>
                  <strong>{claim}</strong>
                  <p>Use preparation or future milestone language only.</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
