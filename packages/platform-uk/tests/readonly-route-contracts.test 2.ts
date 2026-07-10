import assert from "node:assert/strict";
import { unlink } from "node:fs/promises";
import path from "node:path";

import { buildBenchmarkEvidencePayload } from "../lib/benchmark-evidence";
import { readBenchmarkSignoffState } from "../lib/benchmark-signoff-repository";
import { readFeedbackState } from "../lib/feedback-repository";
import { buildEvidenceReadinessPayload } from "../lib/readiness-evidence";
import { buildResearchEvaluationArtifact } from "../lib/research-evaluation-plan";
import { readReviewCaseById, readReviewCases } from "../lib/review-case-repository";
import { reviewCases } from "../lib/mock-data";
import { buildDatabaseAdapterContract } from "../lib/system-contracts";
import { buildEvidencePayload } from "../lib/workflow";
import { writeReviewCases } from "../lib/review-case-repository";

async function cleanupJsonFile(fileName: string) {
  try {
    await unlink(path.join(process.cwd(), "data", fileName));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

async function run() {
  const research = buildResearchEvaluationArtifact({ generatedBy: "route-contract@akshhealth.com" }) as Record<string, any>;

  assert.equal(research.artifactType, "aksh-uk-eu-research-evaluation-boundary");
  assert.equal(research.generatedBy, "route-contract@akshhealth.com");
  assert.equal(research.syntheticOnly, true);
  assert.equal(research.realPatientData, false);
  assert.equal(research.liveModelDeployment, false);
  assert.equal(research.productionClinicalAiClaim, false);
  assert.ok(Array.isArray(research.tasks), "Research endpoint should return task contracts");
  assert.ok(
    research.tasks.some(
      (task) =>
        typeof task === "object" &&
        task !== null &&
        "id" in task &&
        task.id === "clinical-model-training" &&
        "stage" in task &&
        task.stage === "not_allowed_yet"
    ),
    "Research endpoint should block clinical model training for now"
  );

  const database = {
    ...buildDatabaseAdapterContract(),
    generatedBy: "route-contract@akshhealth.com",
    generatedAt: new Date().toISOString()
  } as Record<string, any>;

  assert.equal(database.artifactType, "aksh-uk-eu-database-adapter-contract");
  assert.equal(database.generatedBy, "route-contract@akshhealth.com");
  assert.equal(database.syntheticOnly, true);
  assert.equal(database.realPatientData, false);
  assert.equal(database.productionDatabaseConfigured, false);
  assert.equal(database.activeAdapter, "json_file_repository");
  assert.equal(database.defaultSourceOfTruth, "json_file_repository");
  assert.equal(database.migrationStatus, "contract_defined_json_active_database_planned");
  assert.equal(Number.isNaN(Date.parse(String(database.generatedAt))), false, "Database contract should include a generatedAt timestamp");
  assert.ok(Array.isArray(database.adapters), "Database endpoint should return adapter contracts");
  assert.ok(
    database.adapters.some(
      (adapter) =>
        typeof adapter === "object" &&
        adapter !== null &&
        "id" in adapter &&
        adapter.id === "json_file_repository" &&
        "status" in adapter &&
        adapter.status === "active" &&
        "sourceOfTruth" in adapter &&
        adapter.sourceOfTruth === true
    ),
    "Database endpoint should keep JSON as the active source of truth"
  );
  assert.ok(
    database.adapters.some(
      (adapter) =>
        typeof adapter === "object" &&
        adapter !== null &&
        "id" in adapter &&
        adapter.id === "planned_database_repository" &&
        "enabled" in adapter &&
        adapter.enabled === false
    ),
    "Database endpoint should keep the future database adapter disabled"
  );
  assert.ok(Array.isArray(database.repositoryInterface), "Database endpoint should expose repository parity operations");
  assert.ok(Array.isArray(database.requiredParityChecks), "Database endpoint should expose required repository parity checks");
  assert.ok(
    database.repositoryInterface.some(
      (operation) =>
        typeof operation === "object" &&
        operation !== null &&
        "operation" in operation &&
        operation.operation === "updateReviewCase"
    ),
    "Database endpoint should require updateReviewCase parity before migration"
  );
  assert.ok(
    database.requiredParityChecks.some(
      (check) =>
        typeof check === "object" &&
        check !== null &&
        "id" in check &&
        check.id === "update_persists_review_state"
    ),
    "Database endpoint should require persisted review-state parity before migration"
  );

  const persistedScope = `route_contract_persisted_${Date.now()}`;
  const acceptedCase = structuredClone(reviewCases.find((item) => item.id === "case-005"));
  assert.ok(acceptedCase, "Expected accepted fixture case-005 to exist");
  acceptedCase.userId = persistedScope;

  try {
    await writeReviewCases([acceptedCase], persistedScope);
    const userId = persistedScope;

    const persistedCase = await readReviewCaseById(acceptedCase.id, persistedScope, userId);
    assert.ok(persistedCase, "Persisted accepted case should be readable from the scoped repository");
    const caseExport = buildEvidencePayload(persistedCase) as Record<string, any>;
    assert.equal(caseExport.caseId, acceptedCase.id);
    assert.equal(caseExport.syntheticOnly, true);
    assert.equal(caseExport.artifactState, "frozen");
    assert.equal(caseExport.finalizationState, "ready");
    assert.ok(
      typeof caseExport.exportedResources === "object" &&
        caseExport.exportedResources !== null &&
        "integrationMode" in caseExport.exportedResources &&
        caseExport.exportedResources.integrationMode === "synthetic_evidence",
      "Case export route should return persisted synthetic evidence, not live integration output"
    );

    const missingCase = await readReviewCaseById("missing-case", persistedScope, userId);
    assert.equal(missingCase, null, "Scoped repository should return null for missing persisted cases");

    const scopedCases = await readReviewCases(persistedScope);
    const signoffState = await readBenchmarkSignoffState(persistedScope, userId);
    const benchmark = {
      ...buildBenchmarkEvidencePayload(scopedCases),
      signoff: signoffState.archive[0] ?? null
    } as Record<string, any>;
    assert.equal(benchmark.artifactType, "aksh-uk-eu-clinical-benchmark-evidence");
    assert.equal(benchmark.syntheticOnly, true);
    assert.equal(benchmark.signoff, null);
    assert.ok(
      typeof benchmark.summary === "object" &&
        benchmark.summary !== null &&
        "benchmarkedCases" in benchmark.summary &&
        Number(benchmark.summary.benchmarkedCases) > 0,
      "Benchmark evidence route should return benchmarked scenario totals"
    );
    assert.ok(
      typeof benchmark.benchmark === "object" &&
        benchmark.benchmark !== null &&
        "total" in benchmark.benchmark &&
        typeof benchmark.summary === "object" &&
        benchmark.summary !== null &&
        "benchmarkedCases" in benchmark.summary &&
        benchmark.benchmark.total === benchmark.summary.benchmarkedCases,
      "Benchmark evidence route should keep benchmark and summary totals aligned"
    );

    const feedbackState = await readFeedbackState(persistedScope, userId);
    const readiness = buildEvidenceReadinessPayload(scopedCases, feedbackState.archive, signoffState.archive[0]) as Record<string, any>;
    assert.equal(readiness.artifactType, "aksh-uk-eu-evidence-readiness");
    assert.equal(readiness.syntheticOnly, true);
    assert.ok(
      typeof readiness.gate === "object" &&
        readiness.gate !== null &&
        "status" in readiness.gate &&
        readiness.gate.status === "blocked",
      "Readiness evidence route should block when benchmark sign-off is not present"
    );
  } finally {
    await cleanupJsonFile(`review-cases.${persistedScope}.json`);
    await cleanupJsonFile(`benchmark-signoffs.${persistedScope}.json`);
    await cleanupJsonFile(`feedback-state.${persistedScope}.json`);
  }
}

run()
  .then(() => {
    console.log("Read-only route contract checks passed.");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
