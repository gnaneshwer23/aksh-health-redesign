/**
 * File/artifact-backed laboratory simulation (Stage 9).
 * Never a live NHS lab — status transitions only on synthetic E2ELabEvent records.
 */

import type { E2ELabEvent, E2ELabOrderStatus, E2EPatientStateFactSeed } from "./types";
import { E2E_SOURCE } from "./types";

export const LAB_SIM_HONESTY = {
  liveNhsLab: false as const,
  liveEmis: false as const,
  ehrWrite: false as const,
  note: "Simulated lab workflow only — no NHS Pathology / ICE / live result feed.",
} as const;

export type LabSimTransition = {
  from: E2ELabOrderStatus;
  to: E2ELabOrderStatus;
  at: string;
  actor: string;
  note?: string;
};

export type LabSimResult = {
  event: E2ELabEvent;
  transition: LabSimTransition;
  patientStateFact?: E2EPatientStateFactSeed;
  fabricated: false;
  liveNhsLab: false;
  liveEmis: false;
  ehrWrite: false;
  note: string;
};

const ALLOWED: Record<E2ELabOrderStatus, E2ELabOrderStatus[]> = {
  ordered: ["received", "processing", "delayed", "completed"],
  received: ["processing", "delayed", "completed"],
  processing: ["delayed", "completed", "amended"],
  delayed: ["processing", "completed", "amended"],
  completed: ["amended", "duplicate"],
  amended: ["amended", "duplicate"],
  duplicate: [],
};

export function canAdvanceLabStatus(from: E2ELabOrderStatus, to: E2ELabOrderStatus): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

export function findDelayedLabs(events: E2ELabEvent[], options?: { patientId?: string; testName?: string }) {
  return events.filter((e) => {
    if (e.status !== "delayed" && e.resultFlag !== "missing") return false;
    if (options?.patientId && e.patientId !== options.patientId) return false;
    if (options?.testName && e.testName !== options.testName) return false;
    return true;
  });
}

export function assertNoInferredValueWhileDelayed(event: E2ELabEvent): string[] {
  const errors: string[] = [];
  if (event.status === "delayed" || event.resultFlag === "missing") {
    if (event.value !== null) {
      errors.push(`delayed/missing lab ${event.id} must not carry a fabricated numeric value`);
    }
    if (event.resultedAt !== null) {
      errors.push(`delayed/missing lab ${event.id} must not have resultedAt`);
    }
  }
  return errors;
}

/**
 * Complete a delayed (or in-flight) lab with an explicit measured value.
 * Idempotent: completing an already-completed event with the same value returns duplicate status.
 */
export function completeLabResult(input: {
  event: E2ELabEvent;
  value: number;
  unit?: string;
  actor: string;
  resultedAt?: string;
  batchId?: string;
}): LabSimResult {
  const at = input.resultedAt ?? new Date().toISOString();
  const from = input.event.status;

  if (from === "completed" && input.event.value === input.value) {
    return {
      event: { ...input.event, status: "duplicate" },
      transition: {
        from,
        to: "duplicate",
        at,
        actor: input.actor,
        note: "Idempotent complete — same value already recorded",
      },
      fabricated: false,
      ...LAB_SIM_HONESTY,
    };
  }

  if (!canAdvanceLabStatus(from, "completed") && from !== "completed") {
    throw new Error(`Cannot complete lab from status ${from}`);
  }

  const next: E2ELabEvent = {
    ...input.event,
    status: "completed",
    resultFlag: input.event.resultFlag === "missing" ? "normal" : input.event.resultFlag,
    value: input.value,
    unit: input.unit ?? input.event.unit,
    resultedAt: at,
  };

  const factType = next.testName === "eGFR" || next.testCode === "33914-3" ? "egfr" : next.testName.toLowerCase();
  const batchId = input.batchId ?? next.metadata.batchId;

  const patientStateFact: E2EPatientStateFactSeed = {
    id: `e2e-labfact-${next.id}`,
    patientId: next.patientId,
    factType,
    value: {
      value: next.value,
      unit: next.unit,
      testCode: next.testCode,
      testName: next.testName,
      labEventId: next.id,
      isSynthetic: true,
      batchId,
      liveNhsLab: false,
    },
    sourceSystem: E2E_SOURCE,
    sourceReference: `${batchId}:${next.patientId}:lab:${next.id}`,
    confidence: 0.95,
    effectiveAt: at,
    recordedAt: at,
  };

  return {
    event: next,
    transition: {
      from,
      to: "completed",
      at,
      actor: input.actor,
      note: "Simulated lab result delivered",
    },
    patientStateFact,
    fabricated: false,
    ...LAB_SIM_HONESTY,
  };
}

export function markLabDelayed(input: {
  event: E2ELabEvent;
  actor: string;
  at?: string;
}): LabSimResult {
  const at = input.at ?? new Date().toISOString();
  if (!canAdvanceLabStatus(input.event.status, "delayed") && input.event.status !== "delayed") {
    throw new Error(`Cannot delay lab from status ${input.event.status}`);
  }

  const next: E2ELabEvent = {
    ...input.event,
    status: "delayed",
    resultFlag: "missing",
    value: null,
    resultedAt: null,
  };

  return {
    event: next,
    transition: {
      from: input.event.status,
      to: "delayed",
      at,
      actor: input.actor,
      note: "Lab delay — do not infer clinical values",
    },
    fabricated: false,
    ...LAB_SIM_HONESTY,
  };
}
