import { buildBenchmarkEvidencePayload } from "@/lib/benchmark-evidence";
import { deriveDashboardSummary } from "@/lib/dashboard-summary";
import { reviewCases } from "@/lib/mock-data";
import { buildEvidenceReadinessPayload } from "@/lib/readiness-evidence";
import { UserDashboards } from "@/components/product/user-dashboards";

export default function DashboardsPage() {
  const clinical = deriveDashboardSummary(reviewCases, [], "clinical_reviewer");
  const operations = deriveDashboardSummary(reviewCases, [], "operations_lead");
  const benchmark = buildBenchmarkEvidencePayload(reviewCases, { generatedBy: "Product dashboard" });
  const readiness = buildEvidenceReadinessPayload(reviewCases, [], undefined, { generatedBy: "Product dashboard" });

  return (
    <UserDashboards
      clinical={clinical}
      operations={operations}
      evidence={{
        benchmarkTotal: benchmark.summary.benchmarkedCases,
        benchmarkPassed: benchmark.summary.passedCases,
        benchmarkFailed: benchmark.summary.failedCases,
        readinessStatus: readiness.gate.status,
        readinessLabel: readiness.gate.label,
        openActions: benchmark.summary.openBenchmarkActions,
        syntheticOnly: readiness.syntheticOnly
      }}
    />
  );
}
