/**
 * Patient State foundation (C1 — docs/PHASED_BUILD_PLAN_C.md, implements
 * docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P0-1).
 *
 * Domain 1 (Patient State) per docs/AKSH_FINAL_ARCHITECTURE_SPEC.md §4/§7:
 * an append-only, versioned fact store — never a flat "latest value" cache.
 * Every write is an INSERT; a fact is never mutated or deleted, only
 * superseded by a newer fact of the same (patientId, factType) pair
 * (spec §48/§54 — no destructive overwrite of clinically relevant state).
 *
 * This is additive infrastructure only in C1: nothing in the existing
 * ReviewCase / diabetes fixture / timeline read paths is re-pointed at it
 * yet (that is explicitly out of scope for C1 — see the migration plan's
 * own "Files affected" note for P0-1).
 */

/** Free-form but namespaced fact type, e.g. "hba1c", "weight", "condition", "identity". */
export type PatientStateFactType = string;

export type PatientStateFactSource = {
  /** Where this fact came from — e.g. "mock_cohort", "fhir_ingest", "patient_check_in", "clinician_entry". */
  system: string;
  /** Optional pointer to the originating record (e.g. a ReviewCase id, a FHIR resource id). */
  reference?: string;
};

export type PatientStateFact = {
  id: string;
  patientId: string;
  factType: PatientStateFactType;
  /** Structured value — shape depends on factType; kept as unknown/JSON at this layer by design. */
  value: unknown;
  source: PatientStateFactSource;
  /** 0..1 confidence in this specific fact, distinct from any composite/derived confidence (spec §41). */
  confidence: number;
  /** Consent scope this fact was recorded under, if applicable (spec §38). Null when not consent-gated. */
  consentScopeId: string | null;
  /** When the fact became true/observed clinically (may predate recordedAt). */
  effectiveAt: string;
  /** When this row was written — append-only, immutable once set. */
  recordedAt: string;
  /** Id of the fact (same patientId+factType) that superseded this one, if any. Null while current. */
  supersededBy: string | null;
};

export type PatientStateFactInput = {
  patientId: string;
  factType: PatientStateFactType;
  value: unknown;
  source: PatientStateFactSource;
  confidence?: number;
  consentScopeId?: string | null;
  effectiveAt?: string;
};

export type PatientStateSnapshot = {
  patientId: string;
  /** Latest non-superseded fact per factType — the "current state" projection (spec §7). */
  current: Record<PatientStateFactType, PatientStateFact>;
  /** Total fact count (current + superseded) contributing to this snapshot. */
  factCount: number;
  /** ISO 8601 timestamp of when this snapshot was computed (spec §7 updatedAt principle). */
  computedAt: string;
};
