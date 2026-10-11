import type { Metadata } from "next";
import Link from "next/link";

import { Pillars } from "@/components/site/Pillars";
import { SiteShell } from "@/components/site/SiteShell";
import { DIABETES_AREAS, HUMAN_GATES, PLATFORM_AGENTS, PLATFORM_LAYERS, PRODUCT_LOOP, STATUS_LABEL, type Status } from "@/components/site/vision";

export const metadata: Metadata = {
  title: "Platform",
  description:
    "The Aksh Intelligence Platform: twelve agents under one supervisor, one audit trail and one consent model, with disease modules on top. Diabetes first.",
};

const StatusPill = ({ s }: { s: Status }) => <span className={`s-status s-status--${s}`}>{STATUS_LABEL[s]}</span>;

export default function PlatformPage() {
  return (
    <SiteShell>
      <section className="s-page-head">
        <div className="s-container s-page-head__inner">
          <span className="s-eyebrow">The Aksh Intelligence Platform</span>
          <h1 className="s-h1" style={{ fontSize: "clamp(36px, 4.6vw, 54px)" }}>One intelligence layer beside the EHR.</h1>
          <p className="s-lede">
            Patient access and clinical workflows connected through auditable AI orchestration: twelve agents under one
            supervisor, one audit trail and one consent model, with disease modules on top. Aksh drafts and explains; a
            named clinician decides. Diabetes is the first module.
          </p>
          <nav className="s-actions" aria-label="On this page">
            <a href="#pillars" className="s-btn s-btn--ghost s-btn--sm">Pillars</a>
            <a href="#layers" className="s-btn s-btn--ghost s-btn--sm">Layers</a>
            <a href="#agents" className="s-btn s-btn--ghost s-btn--sm">Agents</a>
            <a href="#loop" className="s-btn s-btn--ghost s-btn--sm">The loop</a>
            <a href="#diabetes" className="s-btn s-btn--ghost s-btn--sm">Aksh Diabetes</a>
            <a href="#gates" className="s-btn s-btn--ghost s-btn--sm">Human gates</a>
          </nav>
        </div>
      </section>

      <section className="s-section" id="pillars" style={{ scrollMarginTop: 80 }}>
        <div className="s-container">
          <div className="s-head">
            <span className="s-eyebrow">Architecture</span>
            <h2 className="s-h2">Patient access and clinical intelligence, one foundation.</h2>
            <p className="s-lede">Two pillars share identity, consent, audit and integration. Administrative automation and clinical intelligence keep separate workflows and permissions.</p>
          </div>
          <Pillars />
        </div>
      </section>

      <section className="s-section s-section--soft" id="layers" style={{ scrollMarginTop: 80 }}>
        <div className="s-container s-feature" style={{ alignItems: "start" }}>
          <div className="s-feature__copy">
            <span className="s-eyebrow">Architecture</span>
            <h2 className="s-h2">One platform. Disease modules plug in.</h2>
            <p className="s-body">
              Every module shares the same core: identity, consent, FHIR R4 interoperability, knowledge and observability.
              A new disease module inherits the safety, audit and consent boundary instead of rebuilding it.
            </p>
          </div>
          <ol className="s-layers" aria-label="Platform layers, top to bottom">
            {PLATFORM_LAYERS.map((l) => (
              <li key={l.name} className="s-layer"><b>{l.name}</b><span>{l.detail}</span></li>
            ))}
            <li className="s-layer s-layer--ehr"><b>Your EHR</b><span>System of record. Aksh writes nothing without a separately governed go-live.</span></li>
          </ol>
        </div>
      </section>

      <section className="s-section" id="agents" style={{ scrollMarginTop: 80 }}>
        <div className="s-container">
          <div className="s-head">
            <span className="s-eyebrow">Platform agents</span>
            <h2 className="s-h2">Twelve agents. None of them decides.</h2>
            <p className="s-lede">Each agent has a defined boundary and writes drafts, never decisions. The supervisor runs them in a fixed, inspectable order.</p>
            <div className="s-legend"><StatusPill s="production" /><StatusPill s="synthetic" /><StatusPill s="partial" /><StatusPill s="planned" /></div>
          </div>
          <div className="s-grid s-grid--3" data-agents>
            {PLATFORM_AGENTS.map((a) => (
              <div key={a.codename} className="s-card" style={{ padding: 22 }}>
                <div className="s-row"><h3 className="s-h3" style={{ fontSize: 17 }}>{a.label}</h3><StatusPill s={a.status} /></div>
                <span className="s-small" style={{ fontFamily: "var(--font-aksh-mono)", fontSize: 12, letterSpacing: "0.04em" }}>{a.codename}</span>
                <p className="s-small">{a.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="s-section s-section--soft" id="loop" style={{ scrollMarginTop: 80 }}>
        <div className="s-container">
          <div className="s-head">
            <span className="s-eyebrow">End-to-end loop</span>
            <h2 className="s-h2">From signal to governed learning.</h2>
          </div>
          <ol className="s-loop">
            {PRODUCT_LOOP.map((s) => (
              <li key={s.step} className={s.step === "Clinician decides" ? "s-loop--decide" : undefined}>
                <h3 className="s-h3" style={{ fontSize: 17 }}>{s.step}</h3>
                <p className="s-small">{s.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="s-section" id="diabetes" style={{ scrollMarginTop: 80 }}>
        <div className="s-container">
          <div className="s-head">
            <span className="s-eyebrow">First module · Aksh Diabetes</span>
            <h2 className="s-h2">Nine intelligence areas, one review queue.</h2>
            <p className="s-lede">Rules-based and explainable. Insulin and GLP-1 outputs are explanatory only, never an executable dose.</p>
          </div>
          <div className="s-areas">
            {DIABETES_AREAS.map((a) => (
              <div key={a.name} className="s-area">
                <div className="s-row"><h3 className="s-h3" style={{ fontSize: 18 }}>{a.name}</h3><StatusPill s={a.status} /></div>
                <p className="s-small">{a.output}</p>
                <p className="s-area__gate">{a.gate}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="s-section s-dark" id="gates" style={{ scrollMarginTop: 80 }}>
        <div className="s-container s-feature" style={{ alignItems: "start" }}>
          <div className="s-feature__copy">
            <span className="s-eyebrow">Human gates</span>
            <h2 className="s-h2">The decisions that always need a named person.</h2>
            <p className="s-body">Gates are enforced on the server. A role that may not confirm a gate cannot, whatever the interface shows.</p>
          </div>
          <ol className="s-gates">
            {HUMAN_GATES.map((g, i) => (
              <li key={g.gate} className="s-gate"><b>{i + 1}</b><span><strong>{g.gate}</strong>{g.who}</span></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="s-section">
        <div className="s-container">
          <div className="s-cta">
            <div>
              <h2 className="s-h2">Start with one governed workflow.</h2>
              <p>The platform reaches production a workflow at a time. See what clinics run today, or talk to us about yours.</p>
            </div>
            <div className="s-actions">
              <Link href="/get-started" className="s-btn s-btn--light">Request access</Link>
              <Link href="/product" className="s-btn s-btn--outline-light">Available now</Link>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
