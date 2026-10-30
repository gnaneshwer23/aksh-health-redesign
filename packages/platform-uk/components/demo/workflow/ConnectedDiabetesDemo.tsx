"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  CONNECTED_DEMO_PATIENT_ID,
  CONNECTED_JOURNEY_DISCLOSURE,
  CONNECTED_JOURNEY_STEPS,
  type ConnectedJourneyStepId,
} from "@/lib/diabetes-intelligence/connected-journey-steps";
import { STATUS_LABEL, capability } from "@/lib/status/capabilities";

const STEP_BEATS: {
  id: ConnectedJourneyStepId | "disclosure";
  label: string;
  body: string;
  decisionHint?: string;
}[] = [
  {
    id: "disclosure",
    label: "1 · Disclosure",
    body: CONNECTED_JOURNEY_DISCLOSURE,
  },
  {
    id: "patient-360",
    label: "2 · Patient 360",
    body: "Seed the structured spine: conditions, allergies, med recon scaffolding, provenance. No prescribe.",
  },
  {
    id: "glucose",
    label: "3 · Glucose intelligence",
    body: "Seed CGM/SMBG/HbA1c, draft a review, then Accept / Edit / Reject. Deterministic calculations only.",
    decisionHint: "Clinician sign-off on glucose review",
  },
  {
    id: "medication",
    label: "4 · Medication & care",
    body: "Reconciliation, synthetic interaction stub, safety review, care-plan template. No autonomous adjust.",
    decisionHint: "Accept / Edit / Reject care-plan draft",
  },
  {
    id: "journey",
    label: "5 · Care journey HITL",
    body: "Vertical-slice care plan draft → clinician decision → follow-up task. ehrWrite stays false.",
    decisionHint: "Care-plan Accept / Edit / Reject",
  },
  {
    id: "continuous",
    label: "6 · Continuous care",
    body: "Follow-ups, appointments, escalations with HITL. GP worklist and nurse queue share the same patient id.",
    decisionHint: "Escalation Accept / Edit / Reject",
  },
  {
    id: "agent",
    label: "7 · Agent intelligence",
    body: "Orchestrated draft pack with evidence citations and version pins. AI-generated until clinician verifies.",
    decisionHint: "Draft Accept / Edit / Reject",
  },
  {
    id: "timeline",
    label: "8 · Longitudinal timeline",
    body: "Merged journey + continuous + glucose/medcare/agent events for P002 via /timeline and Patient 360 panel.",
  },
];

/**
 * Flagship guided demo for the full Connected Diabetes journey (synthetic).
 */
export function ConnectedDiabetesDemo() {
  const [beat, setBeat] = useState(0);
  const [decision, setDecision] = useState<"accept" | "edit" | "reject">("accept");
  const current = STEP_BEATS[beat]!;
  const patientId = CONNECTED_DEMO_PATIENT_ID;
  const cap = capability("diabetes_care_journey");

  const dashboardHref = useMemo(() => {
    if (current.id === "disclosure") {
      return `/dashboard/gp/patients/${patientId}/patient-360`;
    }
    const step = CONNECTED_JOURNEY_STEPS.find((s) => s.id === current.id);
    return step?.href(patientId) ?? `/dashboard/gp/patients/${patientId}`;
  }, [current.id, patientId]);

  return (
    <div className="wd" data-demo="connected-diabetes" data-step={current.id} data-capture-ready>
      <header className="wd-hero">
        <div className="s-container">
          <p className="s-eyebrow">Synthetic clinical intelligence</p>
          <h1 className="s-h1" style={{ fontSize: "clamp(28px, 4vw, 42px)" }}>
            Connected diabetes journey
          </h1>
          <p className="s-lede" style={{ maxWidth: 640 }}>
            Walk Patient 360 → glucose → medication → care-plan HITL → continuous care → agent drafts →
            timeline on synthetic patient {patientId}. Clinicians always decide.
          </p>
          <div className="wd-meta" aria-label="Demo boundaries">
            <span className="c-chip c-chip--ink">Synthetic data only</span>
            <span className="c-chip c-chip--teal">{STATUS_LABEL[cap.status]}</span>
            <span className="c-chip">HITL on every draft</span>
            <span className="c-chip">~8 minutes</span>
          </div>
          <p className="wd-disclosure">{CONNECTED_JOURNEY_DISCLOSURE}</p>
        </div>
      </header>

      <div className="s-container wd-layout">
        <aside className="wd-rail" aria-label="Demo controls">
          <div className="wd-rail__block">
            <h2 className="wd-rail__title">Journey</h2>
            <ol className="wd-steps">
              {STEP_BEATS.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`wd-step${i === beat ? " is-on" : ""}${i < beat ? " is-done" : ""}`}
                    aria-current={i === beat ? "step" : undefined}
                    onClick={() => setBeat(i)}
                  >
                    <span className="wd-step__n">{i + 1}</span>
                    <span>{s.label.replace(/^\d+\s*·\s*/, "")}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>

          {current.decisionHint ? (
            <div className="wd-rail__block">
              <h2 className="wd-rail__title">Clinician decision (scenario)</h2>
              <p className="wd-rail__hint">Demo knob — opens the live dashboard for the real HITL.</p>
              <div className="wd-choices" role="radiogroup" aria-label="Decision scenario">
                {(["accept", "edit", "reject"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    role="radio"
                    aria-checked={decision === opt}
                    className={`wd-choice${decision === opt ? " is-on" : ""}`}
                    onClick={() => setDecision(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </aside>

        <main className="wd-stage">
          <article className="wd-card" data-testid="connected-diabetes-beat">
            <p className="s-eyebrow">{current.label}</p>
            <h2 className="s-h3" style={{ fontSize: 22, marginTop: 8 }}>
              {current.id === "disclosure" ? "Boundaries first" : `Open ${current.label.replace(/^\d+\s*·\s*/, "")}`}
            </h2>
            <p className="s-lede" style={{ marginTop: 12 }}>
              {current.body}
            </p>
            {current.decisionHint ? (
              <p className="s-small" style={{ marginTop: 12 }}>
                Scenario: clinician will <strong>{decision}</strong> — {current.decisionHint}. No EHR write.
              </p>
            ) : null}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 20 }}>
              <Link href={dashboardHref} className="s-link" data-testid="connected-diabetes-open">
                Open dashboard step →
              </Link>
              <button
                type="button"
                className="wd-choice"
                disabled={beat >= STEP_BEATS.length - 1}
                onClick={() => setBeat((b) => Math.min(b + 1, STEP_BEATS.length - 1))}
              >
                Next beat
              </button>
            </div>
          </article>
        </main>
      </div>
    </div>
  );
}
