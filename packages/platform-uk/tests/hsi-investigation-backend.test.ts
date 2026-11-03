/** Real local PostgreSQL; only the already-authenticated NextAuth session boundary is stubbed. */
import assert from "node:assert/strict";
// @ts-expect-error Bun is the integration harness, not a Next.js runtime dependency.
import { mock } from "bun:test";
const raw = process.env.HSI_TEST_DB_URL;
if (!raw) throw new Error("HSI_TEST_DB_URL must name a disposable local test database");
const target = new URL(raw);
if (!["127.0.0.1", "localhost"].includes(target.hostname) || target.pathname !== "/hsi_step3_test") throw new Error("Refusing non-local investigation test database");
process.env.DATABASE_URL = raw; delete process.env.DATABASE_URL_UNPOOLED;
let userId: string | null = null, cookieScope = "forged-cookie-scope";
mock.module("server-only", () => ({}));
mock.module("@/lib/user-scope", () => ({ requireAuthenticatedUserScope: async (...args: unknown[]) => {
  assert.equal(args.length, 0, "Research endpoint must not pass test headers to the session helper");
  return { context: userId ? { userId, scopeKey: cookieScope, userRole: "clinical_reviewer" } : null, response: null };
} }));
const { POST } = await import("../app/api/platform/research-investigations/route");
const { akshInvestigationDatabase } = await import("../lib/hsi/investigation-db.server");
const { closePgPool } = await import("../lib/db/client");
const call = (body: unknown, headers: Record<string,string> = {}) => POST(new Request("https://aksh.test/api/platform/research-investigations", { method: "POST", headers: { origin: "https://aksh.test", "content-type": "application/json", ...headers }, body: JSON.stringify(body) }));
try {
  assert.equal((await call({ action: "list", cursor: null }, { "x-user-id": "usr_hsi_a", "x-user-role": "admin" })).status, 401);
  userId = "usr_no_research_grant"; assert.equal((await call({ action: "list", cursor: null })).status, 403);
  userId = "usr_hsi_a";
  assert.equal((await call({ action: "list", cursor: null }, { origin: "https://attacker.test" })).status, 403);
  assert.equal((await call({ action: "list", cursor: null }, { "content-length": "9000" })).status, 413);
  assert.equal((await call({ action: "start", releaseId: "hsi-research-snapshot", conceptId: null, patient: {} })).status, 400);
  const start = await call({ action: "start", releaseId: "hsi-research-snapshot", conceptId: null });
  assert.equal(start.status, 200); const run = await start.json();
  assert.equal(run.snapshot.bundle.context.provenance.product, "aksh"); assert.equal(run.snapshot.bundle.relationships.length, 0);
  assert.equal(run.snapshot.payloads.retrieval.passageIds.length, 0);
  cookieScope = "different-untrusted-cookie";
  assert.deepEqual((await (await call({ action: "get", key: run.key })).json()).snapshot, run.snapshot);
  userId = "usr_hsi_b";
  for (const action of [{ action: "get", key: run.key }, { action: "review", key: run.key, revision: run.snapshot.revision, decision: "accept_for_research", rationale: "wrong owner" }, { action: "export", key: run.key, format: "json" }]) assert.equal((await call(action)).status, 404);
  assert.equal((await (await call({ action: "list", cursor: null })).json()).items.length, 0);
  const dbB = akshInvestigationDatabase(userId);
  assert.equal((await dbB.query("SELECT * FROM aksh.hsi_investigations WHERE investigation_key=$1", [run.key])).length, 0);
  userId = "usr_hsi_r";
  const researcherRun = await (await call({ action: "start", releaseId: "hsi-research-snapshot", conceptId: null })).json();
  assert.equal((await call({ action: "review", key: researcherRun.key, revision: researcherRun.snapshot.revision, decision: "accept_for_research", rationale: "Not granted review power" })).status, 403);
  userId = "usr_hsi_a";
  const reviews = await Promise.all([
    call({ action: "review", key: run.key, revision: run.snapshot.revision, decision: "request_revision", rationale: "Need verified passages" }),
    call({ action: "review", key: run.key, revision: run.snapshot.revision, decision: "accept_for_research", rationale: "Concurrent engineering decision" }),
  ]);
  assert.deepEqual(reviews.map((r) => r.status).sort(), [200,409]);
  const current = await (await call({ action: "get", key: run.key })).json();
  const exported = await call({ action: "export", key: run.key, format: "json" });
  assert.equal(exported.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(JSON.parse((await exported.json()).content), current.snapshot);
  const audits = await akshInvestigationDatabase(userId).query("SELECT * FROM aksh.hsi_investigation_audit WHERE owner_id=$1 AND investigation_key=$2", [userId,run.key]);
  assert.equal(audits.length, current.snapshot.revision); assert.ok(audits.every((r) => r.actor_id === userId));
  // Microsecond-separated rows prove keyset cursors do not skip records on JSON/Date conversion.
  await akshInvestigationDatabase(userId).query(`INSERT INTO aksh.hsi_investigations(owner_id,investigation_key,revision,state,data_class,question,snapshot,created_at)
    SELECT owner_id,'INV-'||gen_random_uuid()::text,revision,state,data_class,question,snapshot,
    date_trunc('second',now())-interval '1 day'+g*interval '1 microsecond'
    FROM aksh.hsi_investigations CROSS JOIN generate_series(1,24) AS g WHERE owner_id=$1 AND investigation_key=$2`, [userId,run.key]);
  const firstPage = await (await call({ action: "list", cursor: null })).json();
  const secondPage = await (await call({ action: "list", cursor: firstPage.nextCursor })).json();
  assert.equal(firstPage.items.length,20); assert.equal(secondPage.items.length,5);
  assert.equal(new Set([...firstPage.items,...secondPage.items].map((r: {key:string})=>r.key)).size,25);
  for (let i=0;i<4;i++) assert.equal((await call({ action: "start", releaseId: "hsi-research-snapshot", conceptId: null })).status, 200);
  assert.equal((await call({ action: "start", releaseId: "hsi-research-snapshot", conceptId: null })).status, 429);
  userId = "usr_hsi_b";
  let limited = false;
  for (let attempt=0;attempt<130;attempt++) {
    const response = await call({ action: "list", cursor: null });
    if (response.status === 429) { limited = true; break; }
    assert.equal(response.status,200);
  }
  assert.equal(limited,true);
  console.log("PASS: Aksh API grant checks, owner isolation (independent of cookies), PostgreSQL RLS/CAS/audit, quotas and exports; NextAuth boundary stubbed");
} finally { await closePgPool(); }
