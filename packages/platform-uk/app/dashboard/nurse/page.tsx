"use client";

import Link from "next/link";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useReviewCases } from "@/lib/use-review-cases";

const VITALS_STUB = [
  { patient: "Margaret T.", observation: "HbA1c", value: "58 mmol/mol", status: "review" },
  { patient: "Synthetic Patient B", observation: "Blood pressure", value: "Pending entry", status: "draft" },
  { patient: "Synthetic Patient C", observation: "Temperature", value: "36.8°C", status: "final" }
];

export default function NurseDashboardPage() {
  const { cases, isLoaded } = useReviewCases();
  const patients = isLoaded ? cases.slice(0, 5).map((item) => item.patientLabel) : [];

  return (
    <DashboardLayout
      description="Patient list, vital-sign capture, and handover queue — synthetic data only."
      role="nurse"
      title="Nurse Dashboard"
    >
      <div className="dashboard-grid">
        <section className="panel stack">
          <p className="gp-panel__eyebrow">Patient panel</p>
          <h2>Assigned patients</h2>
          <ul className="list">
            {patients.length ? (
              patients.map((label) => (
                <li key={label}>
                  <strong>{label}</strong>
                  <span className="pill">Observation due</span>
                </li>
              ))
            ) : (
              <li>Loading synthetic patients…</li>
            )}
          </ul>
        </section>

        <section className="panel stack">
          <p className="gp-panel__eyebrow">Vitals review queue</p>
          <h2>Observations awaiting nurse review</h2>
          <div className="list">
            {VITALS_STUB.map((row) => (
              <article className="gp-queue-item" key={`${row.patient}-${row.observation}`}>
                <strong>{row.patient}</strong>
                <p>
                  {row.observation}: {row.value}
                </p>
                <span className="pill">{row.status}</span>
              </article>
            ))}
          </div>
          <div className="actions">
            <Link className="button secondary" href="/intake">
              Capture new observation
            </Link>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
