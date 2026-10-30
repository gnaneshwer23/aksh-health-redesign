/**
 * P1-SHIELD-01 — diabetes domain decide helpers dual-write SHIELD (fail-visible).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

async function main() {
  const { persistDiabetesDomainShieldDecision } = await import(
    "../lib/diabetes-intelligence/shield-decision-audit"
  );
  const root = path.join(__dirname, "..");

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

  // Assemble decide paths must call the shared helper (wiring proof).
  const wired = [
    "lib/diabetes-intelligence/agent-intel-assemble.ts",
    "lib/diabetes-intelligence/medcare-assemble.ts",
    "lib/diabetes-intelligence/journey.ts",
    "lib/diabetes-intelligence/glucose-assemble.ts",
    "lib/diabetes-intelligence/continuous-care-assemble.ts",
  ];
  for (const rel of wired) {
    const src = readFileSync(path.join(root, rel), "utf8");
    assert.match(src, /persistDiabetesDomainShieldDecision/, `${rel} wires SHIELD dual-write`);
  }

  console.log("p1-shield-diabetes-decide: fail-visible SHIELD on diabetes decide paths — PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
