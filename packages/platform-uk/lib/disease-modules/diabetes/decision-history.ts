/**
 * D4 (docs/PHASED_BUILD_PLAN_D.md): durable diabetes Decision-output history,
 * closing the loop C6 (P1-2) left one-directional — Patient State only ever
 * fed *into* the diabetes composite before this phase; nothing the composite
 * or Decision produced flowed back *out* into Patient State.
 *
 * Mirrors ./ingest.ts's own pattern exactly, including its client-bundle-
 * safety note: this file transitively imports lib/patient-state/repository.ts
 * (fs/promises + the Postgres client, Node-only) and is deliberately NOT
 * re-exported from lib/disease-modules/diabetes/index.ts. Server-only call
 * sites (lib/clinical-spine/orchestrate.ts) must import directly from
 * "./decision-history".
 *
 * `recordDiabetesDecisionSnapshot` never throws — any failure (Postgres
 * unavailable, file-store I/O error) is caught and logged, mirroring the
 * fail-open discipline `persistShieldAuditEvent`'s own callers already rely
 * on: this write can never become a new reason a clinician doesn't get an
 * orchestration response.
 */

import { recordPatientStateFact, listPatientStateFacts } from "../../patient-state/repository";
import type { PatientStateFactSource } from "../../patient-state/types";
import type { DecisionEscalation } from "../../decision";
import type { DiabetesModuleId } from "./types";

export const DIABETES_DECISION_SNAPSHOT_FACT_TYPE = "diabetes_decision_snapshot";

export type DiabetesDecisionSnapshotValue = {
  escalation: DecisionEscalation;
  horizonContributingFactorCount: number;
  guardianSafetyFlagCount: number;
  areaFailures: DiabetesModuleId[];
  orchestratedAt: string;
};

export type RecordDiabetesDecisionSnapshotInput = {
  patientId: string;
  snapshot: DiabetesDecisionSnapshotValue;
  source?: PatientStateFactSource;
};

const DEFAULT_DECISION_SOURCE: PatientStateFactSource = { system: "clinical_spine_orchestrate" };

/**
 * Records one diabetes Decision snapshot as a Patient State fact. Fail-open:
 * on any error this logs and resolves to `null` rather than throwing, so a
 * caller that fires this without awaiting (or awaits but ignores a thrown
 * error) can never have this write turn into a clinician-facing failure.
 */
export async function recordDiabetesDecisionSnapshot(
  input: RecordDiabetesDecisionSnapshotInput,
  options?: { scopeKey?: string }
): Promise<{ fact: Awaited<ReturnType<typeof recordPatientStateFact>>["fact"]; source: "postgres" | "file" } | null> {
  try {
    return await recordPatientStateFact(
      {
        patientId: input.patientId,
        factType: DIABETES_DECISION_SNAPSHOT_FACT_TYPE,
        value: input.snapshot,
        source: input.source ?? DEFAULT_DECISION_SOURCE,
        effectiveAt: input.snapshot.orchestratedAt
      },
      options
    );
  } catch (error) {
    console.error(
      "[disease-modules/diabetes/decision-history] recordDiabetesDecisionSnapshot failed — fail-open, not surfaced to caller",
      error
    );
    return null;
  }
}

function isDiabetesDecisionSnapshotShape(value: unknown): value is DiabetesDecisionSnapshotValue {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as DiabetesDecisionSnapshotValue).escalation === "string" &&
    typeof (value as DiabetesDecisionSnapshotValue).orchestratedAt === "string"
  );
}

/**
 * Reads back the full diabetes-decision-snapshot history for a patient
 * (superseded + current facts alike — append-only, nothing dropped),
 * ordered oldest-first. Never throws: mirrors ./ingest.ts's own
 * "honest empty, not a crash" convention for an unknown patient id or an
 * empty store.
 */
export async function loadDiabetesDecisionHistory(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<DiabetesDecisionSnapshotValue[]> {
  try {
    const { facts } = await listPatientStateFacts(patientId, options);
    return facts
      .filter((fact) => fact.factType === DIABETES_DECISION_SNAPSHOT_FACT_TYPE)
      .map((fact) => fact.value)
      .filter(isDiabetesDecisionSnapshotShape)
      .sort((a, b) => new Date(a.orchestratedAt).getTime() - new Date(b.orchestratedAt).getTime());
  } catch (error) {
    console.error(
      "[disease-modules/diabetes/decision-history] loadDiabetesDecisionHistory failed — degrading to empty (fail-open)",
      error
    );
    return [];
  }
}
