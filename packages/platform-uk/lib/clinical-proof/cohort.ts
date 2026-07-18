/**
 * Synthetic clinical-proof cohort helpers.
 * Source of truth for patient fixtures: lib/mock-data/patients.ts
 */

import { patients } from "../mock-data/patients";
import type { ClinicalProfileId } from "../mock-data/types";

export const REQUIRED_CLINICAL_PROFILES: ClinicalProfileId[] = [
  "healthy",
  "t2d",
  "hypertension",
  "heart_failure",
  "copd",
  "polypharmacy",
  "drug_allergy",
  "pregnancy",
  "paediatric",
  "frailty",
  "renal_impairment",
  "liver_impairment",
  "mental_health_crisis",
  "oncology",
  "dvt_risk",
  "missing_clinical_info",
  "duplicate_identity",
  "conflicting_records",
  "high_risk_deterioration"
];

export const CLINICAL_PROOF_MIN_PATIENTS = 25;

export function getClinicalProofCohortSummary() {
  const covered = new Set<ClinicalProfileId>();
  for (const patient of patients) {
    for (const profile of patient.clinicalProfiles ?? []) {
      covered.add(profile);
    }
  }

  const missingProfiles = REQUIRED_CLINICAL_PROFILES.filter((id) => !covered.has(id));
  const duplicateNhs = findDuplicateNhsNumbers();

  return {
    artifactType: "aksh-uk-clinical-proof-cohort" as const,
    syntheticOnly: true as const,
    realPatientData: false,
    totalPatients: patients.length,
    minRequired: CLINICAL_PROOF_MIN_PATIENTS,
    meetsSizeGate: patients.length >= CLINICAL_PROOF_MIN_PATIENTS,
    requiredProfiles: REQUIRED_CLINICAL_PROFILES,
    coveredProfiles: [...covered].sort(),
    missingProfiles,
    meetsProfileGate: missingProfiles.length === 0,
    duplicateNhsFixtures: duplicateNhs,
    goldenPathPatientId: "P002",
    goldenPathPatientName: "Mr James Patel"
  };
}

function findDuplicateNhsNumbers() {
  const byNhs = new Map<string, string[]>();
  for (const patient of patients) {
    const key = patient.nhsNumber.replace(/\s/g, "");
    const list = byNhs.get(key) ?? [];
    list.push(patient.id);
    byNhs.set(key, list);
  }
  return [...byNhs.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([nhsNumber, patientIds]) => ({ nhsNumber, patientIds }));
}

export function assertCohortReadyForProof() {
  const summary = getClinicalProofCohortSummary();
  if (!summary.meetsSizeGate) {
    throw new Error(
      `Clinical proof cohort too small: ${summary.totalPatients} < ${summary.minRequired}`
    );
  }
  if (!summary.meetsProfileGate) {
    throw new Error(`Missing clinical profiles: ${summary.missingProfiles.join(", ")}`);
  }
  return summary;
}
