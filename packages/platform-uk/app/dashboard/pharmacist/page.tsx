"use client";

import Link from "next/link";
import { useMemo } from "react";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { AgentBadge } from "@/components/review/agent-badge";
import { GOLDEN_SCENARIO_V_UK1_ID } from "@/lib/agents";
import { useReviewCases } from "@/lib/use-review-cases";
import { resolveReviewQueueItems } from "@/lib/workflow";

export default function PharmacistDashboardPage() {
  const { getCaseById, isLoaded } = useReviewCases();

  const guardianItems = useMemo(() => {
    if (!isLoaded) return [];
    const reviewCase = getCaseById(GOLDEN_SCENARIO_V_UK1_ID);
    if (!reviewCase) return [];
    return resolveReviewQueueItems(reviewCase).filter((item) => item.agentId === "GUARDIAN");
  }, [getCaseById, isLoaded]);

  return (
    <DashboardLayout
      description="Medication review queue with GUARDIAN interaction alerts — wired to golden scenario V-UK1."
      role="pharmacist"
      title="Pharmacist Dashboard"
    >
      <div className="dashboard-grid">
        <section className="panel stack">
          <p className="gp-panel__eyebrow">Medication review queue</p>
          <h2>GUARDIAN interaction alerts</h2>
          {guardianItems.length ? (
            <div className="list">
              {guardianItems.map((item) => (
                <article className="gp-queue-item" key={item.id}>
                  <div className="gp-queue-item__header">
                    <AgentBadge agentId={item.agentId} />
                    <span className="pill">{item.status}</span>
                  </div>
                  <strong>{item.title}</strong>
                  <p>{item.summary}</p>
                  {item.content ? <pre className="gp-queue-item__content">{item.content}</pre> : null}
                </article>
              ))}
            </div>
          ) : (
            <p>Seed synthetic data with <code>npm run data:seed</code> to load case V-UK1 GUARDIAN alert.</p>
          )}
          <div className="actions">
            <Link className="button primary" href="/dashboard/gp">
              Open clinician review queue
            </Link>
            <Link className="button secondary" href={`/cases/${GOLDEN_SCENARIO_V_UK1_ID}`}>
              Full case evidence
            </Link>
          </div>
        </section>

        <section className="panel stack">
          <p className="gp-panel__eyebrow">Formulary panel (stub)</p>
          <h2>Interaction reference</h2>
          <p>Regional formulary and pharmacopoeia datasets ship in Phase D. This stub shows queue wiring only.</p>
          <ul>
            <li>Aspirin + Apixaban — anticoagulant bleed risk (HIGH)</li>
            <li>Metformin — no new interaction flagged</li>
          </ul>
        </section>
      </div>
    </DashboardLayout>
  );
}
