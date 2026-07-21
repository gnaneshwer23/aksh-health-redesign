/**
 * NEXUS clinical intelligence — deterministic path (no LLM key required).
 * Draft-only; never claims EHR write.
 */
import assert from "node:assert/strict";

import { runNexusAgent } from "../lib/agents/llm-nexus";

async function main() {
  process.env.ENABLE_LLM_NEXUS = "false";

  const draft = await runNexusAgent({ patientId: "P002" });
  assert.ok(draft, "NEXUS must return a draft for seeded patient P002");
  assert.equal(draft!.agent, "NEXUS");
  assert.equal(draft!.status, "draft");
  assert.equal(draft!.fhirResource, "ClinicalImpression");
  assert.equal(draft!.mode, "deterministic");
  assert.ok(draft!.correlations.length >= 1, "at least one correlation");
  assert.ok(draft!.safetyNotes.some((n) => /HITL/i.test(n)), "HITL note required");

  const missing = await runNexusAgent({ patientId: "P-DOES-NOT-EXIST" });
  assert.equal(missing, null);

  console.log(
    `NEXUS clinical-proof passed (patient=${draft!.patientId}; correlations=${draft!.correlations.length}; mode=${draft!.mode}).`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
