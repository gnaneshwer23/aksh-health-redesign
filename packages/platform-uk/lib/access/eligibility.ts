/**
 * Slot-fill eligibility and ranking — deterministic and versioned. Administrative only: ranking never represents
 * clinical priority. The organisation decides which waiting-list reasons come first; within a reason, the person who
 * has waited longest comes first. Every candidate carries the rules it passed, why it was excluded and what data is
 * missing, so staff can see exactly why a match was proposed.
 */
export const RULE_VERSION = "slot-fill-rules-v1";

export type SlotFacts = {
  appointmentType: string;
  site: string | null;
  startsAt: string;
  durationMin: number;
  offerExpiresAt: string;
};

export type WaitlistFacts = {
  id: string;
  patientId: string;
  appointmentType: string;
  reason: "overdue_care" | "patient_request" | "clinician_request";
  careGap: string | null;
  earliest: string | null;
  latest: string | null;
  preferredSites: string[];
  minNoticeHours: number;
  contactChannel: string | null;
  optedOut: boolean;
  status: string;
  addedAt: string;
  /** The patient already holds another live offer (prevents offering one person several slots at once). */
  hasActiveOffer: boolean;
};

export type CandidateResult = {
  waitlistEntryId: string;
  patientId: string;
  rank: number | null;
  rulesPassed: string[];
  exclusionCodes: string[];
  missingFields: string[];
  reasons: string[];
};

/** Organisation-owned ordering of waiting-list reasons (configurable; this is the default). */
export const DEFAULT_REASON_ORDER: WaitlistFacts["reason"][] = ["overdue_care", "patient_request", "clinician_request"];

const REASON_LABEL: Record<WaitlistFacts["reason"], string> = {
  overdue_care: "Overdue care per clinic recall rule",
  patient_request: "Patient asked for an earlier appointment",
  clinician_request: "Clinician asked for a sooner review",
};

export function evaluateCandidates(
  slot: SlotFacts,
  entries: WaitlistFacts[],
  now: Date,
  reasonOrder: WaitlistFacts["reason"][] = DEFAULT_REASON_ORDER
): CandidateResult[] {
  const start = new Date(slot.startsAt);
  const slotDay = slot.startsAt.slice(0, 10);
  const hoursToStart = (start.getTime() - now.getTime()) / 3_600_000;
  const offerOpen = new Date(slot.offerExpiresAt).getTime() > now.getTime();

  const evaluated = entries.map((e): CandidateResult => {
    const passed: string[] = [];
    const excluded: string[] = [];
    const missing: string[] = [];
    const check = (ok: boolean, rule: string, code: string) => (ok ? passed.push(rule) : excluded.push(code));

    check(e.status === "waiting", "on waiting list", "NOT_WAITING");
    check(e.appointmentType === slot.appointmentType, "appointment type matches", "TYPE_MISMATCH");
    check(!e.earliest || slotDay >= e.earliest, "not before earliest date", "BEFORE_EARLIEST_DATE");
    check(!e.latest || slotDay <= e.latest, "not after latest date", "AFTER_LATEST_DATE");
    check(hoursToStart >= e.minNoticeHours, `at least ${e.minNoticeHours}h notice`, "INSUFFICIENT_NOTICE");
    check(!e.preferredSites.length || (slot.site !== null && e.preferredSites.includes(slot.site)), "preferred site", "SITE_NOT_PREFERRED");
    check(!e.optedOut, "has not opted out of contact", "OPTED_OUT");
    check(!e.hasActiveOffer, "no other live offer", "ALREADY_HOLDS_OFFER");
    check(offerOpen, "offer window open", "OFFER_WINDOW_CLOSED");
    if (!e.contactChannel) {
      missing.push("contact_channel");
      excluded.push("NO_CONTACT_PREFERENCE");
    } else passed.push("contact preference recorded");

    const reasons = [REASON_LABEL[e.reason]];
    if (e.careGap) reasons.push(e.careGap);
    reasons.push(`Waiting since ${e.addedAt.slice(0, 10)}`);
    return { waitlistEntryId: e.id, patientId: e.patientId, rank: null, rulesPassed: passed, exclusionCodes: excluded, missingFields: missing, reasons };
  });

  const byId = new Map(entries.map((e) => [e.id, e]));
  const eligible = evaluated
    .filter((c) => c.exclusionCodes.length === 0)
    .sort((a, b) => {
      const ea = byId.get(a.waitlistEntryId)!;
      const eb = byId.get(b.waitlistEntryId)!;
      const ra = reasonOrder.indexOf(ea.reason);
      const rb = reasonOrder.indexOf(eb.reason);
      if (ra !== rb) return ra - rb;
      if (ea.addedAt !== eb.addedAt) return ea.addedAt.localeCompare(eb.addedAt);
      return ea.id.localeCompare(eb.id); // stable tie-break
    });
  eligible.forEach((c, i) => (c.rank = i + 1));
  return [...eligible, ...evaluated.filter((c) => c.exclusionCodes.length > 0)];
}

export const TEMPLATE_VERSION = "offer-template-v1";

export const APPOINTMENT_TYPE_LABEL: Record<string, string> = {
  diabetes_review: "diabetes review",
  hba1c_check: "HbA1c blood test",
  foot_check: "foot check",
  eye_screening: "eye screening",
  medication_review: "medication review",
};

/** Approved offer template: only facts from the slot record and the organisation; no clinical content. */
export function renderOffer(input: {
  givenName: string;
  organisationName: string;
  appointmentType: string;
  startsAt: string;
  site: string | null;
  offerExpiresAt: string;
  timeZone?: string;
}): string {
  const tz = input.timeZone ?? "UTC";
  const when = new Date(input.startsAt).toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: tz });
  const until = new Date(input.offerExpiresAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: tz });
  const type = APPOINTMENT_TYPE_LABEL[input.appointmentType] ?? input.appointmentType.replace(/_/g, " ");
  return `Hello ${input.givenName}, ${input.organisationName} has an earlier ${type} available on ${when}${input.site ? ` at ${input.site}` : ""}. Reply YES by ${until} to take it, or ignore this message to keep your current place. Reply STOP to stop these messages.`;
}
