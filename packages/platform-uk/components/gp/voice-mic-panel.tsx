"use client";

import { useState } from "react";

import { AudioRecorder } from "@/components/review/audio-recorder";

const PATEL_STUB_TRANSCRIPT =
  "Patient reports worsening right calf swelling and discomfort over five days. Type 2 diabetes: blood sugars running 12 to 14, polydipsia. Last HbA1c 68 mmol/mol. On metformin and aspirin 75mg. Considering apixaban for suspected DVT after Wells score discussion.";

export function VoiceMicPanel({
  onTranscript,
  initialSummary
}: {
  onTranscript: (transcript: string) => void;
  initialSummary?: string;
}) {
  const [lastTranscript, setLastTranscript] = useState(initialSummary ?? "");
  const [mode, setMode] = useState<"idle" | "stub" | "live" | "simulated">("idle");

  function handleTranscript(
    transcript: string,
    meta?: { simulated?: boolean; mode?: string }
  ) {
    setLastTranscript(transcript);
    setMode(meta?.simulated || meta?.mode === "simulated" ? "simulated" : "live");
    onTranscript(transcript);
  }

  function injectStubTranscript() {
    setLastTranscript(PATEL_STUB_TRANSCRIPT);
    setMode("stub");
    onTranscript(PATEL_STUB_TRANSCRIPT);
  }

  return (
    <div className="gp-patient-card gp-voice-mic">
      <div className="gp-panel__header" style={{ marginBottom: "0.5rem" }}>
        <h3>VOICE · sub-capability</h3>
        <span className="pill">feeds CANVAS</span>
        <span className="pill" data-testid="voice-not-voice-care">
          ≠ VOICE CARE
        </span>
      </div>
      <p className="meta">
        Microphone dictation feeds CANVAS intake (not a peer directory agent; not VOICE CARE outbound).
        SYNTHESIS then drafts SOAP notes for clinician review.
      </p>
      <div className="actions" style={{ flexWrap: "wrap" }}>
        <button className="button primary" onClick={injectStubTranscript} type="button">
          Load sample transcript
        </button>
      </div>
      <AudioRecorder onTranscriptionComplete={handleTranscript} />
      {lastTranscript ? (
        <div className="gp-intake-excerpt" style={{ marginTop: "0.75rem" }}>
          <strong>
            {mode === "stub"
              ? "Stub transcript"
              : mode === "simulated"
                ? "Simulated transcript"
                : "Live transcript"}
          </strong>
          <p>{lastTranscript}</p>
        </div>
      ) : null}
    </div>
  );
}
