/**
 * Phase 5 proof-point smoke (Aksh): authenticated start → passages → reload → review → export,
 * rights-verified evidence corpus start, and cross-owner denial. Disposable local DB only.
 * NextAuth session boundary is stubbed; research membership comes from the test DB seed.
 */
import assert from "node:assert/strict";
// @ts-expect-error Bun is the integration harness, not a Next.js runtime dependency.
import { mock } from "bun:test";

const raw = process.env.HSI_TEST_DB_URL;
if (!raw) throw new Error("HSI_TEST_DB_URL must name a disposable local test database");
const target = new URL(raw);
if (!["127.0.0.1", "localhost"].includes(target.hostname) || target.pathname !== "/hsi_step3_test") {
  throw new Error("Refusing non-local investigation test database");
}
process.env.DATABASE_URL = raw;
delete process.env.DATABASE_URL_UNPOOLED;

let userId: string | null = null;
mock.module("server-only", () => ({}));
mock.module("@/lib/user-scope", () => ({
  requireAuthenticatedUserScope: async (...args: unknown[]) => {
    assert.equal(args.length, 0, "Research endpoint must not pass test headers to the session helper");
    return {
      context: userId ? { userId, scopeKey: "phase5-scope", userRole: "clinical_reviewer" } : null,
      response: null,
    };
  },
}));

const { POST } = await import("../app/api/platform/research-investigations/route");
const { closePgPool } = await import("../lib/db/client");
const { RA_RELEASE_ID } = await import("../lib/hsi/raEvidenceRelease");
const { RA_RESEARCH_RELEASE_ID } = await import("../lib/hsi/raResearchEvidenceRelease");

const call = (body: unknown) =>
  POST(
    new Request("https://aksh.test/api/platform/research-investigations", {
      method: "POST",
      headers: { origin: "https://aksh.test", "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

const checks: string[] = [];
try {
  userId = "usr_hsi_a";

  const evidenceStarted = await call({ action: "start", releaseId: RA_RELEASE_ID, conceptId: null });
  assert.equal(evidenceStarted.status, 200);
  const evidenceRun = await evidenceStarted.json();
  assert.ok((evidenceRun.snapshot.payloads.retrieval?.passageIds?.length ?? 0) >= 2);
  assert.equal(evidenceRun.snapshot.bundle.claims.length, 0);
  assert.equal(evidenceRun.snapshot.bundle.context.dataClass, "public_real");
  assert.ok(evidenceRun.snapshot.bundle.sources.every((s: { kind: string; pmid: string | null }) => s.kind === "publication" && s.pmid));
  checks.push("evidence_start_passages");

  const started = await call({ action: "start", releaseId: RA_RESEARCH_RELEASE_ID, conceptId: null });
  assert.equal(started.status, 200);
  const run = await started.json();
  assert.ok((run.snapshot.payloads.retrieval?.passageIds?.length ?? 0) >= 2);
  assert.equal(run.snapshot.bundle.claims.length, 0);
  assert.equal(run.snapshot.bundle.context.dataClass, "synthetic");
  checks.push("research_start_passages");

  const reloaded = await (await call({ action: "get", key: run.key })).json();
  assert.deepEqual(reloaded.snapshot, run.snapshot);
  checks.push("reload");

  userId = "usr_hsi_b";
  assert.equal((await call({ action: "get", key: run.key })).status, 404);
  assert.equal(
    (
      await call({
        action: "review",
        key: run.key,
        revision: run.snapshot.revision,
        decision: "accept_for_research",
        rationale: "cross-owner must fail",
      })
    ).status,
    404,
  );
  checks.push("cross_owner_denied");

  userId = "usr_hsi_a";
  const reviewed = await call({
    action: "review",
    key: run.key,
    revision: run.snapshot.revision,
    decision: "accept_for_research",
    rationale: "Workflow acceptance only — not scientific claim approval or Gate C.",
  });
  assert.equal(reviewed.status, 200);
  const afterReview = await reviewed.json();
  assert.equal(afterReview.snapshot.bundle.claims.length, 0);
  checks.push("review_without_claim_promotion");

  const exported = await call({ action: "export", key: run.key, format: "json" });
  assert.equal(exported.status, 200);
  assert.equal(exported.headers.get("cache-control"), "private, no-store");
  const body = await exported.json();
  assert.ok(body.content);
  checks.push("export_json");

  console.log(
    JSON.stringify(
      {
        ok: true,
        product: "aksh",
        phase: 5,
        checks,
        note: "Engineering proof-point only — not scientific validation. Live /internal-research still needs provision-hsi-research.ts for a real account.",
      },
      null,
      2,
    ),
  );
} finally {
  await closePgPool();
}
