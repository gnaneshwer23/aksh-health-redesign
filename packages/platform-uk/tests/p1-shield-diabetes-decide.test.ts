/**
 * P0-SHIELD-INTEGRITY — diabetes domain decide is fail-closed when durable SHIELD
 * is required (Postgres); local/file mode remains honest fail-visible.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

async function main() {
  // Isolate from ambient Neon/CI DATABASE_URL so the local fail-visible path is hermetic;
  // Postgres fail-closed is exercised below with an intentional invalid URL.
  const prevDb = process.env.DATABASE_URL;
  const prevUse = process.env.USE_POSTGRES;
  delete process.env.DATABASE_URL;
  delete process.env.USE_POSTGRES;

  const {
    persistDiabetesDomainShieldDecision,
    withRequiredDiabetesDomainShield,
    assertDurableShieldOrThrow,
    ShieldAuditIntegrityError,
  } = await import("../lib/diabetes-intelligence/shield-decision-audit");
  const root = path.join(__dirname, "..");

  try {
  // Without Postgres, persistShieldAuditEvent returns persisted:false — must surface fail-visible flags.
  const result = await persistDiabetesDomainShieldDecision({
    source: "agent_intel",
    action: "accept",
    actor: "gp@test",
    patientId: "P002",
    subjectId: "draft-1",
    reason: "looks good",
  });
  assert.equal(result.shieldAuditPersisted, false);
  assert.equal(result.shieldAuditWriteFailed, true);
  assert.ok(result.shieldAuditWriteReason);

  for (const source of [
    "medcare_safety",
    "medcare_plan",
    "journey_plan",
    "glucose_review",
    "continuous_care",
  ] as const) {
    const r = await persistDiabetesDomainShieldDecision({
      source,
      action: "reject",
      actor: "gp@test",
      patientId: "P002",
      subjectId: `${source}-id`,
      reason: "not appropriate",
    });
    assert.equal(r.shieldAuditWriteFailed, true, `${source} fail-visible`);
  }

  // Local (no Postgres): withRequired still finalises but surfaces failed audit honestly.
  let finalizedLocal = false;
  const local = await withRequiredDiabetesDomainShield(
    {
      source: "medcare_safety",
      action: "accept",
      actor: "gp@test",
      patientId: "P002",
      subjectId: "review-local",
    },
    async () => {
      finalizedLocal = true;
      return { status: "APPROVED" as const };
    }
  );
  assert.equal(finalizedLocal, true, "local mode may finalise with non-durable audit");
  assert.equal(local.shieldAuditWriteFailed, true);
  assert.equal(local.status, "APPROVED");

  // Fail-closed gate: when Postgres is configured, unaudited finalisation is blocked.
  process.env.DATABASE_URL = "postgresql://shield-integrity-test.invalid/db";
  delete process.env.USE_POSTGRES;

  assert.ok(
    process.env.DATABASE_URL?.trim() || process.env.USE_POSTGRES === "true",
    "test env must look Postgres-configured"
  );

  const failedShield = {
    shieldAuditPersisted: false,
    shieldAuditWriteFailed: true,
    shieldAuditWriteReason: "simulated_shield_write_failure",
  };

  assert.throws(
    () => assertDurableShieldOrThrow(failedShield),
    (err: unknown) => {
      assert.ok(err instanceof ShieldAuditIntegrityError);
      assert.equal(err.status, 503);
      assert.equal(err.code, "SHIELD_AUDIT_REQUIRED");
      assert.match(err.message, /not finalised/i);
      return true;
    }
  );

  // Successful durable audit must allow finalisation under Postgres.
  assert.doesNotThrow(() =>
    assertDurableShieldOrThrow({
      shieldAuditPersisted: true,
      shieldAuditWriteFailed: false,
      shieldAuditWriteReason: null,
    })
  );

  // Back to hermetic local mode (ignore ambient Neon) for the non-throwing honesty path.
  delete process.env.DATABASE_URL;
  delete process.env.USE_POSTGRES;
  assert.doesNotThrow(() => assertDurableShieldOrThrow(failedShield));

  // Assemble decide paths must use fail-closed wrapper (wiring proof).
  const wired = [
    "lib/diabetes-intelligence/agent-intel-assemble.ts",
    "lib/diabetes-intelligence/medcare-assemble.ts",
    "lib/diabetes-intelligence/journey.ts",
    "lib/diabetes-intelligence/glucose-assemble.ts",
    "lib/diabetes-intelligence/continuous-care-assemble.ts",
  ];
  for (const rel of wired) {
    const src = readFileSync(path.join(root, rel), "utf8");
    assert.match(src, /withRequiredDiabetesDomainShield/, `${rel} wires fail-closed SHIELD`);
  }

  console.log(
    "p1-shield-diabetes-decide: fail-closed SHIELD (Postgres) + honest local non-durable — PASS"
  );
  } finally {
    if (prevDb === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = prevDb;
    if (prevUse === undefined) delete process.env.USE_POSTGRES;
    else process.env.USE_POSTGRES = prevUse;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
