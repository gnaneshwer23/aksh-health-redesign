import assert from "node:assert/strict";

import {
  PERF_SLO_TARGETS,
  evaluatePerfSample,
  getPerfSlo
} from "../lib/clinical-proof/perf-slos";
import { runHitlStagingSimWritebackChain } from "../lib/clinical-proof/hitl-writeback-chain";

function run() {
  assert.equal(PERF_SLO_TARGETS.length, 3);
  assert.ok(getPerfSlo("dashboard_load").targetMs > 0);
  assert.ok(getPerfSlo("agent_draft").targetMs > 0);
  assert.ok(getPerfSlo("review_action").targetMs > 0);

  const ok = evaluatePerfSample({ id: "dashboard_load", elapsedMs: 500, strict: true });
  assert.equal(ok.ok, true);

  const soft = evaluatePerfSample({ id: "dashboard_load", elapsedMs: 4_500, strict: false });
  assert.equal(soft.ok, true);
  assert.equal(soft.soft, true);

  const strictFail = evaluatePerfSample({ id: "dashboard_load", elapsedMs: 4_500, strict: true });
  assert.equal(strictFail.ok, false);

  // Review-action in-process timing (deterministic chain — always measurable in CI)
  const started = Date.now();
  runHitlStagingSimWritebackChain({
    caseId: "perf-smoke-review",
    clinicianId: "gp-perf",
    clinicianName: "Dr Perf"
  });
  const elapsedMs = Date.now() - started;
  const reviewEval = evaluatePerfSample({
    id: "review_action",
    elapsedMs,
    strict: false
  });
  assert.ok(reviewEval.ok, reviewEval.message);
  console.log(`Perf SLO contract + review_action sample: ${elapsedMs}ms — ${reviewEval.message}`);
}

void run();
