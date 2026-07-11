"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { PublicProductNav } from "@/components/product/public-product-nav";
import { GOLDEN_SCENARIO_PATEL_DEMO_ID } from "@/lib/agents";

const DEMO_STEPS = [
  {
    id: "midnight-etl",
    title: "Midnight ETL status",
    route: "/dashboard/admin",
    narrative: "Last night while patients slept — synthetic extraction SUCCESS in 6m 39s.",
    demoSection: "§5.1"
  },
  {
    id: "gp-dashboard",
    title: "Clinician dashboard — Mr Patel",
    route: "/dashboard/gp",
    narrative: "Appointment list sorted by ORACLE risk — Mr James Patel (78 HIGH) at top.",
    demoSection: "§5.2–5.3"
  },
  {
    id: "voice-consult",
    title: "VOICE consultation",
    route: "/dashboard/gp?highlight=voice",
    narrative: "Click mic — calf swelling, sugars 12–14, polydipsia transcribed to SYNTHESIS path.",
    demoSection: "§5.4"
  },
  {
    id: "review-queue",
    title: "AI review queue",
    route: "/dashboard/gp?highlight=queue",
    narrative: "Four DRAFT items: SOAP, codes, GUARDIAN URGENT, ORACLE 78→82.",
    demoSection: "§5.5–5.6"
  },
  {
    id: "referral",
    title: "REFERRAL AGENT package",
    route: "/dashboard/gp?highlight=referral",
    narrative: "After SOAP + codes Accept — urgent DVT duplex + D-dimer ServiceRequest draft.",
    demoSection: "§5.8"
  },
  {
    id: "pharmacist",
    title: "Pharmacist view",
    route: "/dashboard/pharmacist",
    narrative: "GUARDIAN medication queue — aspirin + apixaban interaction review.",
    demoSection: "Layer 1"
  },
  {
    id: "admin-audit",
    title: "Admin SHIELD audit",
    route: `/cases/${GOLDEN_SCENARIO_PATEL_DEMO_ID}/evidence`,
    narrative: "AuditEvent manifest — agents activated, zero auto-writes.",
    demoSection: "§5.9"
  },
  {
    id: "voice-care",
    title: "Voice Care Day 3",
    route: "/demo/voice-care-day3",
    narrative: "Outbound call — worsening calf pain + SOB → ORACLE 91 → nurse escalation.",
    demoSection: "§5.10"
  },
  {
    id: "regional",
    title: "Regional population view",
    route: "/dashboard/regional",
    narrative: "Aggregate metrics + EQUITY disparity insights across practices.",
    demoSection: "§5.11"
  }
] as const;

export function OverviewDemoLauncher() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStep = Number(searchParams.get("step") ?? "0");
  const [stepIndex, setStepIndex] = useState(Number.isFinite(initialStep) ? Math.min(initialStep, DEMO_STEPS.length - 1) : 0);

  const step = DEMO_STEPS[stepIndex];
  const progress = useMemo(() => Math.round(((stepIndex + 1) / DEMO_STEPS.length) * 100), [stepIndex]);

  function goToStep(index: number) {
    const next = Math.max(0, Math.min(DEMO_STEPS.length - 1, index));
    setStepIndex(next);
    router.replace(`/demo/patel?step=${next}`, { scroll: false });
  }

  return (
    <main className="product-page product-page--demo">
      <div className="product-sky" aria-hidden="true" />
      <PublicProductNav ctaHref="/dashboard/gp" ctaLabel="Open clinician dashboard" />

      <section className="product-simple-hero">
        <p className="product-kicker">Overview Demo · ~25 min investor script</p>
        <h1>Mr James Patel walkthrough</h1>
        <p>
          Ordered synthetic demo from midnight ETL through GP consult, HITL queue, referral package, Voice Care Day-3,
          and regional EQUITY view. Proof-mode only — no production claims.
        </p>
        <div className="pill-row">
          <span className="pill">Step {stepIndex + 1} / {DEMO_STEPS.length}</span>
          <span className="pill">{progress}% complete</span>
          <span className="pill">Case {GOLDEN_SCENARIO_PATEL_DEMO_ID}</span>
        </div>
      </section>

      <section className="panel stack demo-launcher-step">
        <p className="gp-panel__eyebrow">{step.demoSection}</p>
        <h2>{step.title}</h2>
        <p>{step.narrative}</p>
        <div className="actions">
          <Link className="button primary" href={step.route}>
            Open step surface
          </Link>
          <button className="button secondary" disabled={stepIndex === 0} onClick={() => goToStep(stepIndex - 1)} type="button">
            Previous
          </button>
          <button
            className="button primary"
            disabled={stepIndex >= DEMO_STEPS.length - 1}
            onClick={() => goToStep(stepIndex + 1)}
            type="button"
          >
            Next
          </button>
        </div>
      </section>

      <section className="demo-script-layout">
        <div className="demo-script-main">
          {DEMO_STEPS.map((item, index) => (
            <article
              className={`demo-stop${index === stepIndex ? " demo-stop--active" : ""}`}
              key={item.id}
              onClick={() => goToStep(index)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") goToStep(index);
              }}
              role="button"
              tabIndex={0}
            >
              <div className="demo-stop__time">{String(index + 1).padStart(2, "0")}</div>
              <div className="demo-stop__body">
                <div className="demo-stop__head">
                  <div>
                    <p className="product-card-label">{item.demoSection}</p>
                    <h2>{item.title}</h2>
                  </div>
                  <Link className="product-button product-button--secondary" href={item.route} onClick={(e) => e.stopPropagation()}>
                    Open
                  </Link>
                </div>
                <p>{item.narrative}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
