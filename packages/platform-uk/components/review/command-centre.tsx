"use client";

import Link from "next/link";
import { useMemo } from "react";

import { buildM1ActionInboxEvidencePayload, buildRoadmapEvidencePayload } from "@/lib/roadmap-evidence";
import { useDashboardSummary } from "@/lib/use-dashboard-summary";
import { useRoadmapState } from "@/lib/use-roadmap-state";
import { CommandCentreDataHealthSummary } from "./CommandCentreDataHealthSummary";

function statusTone(count: number) {
  return count > 0 ? "alert" : "";
}

export function CommandCentre() {
  const { summary, isLoaded: isDashboardLoaded, error: dashboardError } = useDashboardSummary();
  const { state, isLoaded: isRoadmapLoaded, error: roadmapError } = useRoadmapState();
  const roadmapEvidence = useMemo(() => buildRoadmapEvidencePayload(state), [state]);
  const actionEvidence = useMemo(() => buildM1ActionInboxEvidencePayload(state), [state]);
  const isLoaded = isDashboardLoaded && isRoadmapLoaded;
  const error = dashboardError || roadmapError;

  if (!isLoaded) {
    return <div className="panel">Loading command centre...</div>;
  }

  if (error || !summary) {
    return <div className="panel">{error ?? "Failed to load command centre."}</div>;
  }

  const nextBuildPriorities = [
    {
      title: "Run clean-demo readiness",
      detail: "Use the checklist before stakeholder walkthroughs to confirm data, evidence, guardrails, and rehearsal state.",
      href: "/review/demo-readiness?demo=1"
    },
    {
      title: "Clear M1 active actions",
      detail: `${actionEvidence.summary.active} active generated action(s) need owner acknowledgement or follow-through.`,
      href: "/review/roadmap/follow-through"
    },
    {
      title: "Protect evidence quality",
      detail: "Keep benchmark, readiness, and roadmap exports current before external conversations.",
      href: "/review/readiness"
    },
    {
      title: "Refactor large workflow surfaces",
      detail: "Split the large review, ops, and roadmap components only after this operating spine is stable.",
      href: "/review/ops"
    }
  ];

  return (
    <div className="grid">
      <section className="span-12 hero-banner stack">
        <span className="hero-kicker">Product command centre</span>
        <h2>One view for what is built, what is safe to show, and what needs work next.</h2>
        <p>
          Aksh Health UK/EU is currently a synthetic-data, review-first clinical proof platform. This page connects the
          clinical workflow, evidence layer, operations layer, and 12-month roadmap so the product feels like one system.
        </p>
        <div className="actions">
          <Link className="button primary" href="/review/team-mode">
            Team mode
          </Link>
          <Link className="button secondary" href="/review/demo-mode">
            Demo mode
          </Link>
          <Link className="button secondary" href="/review/demo-readiness?demo=1">
            Demo readiness
          </Link>
          <Link className="button secondary" href="/review/simulated-patients">
            Simulated patients
          </Link>
          <Link className="button secondary" href="/review/governance-pack">
            Governance pack
          </Link>
          <Link className="button secondary" href="/review/roadmap/actions">
            M1 action inbox
          </Link>
          <Link className="button secondary" href="/review/roadmap/report">
            Roadmap report
          </Link>
          <Link className="button secondary" href="/review/command-centre/report">
            Product state report
          </Link>
          <a className="button secondary" href="/api/command-centre/state">
            Export state JSON
          </a>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <strong>Clinical proof loop</strong>
            <p>Intake, draft, safety checks, reviewer decision, frozen evidence, and exports are built.</p>
            <span className="hero-stat-value">Live proof</span>
          </div>
          <div className="hero-stat">
            <strong>Synthetic boundary</strong>
            <p>No production clinical software, real patient-data handling, or live NHS integration claim yet.</p>
            <span className="hero-stat-value">Strict</span>
          </div>
          <div className="hero-stat">
            <strong>Next work</strong>
            <p>Roadmap and action layers show what needs owner follow-through next.</p>
            <span className="hero-stat-value">{actionEvidence.summary.active} active</span>
          </div>
        </div>
      </section>

      <section className="span-12 panel stack">
        <div className="row">
          <div>
            <h3>Choose A Mode</h3>
            <p>Use Team Mode for internal execution and Demo Mode for clean external storytelling.</p>
          </div>
          <span className="pill">two clear paths</span>
        </div>
        <div className="grid">
          <article className="span-6 panel stack">
            <div>
              <h3>Team Mode</h3>
              <p>For working sessions: review queue, new intake, evidence gaps, ops, and M1 action follow-through.</p>
            </div>
            <Link className="button primary" href="/review/team-mode">
              Open Team Mode
            </Link>
          </article>
          <article className="span-6 panel stack">
            <div>
              <h3>Demo Mode</h3>
              <p>For advisor or investor-style walkthroughs: product story, presenter guide, pilot package, and reports.</p>
            </div>
            <Link className="button secondary" href="/review/demo-mode">
              Open Demo Mode
            </Link>
          </article>
        </div>
      </section>

      <section className="span-12 panel stack">
        <div className="row">
          <div>
            <h3>Built Product Map</h3>
            <p>The current platform is strongest as a clinical-governance and evidence-quality proof system.</p>
          </div>
          <span className="pill">UK/EU active target</span>
        </div>
        <div className="grid">
          <div className="metric">
            <span className="meta">Pending reviews</span>
            <strong>{summary.overview.pendingCount}</strong>
          </div>
          <div className={`metric ${statusTone(summary.overview.blockedCount)}`}>
            <span className="meta">Blocked cases</span>
            <strong>{summary.overview.blockedCount}</strong>
          </div>
          <div className="metric">
            <span className="meta">Accepted artifacts</span>
            <strong>{summary.overview.acceptedCount}</strong>
          </div>
          <div className={`metric ${statusTone(summary.productivity.highRiskCount)}`}>
            <span className="meta">High-risk reviews</span>
            <strong>{summary.productivity.highRiskCount}</strong>
          </div>
          <div className={`metric ${statusTone(roadmapEvidence.summary.m1ActiveGeneratedActions)}`}>
            <span className="meta">M1 active actions</span>
            <strong>{roadmapEvidence.summary.m1ActiveGeneratedActions}</strong>
          </div>
          <div className="metric">
            <span className="meta">M1 acknowledged</span>
            <strong>{roadmapEvidence.summary.m1ResolvedGeneratedActions}</strong>
          </div>
        </div>
      </section>

      <CommandCentreDataHealthSummary />
      <section className="span-6 panel stack">
        <div className="row">
          <div>
            <h3>Safe To Show</h3>
            <p>Use these surfaces for internal reviews, advisor demos, and evidence conversations.</p>
          </div>
          <span className="tag ok">showable</span>
        </div>
        <div className="list">
          {[
            { label: "Product tour", detail: "Simple story for how the platform works.", href: "/demo?demo=1" },
            { label: "Demo readiness", detail: "Pre-walkthrough checklist for clean data, evidence, and language guardrails.", href: "/review/demo-readiness?demo=1" },
            { label: "Simulated patients", detail: "Richer fake patient cohort for testing the own-system workflow.", href: "/review/simulated-patients" },
            { label: "Governance pack", detail: "Clinical safety and governance rehearsal pack for production-readiness planning.", href: "/review/governance-pack" },
            { label: "Review queue", detail: "Working clinician review workflow.", href: "/review" },
            { label: "Evidence readiness", detail: "Current readiness gate and evidence status.", href: "/review/readiness" },
            { label: "Benchmark report", detail: "Synthetic scenario benchmark proof.", href: "/review/benchmarks/report" },
            { label: "Roadmap report", detail: "12-month build state, gaps, and boundaries.", href: "/review/roadmap/report" }
          ].map((item) => (
            <div className="row" key={item.href}>
              <div>
                <strong>{item.label}</strong>
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
            <h3>Do Not Claim Yet</h3>
            <p>These are roadmap ambitions, not current product facts.</p>
          </div>
          <span className="tag danger">guardrails</span>
        </div>
        <div className="list">
          {roadmapEvidence.doNotClaimYet.slice(0, 6).map((item) => (
            <div className="row" key={item}>
              <div>
                <strong>{item}</strong>
                <p>Use preparation, rehearsal, or future milestone language only.</p>
              </div>
              <span className="tag danger">not yet</span>
            </div>
          ))}
        </div>
      </section>

      <section className="span-7 panel stack">
        <div className="row">
          <div>
            <h3>Next Build Priorities</h3>
            <p>Build in this order so the product becomes clearer before it becomes wider.</p>
          </div>
          <span className="pill">recommended sequence</span>
        </div>
        <div className="list">
          {nextBuildPriorities.map((item, index) => (
            <div className="row" key={item.title}>
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

      <section className="span-5 panel stack">
        <div className="row">
          <div>
            <h3>Current Operating Signals</h3>
            <p>Small set of numbers that explain where attention should go.</p>
          </div>
          <span className="pill">live summary</span>
        </div>
        <div className="list">
          <div className="row">
            <div>
              <strong>{summary.overview.urgentCount} urgent clinical item(s)</strong>
              <p>High-risk, blocked, or overdue follow-up work.</p>
            </div>
            <Link className="button secondary" href="/workspace">
              Workspace
            </Link>
          </div>
          <div className="row">
            <div>
              <strong>{summary.productivity.needsEvidenceCount} evidence gap(s)</strong>
              <p>Cases or meeting outcomes waiting on stronger evidence.</p>
            </div>
            <Link className="button secondary" href="/review/readiness">
              Readiness
            </Link>
          </div>
          <div className="row">
            <div>
              <strong>{roadmapEvidence.summary.blockedOrCriticalItems} roadmap blocker(s)</strong>
              <p>Critical or blocked roadmap items still outside the proof.</p>
            </div>
            <Link className="button secondary" href="/review/roadmap">
              Roadmap
            </Link>
          </div>
          <div className="row">
            <div>
              <strong>{actionEvidence.summary.criticalActive} critical M1 action(s)</strong>
              <p>Owner actions that should be handled before new feature breadth.</p>
            </div>
            <Link className="button secondary" href="/review/roadmap/actions">
              Actions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
