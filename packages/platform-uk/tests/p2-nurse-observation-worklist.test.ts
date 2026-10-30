/**
 * P2 — nurse dashboard worklist surfaces nurse_observation from booking handoff.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { bookSlot } from "../lib/front-desk/calendar";
import {
  buildNurseObservationWorklist,
  handoffBookingToNurse,
} from "../lib/front-desk/nurse-handoff";
import { createInitialState } from "../lib/front-desk/store";

const state = createInitialState();
const free = state.slots.find((s) => !s.patientId);
assert.ok(free);
const episodeId = "ce-p2-nurse-wl";
const booked = bookSlot(state, free!.id, "P002", "staff", "p2-nurse-wl", episodeId);
assert.equal(booked.ok, true);
if (!booked.ok) throw new Error("book failed");

const task = handoffBookingToNurse(state, booked.slot, {
  patientLabel: "Synthetic Patel",
  careEpisodeId: episodeId,
});
assert.ok(task);
assert.equal(task!.careEpisodeId, episodeId);
assert.equal(task!.slotId, booked.slot.id);

const worklist = buildNurseObservationWorklist(state);
assert.equal(worklist.length, 1);
assert.equal(worklist[0]!.careEpisodeId, episodeId);
assert.equal(worklist[0]!.source, "front_desk_booking");
assert.equal(worklist[0]!.ehrWrite, false);

const root = path.join(process.cwd());
const page = readFileSync(path.join(root, "app/dashboard/nurse/page.tsx"), "utf8");
assert.match(page, /ObservationWorklist/);
const api = readFileSync(path.join(root, "app/api/nurse/observation-worklist/route.ts"), "utf8");
assert.match(api, /buildNurseObservationWorklist/);
assert.match(api, /care_episode_id|careEpisodeId/);

console.log("p2-nurse-observation-worklist: PASS");
