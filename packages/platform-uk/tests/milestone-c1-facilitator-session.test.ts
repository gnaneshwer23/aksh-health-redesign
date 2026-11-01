/**
 * Milestone C1 — Facilitator HCP session UI wiring + API contract helpers.
 * Synthetic / controlled data only. Does not claim clinical validation.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { GOLDEN_CASES } from "../lib/eval/golden-cases";
import { getHcpEvalCase, HCP_EVAL_CASE_PACK } from "../lib/eval/hcp-case-pack";
import {
  buildHcpFeedbackRequestBody,
  HCP_FACILITATOR_ADMIN_PATH,
  HCP_FACILITATOR_HONESTY,
  HCP_FACILITATOR_SESSION_PATH,
  relatedGoldenFixtures,
  suggestRubricsForCase,
  validateFacilitatorFeedbackDraft,
} from "../lib/eval/hcp-facilitator-session";

const root = path.join(__dirname, "..");

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

async function main() {
  // --- Docs ---
  const doc = read("docs/milestone-c/FACILITATOR_SESSION.md");
  assert.match(doc, /What C1 is/);
  assert.match(doc, /What C1 is not/);
  assert.match(doc, /Click-path/);
  assert.match(doc, /test:milestone-c/);
  assert.match(doc, /clinical validation/i);
  assert.match(doc, /productionRbacEnforced/);
  assert.match(doc, /What C1 is not/);
  assert.match(doc, /Not.*clinical validation/i);

  const protocol = read("docs/milestone-b/SESSION_PROTOCOL.md");
  assert.match(protocol, /milestone-c\/FACILITATOR_SESSION/);
  assert.match(protocol, /hcp-eval-session/);

  // --- Surfaces + nav ---
  const gpPage = read("app/dashboard/gp/hcp-eval-session/page.tsx");
  const adminPage = read("app/dashboard/admin/hcp-eval-session/page.tsx");
  const panel = read("components/dashboard/hcp-eval/HcpFacilitatorSessionPanel.tsx");
  const sidebar = read("components/dashboard/Sidebar.tsx");
  const agentOps = read("app/dashboard/admin/agent-ops/page.tsx");

  assert.match(gpPage, /HcpFacilitatorSessionPanel/);
  assert.match(adminPage, /HcpFacilitatorSessionPanel/);
  assert.match(panel, /data-testid="hcp-facilitator-session"/);
  assert.match(panel, /data-testid="hcp-session-honesty"/);
  assert.match(panel, /data-testid="hcp-case-pack-picker"/);
  assert.match(panel, /data-testid="hcp-feedback-form"/);
  assert.match(panel, /\/api\/eval\/hcp-case-pack/);
  assert.match(panel, /\/api\/eval\/hcp-feedback/);
  assert.match(panel, /clinicalValidationClaim/);
  assert.doesNotMatch(panel, /patientName|NHS number|dateOfBirth/i);

  assert.match(sidebar, /\/dashboard\/gp\/hcp-eval-session/);
  assert.match(sidebar, /\/dashboard\/admin\/hcp-eval-session/);
  assert.match(agentOps, /data-testid="agent-ops-hcp-session-link"/);
  assert.match(agentOps, /\/dashboard\/admin\/hcp-eval-session/);
  assert.match(agentOps, /\/dashboard\/gp\/hcp-eval-session/);

  assert.equal(HCP_FACILITATOR_SESSION_PATH, "/dashboard/gp/hcp-eval-session");
  assert.equal(HCP_FACILITATOR_ADMIN_PATH, "/dashboard/admin/hcp-eval-session");
  assert.ok(HCP_FACILITATOR_HONESTY.some((h) => /synthetic/i.test(h)));

  const pkg = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
  assert.ok(pkg.scripts["test:milestone-c"]);
  assert.ok(pkg.scripts["test:milestone-c:ui"]);
  assert.match(pkg.scripts["test:milestone-c"], /test:milestone-b/);

  // --- Helper: rubric suggestions + golden fixture linking ---
  const synthesis = getHcpEvalCase("hcp-core-synthesis-patel");
  assert.ok(synthesis);
  const rubrics = suggestRubricsForCase(synthesis!);
  assert.ok(rubrics.includes("synthesis_completeness"));
  assert.ok(rubrics.includes("honesty_labels_trusted"));
  assert.ok(rubrics.includes("workflow_fit"));

  const hazard = getHcpEvalCase("hcp-hazard-apixaban-aspirin");
  assert.ok(hazard);
  const related = relatedGoldenFixtures(hazard!, GOLDEN_CASES);
  assert.ok(related.some((f) => f.id === "guardian-apixaban-aspirin"));

  assert.ok(HCP_EVAL_CASE_PACK.every((c) => suggestRubricsForCase(c).length >= 2));

  // --- Client contract validation (mirrors API) ---
  assert.equal(
    validateFacilitatorFeedbackDraft({
      casePackCaseId: "hcp-core-synthesis-patel",
      agentLabel: "SYNTHESIS",
      decision: "accept",
      rubrics: [{ rubricId: "synthesis_completeness", score: 5 }],
    }),
    null
  );

  assert.match(
    validateFacilitatorFeedbackDraft({
      casePackCaseId: "hcp-core-synthesis-patel",
      agentLabel: "SYNTHESIS",
      decision: "edit",
      rubrics: [{ rubricId: "synthesis_completeness", score: 2 }],
    }) ?? "",
    /justification required/i
  );

  assert.match(
    validateFacilitatorFeedbackDraft({
      casePackCaseId: "",
      agentLabel: "SYNTHESIS",
      decision: "accept",
      rubrics: [{ rubricId: "synthesis_completeness", score: 5 }],
    }) ?? "",
    /case-pack/i
  );

  const body = buildHcpFeedbackRequestBody({
    casePackCaseId: "hcp-core-synthesis-patel",
    agentLabel: " SYNTHESIS ",
    decision: "reject",
    syntheticPatientId: "P002",
    rubrics: [
      {
        rubricId: "honesty_labels_trusted",
        score: 3,
        justification: "  Asked if live care.  ",
      },
    ],
    safetyMiss: false,
    recommendation: "hold",
    trustHonestyLabels: 4,
  });
  assert.equal(body.agentLabel, "SYNTHESIS");
  assert.equal(body.rubrics[0]?.justification, "Asked if live care.");
  assert.equal(body.decision, "reject");
  assert.equal("clinicalValidationClaim" in body, false);

  // Repo honesty: do not flip production RBAC in C1 surfaces
  assert.doesNotMatch(panel, /productionRbacEnforced\s*[:=]\s*true/);
  assert.doesNotMatch(gpPage + adminPage, /liveEmis\s*[:=]\s*true/);

  console.log(
    "milestone-c1-facilitator-session: UI wiring + case pack helpers + feedback contract — PASS"
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
