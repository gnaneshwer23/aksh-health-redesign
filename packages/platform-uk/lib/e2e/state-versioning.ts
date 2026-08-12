/**
 * E2E Patient State versioning helpers (Stage 10).
 * Append-only with optional source-reference idempotency for duplicate lab ingest.
 */

import {
  listPatientStateFacts,
  recordPatientStateFact,
} from "../patient-state/repository";
import type { PatientStateFact, PatientStateFactInput } from "../patient-state/types";
import { buildPatientStateSnapshot } from "../patient-state/projection";

export type IdempotentRecordResult = {
  fact: PatientStateFact;
  source: "postgres" | "file";
  deduplicated: boolean;
  priorFactId: string | null;
};

/**
 * Record a fact, but if a current fact already exists with the same
 * (patientId, factType, source.reference), return it unchanged — no second row,
 * no supersession churn, no duplicate escalation (AKSH-E2E-0018).
 */
export async function recordPatientStateFactIdempotent(
  input: PatientStateFactInput & { source: { system: string; reference: string } },
  options?: { scopeKey?: string }
): Promise<IdempotentRecordResult> {
  const reference = input.source.reference.trim();
  const { facts, source: listSource } = await listPatientStateFacts(input.patientId, options);

  const existingCurrent = facts.find(
    (f) =>
      f.factType === input.factType &&
      f.supersededBy === null &&
      f.source.reference === reference
  );

  if (existingCurrent) {
    return {
      fact: existingCurrent,
      source: listSource,
      deduplicated: true,
      priorFactId: existingCurrent.id,
    };
  }

  const recorded = await recordPatientStateFact(input, options);
  const prior = facts.find(
    (f) => f.factType === input.factType && f.supersededBy === null
  );

  return {
    fact: recorded.fact,
    source: recorded.source,
    deduplicated: false,
    priorFactId: prior?.id ?? null,
  };
}

export function describeStateVersionDelta(
  patientId: string,
  beforeFacts: PatientStateFact[],
  afterFacts: PatientStateFact[]
) {
  const beforeSnap = buildPatientStateSnapshot(patientId, beforeFacts);
  const afterSnap = buildPatientStateSnapshot(patientId, afterFacts);
  const supersededCount = afterFacts.filter((f) => f.supersededBy !== null).length;
  const currentCount = Object.keys(afterSnap.current).length;

  return {
    beforeFactCount: beforeSnap.factCount,
    afterFactCount: afterSnap.factCount,
    supersededCount,
    currentCount,
    historyPreserved: afterSnap.factCount >= beforeSnap.factCount,
    current: afterSnap.current,
  };
}
