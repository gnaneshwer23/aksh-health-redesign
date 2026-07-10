import Link from "next/link";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { COMPLIANCE_BADGES, COMPLIANCE_DISCLAIMER } from "@/lib/compliance-labels";

const EXTRACTION_JOBS = [
  { id: "job-001", connector: "EHR connector A", status: "scheduled", lastRun: "Synthetic nightly — 02:00 UTC" },
  { id: "job-002", connector: "EHR connector B", status: "planned", lastRun: "Not configured" },
  { id: "job-003", connector: "FHIR staging sync", status: "disabled", lastRun: "Flag-gated rehearsal only" }
];

const AUDIT_SUMMARY = [
  { label: "Queue item decisions (24h)", value: "12 SHIELD events" },
  { label: "Case-level accepts", value: "3 frozen artifacts" },
  { label: "FHIR AuditEvents exported", value: "3 bundles" },
  { label: "Open compliance flags", value: "0 blocking (synthetic)" }
];

export default function AdminDashboardPage() {
  return (
    <DashboardLayout
      description="Integration health, extraction jobs, SHIELD audit summary, and compliance flags."
      role="admin"
      title="Practice Admin Dashboard"
    >
      <div className="dashboard-grid">
        <section className="panel stack">
          <p className="gp-panel__eyebrow">Extraction jobs</p>
          <h2>EHR connector status</h2>
          <div className="list">
            {EXTRACTION_JOBS.map((job) => (
              <article className="gp-queue-item" key={job.id}>
                <strong>{job.connector}</strong>
                <p>{job.lastRun}</p>
                <span className="pill">{job.status}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="panel stack">
          <p className="gp-panel__eyebrow">SHIELD audit summary</p>
          <h2>Compliance trail (synthetic)</h2>
          <ul className="list">
            {AUDIT_SUMMARY.map((row) => (
              <li key={row.label}>
                <strong>{row.label}</strong>
                <span>{row.value}</span>
              </li>
            ))}
          </ul>
          <div className="actions">
            <Link className="button primary" href="/review/governance-pack">
              Governance pack
            </Link>
            <Link className="button secondary" href="/review/ops">
              Ops / remediation
            </Link>
          </div>
        </section>

        <section className="panel stack dashboard-grid__full">
          <p className="gp-panel__eyebrow">Compliance flags</p>
          <h2>Design pathway status</h2>
          <p className="product-muted">{COMPLIANCE_DISCLAIMER}</p>
          <div className="compliance-badge-grid">
            {COMPLIANCE_BADGES.map((badge) => (
              <article className="compliance-badge-card" key={badge.id}>
                <strong>{badge.label}</strong>
                <p>Aligned design mapping — not certified</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
