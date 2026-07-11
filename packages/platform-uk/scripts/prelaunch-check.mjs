#!/usr/bin/env node

/**
 * Pre-launch configuration check. Lists missing env vars and probes /api/health.
 * Does not print secret values.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function loadEnvFile(fileName) {
  const filePath = path.join(ROOT, fileName);
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const REQUIRED = [
  { key: "NEXTAUTH_URL", label: "NextAuth public URL" },
  { key: "NEXTAUTH_SECRET", label: "NextAuth session secret" },
  { key: "DATABASE_URL", label: "Neon/Postgres connection string" },
];

const EMAIL_ANY = [
  { key: "RESEND_API_KEY", label: "Resend API key (password reset + notifications)" },
  { key: "SMTP_HOST", label: "SMTP host (alternative to Resend)" },
];

const EMAIL_OPTIONAL = [
  { key: "EMAIL_FROM", label: "From address for transactional email" },
  { key: "ACCESS_REQUEST_NOTIFY_EMAIL", label: "Inbox for organisation enquiry notifications" },
];

const OPTIONAL = [
  { key: "NEO4J_URI", label: "Neo4j Aura URI" },
  { key: "NEO4J_USERNAME", label: "Neo4j username" },
  { key: "NEO4J_PASSWORD", label: "Neo4j password" },
];

function isSet(key) {
  return Boolean(process.env[key]?.trim());
}

function isSmtpConfigured() {
  return ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"].every(isSet);
}

function hasEmailProvider() {
  return isSet("RESEND_API_KEY") || isSmtpConfigured();
}

async function probeHealth(baseUrl) {
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/health`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      return { ok: false, detail: `HTTP ${response.status}` };
    }
    const body = await response.json();
    return { ok: true, detail: JSON.stringify(body) };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : "Health probe failed",
    };
  }
}

async function main() {
  console.log("Aksh Health pre-launch check\n");

  const missingRequired = REQUIRED.filter((item) => !isSet(item.key));
  const missingEmailProvider = hasEmailProvider()
    ? []
    : [{ key: "RESEND_API_KEY or SMTP_*", label: "Email provider for password reset and notifications" }];
  const missingEmailOptional = EMAIL_OPTIONAL.filter((item) => !isSet(item.key));
  const missingOptional = OPTIONAL.filter((item) => !isSet(item.key));

  console.log("Required");
  for (const item of REQUIRED) {
    console.log(`  ${isSet(item.key) ? "✓" : "✗"} ${item.key} — ${item.label}`);
  }

  console.log("\nEmail (production)");
  console.log(`  ${hasEmailProvider() ? "✓" : "✗"} RESEND_API_KEY or SMTP_HOST/PORT/USER/PASS`);
  for (const item of EMAIL_ANY) {
    if (item.key === "SMTP_HOST") continue;
    console.log(`  ${isSet(item.key) ? "✓" : "·"} ${item.key}`);
  }
  if (isSmtpConfigured()) {
    console.log("  ✓ SMTP_HOST/PORT/USER/PASS configured");
  }

  console.log("\nRecommended");
  for (const item of EMAIL_OPTIONAL) {
    console.log(`  ${isSet(item.key) ? "✓" : "✗"} ${item.key} — ${item.label}`);
  }

  console.log("\nOptional");
  for (const item of OPTIONAL) {
    console.log(`  ${isSet(item.key) ? "✓" : "·"} ${item.key} — ${item.label}`);
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  console.log(`\nHealth probe: ${baseUrl}/api/health`);
  const health = await probeHealth(baseUrl);
  console.log(`  ${health.ok ? "✓" : "✗"} ${health.detail}`);

  const blockers = [...missingRequired, ...missingEmailProvider];
  console.log("\nSummary");
  if (blockers.length === 0) {
    console.log("  No critical local config gaps detected.");
  } else {
    console.log("  Missing critical configuration:");
    for (const item of blockers) {
      console.log(`    - ${item.key}: ${item.label}`);
    }
  }

  if (missingEmailOptional.length > 0) {
    console.log("  Recommended before launch:");
    for (const item of missingEmailOptional) {
      console.log(`    - ${item.key}: ${item.label}`);
    }
  }

  if (missingRequired.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
