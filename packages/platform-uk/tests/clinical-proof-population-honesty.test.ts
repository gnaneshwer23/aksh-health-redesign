import assert from "node:assert/strict";

import { patients } from "../lib/mock-data/patients";
import { getDiabetesFixtureCohortIds } from "../lib/disease-modules/diabetes";
import { buildDiabetesPopulationAggregate } from "../lib/precision-health/population-diabetes";
import { MIN_POPULATION_CELL_SIZE, suppressSmallCell } from "../lib/precision-health/population-suppression";

/**
 * B6 (docs/PHASED_BUILD_PLAN.md) — population honesty + the diabetes population
 * aggregate.
 *
 * Run via `tsx` (not the tsc-compiled `.tmp-tests` commonjs bundle) because
 * `lib/precision-health/population-diabetes.ts` and `lib/disease-modules/diabetes`
 * use `@/`-aliased imports elsewhere in their own dependency graph, matching the
 * pattern established by `clinical-proof-patient-checkin.test.ts`.
 */

function run() {
  // --- FR-POP-031 / AC-POP-031-1: below-threshold counts are suppressed, never exact ---
  const belowThreshold = suppressSmallCell(3);
  assert.equal(belowThreshold.suppressed, true);
  assert.equal(belowThreshold.value, null, "a suppressed cell must never carry its true exact value");
  assert.equal(belowThreshold.display, `fewer than ${MIN_POPULATION_CELL_SIZE}`);

  const atThreshold = suppressSmallCell(MIN_POPULATION_CELL_SIZE);
  assert.equal(atThreshold.suppressed, false, "a count exactly at the threshold must not be suppressed");
  assert.equal(atThreshold.value, MIN_POPULATION_CELL_SIZE);

  const aboveThreshold = suppressSmallCell(42);
  assert.equal(aboveThreshold.suppressed, false);
  assert.equal(aboveThreshold.value, 42);
  assert.equal(aboveThreshold.display, "42");

  const zero = suppressSmallCell(0);
  assert.equal(zero.suppressed, true, "zero is below any positive threshold and must suppress, not show 0");

  const customThreshold = suppressSmallCell(7, 5);
  assert.equal(customThreshold.suppressed, false, "a caller-supplied threshold must override the default");

  // --- FR-POP-022/B6: the diabetes population aggregate is real, computed arithmetic ---
  const aggregate = buildDiabetesPopulationAggregate();
  assert.equal(aggregate.artifactType, "aksh-diabetes-population-aggregate");
  assert.equal(aggregate.stage, "segment");
  assert.equal(aggregate.cohortSource, "demo-cohort-100-patient");
  assert.equal(aggregate.hitlRequired, true);
  assert.equal(aggregate.ehrWrite, false, "B5/B3 null-lock pattern: population signal never writes to EHR");
  assert.equal(aggregate.autoRetrain, false, "no phase in B0-B7 unlocks autoRetrain");
  assert.equal(aggregate.minCellSize, MIN_POPULATION_CELL_SIZE);
  assert.equal(
    aggregate.totalPatients,
    patients.length,
    "must reflect the platform's actual synthetic cohort size, not the illustrative 47,832-patient fixture"
  );

  const expectedDiabetesCount = patients.filter((p) => p.clinicalProfiles?.includes("t2d")).length;
  const expectedSuppressed = expectedDiabetesCount < MIN_POPULATION_CELL_SIZE;
  assert.equal(aggregate.diabetesFlagged.suppressed, expectedSuppressed);
  if (expectedSuppressed) {
    assert.equal(aggregate.diabetesFlagged.value, null);
    assert.equal(
      aggregate.prevalencePercent,
      null,
      "FR-POP-032: a suppressed count must not be reverse-derivable via a displayed percentage"
    );
  } else {
    assert.equal(aggregate.diabetesFlagged.value, expectedDiabetesCount);
    assert.ok(typeof aggregate.prevalencePercent === "number");
  }

  // fixturedSignalPatients must never exceed diabetesFlagged, and complicationSignalPatients
  // must never exceed fixturedSignalPatients — each is a strict subset of the one before it.
  const fixturedIds = new Set(getDiabetesFixtureCohortIds());
  assert.ok(fixturedIds.size > 0, "diabetes fixture cohort must be non-empty for this assertion to be meaningful");
  if (!aggregate.fixturedSignalPatients.suppressed && !aggregate.diabetesFlagged.suppressed) {
    assert.ok((aggregate.fixturedSignalPatients.value ?? 0) <= (aggregate.diabetesFlagged.value ?? 0));
  }
  if (!aggregate.complicationSignalPatients.suppressed && !aggregate.fixturedSignalPatients.suppressed) {
    assert.ok((aggregate.complicationSignalPatients.value ?? 0) <= (aggregate.fixturedSignalPatients.value ?? 0));
  }

  assert.ok(aggregate.limitations.length > 0, "must be explicit about what this aggregate does not cover");
  assert.ok(
    aggregate.limitations.some((l) => l.includes("47,832")),
    "must explicitly distinguish itself from the illustrative static ICS fixture"
  );

  // Two independent calls over the same static fixture data must agree (deterministic, no AI Gateway call).
  const aggregateAgain = buildDiabetesPopulationAggregate();
  assert.deepEqual(
    { ...aggregate, generatedAt: null },
    { ...aggregateAgain, generatedAt: null },
    "the aggregate must be pure/deterministic given a fixed synthetic cohort"
  );

  console.log(
    `B6 population honesty checks passed (cohort=${aggregate.totalPatients}; diabetesFlagged=${aggregate.diabetesFlagged.display}; minCellSize=${MIN_POPULATION_CELL_SIZE}).`
  );
}

run();
