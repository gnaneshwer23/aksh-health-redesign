import type { Metadata } from "next";
import Link from "next/link";
import { Activity, CalendarClock, Check, Layers, LineChart, ShieldAlert, Smartphone } from "lucide-react";

import { ReviewQueueMock, SlotFillMock } from "@/components/site/Mockups";
import { Pillars } from "@/components/site/Pillars";
import { SiteShell } from "@/components/site/SiteShell";
import { DIABETES_AREAS, HUMAN_GATES, NON_OBJECTIVES, PRODUCT_LOOP, STATUS_LABEL } from "@/components/site/vision";

export const metadata: Metadata = {
  title: "Aksh Health | Clinical intelligence, under clinical control",
  description:
    "Aksh connects patient access and clinical workflows through auditable AI orchestration, starting with bounded administrative automation and clinician-reviewed clinical intelligence. First module: Aksh Diabetes.",
};

function Status({ s }: { s: keyof typeof STATUS_LABEL }) {
  return <span className={`s-status s-status--${s}`}>{STATUS_LABEL[s]}</span>;
}

export default function HomePage() {
  return (
    <SiteShell>
      <section className="s-hero-panel">
        <div className="s-container s-hero-panel__card">
          <div className="s-hero-panel__grid">
            <div className="s-hero__copy s-reveal">
              <span className="s-pill-frost"><i>Platform</i>Aksh Intelligence Platform · first module: Aksh Diabetes</span>
              <h1 className="s-h1">Clinical intelligence, <span className="s-grad">under clinical control.</span></h1>
              <p className="s-lede">
                Aksh connects patient access and clinical workflows through auditable AI orchestration, starting with bounded
                administrative automation and clinician-reviewed clinical intelligence. A named clinician decides; the
                platform never decides alone.
              </p>
              <div className="s-actions">
                <Link href="/get-started" className="s-btn s-btn--primary">Request access</Link>
                <Link href="/platform" className="s-btn s-btn--ghost">Explore the platform</Link>
              </div>
              <p className="s-hero-panel__note" aria-label="In production today">
                <span>Cancelled-slot fill</span><span>CGM monitoring</span><span>Patient app</span>
              </p>
            </div>
            <div className="s-glow-wrap s-reveal" style={{ animationDelay: "120ms" }}>
              <ReviewQueueMock />
            </div>
          </div>
          <div className="s-metrics" style={{ marginTop: 64 }}>
            <div><b>12 agents</b><span>under one supervisor, in a fixed, inspectable order</span></div>
            <div><b>1 audit trail</b><span>who drafted, who decided, what changed</span></div>
            <div><b>0 autonomous decisions</b><span>nothing reaches a record without a named clinician</span></div>
          </div>
        </div>
      </section>

      <div className="s-container">
        <div className="s-facts">
          <div className="s-fact"><b>Human review</b><span>A named clinician decides every clinical step</span></div>
          <div className="s-fact"><b>Auditability</b><span>Every draft and decision attributed</span></div>
          <div className="s-fact"><b>One consent model</b><span>Shared by every module and role</span></div>
          <div className="s-fact"><b>Diabetes first</b><span>A focused clinical wedge, built to extend</span></div>
        </div>
      </div>

      <section className="s-section">
        <div className="s-container">
          <div className="s-head">
            <span className="s-eyebrow">The problem</span>
            <h2 className="s-h2">Clinical AI fails in two predictable ways.</h2>
            <p className="s-lede">Aksh is built as one auditable intelligence layer beside the EHR, so every capability shares the same safety, audit and consent boundary.</p>
          </div>
          <div className="s-grid s-grid--3">
            <div className="s-card">
              <span className="s-icon"><Layers /></span>
              <h3 className="s-h3">Point tools that don’t compose</h3>
              <p className="s-small">Separate risk, coding and coaching apps, each with its own trust and safety boundary. The clinician becomes the integration layer.</p>
            </div>
            <div className="s-card">
              <span className="s-icon"><ShieldAlert /></span>
              <h3 className="s-h3">Automation that oversteps</h3>
              <p className="s-small">Auto-writes to the record, auto-dosing, diagnostic claims, with nobody accountable in the loop.</p>
            </div>
            <div className="s-card s-card--accent">
              <h3 className="s-h3">Aksh’s answer</h3>
              <ul className="s-check">
                {[
                  ["One orchestrator", "a supervisor runs every agent in a fixed, inspectable order"],
                  ["One audit trail", "who drafted, who decided, what changed"],
                  ["One consent model", "shared by every module and role"],
                  ["One rule", "nothing reaches a record or prescription without a human decision"],
                ].map(([k, v]) => (
                  <li key={k}><Check aria-hidden /><span><strong>{k}:</strong> {v}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="s-section s-section--soft" id="platform">
        <div className="s-container">
          <div className="s-head">
            <span className="s-eyebrow">The Aksh Intelligence Platform</span>
            <h2 className="s-h2">Two pillars on one safe foundation.</h2>
            <p className="s-lede">
              Patient access and clinical intelligence share identity, consent, audit and integration, so every capability
              inherits the same safety boundary. Each item shows where it is today.
            </p>
          </div>
          <Pillars />
          <div style={{ marginTop: 24 }}><Link href="/platform" className="s-link">See the full platform →</Link></div>
        </div>
      </section>

      <section className="s-section">
        <div className="s-container">
          <div className="s-head">
            <span className="s-eyebrow">End-to-end loop</span>
            <h2 className="s-h2">From signal to governed learning.</h2>
            <p className="s-lede">Every step has a defined boundary. The clinician decision sits in the middle, and nothing after it bypasses governance.</p>
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

      <section className="s-section s-section--soft">
        <div className="s-container">
          <div className="s-head">
            <span className="s-eyebrow">First module · Aksh Diabetes</span>
            <h2 className="s-h2">Nine intelligence areas, one review queue.</h2>
            <p className="s-lede">Each area is a signal, not a separate tool. Together they feed risk and medication-safety checks on the same orchestrator and audit trail.</p>
            <div className="s-legend"><Status s="production" /><Status s="synthetic" /></div>
          </div>
          <div className="s-areas">
            {DIABETES_AREAS.map((a) => (
              <div key={a.name} className="s-area">
                <div className="s-row"><h3 className="s-h3" style={{ fontSize: 18 }}>{a.name}</h3><Status s={a.status} /></div>
                <p className="s-small">{a.output}</p>
                <p className="s-area__gate">{a.gate}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="s-section" id="available-now">
        <div className="s-container">
          <div className="s-head">
            <span className="s-eyebrow">Available now</span>
            <h2 className="s-h2">The first workflows, live with clinics.</h2>
            <p className="s-lede">The platform reaches production one governed workflow at a time. These run today with real organisations, in shadow mode first.</p>
          </div>
          <div className="s-feature">
            <div className="s-feature__copy">
              <div className="s-grid s-grid--2" style={{ gap: 14 }}>
                {[
                  { icon: CalendarClock, t: "Cancelled-slot fill", b: "Freed appointments offered to the patients who need them most, with the reasons. Staff decide every contact." },
                  { icon: Activity, t: "CGM monitoring", b: "Time in range and consensus targets as a worklist, low glucose first." },
                  { icon: Smartphone, t: "Patient app", b: "Readings and CGM uploads shared with the care team, on the patient’s terms." },
                  { icon: LineChart, t: "Measured results", b: "Weekly review against a baseline locked before go-live." },
                ].map(({ icon: Icon, t, b }) => (
                  <div key={t} className="s-card" style={{ padding: 20 }}>
                    <span className="s-icon"><Icon /></span>
                    <h3 className="s-h3" style={{ fontSize: 17 }}>{t}</h3>
                    <p className="s-small">{b}</p>
                  </div>
                ))}
              </div>
              <Link href="/product" className="s-link">What’s available now →</Link>
            </div>
            <div style={{ display: "grid", gap: 16 }}>
              <div className="s-glow-wrap"><SlotFillMock /></div>
            </div>
          </div>
        </div>
      </section>

      <section className="s-section s-dark">
        <div className="s-container s-feature" style={{ alignItems: "start" }}>
          <div className="s-feature__copy">
            <span className="s-eyebrow">Clinician control</span>
            <h2 className="s-h2">Every output is a draft until a named clinician decides.</h2>
            <ul className="s-check">
              <li><Check aria-hidden />Accept, edit or reject before anything can affect the record.</li>
              <li><Check aria-hidden />Every decision is attributed to a named reviewer and audited.</li>
              <li><Check aria-hidden />Missing data, like an overdue eye-screening date, is listed rather than guessed.</li>
              <li><Check aria-hidden />No autonomous diagnosis, prescribing or treatment.</li>
            </ul>
            <Link href="/security" className="s-btn s-btn--ghost" style={{ justifySelf: "start" }}>Security and clinical safety</Link>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            <p className="s-small">Mandatory human gates</p>
            <ol className="s-gates">
              {HUMAN_GATES.map((g, i) => (
                <li key={g.gate} className="s-gate"><b>{i + 1}</b><span><strong>{g.gate}</strong>{g.who}</span></li>
              ))}
            </ol>
            <p className="s-small">Enforced on the server, not just hidden in the interface.</p>
          </div>
        </div>
      </section>

      <section className="s-section">
        <div className="s-container s-feature" style={{ alignItems: "start" }}>
          <div className="s-feature__copy">
            <span className="s-eyebrow">Built with ambition, communicated with precision</span>
            <h2 className="s-h2">What Aksh will not do.</h2>
            <p className="s-body">
              We say what is in production, what is validated only on synthetic data, and what is planned. Hard limits are
              part of the design, not a disclaimer.
            </p>
            <div className="s-legend"><Status s="production" /><Status s="synthetic" /><Status s="planned" /></div>
          </div>
          <ul className="s-limits">
            {NON_OBJECTIVES.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </div>
      </section>

      <section className="s-section s-section--soft">
        <div className="s-container">
          <div className="s-head">
            <span className="s-eyebrow">Start with a controlled use case</span>
            <h2 className="s-h2">From first conversation to live clinic, one step at a time.</h2>
          </div>
          <ol className="s-steps">
            <li className="s-step"><span className="s-step__n">01</span><h3 className="s-h3">Scope one workflow</h3><p className="s-small">Pick the diabetes workflow to start with, name the reviewers and set the governance boundaries.</p></li>
            <li className="s-step"><span className="s-step__n">02</span><h3 className="s-h3">Set up your clinic</h3><p className="s-small">Invite your team, check registrations, load patients and the waiting list.</p></li>
            <li className="s-step"><span className="s-step__n">03</span><h3 className="s-h3">Complete go-live</h3><p className="s-small">Data processing agreement, privacy assessment, clinical safety lead and a locked baseline.</p></li>
            <li className="s-step"><span className="s-step__n">04</span><h3 className="s-h3">Widen on evidence</h3><p className="s-small">Start in shadow mode; add workflows only when the evidence supports it.</p></li>
          </ol>
        </div>
      </section>

      <section className="s-section">
        <div className="s-container">
          <div className="s-cta">
            <div>
              <h2 className="s-h2">Clinical intelligence should help clinicians think, not replace them.</h2>
              <p>Tell us about your organisation. We go live one governed workflow at a time.</p>
            </div>
            <div className="s-actions">
              <Link href="/get-started" className="s-btn s-btn--primary">Request access</Link>
              <Link href="/platform" className="s-btn s-btn--ghost">Explore the platform</Link>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
