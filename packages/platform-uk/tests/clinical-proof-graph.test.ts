import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { assertClinicalProofGraph } from "../lib/clinical-proof/graph-assertions";
import { CLINICAL_PROOF_MIN_PATIENTS } from "../lib/clinical-proof/cohort";

/** Load local Neo4j env when present so Aura probe is honest (never commit secrets). */
function loadLocalEnvIfPresent() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env) && key.startsWith("NEO4J_")) {
      process.env[key] = value;
    }
  }
}

async function run() {
  loadLocalEnvIfPresent();
  const result = await assertClinicalProofGraph();

  assert.ok(result.mode === "live" || result.mode === "mock");
  assert.equal(typeof result.configured, "boolean");
  assert.equal(typeof result.connected, "boolean");
  assert.ok(result.patientCount >= CLINICAL_PROOF_MIN_PATIENTS);
  assert.equal(result.patelPresent, true);
  assert.equal(result.patelHasConditions, true);

  // Honest contract: never claim live unless connected
  if (result.mode === "live") {
    assert.equal(result.connected, true);
  } else {
    assert.equal(result.connected, false);
    assert.ok(result.note.toLowerCase().includes("mock"));
  }

  if (result.configured && result.mode === "mock") {
    assert.ok(
      result.reconnectHint || result.note.includes("unreachable") || result.note.includes("mock"),
      "Configured-but-paused Aura must surface reconnect hint or honest mock note"
    );
  }

  console.log(
    `Knowledge graph clinical-proof: mode=${result.mode} connected=${result.connected} patients=${result.patientCount} guardianHits=${result.guardianInteractionsForPatel}`
  );
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
