/**
 * D1-c: Controlled demo script — Capture → Draft → Approve → SHIELD → sim → export.
 * Honest banners: synthetic · HITL · liveEmis:false · no live health system write-back claims.
 * U4: GP hero path (<10 min) wired to dashboard review queue → Accept → Bundle export.
 * U5: Nurse 3-beat + pharmacist med-safety paths on role dashboards.
 * U6: Practice admin ops path — integrations honesty → SHIELD → users/enquiries.
 * U7: ICS population (COMPASS) + hospital command-centre (synthetic PAS) paths.
 * U8: Patient companion (My Health → plan → consent) + researcher ethics / evaluation (ATLAS Phase 2).
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

const gpHeroPath = {
  title: "GP hero path (<10 min)",
  talkTrack:
    "From the Clinician Dashboard: open Review Queue → Accept a draft (HITL + SHIELD) → Export FHIR Bundle via BRIDGE. Agent Control names match marketing — CANVAS / BRIDGE / CONDUCTOR / HORIZON; VOICE and Dr.Assist stay sub-caps. liveEmis:false throughout.",
  beats: [
    { label: "GP dashboard", href: "/dashboard/gp", note: "Hero strip + Agent Control" },
    { label: "Review queue", href: "/dashboard/gp/review-queue", note: "Pending drafts" },
    { label: "Accept (HITL)", href: "/review/pilot?demo=1", note: "BRIDGE staging" },
    { label: "Export Bundle", href: "/cases/case-005/evidence?demo=1", note: "FHIR handoff" }
  ]
};

const nurseHeroPath = {
  title: "Nurse 3-beat path",
  talkTrack:
    "Sign in as nurse. Follow Observations (vitals + shared timeline via nurse-vitals spine) → Shift handover draft → GUARDIAN alerts. CANVAS / SYNTHESIS / GUARDIAN draft; nurse confirms; SHIELD audits. Synthetic panel · liveEmis:false — no EHR write.",
  beats: [
    { label: "Nurse dashboard", href: "/dashboard/nurse", note: "Hero strip" },
    { label: "Vitals + timeline", href: "/dashboard/nurse/observations", note: "Beat 1" },
    { label: "Handover", href: "/dashboard/nurse/handover", note: "Beat 2" },
    { label: "GUARDIAN alerts", href: "/dashboard/nurse/alerts", note: "Beat 3" }
  ]
};

const pharmacistHeroPath = {
  title: "Pharmacist med-safety path",
  talkTrack:
    "Sign in as pharmacist. Med review queue (Mark Reviewed → pharmacist-review spine + SHIELD) → GUARDIAN interaction check → Accept / Edit / Reject (HITL stage). GUARDIAN-focused; SHIELD on decisions; liveEmis:false.",
  beats: [
    { label: "Pharmacist dashboard", href: "/dashboard/pharmacist", note: "Hero strip" },
    { label: "Med review", href: "/dashboard/pharmacist/reviews", note: "Beat 1" },
    { label: "GUARDIAN check", href: "/dashboard/pharmacist/interactions", note: "Beat 2" },
    {
      label: "HITL stage",
      href: "/dashboard/pharmacist/interactions#pharmacist-hitl-stage",
      note: "Accept · SHIELD"
    }
  ]
};

const adminHeroPath = {
  title: "Practice admin ops path",
  talkTrack:
    "Sign in as practice manager. Integrations honesty (BRIDGE staging · designed for the EHR · liveEmis:false) → SHIELD audit → users / organisation enquiries. CONDUCTOR = queue health. Precision Health / partner readiness are scaffolding — never claim live write-back.",
  beats: [
    { label: "Admin dashboard", href: "/dashboard/admin", note: "Ops hero strip" },
    { label: "Integrations", href: "/dashboard/admin/integrations", note: "Beat 1 · honesty" },
    { label: "SHIELD audit", href: "/dashboard/admin/audit", note: "Beat 2" },
    {
      label: "Users / enquiries",
      href: "/dashboard/admin/organisation-enquiries",
      note: "Beat 3"
    }
  ]
};

const icsHeroPath = {
  title: "Regional population path (COMPASS)",
  talkTrack:
    "Open the regional dashboard (public demo or ics-lead sign-in). Population → COMPASS equity → forecast. Aggregate synthetic cohorts only — no patient-level spill. HORIZON / PATHWAY frame foresight scaffolding — not a live regional feed or physiological twin. liveEmis:false.",
  beats: [
    { label: "Population dashboard", href: "/dashboard/ics", note: "Population hero strip" },
    { label: "Population", href: "/dashboard/ics/population", note: "Beat 1" },
    { label: "Equity (COMPASS)", href: "/dashboard/ics/equity", note: "Beat 2" },
    { label: "Forecast", href: "/dashboard/ics/forecast", note: "Beat 3 · HORIZON" }
  ]
};

const hospitalHeroPath = {
  title: "Hospital command-centre path",
  talkTrack:
    "Open Hospital Command Centre (public synthetic hospital system). Wards → capacity → staffing. PATHWAY frames flow; HORIZON drafts demand foresight; HITL on recommendations. Say “not live hospital system” from the page — liveEmis:false · no EPR write-back.",
  beats: [
    { label: "Hospital dashboard", href: "/dashboard/hospital", note: "Command-centre strip" },
    { label: "Wards", href: "/dashboard/hospital/wards", note: "Beat 1" },
    { label: "Capacity", href: "/dashboard/hospital/capacity", note: "Beat 2 · HORIZON" },
    { label: "Staffing", href: "/dashboard/hospital/staffing", note: "Beat 3 · PATHWAY" }
  ]
};

const patientHeroPath = {
  title: "Patient companion path",
  talkTrack:
    "Sign in as patient (practice-invited companion). My Health → care plan DRAFT → consent purpose grants. Clinicians keep HITL on record changes — patient check-ins only. Synthetic demo content · liveEmis:false · no patient-app EHR write.",
  beats: [
    { label: "My Health", href: "/dashboard/patient", note: "Companion hero strip" },
    { label: "Care plan", href: "/dashboard/patient#companion-care-plan", note: "Beat 2 · DRAFT" },
    { label: "Consent", href: "/dashboard/patient#companion-consent", note: "Beat 3 · SHIELD" }
  ]
};

const researcherHeroPath = {
  title: "Researcher ethics / evaluation path",
  talkTrack:
    "Sign in as researcher. Ethics empty-state → outcome evaluation → data access. COMPASS / SHIELD support governed aggregates and audited exports. ATLAS stays Phase 2 (not live) — never claim a live research agent. Synthetic cohorts · liveEmis:false.",
  beats: [
    { label: "Ethics overview", href: "/dashboard/researcher", note: "Beat 1 · empty-state" },
    { label: "Evaluation", href: "/dashboard/researcher/evaluation", note: "Beat 2 · SHIELD" },
    { label: "Data access", href: "/dashboard/researcher/data-access", note: "Beat 3 · COMPASS" }
  ]
};

const demoStops = [
  {
    time: "00:00",
    title: "Frame honesty first",
    route: "/demo/script",
    action: "State the demo boundary before any click: synthetic patients, clinician Accept mandatory, write-back simulated.",
    talkTrack:
      "Aksh is a clinician-governed assistive layer. Agents draft; clinicians Accept/Edit/Reject; SHIELD audits. We do not claim live EHR, IM1, or Medplum write-back today."
  },
  {
    time: "00:30",
    title: "GP hero path (optional shortcut)",
    route: "/dashboard/gp",
    action: "Open Clinician Dashboard → follow the hero strip: Review Queue → Accept → Export / sim.",
    talkTrack:
      "Hero demo stays under 10 minutes. Point at CANVAS / BRIDGE / CONDUCTOR / HORIZON on Agent Control. VOICE and Dr.Assist are sub-capabilities — not peer agents. DemoDataBanner / Neo4j honesty stay visible; liveEmis:false."
  },
  {
    time: "00:45",
    title: "Nurse 3-beat (supporting clinical)",
    route: "/dashboard/nurse",
    action: "After nurse sign-in: Observations → Handover → GUARDIAN alerts via the hero strip.",
    talkTrack:
      "Show vitals landing on the shared timeline (nurse-vitals spine when signed in), handover as SYNTHESIS draft, then GUARDIAN alerts for follow-up. Synthetic · HITL · liveEmis:false."
  },
  {
    time: "00:55",
    title: "Pharmacist med-safety (supporting clinical)",
    route: "/dashboard/pharmacist",
    action: "After pharmacist sign-in: Med review → GUARDIAN interactions → Accept (HITL + SHIELD).",
    talkTrack:
      "GUARDIAN drafts interactions; pharmacist Accept/Edit/Reject. Mark Reviewed and Accept audit via SHIELD / pharmacist-review spine — not EHR write-back. liveEmis:false."
  },
  {
    time: "01:05",
    title: "Practice admin ops (practice manager)",
    route: "/dashboard/admin",
    action: "After admin sign-in: Integrations honesty → SHIELD audit → users/enquiries via the ops hero strip.",
    talkTrack:
      "Say “not live EHR” from the page itself (liveEmis:false badges). CONDUCTOR/BRIDGE are ops framing; Precision Health stays scaffolding. Partner readiness never equals write-back."
  },
  {
    time: "01:15",
    title: "Regional population (COMPASS)",
    route: "/dashboard/ics",
    action: "Follow population → COMPASS equity → forecast on the regional hero strip (public demo or ics-lead).",
    talkTrack:
      "COMPASS-led equity story on synthetic cohorts. Aggregate only — no patient-level spill. Forecast is HORIZON / PATHWAY scaffolding, not a twin. liveEmis:false."
  },
  {
    time: "01:25",
    title: "Hospital command centre (synthetic hospital system)",
    route: "/dashboard/hospital",
    action: "Follow wards → capacity → staffing via the command-centre hero strip.",
    talkTrack:
      "Say “not live hospital system” from the page. PATHWAY / HORIZON draft operational foresight; HITL on capacity. Synthetic hospital system · liveEmis:false · no EPR write-back."
  },
  {
    time: "01:35",
    title: "Patient companion (invite-by-practice)",
    route: "/dashboard/patient",
    action: "After patient sign-in: My Health → care plan → consent via the companion hero strip.",
    talkTrack:
      "Practice-invited companion. Patient sees plan / consent in plain English; clinicians keep HITL. Synthetic · liveEmis:false — no patient-app EHR write."
  },
  {
    time: "01:45",
    title: "Researcher ethics / evaluation",
    route: "/dashboard/researcher",
    action: "After researcher sign-in: ethics → evaluation → data access via the research hero strip.",
    talkTrack:
      "COMPASS / SHIELD support governed aggregates. ATLAS stays Phase 2 — never claim live. Synthetic cohorts · liveEmis:false."
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
  "Live the EHR / IM1 write-back or “connected to the GP record”",
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
          <p className="product-kicker">
            D1 demo script · 10–15 minutes · GP hero &lt;10 min · nurse / pharmacist / admin / ICS /
            hospital supporting
          </p>
          <h1>Capture → Draft → Approve → SHIELD → sim → export</h1>
          <p>
            Guided walkthrough for akshhealth.com demos without IM1, EHR partner credentials, or Medplum
            OAuth. Stay inside the synthetic HITL boundary. Prefer the GP hero path when the audience is
            clinical; use nurse / pharmacist / practice-admin / ICS / hospital strips for supporting-role
            demos (ICS and hospital are public synthetic; other roles need sign-in).
          </p>
          <div className="pill-row" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem" }}>
            {honestyFlags.map((flag) => (
              <span key={flag} className="pill" style={{ fontSize: "0.7rem" }}>
                {flag}
              </span>
            ))}
          </div>
        </section>

        <section className="product-section" data-testid="gp-hero-script-panel">
          <p className="product-kicker">{gpHeroPath.title}</p>
          <p>{gpHeroPath.talkTrack}</p>
          <div className="actions" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
            {gpHeroPath.beats.map((beat) => (
              <Link key={beat.href} className="product-button product-button--secondary" href={beat.href}>
                {beat.label}
                <span style={{ opacity: 0.7, marginLeft: "0.35rem", fontSize: "0.75rem" }}>{beat.note}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="product-section" data-testid="nurse-hero-script-panel">
          <p className="product-kicker">{nurseHeroPath.title}</p>
          <p>{nurseHeroPath.talkTrack}</p>
          <div className="actions" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
            {nurseHeroPath.beats.map((beat) => (
              <Link key={beat.href} className="product-button product-button--secondary" href={beat.href}>
                {beat.label}
                <span style={{ opacity: 0.7, marginLeft: "0.35rem", fontSize: "0.75rem" }}>{beat.note}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="product-section" data-testid="pharmacist-hero-script-panel">
          <p className="product-kicker">{pharmacistHeroPath.title}</p>
          <p>{pharmacistHeroPath.talkTrack}</p>
          <div className="actions" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
            {pharmacistHeroPath.beats.map((beat) => (
              <Link
                key={`${beat.href}-${beat.label}`}
                className="product-button product-button--secondary"
                href={beat.href}
              >
                {beat.label}
                <span style={{ opacity: 0.7, marginLeft: "0.35rem", fontSize: "0.75rem" }}>{beat.note}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="product-section" data-testid="admin-hero-script-panel">
          <p className="product-kicker">{adminHeroPath.title}</p>
          <p>{adminHeroPath.talkTrack}</p>
          <div className="actions" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
            {adminHeroPath.beats.map((beat) => (
              <Link key={beat.href} className="product-button product-button--secondary" href={beat.href}>
                {beat.label}
                <span style={{ opacity: 0.7, marginLeft: "0.35rem", fontSize: "0.75rem" }}>{beat.note}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="product-section" data-testid="ics-hero-script-panel">
          <p className="product-kicker">{icsHeroPath.title}</p>
          <p>{icsHeroPath.talkTrack}</p>
          <div className="actions" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
            {icsHeroPath.beats.map((beat) => (
              <Link key={beat.href} className="product-button product-button--secondary" href={beat.href}>
                {beat.label}
                <span style={{ opacity: 0.7, marginLeft: "0.35rem", fontSize: "0.75rem" }}>{beat.note}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="product-section" data-testid="hospital-hero-script-panel">
          <p className="product-kicker">{hospitalHeroPath.title}</p>
          <p>{hospitalHeroPath.talkTrack}</p>
          <div className="actions" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
            {hospitalHeroPath.beats.map((beat) => (
              <Link key={beat.href} className="product-button product-button--secondary" href={beat.href}>
                {beat.label}
                <span style={{ opacity: 0.7, marginLeft: "0.35rem", fontSize: "0.75rem" }}>{beat.note}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="product-section" data-testid="patient-hero-script-panel">
          <p className="product-kicker">{patientHeroPath.title}</p>
          <p>{patientHeroPath.talkTrack}</p>
          <div className="actions" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
            {patientHeroPath.beats.map((beat) => (
              <Link key={beat.href} className="product-button product-button--secondary" href={beat.href}>
                {beat.label}
                <span style={{ opacity: 0.7, marginLeft: "0.35rem", fontSize: "0.75rem" }}>{beat.note}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="product-section" data-testid="researcher-hero-script-panel">
          <p className="product-kicker">{researcherHeroPath.title}</p>
          <p>{researcherHeroPath.talkTrack}</p>
          <div className="actions" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
            {researcherHeroPath.beats.map((beat) => (
              <Link key={beat.href} className="product-button product-button--secondary" href={beat.href}>
                {beat.label}
                <span style={{ opacity: 0.7, marginLeft: "0.35rem", fontSize: "0.75rem" }}>{beat.note}</span>
              </Link>
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
                <Link className="product-button product-button--secondary" href="/dashboard/gp">
                  GP dashboard (hero)
                </Link>
                <Link className="product-button product-button--secondary" href="/dashboard/gp/review-queue">
                  GP review queue
                </Link>
                <Link className="product-button product-button--secondary" href="/dashboard/nurse">
                  Nurse dashboard (3-beat)
                </Link>
                <Link className="product-button product-button--secondary" href="/dashboard/pharmacist">
                  Pharmacist dashboard (med-safety)
                </Link>
                <Link className="product-button product-button--secondary" href="/dashboard/admin">
                  Practice admin (ops)
                </Link>
                <Link className="product-button product-button--secondary" href="/dashboard/ics">
                  ICS (COMPASS population)
                </Link>
                <Link className="product-button product-button--secondary" href="/dashboard/hospital">
                  Hospital (synthetic PAS)
                </Link>
                <Link className="product-button product-button--secondary" href="/dashboard/patient">
                  Patient companion
                </Link>
                <Link className="product-button product-button--secondary" href="/dashboard/researcher">
                  Researcher (ethics / evaluation)
                </Link>
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
