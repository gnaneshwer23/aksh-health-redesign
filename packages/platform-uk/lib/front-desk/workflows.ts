import type { ClinicalPersona } from "@/lib/user-scope";
import type { AppRole } from "@/lib/permission-matrix";
import { patients } from "@/lib/mock-data/patients";

import { bookSlot, findFreeSlots } from "./calendar";
import { captureHealthData, describeObservations, toFhirObservationDrafts } from "./health-capture";
import { detectAppointmentType } from "./intents";
import { displayName, getPatient, identifyPatient, phoneContactAllowed } from "./patients";
import { screenUtterance } from "./safety";
import { newId } from "./store";
import type {
  AccessChannel,
  AccessDirection,
  Campaign,
  CampaignKind,
  ClinicalDraft,
  FrontDeskState,
  PatientReportedObservation,
  ReferralIntake,
  SafetyLevel,
  WorkItem,
} from "./types";

export function addWorkItem(state: FrontDeskState, item: Omit<WorkItem, "id" | "at"> & { at?: string }) {
  const full: WorkItem = { id: newId("wi"), at: item.at ?? new Date().toISOString(), ...item };
  state.workItems.unshift(full);
  state.workItems = state.workItems.slice(0, 300);
  return full;
}

export function createClinicalDraft(
  state: FrontDeskState,
  input: {
    patientId: string;
    channel: AccessChannel;
    direction: AccessDirection;
    observations: PatientReportedObservation[];
    safety: SafetyLevel;
    at?: string;
  }
): ClinicalDraft {
  const p = getPatient(input.patientId);
  const draft: ClinicalDraft = {
    id: newId("draft"),
    patientId: input.patientId,
    patientName: p?.name ?? input.patientId,
    createdAt: input.at ?? new Date().toISOString(),
    channel: input.channel,
    direction: input.direction,
    summary: `Patient reported: ${describeObservations(input.observations)}.`,
    observations: input.observations,
    safety: input.safety,
    status: "pending",
  };
  state.drafts.unshift(draft);
  return draft;
}

export type DecisionResult =
  | { ok: true; draft: ClinicalDraft }
  | { ok: false; status: 403 | 404 | 409 | 400; error: string };

/**
 * Patient-reported data becomes a staged record only when a GP accepts it (EC-CLIN-3:
 * nurses raise and observe; the confirming actor is the GP). Decisions are final.
 */
export function decideDraft(
  state: FrontDeskState,
  input: { draftId: string; decision: "accept" | "reject"; actor: string; persona: ClinicalPersona | null; reason?: string; at?: string }
): DecisionResult {
  if (input.persona !== "gp") {
    return { ok: false, status: 403, error: "Only a GP session may accept or reject patient-reported data." };
  }
  const draft = state.drafts.find((d) => d.id === input.draftId);
  if (!draft) return { ok: false, status: 404, error: "Draft not found." };
  if (draft.status !== "pending") return { ok: false, status: 409, error: `Draft already ${draft.status}.` };
  if (input.decision === "reject" && !input.reason?.trim()) {
    return { ok: false, status: 400, error: "A reason is required to reject." };
  }
  const at = input.at ?? new Date().toISOString();
  draft.status = input.decision === "accept" ? "accepted" : "rejected";
  draft.decidedBy = input.actor;
  draft.decidedAt = at;
  draft.reason = input.reason?.trim() || undefined;
  if (draft.status === "accepted") {
    // BRIDGE rehearsal: staged FHIR, still tagged patient-reported; never a live EHR write.
    draft.stagedResourceIds = toFhirObservationDrafts(draft.patientId, draft.observations, at).map((r) => r.id);
  }
  const wi = state.workItems.find((w) => w.kind === "health_update" && w.patientId === draft.patientId && w.status === "awaiting_clinician");
  if (wi) wi.status = "resolved";
  return { ok: true, draft };
}

// ---------- Recall campaigns ----------

const CAMPAIGN_SCRIPTS: Record<CampaignKind, string> = {
  missed_appointment:
    "Hello, this is Asha, the automated assistant from {practice}. We noticed you weren’t able to make a recent appointment and wanted to help you rebook. To check I’m speaking to the right person, please tell me your full name and date of birth.",
  lapsed_review:
    "Hello, this is Asha from {practice}. You’re due a routine review and we’d like to help you book it. To check I’m speaking to the right person, please tell me your full name and date of birth.",
  recall:
    "Hello, this is Asha from {practice}. It’s time for your annual diabetes review, which starts with a blood test. To check I’m speaking to the right person, please tell me your full name and date of birth.",
  health_check_in:
    "Hello, this is Asha from {practice}, calling for a short check-in your care team asked for. I can’t give medical advice, and a clinician reviews everything you tell me. To check I’m speaking to the right person, please tell me your full name and date of birth.",
};

const CAMPAIGN_NAMES: Record<CampaignKind, string> = {
  missed_appointment: "Rebook missed diabetes appointments",
  lapsed_review: "Lapsed reviews (not seen for 6 months)",
  recall: "Annual diabetes review recall",
  health_check_in: "High-risk diabetes check-in calls",
};

function isDiabetic(p: (typeof patients)[number]) {
  return p.activeConditions.some((c) => /diabetes/i.test(c));
}

export function campaignTargets(state: FrontDeskState, kind: CampaignKind) {
  const diabetic = patients.filter(isDiabetic);
  const booked = new Set(state.slots.filter((s) => s.patientId && s.type === "diabetes_review").map((s) => s.patientId));
  const anchor = Date.parse(state.anchorDate);
  switch (kind) {
    case "missed_appointment":
      return diabetic.filter((p) => Number(p.id.replace(/\D/g, "")) % 5 === 0).slice(0, 8).map((p) => ({ patientId: p.id, reason: "Did not attend diabetes review (synthetic)" }));
    case "lapsed_review":
      return diabetic
        .filter((p) => anchor - Date.parse(p.lastEncounterDate) > 182 * 86_400_000)
        .slice(0, 10)
        .map((p) => ({ patientId: p.id, reason: `Last seen ${p.lastEncounterDate}` }));
    case "recall":
      return diabetic.filter((p) => !booked.has(p.id)).slice(0, 12).map((p) => ({ patientId: p.id, reason: "Annual diabetes review due" }));
    case "health_check_in":
      return diabetic
        .filter((p) => p.oracleRisk === "VeryHigh" || p.oracleRisk === "High")
        .slice(0, 8)
        .map((p) => ({ patientId: p.id, reason: `HORIZON ${p.oracleRisk === "VeryHigh" ? "Very High" : "High"} · ${p.oracleScore}` }));
  }
}

export function createCampaign(state: FrontDeskState, kind: CampaignKind, createdBy: string, at = new Date().toISOString()): Campaign {
  const c: Campaign = {
    id: newId("camp"),
    kind,
    name: CAMPAIGN_NAMES[kind],
    createdAt: at,
    createdBy,
    status: "draft",
    targets: campaignTargets(state, kind),
    script: CAMPAIGN_SCRIPTS[kind].replace("{practice}", state.practiceName.replace(" (synthetic)", "")),
  };
  state.campaigns.unshift(c);
  return c;
}

/** Health check-ins carry clinical content: GP approves. Admin rebooking: GP or practice manager. */
export function canApproveCampaign(kind: CampaignKind, persona: ClinicalPersona | null, appRole: AppRole) {
  if (kind === "health_check_in") return persona === "gp";
  return persona === "gp" || appRole === "operations_lead";
}

export function approveCampaign(state: FrontDeskState, id: string, actor: string, at = new Date().toISOString()) {
  const c = state.campaigns.find((x) => x.id === id);
  if (!c) return null;
  if (c.status === "draft") {
    c.status = "approved";
    c.approvedBy = actor;
    c.approvedAt = at;
  }
  return c;
}

/** Synthetic replies for simulated check-in calls, chosen deterministically per patient. */
const CHECK_IN_REPLIES = [
  "My sugars have been 9 to 11 most mornings. I'm taking my tablets every day.",
  "Readings around 13, I've been really thirsty and tired. I missed my metformin a few times.",
  "Blood pressure was 148 over 92 at the pharmacy. Otherwise fine.",
  "My sugar was 2.8 yesterday and I felt shaky and sweaty.",
  "Weight is 96 kg, sugars about 8. Feeling okay.",
];

function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export function runCampaign(state: FrontDeskState, id: string, now = new Date()) {
  const c = state.campaigns.find((x) => x.id === id);
  if (!c) return { ok: false as const, status: 404, error: "Campaign not found." };
  if (c.status !== "approved") return { ok: false as const, status: 409, error: "Campaign must be approved before any call is made." };
  const at = now.toISOString();
  for (const t of c.targets) {
    const p = getPatient(t.patientId);
    if (!p) continue;
    if (!phoneContactAllowed(p.id)) {
      t.outcome = "not_called_no_consent";
      t.detail = "Contact preference excludes phone";
      continue;
    }
    const roll = hash(`${c.id}:${p.id}`) % 10;
    if (roll === 0) {
      t.outcome = "no_answer";
      continue;
    }
    if (roll === 1) {
      t.outcome = "voicemail";
      t.detail = "Left a callback message (no clinical details)";
      continue;
    }
    if (c.kind === "health_check_in") {
      const reply = CHECK_IN_REPLIES[hash(p.id) % CHECK_IN_REPLIES.length]!;
      const safety = screenUtterance(reply);
      const observations = captureHealthData(reply);
      createClinicalDraft(state, { patientId: p.id, channel: "voice", direction: "outbound", observations, safety: safety.level, at });
      if (safety.handOffNow) {
        t.outcome = "escalated";
        t.detail = safety.reason ?? "Escalated";
        addWorkItem(state, { kind: "safety_escalation", status: "handed_off", channel: "voice", direction: "outbound", patientId: p.id, summary: `${displayName(p)}: ${safety.reason}`, priority: "urgent", handOffReason: safety.reason ?? undefined, campaignId: c.id, at });
      } else {
        t.outcome = "check_in_completed";
        t.detail = describeObservations(observations);
        addWorkItem(state, { kind: "health_update", status: "awaiting_clinician", channel: "voice", direction: "outbound", patientId: p.id, summary: `${displayName(p)} check-in: ${describeObservations(observations)}`, priority: "routine", campaignId: c.id, at });
      }
      continue;
    }
    if (roll === 2) {
      t.outcome = "declined";
      t.detail = "Patient will book later";
      continue;
    }
    const type = c.kind === "recall" ? "blood_test" : "diabetes_review";
    const slot = findFreeSlots(state, type, { after: at, limit: 1 })[0];
    if (!slot) {
      t.outcome = "declined";
      t.detail = "No suitable slot; added to waitlist";
      if (!state.waitlist.some((w) => w.patientId === p.id && w.type === type)) {
        state.waitlist.push({ id: newId("wait"), patientId: p.id, type, priority: "routine", addedAt: at, status: "waiting" });
      }
      continue;
    }
    bookSlot(state, slot.id, p.id, "voice", `${c.id}:${p.id}`);
    t.outcome = "booked";
    t.detail = `${slot.clinicianName}, ${new Date(slot.start).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" })}`;
    addWorkItem(state, { kind: "campaign_call", status: "resolved", channel: "voice", direction: "outbound", patientId: p.id, summary: `${displayName(p)} booked via ${c.name}`, priority: "routine", campaignId: c.id, at });
  }
  c.status = "complete";
  return { ok: true as const, campaign: c };
}

// ---------- Referral Desk ----------

export function intakeReferral(state: FrontDeskState, letterText: string, at = new Date().toISOString()): ReferralIntake {
  const id = identifyPatient(letterText);
  const lines = letterText.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const reasonLine = lines.find((l) => /^(reason|re:|indication|presenting)/i.test(l)) ?? lines.find((l) => /refer/i.test(l)) ?? lines[0] ?? "";
  const referrer = lines.find((l) => /^(from|referrer|dr\.?\s)/i.test(l)) ?? null;
  const urgent = /\b(urgent|2ww|two week wait|same day|asap)\b/i.test(letterText);
  const suggestedType = detectAppointmentType(letterText) ?? (/diabet/i.test(letterText) ? "diabetes_review" : "gp_routine");
  const slot = id.kind === "matched" ? findFreeSlots(state, suggestedType, { after: at, limit: 1 })[0] ?? null : null;
  const intake: ReferralIntake = {
    id: newId("ref"),
    receivedAt: at,
    patientId: id.kind === "matched" ? id.patient.id : null,
    patientMatch: id.kind === "matched" ? "matched" : id.kind === "no_match" ? "not_found" : "ambiguous",
    referrer: referrer?.replace(/^(from|referrer):?\s*/i, "") ?? null,
    reason: reasonLine.replace(/^(reason|re|indication|presenting)[:\s]*/i, "").slice(0, 240),
    urgency: urgent ? "urgent" : "routine",
    suggestedType,
    proposedSlotId: urgent ? null : slot?.id ?? null,
    status: id.kind === "matched" && !urgent && slot ? "proposed" : "handed_off",
  };
  state.referrals.unshift(intake);
  addWorkItem(state, {
    kind: "referral",
    status: intake.status === "proposed" ? "open" : "handed_off",
    channel: "staff",
    direction: "inbound",
    patientId: intake.patientId,
    summary:
      intake.patientMatch !== "matched"
        ? "Referral received: patient not matched, needs staff"
        : intake.urgency === "urgent"
          ? "Urgent referral: clinician triage before booking"
          : `Referral: ${intake.reason || "see letter"}`,
    priority: intake.urgency === "urgent" ? "urgent" : "routine",
    handOffReason: intake.status === "handed_off" ? (intake.urgency === "urgent" ? "Urgent referrals are triaged by a clinician" : "Patient not matched") : undefined,
    at,
  });
  return intake;
}

export function confirmReferralBooking(state: FrontDeskState, referralId: string) {
  const r = state.referrals.find((x) => x.id === referralId);
  if (!r || r.status !== "proposed" || !r.patientId || !r.proposedSlotId) return null;
  const booked = bookSlot(state, r.proposedSlotId, r.patientId, "staff", `ref:${r.id}`);
  if (!booked.ok) return null;
  r.status = "booked";
  return r;
}

// ---------- Metrics (baseline locked before go-live → lift) ----------

export function computeMetrics(state: FrontDeskState) {
  const inbound = state.workItems.filter((w) => w.direction === "inbound" && w.channel !== "staff");
  const handedOff = inbound.filter((w) => w.status === "handed_off").length;
  const upcoming = state.slots;
  const filled = upcoming.filter((s) => s.patientId).length;
  const missed = state.campaigns.filter((c) => c.kind === "missed_appointment" && c.status === "complete").flatMap((c) => c.targets);
  const rebooked = missed.filter((t) => t.outcome === "booked").length;
  const current = {
    callsAnsweredPct: inbound.length ? 100 : state.baseline.callsAnsweredPct,
    avgWaitSeconds: inbound.length ? 4 : state.baseline.avgWaitSeconds,
    slotsFilledPct: upcoming.length ? Math.round((filled / upcoming.length) * 100) : 0,
    missedRebookedPct: missed.length ? Math.round((rebooked / missed.length) * 100) : state.baseline.missedRebookedPct,
    handOffPct: inbound.length ? Math.round((handedOff / inbound.length) * 100) : state.baseline.handOffPct,
  };
  return {
    baseline: state.baseline,
    current,
    lift: {
      callsAnsweredPct: current.callsAnsweredPct - state.baseline.callsAnsweredPct,
      avgWaitSeconds: current.avgWaitSeconds - state.baseline.avgWaitSeconds,
      slotsFilledPct: current.slotsFilledPct - state.baseline.slotsFilledPct,
      missedRebookedPct: current.missedRebookedPct - state.baseline.missedRebookedPct,
      handOffPct: current.handOffPct - state.baseline.handOffPct,
    },
    sample: { inboundContacts: inbound.length, campaignsRun: state.campaigns.filter((c) => c.status === "complete").length },
    verified: false as const,
    note: "Synthetic demo figures. Verified lift needs practice telephony and appointment data against a baseline locked before go-live.",
  };
}
