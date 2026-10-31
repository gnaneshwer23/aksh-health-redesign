/**
 * Milestone B — HCP eval harness: case pack load, feedback capture, admin summary (no PHI),
 * Agent Ops wiring. Synthetic / controlled data only.
 */
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { readFileSync } from "node:fs";

import {
  applyMilestoneA5StoreMode,
  restoreMilestoneA5StoreMode,
} from "./helpers/milestone-a5-store-mode";

const snap = applyMilestoneA5StoreMode();

async function main() {
  const root = path.join(__dirname, "..");

  // --- Static: docs + Agent Ops surface ---
  const plan = readFileSync(path.join(root, "docs/agents/HCP_AGENT_EVALUATION_PLAN.md"), "utf8");
  assert.match(plan, /Synthetic patients only/);
  assert.match(plan, /Acceptance rate ≠ clinical accuracy/);

  const evalEnv = readFileSync(path.join(root, "docs/milestone-b/EVAL_ENVIRONMENT.md"), "utf8");
  assert.match(evalEnv, /test:milestone-b/);
  assert.match(evalEnv, /test:milestone-a5:neon/);
  assert.match(evalEnv, /clinical validation/i);
  assert.match(evalEnv, /\*\*false\*\*|clinicalValidationClaim|not.*clinical deploy/i);

  const protocol = readFileSync(path.join(root, "docs/milestone-b/SESSION_PROTOCOL.md"), "utf8");
  assert.match(protocol, /facilitator/i);
  assert.match(protocol, /hcp-feedback/);
  assert.match(protocol, /no production patient/i);

  const page = readFileSync(path.join(root, "app/dashboard/admin/agent-ops/page.tsx"), "utf8");
  assert.match(page, /data-testid="agent-ops-eval-harness"/);
  assert.match(page, /data-testid="lab-pharmacy-sim-honesty"/);
  assert.match(page, /\/api\/agents\/loop-outcomes/);
  assert.match(page, /\/api\/eval\/hcp-feedback/);
  assert.match(page, /\/api\/eval\/hcp-case-pack/);
  assert.match(page, /\/api\/eval\/agents/);
  assert.doesNotMatch(page, /patientName|NHS number|dateOfBirth/i);

  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as {
    scripts: Record<string, string>;
  };
  assert.ok(pkg.scripts["test:milestone-b"]);
  assert.ok(pkg.scripts["test:milestone-b:harness"]);
  assert.ok(pkg.scripts["seed:hcp-eval-case-pack"]);

  // --- Case pack ---
  const { getHcpCasePackManifest, getHcpEvalCase, HCP_EVAL_CASE_PACK } = await import(
    "../lib/eval/hcp-case-pack"
  );
  const manifest = getHcpCasePackManifest();
  assert.equal(manifest.syntheticOnly, true);
  assert.equal(manifest.clinicalValidationClaim, false);
  assert.equal(manifest.ehrWrite, false);
  assert.equal(manifest.liveEmis, false);
  assert.ok(manifest.caseCount >= 5);
  assert.ok(HCP_EVAL_CASE_PACK.every((c) => c.expectation.hitlRequired && !c.expectation.ehrWrite));
  assert.ok(getHcpEvalCase("hcp-hazard-apixaban-aspirin"));
  assert.equal(getHcpEvalCase("not-a-real-case"), undefined);

  // Seed artifact
  const seedDir = await mkdtemp(path.join(tmpdir(), "hcp-case-pack-"));
  const prevCwd = process.cwd();
  try {
    // Write via module helpers into a temp data/seed under package (use real script path logic)
    const dataSeed = path.join(root, "data", "seed");
    await mkdir(dataSeed, { recursive: true });
    const out = path.join(dataSeed, "hcp-eval-case-pack.json");
    await writeFile(out, JSON.stringify(manifest, null, 2), "utf8");
    const loaded = JSON.parse(await readFile(out, "utf8")) as typeof manifest;
    assert.equal(loaded.version, manifest.version);
    assert.equal(loaded.caseCount, manifest.caseCount);
  } finally {
    process.chdir(prevCwd);
    await rm(seedDir, { recursive: true, force: true }).catch(() => undefined);
  }

  // --- Feedback capture + admin summary (scoped file store) ---
  const scopeKey = `mb${Date.now().toString(36)}`;
  const {
    recordHcpEvalFeedback,
    getHcpEvalFeedbackAdminSummary,
    listHcpEvalFeedback,
  } = await import("../lib/repositories/hcp-eval-feedback-repository");

  const { record, source } = await recordHcpEvalFeedback(
    {
      casePackCaseId: "hcp-core-synthesis-patel",
      agentLabel: "SYNTHESIS",
      decision: "edit",
      syntheticPatientId: "P002",
      facilitatorNotes: "Adjusted plan wording; synthetic session only.",
      rubrics: [
        { rubricId: "synthesis_completeness", score: 4 },
        { rubricId: "synthesis_no_invented_findings", score: 5 },
        {
          rubricId: "honesty_labels_trusted",
          score: 3,
          justification: "Banner visible but evaluator asked if live.",
        },
      ],
      trustHonestyLabels: 4,
      recommendation: "hold",
    },
    { scopeKey, decisionActor: "gp.evaluator@demo.akshhealth.com", practiceId: "demo-practice" }
  );
  assert.equal(source, "file");
  assert.equal(record.syntheticOnly, true);
  assert.equal(record.clinicalValidationClaim, false);
  assert.equal(record.ehrWrite, false);
  assert.ok(record.id.startsWith("hcpfb-"));

  await recordHcpEvalFeedback(
    {
      casePackCaseId: "hcp-hazard-apixaban-aspirin",
      agentLabel: "GUARDIAN",
      decision: "accept",
      rubrics: [
        { rubricId: "guardian_interaction_flagged", score: 5 },
        { rubricId: "guardian_data_source_disclosed", score: 4 },
      ],
      recommendation: "proceed",
    },
    { scopeKey, decisionActor: "gp.evaluator@demo.akshhealth.com" }
  );

  const listed = await listHcpEvalFeedback({ scopeKey, limit: 10 });
  assert.equal(listed.records.length, 2);

  const summary = await getHcpEvalFeedbackAdminSummary({ scopeKey });
  assert.equal(summary.total, 2);
  assert.equal(summary.byDecision.edit, 1);
  assert.equal(summary.byDecision.accept, 1);
  assert.equal(summary.clinicalValidationClaim, false);
  assert.ok(summary.samplePatientRefs.every((r) => r.startsWith("pt_")));
  assert.doesNotMatch(JSON.stringify(summary), /James Patel|facilitatorNotes|NHS/i);

  // Reject unknown case / bad rubric
  await assert.rejects(
    () =>
      recordHcpEvalFeedback(
        {
          casePackCaseId: "nope",
          agentLabel: "SYNTHESIS",
          decision: "accept",
          rubrics: [{ rubricId: "synthesis_completeness", score: 5 }],
        },
        { scopeKey, decisionActor: "x" }
      ),
    /Unknown casePackCaseId/
  );
  await assert.rejects(
    () =>
      recordHcpEvalFeedback(
        {
          casePackCaseId: "hcp-core-synthesis-patel",
          agentLabel: "SYNTHESIS",
          decision: "accept",
          rubrics: [{ rubricId: "synthesis_completeness" as const, score: 2 }],
        },
        { scopeKey, decisionActor: "x" }
      ),
    /justification required/
  );

  // Cleanup scoped file
  const feedbackFile = path.join(root, "data", `hcp-eval-feedback.${scopeKey}.json`);
  await rm(feedbackFile, { force: true }).catch(() => undefined);

  console.log(
    "milestone-b-hcp-eval-harness: case pack + feedback capture + PHI-safe summary + Agent Ops wiring — PASS"
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    restoreMilestoneA5StoreMode(snap);
  });
