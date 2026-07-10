import assert from "node:assert/strict";

import { createStubIndicBertNer, runVin1EvalHarness, type Vin1Case } from "../lib/nlp/india-nlp";

const sampleCases: Vin1Case[] = [
  {
    id: "vin1-hi-001",
    language: "hi",
    text: "खांसी, बुखार, amoxicillin, penicillin allergy",
    expectedLabels: ["SYMPTOM", "MEDICATION", "ALLERGY"]
  }
];

async function run() {
  const ner = createStubIndicBertNer();
  const results = await runVin1EvalHarness(sampleCases, ner, 0.5);
  assert.equal(results.length, 1);
  assert.ok(results[0]!.f1 > 0, "V-IN1 harness skeleton should score stub NER output");
  console.log("V-IN1 harness skeleton passed.", results);
}

void run();
