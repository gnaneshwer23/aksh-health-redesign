/**
 * Milestone E P1 — coordination / interop:
 * - P1.1 careEpisodeId handoff links (HCP → review / lab-pharmacy)
 * - P1.2 loop-outcomes Postgres-preferred storeMode honesty
 * - P1.3 PATHWAY/BRIDGE shared run-id lineage (liveEmis:false)
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.join(__dirname, "..");

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

async function main() {
  // --- Docs ---
  const doc = read("docs/milestone-e/COORDINATION_INTEROP.md");
  assert.match(doc, /P1\.1/);
  assert.match(doc, /P1\.2/);
  assert.match(doc, /P1\.3/);
  assert.match(doc, /careEpisodeId/);
  assert.match(doc, /storeMode/);
  assert.match(doc, /file_fallback/);
  assert.match(doc, /durableRunId/);
  assert.match(doc, /liveEmis/);
  assert.match(doc, /productionRbacEnforced/);
  assert.match(doc, /test:milestone-e:p1/);

  const readme = read("docs/milestone-e/README.md");
  assert.match(readme, /COORDINATION_INTEROP|P1/);

  // --- P1.1 handoff helpers + surfaces ---
  const helpers = read("lib/eval/hcp-facilitator-session.ts");
  assert.match(helpers, /buildCrossSurfaceHandoffHref/);
  assert.match(helpers, /care_episode_id/);
  assert.match(helpers, /readCareEpisodeIdFromSearchParams/);

  const {
    buildCrossSurfaceHandoffHref,
    readCareEpisodeIdFromSearchParams,
  } = await import("../lib/eval/hcp-facilitator-session");

  const reviewHref = buildCrossSurfaceHandoffHref("/dashboard/gp/review-queue", {
    patientId: "P002",
    careEpisodeId: "ce-p1-test",
  });
  assert.match(reviewHref, /patient=P002/);
  assert.match(reviewHref, /careEpisodeId=ce-p1-test/);
  assert.match(reviewHref, /care_episode_id=ce-p1-test/);

  const labHref = buildCrossSurfaceHandoffHref("/dashboard/gp/lab-pharmacy", {
    patientId: "P002",
    careEpisodeId: "ce-p1-test",
  });
  assert.match(labHref, /patientId=P002/);
  assert.match(labHref, /careEpisodeId=ce-p1-test/);

  assert.equal(
    readCareEpisodeIdFromSearchParams({
      get: (k: string) => (k === "care_episode_id" ? "ce-snake" : null),
    }),
    "ce-snake"
  );

  const panel = read("components/dashboard/hcp-eval/HcpFacilitatorSessionPanel.tsx");
  assert.match(panel, /buildCrossSurfaceHandoffHref/);
  assert.match(panel, /hcp-session-care-episode-id/);
  assert.match(panel, /careEpisodeId/);

  const reviewPage = read("app/dashboard/gp/review-queue/page.tsx");
  assert.match(reviewPage, /readCareEpisodeIdFromSearchParams/);
  assert.match(reviewPage, /careEpisodeId/);
  assert.match(reviewPage, /ClinicalOrchestratePanel/);

  const orchPanel = read("components/dashboard/precision-health/ClinicalOrchestratePanel.tsx");
  assert.match(orchPanel, /careEpisodeId/);
  assert.match(orchPanel, /care_episode_id/);

  // --- P1.2 loop-outcomes storeMode ---
  const loopRepo = read("lib/repositories/loop-outcomes-repository.ts");
  assert.match(loopRepo, /storeMode/);
  assert.match(loopRepo, /file_fallback/);
  assert.match(loopRepo, /postgres/);
  assert.match(loopRepo, /LoopOutcomesStoreMode = "postgres" \| "file" \| "file_fallback"/);
  assert.match(loopRepo, /storeMode:\s*"file"/);
  assert.match(loopRepo, /storeMode:\s*"postgres"/);
  assert.match(loopRepo, /storeMode:\s*"file_fallback"/);

  const loopApi = read("app/api/agents/loop-outcomes/route.ts");
  assert.match(loopApi, /storeMode/);
  assert.match(loopApi, /scopeKey/);

  const opsPage = read("app/dashboard/admin/agent-ops/page.tsx");
  assert.match(opsPage, /agent-ops-loop-store-mode/);
  assert.match(opsPage, /storeMode/);

  const { listAgentRunCases } = await import("../lib/repositories/loop-outcomes-repository");
  const listed = await listAgentRunCases({
    practiceId: "practice-p1-hermetic",
    scopeKey: "p1-loop-hermetic",
    limit: 50,
  });
  assert.equal(listed.storeMode, "file");
  assert.equal(listed.source, "file");
  assert.ok(Array.isArray(listed.cases));

  // --- P1.3 PATHWAY / BRIDGE lineage ---
  const lineageSrc = read("lib/agents/run-lineage.ts");
  assert.match(lineageSrc, /extractOrchestrationRunLineage/);
  assert.match(lineageSrc, /attachLineageToBundle/);
  assert.match(lineageSrc, /liveEmis:\s*false/);

  const {
    extractOrchestrationRunLineage,
    attachLineageToBundle,
    lineageMetadata,
  } = await import("../lib/agents/run-lineage");

  const lineage = extractOrchestrationRunLineage(
    {
      id: "case-p1",
      careEpisodeId: "ce-p1",
      agentRun: {
        source: "clinical_spine",
        ranAt: new Date().toISOString(),
        queuePriority: "Normal",
        reviewOrder: ["SYNTHESIS"],
        safetyRoute: "clinical_review_queue",
        ruleVersion: "none",
        pendingReferrals: [],
        missingLabs: [],
        correlations: [],
        modelUsed: false,
        durableRunId: "run-p1-durable",
        correlationId: "corr-p1",
        careEpisodeId: "ce-p1",
      },
    },
    {}
  );
  assert.equal(lineage.durableRunId, "run-p1-durable");
  assert.equal(lineage.correlationId, "corr-p1");
  assert.equal(lineage.careEpisodeId, "ce-p1");
  assert.equal(lineage.liveEmis, false);
  assert.equal(lineage.ehrWrite, false);

  const tagged = attachLineageToBundle({ resourceType: "Bundle", type: "collection" }, lineage);
  assert.equal((tagged.akshRunLineage as { durableRunId: string }).durableRunId, "run-p1-durable");
  assert.ok(lineageMetadata(lineage).durableRunId === "run-p1-durable");

  const referralAgent = read("lib/referral-agent.ts");
  assert.match(referralAgent, /extractOrchestrationRunLineage|lineageMetadata/);
  assert.match(referralAgent, /PATHWAY/);

  const referralApi = read("app/api/agents/referral/route.ts");
  assert.match(referralApi, /durableRunId/);
  assert.match(referralApi, /careEpisodeId/);
  assert.match(referralApi, /runLineage/);
  assert.doesNotMatch(referralApi, /liveEmis\s*[:=]\s*true/);

  const bridge = read("lib/bridge-staging.ts");
  assert.match(bridge, /attachLineageToBundle|extractOrchestrationRunLineage/);
  assert.match(bridge, /runLineage/);
  assert.doesNotMatch(bridge, /liveEmis\s*[:=]\s*true/);

  const bridgeRepo = read("lib/repositories/bridge-staging-repository.ts");
  assert.match(bridgeRepo, /durableRunId/);
  assert.match(bridgeRepo, /careEpisodeId/);

  const enqueue = read("lib/clinical-spine/enqueue.ts");
  assert.match(enqueue, /durableRunId/);
  assert.match(enqueue, /lineageMetadata|extractOrchestrationRunLineage/);

  // Package scripts
  const pkg = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
  assert.ok(pkg.scripts["test:milestone-e:p1"]);
  assert.match(pkg.scripts["test:milestone-e"], /test:milestone-e:p1/);

  // Residual dual-path honesty
  const channel = read("lib/agents/ops-alert-channel.ts");
  assert.match(channel, /coordination_interop_unified/);
  assert.match(channel, /residualDualPathStores:\s*\[\]/);

  console.log(
    "milestone-e-p1-coordination-interop: handoff + loop storeMode + PATHWAY/BRIDGE lineage — PASS"
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
