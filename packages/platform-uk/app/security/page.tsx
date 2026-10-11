import type { Metadata } from "next";
import Link from "next/link";

import { SiteShell } from "@/components/site/SiteShell";

export const metadata: Metadata = {
  title: "Security",
  description:
    "How Aksh protects clinical data: isolation by organisation, two-step sign-in, append-only audit, encryption, backups, data export and a governed go-live.",
};

const SECTIONS: { id: string; title: string; intro: string; points: { t: string; b: string }[] }[] = [
  {
    id: "access",
    title: "Access control",
    intro: "Who can see what is decided in the database, not only in the interface.",
    points: [
      { t: "Row-level security", b: "Every query from the application runs as a restricted database role scoped to the signed-in user’s organisations. A clinic cannot read another clinic’s patients, even through a faulty screen." },
      { t: "Patients see only themselves", b: "A patient account is bound to one record, confirmed with an invite code and date of birth. Sharing with other organisations needs the patient’s recorded consent." },
      { t: "Roles", b: "Clinical worklists are limited to clinicians. Organisation settings, invites and go-live are limited to organisation admins. Aksh reviewers act only on go-live." },
      { t: "Registration checks", b: "A clinician’s professional registration is checked and recorded before their organisation can go live." },
    ],
  },
  {
    id: "authentication",
    title: "Authentication",
    intro: "Accounts are protected against guessing and stolen passwords.",
    points: [
      { t: "Two-step sign-in", b: "Time-based codes from an authenticator app, each usable once, with single-use recovery codes. Secrets are encrypted at rest. Required for Aksh reviewers." },
      { t: "Passwords", b: "Stored only as salted hashes. Never logged, never shown, never sent by email." },
      { t: "Rate limits", b: "Sign-in, sign-up and password reset are limited per address and per network, backed by the database so limits hold across servers." },
      { t: "Sessions", b: "Signed, HTTP-only cookies over TLS. Privileged pages refuse sessions that did not pass two-step sign-in." },
    ],
  },
  {
    id: "audit",
    title: "Audit and integrity",
    intro: "The record of what happened cannot be rewritten.",
    points: [
      { t: "Append-only history", b: "Slot actions, consent decisions, go-live evidence, registration checks, CGM uploads and weekly sign-offs are append-only: the database rejects edits and deletions." },
      { t: "Attribution", b: "Every action records who took it, in which organisation and environment, and when." },
      { t: "Honest measurement", b: "Results use one published definition and a baseline locked before go-live. A booking counts only after it is read back from your schedule." },
    ],
  },
  {
    id: "data",
    title: "Data protection",
    intro: "You stay in control of the data you bring.",
    points: [
      { t: "Encryption", b: "TLS for all traffic with HSTS. Data encrypted at rest by the database service. Two-step secrets additionally encrypted by Aksh." },
      { t: "AI under governance", b: "In production today, no patient data is sent to an AI model: ranking and metrics are deterministic rules you can read. AI capabilities are validated on synthetic data and reach real patients only through a governed go-live." },
      { t: "Export", b: "Organisation admins export everything their organisation holds as one machine-readable file; patients download their own record. Exports are audited." },
      { t: "Retention", b: "Operational error logs are kept for 90 days and are scrubbed of personal details; rate-limit counters for 24 hours." },
      { t: "Separate environments", b: "Production holds real organisations only. Testing runs on a separate database with synthetic data; tooling refuses to write test data to production." },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    intro: "Run like a clinical service.",
    points: [
      { t: "Backups and restore", b: "Point-in-time recovery on the production database, with restore drills run and recorded." },
      { t: "Monitoring", b: "Server errors are recorded and alert the operations team. Scheduled jobs expire stale offers and apply retention daily." },
      { t: "Secure defaults", b: "Strict transport security, no framing, no content sniffing, and a restrictive permissions policy on every response." },
      { t: "Dependencies", b: "Pinned versions, reviewed advisories, and automated tests on every change." },
    ],
  },
  {
    id: "clinical-safety",
    title: "Clinical safety",
    intro: "Aksh supports staff. It does not act on patients.",
    points: [
      { t: "People decide", b: "Aksh ranks and drafts. It never contacts patients, books appointments, diagnoses or recommends treatment." },
      { t: "Go-live governance", b: "Live use needs a data processing agreement, a privacy impact assessment with acceptable residual risk, a named clinical safety lead, an agreed contact channel and a locked baseline, each reviewed by Aksh." },
      { t: "Shadow mode", b: "Organisations start in shadow mode: staff make every contact through their own channels, and Aksh keeps the record." },
      { t: "Missing data is shown", b: "Patients who cannot be offered a slot are listed with the reason, and incomplete CGM data is labelled, never silently dropped." },
    ],
  },
];

export default function SecurityPage() {
  return (
    <SiteShell>
      <section className="s-page-head">
        <div className="s-container s-page-head__inner">
          <span className="s-eyebrow">Security</span>
          <h1 className="s-h1" style={{ fontSize: "clamp(36px, 4.6vw, 54px)" }}>Security your governance team can check.</h1>
          <p className="s-lede">
            How Aksh protects clinical data, who can see it, and what has to be true before an organisation goes live. We do
            not claim certifications we do not hold.
          </p>
        </div>
      </section>

      <section className="s-section s-section--tight">
        <div className="s-container s-doc">
          <nav className="s-doc__nav" aria-label="Sections">
            <span className="s-doc__nav-title">On this page</span>
            {SECTIONS.map((s) => <a key={s.id} href={`#${s.id}`}>{s.title}</a>)}
          </nav>
          <div style={{ display: "grid", gap: 72 }}>
            {SECTIONS.map((s) => (
              <section key={s.id} id={s.id} style={{ scrollMarginTop: 96, display: "grid", gap: 24 }}>
                <div style={{ display: "grid", gap: 8 }}>
                  <h2 className="s-h2" style={{ fontSize: "clamp(26px, 2.6vw, 32px)" }}>{s.title}</h2>
                  <p className="s-body">{s.intro}</p>
                </div>
                <div className="s-grid s-grid--2">
                  {s.points.map((p) => (
                    <div key={p.t} className="s-card" style={{ padding: 24 }}>
                      <h3 className="s-h3" style={{ fontSize: 17 }}>{p.t}</h3>
                      <p className="s-small">{p.b}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
            <div className="s-note">
              Reporting a vulnerability or need our security documentation for a procurement review? Email{" "}
              <a className="s-link" href="mailto:gnaneshwer.jadav@gmail.com">gnaneshwer.jadav@gmail.com</a>.
            </div>
          </div>
        </div>
      </section>

      <section className="s-section s-section--tight">
        <div className="s-container">
          <div className="s-cta">
            <div>
              <h2 className="s-h2">Questions from your data protection lead?</h2>
              <p>We will share our data processing agreement and help with your privacy impact assessment.</p>
            </div>
            <div className="s-actions">
              <Link href="/contact" className="s-btn s-btn--light">Contact us</Link>
              <Link href="/resources/going-live" className="s-btn s-btn--outline-light">Going-live guide</Link>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
