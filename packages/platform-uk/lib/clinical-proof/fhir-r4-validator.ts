/**
 * FHIR R4 schema validation for clinical-proof CI.
 * Zod schemas enforce required R4 fields for staged clinical resources.
 * Invalid resources fail the suite (not a full HL7 Java Validator JAR).
 */

import { z } from "zod";

export type FhirR4Issue = { path: string; message: string };

export type FhirR4ValidationResult = {
  ok: boolean;
  resourceType: string;
  fhirVersion: "4.0.1";
  issues: FhirR4Issue[];
};

const CodingSchema = z.object({
  system: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  display: z.string().min(1).optional()
});

const CodeableConceptSchema = z
  .object({
    coding: z.array(CodingSchema).optional(),
    text: z.string().min(1).optional()
  })
  .refine((v) => Boolean(v.text?.trim()) || Boolean(v.coding?.some((c) => c.code || c.display)), {
    message: "CodeableConcept requires text or coding"
  });

const ReferenceSchema = z.object({
  reference: z.string().min(1).optional(),
  display: z.string().min(1).optional()
});

const IdentifierSchema = z.object({
  system: z.string().min(1).optional(),
  value: z.string().min(1)
});

const NarrativeSchema = z.object({
  status: z.enum(["generated", "extensions", "additional", "empty"]),
  div: z.string().min(1)
});

const MetaSchema = z
  .object({
    versionId: z.string().optional(),
    lastUpdated: z.string().optional(),
    profile: z.array(z.string()).optional(),
    tag: z
      .array(
        z.object({
          system: z.string().optional(),
          code: z.string().optional(),
          display: z.string().optional()
        })
      )
      .optional()
  })
  .optional();

function resourceBase(resourceType: string) {
  return {
    resourceType: z.literal(resourceType),
    id: z.string().min(1),
    meta: MetaSchema,
    text: NarrativeSchema.optional()
  };
}

export const DocumentReferenceR4Schema = z.object({
  ...resourceBase("DocumentReference"),
  status: z.enum(["current", "superseded", "entered-in-error"]),
  type: CodeableConceptSchema.optional(),
  category: z.array(CodeableConceptSchema).optional(),
  subject: ReferenceSchema.optional(),
  date: z.string().optional(),
  content: z
    .array(
      z.object({
        attachment: z.object({
          contentType: z.string().min(1).optional(),
          data: z.string().optional(),
          url: z.string().optional(),
          title: z.string().min(1).optional()
        })
      })
    )
    .min(1)
});

export const ConditionR4Schema = z.object({
  ...resourceBase("Condition"),
  clinicalStatus: CodeableConceptSchema,
  verificationStatus: CodeableConceptSchema.optional(),
  category: z.array(CodeableConceptSchema).optional(),
  code: CodeableConceptSchema,
  subject: ReferenceSchema,
  encounter: ReferenceSchema.optional(),
  onsetDateTime: z.string().optional(),
  recordedDate: z.string().optional()
});

export const FlagR4Schema = z.object({
  ...resourceBase("Flag"),
  status: z.enum(["active", "inactive", "entered-in-error"]),
  category: z.array(CodeableConceptSchema).optional(),
  code: CodeableConceptSchema,
  subject: ReferenceSchema,
  period: z
    .object({
      start: z.string().optional(),
      end: z.string().optional()
    })
    .optional()
});

export const MedicationRequestR4Schema = z.object({
  ...resourceBase("MedicationRequest"),
  status: z.enum([
    "active",
    "on-hold",
    "cancelled",
    "completed",
    "entered-in-error",
    "stopped",
    "draft",
    "unknown"
  ]),
  intent: z.enum([
    "proposal",
    "plan",
    "order",
    "original-order",
    "reflex-order",
    "filler-order",
    "instance-order",
    "option"
  ]),
  medicationCodeableConcept: CodeableConceptSchema.optional(),
  medicationReference: ReferenceSchema.optional(),
  subject: ReferenceSchema,
  encounter: ReferenceSchema.optional(),
  authoredOn: z.string().optional(),
  dosageInstruction: z
    .array(
      z.object({
        text: z.string().min(1).optional(),
        timing: z.unknown().optional()
      })
    )
    .optional(),
  reasonCode: z.array(CodeableConceptSchema).optional(),
  note: z.array(z.object({ text: z.string().min(1) })).optional()
}).refine(
  (v) => Boolean(v.medicationCodeableConcept) || Boolean(v.medicationReference),
  { message: "MedicationRequest requires medicationCodeableConcept or medicationReference" }
);

export const RiskAssessmentR4Schema = z.object({
  ...resourceBase("RiskAssessment"),
  status: z.enum(["registered", "preliminary", "final", "amended", "corrected", "cancelled", "entered-in-error", "unknown"]),
  subject: ReferenceSchema,
  encounter: ReferenceSchema.optional(),
  occurrenceDateTime: z.string().optional(),
  prediction: z
    .array(
      z.object({
        outcome: CodeableConceptSchema.optional(),
        qualitativeRisk: CodeableConceptSchema.optional(),
        probabilityDecimal: z.number().optional(),
        rationale: z.string().optional()
      })
    )
    .optional(),
  method: CodeableConceptSchema.optional(),
  code: CodeableConceptSchema.optional()
});

export const ServiceRequestR4Schema = z.object({
  ...resourceBase("ServiceRequest"),
  status: z.enum([
    "draft",
    "active",
    "on-hold",
    "revoked",
    "completed",
    "entered-in-error",
    "unknown"
  ]),
  intent: z.enum([
    "proposal",
    "plan",
    "directive",
    "order",
    "original-order",
    "reflex-order",
    "filler-order",
    "instance-order",
    "option"
  ]),
  code: CodeableConceptSchema.optional(),
  subject: ReferenceSchema,
  encounter: ReferenceSchema.optional(),
  authoredOn: z.string().optional(),
  reasonCode: z.array(CodeableConceptSchema).optional()
});

export const ObservationR4Schema = z.object({
  ...resourceBase("Observation"),
  status: z.enum([
    "registered",
    "preliminary",
    "final",
    "amended",
    "corrected",
    "cancelled",
    "entered-in-error",
    "unknown"
  ]),
  category: z.array(CodeableConceptSchema).optional(),
  code: CodeableConceptSchema,
  subject: ReferenceSchema.optional(),
  encounter: ReferenceSchema.optional(),
  effectiveDateTime: z.string().optional(),
  valueString: z.string().optional(),
  valueQuantity: z
    .object({
      value: z.number(),
      unit: z.string().optional(),
      system: z.string().optional(),
      code: z.string().optional()
    })
    .optional(),
  component: z.array(z.unknown()).optional()
});

export const AuditEventR4Schema = z.object({
  ...resourceBase("AuditEvent"),
  type: CodingSchema.extend({
    system: z.string().min(1).optional(),
    code: z.string().min(1)
  }),
  subtype: z.array(CodingSchema).optional(),
  action: z.enum(["C", "R", "U", "D", "E"]).optional(),
  recorded: z.string().min(1),
  agent: z
    .array(
      z.object({
        who: ReferenceSchema.optional(),
        requestor: z.boolean().optional(),
        type: CodeableConceptSchema.optional(),
        name: z.string().optional()
      })
    )
    .min(1),
  source: z.object({
    observer: ReferenceSchema,
    site: z.string().optional(),
    type: z.array(CodingSchema).optional()
  }),
  entity: z
    .array(
      z.object({
        what: ReferenceSchema.optional(),
        type: CodingSchema.optional(),
        name: z.string().optional()
      })
    )
    .optional()
});

export const EncounterR4Schema = z.object({
  ...resourceBase("Encounter"),
  status: z.enum([
    "planned",
    "arrived",
    "triaged",
    "in-progress",
    "onleave",
    "finished",
    "cancelled",
    "entered-in-error",
    "unknown"
  ]),
  class: CodingSchema.extend({
    code: z.string().min(1).optional(),
    display: z.string().min(1).optional()
  }).refine((v) => Boolean(v.code || v.display || v.system), {
    message: "Encounter.class requires system, code, or display"
  }),
  type: z.array(CodeableConceptSchema).optional(),
  subject: ReferenceSchema.optional(),
  reasonCode: z.array(CodeableConceptSchema).optional(),
  period: z
    .object({
      start: z.string().optional(),
      end: z.string().optional()
    })
    .optional()
});

export const CLINICAL_PROOF_FHIR_R4_TYPES = [
  "DocumentReference",
  "Condition",
  "Flag",
  "MedicationRequest",
  "RiskAssessment",
  "ServiceRequest",
  "Observation",
  "AuditEvent",
  "Encounter"
] as const;

export type ClinicalProofFhirR4Type = (typeof CLINICAL_PROOF_FHIR_R4_TYPES)[number];

const SCHEMA_BY_TYPE: Record<ClinicalProofFhirR4Type, z.ZodType> = {
  DocumentReference: DocumentReferenceR4Schema,
  Condition: ConditionR4Schema,
  Flag: FlagR4Schema,
  MedicationRequest: MedicationRequestR4Schema,
  RiskAssessment: RiskAssessmentR4Schema,
  ServiceRequest: ServiceRequestR4Schema,
  Observation: ObservationR4Schema,
  AuditEvent: AuditEventR4Schema,
  Encounter: EncounterR4Schema
};

function zodIssuesToFhir(issues: z.core.$ZodIssue[]): FhirR4Issue[] {
  return issues.map((issue) => ({
    path: issue.path.length ? issue.path.map(String).join(".") : "$",
    message: issue.message
  }));
}

/** Validate a single FHIR R4 resource against clinical-proof schemas. */
export function validateFhirR4Resource(input: unknown): FhirR4ValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      ok: false,
      resourceType: "unknown",
      fhirVersion: "4.0.1",
      issues: [{ path: "$", message: "Resource must be a JSON object" }]
    };
  }

  const resourceType =
    "resourceType" in input && typeof (input as { resourceType?: unknown }).resourceType === "string"
      ? String((input as { resourceType: string }).resourceType)
      : "unknown";

  if (!(resourceType in SCHEMA_BY_TYPE)) {
    return {
      ok: false,
      resourceType,
      fhirVersion: "4.0.1",
      issues: [
        {
          path: "resourceType",
          message: `Unsupported resourceType for clinical-proof FHIR R4 gate: ${resourceType}`
        }
      ]
    };
  }

  const schema = SCHEMA_BY_TYPE[resourceType as ClinicalProofFhirR4Type];
  const parsed = schema.safeParse(input);
  if (parsed.success) {
    return { ok: true, resourceType, fhirVersion: "4.0.1", issues: [] };
  }

  return {
    ok: false,
    resourceType,
    fhirVersion: "4.0.1",
    issues: zodIssuesToFhir(parsed.error.issues)
  };
}

/** Validate every entry.resource in a Bundle (or a bare resource array). */
export function validateFhirR4Bundle(bundle: unknown): {
  ok: boolean;
  results: FhirR4ValidationResult[];
} {
  if (!bundle || typeof bundle !== "object" || Array.isArray(bundle)) {
    return {
      ok: false,
      results: [
        {
          ok: false,
          resourceType: "Bundle",
          fhirVersion: "4.0.1",
          issues: [{ path: "$", message: "Bundle must be an object" }]
        }
      ]
    };
  }

  const record = bundle as Record<string, unknown>;
  if (record.resourceType !== "Bundle") {
    return {
      ok: false,
      results: [
        {
          ok: false,
          resourceType: String(record.resourceType ?? "unknown"),
          fhirVersion: "4.0.1",
          issues: [{ path: "resourceType", message: "Expected Bundle" }]
        }
      ]
    };
  }

  const entries = Array.isArray(record.entry) ? record.entry : [];
  if (entries.length === 0) {
    return {
      ok: false,
      results: [
        {
          ok: false,
          resourceType: "Bundle",
          fhirVersion: "4.0.1",
          issues: [{ path: "entry", message: "Bundle.entry must be a non-empty array" }]
        }
      ]
    };
  }

  const results = entries.map((entry, index) => {
    if (!entry || typeof entry !== "object" || !("resource" in entry)) {
      return {
        ok: false,
        resourceType: "unknown",
        fhirVersion: "4.0.1" as const,
        issues: [{ path: `entry[${index}].resource`, message: "Missing resource" }]
      };
    }
    return validateFhirR4Resource((entry as { resource: unknown }).resource);
  });

  return { ok: results.every((r) => r.ok), results };
}

/** Assert helper — throws so CI fails loudly. */
export function assertFhirR4Valid(input: unknown, label = "resource") {
  const result = Array.isArray(input)
    ? {
        ok: input.every((item) => validateFhirR4Resource(item).ok),
        results: input.map((item) => validateFhirR4Resource(item))
      }
    : input &&
        typeof input === "object" &&
        (input as { resourceType?: string }).resourceType === "Bundle"
      ? validateFhirR4Bundle(input)
      : (() => {
          const single = validateFhirR4Resource(input);
          return { ok: single.ok, results: [single] };
        })();

  if (!result.ok) {
    const detail = result.results
      .filter((r) => !r.ok)
      .map((r) => `${r.resourceType}: ${r.issues.map((i) => `${i.path} ${i.message}`).join("; ")}`)
      .join(" | ");
    throw new Error(`FHIR R4 validation failed for ${label}: ${detail}`);
  }
  return result;
}

export { IdentifierSchema, CodeableConceptSchema, ReferenceSchema };
