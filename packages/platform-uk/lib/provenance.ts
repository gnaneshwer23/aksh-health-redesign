/**
 * Provenance labels (Phase 1 audit P1-6): every value shown to a clinician or used by an agent says what kind of value
 * it is, so an AI draft is never mistaken for a measurement and a patient's own reading never for a checked one.
 */
export type Provenance = "observed" | "patient_reported" | "calculated" | "ai_draft" | "clinician_confirmed";

export const PROVENANCE_LABEL: Record<Provenance, string> = {
  observed: "Measured (lab or clinic)",
  patient_reported: "Patient-reported, not yet checked",
  calculated: "Calculated by Aksh",
  ai_draft: "AI draft, needs review",
  clinician_confirmed: "Confirmed by a clinician",
};

/** Provenance of a stored observation (aksh.network_observations source and verification). */
export function observationProvenance(o: { source: string; verified: boolean }): Provenance {
  if (o.source === "patient_reported" || o.source === "device") return o.verified ? "clinician_confirmed" : "patient_reported";
  return "observed";
}
