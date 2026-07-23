/**
 * N5 — EMIS Partner Programme **sandbox** client (feature-flagged).
 *
 * Hard invariants:
 * - `liveEmis` is always `false` (N7 + signed go/no-go required to flip).
 * - Env presence ≠ permission to flip live write-back.
 * - Flag off → default sim path (`ehr-writeback-sim` / emis-staging queue).
 * - Flag on + missing creds → honest `needs_partner` / blocked (no invented network).
 * - Flag on + creds → sandbox-only probes/writes; never production Partner live.
 * - Writes require HITL Accept token; never autonomous.
 */

export const EMIS_PARTNER_REQUIRED_ENV = [
  "EMIS_PARTNER_CLIENT_ID",
  "EMIS_PARTNER_CLIENT_SECRET",
  "EMIS_PARTNER_TOKEN_URL",
  "EMIS_PARTNER_FHIR_BASE_URL"
] as const;

export type EmisPartnerSandboxMode =
  | "disabled"
  | "needs_partner"
  | "sandbox_ready"
  | "sandbox_probe_failed";

export type EmisPartnerWritePath = "sim" | "sandbox" | "blocked_needs_partner";

export type EmisPartnerSandboxStatus = {
  adapterId: "emis-partner-sandbox";
  sandboxFlagEnabled: boolean;
  credentialsConfigured: boolean;
  missingEnv: string[];
  mode: EmisPartnerSandboxMode;
  writePath: EmisPartnerWritePath;
  /** Always false until N7 signed go/no-go + eng flip checklist. */
  liveEmis: false;
  liveWriteBack: false;
  canFlipLiveEmisFromEnv: false;
  tokenUrlHost: string | null;
  fhirBaseHost: string | null;
  simPath: string;
  stagingPath: string;
  requiredEnv: readonly string[];
  note: string;
};

export type EmisPartnerSandboxProbeResult = {
  attempted: boolean;
  ok: boolean;
  mode: EmisPartnerSandboxMode;
  liveEmis: false;
  writePath: EmisPartnerWritePath;
  status?: number;
  error?: string;
  tokenUrlHost: string | null;
  note: string;
};

export type EmisPartnerSandboxWriteResult = {
  ok: boolean;
  attempted: boolean;
  liveEmis: false;
  ehrWriteAttempted: false;
  writePath: EmisPartnerWritePath;
  mode: EmisPartnerSandboxMode;
  reason:
    | "flag_off_sim_path"
    | "needs_partner"
    | "missing_hitl_accept"
    | "sandbox_scaffold_only"
    | "sandbox_network_deferred";
  note: string;
};

function trim(value: string | undefined): string {
  return value?.trim() ?? "";
}

function hostOf(url: string): string | null {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return url.slice(0, 64);
  }
}

export function getEmisPartnerSandboxConfig() {
  return {
    clientId: trim(process.env.EMIS_PARTNER_CLIENT_ID),
    clientSecret: trim(process.env.EMIS_PARTNER_CLIENT_SECRET),
    tokenUrl: trim(process.env.EMIS_PARTNER_TOKEN_URL),
    fhirBaseUrl: trim(process.env.EMIS_PARTNER_FHIR_BASE_URL)
  };
}

/** True when all four Partner sandbox env names are non-empty (secrets never logged). */
export function isEmisPartnerSandboxCredentialsConfigured(): boolean {
  const c = getEmisPartnerSandboxConfig();
  return Boolean(c.clientId && c.clientSecret && c.tokenUrl && c.fhirBaseUrl);
}

export function listMissingEmisPartnerEnv(): string[] {
  const c = getEmisPartnerSandboxConfig();
  const missing: string[] = [];
  if (!c.clientId) missing.push("EMIS_PARTNER_CLIENT_ID");
  if (!c.clientSecret) missing.push("EMIS_PARTNER_CLIENT_SECRET");
  if (!c.tokenUrl) missing.push("EMIS_PARTNER_TOKEN_URL");
  if (!c.fhirBaseUrl) missing.push("EMIS_PARTNER_FHIR_BASE_URL");
  return missing;
}

export function isEmisPartnerSandboxFlagEnabled(): boolean {
  return process.env.ENABLE_EMIS_PARTNER_SANDBOX === "true";
}

/**
 * Resolve honesty status. Never sets liveEmis true.
 * Flag off → sim path. Flag on without creds → needs_partner.
 */
export function getEmisPartnerSandboxStatus(): EmisPartnerSandboxStatus {
  const sandboxFlagEnabled = isEmisPartnerSandboxFlagEnabled();
  const credentialsConfigured = isEmisPartnerSandboxCredentialsConfigured();
  const missingEnv = listMissingEmisPartnerEnv();
  const { tokenUrl, fhirBaseUrl } = getEmisPartnerSandboxConfig();
  const tokenUrlHost = hostOf(tokenUrl);
  const fhirBaseHost = hostOf(fhirBaseUrl);

  if (!sandboxFlagEnabled) {
    return {
      adapterId: "emis-partner-sandbox",
      sandboxFlagEnabled: false,
      credentialsConfigured,
      missingEnv,
      mode: "disabled",
      writePath: "sim",
      liveEmis: false,
      liveWriteBack: false,
      canFlipLiveEmisFromEnv: false,
      tokenUrlHost,
      fhirBaseHost,
      simPath: "/api/integrations/ehr-writeback-sim",
      stagingPath: "/api/integrations/emis-staging",
      requiredEnv: EMIS_PARTNER_REQUIRED_ENV,
      note:
        "Partner sandbox flag off (ENABLE_EMIS_PARTNER_SANDBOX≠true). Default path: HITL Accept → emis-staging → ehr-writeback-sim. liveEmis:false. Env presence does not unlock live write-back."
    };
  }

  if (!credentialsConfigured) {
    return {
      adapterId: "emis-partner-sandbox",
      sandboxFlagEnabled: true,
      credentialsConfigured: false,
      missingEnv,
      mode: "needs_partner",
      writePath: "blocked_needs_partner",
      liveEmis: false,
      liveWriteBack: false,
      canFlipLiveEmisFromEnv: false,
      tokenUrlHost,
      fhirBaseHost,
      simPath: "/api/integrations/ehr-writeback-sim",
      stagingPath: "/api/integrations/emis-staging",
      requiredEnv: EMIS_PARTNER_REQUIRED_ENV,
      note: `Sandbox flag on but Partner credentials missing (${missingEnv.join(", ") || "unknown"}). Status: needs_partner / blocked. Keep sim path until Partner Programme issues sandbox env. liveEmis:false.`
    };
  }

  return {
    adapterId: "emis-partner-sandbox",
    sandboxFlagEnabled: true,
    credentialsConfigured: true,
    missingEnv: [],
    mode: "sandbox_ready",
    writePath: "sandbox",
    liveEmis: false,
    liveWriteBack: false,
    canFlipLiveEmisFromEnv: false,
    tokenUrlHost,
    fhirBaseHost,
    simPath: "/api/integrations/ehr-writeback-sim",
    stagingPath: "/api/integrations/emis-staging",
    requiredEnv: EMIS_PARTNER_REQUIRED_ENV,
    note:
      "Sandbox credentials present — Partner sandbox path only (not production live). liveEmis:false until N7 signed go/no-go. HITL Accept still required for any write attempt."
  };
}

/**
 * OAuth token probe against Partner sandbox token URL.
 * Never claims live EMIS. Skips network when flag off or creds missing.
 */
export async function probeEmisPartnerSandboxOAuth(
  fetchImpl: typeof fetch = fetch
): Promise<EmisPartnerSandboxProbeResult> {
  const status = getEmisPartnerSandboxStatus();

  if (!status.sandboxFlagEnabled) {
    return {
      attempted: false,
      ok: false,
      mode: "disabled",
      liveEmis: false,
      writePath: "sim",
      tokenUrlHost: status.tokenUrlHost,
      note: "Sandbox flag off — OAuth probe skipped. Use sim path. liveEmis:false."
    };
  }

  if (!status.credentialsConfigured) {
    return {
      attempted: false,
      ok: false,
      mode: "needs_partner",
      liveEmis: false,
      writePath: "blocked_needs_partner",
      tokenUrlHost: status.tokenUrlHost,
      error: `Missing env: ${status.missingEnv.join(", ")}`,
      note: "needs_partner — Partner Programme must supply sandbox credentials before OAuth probe."
    };
  }

  const { clientId, clientSecret, tokenUrl } = getEmisPartnerSandboxConfig();
  try {
    const response = await fetchImpl(tokenUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    if (!response.ok) {
      const errorText = (await response.text()).slice(0, 200);
      return {
        attempted: true,
        ok: false,
        mode: "sandbox_probe_failed",
        liveEmis: false,
        writePath: "sandbox",
        status: response.status,
        error: errorText || `HTTP ${response.status}`,
        tokenUrlHost: status.tokenUrlHost,
        note: "Sandbox OAuth probe failed — credentials or token URL may be wrong. Still not live EMIS."
      };
    }

    return {
      attempted: true,
      ok: true,
      mode: "sandbox_ready",
      liveEmis: false,
      writePath: "sandbox",
      status: response.status,
      tokenUrlHost: status.tokenUrlHost,
      note: "Sandbox OAuth token obtained — sandbox only. liveEmis:false. Does not unlock production write-back."
    };
  } catch (error) {
    return {
      attempted: true,
      ok: false,
      mode: "sandbox_probe_failed",
      liveEmis: false,
      writePath: "sandbox",
      error: error instanceof Error ? error.message : "OAuth probe network error",
      tokenUrlHost: status.tokenUrlHost,
      note: "Sandbox OAuth probe errored. liveEmis:false."
    };
  }
}

/**
 * Accept-gated sandbox write attempt.
 * Without HITL Accept → rejected.
 * Flag off → reports sim path (does not call Partner).
 * Flag on without creds → needs_partner blocked.
 * Flag on with creds → scaffold defers live network write until N6 UAT / N7;
 *   still never sets liveEmis or ehrWriteAttempted for production.
 */
export function attemptEmisPartnerSandboxWrite(input: {
  hitlAccepted: boolean;
  approvedBy?: string;
  caseId?: string;
  bundleSummary?: string;
}): EmisPartnerSandboxWriteResult {
  const status = getEmisPartnerSandboxStatus();

  if (!input.hitlAccepted) {
    return {
      ok: false,
      attempted: false,
      liveEmis: false,
      ehrWriteAttempted: false,
      writePath: status.writePath,
      mode: status.mode,
      reason: "missing_hitl_accept",
      note: "HITL Accept required before any Partner sandbox write. liveEmis:false."
    };
  }

  if (!status.sandboxFlagEnabled) {
    return {
      ok: false,
      attempted: false,
      liveEmis: false,
      ehrWriteAttempted: false,
      writePath: "sim",
      mode: "disabled",
      reason: "flag_off_sim_path",
      note: "Sandbox flag off — use ehr-writeback-sim / emis-staging. liveEmis:false."
    };
  }

  if (!status.credentialsConfigured) {
    return {
      ok: false,
      attempted: false,
      liveEmis: false,
      ehrWriteAttempted: false,
      writePath: "blocked_needs_partner",
      mode: "needs_partner",
      reason: "needs_partner",
      note: `needs_partner / blocked — missing ${status.missingEnv.join(", ")}. Partner Programme must issue sandbox credentials. liveEmis:false.`
    };
  }

  // Credentials + flag present: still no production live write. Network FHIR write is
  // deferred to N6 UAT after partner confirms scopes; this keeps ehrWriteAttempted false.
  return {
    ok: false,
    attempted: false,
    liveEmis: false,
    ehrWriteAttempted: false,
    writePath: "sandbox",
    mode: "sandbox_ready",
    reason: "sandbox_network_deferred",
    note:
      "Sandbox path selected (flag+creds) but Partner network FHIR write remains deferred until N6 UAT + N7 signed go/no-go. liveEmis:false · ehrWriteAttempted:false."
  };
}
