#!/usr/bin/env node
/**
 * Smoke: EMIS Partner sandbox honesty (N5).
 *
 * Reports ENABLE_EMIS_PARTNER_SANDBOX + EMIS_PARTNER_* without inventing live write-back.
 * Loads `.env.local` when present (never prints secrets).
 *
 * Usage:
 *   npm run smoke:emis-partner
 *   ENABLE_EMIS_PARTNER_SANDBOX=true npm run smoke:emis-partner
 *   EMIS_PARTNER_SMOKE_PROBE=auth npm run smoke:emis-partner
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

function missingEnv() {
  const keys = [
    "EMIS_PARTNER_CLIENT_ID",
    "EMIS_PARTNER_CLIENT_SECRET",
    "EMIS_PARTNER_TOKEN_URL",
    "EMIS_PARTNER_FHIR_BASE_URL"
  ];
  return keys.filter((k) => !process.env[k]?.trim());
}

function reportFromEnv() {
  const sandboxFlagEnabled = process.env.ENABLE_EMIS_PARTNER_SANDBOX === "true";
  const missing = missingEnv();
  const credentialsConfigured = missing.length === 0;
  const mode = !sandboxFlagEnabled
    ? "disabled"
    : credentialsConfigured
      ? "sandbox_ready"
      : "needs_partner";
  const writePath = !sandboxFlagEnabled
    ? "sim"
    : credentialsConfigured
      ? "sandbox"
      : "blocked_needs_partner";

  console.log("→ env: ENABLE_EMIS_PARTNER_SANDBOX=%s", sandboxFlagEnabled);
  console.log(
    "→ env: credentialsConfigured=%s missing=[%s] mode=%s writePath=%s liveEmis=false",
    credentialsConfigured,
    missing.join(",") || "none",
    mode,
    writePath
  );
  console.log("→ hard: canFlipLiveEmisFromEnv=false (N7 only)");

  if (!sandboxFlagEnabled) {
    console.log("→ PASS (scaffold): flag off = sim path (ehr-writeback-sim / emis-staging)");
    return { ok: true, verdict: "disabled_honest" };
  }
  if (!credentialsConfigured) {
    console.log(
      "→ PARTIAL / PASS (scaffold): flag on · needs_partner — Partner Programme must supply EMIS_PARTNER_*"
    );
    return { ok: true, verdict: "needs_partner_honest" };
  }
  console.log(
    "→ PASS (scaffold): sandbox_ready · still liveEmis:false · network write deferred to N6/N7"
  );
  return { ok: true, verdict: "sandbox_ready_live_false" };
}

async function main() {
  console.log("smoke:emis-partner — Partner sandbox honesty (never live EMIS)\n");
  const local = reportFromEnv();

  const probe = process.env.EMIS_PARTNER_SMOKE_PROBE?.trim();
  if (probe === "auth") {
    const { probeEmisPartnerSandboxOAuth } = await import("../lib/emis-partner-sandbox.ts");
    const oauth = await probeEmisPartnerSandboxOAuth();
    console.log(
      "→ probe=auth attempted=%s ok=%s mode=%s liveEmis=false error=%s",
      oauth.attempted,
      oauth.ok,
      oauth.mode,
      oauth.error ?? "(none)"
    );
    console.log("→ note: %s", oauth.note);
  }

  console.log("\nVerdict: %s · liveEmis=false", local.verdict);
  process.exit(local.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
