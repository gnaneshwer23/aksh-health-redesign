/** Healthcare compliance copy. Pathways only — never certification claims. */

export const COMPLIANCE_BADGES = [
  { id: "gdpr", label: "UK GDPR / GDPR-aligned design", detail: "UK and European data protection pathway with consent and purpose limitation mapping." },
  { id: "dspt", label: "Healthcare data security pathway", detail: "Control mapping for organisational assurance planning (including optional UK DSPT-style controls) — not a completed toolkit submission or certification." },
  { id: "uk-residency", label: "UK/EU data residency framing", detail: "Residency, minimisation, and subject-rights workflow scaffolding for healthcare workloads." },
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
  title: "Aksh Health | Clinical Intelligence, Under Clinical Control",
  description:
    "Aksh Health helps clinical teams capture, understand, review and coordinate care with AI-assisted intelligence and named clinician oversight. Diabetes-first. Primary-care ready."
};
