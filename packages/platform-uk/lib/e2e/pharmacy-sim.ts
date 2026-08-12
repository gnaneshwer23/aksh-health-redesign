/**
 * Pharmacy simulation (Stage 9) — adherence / dispense / allergy barriers.
 * Never live prescribing or EPS write-back.
 */

import type { E2EPharmacyEvent, E2EPharmacyEventKind } from "./types";

export const PHARMACY_SIM_HONESTY = {
  livePrescribing: false as const,
  liveEmis: false as const,
  ehrWrite: false as const,
  note: "Simulated pharmacy workflow only — no EPS / live dispense feed.",
} as const;

export type PharmacyCoordinationTask = {
  id: string;
  pharmacyEventId: string;
  patientId: string;
  kind: "adherence_follow_up" | "allergy_block_review" | "refill_chase";
  assigneeRole: "care_coordinator" | "pharmacist" | "gp";
  status: "open" | "documented" | "escalated_to_clinician" | "closed";
  barrierSummary: string;
  medication: string;
  createdAt: string;
  updatedAt: string;
  hitlRequired: true;
  ehrWrite: false;
  livePrescribing: false;
};

export function findAdherenceFailures(
  events: E2EPharmacyEvent[],
  options?: { patientId?: string }
): E2EPharmacyEvent[] {
  return events.filter((e) => {
    if (e.kind !== "adherence_issue" || e.status !== "failed") return false;
    if (options?.patientId && e.patientId !== options.patientId) return false;
    return true;
  });
}

export function createCoordinationTaskFromPharmacyEvent(input: {
  event: E2EPharmacyEvent;
  actor: string;
  at?: string;
}): PharmacyCoordinationTask {
  if (input.event.kind !== "adherence_issue" && input.event.kind !== "missed_refill" && input.event.kind !== "allergy_issue") {
    throw new Error(`Pharmacy event ${input.event.kind} does not require coordination task`);
  }
  if (input.event.status === "completed") {
    throw new Error("Completed pharmacy event does not open a new coordination task");
  }

  const at = input.at ?? new Date().toISOString();
  const kind: PharmacyCoordinationTask["kind"] =
    input.event.kind === "allergy_issue"
      ? "allergy_block_review"
      : input.event.kind === "missed_refill"
        ? "refill_chase"
        : "adherence_follow_up";

  return {
    id: `e2e-pharm-task-${input.event.id}`,
    pharmacyEventId: input.event.id,
    patientId: input.event.patientId,
    kind,
    assigneeRole: "care_coordinator",
    status: "open",
    barrierSummary: `Synthetic ${input.event.kind} for ${input.event.medication} (actor=${input.actor})`,
    medication: input.event.medication,
    createdAt: at,
    updatedAt: at,
    hitlRequired: true,
    ehrWrite: false,
    livePrescribing: false,
  };
}

export function escalateCoordinationTaskToClinician(
  task: PharmacyCoordinationTask,
  actor: string,
  at?: string
): PharmacyCoordinationTask {
  if (task.status === "closed") {
    throw new Error("Cannot escalate a closed pharmacy coordination task");
  }
  return {
    ...task,
    status: "escalated_to_clinician",
    assigneeRole: "gp",
    updatedAt: at ?? new Date().toISOString(),
    barrierSummary: `${task.barrierSummary} · escalated to clinician by ${actor}`,
  };
}

export function documentPharmacyBarrier(
  task: PharmacyCoordinationTask,
  notes: string,
  actor: string,
  at?: string
): PharmacyCoordinationTask {
  return {
    ...task,
    status: "documented",
    updatedAt: at ?? new Date().toISOString(),
    barrierSummary: `${task.barrierSummary} · documented by ${actor}: ${notes}`,
  };
}

export function isBlockingPharmacyKind(kind: E2EPharmacyEventKind): boolean {
  return kind === "adherence_issue" || kind === "allergy_issue" || kind === "missed_refill";
}
