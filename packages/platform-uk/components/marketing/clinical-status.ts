/**
 * One status vocabulary for every chip, queue row and demo on the site.
 * Same word, same colour, everywhere. Add a state here before using it anywhere else.
 */
export type ClinicalStatus = "needs-review" | "held" | "unverified" | "approved";

export const CLINICAL_STATUS: Record<ClinicalStatus, { label: string; description: string }> = {
  "needs-review": { label: "needs review", description: "Raised by Aksh, waiting for a clinician" },
  held: { label: "held", description: "Blocked by a safety check until a clinician decides" },
  unverified: { label: "unverified", description: "Patient-reported; can raise a concern, never closes one" },
  approved: { label: "approved", description: "Decided by a named clinician and audited" },
};
