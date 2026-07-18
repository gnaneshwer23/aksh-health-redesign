/**
 * Build + gate FHIR R4 resources for HITL Accept → staging.
 * Rejected drafts never call this path.
 */

import { buildClinicalProofFhirR4Fixtures } from "./fhir-r4-fixtures";
import { assertFhirR4Valid, validateFhirR4Bundle } from "./fhir-r4-validator";

export type HitlAcceptStagedBundle = {
  resourceType: "Bundle";
  id: string;
  type: "collection";
  timestamp: string;
  meta: {
    tag: Array<{ system: string; code: string; display: string }>;
  };
  entry: Array<{ fullUrl: string; resource: Record<string, unknown> }>;
  syntheticOnly: true;
  caseId: string;
  acceptedBy: string;
  decision: "accept";
};

/**
 * Materialise a FHIR R4 collection Bundle for an Accept decision.
 * Uses clinical-proof fixtures keyed by workflow resource types present in the accept.
 */
export function buildAcceptedFhirR4StagingBundle(input: {
  caseId: string;
  acceptedBy: string;
  resourceTypes?: Array<
    | "DocumentReference"
    | "Condition"
    | "Flag"
    | "MedicationRequest"
    | "RiskAssessment"
    | "ServiceRequest"
    | "Observation"
    | "AuditEvent"
    | "Encounter"
  >;
}): HitlAcceptStagedBundle {
  const fixtures = buildClinicalProofFhirR4Fixtures();
  const types = input.resourceTypes?.length
    ? input.resourceTypes
    : (["DocumentReference", "Condition", "Observation", "Encounter", "AuditEvent"] as const);

  const resources: Array<Record<string, unknown>> = types.map((type) => {
    const base = fixtures[type] as Record<string, unknown>;
    return {
      ...base,
      id: `${String(base.id)}-${input.caseId}`
    };
  });

  const timestamp = new Date().toISOString();
  const bundle: HitlAcceptStagedBundle = {
    resourceType: "Bundle",
    id: `bundle-accept-${input.caseId}`,
    type: "collection",
    timestamp,
    syntheticOnly: true,
    caseId: input.caseId,
    acceptedBy: input.acceptedBy,
    decision: "accept",
    meta: {
      tag: [
        {
          system: "https://akshhealth.app/tags/hitl-decision",
          code: "accept",
          display: "Clinician Accept"
        },
        {
          system: "https://akshhealth.app/tags/data-boundary",
          code: "synthetic-only",
          display: "Synthetic-only proof artifact"
        }
      ]
    },
    entry: resources.map((resource) => ({
      fullUrl: `urn:uuid:${String(resource.resourceType)}-${String(resource.id)}`,
      resource
    }))
  };

  assertFhirR4Valid(bundle, `accept-staging:${input.caseId}`);
  return bundle;
}

export function summariseStagedBundle(bundle: HitlAcceptStagedBundle) {
  const validation = validateFhirR4Bundle(bundle);
  return {
    caseId: bundle.caseId,
    acceptedBy: bundle.acceptedBy,
    resourceCount: bundle.entry.length,
    resourceTypes: bundle.entry.map((e) => String(e.resource.resourceType)),
    fhirR4Valid: validation.ok,
    syntheticOnly: true as const
  };
}
