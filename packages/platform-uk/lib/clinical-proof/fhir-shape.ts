/**
 * FHIR-shaped resource checks for clinical proof.
 * Not a full HL7 FHIR Validator — schema/shape gates for staged drafts only.
 */

export type FhirShapeIssue = { path: string; message: string };

export type FhirShapeResult = {
  ok: boolean;
  resourceType: string;
  issues: FhirShapeIssue[];
};

const REQUIRED_BY_TYPE: Record<string, string[]> = {
  DocumentReference: ["resourceType", "id", "status"],
  Condition: ["resourceType", "id", "codeText", "clinicalStatus"],
  Flag: ["resourceType", "id", "status", "codeText"],
  MedicationRequest: ["resourceType", "id", "medicationText"],
  RiskAssessment: ["resourceType", "id", "status"],
  ServiceRequest: ["resourceType", "id", "status", "intent"],
  Observation: ["resourceType", "id", "codeText", "status"],
  AuditEvent: ["resourceType", "id", "type", "recorded"],
  Encounter: ["resourceType", "id", "className", "reason"]
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function validateFhirShapedResource(input: unknown): FhirShapeResult {
  if (!isRecord(input)) {
    return { ok: false, resourceType: "unknown", issues: [{ path: "$", message: "Resource must be an object" }] };
  }

  const resourceType = typeof input.resourceType === "string" ? input.resourceType : "unknown";
  const required = REQUIRED_BY_TYPE[resourceType];
  const issues: FhirShapeIssue[] = [];

  if (!required) {
    issues.push({
      path: "resourceType",
      message: `Unsupported or missing resourceType for clinical-proof shape gate: ${resourceType}`
    });
    return { ok: false, resourceType, issues };
  }

  for (const field of required) {
    const value = input[field];
    if (value === undefined || value === null || value === "") {
      issues.push({ path: field, message: `${field} is required for ${resourceType}` });
    }
  }

  if (typeof input.id !== "string" || !input.id.trim()) {
    issues.push({ path: "id", message: "id must be a non-empty string" });
  }

  return { ok: issues.length === 0, resourceType, issues };
}

/** Validate the common Aksh draft bundle shape used by review cases. */
export function validateAkshDraftBundle(draft: {
  encounter?: unknown;
  condition?: unknown;
  medicationRequest?: unknown;
  observations?: unknown[];
}): { ok: boolean; results: FhirShapeResult[] } {
  const results: FhirShapeResult[] = [];
  if (draft.encounter) results.push(validateFhirShapedResource(draft.encounter));
  if (draft.condition) results.push(validateFhirShapedResource(draft.condition));
  if (draft.medicationRequest) results.push(validateFhirShapedResource(draft.medicationRequest));
  for (const observation of draft.observations ?? []) {
    results.push(validateFhirShapedResource(observation));
  }
  return { ok: results.every((r) => r.ok), results };
}

export const WORKFLOW_TO_FHIR: Record<string, string> = {
  "SOAP note": "DocumentReference",
  "Diagnosis or code": "Condition",
  "Drug alert": "Flag",
  "Medication action": "MedicationRequest",
  "Risk score": "RiskAssessment",
  Referral: "ServiceRequest",
  "Equity signal": "Observation",
  "Governance action": "AuditEvent",
  Consultation: "Encounter"
};
