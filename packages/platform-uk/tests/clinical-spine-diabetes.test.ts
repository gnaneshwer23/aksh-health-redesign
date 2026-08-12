/**
 * B3 — Diabetes disease intelligence module (docs/PHASED_BUILD_PLAN.md B3).
 *
 * Covers:
 *  1. Flag-off default: ENABLE_DIABETES_MODULE unset/false → orchestration
 *     output byte-identical to pre-B3 shape (FR-DIAB-022), diabetes: null.
 *  2. Flag-on but non-diabetes patient → still null (must be diabetes-flagged).
 *  3. Flag-on + diabetes-flagged patient → additive HORIZON/GUARDIAN merge,
 *     [Diabetes]-prefixed factors/flags, SHIELD audit payload fields.
 *  4. Unit-level builder checks: HbA1c trend/prediction, Complications
 *     evidence-count heuristic, Prevention composite, Insulin/GLP-1 null
 *     locks + hypo/side-effect flag propagation, Glucose stub-honesty
 *     (insufficient_data, no fabricated TIR/variability).
 *  5. Fail-open composite: areaFailures is always an array (empty in the
 *     normal case) and a malformed input never throws out of the composite.
 */

import assert from "node:assert/strict";

import {
  buildComplicationSignal,
  buildDiabetesRiskContribution,
  buildGlp1Signal,
  buildGlucoseSignal,
  buildHbA1cSignal,
  buildInsulinSignal,
  buildPreventionSignal,
  DIABETES_DEMO_PATIENT,
  getDiabetesFixtureBundle,
  getDiabetesFixtureCohortIds
} from "../lib/disease-modules/diabetes";
import { isDiabetesModuleEnabled } from "../lib/integration-config";
import {
  getClinicalSpineOrchestrateCapabilities,
  runClinicalSpineOrchestrate
} from "../lib/clinical-spine/orchestrate";

async function run() {
  process.env.ENABLE_LLM_SYNTHESIS = "false";
  process.env.ENABLE_LLM_GUARDIAN = "false";
  process.env.ENABLE_LLM_ORACLE = "false";
  process.env.ENABLE_LLM_DR_ASSIST = "false";
  process.env.ENABLE_LLM_NEXUS = "false";

  // ==========================================================================
  // 1. Flag default / capabilities honesty
  // ==========================================================================
  delete process.env.ENABLE_DIABETES_MODULE;
  assert.equal(isDiabetesModuleEnabled(), false, "ENABLE_DIABETES_MODULE must default to false when unset");

  const capsOff = getClinicalSpineOrchestrateCapabilities();
  assert.equal(capsOff.diabetesModule.enabled, false);
  assert.equal(capsOff.diabetesModule.flag, "ENABLE_DIABETES_MODULE");
  assert.equal(capsOff.diabetesModule.defaultEnabled, false);

  // --- Flag OFF: P002 (diabetes-flagged) orchestration unaffected ---
  const flagOffResult = await runClinicalSpineOrchestrate({
    patientId: "P002",
    includeDrAssist: false,
    includeTwinRanking: false,
    actor: "diabetes-test@aksh.health"
  });
  assert.equal(flagOffResult.diabetesModuleEnabled, false);
  assert.equal(flagOffResult.diabetes, null);
  assert.ok(!flagOffResult.note.includes("Diabetes module (B3) enabled"));
  assert.ok(
    !flagOffResult.orchestration.outputs.ORACLE?.contributingFactors.some((f) => f.startsWith("[Diabetes]")),
    "flag-off ORACLE output must carry no [Diabetes] factors"
  );
  assert.ok(
    !flagOffResult.orchestration.outputs.GUARDIAN?.safetyNotes.some((f) => f.startsWith("[Diabetes]")),
    "flag-off GUARDIAN output must carry no [Diabetes] safety notes"
  );

  // ==========================================================================
  // 2. Flag ON but patient not diabetes-flagged → still gated (null)
  // ==========================================================================
  process.env.ENABLE_DIABETES_MODULE = "true";
  assert.equal(isDiabetesModuleEnabled(), true);

  const capsOn = getClinicalSpineOrchestrateCapabilities();
  assert.equal(capsOn.diabetesModule.enabled, true);

  // P001 (Mrs Eleanor Whitfield fixture) carries no "t2d" clinicalProfile.
  const nonDiabetesResult = await runClinicalSpineOrchestrate({
    patientId: "P001",
    includeDrAssist: false,
    includeTwinRanking: false,
    actor: "diabetes-test@aksh.health"
  });
  assert.equal(nonDiabetesResult.diabetesModuleEnabled, true);
  assert.equal(
    nonDiabetesResult.diabetes,
    null,
    "flag on + non-diabetes patient must still yield diabetes: null (FR-DIAB gate requires clinicalProfiles t2d)"
  );

  // ==========================================================================
  // 3. Flag ON + diabetes-flagged patient (P002 — worsening HbA1c, neuropathy watch)
  // ==========================================================================
  const diabetesResult = await runClinicalSpineOrchestrate({
    patientId: "P002",
    includeDrAssist: false,
    includeTwinRanking: false,
    actor: "diabetes-test@aksh.health",
    caseId: "diabetes-test-case-p002"
  });
  assert.equal(diabetesResult.diabetesModuleEnabled, true);
  assert.ok(diabetesResult.diabetes, "P002 is diabetes-flagged — contribution must be populated");
  assert.ok(diabetesResult.note.includes("Diabetes module (B3) enabled"));

  const contribution = diabetesResult.diabetes!;
  assert.equal(contribution.patientId, "P002");
  assert.equal(contribution.hitlRequired, true);
  assert.equal(contribution.ehrWrite, false);
  assert.equal(contribution.autoRetrain, false);
  assert.deepEqual(contribution.areaFailures, [], "normal fixture path should not degrade any area");

  // HbA1c must remain clinically "worsening" for P002.
  // Fixture path: 7.4% → 8.1%. Patient-State ingest path (when Neon has golden
  // re-ingests for P002): series may end at 8.4% but trend must still be
  // worsening after same-timestamp dedupe (P1 DETECT integrity).
  assert.equal(contribution.signals.hba1c.trend, "worsening");
  assert.equal(contribution.signals.hba1c.isDiagnosticPrediction, false);
  if (contribution.signals.hba1c.readingsSource === "fixture") {
    assert.equal(contribution.signals.hba1c.latestValuePercent, 8.1);
  } else {
    assert.equal(contribution.signals.hba1c.readingsSource, "patient_state_ingest");
    assert.ok(
      typeof contribution.signals.hba1c.latestValuePercent === "number" &&
        contribution.signals.hba1c.latestValuePercent >= 8.0,
      `ingest-backed P002 latest HbA1c should remain elevated, got ${contribution.signals.hba1c.latestValuePercent}`
    );
  }

  // Complications: neuropathy has exactly one evidence ref => "watch"
  const neuropathy = contribution.signals.complications.find((c) => c.domain === "neuropathy");
  assert.ok(neuropathy);
  assert.equal(neuropathy!.flagLevel, "watch");
  assert.equal(neuropathy!.referralGate, "referral_pathway");

  // Prevention composite: worsening HbA1c => worsening trajectory
  assert.equal(contribution.signals.prevention.riskTrajectoryLabel, "worsening");
  assert.ok(contribution.signals.prevention.personalisedPriorities.length > 0);

  // Insulin/GLP-1 null locks preserved even with real regimen data present
  assert.equal(contribution.signals.insulin.doseChangeRecommendation, null);
  assert.equal(contribution.signals.insulin.isDoseRecommendation, false);
  assert.equal(contribution.signals.insulin.hypoRiskFlag, false); // P002 regimen has 0 hypo events
  assert.equal(contribution.signals.glp1.prescribingRecommendation, null);
  assert.equal(contribution.signals.glp1.isPrescribingRecommendation, false);

  // Glucose stays an honest stub — never fabricates TIR/variability, even with readings present
  assert.equal(contribution.signals.glucose.tirPercent, null);
  assert.equal(contribution.signals.glucose.variabilityScore, null);
  assert.deepEqual(contribution.signals.glucose.patternFlags, ["insufficient_data"]);

  // Additive merge into ORACLE/GUARDIAN — existing (non-diabetes) content preserved, [Diabetes]-prefixed additions appended
  const baseline = await runClinicalSpineOrchestrate({
    patientId: "P002",
    includeDrAssist: false,
    includeTwinRanking: false,
    actor: "diabetes-test@aksh.health"
  }).then(async (withFlagOn) => {
    // Compute the pre-B3 baseline by temporarily disabling the flag.
    process.env.ENABLE_DIABETES_MODULE = "false";
    const off = await runClinicalSpineOrchestrate({
      patientId: "P002",
      includeDrAssist: false,
      includeTwinRanking: false,
      actor: "diabetes-test@aksh.health"
    });
    process.env.ENABLE_DIABETES_MODULE = "true";
    return { withFlagOn, off };
  });
  const baseOracleFactors = baseline.off.orchestration.outputs.ORACLE?.contributingFactors ?? [];
  const onOracleFactors = baseline.withFlagOn.orchestration.outputs.ORACLE?.contributingFactors ?? [];
  assert.ok(
    baseOracleFactors.every((f) => onOracleFactors.includes(f)),
    "flag-on must preserve every pre-existing ORACLE contributing factor (additive only)"
  );
  assert.ok(
    onOracleFactors.length > baseOracleFactors.length,
    "flag-on must append additional [Diabetes] ORACLE contributing factors"
  );
  assert.ok(onOracleFactors.filter((f) => f.startsWith("[Diabetes]")).length >= 1);

  // ==========================================================================
  // 4. GUARDIAN hypo safety flag propagation (P026 — 2 reported hypo events)
  // ==========================================================================
  const p026Result = await runClinicalSpineOrchestrate({
    patientId: "P026",
    includeDrAssist: false,
    includeTwinRanking: false,
    actor: "diabetes-test@aksh.health"
  });
  assert.ok(p026Result.diabetes, "P026 is diabetes-flagged");
  assert.equal(p026Result.diabetes!.signals.insulin.hypoRiskFlag, true);
  assert.ok(
    p026Result.orchestration.outputs.GUARDIAN?.safetyNotes.some(
      (n) => n.startsWith("[Diabetes]") && n.toLowerCase().includes("hypo")
    ),
    "GUARDIAN safetyNotes must carry the [Diabetes]-prefixed hypo flag for P026"
  );
  // P026 has a single HbA1c reading — trend must be insufficient_data, never fabricated
  assert.equal(p026Result.diabetes!.signals.hba1c.trend, "insufficient_data");
  assert.equal(p026Result.diabetes!.signals.hba1c.predictedNext3MonthsPercent, null);

  // ==========================================================================
  // 5. Improving patient (P007 — well-controlled, no complications)
  // ==========================================================================
  const p007Result = await runClinicalSpineOrchestrate({
    patientId: "P007",
    includeDrAssist: false,
    includeTwinRanking: false,
    actor: "diabetes-test@aksh.health"
  });
  assert.ok(p007Result.diabetes);
  assert.equal(p007Result.diabetes!.signals.hba1c.trend, "improving");
  assert.ok(p007Result.diabetes!.signals.complications.every((c) => c.flagLevel === "none"));
  assert.equal(p007Result.diabetes!.signals.prevention.riskTrajectoryLabel, "improving");

  // ==========================================================================
  // 6. SHIELD audit payload — diabetes fields present and honest
  // ==========================================================================
  // persistShieldAuditEvent runs in a sandboxed/no-DB test environment (see
  // tests/clinical-proof-shield.test.ts) — this suite checks the orchestrate
  // result surface, not the DB write itself, matching that established pattern.
  assert.equal(diabetesResult.ehrWrite, false);
  assert.equal(diabetesResult.hitlRequired, true);
  assert.equal(diabetesResult.autoRetrain, false);
  assert.equal(diabetesResult.liveEmis, false);
  assert.equal(diabetesResult.physiologicalTwin, false);

  // Reset the flag to its safe default for any subsequent test process reuse.
  process.env.ENABLE_DIABETES_MODULE = "false";

  // ==========================================================================
  // 7. Unit-level builder checks (isolated from orchestration / fixtures)
  // ==========================================================================

  // --- HbA1c: no readings -> insufficient_data, never fabricates a value ---
  const hba1cNone = buildHbA1cSignal({ patientId: "UNIT-TEST" }, []);
  assert.equal(hba1cNone.trend, "insufficient_data");
  assert.equal(hba1cNone.latestValuePercent, null);
  assert.equal(hba1cNone.predictedNext3MonthsPercent, null);

  // --- HbA1c: one reading -> insufficient_data (needs >=2 for a trend) ---
  const hba1cOne = buildHbA1cSignal({ patientId: "UNIT-TEST" }, [
    { recordedAt: "2026-01-01T00:00:00.000Z", valuePercent: 7.0 }
  ]);
  assert.equal(hba1cOne.trend, "insufficient_data");
  assert.equal(hba1cOne.latestValuePercent, 7.0);

  // --- HbA1c: two readings, improving ---
  const hba1cImproving = buildHbA1cSignal({ patientId: "UNIT-TEST" }, [
    { recordedAt: "2026-01-01T00:00:00.000Z", valuePercent: 8.0 },
    { recordedAt: "2026-04-01T00:00:00.000Z", valuePercent: 7.4 }
  ]);
  assert.equal(hba1cImproving.trend, "improving");
  assert.ok(hba1cImproving.predictedNext3MonthsPercent !== null);
  assert.equal(hba1cImproving.isDiagnosticPrediction, false);

  // --- HbA1c: two readings, stable (delta within band) ---
  const hba1cStable = buildHbA1cSignal({ patientId: "UNIT-TEST" }, [
    { recordedAt: "2026-01-01T00:00:00.000Z", valuePercent: 7.0 },
    { recordedAt: "2026-04-01T00:00:00.000Z", valuePercent: 7.05 }
  ]);
  assert.equal(hba1cStable.trend, "stable");

  // --- HbA1c: extreme delta clamps to plausible range, never returns an implausible value ---
  const hba1cExtreme = buildHbA1cSignal({ patientId: "UNIT-TEST" }, [
    { recordedAt: "2026-01-01T00:00:00.000Z", valuePercent: 6.0 },
    { recordedAt: "2026-01-15T00:00:00.000Z", valuePercent: 14.5 }
  ]);
  assert.ok(hba1cExtreme.predictedNext3MonthsPercent === null || hba1cExtreme.predictedNext3MonthsPercent! <= 15);

  // --- Complications: evidence-count heuristic (0/1/2+) ---
  const complicationsNone = buildComplicationSignal({ patientId: "UNIT-TEST" }, "retinopathy", []);
  assert.equal(complicationsNone.flagLevel, "none");
  const complicationsWatch = buildComplicationSignal({ patientId: "UNIT-TEST" }, "retinopathy", ["ref-1"]);
  assert.equal(complicationsWatch.flagLevel, "watch");
  const complicationsReferral = buildComplicationSignal({ patientId: "UNIT-TEST" }, "retinopathy", [
    "ref-1",
    "ref-2"
  ]);
  assert.equal(complicationsReferral.flagLevel, "referral_indicated");
  assert.equal(complicationsReferral.referralGate, "referral_pathway");

  // --- Prevention: composite reacts to inputs, insufficient_data with none supplied ---
  const preventionEmpty = buildPreventionSignal({ patientId: "UNIT-TEST" });
  assert.equal(preventionEmpty.riskTrajectoryLabel, "insufficient_data");
  const preventionWorsening = buildPreventionSignal(
    { patientId: "UNIT-TEST" },
    { hba1c: hba1cImproving.trend === "improving" ? { ...hba1cImproving, trend: "worsening" } : hba1cImproving }
  );
  assert.equal(preventionWorsening.riskTrajectoryLabel, "worsening");

  // --- Insulin: hard null lock always holds, hypo flag driven by data ---
  const insulinNoHypo = buildInsulinSignal({ patientId: "UNIT-TEST" }, {
    medications: ["Metformin"],
    reportedHypoEventCount: 0
  });
  assert.equal(insulinNoHypo.doseChangeRecommendation, null);
  assert.equal(insulinNoHypo.hypoRiskFlag, false);
  const insulinHypo = buildInsulinSignal({ patientId: "UNIT-TEST" }, {
    medications: ["Insulin glargine"],
    reportedHypoEventCount: 3
  });
  assert.equal(insulinHypo.doseChangeRecommendation, null, "null lock must hold even with hypo events present");
  assert.equal(insulinHypo.hypoRiskFlag, true);
  assert.ok(insulinHypo.timingObservations.length > 0);

  // --- GLP-1: hard null lock always holds, side-effect flags passthrough ---
  const glp1NoSideEffects = buildGlp1Signal({ patientId: "UNIT-TEST" }, []);
  assert.equal(glp1NoSideEffects.prescribingRecommendation, null);
  assert.deepEqual(glp1NoSideEffects.sideEffectFlags, []);
  const glp1WithSideEffects = buildGlp1Signal({ patientId: "UNIT-TEST" }, ["Nausea reported"]);
  assert.equal(glp1WithSideEffects.prescribingRecommendation, null, "null lock must hold even with side effects present");
  assert.deepEqual(glp1WithSideEffects.sideEffectFlags, ["Nausea reported"]);

  // --- Glucose: honest stub regardless of reading count — never fabricates TIR ---
  const glucoseNone = buildGlucoseSignal({ patientId: "UNIT-TEST" }, []);
  assert.equal(glucoseNone.dataCompleteness, "none");
  assert.equal(glucoseNone.tirPercent, null);
  const glucoseSome = buildGlucoseSignal({ patientId: "UNIT-TEST" }, [
    { recordedAt: "2026-01-01T00:00:00.000Z", glucoseMgDl: 140 }
  ]);
  assert.equal(glucoseSome.tirPercent, null, "must never fabricate TIR even when readings are present (OQ-DIAB-1 open)");
  assert.equal(glucoseSome.dataCompleteness, "partial");

  // --- Composite: DEMO-DIABETES-P1 fixture end-to-end sanity ---
  const demoContribution = buildDiabetesRiskContribution(DIABETES_DEMO_PATIENT);
  assert.equal(demoContribution.patientId, DIABETES_DEMO_PATIENT.patientId);
  assert.deepEqual(demoContribution.areaFailures, []);
  assert.equal(demoContribution.signals.insulin.doseChangeRecommendation, null);
  assert.equal(demoContribution.signals.glp1.prescribingRecommendation, null);
  assert.ok(demoContribution.coachingDrafts.length === 3);
  assert.ok(demoContribution.coachingDrafts.every((d) => d.isClinicalAdvice === false && d.hitlRequired === true));

  // --- Composite: unknown patient id -> empty fixture bundle, never throws, never fabricates ---
  const unknownContribution = buildDiabetesRiskContribution({ patientId: "NOT-A-REAL-PATIENT" });
  assert.deepEqual(unknownContribution.areaFailures, []);
  assert.equal(unknownContribution.signals.hba1c.trend, "insufficient_data");
  assert.equal(unknownContribution.signals.glucose.dataCompleteness, "none");
  assert.equal(getDiabetesFixtureBundle("NOT-A-REAL-PATIENT").hba1cReadings.length, 0);

  // --- Fixture cohort coverage sanity ---
  const cohortIds = getDiabetesFixtureCohortIds();
  for (const id of ["P002", "P007", "P017", "P020", "P026", DIABETES_DEMO_PATIENT.patientId]) {
    assert.ok(cohortIds.includes(id), `expected diabetes fixture cohort to include ${id}`);
  }

  console.log(
    `Diabetes module (B3) checks passed (flag-off preserved baseline; flag-on additive for ${cohortIds.length} fixture patients; areaFailures empty on the happy path).`
  );
}

void run();
