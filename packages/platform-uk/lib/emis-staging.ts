/**
 * EMIS / SystmOne partner-track scaffolding.
 * This is intentionally non-functional for live write-back.
 * HITL-approved FHIR bundles can be queued for a future Partner API.
 * Phase F + N5: explicit not-live banner + sandbox flag path — never claims live EMIS.
 */

import {
  getEmisPartnerSandboxStatus,
  isEmisPartnerSandboxCredentialsConfigured,
  type EmisPartnerSandboxStatus
} from "./emis-partner-sandbox";

export type EmisStagingEnvelope = {
  id: string;
  queuedAt: string;
  practiceOds?: string;
  caseId?: string;
  approvedBy: string;
  bundleSummary: string;
  status:
    | "queued_internal"
    | "blocked_needs_partner"
    | "sandbox_flag_on_creds_present_write_deferred";
  ehrWriteAttempted: false;
  liveEmis: false;
  note: string;
};

const memoryQueue: EmisStagingEnvelope[] = [];

export const EMIS_NOT_LIVE_BANNER =
  "NOT LIVE EMIS — internal staging / sim only. No Partner network call. liveEmis:false until credentials + DPIA + CSO go/no-go are signed out-of-band.";

/** @deprecated Prefer isEmisPartnerSandboxCredentialsConfigured — kept for checklist callers. */
export function isEmisPartnerConfigured() {
  return isEmisPartnerSandboxCredentialsConfigured();
}

export function getEmisIntegrationStatus() {
  const sandbox: EmisPartnerSandboxStatus = getEmisPartnerSandboxStatus();
  const configured = sandbox.credentialsConfigured;

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
    partnerSandboxPath: "/api/integrations/emis-partner-sandbox",
    partnerReadinessPath: "/api/clinical-spine/partner-readiness",
    partnerChecklistDoc: "docs/PHASE2_PARTNER_CHECKLIST.md",
    phaseFDoc: "docs/CLINICAL_SPINE_PHASE_F.md",
    queueDepth: memoryQueue.length,
    status: configured
      ? sandbox.sandboxFlagEnabled
        ? "sandbox_ready_live_writeback_disabled"
        : "credentials_present_sandbox_flag_off"
      : "scaffold_only",
    path:
      sandbox.writePath === "sim"
        ? "HITL Accept → emis-staging queue → ehr-writeback-sim (never live Partner API)"
        : sandbox.writePath === "blocked_needs_partner"
          ? "Sandbox flag on · needs_partner — set EMIS_PARTNER_* then re-probe"
          : "HITL Accept → Partner sandbox only (liveEmis:false until N7)",
    sandbox: {
      mode: sandbox.mode,
      writePath: sandbox.writePath,
      sandboxFlagEnabled: sandbox.sandboxFlagEnabled,
      credentialsConfigured: sandbox.credentialsConfigured,
      missingEnv: sandbox.missingEnv,
      canFlipLiveEmisFromEnv: false as const
    },
    requiredEnv: [...sandbox.requiredEnv, "ENABLE_EMIS_PARTNER_SANDBOX"],
    note: `${sandbox.note} Aksh stages HITL-approved FHIR R4 evidence internally. Live EMIS / SystmOne write-back requires Partner onboarding + CSO sign-off. liveEmis always false.`
  };
}

/** Queue an approved bundle for future partner delivery — never calls EMIS. */
export function queueEmisFhirStaging(input: {
  approvedBy: string;
  caseId?: string;
  practiceOds?: string;
  bundleSummary: string;
}): EmisStagingEnvelope {
  const sandbox = getEmisPartnerSandboxStatus();
  let status: EmisStagingEnvelope["status"] = "queued_internal";
  if (sandbox.sandboxFlagEnabled && !sandbox.credentialsConfigured) {
    status = "blocked_needs_partner";
  } else if (sandbox.sandboxFlagEnabled && sandbox.credentialsConfigured) {
    status = "sandbox_flag_on_creds_present_write_deferred";
  }

  const entry: EmisStagingEnvelope = {
    id: `emis-stage-${crypto.randomUUID()}`,
    queuedAt: new Date().toISOString(),
    practiceOds: input.practiceOds,
    caseId: input.caseId,
    approvedBy: input.approvedBy,
    bundleSummary: input.bundleSummary,
    status,
    ehrWriteAttempted: false,
    liveEmis: false,
    note: `${EMIS_NOT_LIVE_BANNER} Scaffold queue only — no EMIS network call was made. writePath:${sandbox.writePath}.`
  };
  memoryQueue.unshift(entry);
  if (memoryQueue.length > 100) memoryQueue.length = 100;
  return entry;
}

export function listEmisStagingQueue(limit = 20) {
  return memoryQueue.slice(0, limit);
}
