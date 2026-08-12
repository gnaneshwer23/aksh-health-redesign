/**
 * U4 — GP dashboard demo polish.
 * Agent Control aligned with U1 job-in-loop copy; hero path review → Accept → export;
 * honesty: liveEmis:false · DemoDataBanner · Neo4j mock.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  AGENT_JOB_IN_LOOP,
  AGENT_SUB_CAPABILITIES,
} from "../lib/marketing/agent-job-in-loop";
import { FIRST_RUN_BY_DASHBOARD } from "../lib/product-journey";

const root = process.cwd();

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function run() {
  // U1 marketing source of truth still present
  assert.ok(AGENT_JOB_IN_LOOP.CANVAS.job.length > 20);
  assert.ok(AGENT_JOB_IN_LOOP.BRIDGE.job.includes("liveEmis"));
  assert.ok(AGENT_JOB_IN_LOOP.CONDUCTOR.job.length > 20);
  assert.ok(AGENT_JOB_IN_LOOP.HORIZON.job.includes("ORACLE") || AGENT_JOB_IN_LOOP.HORIZON.job.includes("formerly"));
  assert.equal(AGENT_SUB_CAPABILITIES.length, 2);
  assert.ok(AGENT_SUB_CAPABILITIES.some((s) => s.name === "VOICE" && s.under === "CANVAS"));
  assert.ok(AGENT_SUB_CAPABILITIES.some((s) => s.name === "Dr.Assist" && s.under === "SYNTHESIS"));

  // Agent Control consumes U1 blurbs
  const agentPanel = read("components/dashboard/AgentControlPanel.tsx");
  assert.ok(agentPanel.includes("AGENT_JOB_IN_LOOP"));
  assert.ok(agentPanel.includes("AGENT_SUB_CAPABILITIES"));
  assert.ok(agentPanel.includes("gp-agent-brand-strip"));
  assert.ok(agentPanel.includes("gp-canvas-panel"));
  assert.ok(agentPanel.includes("gp-conductor-panel"));
  assert.ok(agentPanel.includes("gp-bridge-panel"));
  assert.ok(agentPanel.includes("gp-horizon-panel"));
  assert.ok(agentPanel.includes("liveEmis:false"));
  assert.ok(agentPanel.includes("Export FHIR Bundle"));
  assert.ok(!agentPanel.includes("14 agents"));

  // Hero path strip
  const hero = read("components/dashboard/GpHeroDemoPath.tsx");
  assert.ok(hero.includes("gp-hero-demo-path"));
  assert.ok(hero.includes("/dashboard/gp/review-queue"));
  assert.ok(hero.includes("/review/pilot?demo=1"));
  assert.ok(hero.includes("/cases/case-005/evidence?demo=1"));
  assert.ok(hero.includes("/demo/script"));
  assert.ok(hero.includes("liveEmis:false"));

  const gpPage = read("app/dashboard/gp/page.tsx");
  assert.ok(gpPage.includes("GpHeroDemoPath"));
  assert.ok(gpPage.includes("AgentControlPanel"));
  assert.ok(gpPage.includes("gp-agents-drawer-trigger"));
  assert.ok(gpPage.includes("honesty={{"));
  assert.ok(gpPage.includes("neo4jSource"));

  const shell = read("components/dashboard/DashboardShell.tsx");
  assert.ok(shell.includes("HonestyStatusBar"));
  assert.ok(shell.includes("showBrandMark"));

  const honesty = read("components/dashboard/HonestyStatusBar.tsx");
  assert.ok(honesty.includes("honesty-status-bar"));
  assert.ok(honesty.includes("liveEmis:false"));
  assert.ok(honesty.includes("demo-data-banner"));
  assert.ok(honesty.includes("neo4j-mock-mode-banner"));

  const reviewPage = read("app/dashboard/gp/review-queue/page.tsx");
  assert.ok(reviewPage.includes("GpHeroDemoPath"));
  assert.ok(reviewPage.includes("honesty={{"));
  assert.ok(reviewPage.includes("ClinicalOrchestratePanel"));

  // First-run → review queue → demo script
  const firstRun = FIRST_RUN_BY_DASHBOARD.gp;
  assert.equal(firstRun.primaryHref, "/dashboard/gp/review-queue");
  assert.equal(firstRun.secondaryHref, "/demo/script");
  assert.ok(firstRun.agents?.includes("CANVAS"));
  assert.ok(firstRun.agents?.includes("CONDUCTOR"));
  assert.ok(firstRun.agents?.includes("HORIZON"));
  assert.ok(firstRun.agents?.includes("BRIDGE"));
  assert.match(firstRun.body, /Accept|BRIDGE|export/i);
  assert.match(firstRun.honesty ?? "", /liveEmis:false/);

  // Review queue CTAs + honest Accept toast
  const queue = read("components/dashboard/ReviewQueue.tsx");
  assert.ok(queue.includes("gp-queue-accept-cta"));
  assert.ok(queue.includes("gp-queue-export-cta"));
  assert.ok(queue.includes("liveEmis:false"));

  const queueItem = read("components/dashboard/ReviewQueueItem.tsx");
  assert.ok(queueItem.includes("staged via BRIDGE"));
  assert.ok(queueItem.includes("liveEmis:false"));
  assert.ok(!/written to record \(demo\)/i.test(queueItem));

  // Demo script GP hero panel
  const demoScript = read("components/demo/DemoLaunchScript.tsx");
  assert.ok(demoScript.includes("gp-hero-script-panel"));
  assert.ok(demoScript.includes("/dashboard/gp"));
  assert.ok(demoScript.includes("liveEmis: false") || demoScript.includes("liveEmis:false"));
  assert.ok(demoScript.includes("CANVAS"));
  assert.ok(demoScript.includes("HORIZON"));

  // DemoDataBanner honesty
  const banner = read("components/dashboard/DemoDataBanner.tsx");
  assert.ok(banner.includes("liveEmis:false"));
  assert.ok(banner.includes("/demo/script"));

  console.log("U4 GP dashboard demo polish checks passed.");
}

void run();
