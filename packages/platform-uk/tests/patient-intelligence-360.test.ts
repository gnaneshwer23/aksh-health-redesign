/**
 * Patient 360 foundation — synthetic spine (file-store path).
 * ehrWrite and autonomousPrescribe must stay false.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const tmp = mkdtempSync(path.join(tmpdir(), "patient-360-"));
const prevCwd = process.cwd();
const prevDbUrl = process.env.DATABASE_URL;
const prevUsePg = process.env.USE_POSTGRES;
delete process.env.DATABASE_URL;
delete process.env.USE_POSTGRES;
process.chdir(tmp);

async function main() {
  const {
    buildPatient360,
    seedAndBuildPatient360,
    startMedicationReconciliation,
    decideMedicationReconciliation,
    patient360ToFhirBundle,
    assessPatient360Quality,
  } = await import("../lib/patient-intelligence");

  const scopeKey = `test_${Date.now()}`;
  const patientId = "P002";

  // Quality helper on empty spine
  const emptyQ = assessPatient360Quality({
    hasNhsNumber: false,
    conditions: [],
    allergies: [],
    familyHistory: [],
    diabetes: null,
    encounters: [],
    observations: [],
    medicationsCount: 0,
    careTeamCount: 0,
    sharing: [],
  });
  assert.ok(emptyQ.indicators.some((i) => i.code === "missing_conditions"));
  assert.ok(emptyQ.dataCompleteness < 0.5);

  let profile = await buildPatient360(patientId, { scopeKey });
  assert.equal(profile.synthetic, true);
  assert.equal(profile.ehrWrite, false);
  assert.equal(profile.autonomousPrescribe, false);
  assert.equal(profile.hitlRequired, true);
  assert.equal(profile.identity.displayName.includes("Patel"), true);

  profile = await seedAndBuildPatient360(patientId, {
    scopeKey,
    actor: "test@aksh.health",
  });
  assert.ok(profile.conditions.length >= 1, "seeded conditions");
  assert.ok(profile.allergies.length >= 1, "seeded allergies (or NKDA)");
  assert.ok(profile.familyHistory.length >= 1, "seeded family history");
  assert.ok(profile.diabetes, "diabetes profile present");
  assert.equal(profile.diabetes?.diabetesType, "type_2");
  assert.ok(profile.encounters.length >= 1, "seeded encounter");
  assert.ok(profile.observations.length >= 1, "seeded observations");
  assert.ok(profile.careTeam.some((c) => c.status === "active"));
  assert.ok(profile.sharingPreferences.some((s) => s.purpose === "direct_care"));
  assert.ok(profile.dataCompleteness > 0.5);
  assert.ok(profile.timeline.some((e) => e.kind === "diabetes"));
  assert.ok(profile.timeline.every((e) => e.ehrWrite === false));

  // Medication reconciliation scaffolding
  profile = await startMedicationReconciliation(patientId, {
    scopeKey,
    createdBy: "clinician@aksh.health",
  });
  const pending = profile.medicationReconciliations.find(
    (r) => r.status === "pending_clinician"
  );
  assert.ok(pending, "med recon run created");
  assert.equal(pending.ehrWrite, false);
  assert.equal(pending.autonomousPrescribe, false);
  assert.equal(pending.hitlRequired, true);
  assert.ok(
    pending.discrepancies.some((d) => d.code === "proposed_medication"),
    "P002 has proposed apixaban discrepancy"
  );

  profile = await decideMedicationReconciliation(
    {
      patientId,
      runId: pending.id,
      action: "complete",
      actor: "clinician@aksh.health",
      note: "Reviewed — no prescribe",
    },
    { scopeKey }
  );
  const done = profile.medicationReconciliations.find((r) => r.id === pending.id);
  assert.equal(done?.status, "completed");
  assert.equal(done?.ehrWrite, false);
  assert.equal(done?.autonomousPrescribe, false);

  // FHIR bundle shape
  const bundle = patient360ToFhirBundle(profile);
  assert.equal(bundle.resourceType, "Bundle");
  assert.equal(bundle.ehrWrite, false);
  assert.ok(bundle.entry.some((e) => e.resource.resourceType === "Patient"));
  assert.ok(bundle.entry.some((e) => e.resource.resourceType === "Condition"));
  assert.ok(bundle.entry.some((e) => e.resource.resourceType === "AllergyIntolerance"));

  // Journey wire-in: structured history preferred after seed
  const { buildClinicalHistoryAsync } = await import("../lib/diabetes-intelligence/journey");
  const history = await buildClinicalHistoryAsync(patientId, { scopeKey });
  assert.ok(history.conditions.some((c) => /diabetes/i.test(c)));

  console.log("patient-intelligence-360: PASS");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    process.chdir(prevCwd);
    if (prevDbUrl !== undefined) process.env.DATABASE_URL = prevDbUrl;
    else delete process.env.DATABASE_URL;
    if (prevUsePg !== undefined) process.env.USE_POSTGRES = prevUsePg;
    else delete process.env.USE_POSTGRES;
    try {
      rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });
