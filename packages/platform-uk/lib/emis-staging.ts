/**
 * EMIS / SystmOne partner-track scaffolding.
 * This is intentionally non-functional for live write-back.
 * HITL-approved FHIR bundles can be queued for a future Partner API.
 * Phase F: explicit not-live banner + flip checklist — never claims live EMIS.
 */

export type EmisStagingEnvelope = {
  id: string;
  queuedAt: string;
  practiceOds?: string;
  caseId?: string;
  approvedBy: string;
  bundleSummary: string;
  status: "queued_internal" | "blocked_no_partner_credentials";
  ehrWriteAttempted: false;
  liveEmis: false;
  note: string;
};

const memoryQueue: EmisStagingEnvelope[] = [];

export const EMIS_NOT_LIVE_BANNER =
  "NOT LIVE EMIS — internal staging / sim only. No Partner network call. liveEmis:false until credentials + DPIA + CSO go/no-go are signed out-of-band.";

export function isEmisPartnerConfigured() {
  return Boolean(
    process.env.EMIS_PARTNER_CLIENT_ID?.trim() &&
      process.env.EMIS_PARTNER_CLIENT_SECRET?.trim() &&
      process.env.EMIS_PARTNER_TOKEN_URL?.trim()
  );
}

export function getEmisIntegrationStatus() {
  const configured = isEmisPartnerConfigured();
  return {
    adapterId: "emis-fhir-staging",
    configured,
    enabled: false,
    liveWriteBack: false,
    liveEmis: false as const,
    ehrWriteAttempted: false as const,
    notLiveBanner: EMIS_NOT_LIVE_BANNER,
    approvalTokenSimPath: "/api/integrations/ehr-writeback-sim",
    partnerChecklistPath: "/api/integrations/emis-partner-checklist",
    partnerReadinessPath: "/api/clinical-spine/partner-readiness",
    partnerChecklistDoc: "docs/PHASE2_PARTNER_CHECKLIST.md",
    phaseFDoc: "docs/CLINICAL_SPINE_PHASE_F.md",
    queueDepth: memoryQueue.length,
    status: configured ? "credentials_present_writeback_disabled" : "scaffold_only",
    path: "HITL Accept → emis-staging queue → ehr-writeback-sim (never live Partner API)",
    requiredEnv: [
      "EMIS_PARTNER_CLIENT_ID",
      "EMIS_PARTNER_CLIENT_SECRET",
      "EMIS_PARTNER_TOKEN_URL",
      "EMIS_PARTNER_FHIR_BASE_URL"
    ],
    note: "Aksh stages HITL-approved FHIR R4 evidence internally. Live EMIS / SystmOne write-back requires Partner onboarding + CSO sign-off. liveEmis always false."
  };
}

/** Queue an approved bundle for future partner delivery — never calls EMIS. */
export function queueEmisFhirStaging(input: {
  approvedBy: string;
  caseId?: string;
  practiceOds?: string;
  bundleSummary: string;
}): EmisStagingEnvelope {
  const entry: EmisStagingEnvelope = {
    id: `emis-stage-${crypto.randomUUID()}`,
    queuedAt: new Date().toISOString(),
    practiceOds: input.practiceOds,
    caseId: input.caseId,
    approvedBy: input.approvedBy,
    bundleSummary: input.bundleSummary,
    status: isEmisPartnerConfigured() ? "blocked_no_partner_credentials" : "queued_internal",
    ehrWriteAttempted: false,
    liveEmis: false,
    note: `${EMIS_NOT_LIVE_BANNER} Scaffold queue only — no EMIS network call was made.`
  };
  memoryQueue.unshift(entry);
  if (memoryQueue.length > 100) memoryQueue.length = 100;
  return entry;
}

export function listEmisStagingQueue(limit = 20) {
  return memoryQueue.slice(0, limit);
}
