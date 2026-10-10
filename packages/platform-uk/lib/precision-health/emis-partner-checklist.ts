/**
 * EMIS / SystmOne Partner write-back readiness checklist (Phase 2 + Phase F + N5).
 * Staging / sandbox only — liveEmis always false until signed partner decision.
 */

import { EMIS_NOT_LIVE_BANNER } from "@/lib/emis-staging";
import { getEmisPartnerSandboxStatus } from "@/lib/emis-partner-sandbox";

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
  sandboxApi: string;
  partnerChecklistDoc: string;
  phaseFDoc: string;
  partnerReadinessApi: string;
  sandbox: {
    mode: string;
    writePath: string;
    sandboxFlagEnabled: boolean;
    credentialsConfigured: boolean;
    missingEnv: string[];
  };
  items: EmisPartnerChecklistItem[];
  /** What partner must provide before engineering can consider flipping liveEmis */
  liveEmisFlipRequirements: EmisPartnerChecklistItem[];
  requiredEnv: string[];
  note: string;
};

export function getEmisPartnerChecklist(): EmisPartnerChecklist {
  const sandbox = getEmisPartnerSandboxStatus();
  const credentialsPresent = sandbox.credentialsConfigured;

  const liveEmisFlipRequirements: EmisPartnerChecklistItem[] = [
    {
      id: "flip-sandbox-flag",
      label: "ENABLE_EMIS_PARTNER_SANDBOX (sandbox rehearsal only)",
      status: sandbox.sandboxFlagEnabled ? "scaffold_ready" : "needs_partner",
      note: sandbox.sandboxFlagEnabled
        ? `Flag on · mode=${sandbox.mode} — still not liveEmis.`
        : "Default off = sim path. Enable only for Partner sandbox."
    },
    {
      id: "flip-credentials",
      label: "Partner API credentials (EHR and/or EHR track)",
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
    sandboxApi: "GET/POST /api/integrations/emis-partner-sandbox",
    partnerChecklistDoc: "docs/PHASE2_PARTNER_CHECKLIST.md",
    phaseFDoc: "docs/CLINICAL_SPINE_PHASE_F.md",
    partnerReadinessApi: "GET /api/clinical-spine/partner-readiness",
    sandbox: {
      mode: sandbox.mode,
      writePath: sandbox.writePath,
      sandboxFlagEnabled: sandbox.sandboxFlagEnabled,
      credentialsConfigured: sandbox.credentialsConfigured,
      missingEnv: sandbox.missingEnv
    },
    requiredEnv: [
      "ENABLE_EMIS_PARTNER_SANDBOX",
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
        note: "Schema CI + EHR staging queue accept bundle summaries."
      },
      {
        id: "partner-sandbox",
        label: "Partner sandbox flag + client (N5)",
        status:
          sandbox.mode === "disabled"
            ? "scaffold_ready"
            : sandbox.mode === "needs_partner"
              ? "needs_partner"
              : "needs_cso",
        note: `mode=${sandbox.mode} · writePath=${sandbox.writePath}. Flag off = sim; flag on without creds = needs_partner.`
      },
      {
        id: "partner-credentials",
        label: "the EHR Partner API credentials",
        status: credentialsPresent ? "needs_cso" : "needs_partner",
        note: credentialsPresent
          ? "Env present but write-back remains disabled until CSO + partner UAT sign-off."
          : "Partner must supply Partner API credentials — never invent live EMR."
      },
      {
        id: "dpia-dpa",
        label: "DPIA + DPA with clinic / regional network",
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
    note: "Partner EMR write-back readiness scaffold (EHR track). N5 sandbox is flag-gated. Never claims live EHR write-back."
  };
}
