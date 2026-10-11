/**
 * Patient readings: rules (pure), then the database path — linked and unlinked patients, idempotent retries, safety
 * notice with the clinic's emergency number, sharing earlier readings, database guards, clinician review and
 * verification, and that unverified readings never change clinical summaries.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { closePgPool, getPgPool, isPostgresConfigured } from "../lib/db/client";
import { updateOrganisation } from "../lib/network/admin";
import { loadNetworkContext } from "../lib/network/context";
import { withTenant } from "../lib/network/db";
import { getOwnRecord, getPatientDetail } from "../lib/network/read";
import { acceptPatientInvite, acceptStaffInvite, createInvite, createOrganisation, importPatients, NetworkError } from "../lib/network/service";
import { glucoseFlag, safetyNotice, toStored } from "../lib/readings/rules";
import { addReading, listOwnReadings, listReadingsToReview, markEnteredInError, shareEarlierReadings, verifyReadings } from "../lib/readings/service";

const now = () => new Date().toISOString();
const ref = () => randomUUID();

function pure() {
  const mg = toStored({ kind: "glucose", value: 54, unit: "mg/dL", observedAt: now(), clientRef: ref() })[0]!;
  assert.equal(mg.value, 3);
  assert.equal(mg.flag, "very_low");
  assert.equal(glucoseFlag(3.5), "low");
  assert.equal(glucoseFlag(6), null);
  assert.equal(glucoseFlag(15), "high");
  const bp = toStored({ kind: "bp", systolic: 185, diastolic: 100, observedAt: now(), clientRef: "bp-123456" });
  assert.deepEqual(bp.map((b) => [b.kind, b.flag, b.clientRef]), [["systolic_bp", "very_high", "bp-123456-sys"], ["diastolic_bp", "very_high", "bp-123456-dia"]]);
  assert.equal(toStored({ kind: "weight", value: 176, unit: "lb", observedAt: now(), clientRef: ref() })[0]!.value, 79.8);
  assert.throws(() => toStored({ kind: "glucose", value: 60, unit: "mmol/L", observedAt: now(), clientRef: ref() }), /between 1 and 40/);
  assert.throws(() => toStored({ kind: "bp", systolic: 80, diastolic: 90, observedAt: now(), clientRef: ref() }), /top higher/);
  assert.throws(() => toStored({ kind: "glucose", value: 6, unit: "mmol/L", observedAt: new Date(Date.now() + 3_600_000).toISOString(), clientRef: ref() }), /future/);
  assert.match(safetyNotice("very_low", "glucose", "112")!.text, /call 112/);
  assert.match(safetyNotice("low", "glucose", null)!.text, /local emergency number/);
}

async function makeUser(label: string) {
  const id = randomUUID();
  await getPgPool().query(`INSERT INTO aksh.users (id, email, password_hash) VALUES ($1, $2, 'not-a-login')`, [id, `readings-${label}-${id.slice(0, 8)}@akshhealth.test`]);
  return id;
}

async function rejects(p: Promise<unknown>, status: number) {
  await assert.rejects(p, (e: unknown) => e instanceof NetworkError && e.status === status);
}

async function run() {
  pure();
  if (!isPostgresConfigured()) return console.log("readings-db: rules PASS; DB part skipped (no DATABASE_URL)");
  const tag = randomUUID().slice(0, 6);

  const gpId = await makeUser("gp");
  const gp = { userId: gpId, email: `gp-${tag}@akshhealth.test`, displayName: "Dr Test", role: "gp" };
  const org = await createOrganisation(gp, { name: `Readings Clinic ${tag}`, kind: "clinic" });
  let gpCtx = await loadNetworkContext(gpId, "gp");
  await updateOrganisation(gpCtx, org.id, { locale: { emergencyNumber: "112", glucoseUnit: "mmol/L" } });
  const managerId = await makeUser("mgr");
  await acceptStaffInvite({ userId: managerId, email: `mgr-${tag}@akshhealth.test`, displayName: "Manager", role: "practice-manager" }, { code: (await createInvite(gpCtx, org.id, { kind: "staff", role: "practice-manager" })).code });
  const [patient] = (await importPatients(gpCtx, org.id, { patients: [{ recordRef: `RD-${tag}`, givenName: "Lena", familyName: "Example", dateOfBirth: "1970-04-04" }] } as never)) as unknown as { id: string }[];

  // A self-registered patient records readings before joining the clinic: they stay on their account.
  const patientUser = await makeUser("patient");
  let pctx = await loadNetworkContext(patientUser, "patient");
  const early = await addReading(pctx, { kind: "glucose", value: 7.2, unit: "mmol/L", observedAt: now(), clientRef: ref() });
  assert.equal(early.sharedWithCareTeam, false);
  assert.equal((await listOwnReadings(pctx)).readings.length, 1);

  // They link with the clinic's code; earlier readings move only when they choose to share them.
  const code = (await createInvite(gpCtx, org.id, { kind: "patient", patientId: patient!.id })).code;
  await acceptPatientInvite({ userId: patientUser }, { code, dateOfBirth: "1970-04-04" });
  pctx = await loadNetworkContext(patientUser, "patient");
  const own = await getOwnRecord(pctx);
  assert.equal(own!.organisation, `Readings Clinic ${tag}`, "a linked patient sees their clinic's name (031)");
  assert.equal(own!.emergencyNumber, "112", "and its emergency number");
  assert.equal((await listOwnReadings(pctx)).unsharedPersonal, 1);
  assert.equal((await shareEarlierReadings(pctx)).shared, 1);
  assert.equal((await listOwnReadings(pctx)).unsharedPersonal, 0);

  // A low reading: shared, flagged, the notice names the clinic's emergency number; a retry does not duplicate it.
  const lowRef = ref();
  const low = await addReading(pctx, { kind: "glucose", value: 3.2, unit: "mmol/L", context: "before_meal", observedAt: now(), clientRef: lowRef });
  assert.equal(low.flag, "low");
  assert.match(low.notice!.text, /call 112/);
  assert.equal((await addReading(pctx, { kind: "glucose", value: 3.2, unit: "mmol/L", observedAt: now(), clientRef: lowRef })).replay, true);
  const bp = await addReading(pctx, { kind: "bp", systolic: 190, diastolic: 125, observedAt: now(), clientRef: `bp-${tag}-1` });
  assert.equal(bp.flag, "very_high");
  const typo = await addReading(pctx, { kind: "bp", systolic: 150, diastolic: 95, observedAt: now(), clientRef: `bp-${tag}-2` });
  assert.ok(typo.saved);
  const mine = await listOwnReadings(pctx);
  assert.equal(mine.readings.filter((r) => r.kind === "glucose").length, 2, "shared earlier + low, no duplicate");

  // Patients can withdraw an unchecked reading (both halves of a blood pressure).
  const typoSys = mine.readings.find((r) => r.clientRef === `bp-${tag}-2-sys`)!;
  await markEnteredInError(pctx, typoSys.id);
  const after = await listOwnReadings(pctx);
  assert.deepEqual(after.readings.filter((r) => r.clientRef?.startsWith(`bp-${tag}-2`)).map((r) => r.state), ["entered_in_error", "entered_in_error"]);

  // Database guards.
  await assert.rejects(withTenant(pctx, (c) => c.query(`INSERT INTO aksh.network_observations (patient_id, kind, value, unit, observed_at, source, verified, recorded_by) VALUES ($1, 'hba1c', 40, 'mmol/mol', NOW(), 'lab', TRUE, $2)`, [patient!.id, patientUser])), /PATIENT_SOURCE|UNVERIFIED_ONLY/);
  await assert.rejects(withTenant(pctx, (c) => c.query(`UPDATE aksh.network_observations SET verified = TRUE, verified_by = $2, verified_at = NOW() WHERE patient_id = $1`, [patient!.id, patientUser])), /SELF_VERIFY/);
  await assert.rejects(withTenant(pctx, (c) => c.query(`UPDATE aksh.network_observations SET value = 5 WHERE patient_id = $1`, [patient!.id])), /permission denied/);
  await assert.rejects(withTenant(pctx, (c) => c.query(`SELECT 1 FROM aksh.personal_readings WHERE user_id <> $1`, [patientUser])).then((r) => assert.equal(r.rowCount, 0)).then(() => { throw new Error("no rows: ok"); }), /no rows: ok/);

  // Unverified readings do not change the clinical summary.
  gpCtx = await loadNetworkContext(gpId, "gp");
  let detail = await getPatientDetail(gpCtx, patient!.id);
  assert.equal(detail!.vitals.systolic, null, "unverified patient blood pressure is not a clinical value yet");

  // Review list: clinicians only, flagged first; verification is final and then counts.
  await rejects(listReadingsToReview(await loadNetworkContext(managerId, "practice-manager")), 403);
  const review = await listReadingsToReview(gpCtx, patient!.id);
  assert.ok(review[0]!.flag, "flagged readings first");
  assert.ok(!review.some((r: { clientRef: string }) => r.clientRef?.startsWith(`bp-${tag}-2`)), "entered-in-error readings are not for review");
  const bpIds = review.filter((r: { clientRef: string }) => r.clientRef?.startsWith(`bp-${tag}-1`)).map((r: { id: string }) => r.id);
  assert.equal((await verifyReadings(gpCtx, bpIds)).verified, 2);
  detail = await getPatientDetail(gpCtx, patient!.id);
  assert.equal(detail!.vitals.systolic, 190, "verified reading now counts");
  await assert.rejects(withTenant(gpCtx, (c) => c.query(`UPDATE aksh.network_observations SET verified = FALSE WHERE id = $1`, [bpIds[0]])), /VERIFIED_FINAL/);
  await rejects(markEnteredInError(pctx, bpIds[0]!), 404);
  assert.ok((await listOwnReadings(pctx)).readings.some((r) => r.state === "checked"));

  console.log("readings-db: rules, linked/unlinked, share earlier, notice, idempotency, entered-in-error, guards, review, verification, clinical summaries — PASS");
}

run()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => closePgPool());
