import type { FhirBundleDraft, FhirExportBundle, ValidationIssue } from "./types";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function buildValidationIssues(draft: FhirBundleDraft): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!normalize(draft.encounter.reason)) {
    issues.push({
      id: `${draft.encounter.id}-reason`,
      label: "Encounter reason missing",
      severity: "high",
      detail: "Encounter.reasonCode.text is empty and needs a clinician-reviewed value.",
      category: "blocking",
      fieldPath: "Encounter.reasonCode.text"
    });
  }

  if (!normalize(draft.encounter.clinicianSummary)) {
    issues.push({
      id: `${draft.encounter.id}-summary`,
      label: "Clinician summary missing",
      severity: "medium",
      detail: "Encounter.note.text is empty, which weakens the clinical context for review and export.",
      category: "warning",
      fieldPath: "Encounter.note.text"
    });
  }

  if (!normalize(draft.condition.codeText)) {
    issues.push({
      id: `${draft.condition.id}-condition`,
      label: "Condition code missing",
      severity: "high",
      detail: "Condition.code.text is empty and blocks a complete reviewed artifact.",
      category: "blocking",
      fieldPath: "Condition.code.text"
    });
  }

  if (draft.medicationRequest && !normalize(draft.medicationRequest.medicationText)) {
    issues.push({
      id: `${draft.medicationRequest.id}-medication`,
      label: "Medication text missing",
      severity: "medium",
      detail: "MedicationRequest.medicationCodeableConcept.text is empty.",
      category: "warning",
      fieldPath: "MedicationRequest.medicationCodeableConcept.text"
    });
  }

  if (draft.medicationRequest && !normalize(draft.medicationRequest.dosageInstruction)) {
    issues.push({
      id: `${draft.medicationRequest.id}-dosage`,
      label: "Medication dosage missing",
      severity: "medium",
      detail: "MedicationRequest.dosageInstruction.text is empty and should be reviewed before external sharing.",
      category: "warning",
      fieldPath: "MedicationRequest.dosageInstruction.text"
    });
  }

  for (const observation of draft.observations) {
    if (!normalize(observation.codeText)) {
      issues.push({
        id: `${observation.id}-code`,
        label: "Observation code missing",
        severity: "medium",
        detail: `Observation ${observation.id} has no code text.`,
        category: "warning",
        fieldPath: `Observation(${observation.id}).code.text`
      });
    }

    if (normalize(observation.codeText) === "blood pressure" && !normalize(observation.valueText)) {
      issues.push({
        id: `${observation.id}-value`,
        label: "Blood pressure value missing",
        severity: "high",
        detail: "Blood pressure observation has no valueString.",
        category: "blocking",
        fieldPath: "Observation.valueString"
      });
    }

    if (normalize(observation.codeText) !== "blood pressure" && !normalize(observation.valueText)) {
      issues.push({
        id: `${observation.id}-value-warning`,
        label: `${observation.codeText || "Observation"} value missing`,
        severity: "medium",
        detail: `${observation.codeText || "Observation"} is present without a valueString, so the export is clinically weaker even if still reviewable.`,
        category: "warning",
        fieldPath: `Observation(${observation.id}).valueString`
      });
    }
  }

  return issues;
}

export function buildExportResources(
  draft: FhirBundleDraft,
  options: {
    caseId: string;
    timestamp: string;
    validationIssues?: ValidationIssue[];
  }
): FhirExportBundle {
  const encounterReference = `${draft.encounter.resourceType}/${draft.encounter.id}`;
  const conditionReference = `${draft.condition.resourceType}/${draft.condition.id}`;
  const resources: Array<Record<string, unknown>> = [
    {
      resourceType: draft.encounter.resourceType,
      id: draft.encounter.id,
      status: "finished",
      class: {
        display: draft.encounter.className
      },
      reasonCode: [
        {
          text: draft.encounter.reason
        }
      ],
      note: [
        {
          text: draft.encounter.clinicianSummary
        }
      ]
    },
    {
      resourceType: draft.condition.resourceType,
      id: draft.condition.id,
      encounter: {
        reference: encounterReference
      },
      clinicalStatus: {
        text: draft.condition.clinicalStatus
      },
      code: {
        text: draft.condition.codeText
      },
      evidence: [
        {
          detail: [
            {
              display: draft.condition.evidence
            }
          ]
        }
      ]
    },
    ...draft.observations.map((observation) => ({
      resourceType: observation.resourceType,
      id: observation.id,
      status: observation.status,
      encounter: {
        reference: encounterReference
      },
      code: {
        text: observation.codeText
      },
      valueString: observation.valueText
    }))
  ];

  if (draft.medicationRequest) {
    resources.push({
      resourceType: draft.medicationRequest.resourceType,
      id: draft.medicationRequest.id,
      status: "draft",
      encounter: {
        reference: encounterReference
      },
      reasonReference: [
        {
          reference: conditionReference
        }
      ],
      medicationCodeableConcept: {
        text: draft.medicationRequest.medicationText
      },
      dosageInstruction: [
        {
          text: draft.medicationRequest.dosageInstruction
        }
      ],
      reasonCode: [
        {
          text: draft.medicationRequest.reason
        }
      ],
      note: [
        {
          text: `Model confidence ${Math.round(draft.medicationRequest.confidence * 100)}%`
        }
      ]
    });
  }

  const validationIssues = options.validationIssues ?? buildValidationIssues(draft);
  const hasBlockingIssues = validationIssues.some((issue) => issue.category === "blocking");
  const blockingIssueCount = validationIssues.filter((issue) => issue.category === "blocking").length;
  const warningIssueCount = validationIssues.filter((issue) => issue.category === "warning").length;
  const validationStatus = hasBlockingIssues ? "blocking_issues" : validationIssues.length ? "warnings_present" : "valid";
  const resourceReferenceForIssue = (issue: ValidationIssue) => {
    const fieldPath = issue.fieldPath ?? "";
    if (fieldPath.startsWith("Encounter.")) return encounterReference;
    if (fieldPath.startsWith("Condition.")) return conditionReference;
    if (fieldPath.startsWith("MedicationRequest.")) return `${draft.medicationRequest?.resourceType ?? "MedicationRequest"}/${draft.medicationRequest?.id ?? "unknown"}`;

    const observationMatch = fieldPath.match(/^Observation\(([^)]+)\)/);
    if (observationMatch) {
      const observation = draft.observations.find((item) => item.id === observationMatch[1] || item.codeText === observationMatch[1]);
      return `${observation?.resourceType ?? "Observation"}/${observation?.id ?? observationMatch[1]}`;
    }

    if (fieldPath === "Observation.valueString") {
      const bloodPressure = draft.observations.find((item) => normalize(item.codeText) === "blood pressure");
      return `${bloodPressure?.resourceType ?? "Observation"}/${bloodPressure?.id ?? "unknown"}`;
    }

    return "Bundle/export-quality";
  };
  const qualityIssues = validationIssues.map((issue) => ({
    id: issue.id,
    label: issue.label,
    severity: issue.severity,
    category: issue.category,
    fieldPath: issue.fieldPath,
    resourceReference: resourceReferenceForIssue(issue),
    detail: issue.detail
  }));
  const resourceValidation = resources.map((resource) => {
    const resourceType = String(resource.resourceType);
    const resourceReference = `${resourceType}/${String(resource.id)}`;
    const issues = qualityIssues.filter((issue) => issue.resourceReference === resourceReference);
    const resourceBlockingCount = issues.filter((issue) => issue.category === "blocking").length;
    const resourceWarningCount = issues.filter((issue) => issue.category === "warning").length;

    return {
      resourceReference,
      resourceType,
      issueCount: issues.length,
      blockingIssueCount: resourceBlockingCount,
      warningIssueCount: resourceWarningCount,
      status: resourceBlockingCount ? ("blocking_issues" as const) : issues.length ? ("warnings_present" as const) : ("valid" as const)
    };
  });

  return {
    exportVersion: "uk-proof-v1",
    fhirVersion: "4.0.1",
    resourceType: "Bundle",
    id: `bundle-${options.caseId}`,
    type: "collection",
    timestamp: options.timestamp,
    syntheticOnly: true,
    integrationMode: "synthetic_evidence",
    exportQualityIssues: qualityIssues,
    identifier: {
      system: "https://akshhealth.app/fhir/export-bundles",
      value: `aksh-uk-eu-synthetic-${options.caseId}`
    },
    meta: {
      profile: ["https://akshhealth.app/fhir/StructureDefinition/review-output-bundle"],
      tag: [
        {
          system: "https://akshhealth.app/tags/export-version",
          code: "uk-proof-v1",
          display: "Aksh Health Proof Export v1"
        },
        {
          system: "https://akshhealth.app/tags/data-boundary",
          code: "synthetic-only",
          display: "Synthetic-only proof artifact"
        },
        {
          system: "https://akshhealth.app/tags/integration-mode",
          code: "integration-rehearsal-ready",
          display: "Prepared for integration rehearsal, not live health system integration"
        }
      ]
    },
    summary: {
      resourceCount: resources.length,
      resourceTypes: resources.map((resource) => String(resource.resourceType)),
      hasMedicationRequest: Boolean(draft.medicationRequest),
      validationStatus,
      validationIssueCount: validationIssues.length,
      blockingIssueCount,
      warningIssueCount,
      syntheticLabel: "Synthetic-only proof artifact",
      integrationReadinessLabel:
        validationStatus === "valid"
          ? "Structurally ready for integration rehearsal review"
          : validationStatus === "warnings_present"
            ? "Review warnings before integration rehearsal"
            : "Blocked from integration rehearsal until required fields are resolved",
      resourceValidation
    },
    entry: resources.map((resource) => ({
      fullUrl: `urn:uuid:${String(resource.resourceType)}-${String(resource.id)}`,
      resource
    }))
  };
}
