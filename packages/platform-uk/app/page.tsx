import type { Metadata } from "next";
import Link from "next/link";
import { Activity, CalendarClock, Check, Layers, LineChart, ShieldAlert, Smartphone } from "lucide-react";

import { ReviewQueueMock, SlotFillMock } from "@/components/site/Mockups";
import { Pillars } from "@/components/site/Pillars";
import { SiteShell } from "@/components/site/SiteShell";
import { DiabetesAreas } from "@/components/site/DiabetesAreas";
import { HUMAN_GATES, NON_OBJECTIVES, PRODUCT_LOOP } from "@/components/site/vision";

export const metadata: Metadata = {
  title: "Aksh Health | Clinical intelligence, under clinical control",
  description:
    "Aksh prepares worklists and drafts for patient access and clinical review from the systems a clinic already uses. A named clinician decides every step. First module: Aksh Diabetes.",
};

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
                Aksh prepares worklists and drafts from the systems your clinic already uses, for patient access and clinical
                review. A named clinician decides every step, and every decision is recorded. It never acts on its own.
              </p>
              <div className="s-actions">
                <Link href="/get-started" className="s-btn s-btn--primary">Request access</Link>
                <Link href="/platform" className="s-btn s-btn--ghost">How it works</Link>
              </div>
              <p className="s-hero-panel__note" aria-label="In production today">
                <span>Cancelled-slot fill</span><span>CGM monitoring</span><span>Patient app</span>
              </p>
            </div>
            <div className="s-glow-wrap s-reveal" style={{ animationDelay: "120ms" }}>
              <ReviewQueueMock />
            </div>
          </div>
          <div className="s-metrics" style={{ marginTop: 48 }}>
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
            <p className="s-lede">Aksh is one system beside the EHR, so every capability follows the same rules for safety, audit and consent.</p>
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
                  ["One supervisor", "runs every component in a fixed order that can be inspected"],
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
            <h2 className="s-h2">Two products on one foundation.</h2>
            <p className="s-lede">
              Patient access and clinical review share sign-in, consent, connections and audit, so both follow the same
              rules. Each item shows where it is today.
            </p>
          </div>
          <Pillars />
          <div style={{ marginTop: 24 }}><Link href="/platform" className="s-link">How it works →</Link></div>
        </div>
      </section>

      <section className="s-section">
        <div className="s-container">
          <div className="s-head">
            <span className="s-eyebrow">End to end</span>
            <h2 className="s-h2">From data in to a recorded decision.</h2>
            <p className="s-lede">The clinician decision sits in the middle. Nothing after it happens without that decision.</p>
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

      <section className="s-section s-section--soft" id="diabetes" style={{ scrollMarginTop: 80 }}>
        <div className="s-container">
          <div className="s-head">
            <span className="s-eyebrow">First module · Aksh Diabetes</span>
            <h2 className="s-h2">Diabetes care, one worklist at a time.</h2>
            <p className="s-lede">Glucose monitoring is available today. The rest of the module adds to the same worklist and review queue, with the same safeguards.</p>
          </div>
          <DiabetesAreas />
        </div>
      </section>

      <section className="s-section" id="available-now">
        <div className="s-container">
          <div className="s-head">
            <span className="s-eyebrow">Available now</span>
            <h2 className="s-h2">Ready for clinics today.</h2>
            <p className="s-lede">These workflows are in production and ready for a clinic to go live. Each one starts in shadow mode.</p>
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
            <span className="s-eyebrow">Limits</span>
            <h2 className="s-h2">What Aksh will not do.</h2>
            <p className="s-body">
              These limits are part of the design. We say clearly what is available today and what is still in development.
            </p>
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
              <p>Tell us about your organisation. Clinics go live one workflow at a time.</p>
            </div>
            <div className="s-actions">
              <Link href="/get-started" className="s-btn s-btn--primary">Request access</Link>
              <Link href="/platform" className="s-btn s-btn--ghost">How it works</Link>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
