/**
 * AKSH-E2E-MASTER-001 — Master Journey unit gate.
 * Run: npm run test:e2e:platform-master  (alias: npm run test:master)
 *
 * Requires .env.local Neon access for durable HITL/learning steps unless
 * AKSH_MASTER_SKIP_DURABLE=true is set.
 */

import assert from "node:assert/strict";

import {
  MASTER_JOURNEY_TEST_ID,
  buildMasterIdentityMap,
  renderMasterJourneyMarkdown,
  runMasterJourney,
} from "../lib/e2e/master-journey";

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
  assert.equal(result.steps.length, 35);
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
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
