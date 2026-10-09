/**
 * Patient access integration (synthetic, staged): inbound access events ->
 * FHIR -> diabetes access signals -> clinician gate -> batched outreach.
 * Run: npx tsx tests/patient-access-diabetes.test.ts
 */
import assert from "node:assert/strict";

import { getIntegrationAdapterRegistry } from "../lib/integration-config";
import {
  ANTICOAGULANTS,
  ANTIPLATELETS,
  HYPO_RISK_DRUGS,
  isExternal,
  refOf
} from "../lib/patient-access/fhir";
import {
  FIXTURE_PATIENTS,
  PATIENT_ACCESS_FIXTURE_NOW,
  novakAccessEvents,
  okaforAccessEvents,
  patelAccessEvents,
  seedPatientAccessEhr
} from "../lib/patient-access/fixtures";
import {
  PATIENT_ACCESS_HONESTY,
  createPatientAccessPipeline,
  hba1cPercentToMmolMol,
  type AccessEvent,
  type OutreachRecord
} from "../lib/patient-access";

const CLINICIANS = { "prac-001": "Dr S. Williams (synthetic)" };

function pipeline() {
  const p = createPatientAccessPipeline({ authorisedClinicians: CLINICIANS, now: () => PATIENT_ACCESS_FIXTURE_NOW });
  seedPatientAccessEhr(p.store);
  return p;
}
type Pipe = ReturnType<typeof pipeline>;

const run = (p: Pipe, events: AccessEvent[]) => events.forEach((e) => p.handle(e));
const pending = (p: Pipe, pid: string) => new Map(p.gate.pending().filter((x) => x.finding.patientId === pid).map((x) => [x.finding.ruleId, x]));
const novakId = (p: Pipe) => p.store.search("Patient", (r) => (r.name as { family: string }[])[0].family === "Novak")[0].id;
const outbound = (p: Pipe) => (p.transport as unknown as { outbound: OutreachRecord[] }).outbound;

// --- adapter ----------------------------------------------------------------

function existingEhrPatientMatchedNotModified() {
  const p = pipeline();
  run(p, patelAccessEvents());
  const patels = p.store.search("Patient", (r) => (r.name as { family: string }[])[0].family === "Patel");
  assert.equal(patels.length, 1);
  assert.equal(patels[0].id, "P002");
  assert.equal(isExternal(patels[0]), false, "access data must not retag or overwrite the EHR patient");
}

function unknownPatientCreatedAndTagged() {
  const p = pipeline();
  run(p, novakAccessEvents());
  assert.equal(isExternal(p.store.read("Patient", novakId(p))), true);
}

function everyAccessResourceTaggedWithProvenance() {
  const p = pipeline();
  run(p, [...patelAccessEvents(), ...novakAccessEvents()]);
  const covered = new Set(p.store.search("Provenance").flatMap((pv) => (pv.target as { reference: string }[]).map((t) => t.reference)));
  for (const type of ["ServiceRequest", "MedicationStatement", "Appointment", "Observation", "Condition"]) {
    for (const r of p.store.search(type, isExternal)) assert.ok(covered.has(refOf(r)), `${refOf(r)} has no Provenance`);
  }
}

function patientReportedDataIsUnverified() {
  const p = pipeline();
  run(p, [...patelAccessEvents(), ...novakAccessEvents()]);
  for (const o of p.store.search("Observation", isExternal)) assert.equal(o.status, "preliminary");
  for (const c of p.store.search("Condition", isExternal)) {
    assert.equal((c.verificationStatus as { coding: { code: string }[] }).coding[0].code, "unconfirmed");
  }
}

function noShowUpdatesBookedAppointment() {
  const p = pipeline();
  run(p, patelAccessEvents());
  const appts = p.store.search("Appointment");
  assert.equal(appts.length, 1);
  assert.equal(appts[0].status, "noshow");
}

function malformedEventsRejected() {
  const p = pipeline();
  assert.throws(() => p.handle({ eventId: "x", type: "bogus" as never, channel: "voice", occurredAt: PATIENT_ACCESS_FIXTURE_NOW.toISOString(), payload: { patient: FIXTURE_PATIENTS.patel } }));
  assert.throws(() => p.handle({ eventId: "y", type: "appointment.booked", channel: "voice", occurredAt: PATIENT_ACCESS_FIXTURE_NOW.toISOString(), payload: { patient: FIXTURE_PATIENTS.patel } }));
}

function percentHbA1cConvertedToMmolMol() {
  assert.equal(hba1cPercentToMmolMol(8.7), 72);
  assert.equal(hba1cPercentToMmolMol(6.5), 48);
  const p = pipeline();
  p.handle({ eventId: "pct", type: "intake.completed", channel: "sms", occurredAt: "2026-10-05T10:00:00.000Z",
    payload: { patient: FIXTURE_PATIENTS.okafor, reportedHbA1c: { value: 7.0, unit: "%", date: "2026-09-30" } } });
  const reported = p.store.search("Observation", (o) => isExternal(o) && o.status === "preliminary" && "valueQuantity" in o);
  assert.equal((reported[0].valueQuantity as { value: number; unit: string }).value, 53);
}

// --- signals ----------------------------------------------------------------

function patelRaisesExactlyTheExpectedFindings() {
  const p = pipeline();
  run(p, patelAccessEvents());
  const rules = pending(p, "P002");
  assert.deepEqual([...rules.keys()].sort(), [
    "annual-checks-overdue", "anticoagulant-antiplatelet", "hba1c-above-threshold",
    "hba1c-overdue", "hypoglycaemia-on-hypo-risk-drug", "missed-appointment"
  ]);
  const bleed = rules.get("anticoagulant-antiplatelet")!.finding;
  assert.equal(bleed.severity, "high");
  assert.match(bleed.summary, /not yet reconciled/);
  assert.match(rules.get("annual-checks-overdue")!.finding.summary, /eye screening, foot examination$/);
}

function patientReportedHbA1cNeverClosesMonitoring() {
  const p = pipeline();
  run(p, patelAccessEvents());
  assert.match(pending(p, "P002").get("hba1c-overdue")!.finding.summary, /patient-reported value exists but is not counted/);
}

function wellControlledPatientRaisesNothing() {
  const p = pipeline();
  run(p, okaforAccessEvents());
  assert.equal(pending(p, "P-OKAFOR").size, 0);
}

function accessOnlyPatientFlagsUnconfirmedDiagnosis() {
  const p = pipeline();
  run(p, novakAccessEvents());
  assert.deepEqual([...pending(p, novakId(p)).keys()].sort(), [
    "annual-checks-overdue", "diagnosis-unconfirmed", "hba1c-overdue", "hypoglycaemia-on-hypo-risk-drug"
  ]);
}

function nonDiabeticPatientIgnored() {
  const p = pipeline();
  p.handle({ eventId: "nd", type: "intake.completed", channel: "voice", occurredAt: "2026-10-05T10:00:00.000Z",
    payload: { patient: { nhsNumber: "9990000099", given: "X", family: "Y" }, medications: ["apixaban", "aspirin"] } });
  assert.equal(p.gate.pending().length, 0);
}

function changedFindingSupersedesPending() {
  const p = pipeline();
  const [referral, intake] = patelAccessEvents();
  p.handle(referral);
  p.handle(intake);
  const statuses = [...p.gate.proposals.values()].filter((x) => x.finding.ruleId === "hba1c-overdue").map((x) => x.status);
  assert.deepEqual(statuses, ["superseded", "pending"]);
}

// --- gate -------------------------------------------------------------------

function nothingWrittenOrSentBeforeAcceptance() {
  const p = pipeline();
  run(p, [...patelAccessEvents(), ...novakAccessEvents()]);
  p.dispatch();
  assert.equal(p.store.count("DetectedIssue"), 0);
  assert.equal(p.store.count("CommunicationRequest"), 0);
  assert.equal(outbound(p).length, 0);
}

function unauthorisedClinicianBlocked() {
  const p = pipeline();
  run(p, patelAccessEvents());
  assert.throws(() => p.accept(p.gate.pending()[0].id, "intruder"), /not an authorised clinician/);
  assert.equal(p.store.count("DetectedIssue"), 0);
  assert.equal(p.gate.audit.at(-1)!.action, "blocked_unauthorised");
}

function acceptanceWritesIssueRequestAndVerifierProvenance() {
  const p = pipeline();
  run(p, patelAccessEvents());
  const prop = pending(p, "P002").get("anticoagulant-antiplatelet")!;
  p.accept(prop.id, "prac-001", "Aspirin likely redundant; review");
  const issue = p.store.read("DetectedIssue", prop.outcome!.detectedIssue.split("/")[1]);
  assert.equal((issue.author as { reference: string }).reference, "Practitioner/prac-001");
  assert.equal(issue.severity, "high");
  assert.ok(prop.outcome!.communicationRequest);
  const pv = p.store.search("Provenance", (r) => (r.target as { reference: string }[]).some((t) => t.reference === prop.outcome!.detectedIssue))[0];
  assert.equal((pv.agent as { type: { coding: { code: string }[] } }[])[0].type.coding[0].code, "verifier");
}

function rejectionNeedsReasonAndWritesNothing() {
  const p = pipeline();
  run(p, patelAccessEvents());
  const id = p.gate.pending()[0].id;
  assert.throws(() => p.reject(id, "prac-001", "   "), /reason is required/);
  p.reject(id, "prac-001", "Already addressed in clinic");
  p.dispatch();
  assert.equal(p.store.count("DetectedIssue"), 0);
  assert.equal(outbound(p).length, 0);
}

function decisionsAreFinal() {
  const p = pipeline();
  run(p, patelAccessEvents());
  const id = p.gate.pending()[0].id;
  p.accept(id, "prac-001");
  assert.throws(() => p.accept(id, "prac-001"), /not pending/);
}

function oneNonClinicalCallPerPatient() {
  const p = pipeline();
  run(p, [...patelAccessEvents(), ...novakAccessEvents()]);
  for (const x of p.gate.pending()) p.accept(x.id, "prac-001");
  const sent = p.dispatch() as OutreachRecord[];
  assert.equal(sent.length, 2);
  assert.equal(new Set(sent.map((s) => s.patientNhsNumber)).size, 2);
  const forbidden = ["hba1c", "mmol", "bleeding", "hypo", "diabetes is", ...ANTICOAGULANTS, ...ANTIPLATELETS, ...HYPO_RISK_DRUGS];
  for (const s of sent) for (const term of forbidden) assert.ok(!s.script.toLowerCase().includes(term), `clinical term "${term}" leaked into script`);
  const patel = sent.find((s) => s.patientNhsNumber === FIXTURE_PATIENTS.patel.nhsNumber)!;
  assert.deepEqual(patel.outreachTypes, ["rebook_missed", "book_test", "book_screening"], "rebook absorbs the separate review booking");
}

function dispatchIsIdempotent() {
  const p = pipeline();
  run(p, patelAccessEvents());
  for (const x of p.gate.pending()) p.accept(x.id, "prac-001");
  assert.equal(p.dispatch().length, 1);
  assert.equal(p.dispatch().length, 0);
}

function noPhoneMeansNoCall() {
  const p = pipeline();
  p.handle({ eventId: "np", type: "intake.completed", channel: "voice", occurredAt: "2026-10-05T10:00:00.000Z",
    payload: { patient: { nhsNumber: "9990000077", given: "Z", family: "Q" }, conditions: ["Type 2 diabetes"] } });
  for (const x of p.gate.pending()) p.accept(x.id, "prac-001");
  const res = p.dispatch();
  assert.equal(res[0].status, "not_sent");
  assert.equal(outbound(p).length, 0);
}

// --- platform boundary ------------------------------------------------------

function registeredAsStagedDisabledAdapter() {
  const adapter = getIntegrationAdapterRegistry().find((a) => a.id === "patient-access-synthetic");
  assert.ok(adapter, "patient-access-synthetic must be in the integration adapter registry");
  assert.equal(adapter!.enabled, false);
  assert.equal(PATIENT_ACCESS_HONESTY.ehrWrite, false);
  assert.equal(PATIENT_ACCESS_HONESTY.liveTelephony, false);
  assert.equal(PATIENT_ACCESS_HONESTY.thresholdsClinicallySignedOff, false);
}

function main() {
  const tests = [
    existingEhrPatientMatchedNotModified, unknownPatientCreatedAndTagged, everyAccessResourceTaggedWithProvenance,
    patientReportedDataIsUnverified, noShowUpdatesBookedAppointment, malformedEventsRejected, percentHbA1cConvertedToMmolMol,
    patelRaisesExactlyTheExpectedFindings, patientReportedHbA1cNeverClosesMonitoring, wellControlledPatientRaisesNothing,
    accessOnlyPatientFlagsUnconfirmedDiagnosis, nonDiabeticPatientIgnored, changedFindingSupersedesPending,
    nothingWrittenOrSentBeforeAcceptance, unauthorisedClinicianBlocked, acceptanceWritesIssueRequestAndVerifierProvenance,
    rejectionNeedsReasonAndWritesNothing, decisionsAreFinal, oneNonClinicalCallPerPatient, dispatchIsIdempotent,
    noPhoneMeansNoCall, registeredAsStagedDisabledAdapter
  ];
  for (const t of tests) t();
  console.log(`patient-access-diabetes: ${tests.length} checks — PASS`);
}

main();
