import { NextResponse } from "next/server";

import { isE2EAdminSurfaceAllowed } from "@/lib/e2e/env";
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
      // report optional until report:e2e run
    }
    return { batchId: latest.batchId, manifest, report };
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

  return NextResponse.json({
    allowed: true,
    liveEmis: false,
    autoRetrain: false,
    source: "AKSH_E2E_TEST",
    batch,
    commands: {
      seed: "E2E_TEST_MODE=true npm run seed:e2e -- --apply",
      cleanup: "npm run cleanup:e2e -- --apply",
      report: "npm run report:e2e",
      stage12: "npm run test:e2e:platform-stage12",
      allStages: "npm run test:e2e:platform-all-stages",
      tests: "npm run test:e2e:platform",
    },
  });
}
