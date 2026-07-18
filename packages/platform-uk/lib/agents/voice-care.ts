import {
  appendNurseEscalationTask,
  buildNurseEscalationTask,
  buildVoiceCareEscalation,
  VOICE_CARE_DAY3_TRANSCRIPT,
  type VoiceCareEscalationState,
  writeVoiceCareEscalation
} from "@/lib/voice-care";
import type { NurseEscalationTask, ReviewCase } from "@/lib/types";

export type VoiceCareEscalationResult = {
  channel: "synthetic_outbound";
  telephony: false;
  label: "VOICE CARE — DAY 3 OUTBOUND (SYNTHETIC)";
  transcript: string;
  escalation: VoiceCareEscalationState;
  nurseTask: NurseEscalationTask;
  hitlRequired: true;
  ehrWrite: false;
};

/** Build a synthetic Day-3 outbound escalation (no telephony). */
export function runVoiceCareEscalation(input: {
  caseId?: string;
  patientLabel?: string;
  oracleScore?: number;
}): VoiceCareEscalationResult {
  const current = input.oracleScore ?? 82;
  const reviewCase = {
    id: input.caseId?.trim() || "case-voice-care-demo",
    patientLabel: input.patientLabel?.trim() || "Mrs Johnson",
    oracleRiskScore: {
      baseline: Math.max(0, current - 9),
      current,
      factors: ["Synthetic Day-3 outbound check-in"]
    }
  } as ReviewCase;

  const escalation = buildVoiceCareEscalation(reviewCase);
  const nurseTask = buildNurseEscalationTask(reviewCase, escalation);

  return {
    channel: "synthetic_outbound",
    telephony: false,
    label: "VOICE CARE — DAY 3 OUTBOUND (SYNTHETIC)",
    transcript: VOICE_CARE_DAY3_TRANSCRIPT,
    escalation,
    nurseTask,
    hitlRequired: true,
    ehrWrite: false
  };
}

/** Client helper: persist escalation locally after a successful API response. */
export function persistVoiceCareClientState(result: VoiceCareEscalationResult) {
  writeVoiceCareEscalation(result.escalation);
  appendNurseEscalationTask(result.nurseTask);
}
