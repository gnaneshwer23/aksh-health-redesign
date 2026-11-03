import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import fixture from "./fixtures/shared-research-contract.json";
import provenance from "../lib/hsi/investigationService.provenance.json";
import backendProvenance from "../lib/hsi/investigationBackend.provenance.json";
import { researchRunState } from "../lib/hsi/researchContracts";
import { createInvestigationService, createMemoryInvestigationStore, createCorpusRetrievalProvider, INVESTIGATION_SERVICE_VERSION } from "../lib/hsi/investigationService";

assert.equal(createHash("sha256").update(readFileSync("lib/hsi/investigationService.ts")).digest("hex"), provenance.sha256);
assert.equal(provenance.version, INVESTIGATION_SERVICE_VERSION);
assert.equal(createHash("sha256").update(readFileSync("lib/hsi/investigationBackend.ts")).digest("hex"), backendProvenance.sha256);
assert.equal(provenance.includesProductData, false);
// Fixture identity adapter; not the product's login or database implementation.
const token = Symbol("fixture-session");
const service = createInvestigationService({ store: createMemoryInvestigationStore(), providers: { retrieval: createCorpusRetrievalProvider() },
  authorize: async (credential, _action, key) => {
    if (credential !== token || key !== "aksh-test") throw new Error("Denied fixture session");
    return { id: "fixture-reviewer", role: "reviewer" };
  },
});
const pending = await service.start("aksh-test", { ...fixture, runs: [] }, token);
assert.equal(researchRunState(pending.bundle.runs[0]!), "awaiting_human_review");
assert.deepEqual(pending.payloads.graph!.relationshipIds, [fixture.relationships[0]!.id]);
assert.equal(pending.payloads.hypothesis!.status, "unvalidated");
const reviewed = await service.review("aksh-test", pending.revision, "request_revision", "Test fixture requires scientific evidence.", token);
assert.equal(researchRunState(reviewed.bundle.runs[0]!), "completed");
assert.deepEqual(reviewed.bundle.claims, fixture.claims);
assert.equal(reviewed.payloads.dossier!.review.decision, "request_revision");
assert.match((await service.exportDossier("aksh-test", token)).markdown, /SYN-PASSAGE-1/);
console.log("PASS: Aksh executes pinned HSI investigation, human review and dossier without moving clinical data");
