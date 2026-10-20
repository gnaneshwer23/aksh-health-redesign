/**
 * Laboratory results: the catalogue (units, LOINC, ranges), the FHIR mapping and routing (pure), then the connector
 * path against the simulation database — stored with provenance, duplicates ignored, a corrected result replaces the
 * original without deleting it, a changed "final" value refused, and the patient record reads the corrected value.
 * Manual entry converts units and refuses implausible values.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { labFromFhir, observationRoute } from "../lib/connector/fhir";
import { authenticate, createKey, receiveObservations } from "../lib/connector/service";
import { closePgPool, getPgPool, isPostgresConfigured } from "../lib/db/client";
import { assertNotProductionDatabase } from "../lib/db/deployment-guard";
import { LAB_CATALOG, labKindForLoinc, normaliseLab } from "../lib/labs/catalog";
import { loadNetworkContext } from "../lib/network/context";
import { loadSpinePatient } from "../lib/clinical-spine/spine-patient";
import { getPatientDetail } from "../lib/network/read";
import { acceptStaffInvite, addPatientRecord, createInvite, createOrganisation, importPatients } from "../lib/network/service";

const at = "2026-10-01T09:00:00Z";
const obs = (id: string, loinc: string, value: number, unit: string, extra: Record<string, unknown> = {}) => ({
  resourceType: "Observation",
  id,
  status: "final",
  category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "laboratory" }] }],
  code: { coding: [{ system: "http://loinc.org", code: loinc }] },
  subject: { identifier: { value: "MRN-1" } },
  effectiveDateTime: at,
  valueQuantity: { value, unit, system: "http://unitsofmeasure.org", code: unit },
  ...extra,
});

function pure() {
  // Conversions to the stored unit.
  const a1c = normaliseLab("hba1c", 7, "%");
  assert.ok(a1c.ok && a1c.value === 53 && a1c.unit === "mmol/mol" && a1c.originalUnit === "%");
  const ldl = normaliseLab("ldl", 100, "mg/dL");
  assert.ok(ldl.ok && ldl.value === 2.6);
  const cr = normaliseLab("creatinine", 1, "mg/dL");
  assert.ok(cr.ok && cr.value === 88);
  const crUmol = normaliseLab("creatinine", 88, "µmol/L");
  assert.ok(crUmol.ok && crUmol.value === 88, "µ and u spellings are the same unit");
  const acr = normaliseLab("acr", 30, "mg/g");
  assert.ok(acr.ok && acr.value === 3.4);
  const tg = normaliseLab("triglycerides", 150, "mg/dL");
  assert.ok(tg.ok && tg.value === 1.7);
  const egfr = normaliseLab("egfr", 58, "mL/min/{1.73_m2}");
  assert.ok(egfr.ok && egfr.value === 58);
  // Unknown units and implausible values are refused, not guessed or clamped.
  const noUnit = normaliseLab("egfr", 58, "mL/min");
  assert.ok(!noUnit.ok && noUnit.code === "UNKNOWN_UNIT", "creatinine clearance is not eGFR");
  const typo = normaliseLab("hba1c", 530, "mmol/mol");
  assert.ok(!typo.ok && typo.code === "OUT_OF_RANGE");
  const pctAsMmol = normaliseLab("hba1c", 7.2, "mmol/mol");
  assert.ok(!pctAsMmol.ok && pctAsMmol.code === "OUT_OF_RANGE", "a percent value sent as mmol/mol is caught");

  // LOINC mapping: every code maps to exactly one kind.
  const all = Object.values(LAB_CATALOG).flatMap((d) => d.loinc);
  assert.equal(new Set(all).size, all.length, "no LOINC code is listed twice");
  assert.equal(labKindForLoinc("4548-4"), "hba1c");
  assert.equal(labKindForLoinc("33914-3"), "egfr");
  assert.equal(labKindForLoinc("0000-0"), null);

  // Routing: labs go to the record; device glucose stays in the CGM stream.
  assert.equal(observationRoute(obs("r1", "4548-4", 7, "%")), "lab");
  assert.equal(observationRoute(obs("r2", "2345-7", 6.1, "mmol/L")), "lab", "glucose marked laboratory is a lab result");
  assert.equal(observationRoute({ ...obs("r3", "2345-7", 6.1, "mmol/L"), category: undefined }), "glucose", "device glucose unchanged");
  assert.equal(observationRoute({ ...obs("r4", "15074-8", 6.1, "mmol/L"), category: undefined }), "glucose");

  // Mapping details.
  const m = labFromFhir(obs("o1", "2093-3", 200, "mg/dL"));
  assert.ok(m.ok && m.kind === "total_cholesterol" && m.value === 5.2 && m.loinc === "2093-3" && !m.corrected);
  assert.ok(!labFromFhir(obs("o2", "4548-4", 7, "%", { valueQuantity: { value: 7, comparator: ">", unit: "%" } })).ok, "bounds are not results");
  const prelim = labFromFhir(obs("o3", "4548-4", 7, "%", { status: "preliminary" }));
  assert.ok(!prelim.ok && prelim.code === "IGNORED_STATUS");
  const noId = labFromFhir({ ...obs("x", "4548-4", 7, "%"), id: undefined });
  assert.ok(!noId.ok && noId.code === "MISSING_ID");
  const amended = labFromFhir(obs("o4", "4548-4", 7.1, "%", { status: "amended" }));
  assert.ok(amended.ok && amended.corrected);
  const wrongSystem = labFromFhir(obs("o5", "4548-4", 7, "%", { code: { coding: [{ system: "http://snomed.info/sct", code: "4548-4" }] } }));
  assert.ok(!wrongSystem.ok && wrongSystem.code === "UNKNOWN_CODE", "a code from another system is not read as LOINC");
}

async function run() {
  pure();
  if (!isPostgresConfigured()) return console.log("lab-results: pure checks PASS; DB part skipped (no DATABASE_URL)");
  await assertNotProductionDatabase(getPgPool(), "test");
  const tag = randomUUID().slice(0, 6);
  const userId = randomUUID();
  const email = `labs-${tag}@akshhealth.test`;
  await getPgPool().query(`INSERT INTO aksh.users (id, email, password_hash) VALUES ($1, $2, 'not-a-login')`, [userId, email]);
  const admin = { userId, email, displayName: "Lab Admin", role: "practice-manager" };
  const org = await createOrganisation(admin, { name: `Lab Clinic ${tag}`, kind: "clinic" });
  const ctx = await loadNetworkContext(userId, admin.role);
  const mrn = `MRN-L-${tag}`;
  const [patient] = (await importPatients(ctx, org.id, { patients: [{ recordRef: mrn, givenName: "Lia", familyName: "Lab", dateOfBirth: "1958-03-03" }] } as never)) as unknown as { id: string }[];
  const key = await authenticate(`Bearer ${(await createKey(ctx, org.id, { name: "Lab feed", config: {} })).key}`);
  const forPatient = (o: ReturnType<typeof obs>) => ({ ...o, subject: { identifier: { value: mrn } } });
  try {
    const first = await receiveObservations(key, {
      resourceType: "Bundle",
      entry: [
        { resource: forPatient(obs(`a1c-${tag}`, "4548-4", 8, "%")) },
        { resource: forPatient(obs(`egfr-${tag}`, "33914-3", 52, "mL/min/{1.73_m2}")) },
        { resource: forPatient(obs(`ldl-${tag}`, "13457-7", 130, "mg/dL")) },
        { resource: forPatient(obs(`bad-${tag}`, "4548-4", 8, "mmol/mol")) },
        { resource: { ...obs(`who-${tag}`, "4548-4", 8, "%"), subject: { identifier: { value: "NOBODY" } } } },
      ],
    });
    assert.equal(first.counts.LAB_ACCEPTED, 3);
    assert.equal(first.counts.LAB_OUT_OF_RANGE, 1);
    assert.equal(first.counts.LAB_UNKNOWN_PATIENT, 1);

    const rows = (await getPgPool().query(
      `SELECT kind, value::float AS value, unit, source, verified, code, code_system, external_ref, channel, original_value::float AS ov, original_unit
         FROM aksh.network_observations WHERE patient_id = $1 AND channel = 'connector' ORDER BY kind`,
      [patient!.id]
    )).rows;
    const a1c = rows.find((r) => r.kind === "hba1c")!;
    assert.equal(a1c.value, 64);
    assert.equal(a1c.unit, "mmol/mol");
    assert.equal(a1c.ov, 8);
    assert.equal(a1c.original_unit, "%");
    assert.equal(a1c.code, "4548-4");
    assert.equal(a1c.code_system, "http://loinc.org");
    assert.equal(a1c.external_ref, `a1c-${tag}`);
    assert.equal(a1c.source, "lab");
    assert.equal(rows.find((r) => r.kind === "ldl")!.value, 3.4);

    // The same result again: a duplicate, nothing stored.
    const again = await receiveObservations(key, forPatient(obs(`a1c-${tag}`, "4548-4", 8, "%")));
    assert.equal(again.counts.LAB_DUPLICATE, 1);
    // A changed value sent as "final": refused, so a result cannot be silently overwritten.
    const silent = await receiveObservations(key, forPatient(obs(`a1c-${tag}`, "4548-4", 9, "%")));
    assert.equal(silent.counts.LAB_CONFLICTING_FINAL, 1);
    // A correction: stored as a new row that replaces the original; both are kept.
    const corrected = await receiveObservations(key, forPatient(obs(`a1c-${tag}`, "4548-4", 7.5, "%", { status: "corrected" })));
    assert.equal(corrected.counts.LAB_CORRECTED, 1);
    const chain = (await getPgPool().query(
      `SELECT id, value::float AS value, replaces_id FROM aksh.network_observations WHERE patient_id = $1 AND external_ref = $2 ORDER BY recorded_at`,
      [patient!.id, `a1c-${tag}`]
    )).rows;
    assert.equal(chain.length, 2, "original kept");
    assert.equal(chain[1]!.replaces_id, chain[0]!.id);
    assert.equal(chain[1]!.value, 58);
    // The record reads the corrected value.
    const detail = await getPatientDetail(ctx, patient!.id);
    const latest = JSON.stringify(detail);
    assert.ok(latest.includes("58"), "patient record shows the corrected HbA1c");
    assert.equal((detail as { vitals: { egfr: number } }).vitals.egfr, 52);
    // A correction cannot point at another patient's result or a non-lab row (database guard).
    await assert.rejects(
      getPgPool().query(
        `INSERT INTO aksh.network_observations (patient_id, kind, value, unit, observed_at, source, verified, recorded_by, replaces_id)
         VALUES ($1, 'egfr', 50, 'mL/min/{1.73_m2}', $2, 'lab', true, $3, $4)`,
        [patient!.id, at, userId, chain[0]!.id]
      ),
      /REPLACES_MISMATCH/
    );

    // Manual entry by a clinician: converted and range-checked the same way.
    const gpId = randomUUID();
    await getPgPool().query(`INSERT INTO aksh.users (id, email, password_hash) VALUES ($1, $2, 'not-a-login')`, [gpId, `labs-gp-${tag}@akshhealth.test`]);
    const gp = { userId: gpId, email: `labs-gp-${tag}@akshhealth.test`, displayName: "Lab GP", role: "gp" };
    await acceptStaffInvite(gp, { code: (await createInvite(ctx, org.id, { kind: "staff", role: "gp" })).code, registrationNumber: "TEST-LAB" } as never);
    const gpCtx = await loadNetworkContext(gpId, "gp");
    await addPatientRecord(gpCtx, patient!.id, { type: "observation", observation: { kind: "creatinine", value: 1.2, unit: "mg/dL", observedAt: "2026-10-02", source: "lab" } } as never);
    const cr = (await getPgPool().query(`SELECT value::float AS value, unit, channel FROM aksh.network_observations WHERE patient_id = $1 AND kind = 'creatinine'`, [patient!.id])).rows[0]!;
    assert.deepEqual([cr.value, cr.unit, cr.channel], [106, "umol/L", "manual"]);
    await assert.rejects(addPatientRecord(gpCtx, patient!.id, { type: "observation", observation: { kind: "hba1c", value: 7.2, unit: "mmol/mol", observedAt: "2026-10-02", source: "lab" } } as never));

    // The agents' patient view carries the latest trusted lab results with provenance; HbA1c in mmol/mol.
    const spine = await loadSpinePatient(gpCtx, patient!.id, new Date("2026-10-20T00:00:00Z"));
    assert.equal(spine.careNetwork.labs?.egfr?.value, 52);
    assert.equal(spine.careNetwork.labs?.egfr?.channel, "connector");
    assert.equal(spine.careNetwork.labs?.creatinine?.value, 106);
    assert.equal(spine.careNetwork.labs?.ldl?.value, 3.4);
    assert.deepEqual(spine.careNetwork.hba1cReadings.map((r) => r.valueMmolMol), [58], "corrected HbA1c, in mmol/mol");
    assert.ok(spine.provenance.labResults >= 3);

    // The patient record's lab table: latest, source, and the core checks shown as missing when absent.
    const record = await getPatientDetail(gpCtx, patient!.id);
    const egfrRow = record!.labs.find((r) => r.kind === "egfr")!;
    assert.equal(egfrRow.latest?.value, 52);
    assert.equal(egfrRow.latest?.channel, "connector");
    assert.equal(egfrRow.latest?.code, "33914-3");
    const acrRow = record!.labs.find((r) => r.kind === "acr")!;
    assert.equal(acrRow.latest, null, "urine ACR not on record is shown as missing");
    const crRow = record!.labs.find((r) => r.kind === "creatinine")!;
    assert.equal(crRow.latest?.asSent, "1.2 mg/dL", "the value as entered is shown when it was converted");
  } finally {
    // Records are append-only (organisations cannot be deleted while they hold patients); test rows stay in the
    // simulation database under their unique tag, like the other database suites.
  }
  console.log("lab-results: catalogue, FHIR routing, connector provenance, duplicates, corrections kept and applied, manual units, agents' lab view, record lab table — PASS");
}

run()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => closePgPool());
