/**
 * One patient spine (platform map G1/G2, PRD Track B link): a care-network patient reaches CONDUCTOR and Aksh Diabetes
 * with their trusted CGM and HbA1c, under row-level security, clinicians only, and never in the real workspace.
 * Pure checks first; DB part skips without DATABASE_URL.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { commitUpload } from "../lib/cgm/service";
import { runClinicalSpineOrchestrate } from "../lib/clinical-spine/orchestrate";
import { hba1cPercent, loadSpinePatient, prepareSpinePatient } from "../lib/clinical-spine/spine-patient";
import { closePgPool, getPgPool, isPostgresConfigured } from "../lib/db/client";
import { assertNotProductionDatabase } from "../lib/db/deployment-guard";
import { buildGlucoseSignal } from "../lib/disease-modules/diabetes/glucose";
import { assertSeedingAllowed } from "../lib/env/deployment";
import { isClosedInRealWorkspace, isRealWorkspace } from "../lib/env/workspace";
import { getPatientById, registerSpinePatient } from "../lib/mock-data/patients";
import { updateOrganisation } from "../lib/network/admin";
import { loadNetworkContext } from "../lib/network/context";
import { acceptStaffInvite, createInvite, createOrganisation, importPatients, NetworkError } from "../lib/network/service";

function pure() {
  assert.equal(hba1cPercent(53), 7.0);
  assert.equal(hba1cPercent(48), 6.5);
  assert.ok(isClosedInRealWorkspace("/api/agents/orchestrate") && isClosedInRealWorkspace("/api/agents/horizon"));
  assert.ok(isClosedInRealWorkspace("/api/front-desk/state") && isClosedInRealWorkspace("/api/patients/P001"), "one slot fill: Front Desk closed in the real workspace");
  assert.ok(!isClosedInRealWorkspace("/api/network/patients") && !isClosedInRealWorkspace("/api/access/queue") && !isClosedInRealWorkspace("/api/agentsx"));

  const p001 = getPatientById("P001")!;
  registerSpinePatient({ ...p001, id: "spine-test-1", name: "Spine Test" });
  assert.equal(getPatientById("spine-test-1")?.name, "Spine Test", "registered care-network patients resolve for the agents");
  assert.equal(getPatientById("P001")?.name, p001.name, "the synthetic cohort is untouched");

  const readings = Array.from({ length: 60 }, (_, i) => ({ recordedAt: new Date(Date.now() - i * 3_600_000).toISOString(), glucoseMgDl: 120 + (i % 5) * 10 }));
  const ctx = { patientId: "x", patientLabel: "X" };
  const cgm = buildGlucoseSignal(ctx as never, readings, "care_network_cgm");
  assert.equal(cgm.dataCompleteness, "sufficient", "care-network CGM is a real source");
  assert.ok(cgm.limitations.some((l) => /care-network CGM/.test(l)));
  assert.equal(buildGlucoseSignal(ctx as never, readings, "fixture").dataCompleteness === "sufficient", false, "fixtures never derive");
  console.log("patient-spine: units, agent API gate, overlay, care_network_cgm derivation — PASS");
}

/** 14 days of 5-minute readings, mostly in range with a few lows. */
function csv() {
  const lines = ["timestamp,glucose mmol/L"];
  const end = Date.now() - 600_000;
  let i = 0;
  for (let t = end - 14 * 86_400_000; t < end; t += 300_000, i++) lines.push(`${new Date(t).toISOString()},${(i % 40 === 0 ? 3.4 : 6 + (i % 6) * 0.6).toFixed(1)}`);
  return lines.join("\n");
}

async function db() {
  if (!isPostgresConfigured()) return console.log("patient-spine: DB part skipped (no DATABASE_URL)");
  if (isRealWorkspace()) return console.log("patient-spine: DB part skipped (real workspace)");
  assertSeedingAllowed("patient-spine");
  await assertNotProductionDatabase(getPgPool(), "patient-spine");
  const tag = randomUUID().slice(0, 6);
  const mk = async (label: string) => {
    const id = randomUUID();
    await getPgPool().query(`INSERT INTO aksh.users (id, email, password_hash) VALUES ($1, $2, 'not-a-login')`, [id, `spine-${label}-${id.slice(0, 8)}@akshhealth.test`]);
    return id;
  };
  const nurseId = await mk("nurse");
  const org = await createOrganisation({ userId: nurseId, email: `sp-${tag}@akshhealth.test`, displayName: "Nurse", role: "nurse" }, { name: `Spine Clinic ${tag}`, kind: "diabetes_centre" });
  let nurse = await loadNetworkContext(nurseId, "nurse");
  await updateOrganisation(nurse, org.id, { locale: { timezone: "UTC" } });
  nurse = await loadNetworkContext(nurseId, "nurse");
  const day = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString().slice(0, 10);
  const [pt] = (await importPatients(nurse, org.id, { patients: [{
    recordRef: `SP-${tag}`, givenName: "Asha", familyName: "Spine", dateOfBirth: "1968-04-02", sex: "female", diabetesType: "type_2",
    observations: [
      { kind: "hba1c", value: 58, unit: "mmol/mol", observedAt: day(200), source: "lab" },
      { kind: "hba1c", value: 64, unit: "mmol/mol", observedAt: day(20), source: "lab" },
      { kind: "hba1c", value: 40, unit: "mmol/mol", observedAt: day(5), source: "patient_reported" },
      { kind: "systolic_bp", value: 142, unit: "mmHg", observedAt: day(20), source: "clinic" },
      { kind: "diastolic_bp", value: 86, unit: "mmHg", observedAt: day(20), source: "clinic" },
    ],
    medications: [{ name: "Metformin", dose: "1 g twice daily" }],
  }] } as never)) as unknown as { id: string }[];
  await commitUpload(nurse, pt!.id, csv(), undefined);

  const spine = await loadSpinePatient(nurse, pt!.id);
  assert.equal(spine.patient.name, "Asha Spine");
  assert.deepEqual(spine.patient.clinicalProfiles, ["t2d"]);
  assert.ok(spine.patient.activeMedications.includes("Metformin 1 g twice daily"));
  assert.equal(spine.patient.vitals?.bloodPressure, "142/86");
  assert.deepEqual(spine.careNetwork.hba1cReadings.map((r) => r.valuePercent), [7.5, 8.0], "unverified patient-reported HbA1c is not counted");
  assert.equal(spine.provenance.glucoseSource, "care_network_cgm");
  assert.ok(spine.provenance.cgmReadings > 3000);
  assert.ok(spine.careNetwork.glucoseReadings.every((r) => r.glucoseMgDl >= 55 && r.glucoseMgDl <= 200), "mmol/L converted to mg/dL");

  // Clinicians only; other organisations cannot load the patient.
  const mgrId = await mk("mgr");
  await acceptStaffInvite({ userId: mgrId, email: `sm-${tag}@akshhealth.test`, displayName: "Manager", role: "practice-manager" }, { code: (await createInvite(nurse, org.id, { kind: "staff", role: "practice-manager" })).code });
  await assert.rejects(loadSpinePatient(await loadNetworkContext(mgrId, "practice-manager"), pt!.id), (e: unknown) => e instanceof NetworkError && e.status === 403);
  const otherId = await mk("other");
  await createOrganisation({ userId: otherId, email: `so-${tag}@akshhealth.test`, displayName: "Other", role: "gp" }, { name: `Other ${tag}`, kind: "clinic" });
  await assert.rejects(loadSpinePatient(await loadNetworkContext(otherId, "gp"), pt!.id), (e: unknown) => e instanceof NetworkError && e.status === 404);

  // Track B is closed in the real workspace.
  process.env.AKSH_REAL_WORKSPACE = "true";
  try {
    await assert.rejects(loadSpinePatient(nurse, pt!.id), (e: unknown) => e instanceof NetworkError && e.status === 403 && /TRACK_B_NOT_OPEN/.test(e.message));
  } finally {
    delete process.env.AKSH_REAL_WORKSPACE;
  }

  // CONDUCTOR and Aksh Diabetes run on the care-network patient with their CGM.
  const prior = process.env.ENABLE_DIABETES_MODULE;
  process.env.ENABLE_DIABETES_MODULE = "true";
  try {
    const prepared = await prepareSpinePatient(nurse, pt!.id);
    const result = await runClinicalSpineOrchestrate({ patientId: prepared.patient.id, careNetwork: prepared.careNetwork, includeDrAssist: false, includeTwinRanking: false, actor: "patient-spine-test" });
    assert.equal(result.orchestration.sharedContext.patientId, pt!.id);
    assert.ok(result.diabetes, "diabetes contribution for a care-network type 2 patient");
    assert.equal(result.diabetes!.signals.glucose.readingsSource, "care_network_cgm");
    assert.equal(result.diabetes!.signals.glucose.dataCompleteness, "sufficient");
    assert.ok(result.diabetes!.signals.glucose.tirPercent! > 50);
    assert.equal(result.ehrWrite, false);
    assert.equal(result.hitlRequired, true);
  } finally {
    if (prior === undefined) delete process.env.ENABLE_DIABETES_MODULE;
    else process.env.ENABLE_DIABETES_MODULE = prior;
  }
  await new Promise((r) => setTimeout(r, 2000)); // let the fire-and-forget shield audit writes land before the pool closes
  console.log("patient-spine: care-network patient → CONDUCTOR + Aksh Diabetes (trusted CGM, verified HbA1c), clinicians only, RLS, Track B closed in the real workspace — PASS");
}

pure();
db().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => closePgPool());
