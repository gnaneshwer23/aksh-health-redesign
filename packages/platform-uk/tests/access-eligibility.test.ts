import assert from "node:assert/strict";

import { evaluateCandidates, renderOffer, type WaitlistFacts } from "../lib/access/eligibility";

const now = new Date("2026-10-12T09:00:00Z");
const slot = { appointmentType: "diabetes_review", site: "Main surgery", startsAt: "2026-10-13T10:00:00Z", durationMin: 20, offerExpiresAt: "2026-10-12T18:00:00Z" };
const base: WaitlistFacts = {
  id: "w0", patientId: "p0", appointmentType: "diabetes_review", reason: "patient_request", careGap: null,
  earliest: null, latest: null, preferredSites: [], minNoticeHours: 2, contactChannel: "sms", optedOut: false,
  status: "waiting", addedAt: "2026-09-01T00:00:00Z", hasActiveOffer: false,
};
const e = (over: Partial<WaitlistFacts>): WaitlistFacts => ({ ...base, ...over });
const codes = (id: string, list: ReturnType<typeof evaluateCandidates>) => list.find((c) => c.waitlistEntryId === id)!.exclusionCodes;

const results = evaluateCandidates(slot, [
  e({ id: "ok-old", addedAt: "2026-08-01T00:00:00Z" }),
  e({ id: "ok-new", addedAt: "2026-09-20T00:00:00Z" }),
  e({ id: "overdue", reason: "overdue_care", careGap: "HbA1c due", addedAt: "2026-09-25T00:00:00Z" }),
  e({ id: "type", appointmentType: "foot_check" }),
  e({ id: "late", latest: "2026-10-12" }),
  e({ id: "early", earliest: "2026-10-20" }),
  e({ id: "notice", minNoticeHours: 48 }),
  e({ id: "site", preferredSites: ["Branch clinic"] }),
  e({ id: "optout", optedOut: true }),
  e({ id: "nocontact", contactChannel: null }),
  e({ id: "offered", hasActiveOffer: true }),
  e({ id: "removed", status: "removed" }),
], now);

// Ranking: clinic-ordered reason first (overdue care), then longest waiting. Never clinical urgency.
assert.deepEqual(results.filter((r) => r.rank !== null).map((r) => r.waitlistEntryId), ["overdue", "ok-old", "ok-new"]);
assert.ok(results.find((r) => r.waitlistEntryId === "overdue")!.reasons.includes("HbA1c due"));
assert.deepEqual(codes("type", results), ["TYPE_MISMATCH"]);
assert.deepEqual(codes("late", results), ["AFTER_LATEST_DATE"]);
assert.deepEqual(codes("early", results), ["BEFORE_EARLIEST_DATE"]);
assert.deepEqual(codes("notice", results), ["INSUFFICIENT_NOTICE"]);
assert.deepEqual(codes("site", results), ["SITE_NOT_PREFERRED"]);
assert.deepEqual(codes("optout", results), ["OPTED_OUT"]);
assert.deepEqual(codes("nocontact", results), ["NO_CONTACT_PREFERENCE"]);
assert.deepEqual(results.find((r) => r.waitlistEntryId === "nocontact")!.missingFields, ["contact_channel"]);
assert.deepEqual(codes("offered", results), ["ALREADY_HOLDS_OFFER"]);
assert.deepEqual(codes("removed", results), ["NOT_WAITING"]);

// Deterministic: same inputs, same output.
assert.deepEqual(evaluateCandidates(slot, [e({ id: "a" }), e({ id: "b" })], now), evaluateCandidates(slot, [e({ id: "b" }), e({ id: "a" })], now).sort((x, y) => (x.rank ?? 99) - (y.rank ?? 99)));

// Expired offer window excludes everyone.
assert.ok(evaluateCandidates({ ...slot, offerExpiresAt: "2026-10-12T08:00:00Z" }, [e({ id: "x" })], now)[0]!.exclusionCodes.includes("OFFER_WINDOW_CLOSED"));

// Offer text uses only slot and organisation facts.
const offer = renderOffer({ givenName: "Mira", organisationName: "Northfield Clinic", appointmentType: "diabetes_review", startsAt: slot.startsAt, site: slot.site, offerExpiresAt: slot.offerExpiresAt, timeZone: "UTC" });
assert.match(offer, /Mira/);
assert.match(offer, /diabetes review/);
assert.match(offer, /Reply STOP/);
assert.doesNotMatch(offer, /HbA1c|risk|overdue/i, "no clinical content or reasons in patient-facing text");

console.log("access-eligibility: rules, exclusion codes, ranking, determinism, offer template — PASS");
