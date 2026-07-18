import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { assertClinicalProofGraph } from "../lib/clinical-proof/graph-assertions";
import { CLINICAL_PROOF_MIN_PATIENTS } from "../lib/clinical-proof/cohort";
import { closeNeo4jDriver } from "../lib/neo4j";

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
  assert.ok(Array.isArray(result.seededPatients));
  assert.equal(result.seededPatients.length, 3, "Expect P001/P003/P004 seed assertions");

  // Honest contract: never claim live unless connected + seeded relationships
  if (result.mode === "live") {
    assert.equal(result.connected, true);
    assert.ok(
      result.guardianInteractionsForPatel >= 1,
      "Live Aura must expose TAKES_MEDICATION→INTERACTS_WITH for P002"
    );
    for (const seeded of result.seededPatients) {
      assert.equal(seeded.present, true, `${seeded.id} must be present when live`);
      assert.ok(seeded.conditionCount >= 1, `${seeded.id} needs HAS_CONDITION`);
      assert.ok(seeded.medicationCount >= 1, `${seeded.id} needs TAKES_MEDICATION`);
    }
    assert.ok(result.note.toLowerCase().includes("live"));
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
    `Knowledge graph clinical-proof: mode=${result.mode} connected=${result.connected} patients=${result.patientCount} guardianHits=${result.guardianInteractionsForPatel} seeded=${result.seededPatients.map((s) => s.id).join(",")}`
  );
}

void run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeNeo4jDriver().catch(() => undefined);
  });
