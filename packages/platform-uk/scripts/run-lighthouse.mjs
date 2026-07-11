#!/usr/bin/env node
/**
 * Run Lighthouse against a local or deployed Aksh Health instance.
 *
 * Usage:
 *   npm run build && npm run start   # terminal 1
 *   npm run lighthouse               # terminal 2 (desktop)
 *   npm run lighthouse:mobile        # mobile form factor
 *
 * Override target: LIGHTHOUSE_URL=https://0ne-health.vercel.app npm run lighthouse
 */
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const url = process.env.LIGHTHOUSE_URL ?? "http://localhost:3000";
const mobile = process.argv.includes("--mobile");
const outputPath = mobile ? ".lighthouse/report-mobile.html" : ".lighthouse/report.html";

mkdirSync(dirname(outputPath), { recursive: true });

const args = [
  "lighthouse",
  url,
  "--only-categories=performance,accessibility",
  "--output=html",
  `--output-path=${outputPath}`,
  "--chrome-flags=--headless --no-sandbox",
];

if (mobile) {
  args.push("--form-factor=mobile", "--screenEmulation.mobile=true");
} else {
  args.push("--preset=desktop");
}

console.log(`Running Lighthouse (${mobile ? "mobile" : "desktop"}) against ${url}`);
console.log(`Report will be written to ${outputPath}`);

const child = spawn("npx", args, { stdio: "inherit", shell: true });
child.on("exit", (code) => process.exit(code ?? 1));
