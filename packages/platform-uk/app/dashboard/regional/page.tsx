import Link from "next/link";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

const AGGREGATE_METRICS = [
  { label: "Practices onboarded", value: "3 (synthetic)" },
  { label: "Cases reviewed (30d)", value: "128" },
  { label: "Acceptance rate", value: "74%" },
  { label: "GUARDIAN alerts resolved", value: "91%" }
];

const EQUITY_FLAGS = [
  { region: "North district", flag: "HbA1c screening gap", severity: "medium" },
  { region: "East district", flag: "Medication review backlog", severity: "high" },
  { region: "South district", flag: "No equity signal (synthetic)", severity: "low" }
];

export default function RegionalDashboardPage() {
  return (
    <DashboardLayout
      description="Federated aggregate metrics only — no patient-level drill-down. EQUITY heatmap stub."
      role="regional"
      title="Regional Dashboard"
    >
      <div className="gp-proof-banner panel">
        <strong>Aggregate layer only</strong>
        <p>Regional leads see pseudonymised counts. Individual FHIR records are not accessible from this surface.</p>
      </div>

      <div className="dashboard-grid">
        <section className="panel stack">
          <p className="gp-panel__eyebrow">Population metrics</p>
          <h2>Cross-practice aggregates</h2>
          <ul className="list">
            {AGGREGATE_METRICS.map((metric) => (
              <li key={metric.label}>
                <strong>{metric.label}</strong>
                <span>{metric.value}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel stack">
          <p className="gp-panel__eyebrow">EQUITY agent · stub</p>
          <h2>Disparity flags (synthetic)</h2>
          <div className="list">
            {EQUITY_FLAGS.map((row) => (
              <article className="gp-queue-item" key={row.region}>
                <strong>{row.region}</strong>
                <p>{row.flag}</p>
                <span className="pill">{row.severity}</span>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="actions">
        <Link className="button secondary" href="/dashboards">
          Leadership dashboards hub
        </Link>
      </div>
    </DashboardLayout>
  );
}
