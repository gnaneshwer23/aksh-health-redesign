/**
 * P0-ORCH-01 — diabetes assemble must not export runAgentOrchestration;
 * clinical-proof CONDUCTOR remains the sole symbol of that name.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.join(process.cwd());

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

async function main() {
  const clinical = await import("../lib/clinical-proof/agent-orchestration");
  assert.equal(typeof clinical.runAgentOrchestration, "function");

  const diabetes = await import("../lib/diabetes-intelligence");
  assert.equal(typeof diabetes.runDiabetesAgentIntelAssemble, "function");
  assert.equal(
    "runAgentOrchestration" in diabetes,
    false,
    "diabetes-intelligence must not export runAgentOrchestration"
  );

  const assembleSrc = read("lib/diabetes-intelligence/agent-intel-assemble.ts");
  assert.match(assembleSrc, /export async function runDiabetesAgentIntelAssemble/);
  assert.doesNotMatch(
    assembleSrc,
    /export async function runAgentOrchestration/
  );
  assert.match(assembleSrc, /not.*CONDUCTOR/i);

  console.log("p0-orch-rename: PASS");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
