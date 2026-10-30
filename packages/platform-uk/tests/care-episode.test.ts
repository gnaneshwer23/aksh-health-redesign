/**
 * Care Episode foundation — transitions, persistence (file), idempotency, audit/outbox hooks.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  assertCanonicalPathValid,
  attachCareEpisodeLink,
  CANONICAL_CARE_EPISODE_PATH,
  CareEpisodeTransitionError,
  createCareEpisode,
  getCareEpisode,
  listCareEpisodeEvents,
  resetCareEpisodeStoreForTests,
  transitionCareEpisode,
  validateCareEpisodeTransition,
} from "../lib/care-episode";

const scopeKey = `ce_test_${randomUUID().slice(0, 8)}`;

async function main() {
  await resetCareEpisodeStoreForTests(scopeKey);

  assertCanonicalPathValid();
  for (let i = 0; i < CANONICAL_CARE_EPISODE_PATH.length - 1; i++) {
    const from = CANONICAL_CARE_EPISODE_PATH[i]!;
    const to = CANONICAL_CARE_EPISODE_PATH[i + 1]!;
    assert.equal(validateCareEpisodeTransition(from, to).ok, true, `${from}→${to}`);
  }

  assert.equal(validateCareEpisodeTransition("closed", "intake").ok, false);
  assert.equal(validateCareEpisodeTransition("draft", "closed").ok, false);
  assert.equal(validateCareEpisodeTransition("in_review", "draft").ok, false);

  const episode = await createCareEpisode({
    patientId: "P002",
    patientLabel: "Mr James Patel",
    createdBy: "test-runner",
    scopeKey,
    pathway: "diabetes_review",
    idempotencyKey: "create-once",
  });
  assert.equal(episode.status, "draft");
  assert.equal(episode.synthetic, true);
  assert.equal(episode.ehrWrite, false);
  assert.match(episode.publicId, /^CE-\d{4}-[A-Z0-9]+$/);

  const again = await createCareEpisode({
    patientId: "P002",
    createdBy: "test-runner",
    scopeKey,
    idempotencyKey: "create-once",
  });
  assert.equal(again.id, episode.id, "idempotent create returns same episode");

  let current = episode;
  const path = [...CANONICAL_CARE_EPISODE_PATH].slice(1);
  for (const toStatus of path) {
    const { episode: next, event } = await transitionCareEpisode({
      episodeId: current.id,
      toStatus,
      actor: "clinician@test",
      scopeKey,
      idempotencyKey: `step-${toStatus}`,
      expectedVersion: current.version,
    });
    assert.equal(next.status, toStatus);
    assert.equal(event.kind, "status_transition");
    assert.equal(event.toStatus, toStatus);
    current = next;
  }
  assert.equal(current.status, "closed");
  assert.ok(current.closedAt);

  await assert.rejects(
    () =>
      transitionCareEpisode({
        episodeId: current.id,
        toStatus: "intake",
        actor: "x",
        scopeKey,
      }),
    (err: unknown) => err instanceof CareEpisodeTransitionError && err.code === "TERMINAL"
  );

  const linked = await attachCareEpisodeLink(
    episode.id,
    { kind: "review_case", id: "case-demo-1", label: "HITL review" },
    "test-runner",
    scopeKey
  );
  assert.equal(linked.links.length, 1);
  assert.equal(linked.links[0]?.kind, "review_case");

  const events = await listCareEpisodeEvents(episode.id, scopeKey);
  assert.ok(events.some((e) => e.kind === "created"));
  assert.ok(events.some((e) => e.kind === "status_transition"));
  assert.ok(events.some((e) => e.kind === "outbox_enqueued"));
  assert.ok(events.some((e) => e.kind === "link_attached"));

  const replay = await transitionCareEpisode({
    episodeId: episode.id,
    toStatus: "closed",
    actor: "clinician@test",
    scopeKey,
    idempotencyKey: "step-closed",
  });
  assert.equal(replay.episode.status, "closed");

  const loaded = await getCareEpisode(episode.id, scopeKey);
  assert.ok(loaded);
  assert.equal(loaded!.version, linked.version);
  assert.equal(loaded!.status, "closed");

  console.log(
    `care-episode: canonical path ${CANONICAL_CARE_EPISODE_PATH.length} statuses, idempotency, audit/outbox — PASS`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
