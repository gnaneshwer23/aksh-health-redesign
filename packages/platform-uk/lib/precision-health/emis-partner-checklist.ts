/**
 * EMIS / SystmOne Partner write-back readiness checklist (Phase 2 + Phase F).
 * Staging only — liveEmis always false until signed partner decision.
 */

import { EMIS_NOT_LIVE_BANNER } from "@/lib/emis-staging";

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
  notLiveBanner: string;
  approvalTokenPath: string;
  stagingApi: string;
  partnerChecklistDoc: string;
  phaseFDoc: string;
  partnerReadinessApi: string;
  items: EmisPartnerChecklistItem[];
  /** What partner must provide before engineering can consider flipping liveEmis */
  liveEmisFlipRequirements: EmisPartnerChecklistItem[];
  requiredEnv: string[];
  note: string;
};

export function getEmisPartnerChecklist(): EmisPartnerChecklist {
  const credentialsPresent = Boolean(
    process.env.EMIS_PARTNER_CLIENT_ID?.trim() &&
      process.env.EMIS_PARTNER_CLIENT_SECRET?.trim() &&
      process.env.EMIS_PARTNER_TOKEN_URL?.trim()
  );

  const liveEmisFlipRequirements: EmisPartnerChecklistItem[] = [
    {
      id: "flip-credentials",
      label: "Partner API credentials (EMIS and/or SystmOne track)",
      status: credentialsPresent ? "needs_cso" : "needs_partner",
      note: "EMIS_PARTNER_* env in secure store — never commit secrets."
    },
    {
      id: "flip-fhir-scope",
      label: "Agreed FHIR R4 Accept-only write scope",
      status: "needs_partner",
      note: "Out-of-band scope document with partner + CSO."
    },
    {
      id: "flip-dpia",
      label: "Signed DPIA + DPA covering EMR write-back",
      status: "needs_partner",
      note: "Track via /api/clinical-spine/partner-gates — not inventable in code."
    },
    {
      id: "flip-uat",
      label: "Partner UAT of HITL → staging → Partner path",
      status: "needs_partner",
      note: "Rehearse against sandbox; keep sim path until go decision."
    },
    {
      id: "flip-go-nogo",
      label: "Signed write-back go / no-go",
      status: "blocked",
      note: "CSO + release authority. Until then liveEmis stays false in code."
    },
    {
      id: "flip-rollback",
      label: "Documented disable / rollback path",
      status: "needs_partner",
      note: "Flag off + queue drain procedure rehearsed with partner."
    }
  ];

  return {
    artifactType: "aksh-emis-partner-checklist",
    liveEmis: false,
    liveWriteBack: false,
    notLiveBanner: EMIS_NOT_LIVE_BANNER,
    approvalTokenPath: "POST /api/integrations/ehr-writeback-sim (issue/write) — sim only",
    stagingApi: "GET/POST /api/integrations/emis-staging",
    partnerChecklistDoc: "docs/PHASE2_PARTNER_CHECKLIST.md",
    phaseFDoc: "docs/CLINICAL_SPINE_PHASE_F.md",
    partnerReadinessApi: "GET /api/clinical-spine/partner-readiness",
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
        label: "EMIS / SystmOne Partner API credentials",
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
    liveEmisFlipRequirements,
    note: "Partner EMR write-back readiness scaffold (EMIS + SystmOne track). Never claims live EMIS write-back."
  };
}
