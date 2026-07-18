/**
 * EMIS Partner write-back readiness checklist (Phase 2).
 * Staging only — liveEmis always false until signed partner decision.
 */

export type EmisPartnerChecklistItem = {
  id: string;
  label: string;
  status: "scaffold_ready" | "needs_partner" | "needs_cso" | "blocked";
  note: string;
};

export type EmisPartnerChecklist = {
  artifactType: "aksh-emis-partner-checklist";
  liveEmis: false;
  liveWriteBack: false;
  approvalTokenPath: string;
  stagingApi: string;
  partnerChecklistDoc: string;
  items: EmisPartnerChecklistItem[];
  requiredEnv: string[];
  note: string;
};

export function getEmisPartnerChecklist(): EmisPartnerChecklist {
  const credentialsPresent = Boolean(
    process.env.EMIS_PARTNER_CLIENT_ID?.trim() &&
      process.env.EMIS_PARTNER_CLIENT_SECRET?.trim() &&
      process.env.EMIS_PARTNER_TOKEN_URL?.trim()
  );

  return {
    artifactType: "aksh-emis-partner-checklist",
    liveEmis: false,
    liveWriteBack: false,
    approvalTokenPath: "POST /api/integrations/ehr-writeback-sim (issue/write) — sim only",
    stagingApi: "GET/POST /api/integrations/emis-staging",
    partnerChecklistDoc: "docs/PHASE2_PARTNER_CHECKLIST.md",
    requiredEnv: [
      "EMIS_PARTNER_CLIENT_ID",
      "EMIS_PARTNER_CLIENT_SECRET",
      "EMIS_PARTNER_TOKEN_URL",
      "EMIS_PARTNER_FHIR_BASE_URL"
    ],
    items: [
      {
        id: "hitl-accept",
        label: "HITL Accept before any staging queue entry",
        status: "scaffold_ready",
        note: "Clinical proof chain issues approval tokens for sim write only."
      },
      {
        id: "fhir-r4-shape",
        label: "FHIR R4–shaped staging bundle",
        status: "scaffold_ready",
        note: "Schema CI + EMIS staging queue accept bundle summaries."
      },
      {
        id: "partner-credentials",
        label: "EMIS Partner API credentials",
        status: credentialsPresent ? "needs_cso" : "needs_partner",
        note: credentialsPresent
          ? "Env present but write-back remains disabled until CSO + partner UAT sign-off."
          : "Partner must supply Partner API credentials — never invent live EMR."
      },
      {
        id: "dpia-dpa",
        label: "DPIA + DPA with practice / ICS",
        status: "needs_partner",
        note: "See docs/PHASE2_PARTNER_CHECKLIST.md — not satisfied by code alone."
      },
      {
        id: "writeback-decision",
        label: "Signed write-back go / no-go",
        status: "blocked",
        note: "Until signed, platform stays staging-only (liveEmis:false)."
      },
      {
        id: "zero-autonomous-write",
        label: "Zero autonomous clinical EHR write invariant",
        status: "scaffold_ready",
        note: "Covered by clinical-proof suite; must not regress."
      }
    ],
    note: "Partner EMR write-back readiness scaffold. Never claims live EMIS write-back."
  };
}
