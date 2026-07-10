import { readFile } from "node:fs/promises";
import path from "node:path";

import { deriveAuditIntegrityReport } from "../lib/audit-integrity";

const dataDir = path.join(process.cwd(), "data");
const scopeKey = process.env.AKSH_DATA_SCOPE ?? "shared";
const jsonMode = process.argv.includes("--json");

function resolveReviewCasesFile(scope: string) {
  return scope === "shared"
    ? path.join(dataDir, "review-cases.json")
    : path.join(dataDir, `review-cases.${scope}.json`);
}

async function run() {
  const reviewCasesPath = resolveReviewCasesFile(scopeKey);
  const raw = await readFile(reviewCasesPath, "utf8");
  const cases = JSON.parse(raw) as Parameters<typeof deriveAuditIntegrityReport>[0];
  const report = deriveAuditIntegrityReport(cases, {
    scopeKey,
    generatedAt: new Date().toISOString()
  });

  if (jsonMode) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.status === "fail" ? 1 : 0);
    return;
  }

  console.log(`Audit integrity report for scope "${scopeKey}"`);
  console.log(`Status: ${report.status}`);
  console.log(`Cases checked: ${report.summary.casesChecked}`);
  console.log(`Issues: ${report.summary.issueCount} (${report.summary.errorCount} errors, ${report.summary.warningCount} warnings)`);

  for (const check of report.checks) {
    console.log(`- ${check.label}: ${check.status} — ${check.detail}`);
  }

  if (report.issues.length) {
    console.log("");
    console.log("Issues");
    for (const issue of report.issues.slice(0, 20)) {
      console.log(`- [${issue.severity}] ${issue.caseId}: ${issue.detail}`);
    }
    if (report.issues.length > 20) {
      console.log(`... ${report.issues.length - 20} more issue(s)`);
    }
  }

  process.exit(report.status === "fail" ? 1 : 0);
}

void run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
