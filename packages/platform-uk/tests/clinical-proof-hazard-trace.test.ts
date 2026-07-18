import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/**
 * CP-HAZARD-001 — hazard template links residual risks to clinical-proof / HITL / GUARDIAN test IDs.
 */
function run() {
  const templatePath = path.join(process.cwd(), "docs/HAZARD_LOG_TEMPLATE.md");
  const text = fs.readFileSync(templatePath, "utf8");

  const requiredTestIds = [
    "CP-HITL-001",
    "CP-HITL-002",
    "CP-HITL-003",
    "CP-HITL-004",
    "CP-HITL-006",
    "CP-BYPASS-001",
    "CP-BYPASS-002",
    "CP-BYPASS-003",
    "CP-SIM-001",
    "CP-GRAPH-001",
    "CP-ORCH-001",
    "CP-MULTI-001",
    "CP-LEARN-001",
    "CP-PERF-001",
    "CP-MEDPLUM-001",
    "EVAL-GOLDEN"
  ];

  for (const id of requiredTestIds) {
    assert.ok(text.includes(id), `Hazard template must reference ${id}`);
  }

  assert.ok(text.includes("H-011"), "Must include silent model update / auto-retrain hazard");
  assert.ok(text.includes("H-013"), "Must include Neo4j mock-vs-live hazard");
  assert.ok(text.includes("Residual risk register"), "Must include Gate 2 residual risk register");
  assert.ok(text.includes("Unsigned"), "Must not claim CSO sign-off");

  const evidenceHazard = fs.readFileSync(
    path.join(process.cwd(), "docs/evidence-pack/06-hazard-log.md"),
    "utf8"
  );
  assert.ok(evidenceHazard.includes("HAZARD_LOG_TEMPLATE"));

  const safetyCase = fs.readFileSync(
    path.join(process.cwd(), "docs/SAFETY_CASE_REHEARSAL.md"),
    "utf8"
  );
  assert.ok(safetyCase.includes("HAZARD_LOG_TEMPLATE") || safetyCase.includes("hazard log"));

  console.log("Hazard ↔ test ID traceability contract passed.");
}

void run();
