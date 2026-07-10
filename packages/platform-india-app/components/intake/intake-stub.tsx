"use client";

import { useState } from "react";

import { createReviewCaseFromIntake } from "@/lib/types";
import { createStubIndicBertNer } from "@/lib/nlp/india-nlp";
import { hi } from "@/lib/i18n/hi";

const ner = createStubIndicBertNer();

export function IntakeStub() {
  const [rawInput, setRawInput] = useState(
    "मरीज़ को 3 दिन से खांसी और बुखार। amoxicillin पर चर्चा। penicillin allergy इतिहास।"
  );
  const [preview, setPreview] = useState<string | null>(null);

  async function handleSubmit() {
    const draft = createReviewCaseFromIntake({
      patientLabel: "Phase 0 Intake",
      rawInput,
      sourceType: "transcript"
    });
    const nerResult = await ner.extractEntities(rawInput, "hi");
    setPreview(
      JSON.stringify(
        {
          encounterReason: draft.draft.encounter.reason,
          condition: draft.draft.condition.codeText,
          nerEntities: nerResult.entities,
          safetyRef: "ICMR respiratory pathway · Indian Pharmacopoeia DDI check pending"
        },
        null,
        2
      )
    );
  }

  return (
    <section className="panel stack">
      <div>
        <h2>{hi.intake.title}</h2>
        <p className="muted">{hi.intake.subtitle}</p>
      </div>
      <textarea
        rows={6}
        value={rawInput}
        onChange={(event) => setRawInput(event.target.value)}
        style={{ width: "100%", padding: 12, borderRadius: 12 }}
        aria-label={hi.intake.placeholder}
      />
      <button type="button" className="button" onClick={() => void handleSubmit()}>
        {hi.intake.submit}
      </button>
      {preview ? (
        <pre className="panel" style={{ overflow: "auto", fontSize: 13 }}>
          {preview}
        </pre>
      ) : null}
    </section>
  );
}
