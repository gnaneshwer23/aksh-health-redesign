import assert from "node:assert/strict";
import { mkdir } from "fs/promises";
import path from "path";

import {
  getWholeLoopCapabilities,
  runWholeLoop,
  WHOLE_LOOP_STAGES
} from "../lib/precision-health/whole-loop";

async function run() {
  const caps = getWholeLoopCapabilities();
  assert.equal(caps.available, true);
  assert.equal(caps.honesty.physiologicalTwin, false);
  assert.equal(caps.honesty.liveEmis, false);
  assert.equal(caps.honesty.autoRetrain, false);
  assert.equal(caps.honesty.ehrWrite, false);
  assert.equal(caps.publicDemoPatientId, "P001");
  assert.deepEqual([...caps.stages], [...WHOLE_LOOP_STAGES]);

  const scopeKey = `whole_loop_${Date.now()}`;
  const dataDir = path.join(process.cwd(), "data");
  await mkdir(dataDir, { recursive: true });

  // Happy path: synthetic whole loop with demo Accept
  const report = await runWholeLoop(
    {
      patientId: "P001",
      publicDemo: true,
      demoAccept: true,
      includeCausal: true,
      includeCoaching: true,
      updateKg: false
    },
    {
      scopeKey,
      actor: "test-whole-loop@aksh.health",
      mode: "public_demo"
    }
  );

  assert.equal(report.artifactType, "aksh-precision-health-whole-loop");
  assert.equal(report.patientId, "P001");
  assert.equal(report.honesty.physiologicalTwin, false);
  assert.equal(report.honesty.liveEmis, false);
  assert.equal(report.honesty.autoRetrain, false);
  assert.equal(report.honesty.ehrWrite, false);
  assert.equal(report.honesty.synthetic, true);
  assert.equal(report.honesty.scaffolding, true);
  assert.equal(report.honesty.demoAcceptUsed, true);
  assert.equal(report.stages.length, WHOLE_LOOP_STAGES.length);

  for (const stageId of WHOLE_LOOP_STAGES) {
    assert.ok(
      report.stages.some((s) => s.id === stageId),
      `missing stage ${stageId}`
    );
  }

  const failed = report.stages.filter((s) => s.status === "failed");
  assert.equal(failed.length, 0, `unexpected failures: ${failed.map((f) => f.id).join(",")}`);

  assert.ok(report.artifacts.consentGrantIds.length >= 1);
  assert.ok(report.artifacts.ingestedSampleIds.length >= 4);
  assert.ok(report.artifacts.orchestration);
  assert.equal(report.artifacts.orchestration?.ehrWrite, false);
  assert.ok(report.artifacts.coaching.length >= 1);
  assert.ok(report.artifacts.causal);
  assert.equal(report.artifacts.twin?.physiologicalTwin, false);
  assert.equal(report.artifacts.twin?.simulationMode, "synthetic_rules");
  assert.ok(report.artifacts.plan);
  assert.equal(report.artifacts.plan?.status, "DRAFT");
  assert.equal(report.artifacts.plan?.ehrWrite, false);
  assert.ok(report.safetyRoute);
  assert.equal(report.hitlGate.status, "demo_accepted");
  assert.ok(report.artifacts.staging);
  assert.equal(report.artifacts.staging?.liveEmis, false);
  assert.ok(report.artifacts.learningEventId);
  assert.ok(report.stakeholderGlimpses.length >= 5);
  assert.ok(report.partnerGaps.length >= 3);

  // Public demo rejects non-P001
  let rejected = false;
  try {
    await runWholeLoop(
      { patientId: "P002", publicDemo: true, demoAccept: false },
      { scopeKey, actor: "test", mode: "public_demo" }
    );
  } catch {
    rejected = true;
  }
  assert.equal(rejected, true, "public demo must reject non-P001");

  // Without demoAccept, HITL stays blocked
  const pending = await runWholeLoop(
    {
      patientId: "P001",
      publicDemo: true,
      demoAccept: false,
      updateKg: false
    },
    { scopeKey: `${scopeKey}_pending`, actor: "test", mode: "public_demo" }
  );
  assert.equal(pending.hitlGate.status, "skipped_awaiting_clinician");
  assert.equal(pending.artifacts.staging, null);
  const hitlStage = pending.stages.find((s) => s.id === "hitl_staging");
  assert.equal(hitlStage?.status, "blocked");

  console.log("precision-health-whole-loop.test.ts: ok");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
