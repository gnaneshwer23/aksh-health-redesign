import type { PatientStateFact, PatientStateSnapshot } from "./types";

/**
 * Pure, I/O-free projection: given the full fact history for one patient,
 * derive the current-state snapshot (spec §7 principle: current, previous,
 * and change are all explicitly representable — this function computes the
 * "current" half; "previous" stays queryable via the full fact list).
 *
 * A fact is included in `current` only if:
 *   - it has not been superseded (`supersededBy === null`), and
 *   - it is the most recently recorded fact for its (patientId, factType) pair
 *     among the non-superseded facts (defensive — supersession should already
 *     guarantee at most one non-superseded fact per factType, but this
 *     function never assumes its input is already clean).
 */
export function buildPatientStateSnapshot(
  patientId: string,
  facts: PatientStateFact[],
  options?: { computedAt?: string }
): PatientStateSnapshot {
  const current: Record<string, PatientStateFact> = {};

  for (const fact of facts) {
    if (fact.patientId !== patientId) continue;
    if (fact.supersededBy !== null) continue;

    const existing = current[fact.factType];
    if (!existing || new Date(fact.recordedAt).getTime() > new Date(existing.recordedAt).getTime()) {
      current[fact.factType] = fact;
    }
  }

  return {
    patientId,
    current,
    factCount: facts.filter((fact) => fact.patientId === patientId).length,
    computedAt: options?.computedAt ?? new Date().toISOString()
  };
}
