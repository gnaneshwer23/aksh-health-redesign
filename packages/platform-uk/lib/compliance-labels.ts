/** Healthcare compliance copy. Pathways only — never certification claims. */

export const COMPLIANCE_BADGES = [
  { id: "gdpr", label: "Privacy by design", detail: "Health data handled as special-category data: consent, purpose limitation and minimisation mapped to the data-protection law where you operate." },
  { id: "dspt", label: "Healthcare data security pathway", detail: "Control mapping for organisational assurance planning — not a completed toolkit submission or certification." },
  { id: "uk-residency", label: "Regional data residency", detail: "Data hosted in the region your organisation chooses, with minimisation and subject-rights workflows." },
  { id: "fhir", label: "FHIR R4 staging", detail: "Clinical resources staged as draft until human review completes — not live EHR sync." },
  { id: "clinical-safety", label: "Clinical safety governance", detail: "Hazard-aware workflow with human-in-the-loop gates. Not a signed clinical safety case or regulatory approval." },
  { id: "iso27001", label: "ISO 27001 pathway", detail: "Information security control mapping for enterprise readiness planning — not certification." }
] as const;

export const COMPLIANCE_DISCLAIMER =
  "Compliance badges describe aligned design pathways and control mapping. They do not represent certification, accreditation, or regulatory approval.";

export const PROOF_MODE_BANNER = {
  title: "Proof mode: clinical identity provider placeholder",
  body: "Enterprise clinical identity sign-on is not connected in this build. Role selection routes you to synthetic dashboards without live federation."
};

export const ROLE_LABELS = {
  clinician: "Clinician",
  nurse: "Nurse",
  pharmacist: "Pharmacist",
  admin: "Practice Admin",
  regional: "Regional Lead"
} as const;

export const DASHBOARD_LABELS = {
  clinician: "Clinician Dashboard",
  nurse: "Nurse Dashboard",
  pharmacist: "Pharmacist Dashboard",
  admin: "Practice Admin Dashboard",
  regional: "Regional Dashboard"
} as const;

export const SEO_DEFAULTS = {
  title: "Aksh Health | Diabetes reviews, better coordinated",
  description:
    "Aksh helps diabetes care teams fill cancelled appointments from the waiting list and see whose glucose needs attention first. Staff decide every step; results are measured against your own baseline."
};
