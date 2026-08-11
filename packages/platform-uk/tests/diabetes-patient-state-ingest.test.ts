/**
 * C6 (docs/PHASED_BUILD_PLAN_C.md, implements
 * docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P1-2): real longitudinal
 * glucose/HbA1c ingestion tied to Patient State (C1).
 *
 * Covers:
 *  1. Ingest + read-back round trip for glucose and HbA1c (append-only,
 *     ordered by recordedAt, provenance visible via source.system).
 *  2. buildDiabetesRiskContribution's `readingsSource` provenance tag is
 *     "patient_state_ingest" when Patient-State-sourced readings are passed,
 *     vs "fixture" for the default/untouched path — never silently blended.
 *  3. Glucose stays an honest `insufficient_data` stub for a single ingested
 *     reading (below D2's MIN_READINGS_FOR_DERIVATION) — OQ-DIAB-1 is still
 *     open and this test does not exercise D2's `PED-DIAB-1` provisional
 *     derivation path (≥5 patient_state_ingest readings); see
 *     tests/diabetes-glucose-v1-1.test.ts for that coverage.
 *  4. HbA1c DOES use real ingested readings for its existing two-point
 *     trend derivation (not gated on OQ-DIAB-1).
 *  5. Regression: a patient with nothing ingested falls back to the fixture
 *     bundle byte-for-byte (loadDiabetesPatientStateOverrides -> empty input
 *     -> buildDiabetesRiskContribution output identical to calling with no
 *     override at all).
 */

import assert from "node:assert/strict";

import {
  recordDiabetesGlucoseReading,
  recordDiabetesHbA1cReading,
  loadIngestedDiabetesReadings,
  loadDiabetesPatientStateOverrides,
  DIABETES_GLUCOSE_FACT_TYPE,
  DIABETES_HBA1C_FACT_TYPE
} from "../lib/disease-modules/diabetes/ingest";
import { buildDiabetesRiskContribution, buildGlucoseSignal, buildHbA1cSignal } from "../lib/disease-modules/diabetes";
import { listPatientStateFacts } from "../lib/patient-state/repository";

async function testGlucoseIngestRoundTrip() {
  const scopeKey = `diab_ingest_test_${Date.now()}`;
  const patientId = `test-diab-glucose-${Date.now()}`;
  const options = { scopeKey };

  const r1 = await recordDiabetesGlucoseReading(
    { patientId, reading: { recordedAt: "2026-08-01T07:00:00.000Z", glucoseMgDl: 140, context: "fasting" } },
    options
  );
  const r2 = await recordDiabetesGlucoseReading(
    { patientId, reading: { recordedAt: "2026-08-01T13:00:00.000Z", glucoseMgDl: 190, context: "post_prandial" } },
    options
  );
  assert.ok(r1.fact.id !== r2.fact.id);
  assert.equal(r1.fact.factType, DIABETES_GLUCOSE_FACT_TYPE);
  assert.equal(r1.fact.source.system, "diabetes_ingest");

  const { facts } = await listPatientStateFacts(patientId, options);
  assert.equal(facts.length, 2, "both glucose facts remain readable (append-only)");
  const first = facts.find((f) => f.id === r1.fact.id);
  assert.equal(first?.supersededBy, r2.fact.id, "the first reading is marked superseded by the second, never mutated");

  const { glucoseReadings } = await loadIngestedDiabetesReadings(patientId, options);
  assert.equal(glucoseReadings.length, 2, "loadIngestedDiabetesReadings returns the full series, not just the current fact");
  assert.equal(glucoseReadings[0].glucoseMgDl, 140, "readings are ordered by recordedAt ascending");
  assert.equal(glucoseReadings[1].glucoseMgDl, 190);

  console.log("Diabetes Patient State ingest: glucose round-trip (append-only, ordered) passed.");
}

async function testHbA1cIngestRoundTrip() {
  const scopeKey = `diab_ingest_test_${Date.now()}_2`;
  const patientId = `test-diab-hba1c-${Date.now()}`;
  const options = { scopeKey };

  await recordDiabetesHbA1cReading({ patientId, reading: { recordedAt: "2026-02-01T00:00:00.000Z", valuePercent: 8.2 } }, options);
  await recordDiabetesHbA1cReading({ patientId, reading: { recordedAt: "2026-08-01T00:00:00.000Z", valuePercent: 7.3 } }, options);

  const { hba1cReadings } = await loadIngestedDiabetesReadings(patientId, options);
  assert.equal(hba1cReadings.length, 2);
  assert.equal(hba1cReadings[0].valuePercent, 8.2);
  assert.equal(hba1cReadings[1].valuePercent, 7.3);

  const overrides = await loadDiabetesPatientStateOverrides(patientId, options);
  assert.equal(overrides.hba1cReadingsSource, "patient_state_ingest");
  assert.equal(overrides.glucoseReadingsSource, undefined, "no glucose was ingested for this patient — must not be stamped ingested");
  assert.equal(overrides.input.glucoseReadings, undefined, "fixture fallback must remain available for the untouched kind");

  const contribution = buildDiabetesRiskContribution(
    { patientId, patientLabel: "Ingest Test Patient" },
    overrides.input,
    { glucose: overrides.glucoseReadingsSource, hba1c: overrides.hba1cReadingsSource }
  );
  assert.equal(contribution.signals.hba1c.readingsSource, "patient_state_ingest");
  assert.equal(contribution.signals.hba1c.trend, "improving", "real two-point trend derivation runs over ingested HbA1c readings");
  assert.equal(contribution.signals.hba1c.latestValuePercent, 7.3);

  console.log("Diabetes Patient State ingest: HbA1c round-trip + real trend derivation over ingested data passed.");
}

function testGlucoseNeverDerivesRealPatternRegardlessOfSource() {
  const ingested = buildGlucoseSignal(
    { patientId: "UNIT-TEST" },
    [{ recordedAt: "2026-01-01T00:00:00.000Z", glucoseMgDl: 150 }],
    "patient_state_ingest"
  );
  assert.equal(ingested.readingsSource, "patient_state_ingest");
  assert.equal(ingested.tirPercent, null, "OQ-DIAB-1 still open — ingestion must never smuggle in a real TIR derivation");
  assert.equal(ingested.variabilityScore, null);
  assert.deepEqual(ingested.patternFlags, ["insufficient_data"]);

  const fixtureSourced = buildGlucoseSignal({ patientId: "UNIT-TEST" }, []);
  assert.equal(fixtureSourced.readingsSource, "fixture", "default readingsSource is 'fixture' when unspecified");

  console.log("Diabetes Patient State ingest: Glucose stays an honest insufficient_data stub regardless of readingsSource.");
}

function testHbA1cDefaultSourceIsFixture() {
  const signal = buildHbA1cSignal({ patientId: "UNIT-TEST" }, [
    { recordedAt: "2026-01-01T00:00:00.000Z", valuePercent: 7.0 }
  ]);
  assert.equal(signal.readingsSource, "fixture");
  console.log("Diabetes Patient State ingest: HbA1c default readingsSource is 'fixture' when unspecified.");
}

async function testRegressionFallsBackToFixtureByteForByte() {
  // A patient with nothing ever ingested must resolve to the exact same
  // composite output whether or not the P1-2 override path runs at all.
  const patientId = "P002";
  const options = { scopeKey: `diab_ingest_test_never_used_${Date.now()}` };

  const overrides = await loadDiabetesPatientStateOverrides(patientId, options);
  assert.deepEqual(overrides.input, {}, "no ingestion happened for this scopeKey — override input must be empty");
  assert.equal(overrides.glucoseReadingsSource, undefined);
  assert.equal(overrides.hba1cReadingsSource, undefined);

  const withOverridePath = buildDiabetesRiskContribution(
    { patientId, patientLabel: "James Patel" },
    overrides.input,
    { glucose: overrides.glucoseReadingsSource, hba1c: overrides.hba1cReadingsSource }
  );
  const withoutOverridePath = buildDiabetesRiskContribution({ patientId, patientLabel: "James Patel" });

  assert.deepEqual(withOverridePath, withoutOverridePath, "byte-for-byte identical composite output when nothing was ingested");
  assert.equal(withOverridePath.signals.glucose.readingsSource, "fixture");
  assert.equal(withOverridePath.signals.hba1c.readingsSource, "fixture");

  console.log("Diabetes Patient State ingest: regression check — no ingestion falls back to fixture behaviour byte-for-byte.");
}

async function main() {
  await testGlucoseIngestRoundTrip();
  await testHbA1cIngestRoundTrip();
  testGlucoseNeverDerivesRealPatternRegardlessOfSource();
  testHbA1cDefaultSourceIsFixture();
  await testRegressionFallsBackToFixtureByteForByte();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
