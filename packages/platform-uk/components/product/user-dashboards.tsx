import Link from "next/link";

import { PublicProductNav } from "@/components/product/public-product-nav";
import type { DashboardSummary } from "@/lib/dashboard-summary";

type EvidenceSnapshot = {
  benchmarkTotal: number;
  benchmarkPassed: number;
  benchmarkFailed: number;
  readinessStatus: string;
  readinessLabel: string;
  openActions: number;
  syntheticOnly: boolean;
};

type UserDashboardsProps = {
  clinical: DashboardSummary;
  operations: DashboardSummary;
  evidence: EvidenceSnapshot;
};

type Tone = "neutral" | "good" | "warn" | "danger";

function KpiTile({ label, value, tone = "neutral" }: { label: string; value: string | number; tone?: Tone }) {
  return (
    <div className={`db-kpi db-kpi--${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

type RoleCardBadge = "command" | "clinical" | "ops" | "evidence";

function RoleCard({
  badge,
  badgeTone,
  title,
  description,
  metrics,
  href,
  cta,
  secondaryLinks
}: {
  badge: string;
  badgeTone: RoleCardBadge;
  title: string;
  description: string;
  metrics: Array<{ label: string; value: string | number; tone?: Tone }>;
  href: string;
  cta: string;
  secondaryLinks?: Array<{ label: string; href: string }>;
}) {
  return (
    <article className="db-role-card">
      <div className="db-role-card__head">
        <span className={`db-role-badge db-role-badge--${badgeTone}`}>{badge}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="db-metric-grid">
        {metrics.map((m) => (
          <div className={`db-metric db-metric--${m.tone ?? "neutral"}`} key={m.label}>
            <strong>{m.value}</strong>
            <span>{m.label}</span>
          </div>
        ))}
      </div>
      <div className="db-role-card__actions">
        <Link className="product-button product-button--primary db-role-cta" href={href}>
          {cta}
        </Link>
        {secondaryLinks && secondaryLinks.map((link) => (
          <Link className="product-button product-button--secondary db-role-cta" href={link.href} key={link.href}>
            {link.label}
          </Link>
        ))}
      </div>
    </article>
  );
}

const quickLinks = [
  { label: "Case review queue", href: "/review", desc: "All active cases" },
  { label: "Intake new case", href: "/intake", desc: "Start a new workflow" },
  { label: "Benchmark report", href: "/review/benchmarks", desc: "Sign-off and evidence" },
  { label: "Ops report", href: "/review/ops/report", desc: "Follow-through and owners" },
  { label: "Governance pack", href: "/review/governance-pack", desc: "Regulatory evidence" },
  { label: "Roadmap actions", href: "/review/roadmap/actions", desc: "M1 action inbox" },
  { label: "Meeting packet", href: "/review/meeting-packet", desc: "Presentation ready" },
  { label: "Demo path", href: "/demo", desc: "Guided walkthrough" }
];

export function UserDashboards({ clinical, operations, evidence }: UserDashboardsProps) {
  const urgentTotal = clinical.overview.urgentCount + operations.productivity.overdueMeetingActions;
  const benchmarkRate = evidence.benchmarkTotal > 0
    ? Math.round((evidence.benchmarkPassed / evidence.benchmarkTotal) * 100)
    : 0;
  const platformHealthy = urgentTotal === 0 && evidence.benchmarkFailed === 0;

  return (
    <main className="product-page product-page--dashboards">
      <div className="product-sky" aria-hidden="true" />
      <PublicProductNav ctaHref="/workspace" ctaLabel="Open workspace" />

      {/* ── PAGE HEADER ── */}
      <section className="db-page-header">
        <div>
          <p className="product-kicker">Operator dashboards</p>
          <h1>Aksh Health Platform</h1>
          <p>
            Select a dashboard to start your session. Urgent items requiring immediate attention
            are highlighted in red.
          </p>
        </div>
        <div className="db-platform-status">
          <div className={`db-status-indicator db-status-indicator--${platformHealthy ? "healthy" : "needs-attention"}`}>
            <span className="db-status-dot" aria-hidden="true" />
            <span className="db-status-label">
              {platformHealthy ? "Platform running cleanly" : `${urgentTotal} items need attention`}
            </span>
          </div>
          <div className="db-header-stats">
            <div className="db-header-stat">
              <strong>{clinical.overview.pendingCount}</strong>
              <span>Pending</span>
            </div>
            <div className="db-header-stat">
              <strong>{evidence.benchmarkPassed}/{evidence.benchmarkTotal}</strong>
              <span>Benchmarks</span>
            </div>
            <div className="db-header-stat">
              <strong>{evidence.readinessLabel}</strong>
              <span>Readiness</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── KPI BAR ── */}
      <div className="db-kpi-bar" role="region" aria-label="Key platform metrics">
        <KpiTile
          label="Urgent items"
          value={urgentTotal}
          tone={urgentTotal > 0 ? "danger" : "good"}
        />
        <KpiTile
          label="Pending reviews"
          value={clinical.overview.pendingCount}
          tone={clinical.overview.pendingCount > 0 ? "warn" : "good"}
        />
        <KpiTile
          label="Overdue follow-ups"
          value={operations.productivity.overdueFollowUps}
          tone={operations.productivity.overdueFollowUps > 0 ? "danger" : "good"}
        />
        <KpiTile
          label="Benchmark pass rate"
          value={`${benchmarkRate}%`}
          tone={benchmarkRate >= 80 ? "good" : benchmarkRate >= 60 ? "warn" : "danger"}
        />
      </div>

      {/* ── DASHBOARD CARDS ── */}
      <section className="db-cards-grid" role="region" aria-label="Operator dashboard panels">
        <RoleCard
          badge="Command Centre"
          badgeTone="command"
          title="Cross-functional control"
          description="Start every session here. See the full picture — urgency, pending work, evidence health — and decide where to act first."
          href="/review/command-centre"
          cta="Open command centre"
          secondaryLinks={[{ label: "Session summary", href: "/review/summary" }]}
          metrics={[
            { label: "Urgent signals", value: urgentTotal, tone: urgentTotal > 0 ? "danger" : "good" },
            { label: "Pending reviews", value: clinical.overview.pendingCount, tone: clinical.overview.pendingCount > 0 ? "warn" : "good" },
            { label: "Open follow-ups", value: operations.overview.followUpCount, tone: operations.overview.followUpCount > 0 ? "warn" : "good" },
            { label: "Evidence actions", value: evidence.openActions, tone: evidence.openActions > 0 ? "warn" : "good" }
          ]}
        />

        <RoleCard
          badge="Clinical"
          badgeTone="clinical"
          title={clinical.persona.title}
          description={clinical.persona.focus}
          href="/review"
          cta="Open review queue"
          secondaryLinks={[{ label: "High-risk case", href: "/cases/case-001" }]}
          metrics={[
            { label: "Pending reviews", value: clinical.overview.pendingCount, tone: clinical.overview.pendingCount > 0 ? "warn" : "good" },
            { label: "Blocked cases", value: clinical.overview.blockedCount, tone: clinical.overview.blockedCount > 0 ? "warn" : "good" },
            { label: "High-risk", value: clinical.productivity.highRiskCount, tone: clinical.productivity.highRiskCount > 0 ? "danger" : "good" },
            { label: "Ready to finalise", value: clinical.productivity.readyToFinalizeCount, tone: "good" }
          ]}
        />

        <RoleCard
          badge="Operations"
          badgeTone="ops"
          title={operations.persona.title}
          description={operations.persona.focus}
          href="/review/ops"
          cta="Open ops dashboard"
          secondaryLinks={[{ label: "Ops report", href: "/review/ops/report" }]}
          metrics={[
            { label: "Follow-up load", value: operations.overview.followUpCount, tone: operations.overview.followUpCount > 0 ? "warn" : "good" },
            { label: "Overdue", value: operations.productivity.overdueFollowUps, tone: operations.productivity.overdueFollowUps > 0 ? "danger" : "good" },
            { label: "Promoted cases", value: operations.productivity.promotedCount, tone: "good" },
            { label: "Carryover", value: operations.productivity.carryoverCount, tone: operations.productivity.carryoverCount > 0 ? "warn" : "good" }
          ]}
        />

        <RoleCard
          badge="Evidence"
          badgeTone="evidence"
          title="Evidence & Readiness"
          description="Benchmark discipline, proof coherence, and whether the synthetic environment is credible enough for internal use and governance review."
          href="/review/readiness"
          cta="Open readiness view"
          secondaryLinks={[{ label: "Benchmark report", href: "/review/benchmarks" }]}
          metrics={[
            { label: "Benchmarks passed", value: `${evidence.benchmarkPassed}/${evidence.benchmarkTotal}`, tone: "good" },
            { label: "Failures", value: evidence.benchmarkFailed, tone: evidence.benchmarkFailed > 0 ? "danger" : "good" },
            { label: "Open actions", value: evidence.openActions, tone: evidence.openActions > 0 ? "warn" : "good" },
            { label: "Readiness gate", value: evidence.readinessLabel, tone: evidence.readinessStatus === "ready" ? "good" : "warn" }
          ]}
        />
      </section>

      {/* ── QUICK ACCESS ── */}
      <section className="product-section" aria-labelledby="quick-access-heading">
        <div className="product-section-head">
          <p className="product-kicker">Quick access</p>
          <h2 id="quick-access-heading">Jump to any workflow surface.</h2>
          <p>Direct links to every active route in the platform.</p>
        </div>
        <div className="db-quick-grid">
          {quickLinks.map((item) => (
            <Link className="db-quick-link" href={item.href} key={item.href}>
              <strong>{item.label}</strong>
              <span>{item.desc}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
