/**
 * Shared smoke-test credential resolution.
 * Smoke scripts require real accounts created via /signup — no demo defaults.
 *
 * Loads `.env.local` / `.env` when present (never prints secrets), matching
 * smoke-medplum-rehearsal.mjs. Set SMOKE_SKIP_DOTENV=1 to skip.
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

export function requireSmokeCredentials(envPrefix, scriptName) {
  const email = process.env[`${envPrefix}_EMAIL`]?.trim();
  const password = process.env[`${envPrefix}_PASSWORD`];

  if (!email || !password) {
    console.error(
      [
        `Missing smoke credentials for ${scriptName}.`,
        `Set ${envPrefix}_EMAIL and ${envPrefix}_PASSWORD to a real account created via /signup.`,
        "Example:",
        `  ${envPrefix}_EMAIL=you@example.com ${envPrefix}_PASSWORD='your-password' npm run ${scriptName}`,
        "Or add SMOKE_* keys to .env.local (see docs/DEMO_LAUNCH_CREDENTIALS.md).",
      ].join("\n")
    );
    process.exit(1);
  }

  return { email, password };
}

export function requireSmokeUserId(envKey = "SMOKE_LOOP_USER_ID") {
  const userId = process.env[envKey]?.trim();
  if (!userId) {
    console.error(
      [
        `Missing ${envKey}.`,
        "Set it to the signed-in user's id from GET /api/auth/session after creating an account via /signup.",
      ].join("\n")
    );
    process.exit(1);
  }
  return userId;
}
