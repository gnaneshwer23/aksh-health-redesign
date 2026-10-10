import assert from "node:assert/strict";

import { bookSlot, londonIso } from "../lib/front-desk/calendar";
import { respond, startConversation } from "../lib/front-desk/conversation";
import { captureHealthData } from "../lib/front-desk/health-capture";
import { answerQuestion } from "../lib/front-desk/knowledge";
import { identifyPatient, parseDob, phoneContactAllowed, syntheticPhone } from "../lib/front-desk/patients";
import { screenUtterance } from "../lib/front-desk/safety";
import { createInitialState } from "../lib/front-desk/store";
import { FRONT_DESK_HONESTY } from "../lib/front-desk/types";
import {
  approveCampaign,
  canApproveCampaign,
  computeMetrics,
  createCampaign,
  decideDraft,
  intakeReferral,
  runCampaign,
} from "../lib/front-desk/workflows";
import { AGENT_DIRECTORY } from "../lib/agents";

const NOW = new Date("2026-10-12T09:00:00Z"); // Monday, BST
const fresh = () => createInitialState(NOW);

// --- Architecture and honesty ---
assert.equal(AGENT_DIRECTORY.length, 12, "Front Desk is a module, not new agents (N4 lock)");
assert.equal(FRONT_DESK_HONESTY.liveTelephony, false);
assert.equal(FRONT_DESK_HONESTY.ehrWrite, false);
assert.equal(FRONT_DESK_HONESTY.givesClinicalAdvice, false);
assert.equal(FRONT_DESK_HONESTY.thresholdsClinicallySignedOff, false);
assert.match(syntheticPhone("P002"), /^07700 900\d{3}$/, "synthetic numbers use the Ofcom drama range");

// --- Safety screen (H-ACC-1) ---
assert.equal(screenUtterance("I've got chest pain right now").level, "emergency");
assert.equal(screenUtterance("his face drooping and slurred speech").level, "emergency");
assert.equal(screenUtterance("I feel suicidal").level, "crisis");
assert.match(screenUtterance("I want to end my life").patientMessage ?? "", /116 123/);
assert.equal(screenUtterance("my sugar was 2.6 this morning").level, "urgent_same_day");
assert.equal(screenUtterance("glucose 28 and I've got ketones").level, "urgent_same_day");
assert.equal(screenUtterance("my sugars were 12 most days").level, "none");
assert.equal(screenUtterance("blood pressure reading 140/80").level, "none");
assert.equal(screenUtterance("I'm burnt out with my diabetes").level, "clinician_review");
assert.equal(screenUtterance("I'm burnt out with my diabetes").handOffNow, false);

// --- Health capture (H-ACC-4) ---
{
  const c = captureHealthData("My sugars have been 12 to 14, HbA1c was 8.4%, BP 148 over 92, I weigh 15 stone and I missed my metformin. Very thirsty.");
  const kinds = c.map((o) => o.kind);
  assert.ok(kinds.includes("capillary_glucose"));
  assert.equal(c.find((o) => o.kind === "capillary_glucose")?.value, "12–14 mmol/L");
  assert.equal(c.find((o) => o.kind === "hba1c")?.numeric, 68, "8.4% → 68 mmol/mol");
  assert.equal(c.find((o) => o.kind === "blood_pressure")?.value, "148/92 mmHg");
  assert.equal(c.find((o) => o.kind === "weight")?.numeric, 95.3);
  assert.equal(c.find((o) => o.kind === "medication_adherence")?.value, "Reports missed or stopped doses");
  assert.ok(c.some((o) => o.kind === "symptom" && o.value === "Increased thirst"));
  assert.ok(c.every((o) => o.verified === false && o.source === "patient_reported"));
}

// --- Answers / RAG (H-ACC-2) ---
{
  const a = answerQuestion("What time do you open on weekdays?");
  assert.equal(a.kind, "answer");
  assert.equal(a.kind === "answer" && a.article.id, "kb-hours");
  assert.equal(answerQuestion("Should I take more insulin tonight?").kind, "clinical");
  assert.equal(answerQuestion("Is it normal to feel dizzy?").kind, "clinical");
  assert.equal(answerQuestion("zebra quantum").kind, "no_match");
}

// --- Identity (H-ACC-3) ---
assert.equal(parseDob("born on the 22nd of November 1971"), "1971-11-22");
assert.equal(parseDob("22/11/1971"), "1971-11-22");
{
  const ok = identifyPatient("It's James Patel, 22/11/1971");
  assert.equal(ok.kind === "matched" && ok.patient.id, "P002");
  assert.equal(identifyPatient("James Patel 01/01/1980").kind, "no_match");
  assert.equal(identifyPatient("James Patel").kind, "need_more");
}

// --- Calendar idempotency (H-ACC-6) and London time ---
{
  assert.equal(londonIso("2026-10-13", "09:00"), "2026-10-13T08:00:00.000Z", "BST");
  assert.equal(londonIso("2026-12-01", "09:00"), "2026-12-01T09:00:00.000Z", "GMT");
  const s = fresh();
  const free = s.slots.find((x) => !x.patientId)!;
  const a = bookSlot(s, free.id, "P002", "voice", "k1");
  const b = bookSlot(s, free.id, "P002", "voice", "k1");
  const c = bookSlot(s, free.id, "P003", "voice", "k2");
  assert.ok(a.ok && !a.idempotent);
  assert.ok(b.ok && b.idempotent, "same key is idempotent");
  assert.deepEqual(c, { ok: false, reason: "slot_taken" }, "no double booking");
}

// --- Conversation: inbound booking end to end ---
{
  const s = fresh();
  let t = startConversation(s, { channel: "voice", direction: "inbound" }, NOW);
  assert.match(t.reply, /Asha/);
  assert.match(t.reply, /999/);
  t = respond(s, t.session, "I'd like to book my diabetes review please", NOW);
  assert.match(t.reply, /full name and date of birth/);
  t = respond(s, t.session, "James Patel", NOW);
  assert.match(t.reply, /date of birth/);
  t = respond(s, t.session, "22 November 1971", NOW);
  assert.match(t.reply, /diabetes review times/);
  assert.equal(t.session.offeredSlotIds.length, 3);
  const chosen = t.session.offeredSlotIds[1]!;
  t = respond(s, t.session, "the second one", NOW);
  assert.match(t.reply, /^Done/);
  assert.equal(s.slots.find((x) => x.id === chosen)?.patientId, "P002");
  assert.ok(s.workItems.some((w) => w.kind === "booking" && w.status === "resolved" && w.patientId === "P002"));
  t = respond(s, t.session, "that's all, bye", NOW);
  assert.equal(t.session.stage, "closed");
}

// --- Conversation: cancel frees slot → waitlist offer (Slot Fill) ---
{
  const s = fresh();
  const slot = s.slots.find((x) => !x.patientId && x.type === "diabetes_review")!;
  bookSlot(s, slot.id, "P002", "staff", "seed");
  let t = startConversation(s, { channel: "sms", direction: "inbound" }, NOW);
  t = respond(s, t.session, "I need to cancel my appointment. James Patel 22/11/1971", NOW);
  assert.match(t.reply, /Shall I cancel it/);
  t = respond(s, t.session, "yes please", NOW);
  assert.match(t.reply, /cancelled/);
  assert.equal(s.slots.find((x) => x.id === slot.id)?.patientId, null);
  assert.ok(s.workItems.some((w) => w.kind === "slot_fill"), "freed slot offered to the waiting list");
}

// --- Conversation: health update → patient-reported draft for a GP ---
{
  const s = fresh();
  let t = startConversation(s, { channel: "voice", direction: "inbound" }, NOW);
  t = respond(s, t.session, "I want to give an update, my sugars have been 13 to 15", NOW);
  t = respond(s, t.session, "James Patel, 22/11/1971", NOW);
  assert.match(t.reply, /13–15 mmol\/L/, "readings said before identity are kept");
  t = respond(s, t.session, "I've been really thirsty and I missed my metformin twice", NOW);
  t = respond(s, t.session, "that's all", NOW);
  assert.match(t.reply, /clinician will review/);
  assert.match(t.reply, /can’t tell you what the numbers mean/);
  const d = s.drafts[0]!;
  assert.equal(d.status, "pending");
  assert.equal(d.patientId, "P002");
  assert.ok(d.observations.length >= 3);
  assert.ok(s.workItems.some((w) => w.kind === "health_update" && w.status === "awaiting_clinician"));
}

// --- Conversation: emergency mid-call stops everything ---
{
  const s = fresh();
  let t = startConversation(s, { channel: "voice", direction: "inbound" }, NOW);
  t = respond(s, t.session, "I want to book an appointment", NOW);
  t = respond(s, t.session, "actually I have crushing chest pain", NOW);
  assert.match(t.reply, /call 999 now/);
  assert.equal(t.session.stage, "handed_off");
  assert.ok(s.workItems.some((w) => w.kind === "safety_escalation" && w.priority === "emergency"));
  t = respond(s, t.session, "hello?", NOW);
  assert.match(t.reply, /ended/);
}

// --- Conversation: clinical question → hand-off, never answered ---
{
  const s = fresh();
  let t = startConversation(s, { channel: "web_chat", direction: "inbound" }, NOW);
  t = respond(s, t.session, "Should I stop my metformin before my operation?", NOW);
  assert.match(t.reply, /question for a clinician/);
  t = respond(s, t.session, "Mrs Sarah Johnson " + "born " + "1959-03-14", NOW);
  // Either matched → handed off, or not matched after retries → handed off; never advice.
  assert.ok(!/stop|continue taking/i.test(t.reply) || t.session.stage !== "intent");
}

// --- Conversation: outbound check-in call ---
{
  const s = fresh();
  let t = startConversation(s, { channel: "voice", direction: "outbound", expectedPatientId: "P002", campaignKind: "health_check_in" }, NOW);
  assert.match(t.reply, /check-in/);
  t = respond(s, t.session, "James Patel, 22/11/1971", NOW);
  assert.match(t.reply, /blood sugar readings/);
  t = respond(s, t.session, "around 11 most mornings", NOW);
  t = respond(s, t.session, "no, nothing new", NOW);
  t = respond(s, t.session, "yes every day", NOW);
  assert.match(t.reply, /clinician will review/);
  assert.equal(s.drafts[0]?.direction, "outbound");
  const wrong = startConversation(s, { channel: "voice", direction: "outbound", expectedPatientId: "P002", campaignKind: "health_check_in" }, NOW);
  const r = respond(s, wrong.session, "Sarah Johnson 1959-03-14", NOW);
  assert.ok(r.session.stage === "handed_off" || /couldn’t match|date of birth/.test(r.reply), "wrong person never gets the check-in");
}

// --- GP-only decisions on patient-reported drafts (EC-CLIN-3) ---
{
  const s = fresh();
  let t = startConversation(s, { channel: "voice", direction: "inbound" }, NOW);
  t = respond(s, t.session, "update: blood pressure 150 over 95. James Patel 22/11/1971", NOW);
  t = respond(s, t.session, "that's all", NOW);
  const id = s.drafts[0]!.id;
  assert.equal(decideDraft(s, { draftId: id, decision: "accept", actor: "nurse@x", persona: "nurse" }).ok, false);
  const noReason = decideDraft(s, { draftId: id, decision: "reject", actor: "gp@x", persona: "gp" });
  assert.ok(!noReason.ok && noReason.status === 400);
  const ok = decideDraft(s, { draftId: id, decision: "accept", actor: "gp@x", persona: "gp" });
  assert.ok(ok.ok && ok.draft.stagedResourceIds?.length, "accept stages FHIR (rehearsal)");
  const again = decideDraft(s, { draftId: id, decision: "reject", actor: "gp@x", persona: "gp", reason: "x" });
  assert.ok(!again.ok && again.status === 409, "decisions are final");
}

// --- Recall campaigns ---
{
  const s = fresh();
  const c = createCampaign(s, "health_check_in", "pm@x", NOW.toISOString());
  assert.ok(c.targets.length > 0);
  assert.equal(canApproveCampaign("health_check_in", null, "operations_lead"), false, "practice manager cannot approve clinical check-ins");
  assert.equal(canApproveCampaign("missed_appointment", null, "operations_lead"), true);
  assert.equal(canApproveCampaign("health_check_in", "gp", "clinical_reviewer"), true);
  const early = runCampaign(s, c.id, NOW);
  assert.ok(!early.ok && early.status === 409, "no calls before approval");
  approveCampaign(s, c.id, "gp@x", NOW.toISOString());
  const done = runCampaign(s, c.id, NOW);
  assert.ok(done.ok);
  for (const t of c.targets) {
    assert.ok(t.outcome, `every target has an outcome (${t.patientId})`);
    if (!phoneContactAllowed(t.patientId)) assert.equal(t.outcome, "not_called_no_consent");
  }
  assert.ok(!/HbA1c|mmol|metformin|insulin|diagnos/i.test(c.script), "scripts read out no results, medicines or diagnoses");

  const recall = createCampaign(s, "recall", "pm@x", NOW.toISOString());
  approveCampaign(s, recall.id, "pm@x", NOW.toISOString());
  runCampaign(s, recall.id, NOW);
  assert.ok(recall.targets.some((t) => t.outcome === "booked"));
}

// --- Referral Desk ---
{
  const s = fresh();
  const routine = intakeReferral(s, "From: Dr Ahmed, Diabetes Centre\nRe: James Patel 22/11/1971\nReason: diabetes review after medication change", NOW.toISOString());
  assert.equal(routine.patientMatch, "matched");
  assert.equal(routine.status, "proposed");
  assert.ok(routine.proposedSlotId);
  const urgent = intakeReferral(s, "URGENT referral\nJames Patel 22/11/1971\nReason: suspected foot ulcer", NOW.toISOString());
  assert.equal(urgent.status, "handed_off", "urgent referrals go to a clinician before booking");
  const unknown = intakeReferral(s, "Re: Nobody Real 01/01/1900", NOW.toISOString());
  assert.equal(unknown.status, "handed_off");
}

// --- Metrics are labelled unverified ---
{
  const m = computeMetrics(fresh());
  assert.equal(m.verified, false);
  assert.match(m.note, /Synthetic/);
}

console.log("front-desk: safety, capture, answers, identity, calendar, conversations, decisions, campaigns, referrals — PASS");
