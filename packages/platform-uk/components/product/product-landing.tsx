import Link from "next/link";

import { MarketingShell } from "@/components/marketing/MarketingShell";

const trustBadges = [
  "NHS GP Connect Architecture",
  "FHIR R4 Evidence Shape",
  "GDPR Article 9 Boundary",
  "MHRA SaMD-Aware Design",
  "21 CFR Part 11 Audit Trail",
  "Synthetic-Safe Environment",
];

const proofStats = [
  {
    value: "56",
    label: "Product surfaces",
    detail: "Review flows, evidence reports, ops views, roadmap, readiness, governance, and export routes: all built."
  },
  {
    value: "7",
    label: "Benchmark scenarios",
    detail: "UK clinical workflow scenarios with expected outcomes, sign-off discipline, and pass/fail gates."
  },
  {
    value: "4",
    label: "Operating layers",
    detail: "Intake, clinician review, operations dashboards, and evidence governance: fully separated."
  },
  {
    value: "3",
    label: "Clinical roles",
    detail: "Clinical reviewer, operations lead, and leadership: each with a distinct workflow path and controls."
  }
];

const capabilities = [
  {
    icon: "01",
    title: "AI-Structured Intake",
    text: "Consultation notes and transcripts become structured, FHIR-shaped drafts with source trace, confidence scores, and workflow context.",
    items: [
      "Consultation note and transcript intake",
      "Source profile and provenance trace",
      "FHIR R4-shaped structured draft output"
    ]
  },
  {
    icon: "02",
    title: "Clinician-Owned Review",
    text: "Human accountability stays in the loop at every decision point. Safety flags, reviewer checklists, override rationale, and explicit accept or defer decisions keep the clinician in control.",
    items: [
      "Human-gate checkpoints at every decision",
      "Override and reviewer note capture",
      "Frozen reviewed artifact on acceptance"
    ]
  },
  {
    icon: "03",
    title: "Evidence & Governance",
    text: "Every accepted outcome becomes inspectable evidence: flowing into benchmark sign-off, readiness history, and governance-facing proof surfaces for regulatory inspection.",
    items: [
      "Benchmark report and sign-off flows",
      "Readiness snapshots and history tracking",
      "Governance pack and validation dossier"
    ]
  },
  {
    icon: "04",
    title: "Integration-Ready Architecture",
    text: "The platform demonstrates how future NHS GP Connect and EMIS integration fits: while keeping current proof boundaries clearly visible, honest, and non-overclaiming.",
    items: [
      "FHIR R4 export shape ready for live integration",
      "Synthetic-only labels throughout all surfaces",
      "Clear integration readiness roadmap"
    ]
  }
];

const howItWorks = [
  {
    step: "01",
    title: "Capture & Structure",
    text: "Bring in a consultation note, transcript, or synthetic source profile. The AI engine generates a structured draft with medications, observations, summary, and traceable source evidence."
  },
  {
    step: "02",
    title: "Clinician Review & Decision",
    text: "Surface blockers, ranked concerns, and reviewer checklist items before any decision is recorded. The clinician accepts, defers, rejects, or overrides: with full accountability captured."
  },
  {
    step: "03",
    title: "Freeze, Evidence & Governance",
    text: "Accepted cases preserve a frozen artifact and export payload. Benchmarks, sign-off, readiness gates, and governance packs determine whether the current proof is ready to show."
  }
];

const roles = [
  {
    role: "Clinical Reviewer",
    promise: "Review the next safe decision.",
    detail: "Priority queue, draft inspection, safety flags, checklist confirmation, and accept or defer controls: all in one focused clinical workflow.",
    href: "/review",
    cta: "Open clinical queue",
    primary: true
  },
  {
    role: "Operations Lead",
    promise: "Keep evidence work moving.",
    detail: "Owner assignment, due dates, follow-through tracking, meeting outcomes, benchmark gaps, and report readiness for the operations layer.",
    href: "/review/ops",
    cta: "Open ops dashboard",
    primary: false
  },
  {
    role: "Leadership",
    promise: "Understand safety and readiness.",
    detail: "A concise path to see what is working, what is blocked, and how close the platform is to credible clinical validation readiness.",
    href: "/dashboards",
    cta: "Open dashboards",
    primary: false
  }
];

const cockpitRows = [
  { label: "DOAC Review Queue", count: "3 pending", status: "warn" as const },
  { label: "Benchmark Sign-off", count: "6 / 7 passed", status: "good" as const },
  { label: "High-Risk Case", count: "1 blocked", status: "danger" as const },
  { label: "Evidence Readiness", count: "Staging gate", status: "warn" as const }
];

export function ProductLanding() {
  return (
    <MarketingShell>
    <main className="product-page product-page--landing">
      <div className="product-sky" aria-hidden="true" />

      {/* ── HERO ── */}
      <section className="product-hero product-hero--split">
        <div className="product-hero__copy">
          <p className="product-kicker">UK / EU Clinical AI Workflow Platform</p>
          <h1>Clinical workflow. AI-structured. Clinician-owned.</h1>
          <p>
            Aksh Health is a review-first clinical operating system for UK GPs. Messy consultation
            notes become structured, FHIR-shaped drafts. Clinician accountability stays visible at
            every decision. Evidence flows forward to governance without gaps.
          </p>
          <div className="pill-row product-pill-row">
            <span className="pill">NHS-ready</span>
            <span className="pill">FHIR R4</span>
            <span className="pill">GDPR Art. 9</span>
            <span className="pill">MHRA-aware</span>
          </div>
          <div className="product-actions">
            <Link className="product-button product-button--primary" href="/demo/patel">
              See it in action
            </Link>
            <Link className="product-button product-button--secondary" href="/dashboards">
              Open operator view
            </Link>
          </div>
        </div>

        <div className="product-hero-stack">
          <article className="product-hero-card" aria-label="Live platform cockpit preview">
            <span className="product-card-label">Platform cockpit</span>
            <strong>Clinical Workflow Status</strong>
            <div className="product-cockpit-preview">
              {cockpitRows.map((row) => (
                <div className="product-cockpit-row" key={row.label}>
                  <span>{row.label}</span>
                  <span className={`product-cockpit-status product-cockpit-status--${row.status}`}>
                    {row.count}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <div className="lp-hero-mini-grid">
            <div className="lp-hero-mini-card">
              <strong>FHIR R4</strong>
              <span>Evidence shape</span>
            </div>
            <div className="lp-hero-mini-card">
              <strong>Human gate</strong>
              <span>Every decision</span>
            </div>
            <div className="lp-hero-mini-card">
              <strong>Synthetic</strong>
              <span>Safe boundary</span>
            </div>
            <div className="lp-hero-mini-card">
              <strong>Audit trail</strong>
              <span>21 CFR Part 11</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <div className="lp-trust-strip" aria-label="Compliance standards">
        {trustBadges.map((badge) => (
          <span className="lp-trust-badge" key={badge}>{badge}</span>
        ))}
      </div>

      {/* ── STATS ── */}
      <section className="product-stat-grid" aria-label="Platform proof metrics">
        {proofStats.map((stat) => (
          <article className="product-stat" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
            <p>{stat.detail}</p>
          </article>
        ))}
      </section>

      {/* ── CAPABILITIES ── */}
      <section className="product-section" aria-labelledby="capabilities-heading">
        <div className="product-section-head">
          <p className="product-kicker">Platform capabilities</p>
          <h2 id="capabilities-heading">Everything the clinical workflow needs to run.</h2>
          <p>
            Four interlocking capabilities: from unstructured intake to inspectable governance
            evidence: built to support a credible UK GP clinical AI deployment.
          </p>
        </div>
        <div className="product-capability-grid">
          {capabilities.map((cap) => (
            <article className="product-capability-card" key={cap.title}>
              <span className="lp-cap-icon">{cap.icon}</span>
              <h3>{cap.title}</h3>
              <p>{cap.text}</p>
              <ul className="product-bullet-list">
                {cap.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="product-section product-section--soft" aria-labelledby="how-heading">
        <div className="product-section-head">
          <p className="product-kicker">How it works</p>
          <h2 id="how-heading">Intake to evidence in three stages.</h2>
          <p>
            A controlled clinical workflow loop: from unstructured input to frozen evidence artifact,
            keeping every decision auditable and every boundary professionally honest.
          </p>
        </div>
        <div className="lp-how-grid">
          {howItWorks.map((step) => (
            <article className="lp-how-card" key={step.title}>
              <span className="lp-how-step">{step.step}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── ROLES ── */}
      <section className="product-section" aria-labelledby="roles-heading">
        <div className="product-section-head">
          <p className="product-kicker">Built for your role</p>
          <h2 id="roles-heading">Each role gets the workflow it needs.</h2>
          <p>
            Aksh Health adapts to clinical reviewers, operations leads, and leadership | each with
            a distinct path, purpose, and set of controls.
          </p>
        </div>
        <div className="lp-roles-grid">
          {roles.map((role) => (
            <article className="lp-role-card" key={role.role}>
              <div className="lp-role-card__body">
                <p className="product-kicker">{role.role}</p>
                <h3>{role.promise}</h3>
                <p>{role.detail}</p>
              </div>
              <Link
                className={`product-button ${role.primary ? "product-button--primary" : "product-button--secondary"}`}
                href={role.href}
              >
                {role.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="product-cta" aria-label="Get started with Aksh Health">
        <div>
          <p className="product-kicker">Ready to explore?</p>
          <h2>The synthetic proof environment is live.</h2>
          <p>
            No real patient data. No live NHS writeback. A complete clinical workflow platform
            running in a safe validation environment: ready to inspect, demonstrate, and evaluate.
          </p>
        </div>
        <div className="product-actions">
          <Link className="product-button product-button--primary" href="/demo/patel">
            Open demo path
          </Link>
          <Link className="product-button product-button--secondary" href="/dashboards">
            Operator dashboards
          </Link>
          <Link className="product-button product-button--secondary" href="/onboarding">
            Choose your role
          </Link>
        </div>
      </section>
    </main>
    </MarketingShell>
  );
}
