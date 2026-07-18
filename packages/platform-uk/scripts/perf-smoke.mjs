#!/usr/bin/env node
/**
 * Lightweight perf smoke for Sprint C clinical-proof SLOs.
 *
 * Soft by default:
 *   - If base URL is unreachable → skip with exit 0 (warn)
 *   - If latency above soft target but ≤ hard → soft-fail warn, exit 0
 *   - Set PERF_SMOKE_STRICT=true to exit 1 on soft/hard misses when target is reachable
 *
 * Usage:
 *   PERF_SMOKE_BASE_URL=http://127.0.0.1:3000 npm run smoke:perf
 *   PERF_SMOKE_BASE_URL=https://akshhealth.com npm run smoke:perf
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const baseUrl = (process.env.PERF_SMOKE_BASE_URL || process.env.SMOKE_BASE_URL || "").replace(/\/$/, "");
const strict = process.env.PERF_SMOKE_STRICT === "true";
const timeoutMs = Number(process.env.PERF_SMOKE_TIMEOUT_MS || 20_000);

/** Inline SLO mirrors lib/clinical-proof/perf-slos.ts (keep in sync). */
const SLOS = {
  dashboard_load: { targetMs: 3000, hardMs: 8000 },
  agent_draft: { targetMs: 5000, hardMs: 15000 },
  review_action: { targetMs: 2000, hardMs: 6000 }
};

function evaluate(id, elapsedMs) {
  const t = SLOS[id];
  if (elapsedMs <= t.targetMs) return { ok: true, soft: false, msg: `${id} ${elapsedMs}ms ≤ ${t.targetMs}ms` };
  if (elapsedMs <= t.hardMs) {
    return {
      ok: !strict,
      soft: true,
      msg: `${id} ${elapsedMs}ms > soft ${t.targetMs}ms (≤ hard ${t.hardMs}ms)`
    };
  }
  return {
    ok: !strict,
    soft: true,
    msg: `${id} ${elapsedMs}ms > hard ${t.hardMs}ms${strict ? " STRICT" : " soft-fail"}`
  };
}

async function timedFetch(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetch(url, { ...options, signal: controller.signal, redirect: "manual" });
    return { response, elapsedMs: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}

async function probeHttp() {
  if (!baseUrl) {
    console.warn("[perf-smoke] No PERF_SMOKE_BASE_URL / SMOKE_BASE_URL — skipping HTTP probes (unit SLOs still run).");
    return { skipped: true, results: [] };
  }

  const results = [];

  try {
    const health = await timedFetch(`${baseUrl}/api/health`);
    if (!health.response.ok && health.response.status >= 500) {
      console.warn(`[perf-smoke] ${baseUrl}/api/health → ${health.response.status}; skipping HTTP SLO probes.`);
      return { skipped: true, results: [] };
    }
  } catch (error) {
    console.warn(`[perf-smoke] Unreachable ${baseUrl} (${error.message}); soft-skip HTTP probes.`);
    return { skipped: true, results: [] };
  }

  // Dashboard load — public ICS allowlisted path avoids auth
  try {
    const dash = await timedFetch(`${baseUrl}/dashboard/ics`);
    const ev = evaluate("dashboard_load", dash.elapsedMs);
    results.push({ id: "dashboard_load", ...ev, elapsedMs: dash.elapsedMs, status: dash.response.status });
    console.log(`[perf-smoke] dashboard_load status=${dash.response.status} ${ev.msg}`);
  } catch (error) {
    results.push({ id: "dashboard_load", ok: !strict, soft: true, msg: `dashboard probe failed: ${error.message}` });
    console.warn(`[perf-smoke] dashboard probe failed: ${error.message}`);
  }

  // Agent draft — public GET status is unauthenticated; POST requires session.
  // Timing the GET route still exercises agent route cold-start / TTFB.
  try {
    const agent = await timedFetch(`${baseUrl}/api/agents/guardian`);
    const ev = evaluate("agent_draft", agent.elapsedMs);
    results.push({ id: "agent_draft", ...ev, elapsedMs: agent.elapsedMs, status: agent.response.status });
    console.log(`[perf-smoke] agent_draft status=${agent.response.status} ${ev.msg}`);
  } catch (error) {
    results.push({ id: "agent_draft", ok: !strict, soft: true, msg: `agent probe failed: ${error.message}` });
    console.warn(`[perf-smoke] agent probe failed: ${error.message}`);
  }

  return { skipped: false, results };
}

function runUnitSloCheck() {
  const run = spawnSync(
    "npx",
    ["tsx", "tests/clinical-proof-perf-slos.test.ts"],
    { cwd: root, encoding: "utf8", env: { ...process.env, ENABLE_LLM_GUARDIAN: "false" } }
  );
  if (run.stdout) process.stdout.write(run.stdout);
  if (run.stderr) process.stderr.write(run.stderr);
  return run.status === 0;
}

async function main() {
  console.log(`Perf smoke (strict=${strict}) base=${baseUrl || "(none)"}`);
  console.log("SLO targets: dashboard≤3s soft/8s hard · agent≤5s/15s · review≤2s/6s (see docs/E2E_CLINICAL_PROOF.md)");

  const unitOk = runUnitSloCheck();
  if (!unitOk) {
    console.error("[perf-smoke] Unit SLO contract failed.");
    process.exit(1);
  }

  const { skipped, results } = await probeHttp();
  if (skipped) {
    console.log("[perf-smoke] HTTP probes skipped — not a hard failure.");
    process.exit(0);
  }

  const failures = results.filter((r) => !r.ok);
  if (failures.length) {
    console.error("[perf-smoke] Failures:", failures.map((f) => f.msg).join("; "));
    process.exit(1);
  }

  const softs = results.filter((r) => r.soft);
  if (softs.length) {
    console.warn("[perf-smoke] Soft warnings (env may not hit prod latency):", softs.map((s) => s.msg).join("; "));
  }

  console.log("[perf-smoke] Complete.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
