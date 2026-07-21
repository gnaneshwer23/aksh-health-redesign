#!/usr/bin/env node
/**
 * Smoke: Medplum FHIR rehearsal honesty.
 *
 * Reports ENABLE_MEDPLUM_SYNC enabled/disabled without inventing live sync.
 * Loads `.env.local` when present (never prints secrets).
 * Optional probes:
 *   MEDPLUM_SMOKE_PROBE=auth|dry-run|push
 *   (default auth when credentials present, else status-only)
 *
 * Usage:
 *   npm run smoke:medplum
 *   SMOKE_BASE_URL=https://akshhealth.com npm run smoke:medplum
 *   MEDPLUM_SMOKE_PROBE=auth npm run smoke:medplum
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

if (process.env.SMOKE_SKIP_DOTENV !== "1") {
  loadEnvFile(resolve(process.cwd(), ".env.local"));
  loadEnvFile(resolve(process.cwd(), ".env"));
}

const baseUrl = (
  process.env.SMOKE_BASE_URL ??
  process.env.EVIDENCE_HEALTH_URL ??
  "http://127.0.0.1:3000"
).replace(/\/$/, "");
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? 10_000);

function resolveProbe() {
  const requested = process.env.MEDPLUM_SMOKE_PROBE?.trim();
  if (requested === "auth" || requested === "dry-run" || requested === "push") {
    return requested;
  }
  const credentialsConfigured = Boolean(
    process.env.MEDPLUM_CLIENT_ID?.trim() && process.env.MEDPLUM_CLIENT_SECRET?.trim()
  );
  // Prefer auth probe when secrets look present — presence ≠ valid OAuth.
  return credentialsConfigured ? "auth" : "";
}

const probe = resolveProbe();

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
      ? credentialsConfigured
        ? "Flag on · CLIENT_ID/SECRET present locally — OAuth must still pass ?probe=auth. Not live EMIS."
        : "Flag on · credentials missing — dry-run/auth will report not configured."
      : "Flag off (default) — accept path never pushes."
  };
}

async function probeOAuthDirect() {
  const clientId = process.env.MEDPLUM_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.MEDPLUM_CLIENT_SECRET?.trim() ?? "";
  const fhirUrl = (
    process.env.MEDPLUM_URL?.trim() || "http://localhost:8103/fhir/R4"
  ).replace(/\/+$/, "");
  const withoutFhir = fhirUrl.replace(/\/fhir\/R4$/i, "");
  const oauthTokenUrl = `${withoutFhir || "http://localhost:8103"}/oauth2/token`;
  let tokenUrlHost = "unknown";
  try {
    tokenUrlHost = new URL(oauthTokenUrl).host;
  } catch {
    tokenUrlHost = oauthTokenUrl.slice(0, 64);
  }

  if (!clientId || !clientSecret) {
    return {
      attempted: false,
      ok: false,
      liveEmis: false,
      tokenUrlHost,
      error: "credentials missing",
      note: "Direct OAuth skipped — set MEDPLUM_CLIENT_ID + MEDPLUM_CLIENT_SECRET"
    };
  }

  try {
    const response = await fetch(oauthTokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret
      })
    });
    const bodyText = await response.text();
    let errorHint = "";
    try {
      const parsed = JSON.parse(bodyText);
      errorHint = [parsed.error, parsed.error_description].filter(Boolean).join(": ");
    } catch {
      errorHint = bodyText.slice(0, 120);
    }
    const ok = response.ok && bodyText.includes("access_token");
    return {
      attempted: true,
      ok,
      liveEmis: false,
      status: response.status,
      tokenUrlHost,
      error: ok ? undefined : errorHint || `HTTP ${response.status}`,
      note: ok
        ? "Direct OAuth green — staging rehearsal only; not EMIS."
        : "Direct OAuth failed — need a real Medplum Client Secret (UUID placeholders → Invalid client)."
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      attempted: true,
      ok: false,
      liveEmis: false,
      tokenUrlHost,
      error: message.slice(0, 160),
      note: "Direct OAuth unreachable"
    };
  }
}

async function main() {
  console.log(`Medplum rehearsal smoke — base=${baseUrl} probe=${probe || "status-only"}`);

  const envReport = reportFromEnv();
  console.log(
    `env: enabled=${envReport.syncFlagEnabled} mode=${envReport.mode} liveEmis=${envReport.liveEmis} credentialsConfigured=${envReport.credentialsConfigured}`
  );

  let endpointOk = false;
  let endpointReport = null;
  let directAuth = null;

  if (probe === "auth" || envReport.credentialsConfigured) {
    directAuth = await probeOAuthDirect();
    console.log(
      `oauthDirect: ok=${directAuth.ok} host=${directAuth.tokenUrlHost} status=${directAuth.status ?? "n/a"} error=${directAuth.error ?? "none"}`
    );
  }

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
      if (endpointReport.authProbe) {
        console.log(
          `authProbe: ok=${endpointReport.authProbe.ok} error=${endpointReport.authProbe.error ?? "none"}`
        );
      }
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
      console.log(`endpoint: HTTP ${response.status} (server may be down — env/oauth report still valid)`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`endpoint: unreachable (${message}) — documenting env/oauth status`);
  }

  const oauthOk = directAuth?.ok === true || endpointReport?.authProbe?.ok === true;
  const degraded =
    envReport.credentialsConfigured && directAuth && directAuth.attempted && !directAuth.ok;

  const summary = {
    artifactType: "aksh-uk-medplum-rehearsal-smoke",
    baseUrl,
    probe: probe || "status-only",
    endpointReachable: endpointOk,
    env: envReport,
    oauthDirect: directAuth,
    endpoint: endpointReport,
    liveEmis: false,
    inventedLiveSync: false,
    oauthVerified: oauthOk,
    degradedRehearsal: Boolean(degraded),
    passMode: degraded
      ? "degraded_rehearsal_oauth_failed"
      : envReport.syncFlagEnabled
        ? oauthOk
          ? "staging_oauth_green"
          : "flag_on_unverified"
        : "disabled_honest"
  };

  console.log(JSON.stringify(summary, null, 2));
  if (degraded) {
    console.log(
      "Medplum rehearsal smoke PASSED (degraded): credentials present but OAuth failed — dry-run path still honest; not live EMIS."
    );
  } else if (endpointOk) {
    console.log("Medplum rehearsal smoke passed (honest enabled/disabled report).");
  } else {
    console.log(
      "Medplum rehearsal smoke passed (env/oauth-only; endpoint unreachable — not a live sync claim)."
    );
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
