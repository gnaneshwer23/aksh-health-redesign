#!/usr/bin/env node
/**
 * Clinical proof orchestrator.
 * Runs unit clinical-proof suite, then Playwright clinical-proof specs.
 * Documents BLOCKED partner gaps — never fake-passes EMIS write-back.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function run(label, command, args) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env
  });
  if (result.status !== 0) {
    console.error(`FAILED: ${label} (exit ${result.status})`);
    process.exit(result.status ?? 1);
  }
}

console.log("Aksh Health — clinical proof harness");
console.log("Invariant: zero autonomous EHR write. Live EMIS = BLOCKED: partner.");

const matrixPath = path.join(root, "docs/qa-traceability-matrix.json");
if (fs.existsSync(matrixPath)) {
  const matrix = JSON.parse(fs.readFileSync(matrixPath, "utf8"));
  console.log(
    `Traceability snapshot: pass=${matrix.counts.pass} partial=${matrix.counts.partial} blockedPartner=${matrix.counts.blockedPartner} gap=${matrix.counts.gap} manual=${matrix.counts.manual}`
  );
}

run("Unit clinical-proof", "npm", ["run", "test:clinical-proof"]);
run("Playwright clinical-proof", "npm", ["run", "test:e2e:clinical-proof"]);

console.log(`
Clinical proof suite completed.

What this proves today:
- Synthetic cohort ≥25 with required clinical profiles
- FHIR-shaped draft gates (not full HL7 validator)
- HITL non-bypass + EMIS staging no live write
- Simulated EHR write-back requires clinician approval token
- Patel golden path through UI + agent APIs (write-back BLOCKED: partner)
- SHIELD append-only API contract
- RBAC path matrix + public GP/ICS allowlist

What remains BLOCKED / GAP:
- Live EMIS / SystmOne write-back (partner)
- Mirth / HL7 v2 / CIS2
- Full FHIR Validator + pen-test + load + signed Gates 1–3

Docs: docs/E2E_CLINICAL_PROOF.md
`);
