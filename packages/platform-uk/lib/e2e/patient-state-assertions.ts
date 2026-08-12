/**
 * Patient State assertions for E2E synthetic cohort (Stage 5).
 * Validates that longitudinal facts project to cohort-consistent current state.
 */

import { buildPatientStateSnapshot } from "../patient-state/projection";
import type { PatientStateFact } from "../patient-state/types";
import type { E2ECohortId, E2EPatientProfile, E2EPatientStateFactSeed } from "./types";

export type PatientStateAssertionResult = {
  patientId: string;
  cohortId: E2ECohortId;
  ok: boolean;
  errors: string[];
};

function seedToFact(seed: E2EPatientStateFactSeed): PatientStateFact {
  return {
    id: seed.id,
    patientId: seed.patientId,
    factType: seed.factType,
    value: seed.value,
    source: { system: seed.sourceSystem, reference: seed.sourceReference },
    confidence: seed.confidence,
    consentScopeId: null,
    effectiveAt: seed.effectiveAt,
    recordedAt: seed.recordedAt,
    supersededBy: null,
  };
}

export function projectE2EFactsForPatient(
  patientId: string,
  facts: E2EPatientStateFactSeed[]
) {
  const patientFacts = facts.filter((f) => f.patientId === patientId).map(seedToFact);
  return buildPatientStateSnapshot(patientId, patientFacts);
}

function latestHba1cFromFacts(facts: E2EPatientStateFactSeed[], patientId: string): number | null {
  const hba1cFacts = facts
    .filter((f) => f.patientId === patientId && f.factType === "hba1c")
    .sort((a, b) => new Date(b.effectiveAt).getTime() - new Date(a.effectiveAt).getTime());
  const latest = hba1cFacts[0];
  const value = (latest?.value as { value?: number })?.value;
  return typeof value === "number" ? value : null;
}

function cohortFact(snapshot: ReturnType<typeof buildPatientStateSnapshot>) {
  return snapshot.current.e2e_cohort?.value as
    | { cohortId?: E2ECohortId; missingDataFlags?: string[]; riskLevel?: string }
    | undefined;
}

export function assertE2EPatientState(
  patient: E2EPatientProfile,
  facts: E2EPatientStateFactSeed[]
): PatientStateAssertionResult {
  const errors: string[] = [];
  const snapshot = projectE2EFactsForPatient(patient.id, facts);
  const cohortMeta = cohortFact(snapshot);

  if (!cohortMeta?.cohortId) {
    errors.push("missing e2e_cohort fact in current snapshot");
  } else if (cohortMeta.cohortId !== patient.cohortId) {
    errors.push(`cohort mismatch: patient ${patient.cohortId} vs fact ${cohortMeta.cohortId}`);
  }

  const hba1cPoints = patient.hba1cSeries;
  if (patient.cohortId !== "F" && hba1cPoints.length >= 2) {
    const first = hba1cPoints[0]!.value;
    const last = hba1cPoints[hba1cPoints.length - 1]!.value;
    const projected = latestHba1cFromFacts(facts, patient.id);
    if (projected !== null && Math.abs(projected - last) > 0.01) {
      errors.push(`hba1c projection ${projected} !== expected latest ${last}`);
    }

    const hba1cFactCount = facts.filter((f) => f.patientId === patient.id && f.factType === "hba1c").length;
    if (hba1cFactCount !== hba1cPoints.length) {
      errors.push(`expected ${hba1cPoints.length} hba1c facts, got ${hba1cFactCount}`);
    }

    if (patient.cohortId === "B" && !(last > first + 1)) {
      errors.push("cohort B must show worsening HbA1c series");
    }
    if (patient.cohortId === "H" && !(last < first - 1)) {
      errors.push("cohort H must show improving HbA1c series");
    }
    if (patient.cohortId === "A" && Math.abs(last - first) > 0.5) {
      errors.push("cohort A must remain stable (HbA1c delta ≤ 0.5)");
    }
    if (patient.cohortId === "C" && last < 9) {
      errors.push("cohort C must have HbA1c ≥ 9 at latest point");
    }
  }

  if (patient.cohortId === "F") {
    if (patient.hba1cSeries.length > 0) {
      errors.push("cohort F must not have HbA1c series (missing data)");
    }
    if (!patient.missingDataFlags.length) {
      errors.push("cohort F must flag missing data");
    }
    if (!cohortMeta?.missingDataFlags?.length) {
      errors.push("cohort F e2e_cohort fact must include missingDataFlags");
    }
  }

  if (patient.cohortId === "D") {
    if (!patient.cgmAvailable || !patient.cgmSummary) {
      errors.push("cohort D must have CGM summary");
    }
    const cgmFact = snapshot.current.cgm_summary;
    if (!cgmFact) {
      errors.push("cohort D must have cgm_summary in patient state");
    } else {
      const hypo = (cgmFact.value as { hypoEvents7d?: number })?.hypoEvents7d ?? 0;
      if (hypo < 3) {
        errors.push("cohort D CGM must show ≥3 hypo events / 7d");
      }
    }
  }

  if (patient.cohortId === "C" && patient.riskLevel !== "very_high" && patient.riskLevel !== "high") {
    errors.push("cohort C patients must be high or very_high risk");
  }

  const factCount = facts.filter((f) => f.patientId === patient.id).length;
  if (factCount < 5 && patient.cohortId !== "F") {
    errors.push(`expected longitudinal facts, got ${factCount}`);
  }

  return {
    patientId: patient.id,
    cohortId: patient.cohortId,
    ok: errors.length === 0,
    errors,
  };
}

export function assertAllE2EPatientStates(
  patients: E2EPatientProfile[],
  facts: E2EPatientStateFactSeed[]
) {
  const results = patients.map((p) => assertE2EPatientState(p, facts));
  const failed = results.filter((r) => !r.ok);
  return { results, failed, passCount: results.length - failed.length, total: results.length };
}
