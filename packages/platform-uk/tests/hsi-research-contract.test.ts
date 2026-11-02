import assert from "node:assert/strict";
import artifact from "../data/hsi/research-bundle.json";
import { parseHsiResearchBundle } from "../lib/hsi/research-contract";

const bundle = parseHsiResearchBundle(artifact);
assert.ok(bundle.cards.length > 0);
assert.equal(bundle.producer.repository, "gnaneshwer23/hsi-core");
assert.equal(bundle.notCds, true);
const mutations = [
  { ...artifact, schemaVersion: "unknown" },
  { ...artifact, containsPhi: true },
  { ...artifact, notCds: false },
  { ...artifact, autoApplyToEhr: true },
  { ...artifact, patient: { name: "fictional patient" } },
  { ...artifact, generatedAt: "yesterday" },
  { ...artifact, cards: [] },
  { ...artifact, cards: [artifact.cards[0], artifact.cards[0]] },
  { ...artifact, cards: [{ ...artifact.cards[0], observation: { value: 42 } }] },
  { ...artifact, cards: [{ ...artifact.cards[0], sourceSupport: "verified" }] },
  { ...artifact, cards: [{ ...artifact.cards[0], pmid: "javascript:alert(1)" }] },
];
for (const mutation of mutations) assert.throws(() => parseHsiResearchBundle(mutation));
const caveat = bundle.cards.find((card) => card.claimId === "HSI-C-IM-002");
assert.ok(caveat);
assert.ok(caveat?.provenanceNote?.includes("not T2D proof"));
assert.equal(caveat.sourceSupport, "not_verified_for_clinical_use");
console.log(`PASS: ${bundle.cards.length} real producer cards accepted; ${mutations.length} unsafe/malformed payloads rejected; source caveat retained.`);
