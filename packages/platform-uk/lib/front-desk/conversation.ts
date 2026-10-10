import { bookSlot, cancelSlot, findFreeSlots, moveSlot, nextAppointmentFor, offerFreedSlot } from "./calendar";
import { captureHealthData, describeObservations } from "./health-capture";
import {
  APPOINTMENT_TYPE_LABEL,
  detectAppointmentType,
  detectIntent,
  isDone,
  isNo,
  isYes,
  londonDay,
  londonTime,
  pickOfferedSlot,
} from "./intents";
import { answerQuestion, PRACTICE_KNOWLEDGE } from "./knowledge";
import { displayName, getPatient, identifyPatient } from "./patients";
import { MARKET_BY_CODE } from "@/lib/synthetic-world/catalog";

import { screenUtterance } from "./safety";
import { newId } from "./store";
import { addWorkItem, createClinicalDraft } from "./workflows";
import type {
  AccessChannel,
  AccessDirection,
  AppointmentType,
  CampaignKind,
  ConversationSession,
  FrontDeskState,
  SafetyLevel,
  Slot,
} from "./types";

/**
 * Asha conversation engine (Front Desk). Deterministic, turn-based state machine.
 *
 * Every patient turn is safety-screened before anything else (H-ACC-1). Identity (name + DOB)
 * is required before booking or recording anything (H-ACC-3). Asha never gives clinical advice
 * (H-ACC-2): health updates become patient-reported drafts for a GP; clinical questions are
 * handed to the team.
 */

const SAFETY_RANK: Record<SafetyLevel, number> = { none: 0, clinician_review: 1, urgent_same_day: 2, emergency: 3, crisis: 3 };

const CHECK_IN_QUESTIONS = [
  "Thank you. How have your blood sugar readings been recently? You can tell me the numbers if you have them.",
  "And have you had any new symptoms, or anything worrying you about your health?",
  "Last one: are you managing to take your diabetes medicines as prescribed?",
];

export type TurnResult = { session: ConversationSession; reply: string };

function say(session: ConversationSession, text: string, at: string): TurnResult {
  session.transcript.push({ from: "asha", text, at });
  return { session, reply: text };
}

function practiceShort(state: FrontDeskState) {
  return state.practiceName.replace(" (synthetic)", "");
}

export function startConversation(
  state: FrontDeskState,
  input: { channel: AccessChannel; direction: AccessDirection; campaignId?: string | null; expectedPatientId?: string | null; campaignKind?: CampaignKind | null },
  now = new Date()
): TurnResult {
  const at = now.toISOString();
  const session: ConversationSession = {
    id: newId("conv"),
    channel: input.channel,
    direction: input.direction,
    stage: input.direction === "outbound" ? "identify" : "intent",
    patientId: null,
    identifyAttempts: 0,
    identifyBuffer: "",
    expectedPatientId: input.expectedPatientId ?? null,
    unknownCount: 0,
    pendingHandOffReason: null,
    highestSafety: "none",
    market: getPatient(input.expectedPatientId ?? null)?.market ?? "GB",
    intent: input.direction === "outbound" ? (input.campaignKind === "health_check_in" ? "health_update" : "book") : null,
    offeredSlotIds: [],
    pendingAppointmentType:
      input.campaignKind === "recall" ? "blood_test" : input.campaignKind && input.campaignKind !== "health_check_in" ? "diabetes_review" : null,
    moveFromSlotId: null,
    captured: [],
    checkInStep: input.campaignKind === "health_check_in" ? 0 : -1,
    campaignId: input.campaignId ?? null,
    transcript: [],
  };
  if (input.direction === "inbound") {
    state.counters.inboundContacts += 1;
    state.counters.answeredByFrontDesk += 1;
    return say(
      session,
      `Hello, you’re through to ${practiceShort(state)}. I’m Asha, the practice’s automated assistant. I can book, move or cancel appointments, take updates on your readings, or answer general questions about the practice. I can’t give medical advice. If this is an emergency, please hang up and call 999. How can I help?`,
      at
    );
  }
  const who = getPatient(session.expectedPatientId);
  const purpose =
    input.campaignKind === "health_check_in"
      ? "a short check-in your care team asked for. I can’t give medical advice, and a clinician reviews everything you tell me"
      : input.campaignKind === "recall"
        ? "your annual diabetes review, which starts with a blood test"
        : "booking an appointment you’re due";
  return say(
    session,
    `Hello, this is Asha, the automated assistant from ${practiceShort(state)}, calling about ${purpose}. ${who ? `I’m hoping to speak to ${displayName(who).split(" ")[0]}. ` : ""}To check I’m speaking to the right person, please tell me your full name and date of birth.`,
    at
  );
}

function slotLine(s: Slot, i: number) {
  return `${i + 1}. ${londonDay(s.start)} at ${londonTime(s.start)} with ${s.clinicianName}`;
}

function offerSlots(state: FrontDeskState, session: ConversationSession, type: AppointmentType, at: string, exclude: string[] = []): TurnResult {
  const slots = findFreeSlots(state, type, { after: at, limit: 3, excludeIds: exclude });
  session.pendingAppointmentType = type;
  if (!slots.length) {
    if (session.patientId && !state.waitlist.some((w) => w.patientId === session.patientId && w.type === type && w.status === "waiting")) {
      state.waitlist.push({ id: newId("wait"), patientId: session.patientId, type, priority: "routine", addedAt: at, status: "waiting" });
    }
    session.stage = "intent";
    session.intent = null;
    return say(session, `There are no ${APPOINTMENT_TYPE_LABEL[type]} slots in the next two weeks. I’ve added you to the waiting list and we’ll contact you if one comes up. Anything else?`, at);
  }
  session.offeredSlotIds = slots.map((s) => s.id);
  session.stage = "offer_slots";
  return say(
    session,
    `I can offer these ${APPOINTMENT_TYPE_LABEL[type]} times:\n${slots.map(slotLine).join("\n")}\nWhich would you like? Or say “none of these”.`,
    at
  );
}

function handOff(state: FrontDeskState, session: ConversationSession, reason: string, at: string, kind: "hand_off" | "prescription_request" = "hand_off"): TurnResult {
  session.stage = "handed_off";
  addWorkItem(state, {
    kind,
    status: "handed_off",
    channel: session.channel,
    direction: session.direction,
    patientId: session.patientId,
    summary: `${session.patientId ? displayName(getPatient(session.patientId)!) : "Unidentified caller"}: ${reason}`,
    priority: "routine",
    handOffReason: reason,
    conversationId: session.id,
    at,
  });
  return say(
    session,
    kind === "prescription_request"
      ? "I’ve passed your request to the prescriptions team. They’ll be in touch if they need anything. Thank you for calling."
      : `I’ve passed this to the practice team and someone will call you back on the number we hold for you. If it becomes urgent, call ${MARKET_BY_CODE[session.market ?? "GB"].urgentAdviceLine ?? "your local urgent care service"}, or ${MARKET_BY_CODE[session.market ?? "GB"].emergencyNumber} in an emergency. Thank you for calling.`,
    at
  );
}

function startIntent(state: FrontDeskState, session: ConversationSession, utterance: string, at: string): TurnResult {
  const p = getPatient(session.patientId)!;
  switch (session.intent) {
    case "book": {
      const type = session.pendingAppointmentType ?? detectAppointmentType(utterance);
      if (!type) {
        session.stage = "intent";
        return say(session, `Thanks, ${displayName(p).split(" ")[0]}. Is this for a GP appointment, a diabetes review, a blood test, or a nurse appointment?`, at);
      }
      return offerSlots(state, session, type, at);
    }
    case "move": {
      const current = nextAppointmentFor(state, p.id, at);
      if (!current) {
        session.intent = "book";
        session.stage = "intent";
        return say(session, "I can’t see an upcoming appointment for you. Would you like to book one? Tell me what it’s for.", at);
      }
      session.moveFromSlotId = current.id;
      return offerSlots(state, session, current.type, at, [current.id]);
    }
    case "cancel": {
      const current = nextAppointmentFor(state, p.id, at);
      if (!current) {
        session.stage = "intent";
        session.intent = null;
        return say(session, "I can’t see an upcoming appointment to cancel. Is there anything else I can help with?", at);
      }
      session.moveFromSlotId = current.id;
      session.stage = "confirm_cancel";
      return say(session, `Your next appointment is ${londonDay(current.start)} at ${londonTime(current.start)} with ${current.clinicianName}. Shall I cancel it?`, at);
    }
    case "health_update": {
      if (session.checkInStep >= 0) {
        session.stage = "check_in";
        return say(session, CHECK_IN_QUESTIONS[session.checkInStep]!, at);
      }
      session.stage = "collect_health";
      session.captured.push(...captureHealthData(utterance));
      return say(
        session,
        session.captured.length
          ? `Thanks. I’ve noted ${describeObservations(session.captured)}. Anything else, like other readings, how you’re feeling, or your medicines? Say “that’s all” when you’re done.`
          : "Please go ahead: tell me your readings, how you’re feeling, or anything about your medicines. Say “that’s all” when you’re done.",
        at
      );
    }
    case "repeat_prescription":
      return handOff(state, session, "Repeat prescription request", at, "prescription_request");
    case "speak_to_someone":
    default:
      return handOff(state, session, session.pendingHandOffReason ?? "Asked to speak to someone", at);
  }
}

function finishHealthCapture(state: FrontDeskState, session: ConversationSession, at: string): TurnResult {
  const p = getPatient(session.patientId)!;
  if (session.captured.length) {
    createClinicalDraft(state, {
      patientId: p.id,
      channel: session.channel,
      direction: session.direction,
      observations: session.captured,
      safety: session.highestSafety,
      at,
    });
    addWorkItem(state, {
      kind: "health_update",
      status: "awaiting_clinician",
      channel: session.channel,
      direction: session.direction,
      patientId: p.id,
      summary: `${displayName(p)}: ${describeObservations(session.captured)}`,
      priority: SAFETY_RANK[session.highestSafety] >= 1 ? "urgent" : "routine",
      conversationId: session.id,
      campaignId: session.campaignId ?? undefined,
      at,
    });
  }
  const summary = describeObservations(session.captured);
  session.lastRecorded = session.captured;
  session.captured = [];
  session.checkInStep = -1;
  session.stage = "intent";
  session.intent = null;
  return say(
    session,
    `Thank you. I’ve recorded ${summary} for your care team. A clinician will review it; I can’t tell you what the numbers mean. Is there anything else I can help with, like booking an appointment?`,
    at
  );
}

export function respond(state: FrontDeskState, session: ConversationSession, utterance: string, now = new Date()): TurnResult {
  const at = now.toISOString();
  const text = utterance.trim().slice(0, 1000);
  session.transcript.push({ from: "patient", text, at });

  if (session.stage === "closed" || session.stage === "handed_off") {
    return say(session, "This conversation has ended. Please start a new call if you need anything else.", at);
  }

  // 1. Safety first, every turn.
  const safety = screenUtterance(text, session.market ?? "GB");
  if (SAFETY_RANK[safety.level] > SAFETY_RANK[session.highestSafety]) session.highestSafety = safety.level;
  if (safety.handOffNow) {
    const captured = captureHealthData(text);
    if (session.patientId && (captured.length || session.captured.length)) {
      createClinicalDraft(state, {
        patientId: session.patientId,
        channel: session.channel,
        direction: session.direction,
        observations: [...session.captured, ...captured],
        safety: safety.level,
        at,
      });
    }
    addWorkItem(state, {
      kind: "safety_escalation",
      status: "handed_off",
      channel: session.channel,
      direction: session.direction,
      patientId: session.patientId,
      summary: `${session.patientId ? displayName(getPatient(session.patientId)!) : "Unidentified caller"}: ${safety.reason} (“${safety.matched}”)`,
      priority: safety.level === "urgent_same_day" ? "urgent" : "emergency",
      handOffReason: safety.reason ?? undefined,
      conversationId: session.id,
      campaignId: session.campaignId ?? undefined,
      at,
    });
    session.stage = "handed_off";
    return say(session, safety.patientMessage!, at);
  }

  // 2. Identity.
  if (session.stage === "identify") {
    session.identifyBuffer = `${session.identifyBuffer} ${text}`.slice(-400);
    const id = identifyPatient(session.identifyBuffer);
    if (id.kind === "matched") {
      if (session.expectedPatientId && id.patient.id !== session.expectedPatientId) {
        return handOff(state, session, "Outbound call reached a different person than intended", at);
      }
      session.patientId = id.patient.id;
      session.market = id.patient.market;
      session.identifyBuffer = "";
      if (!session.intent) {
        session.stage = "intent";
        return say(session, `Thanks, ${displayName(id.patient).split(" ")[0]}. How can I help?`, at);
      }
      return startIntent(state, session, text, at);
    }
    session.identifyAttempts += 1;
    if (session.identifyAttempts >= 3 || (id.kind === "no_match" && session.identifyAttempts >= 2)) {
      return handOff(state, session, "Could not confirm identity", at);
    }
    if (id.kind === "need_more") {
      const missing = id.missing.join(" and ").replace("dob", "date of birth").replace("name", "full name");
      return say(session, `Thanks. Could you also tell me your ${missing}?`, at);
    }
    session.identifyBuffer = "";
    return say(session, "I couldn’t match those details. Please say your full name and date of birth again, for example “Jane Smith, 3rd April 1960”.", at);
  }

  // 3. Stage handlers.
  if (session.stage === "offer_slots") {
    if (isNo(text) || /none of (these|them)/i.test(text)) {
      const type = session.pendingAppointmentType;
      if (session.patientId && type && !state.waitlist.some((w) => w.patientId === session.patientId && w.type === type && w.status === "waiting")) {
        state.waitlist.push({ id: newId("wait"), patientId: session.patientId, type, priority: "routine", addedAt: at, status: "waiting" });
      }
      session.stage = "intent";
      session.intent = null;
      session.offeredSlotIds = [];
      return say(session, "No problem. I’ve added you to the waiting list, and we’ll offer you an earlier slot if one comes up. Anything else?", at);
    }
    const offered = session.offeredSlotIds.map((id) => state.slots.find((s) => s.id === id)).filter(Boolean) as Slot[];
    const idx = pickOfferedSlot(text, offered);
    if (idx === null) return say(session, "Sorry, which one? You can say “the first one” or the time, like “9:20”.", at);
    const chosen = offered[idx]!;
    const p = getPatient(session.patientId)!;
    const key = `${session.id}:${chosen.id}`;
    const result = session.moveFromSlotId
      ? moveSlot(state, session.moveFromSlotId, chosen.id, p.id, session.channel, key)
      : bookSlot(state, chosen.id, p.id, session.channel, key);
    if (!result.ok) {
      return offerSlots(state, session, chosen.type, at, [chosen.id]);
    }
    const moved = Boolean(session.moveFromSlotId);
    addWorkItem(state, {
      kind: moved ? "move" : "booking",
      status: "resolved",
      channel: session.channel,
      direction: session.direction,
      patientId: p.id,
      summary: `${displayName(p)} ${moved ? "moved to" : "booked"} ${APPOINTMENT_TYPE_LABEL[chosen.type]}, ${londonDay(chosen.start)} ${londonTime(chosen.start)}`,
      priority: "routine",
      conversationId: session.id,
      campaignId: session.campaignId ?? undefined,
      at,
    });
    session.stage = "intent";
    session.intent = null;
    session.offeredSlotIds = [];
    session.moveFromSlotId = null;
    session.pendingAppointmentType = null;
    return say(
      session,
      `Done. You’re ${moved ? "now" : ""} booked for ${londonDay(chosen.start)} at ${londonTime(chosen.start)} with ${chosen.clinicianName}. You’ll get a text to confirm. Is there anything else?`.replace("  ", " "),
      at
    );
  }

  if (session.stage === "confirm_cancel") {
    const p = getPatient(session.patientId)!;
    if (isYes(text)) {
      const freed = cancelSlot(state, session.moveFromSlotId!, p.id);
      session.moveFromSlotId = null;
      session.stage = "intent";
      session.intent = null;
      if (freed) {
        addWorkItem(state, { kind: "cancellation", status: "resolved", channel: session.channel, direction: session.direction, patientId: p.id, summary: `${displayName(p)} cancelled ${APPOINTMENT_TYPE_LABEL[freed.type]}, ${londonDay(freed.start)} ${londonTime(freed.start)}`, priority: "routine", conversationId: session.id, at });
        const offeredTo = offerFreedSlot(state, freed);
        if (offeredTo) {
          const w = getPatient(offeredTo.patientId);
          addWorkItem(state, { kind: "slot_fill", status: "open", channel: "sms", direction: "outbound", patientId: offeredTo.patientId, summary: `Freed slot offered to ${w ? displayName(w) : offeredTo.patientId} from the waiting list`, priority: "routine", at });
        }
      }
      return say(session, "That’s cancelled. Thank you for letting us know, it means someone else can use the slot. Would you like to rebook, or is there anything else?", at);
    }
    session.stage = "intent";
    session.intent = null;
    session.moveFromSlotId = null;
    return say(session, "Okay, I’ve left it as it is. Anything else I can help with?", at);
  }

  if (session.stage === "collect_health") {
    if (isDone(text) || (isNo(text) && text.split(/\s+/).length <= 4)) return finishHealthCapture(state, session, at);
    const captured = captureHealthData(text);
    session.captured.push(...captured);
    return say(
      session,
      captured.length ? `Noted: ${describeObservations(captured)}. Anything else? Say “that’s all” when you’re done.` : "Got it. Anything else? Say “that’s all” when you’re done.",
      at
    );
  }

  if (session.stage === "check_in") {
    // The first question asks for readings, so bare numbers ("mostly 12 to 14") are glucose.
    let captured = captureHealthData(text);
    if (session.checkInStep === 0 && !captured.some((c) => c.kind === "capillary_glucose") && /\d/.test(text)) {
      captured = [...captured, ...captureHealthData(`sugar ${text}`).filter((c) => c.kind === "capillary_glucose")];
    }
    session.captured.push(...captured);
    if (session.checkInStep === 2 && !captured.some((c) => c.kind === "medication_adherence")) {
      const answer = isYes(text) ? "Reports taking medicines as prescribed" : isNo(text) ? "Reports not taking medicines as prescribed" : null;
      if (answer) {
        session.captured.push({ kind: "medication_adherence", code: null, display: "Medication adherence (patient-reported)", value: answer, unit: null, raw: text, verified: false, source: "patient_reported" });
      }
    }
    session.checkInStep += 1;
    if (session.checkInStep < CHECK_IN_QUESTIONS.length) return say(session, CHECK_IN_QUESTIONS[session.checkInStep]!, at);
    return finishHealthCapture(state, session, at);
  }

  // 4. Intent stage.
  if (isDone(text) && !session.intent) {
    session.stage = "closed";
    return say(session, "Thank you for calling. Take care, goodbye.", at);
  }

  if (session.intent === "book" && session.patientId) {
    const type = detectAppointmentType(text);
    if (type) return offerSlots(state, session, type, at);
  }

  const intent = detectIntent(text);
  const pendingType = detectAppointmentType(text);

  if (intent === "question") {
    const ans = answerQuestion(text);
    if (ans.kind === "answer") {
      session.unknownCount = 0;
      return say(session, `${ans.article.body}\n(Source: practice information, “${ans.article.title}”.) Anything else?`, at);
    }
    if (ans.kind === "clinical") {
      session.intent = "speak_to_someone";
      session.pendingHandOffReason = "Clinical question for a clinician";
      if (session.patientId) return handOff(state, session, session.pendingHandOffReason, at);
      session.stage = "identify";
      return say(session, "That’s a question for a clinician, so I’ll ask the team to call you back. First, please tell me your full name and date of birth.", at);
    }
  }

  if (intent === "unknown" || (intent === "question")) {
    session.unknownCount += 1;
    if (session.unknownCount >= 2) {
      session.intent = "speak_to_someone";
      session.pendingHandOffReason = "Asha could not help with the request";
      if (session.patientId) return handOff(state, session, session.pendingHandOffReason, at);
      session.stage = "identify";
      return say(session, "I’m not able to help with that, so I’ll ask the team to call you back. Please tell me your full name and date of birth.", at);
    }
    return say(
      session,
      `Sorry, I didn’t catch that. I can book, move or cancel an appointment, take an update on your readings, or answer questions such as ${PRACTICE_KNOWLEDGE.slice(0, 2).map((a) => a.title.toLowerCase()).join(" or ")}. What would you like to do?`,
      at
    );
  }

  session.unknownCount = 0;
  session.intent = intent;
  if (pendingType) session.pendingAppointmentType = pendingType;
  if (!session.patientId) {
    // Keep anything already said (e.g. readings) while we confirm identity.
    if (intent === "health_update") session.captured.push(...captureHealthData(text));
    session.stage = "identify";
    session.identifyBuffer = text;
    const id = identifyPatient(text);
    if (id.kind === "matched") {
      session.patientId = id.patient.id;
      session.market = id.patient.market;
      session.identifyBuffer = "";
      if (intent === "health_update") session.captured = [];
      return startIntent(state, session, text, at);
    }
    return say(session, "I can help with that. First, to check who I’m speaking to, please tell me your full name and date of birth.", at);
  }
  return startIntent(state, session, text, at);
}
