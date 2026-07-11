/** Neutral compliance copy. No country-specific regulatory naming in user-facing strings. */

export const COMPLIANCE_BADGES = [
  { id: "gdpr", label: "GDPR-aligned design", detail: "European data protection pathway with consent and purpose limitation mapping." },
  { id: "hipaa", label: "HIPAA-ready design", detail: "Administrative, technical, and audit controls mapped for US healthcare privacy pathways." },
  { id: "abdm", label: "ABDM-aligned", detail: "National health ID and FHIR exchange patterns for digital health ecosystem integration." },
  { id: "european", label: "European data protection", detail: "Regional residency, minimisation, and subject-rights workflow scaffolding." },
  { id: "fhir", label: "FHIR R4", detail: "Clinical resources staged as draft until human review completes." },
  { id: "clinical-safety", label: "Clinical safety governance", detail: "Hazard-aware workflow with human-in-the-loop gates. Not a signed safety case." },
  { id: "iso27001", label: "ISO 27001 pathway", detail: "Information security control mapping for enterprise readiness planning." }
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
  title: "Aksh Health | Clinical AI with human review",
  description:
    "Clinical AI workflow platform with FHIR R4 staging, human-in-the-loop review, and multi-framework compliance design pathways for primary care."
};
