/**
 * Phase 2 — Diabetes glucose intelligence (synthetic, file-store path).
 * ehrWrite must stay false; TIR only when consensus sufficiency permits;
 * clinician Accept/Edit/Reject never writes EHR.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const tmp = mkdtempSync(path.join(tmpdir(), "diabetes-glucose-intel-"));
const prevCwd = process.cwd();
const prevDbUrl = process.env.DATABASE_URL;
const prevUsePg = process.env.USE_POSTGRES;
delete process.env.DATABASE_URL;
delete process.env.USE_POSTGRES;
process.chdir(tmp);

async function main() {
  const {
    seedAndBuildDiabetesGlucoseIntelligence,
    draftGlucoseIntelligenceReview,
    decideGlucoseIntelligenceReview,
    buildGlucoseIntelligenceWorklist,
    computeTirAnalytics,
    normalizeIngestPoint,
  } = await import("../lib/diabetes-intelligence");
  const { capability } = await import("../lib/status/capabilities");

  const scopeKey = `test_${Date.now()}`;
  const patientId = "P002";
  const now = Date.parse("2026-10-29T12:00:00.000Z");

  // Unit contracts
  const mmol = normalizeIngestPoint(
    { value: 180, unit: "mg/dL", recordedAt: "2026-10-29T12:00:00.000Z" },
    "cgm"
  );
  assert.ok(mmol.valueMmolL != null);
  assert.ok(Math.abs(mmol.valueMmolL! - 10) < 0.05);
  const hba = normalizeIngestPoint(
    { value: 7.0, unit: "%", recordedAt: "2026-10-29T12:00:00.000Z" },
    "lab_hba1c"
  );
  assert.ok(hba.valueMmolMol != null);

  const emptyTir = computeTirAnalytics([]);
  assert.equal(emptyTir.computed, false);
  assert.equal(emptyTir.sufficient, false);
  assert.equal(emptyTir.definition, "insufficient_data");

  let snap = await seedAndBuildDiabetesGlucoseIntelligence(patientId, {
    scopeKey,
    now,
    cgmDays: 16,
  });
  assert.equal(snap.synthetic, true);
  assert.equal(snap.ehrWrite, false);
  assert.equal(snap.hitlRequired, true);
  assert.equal(snap.clinicalValidationClaim, false);
  assert.ok(snap.cgm.readings.length > 100, "seeded CGM series");
  assert.ok(snap.smbg.readings.length >= 3, "seeded SMBG");
  assert.ok(snap.hba1c.series.length >= 2, "seeded HbA1c");
  assert.equal(snap.hba1c.trend, "worsening");
  assert.equal(snap.hba1c.isDiagnosticPrediction, false);
  assert.ok(snap.cgm.chart.length > 0, "glucose chart points");
  assert.equal(snap.cgm.tir.computed, true);
  assert.ok(
    snap.cgm.tir.explanations.some((e) => e.includes("Battelino")),
    "TIR explanations cite consensus"
  );
  assert.ok(snap.missingData.length >= 0);
  assert.ok(snap.dataCompleteness > 0.4);

  // Sparse SMBG patient still surfaces missing/quality indicators
  const sparse = await seedAndBuildDiabetesGlucoseIntelligence("P003", {
    scopeKey,
    now,
    cgmDays: 3,
  });
  assert.ok(
    sparse.missingData.some((m) => m.code === "tir_insufficient" || m.code === "hba1c_none" || m.code.startsWith("tir")),
    "short CGM window raises insufficiency"
  );
  assert.equal(sparse.cgm.tir.sufficient, false);

  snap = await draftGlucoseIntelligenceReview(patientId, {
    scopeKey,
    createdBy: "clinician@aksh.health",
    now,
  });
  const draft = snap.reviews.find((r) => r.status === "DRAFT");
  assert.ok(draft, "draft review created");
  assert.equal(draft.ehrWrite, false);
  assert.equal(draft.hitlRequired, true);
  assert.ok(draft.calculationExplanations.length >= 1);
  assert.ok(draft.summarySections.some((s) => s.id === "tir"));

  const worklist = await buildGlucoseIntelligenceWorklist({
    scopeKey,
    patientIds: [patientId, "P003"],
  });
  assert.ok(worklist.some((w) => w.patientId === patientId));
  assert.ok(worklist.every((w) => w.synthetic === true));

  snap = await decideGlucoseIntelligenceReview(
    {
      patientId,
      reviewId: draft.id,
      action: "accept",
      actor: "clinician@aksh.health",
    },
    { scopeKey }
  );
  const approved = snap.reviews.find((r) => r.id === draft.id);
  assert.equal(approved?.status, "APPROVED");
  assert.equal(approved?.ehrWrite, false);

  // Reject requires reason
  snap = await draftGlucoseIntelligenceReview(patientId, {
    scopeKey,
    createdBy: "clinician@aksh.health",
    now,
  });
  const draft2 = snap.reviews.find((r) => r.status === "DRAFT");
  assert.ok(draft2);
  let rejected = false;
  try {
    await decideGlucoseIntelligenceReview(
      {
        patientId,
        reviewId: draft2.id,
        action: "reject",
        actor: "clinician@aksh.health",
      },
      { scopeKey }
    );
  } catch {
    rejected = true;
  }
  assert.equal(rejected, true, "reject without reason fails");

  snap = await decideGlucoseIntelligenceReview(
    {
      patientId,
      reviewId: draft2.id,
      action: "reject",
      actor: "clinician@aksh.health",
      reason: "Insufficient wear for TIR-informed counselling",
    },
    { scopeKey }
  );
  assert.equal(snap.reviews.find((r) => r.id === draft2.id)?.status, "REJECTED");
  assert.equal(snap.ehrWrite, false);

  const cap = capability("diabetes_glucose_intelligence");
  assert.equal(cap.status, "synthetic_demo");
  assert.ok(cap.evidence.includes("tests/diabetes-glucose-intelligence.test.ts"));

  console.log("diabetes-glucose-intelligence: seed, TIR, HbA1c trend, worklist, HITL — PASS");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    process.chdir(prevCwd);
    if (prevDbUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = prevDbUrl;
    if (prevUsePg === undefined) delete process.env.USE_POSTGRES;
    else process.env.USE_POSTGRES = prevUsePg;
    rmSync(tmp, { recursive: true, force: true });
  });
