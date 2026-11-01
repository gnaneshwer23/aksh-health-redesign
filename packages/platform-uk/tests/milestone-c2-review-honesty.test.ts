/**
 * Milestone C2 — Review honesty strip wiring + metadata helpers.
 * Synthetic / controlled data only. Does not claim clinical validation.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { getClinicalSpineOrchestrateCapabilities } from "../lib/clinical-spine/orchestrate";
import {
  REVIEW_HONESTY_LINES,
  buildReviewHonestyStripModel,
  llmSessionModeCapabilities,
  resolveLlmSessionMode,
  summarizeExecutionModes,
} from "../lib/review/honesty-strip";
import {
  buildReviewHonestyStripModel as buildClientModel,
  summarizeExecutionModesFromAgents,
} from "../lib/review/honesty-strip-client";

const root = path.join(__dirname, "..");

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

async function main() {
  // --- Docs ---
  const doc = read("docs/milestone-c/REVIEW_HONESTY.md");
  assert.match(doc, /What C2 is/);
  assert.match(doc, /What C2 is not/);
  assert.match(doc, /executionMode/);
  assert.match(doc, /clinical validation/i);
  assert.match(doc, /productionRbacEnforced/);
  assert.match(doc, /test:milestone-c/);
  assert.match(doc, /Not.*clinical validation/i);
  assert.match(doc, /LLM week/i);

  const c1 = read("docs/milestone-c/FACILITATOR_SESSION.md");
  assert.match(c1, /REVIEW_HONESTY/);
  assert.match(c1, /honesty strip/i);

  const plan = read("docs/agents/HCP_AGENT_EVALUATION_PLAN.md");
  assert.match(plan, /Milestone C2/);
  assert.match(plan, /REVIEW_HONESTY/);

  // --- Surfaces ---
  const strip = read("components/dashboard/review/ReviewHonestyStrip.tsx");
  const reviewPage = read("app/dashboard/gp/review-queue/page.tsx");
  const orchPanel = read("components/dashboard/precision-health/ClinicalOrchestratePanel.tsx");
  const pharm = read("app/dashboard/pharmacist/reviews/page.tsx");
  const hcpPanel = read("components/dashboard/hcp-eval/HcpFacilitatorSessionPanel.tsx");

  assert.match(strip, /data-testid="review-honesty-strip"/);
  assert.match(strip, /data-testid="review-honesty-llm-week"/);
  assert.match(strip, /data-testid="review-honesty-hitl"/);
  assert.match(strip, /data-testid="review-honesty-adapters"/);
  assert.match(strip, /data-testid="review-honesty-agent-modes"/);
  assert.match(strip, /ehrWrite/);
  assert.match(strip, /clinicalValidationClaim/);

  assert.match(reviewPage, /ReviewHonestyStrip/);
  assert.match(reviewPage, /GP review queue/);
  assert.match(orchPanel, /ReviewHonestyStrip/);
  assert.match(orchPanel, /variant="run"/);
  assert.match(orchPanel, /summarizeExecutionModesFromAgents/);
  assert.match(orchPanel, /execution\?\.agents/);
  assert.match(pharm, /ReviewHonestyStrip/);
  assert.match(hcpPanel, /honesty strip \(C2\)/);

  // Do not flip production RBAC in C2 surfaces
  assert.doesNotMatch(strip, /productionRbacEnforced\s*[:=]\s*true/);
  assert.doesNotMatch(reviewPage, /productionRbacEnforced\s*[:=]\s*true/);

  const pkg = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
  assert.ok(pkg.scripts["test:milestone-c:honesty"]);
  assert.match(pkg.scripts["test:milestone-c"], /test:milestone-c:honesty/);

  // --- Helpers: deterministic week ---
  const det = resolveLlmSessionMode({
    AKSH_ENVIRONMENT: "simulation",
    ENABLE_LLM_SYNTHESIS: "false",
    ENABLE_LLM_GUARDIAN: "false",
    ENABLE_LLM_ORACLE: "false",
    ENABLE_LLM_DR_ASSIST: "false",
    ENABLE_LLM_NEXUS: "false",
    ENABLE_LLM_EQUITY: "false",
  });
  assert.equal(det.mode, "deterministic_week");
  assert.equal(det.ehrWrite, false);
  assert.equal(det.clinicalValidationClaim, false);
  assert.deepEqual(det.enabledAgents, []);

  // Opt-in LLM week (simulation env; llm-gate treats non-process env as configured when flag true)
  const llmWeek = resolveLlmSessionMode({
    AKSH_ENVIRONMENT: "simulation",
    ENABLE_LLM_SYNTHESIS: "true",
  });
  assert.equal(llmWeek.mode, "opt_in_llm_week");
  assert.ok(llmWeek.enabledAgents.includes("SYNTHESIS"));
  assert.equal(llmWeek.ehrWrite, false);

  const caps = llmSessionModeCapabilities({
    AKSH_ENVIRONMENT: "simulation",
    ENABLE_LLM_SYNTHESIS: "false",
    ENABLE_LLM_GUARDIAN: "false",
    ENABLE_LLM_ORACLE: "false",
    ENABLE_LLM_DR_ASSIST: "false",
    ENABLE_LLM_NEXUS: "false",
    ENABLE_LLM_EQUITY: "false",
  });
  assert.equal(caps.llmSessionMode, "deterministic_week");
  assert.equal(caps.ehrWrite, false);
  assert.equal(caps.clinicalValidationClaim, false);
  assert.ok(caps.honestyLines.length >= REVIEW_HONESTY_LINES.length);
  assert.ok(caps.adapters.some((a) => a.id === "lab" && a.live === false));
  assert.ok(caps.adapters.some((a) => a.id === "pharmacy" && a.live === false));

  // Orchestrate GET capabilities include session mode
  const orchCaps = getClinicalSpineOrchestrateCapabilities();
  assert.equal(orchCaps.ehrWrite, false);
  assert.equal(orchCaps.hitlRequired, true);
  assert.ok("llmSessionMode" in orchCaps);
  assert.ok(
    orchCaps.llmSessionMode === "deterministic_week" || orchCaps.llmSessionMode === "opt_in_llm_week"
  );

  // executionMode summary from A1-shaped metadata
  const run = summarizeExecutionModes(
    [
      { agentId: "CONDUCTOR", executionMode: "orchestrator" },
      { agentId: "SYNTHESIS", executionMode: "deterministic" },
      { agentId: "GUARDIAN", executionMode: "deterministic" },
      { agentId: "HORIZON", executionMode: "deterministic" },
    ],
    {
      evidenceRefs: ["SYNTHESIS:ok", "GUARDIAN:ok"],
      correlationId: "aksh-run-test123456",
      guardianOutcome: null,
      ehrWrite: false,
      hitlRequired: true,
    }
  );
  assert.equal(run.overallMode, "deterministic");
  assert.equal(run.ehrWrite, false);
  assert.equal(run.hitlRequired, true);
  assert.equal(run.evidenceRefCount, 2);
  assert.ok(run.agentModes.some((a) => a.agentId === "SYNTHESIS" && a.executionMode === "deterministic"));

  const hybrid = summarizeExecutionModesFromAgents([
    { agentId: "SYNTHESIS", executionMode: "llm" },
    { agentId: "GUARDIAN", executionMode: "deterministic" },
  ]);
  assert.equal(hybrid.overallMode, "hybrid");

  const model = buildReviewHonestyStripModel({
    surface: "GP review queue",
    env: {
      AKSH_ENVIRONMENT: "simulation",
      ENABLE_LLM_SYNTHESIS: "false",
      ENABLE_LLM_GUARDIAN: "false",
      ENABLE_LLM_ORACLE: "false",
      ENABLE_LLM_DR_ASSIST: "false",
      ENABLE_LLM_NEXUS: "false",
    },
    agents: [
      { agentId: "SYNTHESIS", executionMode: "deterministic" },
      { agentId: "GUARDIAN", executionMode: "deterministic" },
    ],
  });
  assert.equal(model.clinicalValidationClaim, false);
  assert.equal(model.ehrWrite, false);
  assert.equal(model.hitlRequired, true);
  assert.equal(model.session.mode, "deterministic_week");
  assert.ok(model.run);
  assert.equal(model.run!.overallMode, "deterministic");

  const client = buildClientModel({
    surface: "test",
    sessionMode: "deterministic_week",
    agentModes: [{ agentId: "NEXUS", executionMode: "deterministic" }],
  });
  assert.equal(client.run?.overallMode, "deterministic");

  console.log("milestone-c2-review-honesty: strip + session mode + executionMode metadata — PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
