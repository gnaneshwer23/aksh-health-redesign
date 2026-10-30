/**
 * P0-UX-01 — diabetes drafts enqueue into spine review cases when Guardian allows;
 * BLOCK remains fail-closed.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const tmp = mkdtempSync(path.join(tmpdir(), "p0-ux-worklist-"));
const prevCwd = process.cwd();
const prevDbUrl = process.env.DATABASE_URL;
const prevUsePg = process.env.USE_POSTGRES;
delete process.env.DATABASE_URL;
delete process.env.USE_POSTGRES;
process.chdir(tmp);

async function main() {
  const { mayEnqueueAgentDraft } = await import("../lib/workflow/review-queue");
  const {
    enqueueDiabetesDraftsToSpineReview,
    queueItemsFromDiabetesDrafts,
  } = await import("../lib/clinical-spine/diabetes-draft-enqueue");
  const { draftAllKindsForPatient, buildSharedPatientContext } = await import(
    "../lib/diabetes-intelligence"
  );
  const { readReviewCases } = await import("../lib/review-case-repository");
  const { resolveReviewQueueItems, updateQueueItemDecision } = await import(
    "../lib/workflow/review-queue"
  );
  const { updateReviewCase } = await import("../lib/review-case-repository");

  assert.equal(mayEnqueueAgentDraft("BLOCK"), false);
  assert.equal(mayEnqueueAgentDraft("PASS"), true);
  assert.equal(mayEnqueueAgentDraft("REVIEW"), true);

  const patientId = "P002";
  const now = Date.parse("2026-10-30T12:00:00.000Z");
  const scopeKey = `p0ux_${Date.now()}`;
  const ctx = buildSharedPatientContext(patientId, { now });
  const { drafts } = draftAllKindsForPatient(patientId, { now, context: ctx });
  assert.ok(drafts.length >= 1);

  const blocked = await enqueueDiabetesDraftsToSpineReview({
    patientId,
    patientLabel: ctx.patientLabel,
    drafts,
    guardianOutputStatus: "BLOCK",
    runId: "airun-block-test",
    userId: "gp-test",
    scopeKey,
  });
  assert.equal(blocked.enqueued, false);

  const items = queueItemsFromDiabetesDrafts("case-x", drafts);
  assert.equal(items.length, drafts.length);
  assert.ok(items.every((i) => i.metadata?.source === "diabetes_agent_intel"));

  const allowed = await enqueueDiabetesDraftsToSpineReview({
    patientId,
    patientLabel: ctx.patientLabel,
    drafts,
    guardianOutputStatus: "PASS",
    runId: "airun-pass-test",
    userId: "gp-test",
    scopeKey,
    careEpisodeId: undefined,
    nowMs: now,
  });
  assert.equal(allowed.enqueued, true);
  if (!allowed.enqueued) return;

  const cases = await readReviewCases(scopeKey);
  const created = cases.find((c) => c.id === allowed.caseId);
  assert.ok(created);
  assert.equal(created?.agentRun?.source, "diabetes_agent_intel");
  assert.ok((created?.reviewQueueItems?.length ?? 0) >= 1);

  const open = resolveReviewQueueItems(created!);
  const first = open[0]!;
  const decided = updateQueueItemDecision(created!, first.id, "ACCEPTED", {
    decidedBy: "gp-test",
  });
  await updateReviewCase(decided, scopeKey, "gp-test");
  const after = (await readReviewCases(scopeKey)).find((c) => c.id === allowed.caseId);
  const decidedItem = resolveReviewQueueItems(after!).find((i) => i.id === first.id);
  assert.equal(decidedItem?.status, "ACCEPTED");

  console.log("p0-ux-unified-worklist: PASS");
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
