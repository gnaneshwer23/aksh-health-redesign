/**
 * P0-EPISODE-01 — one care_episode_id threads across ≥3 journey stages.
 * Synthetic ids only; SHIELD-style events recorded on the episode.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const tmp = mkdtempSync(path.join(tmpdir(), "p0-episode-"));
const prevCwd = process.cwd();
const prevDbUrl = process.env.DATABASE_URL;
const prevUsePg = process.env.USE_POSTGRES;
delete process.env.DATABASE_URL;
delete process.env.USE_POSTGRES;
process.chdir(tmp);

async function main() {
  const {
    correlateCareEpisodeStage,
    listCareEpisodeEvents,
    resetCareEpisodeStoreForTests,
    getCareEpisode,
  } = await import("../lib/care-episode");
  const { bookSlot } = await import("../lib/front-desk/calendar");
  const { createInitialState } = await import("../lib/front-desk/store");

  const scopeKey = `p0ep_${Date.now()}`;
  await resetCareEpisodeStoreForTests(scopeKey);
  const patientId = "P002";
  const actor = "p0-episode-test";

  const intake = await correlateCareEpisodeStage({
    patientId,
    patientLabel: "Synthetic P002",
    actor,
    scopeKey,
    stage: "intake",
    linkId: "intake-case-1",
    linkLabel: "Intake",
  });
  const episodeId = intake.careEpisodeId;
  assert.ok(episodeId.startsWith("ce-"));

  const booking = await correlateCareEpisodeStage({
    patientId,
    actor,
    scopeKey,
    careEpisodeId: episodeId,
    stage: "booking",
    linkId: "slot-demo-1",
    linkLabel: "Front Desk booking",
  });
  assert.equal(booking.careEpisodeId, episodeId);

  const state = createInitialState();
  const free = state.slots.find((s) => !s.patientId);
  assert.ok(free);
  const booked = bookSlot(state, free!.id, patientId, "staff", `ep:${episodeId}`, episodeId);
  assert.equal(booked.ok, true);
  if (booked.ok) assert.equal(booked.slot.careEpisodeId, episodeId);

  const nurse = await correlateCareEpisodeStage({
    patientId,
    actor,
    scopeKey,
    careEpisodeId: episodeId,
    stage: "nurse_observations",
    linkId: "vitals-sample-1",
    linkLabel: "Nurse vitals",
  });
  assert.equal(nurse.careEpisodeId, episodeId);

  const orch = await correlateCareEpisodeStage({
    patientId,
    actor,
    scopeKey,
    careEpisodeId: episodeId,
    stage: "orchestrate",
    linkId: "orch-run-1",
    linkLabel: "CONDUCTOR",
  });
  assert.equal(orch.careEpisodeId, episodeId);

  const review = await correlateCareEpisodeStage({
    patientId,
    actor,
    scopeKey,
    careEpisodeId: episodeId,
    stage: "clinical_review",
    linkId: "review-case-1",
    linkLabel: "GP review",
  });
  assert.equal(review.careEpisodeId, episodeId);

  const episode = await getCareEpisode(episodeId, scopeKey);
  assert.ok(episode);
  assert.ok(episode!.links.length >= 3, "≥3 stage links");
  const kinds = new Set(episode!.links.map((l) => l.kind));
  assert.ok(kinds.has("review_case") || kinds.has("appointment") || kinds.has("patient_encounter"));

  const events = await listCareEpisodeEvents(episodeId, scopeKey);
  assert.ok(events.some((e) => e.kind === "created"));
  assert.ok(events.some((e) => e.kind === "link_attached"));
  assert.ok(
    events.some((e) => e.kind === "status_transition" || e.kind === "outbox_enqueued"),
    "journey transitions emit audit/outbox-shaped events"
  );

  console.log("p0-episode-correlation: PASS");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    process.chdir(prevCwd);
    if (prevDbUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = prevDbUrl;
    if (prevUsePg === undefined) delete process.env.USE_POSTGRES;
    else process.env.USE_POSTGRES = prevUsePg;
    rmSync(tmp, { recursive: true, force: true });
  });
