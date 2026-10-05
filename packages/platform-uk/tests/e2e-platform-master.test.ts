/**
 * AKSH-E2E-MASTER-001 — Master Journey unit gate.
 * Run: npm run test:e2e:platform-master  (alias: npm run test:master)
 *
 * Optionally loads `.env.local` when present (CI has none). Durable HITL/learning
 * steps need Neon (`DATABASE_URL`); without it they degrade, or set
 * AKSH_MASTER_SKIP_DURABLE=true to mark those steps SKIP explicitly.
 */

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  MASTER_JOURNEY_TEST_ID,
  buildMasterIdentityMap,
  renderMasterJourneyMarkdown,
  runMasterJourney,
} from "../lib/e2e/master-journey";

/** Best-effort `.env.local` load so local runs keep Neon without `--env-file` (CI-safe). */
function loadEnvLocalIfPresent() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    if (!key || process.env[key] !== undefined) continue;
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvLocalIfPresent();

async function run() {
  const skipDurable = process.env.AKSH_MASTER_SKIP_DURABLE === "true";
  const identity = buildMasterIdentityMap(20260812);
  assert.equal(identity.canonicalPatientId, "P002");
  assert.equal(identity.clinicalProofPatientId, "P002");
  assert.equal(identity.generatorPatientId, "P002");
  assert.equal(identity.generatorCohortId, "B");
  assert.ok(identity.legacyGeneratorAliases.includes("E2P021"));

  const result = await runMasterJourney({
    seed: 20260812,
    skipDurableWrites: skipDurable,
    writeArtifacts: true,
  });

  assert.equal(result.testId, MASTER_JOURNEY_TEST_ID);
  assert.equal(result.artifactType, "aksh-e2e-master-journey-trace");
  assert.equal(result.honesty.liveEmis, false);
  assert.equal(result.honesty.clinicallyValidated, false);
  assert.equal(result.honesty.productionReadyForAutonomousCare, false);
  assert.equal(result.readiness.workflow, "SIMULATED END-TO-END");
  assert.equal(result.readiness.clinicalEvidence, "UNVALIDATED");
  assert.equal(result.steps.length, 40);
  assert.ok(result.correlationId.startsWith("aksh-master-"));
  assert.equal(result.identity.canonicalPatientId, result.identity.generatorPatientId);

  const md = renderMasterJourneyMarkdown(result);
  assert.ok(md.includes(MASTER_JOURNEY_TEST_ID));
  assert.ok(md.includes(result.correlationId));
  assert.ok(md.includes("not clinically validated") || md.includes("UNVALIDATED"));
  assert.ok(md.includes("P1-ID-001 resolved"));

  if (result.overall !== "PASS") {
    console.error(`Master Journey FAIL — first: ${result.firstFailure}`);
    for (const s of result.steps.filter((x) => x.status === "FAIL")) {
      console.error(`  ${s.step}. ${s.id}: ${s.detail}`);
    }
    process.exit(1);
  }

  console.log(
    `${MASTER_JOURNEY_TEST_ID} PASS (${result.passed}/${result.steps.length}` +
      `${result.skipped ? ` · ${result.skipped} skipped` : ""})` +
      ` correlationId=${result.correlationId}` +
      ` identity=${identity.canonicalPatientId}` +
      ` aliases=${identity.legacyGeneratorAliases.join(",")}`
  );
  process.exit(0);
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
