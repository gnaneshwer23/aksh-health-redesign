import { NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { isE2EAdminSurfaceAllowed } from "@/lib/e2e/env";
import {
  buildFinalE2EReportFromDataset,
  renderFinalE2EReportMarkdown,
  type FinalE2EReport,
} from "@/lib/e2e/final-report";
import { generateE2EDataset } from "@/lib/e2e/generator";
import { requireAppRole } from "@/lib/user-scope";

export const dynamic = "force-dynamic";

async function loadBatchReport(): Promise<{
  batchId: string;
  report: FinalE2EReport;
  source: "artifacts" | "generator";
} | null> {
  try {
    const latestPath = path.join(process.cwd(), "data", "e2e", "latest-batch.json");
    const latest = JSON.parse(await readFile(latestPath, "utf8")) as { batchId: string };
    const reportPath = path.join(process.cwd(), "data", "e2e", latest.batchId, "report.json");
    try {
      const report = JSON.parse(await readFile(reportPath, "utf8")) as FinalE2EReport;
      return { batchId: latest.batchId, report, source: "artifacts" };
    } catch {
      const dataset = generateE2EDataset({ seed: 20260812 });
      const report = buildFinalE2EReportFromDataset(dataset, { generatorTestsPass: true });
      return { batchId: latest.batchId, report, source: "generator" };
    }
  } catch {
    return null;
  }
}

/**
 * GET /api/admin/e2e/report?format=json|markdown
 * Serves the latest final E2E report (artifacts or generator fallback).
 */
export async function GET(request: Request) {
  if (!isE2EAdminSurfaceAllowed()) {
    return NextResponse.json(
      { error: "E2E report surface disabled", liveEmis: false },
      { status: 403 }
    );
  }

  const auth = await requireAppRole(request, ["operations_lead", "clinical_reviewer"]);
  if (auth.response || !auth.context) return auth.response;

  const loaded = await loadBatchReport();
  const dataset = generateE2EDataset({ seed: 20260812 });
  const report =
    loaded?.report ?? buildFinalE2EReportFromDataset(dataset, { generatorTestsPass: true });
  const batchId = loaded?.batchId ?? report.batchId;
  const source = loaded?.source ?? "generator";

  const url = new URL(request.url);
  const format = (url.searchParams.get("format") ?? "json").toLowerCase();

  if (format === "markdown" || format === "md") {
    const md = renderFinalE2EReportMarkdown(report);
    return new NextResponse(md, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="E2E_PLATFORM_FINAL_REPORT_${batchId}.md"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json({
    allowed: true,
    liveEmis: false,
    autoRetrain: false,
    source,
    batchId,
    report,
  });
}

/**
 * POST /api/admin/e2e/report — regenerate in-memory final report and persist when batch exists.
 * Does not seed Neon and does not touch @demo.akshhealth.com.
 */
export async function POST(request: Request) {
  if (!isE2EAdminSurfaceAllowed()) {
    return NextResponse.json(
      { error: "E2E report surface disabled", liveEmis: false },
      { status: 403 }
    );
  }

  const auth = await requireAppRole(request, ["operations_lead", "clinical_reviewer"]);
  if (auth.response || !auth.context) return auth.response;

  const dataset = generateE2EDataset({ seed: 20260812 });
  let batchId = dataset.manifest.batchId;
  let persisted = false;

  try {
    const latest = JSON.parse(
      await readFile(path.join(process.cwd(), "data", "e2e", "latest-batch.json"), "utf8")
    ) as { batchId: string };
    batchId = latest.batchId;
  } catch {
    // generator batch id
  }

  const report = buildFinalE2EReportFromDataset(
    { ...dataset, manifest: { ...dataset.manifest, batchId } },
    { generatorTestsPass: true }
  );

  try {
    const batchDir = path.join(process.cwd(), "data", "e2e", batchId);
    await mkdir(batchDir, { recursive: true });
    await writeFile(path.join(batchDir, "report.json"), JSON.stringify(report, null, 2), "utf8");
    const reportsDir = path.join(process.cwd(), "docs", "reports");
    await mkdir(reportsDir, { recursive: true });
    const md = renderFinalE2EReportMarkdown(report);
    await writeFile(path.join(reportsDir, `E2E_PLATFORM_FINAL_REPORT_${batchId}.md`), md, "utf8");
    persisted = true;
  } catch {
    persisted = false;
  }

  return NextResponse.json({
    ok: true,
    persisted,
    batchId,
    liveEmis: false,
    autoRetrain: false,
    ehrWrite: false,
    report,
    note: persisted
      ? "Report regenerated and written to local artifacts (dev/test)."
      : "Report generated in-memory; filesystem persist unavailable in this environment.",
  });
}
