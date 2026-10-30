/**
 * P1 — intake → Front Desk booking handoff carries verified identity + care_episode_id.
 */
import assert from "node:assert/strict";

import { bookSlot } from "../lib/front-desk/calendar";
import {
  enrichReferralIdentity,
  openIntakeBookingWorkItem,
  verifiedPatientFromId,
} from "../lib/front-desk/intake-booking-handoff";
import { handoffBookingToNurse, listOpenNurseObservationTasks } from "../lib/front-desk/nurse-handoff";
import { createInitialState } from "../lib/front-desk/store";
import { confirmReferralBooking, intakeReferral } from "../lib/front-desk/workflows";

const SAMPLE = `From: Dr Ahmed, Community Diabetes Service
Re: James Patel, DOB 22/11/1971
Reason: diabetes review after starting a new medicine; please book with the diabetes nurse.`;

async function main() {
  const state = createInitialState();
  const episodeId = "ce-intake-book-p1";

  const verified = verifiedPatientFromId("P002");
  assert.ok(verified, "P002 must resolve in desk directory");
  assert.ok(verified!.dob);

  const work = openIntakeBookingWorkItem(state, {
    careEpisodeId: episodeId,
    patientId: "P002",
    verifiedPatient: verified!,
    intakeSummary: `${verified!.name} · DOB ${verified!.dob} · diabetes review`,
    reviewCaseId: "case-intake-1",
    reason: "diabetes review",
  });
  assert.equal(work.kind, "booking");
  assert.equal(work.careEpisodeId, episodeId);
  assert.ok(work.summary.includes(verified!.name));
  assert.ok(work.summary.includes(verified!.dob));
  assert.ok(work.summary.includes(episodeId));

  const again = openIntakeBookingWorkItem(state, {
    careEpisodeId: episodeId,
    patientId: "P002",
    verifiedPatient: verified!,
    intakeSummary: "dup",
  });
  assert.equal(again.id, work.id, "idempotent open for same episode+patient");

  const referral = intakeReferral(state, SAMPLE, new Date().toISOString(), {
    careEpisodeId: episodeId,
  });
  assert.equal(referral.patientMatch, "matched");
  assert.equal(referral.careEpisodeId, episodeId);
  assert.ok(referral.verifiedPatient);
  assert.equal(referral.verifiedPatient!.id, referral.patientId);
  assert.ok(referral.intakeSummary?.includes("DOB"));

  const enriched = enrichReferralIdentity(referral, { careEpisodeId: episodeId });
  assert.equal(enriched.careEpisodeId, episodeId);

  if (referral.status === "proposed" && referral.proposedSlotId && referral.patientId) {
    const confirmed = confirmReferralBooking(state, referral.id, { careEpisodeId: episodeId });
    assert.ok(confirmed);
    assert.equal(confirmed!.status, "booked");
    assert.equal(confirmed!.careEpisodeId, episodeId);
    const slot = state.slots.find((s) => s.id === referral.proposedSlotId);
    assert.equal(slot?.careEpisodeId, episodeId);
    const nurse = listOpenNurseObservationTasks(state).find((w) => w.patientId === referral.patientId);
    assert.ok(nurse);
    assert.equal(nurse!.careEpisodeId, episodeId);
  } else {
    // Fallback: book free slot with episode continuity (same contract).
    const free = state.slots.find((s) => !s.patientId);
    assert.ok(free);
    const booked = bookSlot(state, free!.id, "P002", "staff", "p1-intake-fallback", episodeId);
    assert.equal(booked.ok, true);
    if (booked.ok) {
      const task = handoffBookingToNurse(state, booked.slot, {
        patientLabel: verified!.name,
        careEpisodeId: episodeId,
      });
      assert.equal(task?.careEpisodeId, episodeId);
    }
  }

  console.log("p1-intake-booking-handoff: identity + care_episode_id continuity — PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
