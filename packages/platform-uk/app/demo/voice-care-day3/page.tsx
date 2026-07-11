"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { GOLDEN_SCENARIO_PATEL_DEMO_ID } from "@/lib/agents";
import { useReviewCases } from "@/lib/use-review-cases";
import {
  VOICE_CARE_DAY3_TRANSCRIPT,
  appendNurseEscalationTask,
  buildNurseEscalationTask,
  buildVoiceCareEscalation,
  readVoiceCareEscalation,
  writeVoiceCareEscalation
} from "@/lib/voice-care";

export default function VoiceCareDay3Page() {
  const { getCaseById, isLoaded } = useReviewCases();
  const [escalation, setEscalation] = useState(() => readVoiceCareEscalation());
  const [phase, setPhase] = useState<"call" | "escalated">(escalation ? "escalated" : "call");

  const reviewCase = useMemo(() => {
    if (!isLoaded) return null;
    return getCaseById(GOLDEN_SCENARIO_PATEL_DEMO_ID);
  }, [getCaseById, isLoaded]);

  function triggerEscalation() {
    if (!reviewCase) return;
    const next = buildVoiceCareEscalation(reviewCase);
    writeVoiceCareEscalation(next);
    appendNurseEscalationTask(buildNurseEscalationTask(reviewCase, next));
    setEscalation(next);
    setPhase("escalated");
  }

  return (
    <main className="stack" style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem" }}>
      <header className="panel stack">
        <p className="gp-panel__eyebrow">VOICE CARE · Day 3 outbound (synthetic)</p>
        <h1>Post-consult check-in: Mr James Patel</h1>
        <p>Simulates Day-3 Voice Care call after DVT consultation. Escalation triggers ORACLE re-score and nurse task.</p>
        <div className="actions">
          <Link className="button secondary" href="/demo/patel?step=7">
            Back to demo launcher
          </Link>
          <Link className="button secondary" href="/dashboard/gp">
            Clinician dashboard
          </Link>
        </div>
      </header>

      <section className="panel stack">
        <h2>Call transcript</h2>
        <pre className="gp-queue-content">{VOICE_CARE_DAY3_TRANSCRIPT}</pre>
        {phase === "call" ? (
          <button className="button primary" disabled={!isLoaded || !reviewCase} onClick={triggerEscalation} type="button">
            Simulate escalation (worsening calf pain + SOB)
          </button>
        ) : null}
      </section>

      {phase === "escalated" && escalation ? (
        <>
          <section className="panel stack gp-urgent-banner" style={{ borderColor: "var(--danger)" }}>
            <p className="gp-panel__eyebrow">Clinician alert</p>
            <h2>URGENT: Voice Care escalation</h2>
            <p>
              ORACLE composite risk {escalation.oraclePrevious} → <strong>{escalation.oracleScore}</strong> after new
              breathlessness and calf pain.
            </p>
            <ul className="gp-patient-list">
              {escalation.symptoms.map((symptom) => (
                <li key={symptom}>{symptom}</li>
              ))}
            </ul>
          </section>

          <section className="panel stack">
            <h2>GUARDIAN / SHIELD audit (synthetic)</h2>
            <p>{escalation.guardianAudit}</p>
            <p>{escalation.shieldAudit}</p>
          </section>

          <section className="panel stack">
            <h2>Nurse escalation task created</h2>
            <p>Task queued on <Link href="/dashboard/nurse">nurse dashboard</Link>. Vitals review and callback.</p>
          </section>
        </>
      ) : null}
    </main>
  );
}
