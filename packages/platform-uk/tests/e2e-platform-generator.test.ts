import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertE2EGeneratorInvariants,
  generateE2EDataset,
} from "../lib/e2e/generator";
import { GOLDEN_SCENARIOS } from "../lib/e2e/golden-scenarios";
import { E2E_PERSONAS } from "../lib/e2e/personas";
import {
  assertCohortTrajectory,
  assertE2EDatasetValid,
  validateE2EDataset,
} from "../lib/e2e/validation";
import { E2E_DEFAULT_SEED, E2E_EMAIL_DOMAIN } from "../lib/e2e/types";

describe("E2E platform generator", () => {
  const seed = Number(process.env.E2E_REPORT_SEED) || E2E_DEFAULT_SEED;

  it("produces deterministic dataset for fixed seed", () => {
    const a = generateE2EDataset({ seed });
    const b = generateE2EDataset({ seed });
    assert.equal(a.manifest.batchId, b.manifest.batchId);
    assert.equal(a.patients[0]?.id, b.patients[0]?.id);
    assert.equal(a.patients[0]?.hba1cSeries[0]?.value, b.patients[0]?.hba1cSeries[0]?.value);
  });

  it("meets minimum ecosystem counts", () => {
    const dataset = generateE2EDataset({ seed });
    const inv = assertE2EGeneratorInvariants(dataset);
    assert.ok(inv.patients >= 100);
    assert.ok(inv.doctors >= 50);
    assert.ok(inv.nurses >= 30);
  });

  it("assigns cohorts A–H with expected totals", () => {
    const dataset = generateE2EDataset({ seed });
    const dist = dataset.manifest.scenarioDistribution;
    assert.equal(dist.A, 20);
    assert.equal(dist.B, 20);
    assert.equal(dist.C, 15);
    assert.equal(dist.D, 10);
    assert.equal(dist.E, 10);
    assert.equal(dist.F, 10);
    assert.equal(dist.G, 10);
    assert.equal(dist.H, 5);
  });

  it("passes data quality validation", () => {
    const dataset = generateE2EDataset({ seed });
    assertE2EDatasetValid(dataset);
    const warnings = validateE2EDataset(dataset).filter((i) => i.severity === "warning");
    assert.ok(warnings.length < 10);
  });

  it("encodes plausible cohort trajectories", () => {
    const dataset = generateE2EDataset({ seed });
    for (const cohort of ["A", "B", "H", "C"] as const) {
      const sample = dataset.patients.find((p) => p.cohortId === cohort);
      assert.ok(sample, `missing cohort ${cohort}`);
      assert.ok(assertCohortTrajectory(sample!), `trajectory failed for cohort ${cohort}`);
    }
  });

  it("tags all users with e2e email domain and synthetic metadata", () => {
    const dataset = generateE2EDataset({ seed });
    assert.ok(dataset.users.every((u) => u.email.endsWith(`@${E2E_EMAIL_DOMAIN}`)));
    assert.ok(dataset.users.every((u) => u.metadata.isSynthetic && u.metadata.liveEmis === false));
  });

  it("includes lab and pharmacy simulated events", () => {
    const dataset = generateE2EDataset({ seed });
    assert.ok(dataset.labEvents.length >= 100);
    assert.ok(dataset.pharmacyEvents.length >= 10);
    assert.ok(dataset.organisations.filter((o) => o.kind === "laboratory").length >= 10);
    assert.ok(dataset.organisations.filter((o) => o.kind === "pharmacy").length >= 10);
  });

  it("defines 21 golden scenarios", () => {
    assert.equal(GOLDEN_SCENARIOS.length, 21);
    assert.ok(GOLDEN_SCENARIOS.every((s) => s.testId.startsWith("AKSH-E2E-")));
  });

  it("defines reusable personas", () => {
    assert.ok(E2E_PERSONAS.length >= 10);
    assert.ok(E2E_PERSONAS.some((p) => p.id === "e2e.gp"));
    assert.ok(E2E_PERSONAS.some((p) => p.id === "e2e.patient.stable"));
  });
});
