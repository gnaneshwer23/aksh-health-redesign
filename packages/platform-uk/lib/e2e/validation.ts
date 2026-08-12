/**
 * Post-generation data quality validation (brief §62).
 */

import type { E2EGeneratedDataset, E2EPatientProfile } from "./types";

export type E2EValidationIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
  entityId?: string;
};

export function validateE2EDataset(dataset: E2EGeneratedDataset): E2EValidationIssue[] {
  const issues: E2EValidationIssue[] = [];
  const patientIds = new Set<string>();
  const userEmails = new Set<string>();

  for (const patient of dataset.patients) {
    if (patientIds.has(patient.id)) {
      issues.push({ severity: "error", code: "DUPLICATE_PATIENT_ID", message: "Duplicate patient id", entityId: patient.id });
    }
    patientIds.add(patient.id);

    if (patient.age < 0 || patient.age > 120) {
      issues.push({ severity: "error", code: "INVALID_AGE", message: "Impossible age", entityId: patient.id });
    }
    if (patient.bmi < 12 || patient.bmi > 65) {
      issues.push({ severity: "error", code: "IMPOSSIBLE_BMI", message: `BMI ${patient.bmi} out of range`, entityId: patient.id });
    }
    for (const bp of patient.bloodPressureSeries) {
      if (bp.systolic < 70 || bp.systolic > 260 || bp.diastolic < 40 || bp.diastolic > 160) {
        issues.push({ severity: "error", code: "IMPOSSIBLE_BP", message: "Blood pressure out of range", entityId: patient.id });
      }
    }
    for (const obs of [...patient.hba1cSeries, ...patient.glucoseSeries, ...patient.egfrSeries]) {
      if (obs.value < 0) {
        issues.push({ severity: "error", code: "NEGATIVE_LAB", message: "Negative lab value", entityId: patient.id });
      }
    }
    if (new Date(patient.dob) > new Date("2026-08-12")) {
      issues.push({ severity: "error", code: "FUTURE_DOB", message: "Date of birth in future", entityId: patient.id });
    }
    if (!patient.metadata.isSynthetic || patient.metadata.source !== "AKSH_E2E_TEST") {
      issues.push({ severity: "error", code: "MISSING_SYNTHETIC_META", message: "Patient missing synthetic metadata", entityId: patient.id });
    }
  }

  for (const user of dataset.users) {
    if (userEmails.has(user.email)) {
      issues.push({ severity: "error", code: "DUPLICATE_EMAIL", message: "Duplicate user email", entityId: user.email });
    }
    userEmails.add(user.email);
    if (user.role === "gp" && !user.organisationId) {
      issues.push({ severity: "warning", code: "DOCTOR_WITHOUT_ORG", message: "Doctor without organisation", entityId: user.id });
    }
  }

  for (const fact of dataset.patientStateFacts) {
    if (!patientIds.has(fact.patientId)) {
      issues.push({ severity: "error", code: "ORPHAN_FACT", message: "Fact without patient", entityId: fact.id });
    }
  }

  for (const lab of dataset.labEvents) {
    if (!patientIds.has(lab.patientId)) {
      issues.push({ severity: "error", code: "RESULT_WITHOUT_PATIENT", message: "Lab event without patient", entityId: lab.id });
    }
    const labOrg = dataset.organisations.find((o) => o.id === lab.laboratoryId);
    if (!labOrg || labOrg.kind !== "laboratory") {
      issues.push({ severity: "error", code: "RESULT_WITHOUT_LAB", message: "Lab event without laboratory org", entityId: lab.id });
    }
  }

  return issues;
}

export function assertE2EDatasetValid(dataset: E2EGeneratedDataset) {
  const issues = validateE2EDataset(dataset).filter((i) => i.severity === "error");
  if (issues.length > 0) {
    throw new Error(`E2E dataset validation failed: ${issues.map((i) => i.code).join(", ")}`);
  }
  return { ok: true, warnings: validateE2EDataset(dataset).filter((i) => i.severity === "warning").length };
}

/** Cohort-specific trajectory assertions for golden regression. */
export function assertCohortTrajectory(patient: E2EPatientProfile): boolean {
  const series = patient.hba1cSeries;
  if (series.length < 2) return patient.cohortId === "F";

  const first = series[0]!.value;
  const last = series[series.length - 1]!.value;

  switch (patient.cohortId) {
    case "A":
      return Math.abs(last - first) <= 0.5;
    case "B":
      return last > first + 1;
    case "H":
      return last < first - 1;
    case "C":
      return last >= 9;
    default:
      return true;
  }
}
