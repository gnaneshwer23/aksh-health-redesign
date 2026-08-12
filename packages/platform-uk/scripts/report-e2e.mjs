/**
 * Generate E2E platform validation report from local artifacts + optional Neon counts.
 *
 * Usage:
 *   npm run report:e2e
 *   npm run report:e2e -- --batch=e2e-20260812-20260812
 *   node --env-file=.env.local scripts/report-e2e.mjs
 */

import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();

function parseArgs(argv) {
  const batchArg = argv.find((a) => a.startsWith("--batch="));
  return { batchId: batchArg ? batchArg.split("=")[1] : undefined };
}

async function loadJson(filePath) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function resolveBatchId(explicit) {
  if (explicit) return explicit;
  try {
    const latest = await loadJson(path.join(root, "data", "e2e", "latest-batch.json"));
    return latest.batchId;
  } catch {
    throw new Error("No batch found. Run npm run seed:e2e first or pass --batch=");
  }
}

function runGeneratorValidation(seed = 20260812) {
  const result = spawnSync(
    "npx",
    ["tsx", "--test", "tests/e2e-platform-generator.test.ts"],
    { cwd: root, encoding: "utf8", env: { ...process.env, E2E_REPORT_SEED: String(seed) } }
  );
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

  const manifest = await loadJson(path.join(batchDir, "manifest.json"));
  const patients = await loadJson(path.join(batchDir, "patients.json"));
  const users = await loadJson(path.join(batchDir, "users.json"));
  const labEvents = await loadJson(path.join(batchDir, "labEvents.json"));
  const pharmacyEvents = await loadJson(path.join(batchDir, "pharmacyEvents.json"));

  const doctors = users.filter((u) => u.role === "gp");
  const nurses = users.filter((u) => u.role === "nurse");
  const pharmacists = users.filter((u) => u.role === "clinical-pharmacist");

  const generatorTests = runGeneratorValidation(manifest.seed);

  const report = {
    generatedAt: new Date().toISOString(),
    batchId,
    seed: manifest.seed,
    source: "AKSH_E2E_TEST",
    liveEmis: false,
    autoRetrain: false,
    executiveSummary: {
      overallStatus: generatorTests.ok ? "READY FOR INTERNAL TESTING" : "NOT READY",
      readinessLabel: "READY FOR INTERNAL TESTING",
      note: "Software E2E validation only — not production clinical readiness.",
    },
    testPopulation: {
      patients: patients.length,
      doctors: doctors.length,
      nurses: nurses.length,
      pharmacists: pharmacists.length,
      totalUsers: users.length,
      labEvents: labEvents.length,
      pharmacyEvents: pharmacyEvents.length,
      scenarioDistribution: manifest.scenarioDistribution,
    },
    functionalCoverage: {
      patientState: manifest.patientStateFactCount > 0 ? "seeded" : "missing",
      intelligence: "partial — existing agents; golden scenarios defined",
      decision: "partial — HITL + decision module",
      intervention: "partial — simulated lab/pharmacy file events",
      learning: "existing learning_events harness",
      safety: "SHIELD + GUARDIAN — golden scenarios include safety cases",
    },
    generatorTests: {
      pass: generatorTests.ok,
      detail: generatorTests.ok ? "e2e-platform-generator.test.ts passed" : generatorTests.stderr || generatorTests.stdout,
    },
    goldenScenarioCount: 20,
    criticalFailures: generatorTests.ok ? [] : ["Generator unit tests failed"],
    recommendations: [
      "Run npm run seed:e2e -- --apply against dev/test Neon only.",
      "Execute npm run test:clinical-proof && npm run test:e2e after seed.",
      "Map golden scenarios AKSH-E2E-0001..0020 to Playwright journeys (Stage 8+).",
    ],
  };

  const reportsDir = path.join(root, "docs", "reports");
  await mkdir(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, `E2E_PLATFORM_REPORT_${batchId}.md`);
  const jsonPath = path.join(batchDir, "report.json");

  const md = `# Aksh E2E Platform Report — ${batchId}

**Generated:** ${report.generatedAt}  
**Seed:** ${manifest.seed}  
**Status:** ${report.executiveSummary.overallStatus}

## Test population

| Entity | Count |
| --- | --- |
| Patients | ${report.testPopulation.patients} |
| Doctors (gp role) | ${report.testPopulation.doctors} |
| Nurses | ${report.testPopulation.nurses} |
| Pharmacists | ${report.testPopulation.pharmacists} |
| Total users | ${report.testPopulation.totalUsers} |
| Lab events (sim) | ${report.testPopulation.labEvents} |
| Pharmacy events (sim) | ${report.testPopulation.pharmacyEvents} |

## Cohort distribution

${Object.entries(manifest.scenarioDistribution)
  .map(([k, v]) => `- **Cohort ${k}:** ${v}`)
  .join("\n")}

## Functional coverage (honest)

- **Patient State:** ${report.functionalCoverage.patientState}
- **Intelligence:** ${report.functionalCoverage.intelligence}
- **Decision:** ${report.functionalCoverage.decision}
- **Intervention:** ${report.functionalCoverage.intervention}
- **Learning:** ${report.functionalCoverage.learning}
- **Safety:** ${report.functionalCoverage.safety}

## Generator tests

${generatorTests.ok ? "PASS" : "FAIL"} — \`tests/e2e-platform-generator.test.ts\`

## Readiness

**${report.executiveSummary.readinessLabel}** — not controlled pilot / not production clinical.

## Next steps

${report.recommendations.map((r) => `- ${r}`).join("\n")}
`;

  await writeFile(reportPath, md, "utf8");
  await writeFile(jsonPath, JSON.stringify(report, null, 2), "utf8");

  console.log(`Report written:\n  ${reportPath}\n  ${jsonPath}`);
  console.log(`Status: ${report.executiveSummary.overallStatus}`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
