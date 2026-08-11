/**
 * D2 (docs/PHASED_BUILD_PLAN_D.md, `PED-DIAB-1` — provisional engineering
 * decision, NOT a resolution of OQ-DIAB-1): Glucose Intelligence v1.1.
 *
 * Covers:
 *  1. Fixture-sourced readings never derive, regardless of count — stays
 *     byte-identical to the pre-D2 `insufficient_data` stub forever.
 *  2. Patient-State-ingested readings below MIN_READINGS_FOR_DERIVATION stay
 *     `insufficient_data` too — the minimum-count gate is real.
 *  3. Patient-State-ingested readings at/above the minimum derive real
 *     tirPercent/variabilityScore against hand-computed expected values.
 *  4. Each of the three named pattern flags fires on a constructed reading
 *     set designed to trigger it, and a separate "clean" set triggers none.
 *  5. `targetBand` and the provisional-band limitation string are present
 *     on every derived (non-stub) output, absent on every stub output.
 *  6. Regression: buildDiabetesRiskContribution's full composite output for
 *     every existing fixture-only cohort patient is unchanged (still
 *     `insufficient_data` for Glucose) — the C6 regression guarantee
 *     extended, not weakened.
 */

import assert from "node:assert/strict";

import {
  buildGlucoseSignal,
  DEFAULT_TARGET_BAND,
  MIN_READINGS_FOR_DERIVATION
} from "../lib/disease-modules/diabetes/glucose";
import { buildDiabetesRiskContribution, getDiabetesFixtureCohortIds } from "../lib/disease-modules/diabetes";
import type { DiabetesGlucoseReading } from "../lib/disease-modules/diabetes/types";

function testFixtureNeverDerivesRegardlessOfCount() {
  const manyFixtureReadings: DiabetesGlucoseReading[] = Array.from({ length: 10 }, (_, i) => ({
    recordedAt: `2026-01-0${(i % 9) + 1}T07:00:00.000Z`,
    glucoseMgDl: 120,
    context: "fasting" as const
  }));

  const signal = buildGlucoseSignal({ patientId: "UNIT-TEST" }, manyFixtureReadings, "fixture");
  assert.equal(signal.tirPercent, null, "fixture readings must never derive TIR, no matter how many");
  assert.equal(signal.variabilityScore, null);
  assert.deepEqual(signal.patternFlags, ["insufficient_data"]);
  assert.equal(signal.dataCompleteness, "partial");
  assert.equal(signal.targetBand, undefined, "targetBand must be absent on every stub output");

  console.log("Glucose v1.1: fixture-sourced readings never derive, regardless of count.");
}

function testIngestedBelowMinimumStaysStub() {
  const belowMinimum: DiabetesGlucoseReading[] = Array.from({ length: MIN_READINGS_FOR_DERIVATION - 1 }, (_, i) => ({
    recordedAt: `2026-01-0${i + 1}T07:00:00.000Z`,
    glucoseMgDl: 120,
    context: "fasting" as const
  }));

  const signal = buildGlucoseSignal({ patientId: "UNIT-TEST" }, belowMinimum, "patient_state_ingest");
  assert.equal(signal.tirPercent, null, "below the minimum count, even real ingested readings stay insufficient_data");
  assert.equal(signal.variabilityScore, null);
  assert.deepEqual(signal.patternFlags, ["insufficient_data"]);
  assert.equal(signal.targetBand, undefined);

  console.log("Glucose v1.1: patient-state-ingested readings below the minimum count stay insufficient_data.");
}

function testIngestedAtMinimumDerivesRealTirAndVariability() {
  // Hand-computed: values = [100, 150, 200, 60, 130]
  // mean = 128; variance = ((-28)^2+(22)^2+(72)^2+(-68)^2+(2)^2)/5 = 11080/5 = 2216
  // stdev = sqrt(2216) ~= 47.0744; CV = 47.0744/128*100 ~= 36.777 -> round1 = 36.8
  // in-range [70,180]: 100(y),150(y),200(n),60(n),130(y) = 3/5 = 60.0%
  const readings: DiabetesGlucoseReading[] = [
    { recordedAt: "2026-08-01T07:00:00.000Z", glucoseMgDl: 100, context: "fasting" },
    { recordedAt: "2026-08-01T13:00:00.000Z", glucoseMgDl: 150, context: "unspecified" },
    { recordedAt: "2026-08-02T13:00:00.000Z", glucoseMgDl: 200, context: "unspecified" },
    { recordedAt: "2026-08-02T22:00:00.000Z", glucoseMgDl: 60, context: "unspecified" },
    { recordedAt: "2026-08-03T07:00:00.000Z", glucoseMgDl: 130, context: "fasting" }
  ];
  assert.equal(readings.length, MIN_READINGS_FOR_DERIVATION);

  const signal = buildGlucoseSignal({ patientId: "UNIT-TEST" }, readings, "patient_state_ingest");
  assert.equal(signal.dataCompleteness, "sufficient");
  assert.equal(signal.tirPercent, 60, `expected TIR 60%, got ${signal.tirPercent}`);
  assert.equal(signal.variabilityScore, 36.8, `expected %CV ~36.8, got ${signal.variabilityScore}`);
  assert.deepEqual(signal.targetBand, DEFAULT_TARGET_BAND);
  assert.ok(
    signal.limitations.some((l) => l.includes("DEFAULT") && l.includes("OQ-DIAB-1")),
    "derived output must carry an explicit provisional/default-band limitation string"
  );

  console.log("Glucose v1.1: patient-state-ingested readings at the minimum count derive real TIR/%CV against hand-computed values.");
}

function testPostPrandialSpikePatternFires() {
  const readings: DiabetesGlucoseReading[] = [
    { recordedAt: "2026-08-01T07:00:00.000Z", glucoseMgDl: 110, context: "fasting" },
    { recordedAt: "2026-08-01T13:00:00.000Z", glucoseMgDl: 210, context: "post_prandial" }, // > 180 + 20
    { recordedAt: "2026-08-02T07:00:00.000Z", glucoseMgDl: 105, context: "fasting" },
    { recordedAt: "2026-08-02T13:00:00.000Z", glucoseMgDl: 120, context: "post_prandial" },
    { recordedAt: "2026-08-03T07:00:00.000Z", glucoseMgDl: 115, context: "fasting" }
  ];
  const signal = buildGlucoseSignal({ patientId: "UNIT-TEST" }, readings, "patient_state_ingest");
  assert.ok(signal.patternFlags.includes("post_prandial_spike_suspected"));

  console.log("Glucose v1.1: post_prandial_spike_suspected fires on a constructed spike reading.");
}

function testNocturnalHypoPatternFires() {
  const readings: DiabetesGlucoseReading[] = [
    { recordedAt: "2026-08-01T07:00:00.000Z", glucoseMgDl: 110, context: "fasting" },
    { recordedAt: "2026-08-01T22:00:00.000Z", glucoseMgDl: 65, context: "bedtime" }, // < 70
    { recordedAt: "2026-08-02T07:00:00.000Z", glucoseMgDl: 105, context: "fasting" },
    { recordedAt: "2026-08-02T13:00:00.000Z", glucoseMgDl: 120, context: "post_prandial" },
    { recordedAt: "2026-08-03T07:00:00.000Z", glucoseMgDl: 115, context: "fasting" }
  ];
  const signal = buildGlucoseSignal({ patientId: "UNIT-TEST" }, readings, "patient_state_ingest");
  assert.ok(signal.patternFlags.includes("nocturnal_hypo_suspected"));

  console.log("Glucose v1.1: nocturnal_hypo_suspected fires on a constructed bedtime-low reading.");
}

function testDawnPhenomenonPatternFires() {
  const readings: DiabetesGlucoseReading[] = [
    { recordedAt: "2026-08-01T13:00:00.000Z", glucoseMgDl: 130, context: "post_prandial" },
    { recordedAt: "2026-08-01T22:00:00.000Z", glucoseMgDl: 100, context: "bedtime" },
    { recordedAt: "2026-08-02T07:00:00.000Z", glucoseMgDl: 140, context: "fasting" }, // 100 -> 140, +40 >= 30
    { recordedAt: "2026-08-02T22:00:00.000Z", glucoseMgDl: 105, context: "bedtime" },
    { recordedAt: "2026-08-03T07:00:00.000Z", glucoseMgDl: 110, context: "fasting" } // 105 -> 110, +5 < 30, no repeat trigger needed
  ];
  const signal = buildGlucoseSignal({ patientId: "UNIT-TEST" }, readings, "patient_state_ingest");
  assert.ok(signal.patternFlags.includes("dawn_phenomenon_suspected"));

  console.log("Glucose v1.1: dawn_phenomenon_suspected fires on a constructed overnight-rise reading.");
}

function testCleanReadingSetTriggersNoPatternFlags() {
  const readings: DiabetesGlucoseReading[] = [
    { recordedAt: "2026-08-01T07:00:00.000Z", glucoseMgDl: 100, context: "fasting" },
    { recordedAt: "2026-08-01T13:00:00.000Z", glucoseMgDl: 150, context: "post_prandial" },
    { recordedAt: "2026-08-01T22:00:00.000Z", glucoseMgDl: 100, context: "bedtime" },
    { recordedAt: "2026-08-02T07:00:00.000Z", glucoseMgDl: 105, context: "fasting" },
    { recordedAt: "2026-08-02T22:00:00.000Z", glucoseMgDl: 110, context: "bedtime" }
  ];
  const signal = buildGlucoseSignal({ patientId: "UNIT-TEST" }, readings, "patient_state_ingest");
  assert.deepEqual(signal.patternFlags, [], "a clean, in-range, stable reading set should trigger zero named pattern flags");
  assert.equal(signal.dataCompleteness, "sufficient");
  assert.notEqual(signal.tirPercent, null);

  console.log("Glucose v1.1: a clean reading set derives real TIR/%CV but triggers zero pattern flags.");
}

function testRegressionFixtureCohortCompositeUnchanged() {
  // Every existing fixture-only cohort patient's Glucose signal must still be
  // an honest insufficient_data stub — D2 changes nothing for fixture data.
  const cohortIds = getDiabetesFixtureCohortIds();
  assert.ok(cohortIds.length > 0, "sanity: fixture cohort is non-empty");

  for (const patientId of cohortIds) {
    const contribution = buildDiabetesRiskContribution({ patientId, patientLabel: patientId });
    assert.equal(
      contribution.signals.glucose.tirPercent,
      null,
      `patient ${patientId}: fixture-sourced Glucose must remain insufficient_data after D2`
    );
    assert.equal(contribution.signals.glucose.variabilityScore, null);
    assert.deepEqual(contribution.signals.glucose.patternFlags, ["insufficient_data"]);
    assert.equal(contribution.signals.glucose.readingsSource, "fixture");
    assert.equal(contribution.signals.glucose.targetBand, undefined);
  }

  console.log(
    `Glucose v1.1: regression — all ${cohortIds.length} fixture cohort patients' composite Glucose output unchanged after D2.`
  );
}

function main() {
  testFixtureNeverDerivesRegardlessOfCount();
  testIngestedBelowMinimumStaysStub();
  testIngestedAtMinimumDerivesRealTirAndVariability();
  testPostPrandialSpikePatternFires();
  testNocturnalHypoPatternFires();
  testDawnPhenomenonPatternFires();
  testCleanReadingSetTriggersNoPatternFlags();
  testRegressionFixtureCohortCompositeUnchanged();
}

main();
