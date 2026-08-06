import assert from "node:assert/strict";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { SHIELD_AUDIT_EVENTS_SQL } from "../lib/db/schema-sql";
import { persistShieldAuditEvent } from "../lib/repositories/shield-audit-repository";
import { recordLearningEvent } from "../lib/repositories/learning-event-repository";

function checkAppendOnlyContract() {
  const shieldRoutePath = path.join(process.cwd(), "app/api/audit/shield/route.ts");
  const source = fs.readFileSync(shieldRoutePath, "utf8");

  assert.ok(source.includes("export async function GET"), "SHIELD API must support GET");
  assert.ok(source.includes("export async function POST"), "SHIELD API must support append via POST");
  assert.equal(/export async function PUT/.test(source), false, "SHIELD must not expose PUT");
  assert.equal(/export async function DELETE/.test(source), false, "SHIELD must not expose DELETE");
  assert.equal(/export async function PATCH/.test(source), false, "SHIELD must not expose PATCH");

  assert.ok(SHIELD_AUDIT_EVENTS_SQL.includes("content_hash"), "Append-only chain should store content_hash");
  assert.ok(SHIELD_AUDIT_EVENTS_SQL.includes("prev_event_id"), "Append-only chain should store prev_event_id");

  const repoPath = path.join(process.cwd(), "lib/repositories/shield-audit-repository.ts");
  const repo = fs.readFileSync(repoPath, "utf8");
  assert.ok(repo.includes("INSERT INTO aksh.shield_audit_events"), "Persist path is INSERT-only");
  assert.equal(/\bUPDATE\s+aksh\.shield_audit_events\b/i.test(repo), false);
  assert.equal(/\bDELETE\s+FROM\s+aksh\.shield_audit_events\b/i.test(repo), false);

  console.log("SHIELD append-only API/schema contract passed.");
}

/**
 * B1 / OQ-HITL-2 hard-fail: a SHIELD durable-write failure must never be
 * indistinguishable from success. This check deliberately forces the
 * "postgres not configured" path (by unsetting `DATABASE_URL`/`USE_POSTGRES`
 * for its duration) rather than assuming the ambient environment has no
 * database configured — CI jobs that also run Playwright E2E deliberately
 * set a real `DATABASE_URL` for the E2E suite, so this must be deterministic
 * regardless of that. This is exactly the scenario that used to be swallowed
 * as a silent `console.error` + `return null`.
 */
async function checkShieldWriteFailureSurfacesToCaller() {
  const savedDatabaseUrl = process.env.DATABASE_URL;
  const savedUsePostgres = process.env.USE_POSTGRES;
  delete process.env.DATABASE_URL;
  delete process.env.USE_POSTGRES;

  const scopeKey = `shield_hard_fail_${Date.now()}`;
  try {
    const directResult = await persistShieldAuditEvent({
      action: "accept",
      actor: "shield-hard-fail-test@akshhealth.com",
      label: "SHIELD hard-fail test event",
      category: "reviewer_decision"
    });

    assert.equal(
      directResult.persisted,
      false,
      "persistShieldAuditEvent must report persisted:false, not silently look like a write"
    );
    if (!directResult.persisted) {
      assert.equal(directResult.row, null);
      assert.ok(directResult.reason, "A failed write must carry a non-empty reason for the caller/UI");
    }

    // Fail-visible propagation for a clinical Accept/Edit/Reject dual-write
    // (queue-decision.ts's exact call pattern via recordLearningEvent).
    const recorded = await recordLearningEvent(
      {
        agentLabel: "SHIELD_HARD_FAIL_TEST",
        predictionId: `pred-${randomUUID()}`,
        decision: "accept",
        decisionActor: "shield-hard-fail-test@akshhealth.com",
        outcomeKind: "unknown"
      },
      { scopeKey }
    );

    assert.equal(
      recorded.shieldAuditWriteFailed,
      true,
      "OQ-HITL-2: a failed SHIELD dual-write must set shieldAuditWriteFailed:true, not report a clean success"
    );
    assert.ok(
      recorded.shieldAuditWriteReason,
      "A failed SHIELD dual-write must carry a reason the caller/UI can surface"
    );
  } finally {
    if (savedDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = savedDatabaseUrl;
    if (savedUsePostgres === undefined) delete process.env.USE_POSTGRES;
    else process.env.USE_POSTGRES = savedUsePostgres;
    await fsPromises.unlink(path.join(process.cwd(), "data", `learning-events.${scopeKey}.json`)).catch(() => {});
  }

  console.log("SHIELD hard-fail visibility checks passed (write failure surfaces, not swallowed).");
}

async function run() {
  checkAppendOnlyContract();
  await checkShieldWriteFailureSurfacesToCaller();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
