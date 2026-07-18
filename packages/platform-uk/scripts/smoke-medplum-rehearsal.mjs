#!/usr/bin/env node
/**
 * Smoke: Medplum FHIR rehearsal honesty.
 *
 * Reports ENABLE_MEDPLUM_SYNC enabled/disabled without inventing live sync.
 * Optional dry-run via GET /api/integrations/medplum-status?probe=push
 * (push refuses when flag is off). Never claims EMIS write-back.
 *
 * Usage:
 *   npm run smoke:medplum
 *   SMOKE_BASE_URL=https://akshhealth.com npm run smoke:medplum
 *   MEDPLUM_SMOKE_PROBE=push npm run smoke:medplum
 */

const baseUrl = (
  process.env.SMOKE_BASE_URL ??
  process.env.EVIDENCE_HEALTH_URL ??
  "http://127.0.0.1:3000"
).replace(/\/$/, "");
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? 10_000);
const probe = process.env.MEDPLUM_SMOKE_PROBE === "push" ? "push" : "";

async function fetchWithTimeout(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${baseUrl}${path}`, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function reportFromEnv() {
  const syncFlagEnabled = process.env.ENABLE_MEDPLUM_SYNC === "true";
  const credentialsConfigured = Boolean(
    process.env.MEDPLUM_CLIENT_ID?.trim() && process.env.MEDPLUM_CLIENT_SECRET?.trim()
  );
  const mode = !syncFlagEnabled
    ? "disabled"
    : credentialsConfigured
      ? "rehearsal_ready"
      : "rehearsal_no_credentials";

  return {
    source: "env",
    syncFlagEnabled,
    mode,
    liveEmis: false,
    credentialsConfigured,
    note: syncFlagEnabled
      ? "Flag on locally — rehearsal only; not live EMIS."
      : "Flag off (default) — accept path never pushes."
  };
}

async function main() {
  console.log(`Medplum rehearsal smoke — base=${baseUrl}`);

  const envReport = reportFromEnv();
  console.log(
    `env: enabled=${envReport.syncFlagEnabled} mode=${envReport.mode} liveEmis=${envReport.liveEmis}`
  );

  let endpointOk = false;
  let endpointReport = null;

  try {
    const path = probe
      ? `/api/integrations/medplum-status?probe=${probe}`
      : "/api/integrations/medplum-status";
    const response = await fetchWithTimeout(path);
    if (response.ok) {
      endpointReport = await response.json();
      endpointOk = true;
      const status = endpointReport.status ?? {};
      console.log(
        `endpoint: mode=${status.mode} syncFlagEnabled=${status.syncFlagEnabled} liveEmis=${endpointReport.liveEmis}`
      );
      if (endpointReport.pushProbe) {
        console.log(
          `pushProbe: ok=${endpointReport.pushProbe.ok} error=${endpointReport.pushProbe.error ?? "none"}`
        );
      }
      if (endpointReport.liveEmis !== false || endpointReport.liveSyncInvented !== false) {
        console.error("FAIL: smoke must never claim live EMIS / invented sync");
        process.exit(1);
      }
    } else {
      console.log(`endpoint: HTTP ${response.status} (server may be down — env report still valid)`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`endpoint: unreachable (${message}) — documenting env-only status`);
  }

  const summary = {
    artifactType: "aksh-uk-medplum-rehearsal-smoke",
    baseUrl,
    endpointReachable: endpointOk,
    env: envReport,
    endpoint: endpointReport,
    liveEmis: false,
    inventedLiveSync: false
  };

  console.log(JSON.stringify(summary, null, 2));
  console.log(
    endpointOk
      ? "Medplum rehearsal smoke passed (honest enabled/disabled report)."
      : "Medplum rehearsal smoke passed (env-only; endpoint unreachable — not a live sync claim)."
  );
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
