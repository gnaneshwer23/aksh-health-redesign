/**
 * D1-c: Controlled demo script — Capture → Draft → Approve → SHIELD → sim → export.
 * Honest banners: synthetic · HITL · liveEmis:false · no live NHS write-back claims.
 */

import Link from "next/link";

import { MarketingShell } from "@/components/marketing/MarketingShell";

const honestyFlags = [
  "synthetic: true",
  "HITL required",
  "liveEmis: false",
  "sim write-back only",
  "Medplum not required",
  "not certified"
];

const demoStops = [
  {
    time: "00:00",
    title: "Frame honesty first",
    route: "/demo/script",
    action: "State the demo boundary before any click: synthetic patients, clinician Accept mandatory, write-back simulated.",
    talkTrack:
      "Aksh is a clinician-governed assistive layer. Agents draft; clinicians Accept/Edit/Reject; SHIELD audits. We do not claim live EMIS, IM1, or Medplum write-back today."
  },
  {
    time: "01:00",
    title: "Capture / ingest",
    route: "/demo/precision-health-loop?demo=1",
    action: "Open the whole-loop demo and run Capture → ingest → timeline on synthetic modalities (or skip to pilot queue).",
    talkTrack:
      "Show consent + multimodal ingest as labelled synthetic. physiologicalTwin:false. This is the Capture beat of the spine."
  },
  {
    time: "03:00",
    title: "Draft agents",
    route: "/review?demo=1",
    action: "Open the clinical review queue. Pick a seeded pilot case and show the structured AI draft.",
    talkTrack:
      "Drafts only — CONDUCTOR/NEXUS orchestrate. No autonomous write. Point at blockers/warnings before Accept."
  },
  {
    time: "05:30",
    title: "HITL Approve",
    route: "/review/pilot?demo=1",
    action: "Accept (or Edit then Accept) one case. Confirm checklist. Reject path must never stage.",
    talkTrack:
      "Accept freezes the artifact, writes SHIELD, and stages FHIR via BRIDGE (Neon/file) — preliminary · liveEmis:false."
  },
  {
    time: "08:00",
    title: "SHIELD audit",
    route: "/dashboard/admin/audit",
    action: "Open SHIELD audit and show the Accept / BRIDGE staging event on the hash chain.",
    talkTrack:
      "Every Accept/Reject is auditable. Emphasise hash-chained evidence — governance without inventing certifications."
  },
  {
    time: "10:00",
    title: "Sim write-back",
    route: "/dashboard/admin/precision-health",
    action: "Show System Spine / Partner readiness: emis-staging queue + ehr-writeback-sim · liveEmis:false.",
    talkTrack:
      "HITL Accept → BRIDGE staging → emis-staging → ehr-writeback-sim. Partner sandbox stays off. Never say connected to the GP record."
  },
  {
    time: "12:00",
    title: "Export handoff",
    route: "/cases/case-005/evidence?demo=1",
    action: "Download FHIR Bundle and/or Print/Save PDF summary as the handoff story.",
    talkTrack:
      "Export is manual filing / demo handoff — not API write-back. application/fhir+json · liveEmis:false."
  },
  {
    time: "14:00",
    title: "Close on readiness",
    route: "/review/demo-readiness?demo=1",
    action: "Land on demo-readiness checklist. Confirm honesty gates; do not set certified:true.",
    talkTrack:
      "Demo launch ready means synthetic HITL loop on production hosting — not partner-approved live write."
  }
];

const doNotClaim = [
  "Live EMIS / SystmOne / IM1 write-back or “connected to the GP record”",
  "Partner Programme approved / sandbox live / certified",
  "Medplum as production FHIR store",
  "PRISM / ATLAS / JSL as live Phase-1 peer agents",
  "Autonomous clinical decisions without Accept"
];

const okToClaim = [
  "Assistive drafts under CONDUCTOR + NEXUS",
  "Clinician HITL Accept/Edit/Reject",
  "SHIELD hash-chained audit",
  "BRIDGE FHIR-in-Neon/file preliminary staging",
  "Simulated write-back (ehr-writeback-sim)",
  "FHIR Bundle / PDF handoff export"
];

export function DemoLaunchScript() {
  return (
    <MarketingShell>
      <main className="product-page product-page--demo" data-testid="demo-launch-script">
        <div className="product-sky" aria-hidden="true" />

        <section className="product-simple-hero">
          <p className="product-kicker">D1 demo script · 10–15 minutes</p>
          <h1>Capture → Draft → Approve → SHIELD → sim → export</h1>
          <p>
            Guided walkthrough for akshhealth.com demos without IM1, EMIS Partner credentials, or Medplum
            OAuth. Stay inside the synthetic HITL boundary.
          </p>
          <div className="pill-row" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem" }}>
            {honestyFlags.map((flag) => (
              <span key={flag} className="pill" style={{ fontSize: "0.7rem" }}>
                {flag}
              </span>
            ))}
          </div>
        </section>

        <section className="product-section product-rule-grid">
          <article className="product-rule-card">
            <p className="product-kicker">OK to claim</p>
            <ul className="product-bullet-list">
              {okToClaim.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="product-rule-card product-rule-card--accent">
            <p className="product-kicker">Do not claim</p>
            <ul className="product-bullet-list">
              {doNotClaim.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="demo-script-layout">
          <div className="demo-script-main">
            {demoStops.map((stop) => (
              <article className="demo-stop" key={stop.title} data-testid={`demo-stop-${stop.time}`}>
                <div className="demo-stop__time">{stop.time}</div>
                <div className="demo-stop__body">
                  <div className="demo-stop__head">
                    <div>
                      <p className="product-card-label">{stop.title}</p>
                      <h2>{stop.action}</h2>
                    </div>
                    <Link className="product-button product-button--secondary" href={stop.route}>
                      Open
                    </Link>
                  </div>
                  <p>{stop.talkTrack}</p>
                </div>
              </article>
            ))}
          </div>

          <aside className="demo-script-aside">
            <section className="demo-script-panel">
              <p className="product-kicker">Quick links</p>
              <div className="actions" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <Link className="product-button product-button--secondary" href="/demo/precision-health-loop">
                  Whole-loop demo
                </Link>
                <Link className="product-button product-button--secondary" href="/review/pilot?demo=1">
                  Pilot cases
                </Link>
                <Link className="product-button product-button--secondary" href="/review/rehearsal?demo=1">
                  Audience rehearsal
                </Link>
                <Link className="product-button product-button--secondary" href="/review/demo-readiness?demo=1">
                  Demo readiness
                </Link>
                <Link className="product-button product-button--secondary" href="/signup">
                  Create demo account
                </Link>
              </div>
            </section>

            <section className="demo-script-panel">
              <p className="product-kicker">Credentials</p>
              <p>
                Built-in shared demo passwords were removed. Create an account via{" "}
                <Link href="/signup">/signup</Link>, then set{" "}
                <code>SMOKE_EMAIL</code> / <code>SMOKE_PASSWORD</code> for smoke scripts. See{" "}
                <code>docs/DEMO_LAUNCH_CREDENTIALS.md</code>.
              </p>
            </section>

            <section className="demo-script-panel">
              <p className="product-kicker">Related</p>
              <p>
                <Link href="/product/demo">Legacy product demo stops</Link> ·{" "}
                <Link href="/review/presenter">Presenter guide</Link>
              </p>
            </section>
          </aside>
        </section>
      </main>
    </MarketingShell>
  );
}
