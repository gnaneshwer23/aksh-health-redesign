/**
 * Schedule connector and measurement: FHIR mapping (pure), the comparison maths (pure), then the full path against the
 * database — slots in, replay, unknown types, busy slots withdrawn, booking read-back for the right and the wrong
 * patient, scope limits of a connector, and revocation.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { compareRates, getMeasurement } from "../lib/access/measurement";
import { addToWaitlist, applyAction, getWorkflow } from "../lib/access/service";
import { appointmentFromFhir, slotFromFhir, slotFromJson } from "../lib/connector/fhir";
import { authenticate, createKey, listEvents, receiveAppointments, receiveSlots, revokeKey } from "../lib/connector/service";
import { closePgPool, getPgPool, isPostgresConfigured } from "../lib/db/client";
import { loadNetworkContext } from "../lib/network/context";
import { createOrganisation, importPatients, NetworkError } from "../lib/network/service";

const inHours = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();

function pure() {
  const free = slotFromFhir({ resourceType: "Slot", id: "s-1", status: "free", start: inHours(30), end: inHours(30.5), serviceType: [{ text: "Foot check" }] }, {});
  assert.ok(free.ok && free.free && free.appointmentType === "foot_check" && free.durationMin === 30);
  const mapped = slotFromFhir({ resourceType: "Slot", id: "s-2", meta: { versionId: "3" }, status: "free", start: inHours(30), end: inHours(30.25), appointmentType: { coding: [{ code: "FC01" }] } }, { typeMap: { FC01: "hba1c_check" }, offerCloseHours: 6 });
  assert.ok(mapped.ok && mapped.free && mapped.appointmentType === "hba1c_check" && mapped.version === 3);
  assert.equal(Date.parse(inHours(30)) - Date.parse((mapped as { offerExpiresAt: string }).offerExpiresAt), 6 * 3_600_000);
  const unknown = slotFromFhir({ resourceType: "Slot", id: "s-3", status: "free", start: inHours(30), end: inHours(31), serviceType: [{ text: "Dental" }] }, {});
  assert.ok(!unknown.ok && unknown.code === "UNKNOWN_APPOINTMENT_TYPE");
  const past = slotFromFhir({ resourceType: "Slot", id: "s-4", status: "free", start: inHours(-1), end: inHours(-0.5), serviceType: [{ text: "foot check" }] }, {});
  assert.ok(!past.ok && past.code === "SLOT_STALE");
  const soon = slotFromJson({ id: "j-1", appointmentType: "foot_check", start: inHours(1), durationMin: 20 }, { offerCloseHours: 2 });
  assert.ok(!soon.ok && soon.code === "OFFER_WINDOW_CLOSED");
  const busy = slotFromFhir({ resourceType: "Slot", id: "s-5", meta: { versionId: "2" }, status: "busy" }, {});
  assert.ok(busy.ok && !busy.free && busy.status === "busy");
  const appt = appointmentFromFhir({
    resourceType: "Appointment",
    id: "a-1",
    status: "booked",
    slot: [{ reference: "https://ehr.example/fhir/Slot/s-1/_history/2" }],
    participant: [{ actor: { reference: "Patient/xyz", identifier: { system: "urn:clinic:mrn", value: "MRN-1" } } }, { actor: { reference: "Practitioner/p" } }],
  });
  assert.ok(appt.ok && appt.slotRefs[0] === "s-1" && appt.patientIdentifiers.join() === "MRN-1");

  assert.equal(compareRates({ filled: 5, freed: 10 }, { booked: 30, eligible: 40 }).verdict, "too_early");
  const up = compareRates({ filled: 20, freed: 100 }, { booked: 60, eligible: 100 });
  assert.equal(up.verdict, "above");
  assert.equal(up.differencePts, 40);
  assert.equal(compareRates({ filled: 30, freed: 100 }, { booked: 32, eligible: 100 }).verdict, "similar");
}

async function rejects(p: Promise<unknown>, status: number) {
  await assert.rejects(p, (e: unknown) => e instanceof NetworkError && e.status === status);
}

async function run() {
  pure();
  if (!isPostgresConfigured()) return console.log("connector-db: pure checks PASS; DB part skipped (no DATABASE_URL)");
  const tag = randomUUID().slice(0, 6);
  const id = randomUUID();
  await getPgPool().query(`INSERT INTO aksh.users (id, email, password_hash) VALUES ($1, $2, 'not-a-login')`, [id, `connector-${tag}@akshhealth.test`]);
  const admin = { userId: id, email: `connector-${tag}@akshhealth.test`, displayName: "Connector Admin", role: "practice-manager" };
  const org = await createOrganisation(admin, { name: `Connector Clinic ${tag}`, kind: "clinic" });
  const ctx = await loadNetworkContext(admin.userId, admin.role);
  const imported = (await importPatients(ctx, org.id, { patients: [
    { recordRef: `MRN-A-${tag}`, givenName: "Ana", familyName: "One", dateOfBirth: "1960-01-01" },
    { recordRef: `MRN-B-${tag}`, givenName: "Ben", familyName: "Two", dateOfBirth: "1961-01-01" },
  ] } as never)) as unknown as { id: string; recordRef: string }[];
  for (const p of imported) await addToWaitlist(ctx, org.id, { patientId: p.id, appointmentType: "foot_check", reason: "overdue_care", contactChannel: "sms" } as never);

  const created = await createKey(ctx, org.id, { name: "Test schedule", config: { typeMap: { FC01: "foot_check" }, offerCloseHours: 2, site: "Main site" } });
  assert.ok(created.key.startsWith("aksh_"));
  const key = await authenticate(`Bearer ${created.key}`);
  await rejects(authenticate("Bearer aksh_wrong"), 401);

  const slot = (sid: string, h: number, extra: Record<string, unknown> = {}) => ({ resource: { resourceType: "Slot", id: sid, status: "free", start: inHours(h), end: inHours(h + 0.5), appointmentType: { coding: [{ code: "FC01" }] }, ...extra } });
  const [sa, sb, sc, sx] = [`a-${tag}`, `b-${tag}`, `c-${tag}`, `x-${tag}`];
  const first = await receiveSlots(key, { resourceType: "Bundle", type: "collection", entry: [slot(sa, 30), slot(sb, 31), slot(sc, 32), slot(sx, 33, { appointmentType: { text: "Dental" } })] });
  assert.deepEqual(first.results.map((r) => r.result), ["ACCEPTED", "ACCEPTED", "ACCEPTED", "UNKNOWN_APPOINTMENT_TYPE"]);
  assert.equal((await receiveSlots(key, slot(sa, 30).resource)).results[0]!.result, "REPLAY");

  // Slot C is taken in the schedule before anyone is offered it: withdrawn automatically.
  const busy = await receiveSlots(key, { resourceType: "Slot", id: sc, meta: { versionId: "2" }, status: "busy" });
  assert.equal(busy.results[0]!.result, "WITHDRAWN");

  // Staff work slots A (Ana) and B (Ben) to "accepted, awaiting read-back".
  const prepare = async (wfId: string, patientId: string) => {
    await applyAction(ctx, wfId, { action: "match", idempotencyKey: `m-${wfId}` });
    const wf = await getWorkflow(ctx, wfId);
    const cand = wf!.candidates.find((c: { patient_id: string; rank: number | null }) => c.patient_id === patientId && c.rank !== null);
    await applyAction(ctx, wfId, { action: "select", idempotencyKey: `s-${wfId}`, candidateId: cand.id });
    await applyAction(ctx, wfId, { action: "approve_contact", idempotencyKey: `ap-${wfId}` });
    await applyAction(ctx, wfId, { action: "record_response", idempotencyKey: `r-${wfId}`, response: "accepted" });
  };
  const wfA = first.results[0]!.workflowId!;
  const wfB = first.results[1]!.workflowId!;
  await prepare(wfA, imported[0]!.id);
  await prepare(wfB, imported[1]!.id);

  // A connector can never take staff decisions.
  const connectorCtx = { userId: `connector-${key.id}`, role: "connector", orgIds: [org.id], adminOrgIds: [], patientIds: [], publicDemo: false };
  await rejects(applyAction(connectorCtx, wfA, { action: "match", idempotencyKey: `cx-${tag}` }), 403);

  const appt = (aid: string, sid: string, mrn?: string) => ({ resourceType: "Appointment", id: aid, status: "booked", slot: [{ reference: `Slot/${sid}` }], participant: mrn ? [{ actor: { reference: "Patient/1", identifier: { value: mrn } } }] : [] });
  assert.equal((await receiveAppointments(key, appt(`ap-none-${tag}`, sa))).results[0]!.result, "NO_PATIENT_IDENTIFIER");
  assert.equal((await receiveAppointments(key, appt(`ap-a-${tag}`, sa, `MRN-A-${tag}`))).results[0]!.result, "BOOKED_VERIFIED");
  assert.equal((await receiveAppointments(key, appt(`ap-a-${tag}`, sa, `MRN-A-${tag}`))).results[0]!.result, "ALREADY_CLOSED");
  assert.equal((await receiveAppointments(key, appt(`ap-b-${tag}`, sb, "SOMEONE-ELSE"))).results[0]!.result, "BOOKED_FOR_ANOTHER_PATIENT");
  const a = await getWorkflow(ctx, wfA);
  const b = await getWorkflow(ctx, wfB);
  assert.equal(a!.state, "CLOSED");
  assert.equal(a!.outcome, "booked");
  assert.equal(b!.state, "FAILED_SAFE", "booked for someone else: a person resolves it");
  assert.ok(a!.actions.some((x: { action_type: string; result_code: string }) => x.action_type === "confirm_booking" && x.result_code === "BOOKED_VERIFIED"));

  const events = await listEvents(ctx, org.id);
  assert.ok(events.length >= 9, "every inbound item is logged");

  const m = await getMeasurement(ctx, org.id);
  assert.equal(m.mode, "rehearsal");
  assert.equal(m.current.booked, 1);
  assert.equal(m.current.read_back_by_connector, 1);
  assert.equal(m.comparison, null, "no baseline accepted, no comparison");

  await revokeKey(ctx, org.id, created.id);
  await rejects(authenticate(`Bearer ${created.key}`), 401);
  console.log("connector-db: FHIR mapping, comparison maths, slots in/replay/withdraw, read-back right and wrong patient, connector scope, revocation — PASS");
}

run()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => closePgPool());
