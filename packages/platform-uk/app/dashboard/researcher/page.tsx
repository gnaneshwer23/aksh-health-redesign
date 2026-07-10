"use client";

import Link from "next/link";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default function ResearcherDashboardPage() {
  return (
    <DashboardLayout
      description="Research analytics — aggregate outcomes, export formats, and governance boundaries."
      role="admin"
      title="Researcher Dashboard"
    >
      <div className="dashboard-grid">
        <section className="panel stack">
          <p className="gp-panel__eyebrow">Data access</p>
          <h2>Aggregate research view</h2>
          <p>Pseudonymised cohort metrics and AI outcome signals for approved studies.</p>
        </section>
        <section className="panel stack">
          <p className="gp-panel__eyebrow">Exports</p>
          <h2>Report formats</h2>
          <div className="actions">
            <Link className="button secondary" href="/api/research/evaluation">
              API evaluation export
            </Link>
            <Link className="button secondary" href="/review/benchmarks">
              Benchmark dashboard
            </Link>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
