/**
 * INT-13 — provenance bridge unit coverage.
 * Run: npx tsx tests/provenance-bridge.test.ts
 */
import assert from "node:assert/strict";

import {
  fromAgentProvenance,
  fromFacadeProvenanceTag,
  fromGlucoseSourceSystem,
  fromSpineProvenance,
  toAgentProvenance,
  toSpineProvenance,
} from "../lib/diabetes-intelligence/provenance-bridge";

function run() {
  const at = "2026-10-30T00:00:00.000Z";

  const ai = fromAgentProvenance("ai_generated", at);
  assert.equal(ai.aiGenerated, true);
  assert.equal(ai.ehrWrite, false);
  assert.equal(ai.synthetic, true);
  assert.equal(toAgentProvenance(ai), "ai_generated");
  assert.equal(toSpineProvenance(ai).sourceSystem, "agent_intelligence_draft");

  const verified = fromAgentProvenance("clinician_verified", at);
  assert.equal(verified.clinicianVerified, true);
  assert.equal(toAgentProvenance(verified), "clinician_verified");

  const glucose = fromGlucoseSourceSystem("synthetic_cgm_seed", at);
  assert.equal(glucose.kind, "synthetic_fixture");
  assert.equal(glucose.aiGenerated, false);

  const liveish = fromGlucoseSourceSystem("lab_interface_v1", at);
  assert.equal(liveish.kind, "source_system");

  const facade = fromFacadeProvenanceTag("journey_hitl", at);
  assert.equal(facade.kind, "journey_hitl");
  assert.equal(facade.clinicianVerified, true);

  const spine = fromSpineProvenance(
    { sourceSystem: "patient_360_seed", confidence: 0.7, recordedAt: at },
    "synthetic_fixture"
  );
  assert.equal(spine.kind, "synthetic_fixture");
  assert.equal(toSpineProvenance(spine).confidence, 0.7);

  console.log("provenance-bridge: INT-13 — PASS");
}

void run();
