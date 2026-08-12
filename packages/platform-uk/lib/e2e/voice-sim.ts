/**
 * VOICE encounter capture — SIMULATED deterministic path (not live mic).
 * Produces SYNTHESIS-ready documentation input; labelled simulated throughout.
 */

export const VOICE_SIM_HONESTY = {
  liveMicCapture: false as const,
  liveEmis: false as const,
  ehrWrite: false as const,
  note: "Simulated VOICE capture — deterministic transcript, not live microphone / telephony.",
} as const;

export type SimulatedVoiceCapture = {
  id: string;
  patientId: string;
  correlationId: string;
  modality: "simulated_transcript";
  liveMicCapture: false;
  transcript: string;
  durationSec: number;
  capturedAt: string;
  actor: string;
  synthesisInputReady: true;
  ehrWrite: false;
  note: string;
};

export type SimulatedSynthesisDraft = {
  id: string;
  voiceCaptureId: string;
  patientId: string;
  correlationId: string;
  soapSummary: string;
  status: "draft";
  hitlRequired: true;
  liveMicCapture: false;
  ehrWrite: false;
  agent: "SYNTHESIS";
  note: string;
};

export function captureSimulatedVoiceEncounter(input: {
  patientId: string;
  correlationId: string;
  actor: string;
  clinicalFocus?: string;
  at?: string;
}): SimulatedVoiceCapture {
  const focus =
    input.clinicalFocus ??
    "progressive Type 2 diabetes review — rising HbA1c, weight gain, adherence uncertain";
  const at = input.at ?? new Date().toISOString();
  return {
    id: `e2e-voice-${input.correlationId.slice(-8)}`,
    patientId: input.patientId,
    correlationId: input.correlationId,
    modality: "simulated_transcript",
    liveMicCapture: false,
    transcript: [
      `SIMULATED VOICE encounter for ${input.patientId}.`,
      `Focus: ${focus}.`,
      "Patient reports fatigue and reduced activity. No chest pain.",
      "Plan discussed as draft only — clinician Accept required before ACT.",
      `correlationId=${input.correlationId}`,
    ].join(" "),
    durationSec: 420,
    capturedAt: at,
    actor: input.actor,
    synthesisInputReady: true,
    ehrWrite: false,
    note: VOICE_SIM_HONESTY.note,
  };
}

/**
 * Produce a SYNTHESIS draft from simulated VOICE — operationally complete, HITL required.
 */
export function draftSynthesisFromSimulatedVoice(
  capture: SimulatedVoiceCapture
): SimulatedSynthesisDraft {
  if (!capture.synthesisInputReady || capture.liveMicCapture !== false) {
    throw new Error("VOICE capture is not a valid simulated SYNTHESIS input");
  }
  return {
    id: `e2e-synth-${capture.id}`,
    voiceCaptureId: capture.id,
    patientId: capture.patientId,
    correlationId: capture.correlationId,
    soapSummary: [
      "S: Fatigue, reduced activity (SIMULATED VOICE).",
      "O: Progressive HbA1c rise in Patient State.",
      "A: Deteriorating T2D control — review required.",
      "P: Draft care-plan / labs / pharmacy chase — HITL Accept before ACT.",
    ].join(" "),
    status: "draft",
    hitlRequired: true,
    liveMicCapture: false,
    ehrWrite: false,
    agent: "SYNTHESIS",
    note: "SYNTHESIS draft from SIMULATED VOICE — not live mic, not EHR write.",
  };
}
