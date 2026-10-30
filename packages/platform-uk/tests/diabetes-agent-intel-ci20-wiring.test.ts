/**
 * CI 2.0 B-P2-1…3 — Context Engine → diabetes agent drafts,
 * Guardian before enqueue, evaluation engine gate contract.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const tmp = mkdtempSync(path.join(tmpdir(), "agent-intel-ci20-"));
const prevCwd = process.cwd();
const prevDbUrl = process.env.DATABASE_URL;
const prevUsePg = process.env.USE_POSTGRES;
delete process.env.DATABASE_URL;
delete process.env.USE_POSTGRES;
process.chdir(tmp);

async function main() {
  const { assembleClinicalContext } = await import("../lib/context-engine/assemble");
  const { evaluateGuardianGateway } = await import("../lib/guardian-gateway");
  const { mayEnqueueAgentDraft } = await import("../lib/workflow/review-queue");
  const { runEvaluationEngineV1 } = await import("../lib/evaluation-engine");
  const {
    enrichSharedContextFromClinicalPackage,
    buildSharedPatientContext,
    draftAllKindsForPatient,
    runAgentOrchestration,
    AGENT_INTEL_GUARDIAN_MODEL_ID,
  } = await import("../lib/diabetes-intelligence");

  const patientId = "P002";
  const now = Date.parse("2026-10-30T10:00:00.000Z");
  const scopeKey = `ci20_${Date.now()}`;

  const assembled = await assembleClinicalContext({
    patientId,
    purpose: "clinical_decision_support",
    actorRole: "clinical_reviewer",
  });
  assert.equal(assembled.ok, true, "Context Engine assembles for agent-intel path");
  if (!assembled.ok) return;

  const base = buildSharedPatientContext(patientId, { now });
  const enriched = enrichSharedContextFromClinicalPackage(base, assembled.package);
  assert.ok(enriched.contextPackage?.contextId);
  assert.ok(enriched.sources.some((s) => s.module === "context_engine" && s.available));
  assert.ok(enriched.authorisedTools.includes("assemble_context_engine_package"));

  const { drafts } = draftAllKindsForPatient(patientId, { now, context: enriched });
  assert.equal(drafts.length, 5);
  assert.ok(drafts.every((d) => d.ehrWrite === false));

  const gate = evaluateGuardianGateway({
    context: assembled.package,
    modelId: AGENT_INTEL_GUARDIAN_MODEL_ID,
    environment: "synthetic",
  });
  assert.equal(mayEnqueueAgentDraft(gate.output_status), gate.output_status !== "BLOCK");

  const snap = await runAgentOrchestration(patientId, {
    scopeKey,
    now,
    actor: "ci20-wiring-test",
  });
  assert.equal(snap.orchestrationRuns[0]?.draftEnqueueAllowed, true);
  assert.ok(snap.orchestrationRuns[0]?.contextPackage?.contextId);
  assert.equal(snap.drafts.length, 5);
  assert.ok(snap.guardianGateway);
  assert.notEqual(snap.guardianGateway?.output_status, "BLOCK");

  const evalRun = await runEvaluationEngineV1(patientId);
  assert.equal(evalRun.passed, true, evalRun.layers.map((l) => `${l.layer}:${l.passed}`).join("|"));
  assert.ok(evalRun.layers.some((l) => l.layer === "workflow" && l.passed));

  console.log("diabetes-agent-intel-ci20-wiring: PASS");
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
