import { NextResponse } from "next/server";

import { isE2EAdminSurfaceAllowed } from "@/lib/e2e/env";
import {
  E2E_FINDINGS,
  GOLDEN_SCENARIO_COVERAGE,
  STAGE_COVERAGE,
  buildArchitectureLoopCoverage,
  buildFinalE2EReportFromDataset,
} from "@/lib/e2e/final-report";
import { generateE2EDataset } from "@/lib/e2e/generator";
import { requireAppRole } from "@/lib/user-scope";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

async function loadLatestBatch() {
  try {
    const latestPath = path.join(process.cwd(), "data", "e2e", "latest-batch.json");
    const latest = JSON.parse(await readFile(latestPath, "utf8")) as { batchId: string };
    const batchDir = path.join(process.cwd(), "data", "e2e", latest.batchId);
    const manifest = JSON.parse(await readFile(path.join(batchDir, "manifest.json"), "utf8"));
    let report = null;
    try {
      report = JSON.parse(await readFile(path.join(batchDir, "report.json"), "utf8"));
    } catch {
      // report optional until report:e2e / POST regenerate
    }
    return { batchId: latest.batchId, manifest, report, source: "artifacts" as const };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  if (!isE2EAdminSurfaceAllowed()) {
    return NextResponse.json(
      { error: "E2E admin surface disabled in this environment", liveEmis: false },
      { status: 403 }
    );
  }

  const auth = await requireAppRole(request, ["operations_lead", "clinical_reviewer"]);
  if (auth.response || !auth.context) return auth.response;

  const batch = await loadLatestBatch();
  const dataset = generateE2EDataset({ seed: 20260812 });
  const fallbackReport = buildFinalE2EReportFromDataset(dataset, { generatorTestsPass: true });
  const report = batch?.report ?? fallbackReport;

  return NextResponse.json({
    allowed: true,
    liveEmis: false,
    autoRetrain: false,
    source: "AKSH_E2E_TEST",
    batchSource: batch?.source ?? "generator",
    batch: batch
      ? { batchId: batch.batchId, manifest: batch.manifest, report }
      : {
          batchId: fallbackReport.batchId,
          manifest: {
            patientCount: fallbackReport.testPopulation.patients,
            userCount: fallbackReport.testPopulation.users,
            scenarioDistribution: fallbackReport.testPopulation.scenarioDistribution,
            patientStateFactCount: fallbackReport.testPopulation.patientStateFacts,
            labEventCount: fallbackReport.testPopulation.labEvents,
            pharmacyEventCount: fallbackReport.testPopulation.pharmacyEvents,
            seed: fallbackReport.seed,
          },
          report: fallbackReport,
        },
    coverage: {
      stages: STAGE_COVERAGE,
      goldenScenarios: GOLDEN_SCENARIO_COVERAGE,
      findings: E2E_FINDINGS,
      architectureLoop: buildArchitectureLoopCoverage(),
    },
    commands: {
      seed: "E2E_TEST_MODE=true npm run seed:e2e -- --apply",
      cleanup: "npm run cleanup:e2e -- --batch=e2e-20260812 --apply",
      report: "npm run report:e2e",
      unitGates: "npm run test:e2e:platform-unit-gates",
      stage12: "npm run test:e2e:platform-stage12",
      allStages: "npm run test:e2e:platform-all-stages",
      tests: "npm run test:e2e:platform",
    },
    actions: {
      refresh: "GET /api/admin/e2e/status",
      downloadReportJson: "GET /api/admin/e2e/report?format=json",
      downloadReportMarkdown: "GET /api/admin/e2e/report?format=markdown",
      regenerateReport: "POST /api/admin/e2e/report",
      simsSummary: "GET /api/admin/e2e/sims",
      completeLab: "POST /api/admin/e2e/sims { action: complete-lab }",
      pharmacyEscalate: "POST /api/admin/e2e/sims { action: pharmacy-escalate }",
    },
  });
}
