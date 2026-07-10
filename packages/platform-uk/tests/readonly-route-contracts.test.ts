import assert from "node:assert/strict";
import { unlink } from "node:fs/promises";
import path from "node:path";

import { GET as getBenchmarkEvidence } from "../app/api/benchmarks/evidence/route";
import { GET as getBoardPackEvidence } from "../app/api/evidence/board-pack/route";
import { GET as getReadinessEvidence } from "../app/api/readiness/evidence/route";
import { GET as getResearchEvaluation } from "../app/api/research/evaluation/route";
import { GET as getCaseDossierExport } from "../app/api/review-cases/[id]/dossier/route";
import { GET as getCaseEvidenceExport } from "../app/api/review-cases/[id]/export/route";
import { GET as getAuditIntegrity } from "../app/api/system/audit-integrity/route";
import { GET as getClinicalSafetyFiles } from "../app/api/system/clinical-safety-files/route";
import { GET as getIntegrationContract } from "../app/api/system/integration-contract/route";
import { GET as getPermissionMatrix } from "../app/api/system/permission-matrix/route";
import { GET as getDatabaseContract } from "../app/api/system/database-contract/route";
import { reviewCases } from "../lib/mock-data";
import { EVIDENCE_ARTIFACT_SCHEMA_VERSION } from "../lib/evidence-artifact-metadata";
import { writeReviewCases } from "../lib/review-case-repository";

const routeUserId = `route_contract_${Date.now()}`;
const routeUserEmail = "route-contract@akshhealth.com";

async function cleanupJsonFile(fileName: string) {
  try {
    await unlink(path.join(process.cwd(), "data", fileName));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

function buildRouteRequest(pathname: string, userId = routeUserId) {
  return new Request(`http://localhost:3000${pathname}`, {
    headers: {
      "x-user-id": userId,
      "x-user-email": routeUserEmail,
      "x-user-role": "operations_lead"
    }
  });
}

async function assertJsonAttachment(response: Response, expectedFilename: string) {
  assert.equal(response.status, 200);
  assert.ok(
    response.headers.get("content-type")?.includes("application/json"),
    "Route handler should return an application/json response"
  );
  assert.equal(
    response.headers.get("content-disposition"),
    `attachment; filename="${expectedFilename}"`,
    "Route handler should return the expected evidence attachment filename"
  );
  assert.equal(response.headers.has("set-cookie"), false, "Read-only route contracts should not set pseudonymous cookies");
  return (await response.json()) as Record<string, any>;
}

async function run() {
  process.env.AKSH_TEST_AUTH_HEADER = "true";

  const research = await assertJsonAttachment(
    await getResearchEvaluation(buildRouteRequest("/api/research/evaluation")),
    "aksh-uk-eu-research-evaluation-boundary.json"
  );
  assert.equal(research.artifactType, "aksh-uk-eu-research-evaluation-boundary");
  assert.equal(research.generatedBy, routeUserEmail);
  assert.equal(research.syntheticOnly, true);
  assert.equal(research.realPatientData, false);
  assert.equal(research.liveModelDeployment, false);
  assert.equal(research.productionClinicalAiClaim, false);
  assert.ok(Array.isArray(research.tasks), "Research route should return task contracts");
  assert.ok(
    research.tasks.some((task) => task.id === "clinical-model-training" && task.stage === "not_allowed_yet"),
    "Research route should block clinical model training for now"
  );

  const database = await assertJsonAttachment(
    await getDatabaseContract(buildRouteRequest("/api/system/database-contract")),
    "aksh-uk-eu-database-adapter-contract.json"
  );
  assert.equal(database.artifactType, "aksh-uk-eu-database-adapter-contract");
  assert.equal(database.generatedBy, routeUserEmail);
  assert.equal(database.syntheticOnly, true);
  assert.equal(database.realPatientData, false);
  assert.equal(database.productionDatabaseConfigured, false);
  assert.equal(database.activeAdapter, "json_file_repository");
  assert.equal(database.defaultSourceOfTruth, "json_file_repository");
  assert.equal(database.migrationStatus, "contract_defined_json_active_database_planned");
  assert.equal(Number.isNaN(Date.parse(String(database.generatedAt))), false, "Database route should include a generatedAt timestamp");
  assert.ok(Array.isArray(database.repositoryInterface), "Database route should expose repository parity operations");
  assert.ok(
    database.requiredParityChecks.some((check: any) => check.id === "update_persists_review_state"),
    "Database route should require persisted review-state parity before migration"
  );

  const acceptedCase = structuredClone(reviewCases.find((item) => item.id === "case-005"));
  assert.ok(acceptedCase, "Expected accepted fixture case-005 to exist");
  acceptedCase.userId = routeUserId;

  try {
    await writeReviewCases([acceptedCase], routeUserId);

    const caseExport = await assertJsonAttachment(
      await getCaseEvidenceExport(buildRouteRequest(`/api/review-cases/${acceptedCase.id}/export`), {
        params: { id: acceptedCase.id }
      }),
      `${acceptedCase.id}-evidence.json`
    );
    assert.equal(caseExport.caseId, acceptedCase.id);
    assert.equal(caseExport.syntheticOnly, true);
    assert.equal(caseExport.artifactState, "frozen");
    assert.equal(caseExport.finalizationState, "ready");
    assert.equal(caseExport.exportedResources.integrationMode, "synthetic_evidence");

    const caseDossier = await assertJsonAttachment(
      await getCaseDossierExport(buildRouteRequest(`/api/review-cases/${acceptedCase.id}/dossier`), {
        params: { id: acceptedCase.id }
      }),
      `${acceptedCase.id}-validation-dossier.json`
    );
    assert.equal(caseDossier.artifactType, "aksh-uk-eu-case-validation-dossier");
    assert.equal(caseDossier.artifactSchemaVersion, EVIDENCE_ARTIFACT_SCHEMA_VERSION);
    assert.equal(caseDossier.caseId, acceptedCase.id);
    assert.equal(caseDossier.evidence.artifactState, "frozen");
    assert.ok(Array.isArray(caseDossier.sourceTrace), "Case dossier route should include source trace");
    assert.ok(caseDossier.validationProtocol, "Case dossier route should include validation protocol");
    assert.equal(caseDossier.reviewDecision.lastDecision, "accept");

    const missingCase = await getCaseEvidenceExport(buildRouteRequest("/api/review-cases/missing-case/export"), {
      params: { id: "missing-case" }
    });
    assert.equal(missingCase.status, 404, "Case export route should return 404 for missing persisted cases");

    const benchmark = await assertJsonAttachment(
      await getBenchmarkEvidence(buildRouteRequest("/api/benchmarks/evidence")),
      "aksh-uk-eu-benchmark-evidence.json"
    );
    assert.equal(benchmark.artifactType, "aksh-uk-eu-clinical-benchmark-evidence");
    assert.equal(benchmark.artifactSchemaVersion, EVIDENCE_ARTIFACT_SCHEMA_VERSION);
    assert.equal(benchmark.syntheticOnly, true);
    assert.equal(benchmark.signoff, null);
    assert.ok(Number(benchmark.summary.benchmarkedCases) > 0, "Benchmark route should return benchmarked scenario totals");
    assert.equal(
      benchmark.benchmark.total,
      benchmark.summary.benchmarkedCases,
      "Benchmark route should keep benchmark and summary totals aligned"
    );

    const readiness = await assertJsonAttachment(
      await getReadinessEvidence(buildRouteRequest("/api/readiness/evidence")),
      "aksh-uk-eu-evidence-readiness.json"
    );
    assert.equal(readiness.artifactType, "aksh-uk-eu-evidence-readiness");
    assert.equal(readiness.artifactSchemaVersion, EVIDENCE_ARTIFACT_SCHEMA_VERSION);
    assert.equal(readiness.syntheticOnly, true);
    assert.equal(
      readiness.gate.status,
      "blocked",
      "Readiness route should block when benchmark sign-off is not present"
    );

    const boardPack = await assertJsonAttachment(
      await getBoardPackEvidence(buildRouteRequest("/api/evidence/board-pack")),
      "aksh-uk-eu-board-pack-evidence.json"
    );
    assert.equal(boardPack.artifactType, "aksh-uk-eu-board-pack-evidence");
    assert.equal(boardPack.artifactSchemaVersion, EVIDENCE_ARTIFACT_SCHEMA_VERSION);
    assert.equal(boardPack.benchmark.artifactType, "aksh-uk-eu-clinical-benchmark-evidence");
    assert.equal(boardPack.readiness.artifactType, "aksh-uk-eu-evidence-readiness");
    assert.ok(Array.isArray(boardPack.knownLimitations), "Board pack route should include known limitations");

    const permissionMatrix = await assertJsonAttachment(
      await getPermissionMatrix(buildRouteRequest("/api/system/permission-matrix")),
      "aksh-uk-eu-role-permission-matrix.json"
    );
    assert.equal(permissionMatrix.artifactType, "aksh-uk-eu-role-permission-matrix");
    assert.equal(permissionMatrix.productionRbacEnforced, false);

    const auditIntegrity = await assertJsonAttachment(
      await getAuditIntegrity(buildRouteRequest("/api/system/audit-integrity")),
      `aksh-uk-eu-audit-integrity-${routeUserId}.json`
    );
    assert.equal(auditIntegrity.artifactType, "aksh-uk-eu-audit-integrity-report");
    assert.ok(Array.isArray(auditIntegrity.checks), "Audit integrity route should return structured checks");

    const safetyFiles = await assertJsonAttachment(
      await getClinicalSafetyFiles(buildRouteRequest("/api/system/clinical-safety-files")),
      "aksh-uk-eu-clinical-safety-file-placeholders.json"
    );
    assert.equal(safetyFiles.artifactType, "aksh-uk-eu-clinical-safety-file-placeholders");
    assert.equal(safetyFiles.dcb0129SignedOff, false);

    const integrationContract = await assertJsonAttachment(
      await getIntegrationContract(buildRouteRequest("/api/system/integration-contract")),
      "aksh-uk-eu-integration-boundary-contract.json"
    );
    assert.equal(integrationContract.artifactType, "aksh-uk-eu-integration-boundary-contract");
    assert.equal(integrationContract.activeFlags.fastApiSynthesis, false);
    assert.ok(Array.isArray(integrationContract.rehearsalRules));
  } finally {
    await cleanupJsonFile(`review-cases.${routeUserId}.json`);
    await cleanupJsonFile(`benchmark-signoffs.${routeUserId}.json`);
    await cleanupJsonFile(`feedback-state.${routeUserId}.json`);
    delete process.env.AKSH_TEST_AUTH_HEADER;
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
