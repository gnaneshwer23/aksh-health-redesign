/**
 * Run all role dashboard smoke scripts sequentially.
 *
 * Requires a running app (`npm run dev` or `npm run build && npm run start`).
 *
 * Usage:
 *   npm run smoke:all
 *   SMOKE_BASE_URL=http://127.0.0.1:3000 npm run smoke:all
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const scripts = [
  "smoke:gp",
  "smoke:nurse",
  "smoke:pharmacist",
  "smoke:admin",
  "smoke:patient",
  "smoke:ics",
  "smoke:hospital",
  "smoke:researcher",
];

let failed = false;

for (const script of scripts) {
  console.log(`\n▶ Running ${script}…`);
  const result = spawnSync("npm", ["run", script], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    console.error(`✗ ${script} failed (exit ${result.status ?? "unknown"})`);
    failed = true;
    break;
  }

  console.log(`✓ ${script} passed`);
}

if (failed) {
  process.exit(1);
}

console.log("\n✓ All dashboard smoke scripts passed");
