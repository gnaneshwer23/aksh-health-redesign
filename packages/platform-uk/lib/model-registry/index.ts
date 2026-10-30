export type ModelApprovalStatus = "approved_for_synthetic" | "approved" | "pending" | "revoked";

export type RegisteredModel = {
  modelId: string;
  version: string;
  intendedUse: string;
  population: string;
  inputs: string[];
  outputs: string[];
  limitations: string[];
  approval: ModelApprovalStatus;
  approver: string;
  approvedAt: string;
  nextReviewAt: string;
};

const REGISTRY: RegisteredModel[] = [
  {
    modelId: "aksh-nexus-synthetic-v1",
    version: "0.1",
    intendedUse: "Diabetes decision-support drafts on synthetic/de-identified rehearsal data",
    population: "Synthetic T2D cohort (P002 and demo patients); exclusions: live care",
    inputs: ["authorised_context_package"],
    outputs: ["findings", "evidence", "uncertainties", "escalation"],
    limitations: ["Not clinically validated", "No live EMR", "Deterministic fallback without LLM"],
    approval: "approved_for_synthetic",
    approver: "aksh-platform",
    approvedAt: "2026-10-05T00:00:00.000Z",
    nextReviewAt: "2027-01-05T00:00:00.000Z",
  },
  {
    modelId: "aksh-patient-chat-v1",
    version: "0.1",
    intendedUse: "Assisted chart Q&A — not diagnosis",
    population: "Bound demo patients and clinical_reviewer sessions",
    inputs: ["authorised_context_package", "user_message"],
    outputs: ["natural_language_draft"],
    limitations: ["Requires HITL for record changes", "liveEmis:false"],
    approval: "approved_for_synthetic",
    approver: "aksh-platform",
    approvedAt: "2026-10-05T00:00:00.000Z",
    nextReviewAt: "2027-01-05T00:00:00.000Z",
  },
  {
    modelId: "aksh-prism-synthetic-v1",
    version: "0.1",
    intendedUse: "P4 PRISM imaging-meta evaluation drafts on synthetic DICOM metadata fixtures",
    population: "Synthetic imaging meta stubs only; exclusions: live PACS / pixel archive",
    inputs: ["synthetic_imaging_meta_fixture", "authorised_context_package"],
    outputs: ["findings", "evidence", "uncertainties", "escalation"],
    limitations: [
      "Not clinically validated",
      "No live imaging deployment",
      "dicomPresent:false",
      "HITL required",
    ],
    approval: "approved_for_synthetic",
    approver: "aksh-platform",
    approvedAt: "2026-10-30T00:00:00.000Z",
    nextReviewAt: "2027-01-30T00:00:00.000Z",
  },
  {
    modelId: "aksh-atlas-synthetic-v1",
    version: "0.1",
    intendedUse: "P4 ATLAS protocol eligibility evaluation on controlled synthetic research fixtures",
    population: "Synthetic protocol/cohort aggregates; exclusions: live recruitment / patient-level export",
    inputs: ["synthetic_protocol_fixture", "synthetic_cohort_aggregate"],
    outputs: ["findings", "evidence", "uncertainties", "escalation", "matches"],
    limitations: [
      "Not clinically validated",
      "No unapproved clinical enablement",
      "patientLevelExport:false",
      "HITL required",
    ],
    approval: "approved_for_synthetic",
    approver: "aksh-platform",
    approvedAt: "2026-10-30T00:00:00.000Z",
    nextReviewAt: "2027-01-30T00:00:00.000Z",
  },
];

export function listRegisteredModels(): RegisteredModel[] {
  return REGISTRY.map((m) => ({ ...m }));
}

/** Best-effort durable snapshot; in-memory registry remains the synthetic source of truth. */
export async function persistModelRegistrySnapshot(): Promise<"ok" | "skipped" | "failed"> {
  try {
    const { isPostgresConfigured, getPgPool } = await import("../db/client");
    const { MODEL_REGISTRY_SQL } = await import("../db/schema-sql");
    if (!isPostgresConfigured()) return "skipped";
    const pool = getPgPool();
    await pool.query(MODEL_REGISTRY_SQL);
    for (const row of REGISTRY) {
      await pool.query(
        `INSERT INTO aksh.model_registry
          (model_id, version, intended_use, population, inputs, outputs, limitations, approval, approver, approved_at, next_review_at)
         VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8,$9,$10,$11)
         ON CONFLICT (model_id) DO UPDATE SET
           version = EXCLUDED.version,
           intended_use = EXCLUDED.intended_use,
           population = EXCLUDED.population,
           inputs = EXCLUDED.inputs,
           outputs = EXCLUDED.outputs,
           limitations = EXCLUDED.limitations,
           approval = EXCLUDED.approval,
           approver = EXCLUDED.approver,
           approved_at = EXCLUDED.approved_at,
           next_review_at = EXCLUDED.next_review_at,
           updated_at = NOW()`,
        [
          row.modelId,
          row.version,
          row.intendedUse,
          row.population,
          JSON.stringify(row.inputs),
          JSON.stringify(row.outputs),
          JSON.stringify(row.limitations),
          row.approval,
          row.approver,
          row.approvedAt,
          row.nextReviewAt,
        ]
      );
    }
    return "ok";
  } catch {
    return "failed";
  }
}

export function getRegisteredModel(modelId: string): RegisteredModel | null {
  return REGISTRY.find((m) => m.modelId === modelId) ?? null;
}

export function isModelApprovedForUse(modelId: string, environment: "synthetic" | "production"): boolean {
  const row = getRegisteredModel(modelId);
  if (!row || row.approval === "revoked" || row.approval === "pending") return false;
  if (environment === "synthetic") return row.approval === "approved_for_synthetic" || row.approval === "approved";
  return row.approval === "approved";
}
