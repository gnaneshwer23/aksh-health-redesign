export type ClinicalSafetyFilePlaceholder = {
  id: string;
  title: string;
  standard: "DCB0129-style rehearsal";
  status: "placeholder" | "draft_in_app" | "not_started";
  purpose: string;
  inAppRoute: string;
  exportRoute?: string;
  owner: string;
  nextStep: string;
};

export function getClinicalSafetyFilePlaceholders(): ClinicalSafetyFilePlaceholder[] {
  return [
    {
      id: "clinical-risk-management-plan",
      title: "Clinical risk management plan",
      standard: "DCB0129-style rehearsal",
      status: "placeholder",
      purpose: "Define intended use, clinical scope, and residual-risk ownership before any production deployment.",
      inAppRoute: "/review/governance-pack",
      exportRoute: "/api/system/database-contract",
      owner: "Unassigned clinical safety officer",
      nextStep: "Assign a named safety owner and link the signed plan outside the synthetic proof app."
    },
    {
      id: "hazard-log",
      title: "Hazard log",
      standard: "DCB0129-style rehearsal",
      status: "draft_in_app",
      purpose: "Track hazards, controls, and evidence for the own-system synthetic workflow.",
      inAppRoute: "/review/governance-pack",
      owner: "Safety rehearsal owner needed",
      nextStep: "Move hazard entries from rehearsal status to owned controls with review dates."
    },
    {
      id: "clinical-safety-case-report",
      title: "Clinical safety case report",
      standard: "DCB0129-style rehearsal",
      status: "draft_in_app",
      purpose: "Summarize safety argument, residual risks, and release conditions.",
      inAppRoute: "/review/governance-pack",
      exportRoute: "/api/system/clinical-safety-files",
      owner: "Unassigned — see docs/SAFETY_CASE_REHEARSAL.md",
      nextStep: "Appoint CSO; convert docs/SAFETY_CASE_REHEARSAL.md into a signed case outside the synthetic app."
    },
    {
      id: "durable-shield-audit",
      title: "Durable SHIELD audit trail",
      standard: "DCB0129-style rehearsal",
      status: "draft_in_app",
      purpose: "Append-only Postgres audit events with content hashes for reviewer decisions and role actions.",
      inAppRoute: "/dashboard/admin/audit",
      exportRoute: "/api/audit/shield",
      owner: "Engineering + clinical safety joint review",
      nextStep: "Verify chain integrity in pilot environments and retain exports with the hazard log."
    },
    {
      id: "emis-partner-staging",
      title: "EMIS partner staging boundary",
      standard: "DCB0129-style rehearsal",
      status: "placeholder",
      purpose: "Document that HITL-approved FHIR bundles stage internally until Partner write-back is authorised.",
      inAppRoute: "/integrations",
      exportRoute: "/api/integrations/emis-staging",
      owner: "Product + integration lead",
      nextStep: "Begin EMIS Partner / FHIR path only after CSO and DPIA approval."
    },
    {
      id: "audit-trail-integrity-report",
      title: "Audit trail integrity report",
      standard: "DCB0129-style rehearsal",
      status: "draft_in_app",
      purpose: "Verify reviewer decision evidence and frozen artifact consistency in synthetic proof stores.",
      inAppRoute: "/review/governance-pack",
      exportRoute: "/api/system/audit-integrity",
      owner: "Engineering + clinical safety joint review",
      nextStep: "Run audit integrity checks before advisor handoff and after any storage migration."
    },
    {
      id: "role-permission-matrix",
      title: "Role and action permission matrix",
      standard: "DCB0129-style rehearsal",
      status: "draft_in_app",
      purpose: "Document who may review, sign off, reset demo data, and export evidence artifacts.",
      inAppRoute: "/review/governance-pack",
      exportRoute: "/api/system/permission-matrix",
      owner: "Product + clinical safety",
      nextStep: "Map matrix entries to enforced RBAC when a database adapter is activated."
    }
  ];
}

export function buildClinicalSafetyFilesArtifact(options?: { generatedAt?: string }) {
  const placeholders = getClinicalSafetyFilePlaceholders();

  return {
    artifactType: "aksh-uk-eu-clinical-safety-file-placeholders",
    generatedAt: options?.generatedAt ?? new Date().toISOString(),
    syntheticOnly: true,
    productionClinicalSafetyCase: false,
    dcb0129SignedOff: false,
    summary: {
      totalFiles: placeholders.length,
      placeholders: placeholders.filter((item) => item.status === "placeholder").length,
      draftInApp: placeholders.filter((item) => item.status === "draft_in_app").length,
      notStarted: placeholders.filter((item) => item.status === "not_started").length
    },
    files: placeholders,
    guidance: [
      "These are in-app placeholders and rehearsal links only; they are not signed DCB0129 deliverables.",
      "Use governance pack hazards, audit integrity, and permission matrix exports as internal preparation artifacts.",
      "Do not claim production clinical safety assurance from the synthetic proof build."
    ]
  };
}
