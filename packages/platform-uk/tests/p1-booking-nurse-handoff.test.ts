/**
 * P1-BOOK-01 — verified booking creates nurse observation task; prefers care_episode_id.
 */
import assert from "node:assert/strict";

import { bookSlot } from "../lib/front-desk/calendar";
import {
  handoffBookingToNurse,
  listOpenNurseObservationTasks,
} from "../lib/front-desk/nurse-handoff";
import { createInitialState } from "../lib/front-desk/store";

const state = createInitialState();
const free = state.slots.find((s) => !s.patientId);
assert.ok(free, "need a free slot");

const episodeId = "ce-p1-book-test";
const booked = bookSlot(state, free!.id, "P002", "staff", "p1-book-key", episodeId);
assert.equal(booked.ok, true);
assert.equal(booked.ok && booked.idempotent, false);
if (!booked.ok) throw new Error("book failed");

const task = handoffBookingToNurse(state, booked.slot, { patientLabel: "Synthetic Patel" });
assert.ok(task);
assert.equal(task!.kind, "nurse_observation");
assert.equal(task!.status, "open");
assert.equal(task!.patientId, "P002");
assert.equal(task!.careEpisodeId, episodeId);
assert.ok(task!.summary.includes(episodeId), "prefers care_episode_id in summary");

const open = listOpenNurseObservationTasks(state);
assert.equal(open.length, 1);

// Idempotent book + handoff skip
const again = bookSlot(state, free!.id, "P002", "staff", "p1-book-key", episodeId);
assert.equal(again.ok && again.idempotent, true);
const dup = handoffBookingToNurse(state, again.ok ? again.slot : booked.slot);
assert.equal(dup, null, "no duplicate open nurse task");
assert.equal(listOpenNurseObservationTasks(state).length, 1);

console.log("p1-booking-nurse-handoff: booking → nurse task with care_episode_id — PASS");
