import type { NurseEscalationTask, ReviewCase } from "./types";

export const VOICE_CARE_DAY3_TRANSCRIPT = [
  "VOICE CARE (Day 3 outbound: synthetic)",
  "Agent: How are you feeling since your consultation three days ago?",
  "Patient: My calf is more painful and tighter. I also felt short of breath climbing stairs this morning.",
  "Agent: Thank you. I am flagging worsening calf pain and new breathlessness for urgent clinician review.",
  "Assessment: Possible pulmonary embolism risk in context of suspected DVT: escalate immediately."
].join("\n");

export const VOICE_CARE_ESCALATION_KEY = "aksh-voice-care-escalation-v1";

export type VoiceCareEscalationState = {
  caseId: string;
  patientLabel: string;
  triggeredAt: string;
  oracleScore: number;
  oraclePrevious: number;
  symptoms: string[];
  guardianAudit: string;
  shieldAudit: string;
};

export function buildVoiceCareEscalation(reviewCase: ReviewCase): VoiceCareEscalationState {
  const previous = reviewCase.oracleRiskScore?.current ?? 82;
  return {
    caseId: reviewCase.id,
    patientLabel: reviewCase.patientLabel,
    triggeredAt: new Date().toISOString(),
    oraclePrevious: previous,
    oracleScore: 91,
    symptoms: ["Worsening left calf pain", "New shortness of breath on exertion"],
    guardianAudit: "GUARDIAN: PE risk flag staged: dual antithrombotic context reviewed (synthetic)",
    shieldAudit: "SHIELD: Voice Care escalation logged: zero auto-write, clinician task created"
  };
}

export function buildNurseEscalationTask(reviewCase: ReviewCase, escalation: VoiceCareEscalationState): NurseEscalationTask {
  return {
    id: `nurse-task-${reviewCase.id}-voice-care`,
    patientLabel: reviewCase.patientLabel,
    caseId: reviewCase.id,
    priority: "urgent",
    summary: `Voice Care Day-3: ${escalation.symptoms.join("; ")} | ORACLE ${escalation.oraclePrevious}→${escalation.oracleScore}`,
    createdAt: escalation.triggeredAt,
    source: "voice_care"
  };
}

export function readVoiceCareEscalation(): VoiceCareEscalationState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(VOICE_CARE_ESCALATION_KEY);
    return raw ? (JSON.parse(raw) as VoiceCareEscalationState) : null;
  } catch {
    return null;
  }
}

export function writeVoiceCareEscalation(state: VoiceCareEscalationState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(VOICE_CARE_ESCALATION_KEY, JSON.stringify(state));
}

export function readNurseEscalationTasks(): NurseEscalationTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(`${VOICE_CARE_ESCALATION_KEY}-nurse-tasks`);
    return raw ? (JSON.parse(raw) as NurseEscalationTask[]) : [];
  } catch {
    return [];
  }
}

export function writeNurseEscalationTasks(tasks: NurseEscalationTask[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${VOICE_CARE_ESCALATION_KEY}-nurse-tasks`, JSON.stringify(tasks));
}

export function appendNurseEscalationTask(task: NurseEscalationTask) {
  const existing = readNurseEscalationTasks();
  if (existing.some((item) => item.id === task.id)) return existing;
  const next = [task, ...existing];
  writeNurseEscalationTasks(next);
  return next;
}
