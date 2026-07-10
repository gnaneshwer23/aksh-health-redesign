import assert from "node:assert/strict";

import { buildExportResources, buildValidationIssues } from "../lib/export-mapping";
import type { FhirBundleDraft } from "../lib/types";

function makeDraft(overrides: Partial<FhirBundleDraft> = {}): FhirBundleDraft {
  const base: FhirBundleDraft = {
    encounter: {
      resourceType: "Encounter",
      id: "encounter-test",
      className: "primary-care",
      reason: "Hypertension follow-up",
      clinicianSummary: "Blood pressure follow-up reviewed for synthetic export mapping."
    },
    condition: {
      resourceType: "Condition",
      id: "condition-test",
      codeText: "Hypertension",
      clinicalStatus: "active",
      evidence: "Blood pressure 132/82 documented in source intake."
    },
    medicationRequest: {
      resourceType: "MedicationRequest",
      id: "medreq-test",
      medicationText: "Amlodipine",
      dosageInstruction: "5mg once daily",
      reason: "Medication review",
      confidence: 0.88
    },
    observations: [
      {
        resourceType: "Observation",
        id: "obs-bp",
        codeText: "Blood pressure",
        valueText: "132/82",
        status: "final"
      }
    ]
  };

  return {
    ...base,
    ...overrides,
    encounter: { ...base.encounter, ...overrides.encounter },
    condition: { ...base.condition, ...overrides.condition },
    medicationRequest:
      overrides.medicationRequest === undefined
        ? base.medicationRequest
        : overrides.medicationRequest
          ? { ...base.medicationRequest, ...overrides.medicationRequest }
          : undefined,
    observations: overrides.observations ?? base.observations
  };
}

function run() {
  const validDraft = makeDraft();
  const validIssues = buildValidationIssues(validDraft);
  const validBundle = buildExportResources(validDraft, {
    caseId: "case-export-test",
    timestamp: "2026-04-28 09:00",
    validationIssues: validIssues
  });
  const encounter = validBundle.entry.find((entry) => entry.resource.resourceType === "Encounter");
  const condition = validBundle.entry.find((entry) => entry.resource.resourceType === "Condition");
  const medication = validBundle.entry.find((entry) => entry.resource.resourceType === "MedicationRequest");
  const observation = validBundle.entry.find((entry) => entry.resource.resourceType === "Observation");

  assert.equal(validIssues.length, 0, "Complete drafts should produce no validation issues");
  assert.equal(validBundle.identifier.value, "aksh-uk-eu-synthetic-case-export-test");
  assert.equal(validBundle.syntheticOnly, true);
  assert.equal(validBundle.integrationMode, "synthetic_evidence");
  assert.equal(validBundle.summary.validationStatus, "valid");
  assert.equal((condition?.resource as { encounter?: { reference?: string } }).encounter?.reference, `Encounter/${encounter?.resource.id}`);
  assert.equal((observation?.resource as { encounter?: { reference?: string } }).encounter?.reference, `Encounter/${encounter?.resource.id}`);
  assert.equal((medication?.resource as { reasonReference?: Array<{ reference?: string }> }).reasonReference?.[0]?.reference, `Condition/${condition?.resource.id}`);
  assert.ok(validBundle.meta.tag.some((tag) => tag.code === "synthetic-only"));
  assert.ok(validBundle.summary.resourceValidation.every((item) => item.status === "valid"));

  const warningDraft = makeDraft({
    medicationRequest: {
      resourceType: "MedicationRequest",
      id: "medreq-test",
      medicationText: "Amlodipine",
      dosageInstruction: "",
      reason: "Medication review",
      confidence: 0.88
    }
  });
  const warningBundle = buildExportResources(warningDraft, {
    caseId: "case-export-warning",
    timestamp: "2026-04-28 09:05"
  });

  assert.equal(warningBundle.summary.validationStatus, "warnings_present");
  assert.equal(warningBundle.summary.warningIssueCount, 1);
  assert.ok(
    warningBundle.exportQualityIssues.some(
      (issue) => issue.label === "Medication dosage missing" && issue.resourceReference === "MedicationRequest/medreq-test"
    ),
    "Medication dosage warnings should map to the MedicationRequest resource"
  );

  const blockedDraft = makeDraft({
    observations: [
      {
        resourceType: "Observation",
        id: "obs-bp",
        codeText: "Blood pressure",
        valueText: "",
        status: "preliminary"
      }
    ]
  });
  const blockedBundle = buildExportResources(blockedDraft, {
    caseId: "case-export-blocked",
    timestamp: "2026-04-28 09:10"
  });

  assert.equal(blockedBundle.summary.validationStatus, "blocking_issues");
  assert.equal(blockedBundle.summary.blockingIssueCount, 1);
  assert.ok(
    blockedBundle.summary.resourceValidation.some(
      (item) => item.resourceReference === "Observation/obs-bp" && item.status === "blocking_issues"
    ),
    "Blocking observation issues should appear in per-resource validation"
  );
  assert.equal(
    blockedBundle.summary.integrationReadinessLabel,
    "Blocked from integration rehearsal until required fields are resolved"
  );
}

run();
console.log("Export mapping checks passed.");
