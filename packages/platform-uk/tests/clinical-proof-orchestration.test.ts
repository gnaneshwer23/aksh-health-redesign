import assert from "node:assert/strict";

import { runAgentOrchestration } from "../lib/clinical-proof/agent-orchestration";
import { getGoldenPathPatient } from "../lib/clinical-proof/golden-path-cohort";

async function run() {
  process.env.ENABLE_LLM_SYNTHESIS = "false";
  process.env.ENABLE_LLM_GUARDIAN = "false";
  process.env.ENABLE_LLM_ORACLE = "false";
  process.env.ENABLE_LLM_DR_ASSIST = "false";
  process.env.ENABLE_LLM_NEXUS = "false";

  // Urgent Patel path — GUARDIAN must lead review order
  const patel = getGoldenPathPatient("P002");
  assert.ok(patel);

  const urgent = await runAgentOrchestration({
    patientId: patel.id,
    proposedDrug: patel.proposedDrug,
    transcript: patel.transcript,
    includeDrAssist: true,
    agentTimeoutMs: 10_000,
    overallTimeoutMs: 30_000
  });

  assert.equal(urgent.ehrWrite, false);
  assert.equal(urgent.hitlRequired, true);
  assert.equal(urgent.timedOut, false);
  assert.equal(urgent.sharedContext.patientId, "P002");
  assert.ok(urgent.outputSlots.includes("SYNTHESIS"));
  assert.ok(urgent.outputSlots.includes("GUARDIAN"));
  assert.ok(urgent.outputSlots.includes("ORACLE"));
  assert.ok(urgent.outputSlots.includes("NEXUS"));
  assert.ok(urgent.outputSlots.includes("DrASSIST"));

  assert.equal(urgent.outputs.GUARDIAN.patientId, "P002");
  assert.equal(urgent.outputs.ORACLE.patientId, "P002");
  assert.equal(urgent.outputs.NEXUS?.patientId, "P002");
  assert.equal(urgent.outputs.NEXUS?.status, "draft");
  assert.equal(urgent.outputs.DrASSIST?.patientId, "P002");

  // Independent evidence for every agent
  assert.ok(urgent.evidence.every((e) => e.evidenced));
  assert.ok(urgent.evidence.some((e) => e.agent === "NEXUS" && e.evidenced));

  // Patel has URGENT / interaction risk → GUARDIAN first; NEXUS after HORIZON (ORACLE)
  assert.equal(urgent.queuePriority, "Urgent");
  assert.equal(urgent.reviewOrder[0], "GUARDIAN");
  assert.deepEqual(urgent.reviewOrder, ["GUARDIAN", "ORACLE", "SYNTHESIS", "NEXUS", "DrASSIST"]);

  // No overwrite: distinct draft payloads
  assert.notEqual(urgent.outputs.SYNTHESIS, urgent.outputs.GUARDIAN as unknown);
  assert.notEqual(urgent.outputs.NEXUS, urgent.outputs.ORACLE as unknown);
  assert.ok(urgent.outputs.SYNTHESIS.plan);
  assert.ok(typeof urgent.outputs.GUARDIAN.overallStatus === "string");
  assert.ok(typeof urgent.outputs.ORACLE.oracleScore === "number");
  assert.ok((urgent.outputs.NEXUS?.correlations.length ?? 0) > 0);
  assert.ok((urgent.outputs.DrASSIST?.codes.length ?? 0) > 0);

  // Non-urgent paediatric — still shared context, may not force Urgent
  const paediatric = await runAgentOrchestration({
    patientId: "P009",
    proposedDrug: "Amoxicillin",
    transcript: "Infant check — vitamin D drops only.",
    includeDrAssist: false,
    agentTimeoutMs: 10_000
  });
  assert.equal(paediatric.sharedContext.patientId, "P009");
  assert.ok(!paediatric.outputSlots.includes("DrASSIST"));
  assert.ok(paediatric.outputSlots.includes("NEXUS"));
  assert.equal(paediatric.outputs.NEXUS?.status, "draft");
  assert.equal(paediatric.ehrWrite, false);
  assert.equal(paediatric.hitlRequired, true);
  assert.ok(paediatric.evidence.every((e) => e.evidenced));
  // Non-urgent review: SYNTHESIS → GUARDIAN → ORACLE → NEXUS
  assert.deepEqual(paediatric.reviewOrder, ["SYNTHESIS", "GUARDIAN", "ORACLE", "NEXUS"]);

  console.log(
    `Agent orchestration clinical-proof passed (Patel priority=${urgent.queuePriority} order=${urgent.reviewOrder.join("→")}; P009 slots=${paediatric.outputSlots.join(",")}; elapsed=${urgent.elapsedMs}ms).`
  );
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
