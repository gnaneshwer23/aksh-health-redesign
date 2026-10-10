/**
 * Care network against the real database: row-level security, cross-organisation consent, patient self-scope,
 * single-use invites and append-only consent. Skips when DATABASE_URL is not set. Writes only to test accounts on
 * the akshhealth.test domain; consent and audit rows are append-only by design and are not deleted.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { closePgPool, getPgPool, isPostgresConfigured } from "../lib/db/client";
import { loadNetworkContext } from "../lib/network/context";
import { withTenant } from "../lib/network/db";
import { getPatientDetail, listPatients } from "../lib/network/read";
import {
  acceptPatientInvite,
  acceptStaffInvite,
  addPatientRecord,
  createInvite,
  createOrganisation,
  importPatients,
  NetworkError,
} from "../lib/network/service";

async function makeUser(label: string, role: string) {
  const id = randomUUID();
  const email = `net-${label}-${id.slice(0, 8)}@akshhealth.test`;
  await getPgPool().query(`INSERT INTO aksh.users (id, email, password_hash) VALUES ($1, $2, 'not-a-login')`, [id, email]);
  return { userId: id, email, displayName: `Test ${label}`, role };
}

async function rejects(p: Promise<unknown>, status: number) {
  await assert.rejects(p, (e: unknown) => e instanceof NetworkError && e.status === status);
}

async function run() {
  if (!isPostgresConfigured()) {
    console.log("care-network-db: skipped (no DATABASE_URL)");
    return;
  }
  const run = randomUUID().slice(0, 6);

  // Two clinics and a pharmacy, each created by its own admin.
  const adminA = await makeUser("admin-a", "practice-manager");
  const adminB = await makeUser("admin-b", "practice-manager");
  const adminRx = await makeUser("admin-rx", "practice-manager");
  const clinicA = await createOrganisation(adminA, { name: `Clinic A ${run}`, kind: "clinic", region: "Europe" });
  const clinicB = await createOrganisation(adminB, { name: `Clinic B ${run}`, kind: "clinic", region: "Europe" });
  const pharmacy = await createOrganisation(adminRx, { name: `Pharmacy ${run}`, kind: "pharmacy", region: "Europe" });
  assert.equal(clinicA.status, "sandbox", "new organisations start in sandbox");

  // Staff join through single-use invites.
  const ctxAdminA = await loadNetworkContext(adminA.userId, adminA.role);
  const docInvite = await createInvite(ctxAdminA, clinicA.id, { kind: "staff", role: "gp" });
  const doctor = await makeUser("doctor", "gp");
  await acceptStaffInvite(doctor, { code: docInvite.code, registrationNumber: "TEST-123" });
  await rejects(acceptStaffInvite(await makeUser("late", "gp"), { code: docInvite.code }), 410);
  const nonAdmin = await loadNetworkContext(doctor.userId, doctor.role);
  await rejects(createInvite(nonAdmin, clinicA.id, { kind: "staff", role: "gp" }), 403);

  const ctxAdminRx = await loadNetworkContext(adminRx.userId, adminRx.role);
  const rxInvite = await createInvite(ctxAdminRx, pharmacy.id, { kind: "staff", role: "clinical-pharmacist" });
  const pharmacist = await makeUser("pharmacist", "clinical-pharmacist");
  const rxMember = await acceptStaffInvite(pharmacist, { code: rxInvite.code });

  // The doctor imports a patient with history.
  const ctxDoctor = await loadNetworkContext(doctor.userId, doctor.role);
  const [imported] = await importPatients(ctxDoctor, clinicA.id, {
    patients: [
      {
        recordRef: `A-${run}`,
        givenName: "Asha",
        familyName: `Test${run}`,
        dateOfBirth: "1961-04-12",
        diabetesType: "type_2",
        observations: [
          { kind: "hba1c", value: 71, unit: "mmol/mol", observedAt: "2026-09-01", source: "lab" },
          { kind: "egfr", value: 42, unit: "mL/min/1.73m2", observedAt: "2026-09-01", source: "lab" },
        ],
        medications: [{ name: "Metformin", drugClass: "Biguanide", dose: "1 g twice daily" }],
      },
    ],
  });
  const patientId = imported!.id;
  const again = await importPatients(ctxDoctor, clinicA.id, { patients: [{ recordRef: `A-${run}`, givenName: "Asha", familyName: `Test${run}`, dateOfBirth: "1961-04-12" }] });
  assert.equal(again[0]!.id, patientId, "import is idempotent on record reference");

  // Derived risk and gaps come from stored data.
  const detail = await getPatientDetail(ctxDoctor, patientId);
  assert.ok(detail, "own organisation sees the patient");
  assert.equal(detail!.hba1c.length, 1, "re-import does not duplicate history");
  assert.ok(detail!.risk.drivers.some((d) => d.startsWith("HbA1c 71")), "HbA1c drives risk");
  assert.ok(detail!.risk.drivers.some((d) => d.startsWith("eGFR 42")), "eGFR drives risk");

  // Row-level security: another clinic and an unconsented pharmacy see nothing.
  const ctxAdminB = await loadNetworkContext(adminB.userId, adminB.role);
  assert.equal(await getPatientDetail(ctxAdminB, patientId), null, "other clinic cannot read the record");
  assert.ok(!(await listPatients(ctxAdminB, {})).rows.some((r) => r.id === patientId));
  const ctxPharmacist = await loadNetworkContext(pharmacist.userId, pharmacist.role);
  assert.equal(await getPatientDetail(ctxPharmacist, patientId), null, "pharmacy cannot read before care team + consent");

  // Care team alone is not enough; consent opens access; withdrawal closes it again.
  await addPatientRecord(ctxDoctor, patientId, { type: "care_team", membershipId: rxMember.membershipId, careRole: "Community pharmacist" });
  assert.equal(await getPatientDetail(ctxPharmacist, patientId), null, "care team without consent stays closed");
  await addPatientRecord(ctxDoctor, patientId, { type: "consent", granteeOrganisationId: pharmacy.id, purpose: "care_coordination", status: "granted", basis: "Explicit consent recorded in clinic" });
  assert.ok(await getPatientDetail(ctxPharmacist, patientId), "pharmacy reads after care team + consent");
  await addPatientRecord(ctxDoctor, patientId, { type: "consent", granteeOrganisationId: pharmacy.id, purpose: "care_coordination", status: "withdrawn" });
  assert.equal(await getPatientDetail(ctxPharmacist, patientId), null, "withdrawal closes access");

  // Roles: a practice manager cannot add clinical data.
  await rejects(addPatientRecord(ctxAdminA, patientId, { type: "observation", observation: { kind: "hba1c", value: 60, unit: "mmol/mol", observedAt: "2026-10-01", source: "lab" } }), 403);

  // Patient self-scope via single-use invite with date of birth.
  const pInvite = await createInvite(ctxDoctor, clinicA.id, { kind: "patient", patientId });
  const patientUser = await makeUser("patient", "patient");
  await rejects(acceptPatientInvite(patientUser, { code: pInvite.code, dateOfBirth: "1990-01-01" }), 410);
  await acceptPatientInvite(patientUser, { code: pInvite.code, dateOfBirth: "1961-04-12" });
  await rejects(acceptPatientInvite(await makeUser("patient2", "patient"), { code: pInvite.code, dateOfBirth: "1961-04-12" }), 410);
  const ctxPatient = await loadNetworkContext(patientUser.userId, "patient");
  assert.ok(await getPatientDetail(ctxPatient, patientId), "patient reads own record");
  await addPatientRecord(ctxPatient, patientId, { type: "observation", observation: { kind: "glucose", value: 6.4, unit: "mmol/L", observedAt: "2026-10-10T08:00:00Z", source: "patient_reported" } });
  await rejects(addPatientRecord(ctxPatient, patientId, { type: "observation", observation: { kind: "hba1c", value: 40, unit: "mmol/mol", observedAt: "2026-10-10", source: "lab" } }), 403);

  // Database guarantees that do not depend on application code.
  await withTenant(ctxAdminB, async (client) => {
    const r = await client.query(`SELECT count(*)::int AS n FROM aksh.network_patients WHERE id = $1`, [patientId]);
    assert.equal(r.rows[0].n, 0, "raw SQL as tenant role still filtered by RLS");
  });
  await assert.rejects(withTenant(ctxDoctor, (client) => client.query(`SELECT password_hash FROM aksh.users LIMIT 1`)), /permission denied/, "tenant role cannot read users");
  await assert.rejects(getPgPool().query(`UPDATE aksh.consent_records SET status = 'granted' WHERE patient_id = $1`, [patientId]), /append-only/, "consent is append-only");
  await assert.rejects(
    withTenant({ ...ctxAdminB, orgIds: [] }, (client) => client.query(`INSERT INTO aksh.network_patients (organisation_id, given_name, family_name, date_of_birth) VALUES ($1, 'X', 'Y', '2000-01-01')`, [clinicA.id])),
    /row-level security/,
    "cannot insert into another organisation"
  );

  console.log("care-network-db: RLS, consent-gated cross-org access, patient self-scope, single-use invites, append-only consent — PASS");
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => closePgPool());
