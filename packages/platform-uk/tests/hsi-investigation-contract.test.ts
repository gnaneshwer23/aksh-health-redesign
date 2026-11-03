import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import fixture from "./fixtures/shared-research-contract.json";
import provenance from "../lib/hsi/researchContracts.provenance.json";
import { parseResearchBundle, researchRunState, RESEARCH_CONTRACT_VERSION } from "../lib/hsi/researchContracts";

assert.equal(createHash("sha256").update(readFileSync("lib/hsi/researchContracts.ts")).digest("hex"), provenance.sha256);
assert.equal(provenance.version, RESEARCH_CONTRACT_VERSION);
assert.match(provenance.commit, /^[a-f0-9]{40}$/);
assert.equal(provenance.includesProductData, false);
const bundle = parseResearchBundle(fixture);
assert.equal(bundle.relationships[0]!.id, fixture.relationships[0]!.id);
assert.equal(bundle.claims[0]!.relationshipId, bundle.relationships[0]!.id);
assert.equal(researchRunState(bundle.runs[0]!), "pending");
assert.equal(bundle.claims[0]!.curation, "unreviewed");
for (const mutate of [
  (b: any) => { b.containsPhi = true; },
  (b: any) => { b.relationships[0].subjectId = "SYN-MISSING"; },
  (b: any) => { b.claims[0].curation = "approved"; b.claims[0].assessmentKind = "model_draft"; },
  (b: any) => { b.runs[0].status = "completed"; },
]) {
  const b = structuredClone(fixture); mutate(b);
  assert.throws(() => parseResearchBundle(b));
}
console.log("PASS: Aksh research contract conformance and pinned source integrity");
