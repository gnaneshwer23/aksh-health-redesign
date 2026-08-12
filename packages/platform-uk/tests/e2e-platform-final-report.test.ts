/**
 * Stage 12 — Final E2E report contract.
 * Run: npm run test:e2e:platform-final-report
 */

import assert from "node:assert/strict";

import { GOLDEN_SCENARIOS } from "../lib/e2e/golden-scenarios";
import { generateE2EDataset } from "../lib/e2e/generator";
import {
  assertGoldenCoverageComplete,
  buildFinalE2EReportFromDataset,
  E2E_FINDINGS,
  GOLDEN_SCENARIO_COVERAGE,
  renderFinalE2EReportMarkdown,
  STAGE_COVERAGE,
} from "../lib/e2e/final-report";

function run() {
  const coverageErrors = assertGoldenCoverageComplete();
  assert.deepEqual(coverageErrors, [], coverageErrors.join("; "));
  assert.equal(GOLDEN_SCENARIO_COVERAGE.length, GOLDEN_SCENARIOS.length);
  assert.equal(GOLDEN_SCENARIOS.length, 21);
  assert.equal(STAGE_COVERAGE.length, 12);
  assert.ok(STAGE_COVERAGE.every((s) => s.status === "complete"));

  const dataset = generateE2EDataset({ seed: 20260812 });
  const report = buildFinalE2EReportFromDataset(dataset, { generatorTestsPass: true });

  assert.equal(report.artifactType, "aksh-e2e-final-platform-report");
  assert.equal(report.liveEmis, false);
  assert.equal(report.autoRetrain, false);
  assert.equal(report.isSynthetic, true);
  assert.equal(report.source, "AKSH_E2E_TEST");
  assert.equal(report.executiveSummary.overallStatus, "READY FOR INTERNAL TESTING");
  assert.equal(report.executiveSummary.goldenValidated, 21);
  assert.equal(report.executiveSummary.stagesComplete, 12);
  assert.equal(report.testPopulation.patients, 100);
  assert.ok(report.testPopulation.patientStateFacts >= 100);

  for (const layer of Object.values(report.architectureLoop)) {
    assert.equal(layer, "covered");
  }

  assert.equal(
    E2E_FINDINGS.filter((f) => f.severity === "P0" && f.blocksInternalTesting).length,
    0,
    "no P0 blockers for internal testing"
  );
  assert.ok(E2E_FINDINGS.some((f) => f.severity === "P1"));
  assert.ok(E2E_FINDINGS.some((f) => f.severity === "P2"));

  const md = renderFinalE2EReportMarkdown(report);
  assert.ok(md.includes("AKSH-E2E-0001"));
  assert.ok(md.includes("AKSH-E2E-0021"));
  assert.ok(md.includes("AKSH-E2E-0020"));
  assert.ok(md.includes("READY FOR INTERNAL TESTING"));
  assert.ok(md.includes("not production clinical"));
  assert.ok(md.includes("liveEmis"));

  const notReady = buildFinalE2EReportFromDataset(dataset, { generatorTestsPass: false });
  assert.equal(notReady.executiveSummary.overallStatus, "NOT READY");

  console.log(
    `E2E final report contract passed (${GOLDEN_SCENARIOS.length}/${GOLDEN_SCENARIOS.length} golden · 12/12 stages · findings=${E2E_FINDINGS.length} · status=${report.executiveSummary.overallStatus}).`
  );
}

run();
