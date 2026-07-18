/**
 * Medplum FHIR rehearsal client.
 *
 * Default: ENABLE_MEDPLUM_SYNC=false — never called from accept path.
 * When enabled: non-blocking push of frozen FHIR bundles to MEDPLUM_URL.
 * Never writes to EMIS. Never claims production FHIR store readiness.
 */

export type MedplumRehearsalStatus = {
  syncFlagEnabled: boolean;
  baseUrl: string;
  oauthTokenUrl: string;
  credentialsConfigured: boolean;
  mode: "disabled" | "rehearsal_ready" | "rehearsal_no_credentials";
  liveEmis: false;
  /** Clear when flag off — no pending sync claim. */
  dryRunEligible: boolean;
  lastDryRunAt: string | null;
  note: string;
};

/** In-memory last dry-run timestamp for status honesty (process-local). */
let lastMedplumDryRunAt: string | null = null;

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

/** Derive OAuth token endpoint from FHIR base (…/fhir/R4 → …/oauth2/token). */
export function resolveMedplumOAuthTokenUrl(fhirUrl: string): string {
  const base = trimTrailingSlash(fhirUrl || "http://localhost:8103/fhir/R4");
  const withoutFhir = base.replace(/\/fhir\/R4$/i, "");
  return `${withoutFhir || "http://localhost:8103"}/oauth2/token`;
}

export function getMedplumConfig() {
  const baseUrl = trimTrailingSlash(
    process.env.MEDPLUM_URL?.trim() || "http://localhost:8103/fhir/R4"
  );
  const clientId = process.env.MEDPLUM_CLIENT_ID?.trim() || "";
  const clientSecret = process.env.MEDPLUM_CLIENT_SECRET?.trim() || "";
  return {
    baseUrl,
    clientId,
    clientSecret,
    oauthTokenUrl: resolveMedplumOAuthTokenUrl(baseUrl)
  };
}

export function getMedplumRehearsalStatus(): MedplumRehearsalStatus {
  const syncFlagEnabled = process.env.ENABLE_MEDPLUM_SYNC === "true";
  const { baseUrl, clientId, clientSecret, oauthTokenUrl } = getMedplumConfig();
  const credentialsConfigured = Boolean(clientId && clientSecret);

  if (!syncFlagEnabled) {
    return {
      syncFlagEnabled: false,
      baseUrl,
      oauthTokenUrl,
      credentialsConfigured,
      mode: "disabled",
      liveEmis: false,
      dryRunEligible: false,
      lastDryRunAt: null,
      note: "Medplum sync disabled (ENABLE_MEDPLUM_SYNC≠true). Accept path never pushes. Dry-run cleared."
    };
  }

  return {
    syncFlagEnabled: true,
    baseUrl,
    oauthTokenUrl,
    credentialsConfigured,
    mode: credentialsConfigured ? "rehearsal_ready" : "rehearsal_no_credentials",
    liveEmis: false,
    dryRunEligible: true,
    lastDryRunAt: lastMedplumDryRunAt,
    note: credentialsConfigured
      ? "Rehearsal mode: may push frozen accepted bundles to Medplum. Not EMIS write-back."
      : "Flag on but credentials missing — push attempts may use unauthenticated local rehearsal only."
  };
}

/** FHIR-shaped staging bundle for Medplum dry-run rehearsal (synthetic). */
export function buildMedplumDryRunStagingBundle(options?: {
  patientId?: string;
  caseId?: string;
}): Record<string, unknown> {
  const patientId = options?.patientId?.trim() || "P001";
  const caseId = options?.caseId?.trim() || "medplum-dry-run";
  return {
    resourceType: "Bundle",
    type: "collection",
    id: `aksh-medplum-dry-run-${caseId}`,
    meta: {
      tag: [
        { system: "https://akshhealth.com/fhir/tag", code: "rehearsal-dry-run" },
        { system: "https://akshhealth.com/fhir/tag", code: "not-emis" }
      ]
    },
    entry: [
      {
        resource: {
          resourceType: "Patient",
          id: patientId,
          meta: { tag: [{ code: "synthetic-fixture" }] },
          active: true,
          name: [{ text: `Synthetic patient ${patientId}` }]
        }
      },
      {
        resource: {
          resourceType: "DocumentReference",
          id: `${caseId}-doc`,
          status: "current",
          description: "Aksh HITL staging rehearsal — not a live EMR write",
          subject: { reference: `Patient/${patientId}` }
        }
      }
    ]
  };
}

/**
 * Dry-run sync of a FHIR-shaped staging bundle when ENABLE_MEDPLUM_SYNC=true.
 * When disabled: refuses and clears dry-run eligibility in status.
 * Never claims EMIS write-back.
 */
export async function dryRunMedplumStagingSync(options?: {
  patientId?: string;
  caseId?: string;
}): Promise<{
  attempted: boolean;
  ok: boolean;
  liveEmis: false;
  syncFlagEnabled: boolean;
  status?: number;
  resourceId?: string;
  error?: string;
  bundleSummary: string;
}> {
  const status = getMedplumRehearsalStatus();
  const bundle = buildMedplumDryRunStagingBundle(options);
  const bundleSummary = `Bundle/${String(bundle.id)} entries=${Array.isArray(bundle.entry) ? bundle.entry.length : 0}`;

  if (!status.syncFlagEnabled) {
    lastMedplumDryRunAt = null;
    return {
      attempted: false,
      ok: false,
      liveEmis: false,
      syncFlagEnabled: false,
      error: "Medplum sync disabled — dry-run refused; status cleared",
      bundleSummary
    };
  }

  const result = await pushToMedplum(bundle);
  lastMedplumDryRunAt = new Date().toISOString();
  return {
    attempted: true,
    ok: result.ok,
    liveEmis: false,
    syncFlagEnabled: true,
    status: result.status,
    resourceId: result.resourceId,
    error: result.error,
    bundleSummary
  };
}

async function buildMedplumHeaders(): Promise<Record<string, string>> {
  const { clientId, clientSecret, oauthTokenUrl } = getMedplumConfig();
  const headers: Record<string, string> = {
    "Content-Type": "application/fhir+json",
    Accept: "application/fhir+json"
  };

  if (!clientId || !clientSecret) {
    return headers;
  }

  try {
    const authResponse = await fetch(oauthTokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    if (authResponse.ok) {
      const { access_token } = (await authResponse.json()) as { access_token?: string };
      if (access_token) {
        headers.Authorization = `Bearer ${access_token}`;
      }
    } else {
      console.warn(
        "[medplum] OAuth failed; attempting unauthenticated local rehearsal request."
      );
    }
  } catch (error) {
    console.warn("[medplum] OAuth unreachable; attempting unauthenticated local rehearsal.", error);
  }

  return headers;
}

/**
 * Pushes a finalized FHIR bundle to Medplum when rehearsal is configured.
 * Caller must gate with shouldSyncAcceptedCaseToMedplum / ENABLE_MEDPLUM_SYNC.
 */
export async function pushToMedplum(bundle: unknown): Promise<{
  ok: boolean;
  liveEmis: false;
  status?: number;
  resourceId?: string;
  error?: string;
}> {
  const status = getMedplumRehearsalStatus();
  if (!status.syncFlagEnabled) {
    return {
      ok: false,
      liveEmis: false,
      error: "Medplum sync disabled — push refused"
    };
  }

  const { baseUrl } = getMedplumConfig();

  try {
    const headers = await buildMedplumHeaders();
    const response = await fetch(`${baseUrl}/`, {
      method: "POST",
      headers,
      body: JSON.stringify(bundle)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[medplum] FHIR server rejected bundle: ${response.status}`, errorData.slice(0, 500));
      return { ok: false, liveEmis: false, status: response.status, error: errorData.slice(0, 200) };
    }

    const responseData = (await response.json()) as { id?: string };
    console.log("[medplum] Persisted FHIR Bundle (rehearsal).", responseData.id);
    return { ok: true, liveEmis: false, status: response.status, resourceId: responseData.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[medplum] Failed to connect:", message);
    return { ok: false, liveEmis: false, error: message };
  }
}

/**
 * Fetches recent Encounter history for rehearsal UI context.
 * Returns [] when disabled or unreachable — never throws into clinical UI.
 */
export async function fetchPatientHistory(_patientLabel: string): Promise<unknown[]> {
  const status = getMedplumRehearsalStatus();
  if (!status.syncFlagEnabled) {
    return [];
  }

  const { baseUrl } = getMedplumConfig();

  try {
    const headers = await buildMedplumHeaders();
    delete headers["Content-Type"];
    const response = await fetch(`${baseUrl}/Encounter?_sort=-date&_count=5`, {
      method: "GET",
      headers
    });

    if (!response.ok) return [];
    const bundle = (await response.json()) as {
      entry?: Array<{ resource?: unknown }>;
    };
    return bundle.entry?.map((e) => e.resource).filter(Boolean) ?? [];
  } catch (error) {
    console.error("[medplum] fetchPatientHistory failed:", error);
    return [];
  }
}
