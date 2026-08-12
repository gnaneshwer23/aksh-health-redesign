/**
 * Generate final E2E platform validation report (Stage 12).
 *
 * Usage:
 *   npm run report:e2e
 *   npm run report:e2e -- --batch=e2e-20260812
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  buildFinalE2EReport,
  renderFinalE2EReportMarkdown,
} from "../lib/e2e/final-report";

const root = process.cwd();

function parseArgs(argv: string[]) {
  const batchArg = argv.find((a) => a.startsWith("--batch="));
  return { batchId: batchArg ? batchArg.split("=")[1] : undefined };
}

async function loadJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function resolveBatchId(explicit?: string) {
  if (explicit) return explicit;
  const latest = await loadJson<{ batchId: string }>(
    path.join(root, "data", "e2e", "latest-batch.json")
  );
  return latest.batchId;
}

function runGeneratorValidation(seed = 20260812) {
  const result = spawnSync("npx", ["tsx", "--test", "tests/e2e-platform-generator.test.ts"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, E2E_REPORT_SEED: String(seed) },
  });
  return {
    ok: result.status === 0,
    stdout: result.stdout?.slice(-2000) ?? "",
    stderr: result.stderr?.slice(-1000) ?? "",
  };
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const batchId = await resolveBatchId(args.batchId);
  const batchDir = path.join(root, "data", "e2e", batchId);

  const manifest = await loadJson<{
    seed: number;
    patientCount: number;
    userCount: number;
    patientStateFactCount: number;
    labEventCount: number;
    pharmacyEventCount: number;
    scenarioDistribution: Record<string, number>;
  }>(path.join(batchDir, "manifest.json"));

  const generatorTests = runGeneratorValidation(manifest.seed);

  const report = buildFinalE2EReport({
    batchId,
    seed: manifest.seed,
    generatorTestsPass: generatorTests.ok,
    population: {
      patients: manifest.patientCount,
      users: manifest.userCount,
      patientStateFacts: manifest.patientStateFactCount,
      labEvents: manifest.labEventCount,
      pharmacyEvents: manifest.pharmacyEventCount,
      scenarioDistribution: manifest.scenarioDistribution,
    },
  });

  const md = renderFinalE2EReportMarkdown(report);
  const reportsDir = path.join(root, "docs", "reports");
  await mkdir(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, `E2E_PLATFORM_REPORT_${batchId}.md`);
  const finalPath = path.join(reportsDir, `E2E_PLATFORM_FINAL_REPORT_${batchId}.md`);
  const jsonPath = path.join(batchDir, "report.json");

  await writeFile(reportPath, md, "utf8");
  await writeFile(finalPath, md, "utf8");
  await writeFile(jsonPath, JSON.stringify(report, null, 2), "utf8");

  console.log(`Final report written:\n  ${finalPath}\n  ${reportPath}\n  ${jsonPath}`);
  console.log(
    `Status: ${report.executiveSummary.overallStatus} · golden ${report.executiveSummary.goldenValidated}/${report.executiveSummary.goldenTotal} · stages ${report.executiveSummary.stagesComplete}/12`
  );
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
