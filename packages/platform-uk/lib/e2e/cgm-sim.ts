/**
 * CGM simulation for cohort D hypoglycaemia safety path.
 * Device adapter is SIMULATED — not a live CGM vendor feed.
 */

import type { E2EPatientProfile } from "./types";

export const CGM_SIM_HONESTY = {
  liveCgmFeed: false as const,
  liveEmis: false as const,
  ehrWrite: false as const,
  note: "Simulated CGM device adapter — not Dexcom/Libre/live vendor integration.",
} as const;

export type CgmHypoEvent = {
  id: string;
  patientId: string;
  glucoseMgDl: number;
  occurredAt: string;
  severity: "mild" | "moderate" | "severe";
  liveCgmFeed: false;
};

export type CgmSafetyAlert = {
  id: string;
  patientId: string;
  hypoEventCount7d: number;
  timeInRangePct: number;
  status: "open";
  route: "nurse" | "gp";
  decisionBias: "ESCALATE";
  hitlRequired: true;
  liveCgmFeed: false;
  ehrWrite: false;
  summary: string;
  correlationId: string;
  note: string;
};

export function buildSimulatedCgmHypoSeries(patient: E2EPatientProfile): CgmHypoEvent[] {
  const summary = patient.cgmSummary;
  const count = summary?.hypoEvents7d ?? (patient.cohortId === "D" ? 3 : 0);
  if (count <= 0) return [];

  const base = summary?.effectiveAt ?? "2026-08-10T08:00:00.000Z";
  const events: CgmHypoEvent[] = [];
  for (let i = 0; i < count; i += 1) {
    const glucose = i === 0 ? 48 : i === 1 ? 54 : 58;
    events.push({
      id: `e2e-cgm-hypo-${patient.id}-${i + 1}`,
      patientId: patient.id,
      glucoseMgDl: glucose,
      occurredAt: new Date(Date.parse(base) - i * 86_400_000).toISOString(),
      severity: glucose < 50 ? "severe" : glucose < 55 ? "moderate" : "mild",
      liveCgmFeed: false,
    });
  }
  return events;
}

/**
 * Raise safety alert from simulated CGM hypos — routes to clinician/nurse, never auto-treats.
 */
export function raiseCgmSafetyAlert(input: {
  patient: E2EPatientProfile;
  events: CgmHypoEvent[];
  correlationId: string;
}): CgmSafetyAlert | null {
  if (input.events.length < 3 && (input.patient.cgmSummary?.hypoEvents7d ?? 0) < 3) {
    return null;
  }
  const hypoCount = Math.max(input.events.length, input.patient.cgmSummary?.hypoEvents7d ?? 0);
  return {
    id: `e2e-cgm-alert-${input.patient.id}`,
    patientId: input.patient.id,
    hypoEventCount7d: hypoCount,
    timeInRangePct: input.patient.cgmSummary?.timeInRangePct ?? 52,
    status: "open",
    route: hypoCount >= 3 ? "gp" : "nurse",
    decisionBias: "ESCALATE",
    hitlRequired: true,
    liveCgmFeed: false,
    ehrWrite: false,
    summary: `SIMULATED CGM: ${hypoCount} hypo events/7d — safety review required (no autonomous treatment)`,
    correlationId: input.correlationId,
    note: CGM_SIM_HONESTY.note,
  };
}
