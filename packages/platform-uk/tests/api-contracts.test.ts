import assert from "node:assert/strict";
import { unlink } from "node:fs/promises";
import path from "node:path";

import { buildBenchmarkEvidencePayload } from "../lib/benchmark-evidence";
import { buildBoardPackEvidencePayload } from "../lib/board-pack-evidence";
import { deriveAuditIntegrityReport } from "../lib/audit-integrity";
import { buildIntegrationBoundaryContract } from "../lib/integration-boundary-contract";
import { validateFastApiSynthesisResponse } from "../lib/fastapi-synthesis";
import { buildCaseValidationDossierPayload } from "../lib/case-dossier-evidence";
import { buildClinicalSafetyFilesArtifact } from "../lib/clinical-safety-files";
import { readBenchmarkSignoffState, updateBenchmarkSignoffDraft } from "../lib/benchmark-signoff-repository";
import { saveBenchmarkSignoffWithReadinessSnapshot } from "../lib/benchmark-signoff-workflow";
import { buildCommandCentreStatePayload } from "../lib/command-centre-evidence";
import type { DashboardSummary } from "../lib/dashboard-summary";
import { buildEvidenceArtifactRegistry } from "../lib/evidence-artifact-registry";
import { EVIDENCE_ARTIFACT_SCHEMA_VERSION } from "../lib/evidence-artifact-metadata";
import { buildEvidenceReadinessPayload } from "../lib/readiness-evidence";
import { buildRolePermissionMatrix } from "../lib/permission-matrix";
import { readEvidenceReadinessHistory } from "../lib/readiness-history-repository";
import { buildResearchEvaluationArtifact } from "../lib/research-evaluation-plan";
import {
  getIntegrationAdapterRegistry,
  isFastApiSynthesisEnabled,
  isMedplumSyncEnabled,
  shouldSyncAcceptedCaseToMedplum
} from "../lib/integration-config";
import { reviewCases } from "../lib/mock-data";
import {
  deriveM1DueDateHealth,
  deriveM1GeneratedActions,
  getNextThirtyDayItems,
  mergeRoadmapWithTracker,
  summarizeM1ActionResolutions,
  summarizeM1Checklist,
  summarizeTrackerState
} from "../lib/roadmap";
import { buildM1ActionInboxEvidencePayload, buildM1EvidencePackPayload, buildRoadmapEvidencePayload } from "../lib/roadmap-evidence";
import { readRoadmapState, resetRoadmapState, resolveM1GeneratedAction, updateM1ChecklistItem, updateRoadmapItem } from "../lib/roadmap-repository";
import {
  getConfiguredReviewCaseRepositoryAdapterId,
  readReviewCaseById,
  updateReviewCase,
  writeReviewCases
} from "../lib/review-case-repository";
import {
  buildDatabaseAdapterContract,
  buildOwnSystemBoundaryContract,
  getDatabaseBoundaryPlan,
  getOwnSystemInterfaceContracts
} from "../lib/system-contracts";
import type { BenchmarkSignoffEntry } from "../lib/benchmark-signoff-types";
import { resolveAuthenticatedUserScopeFromSession } from "../lib/user-scope";
import {
  buildEvidencePayload,
  createFrozenArtifact,
  normalizeReviewCaseForPersistence
} from "../lib/workflow";

async function run() {
  assert.equal(
    resolveAuthenticatedUserScopeFromSession(null),
    null,
    "Authenticated API scope should not resolve without a signed-in session"
  );
  assert.deepEqual(
    resolveAuthenticatedUserScopeFromSession({
      user: {
        id: "user-001",
        email: "doctor@akshhealth.com",
        role: "gp"
      }
    }),
    {
      scopeKey: "user-001",
      userId: "user-001",
      userEmail: "doctor@akshhealth.com",
      userRole: "clinical_reviewer",
      clinicalPersona: "gp",
      boundPatientId: null
    },
    "Authenticated API scope should bind workflow storage to the signed-in user"
  );

  const previousMedplumFlag = process.env.ENABLE_MEDPLUM_SYNC;
  const previousFastApiFlag = process.env.ENABLE_FASTAPI_SYNTHESIS;
  delete process.env.ENABLE_MEDPLUM_SYNC;
  delete process.env.ENABLE_FASTAPI_SYNTHESIS;

  const benchmarkEvidence = buildBenchmarkEvidencePayload(reviewCases, {
    generatedAt: "2026-04-26 12:00",
    generatedBy: "API Contract Test"
  });

  assert.equal(benchmarkEvidence.artifactType, "aksh-uk-eu-clinical-benchmark-evidence");
  assert.equal(benchmarkEvidence.artifactSchemaVersion, EVIDENCE_ARTIFACT_SCHEMA_VERSION);
  assert.equal(benchmarkEvidence.syntheticOnly, true);
  assert.equal(benchmarkEvidence.generatedBy, "API Contract Test");
  assert.equal(benchmarkEvidence.summary.benchmarkedCases, benchmarkEvidence.benchmark.total);
  assert.equal(benchmarkEvidence.summary.openBenchmarkActions, benchmarkEvidence.actionQueue.total);
  assert.ok(benchmarkEvidence.runbook.steps.length > 0, "Benchmark evidence export should include runbook steps");

  const acceptedSignoff: BenchmarkSignoffEntry = {
    id: "contract-signoff",
    userId: "api-contract-user",
    reviewerName: "Clinical Safety Lead",
    decision: "accepted_for_internal_evidence",
    followUpOwner: "",
    dueDate: "",
    notes: "Synthetic benchmark evidence accepted for internal proof review.",
    signedAt: "2026-04-26 12:10",
    generatedAt: "2026-04-26 12:10",
    benchmarkedCases: benchmarkEvidence.summary.benchmarkedCases,
    passedCases: benchmarkEvidence.summary.passedCases,
    failedCases: benchmarkEvidence.summary.failedCases,
    openBenchmarkActions: benchmarkEvidence.summary.openBenchmarkActions,
    resolvedBenchmarkActions: benchmarkEvidence.summary.resolvedBenchmarkActions
  };
  const readinessEvidence = buildEvidenceReadinessPayload(reviewCases, [], acceptedSignoff, {
    generatedAt: "2026-04-26 12:15",
    generatedBy: "API Contract Test"
  });

  assert.equal(readinessEvidence.artifactType, "aksh-uk-eu-evidence-readiness");
  assert.equal(readinessEvidence.artifactSchemaVersion, EVIDENCE_ARTIFACT_SCHEMA_VERSION);
  assert.equal(readinessEvidence.syntheticOnly, true);
  assert.equal(readinessEvidence.gate.status, "ready");
  assert.equal(readinessEvidence.signoff?.id, acceptedSignoff.id);
  assert.equal(readinessEvidence.benchmarkSummary.total, benchmarkEvidence.summary.benchmarkedCases);
  assert.equal(readinessEvidence.actionSummary.openBenchmarkActions, benchmarkEvidence.summary.openBenchmarkActions);

  const readinessRouteScope = `readiness_contract_${Date.now()}`;
  const readinessRouteUserId = "readiness-contract-user";
  const readinessRouteCases = reviewCases.map((item) => ({ ...structuredClone(item), userId: readinessRouteUserId }));
  await writeReviewCases(readinessRouteCases, readinessRouteScope);

  const signoffRouteState = await saveBenchmarkSignoffWithReadinessSnapshot(
    {
      reviewerName: "Readiness Contract Reviewer",
      decision: "accepted_for_internal_evidence",
      notes: "Saving benchmark sign-off should also persist a readiness snapshot."
    },
    readinessRouteScope,
    readinessRouteUserId
  );
  assert.equal(signoffRouteState.archive.length, 1, "Benchmark sign-off workflow should save successfully");

  const readinessRouteHistory = await readEvidenceReadinessHistory(readinessRouteScope, readinessRouteUserId);
  assert.equal(
    readinessRouteHistory.archive.length,
    1,
    "Saving benchmark sign-off should append a readiness-history snapshot for the same scope"
  );
  assert.equal(
    readinessRouteHistory.archive[0]?.signoff?.decision,
    "accepted_for_internal_evidence",
    "Readiness snapshot should capture the saved benchmark sign-off decision"
  );

  const concurrentSignoffScope = `benchmark_concurrency_${Date.now()}`;
  const concurrentSignoffUserId = "benchmark-concurrency-user";
  const concurrentSignoffCases = reviewCases.map((item) => ({ ...structuredClone(item), userId: concurrentSignoffUserId }));
  await writeReviewCases(concurrentSignoffCases, concurrentSignoffScope);

  await Promise.all([
    updateBenchmarkSignoffDraft({ reviewerName: "Concurrent Reviewer" }, concurrentSignoffScope, concurrentSignoffUserId),
    updateBenchmarkSignoffDraft({ notes: "Concurrent autosave note." }, concurrentSignoffScope, concurrentSignoffUserId),
    saveBenchmarkSignoffWithReadinessSnapshot(
      {
        reviewerName: "Concurrent Reviewer",
        decision: "accepted_for_internal_evidence",
        notes: "Concurrent final save should keep the JSON store valid."
      },
      concurrentSignoffScope,
      concurrentSignoffUserId
    )
  ]);

  const concurrentSignoffState = await readBenchmarkSignoffState(concurrentSignoffScope, concurrentSignoffUserId);
  assert.equal(concurrentSignoffState.archive.length, 1, "Concurrent benchmark sign-off writes should keep a valid archived entry");
  assert.equal(
    concurrentSignoffState.archive[0]?.decision,
    "accepted_for_internal_evidence",
    "Concurrent benchmark sign-off writes should preserve the final decision"
  );

  const evidenceRegistry = buildEvidenceArtifactRegistry(reviewCases, {
    generatedAt: "2026-04-26 12:20",
    generatedBy: "API Contract Test"
  });
  assert.equal(evidenceRegistry.artifactType, "aksh-uk-eu-evidence-artifact-registry");
  assert.equal(evidenceRegistry.artifactSchemaVersion, EVIDENCE_ARTIFACT_SCHEMA_VERSION);
  assert.equal(evidenceRegistry.syntheticOnly, true);
  assert.equal(evidenceRegistry.productionClinicalSoftware, false);
  assert.equal(evidenceRegistry.liveNhsIntegration, false);
  assert.equal(evidenceRegistry.summary.totalArtifacts, reviewCases.length);
  assert.ok(
    evidenceRegistry.artifacts.every((artifact) => artifact.clinicalRuleSummary.total >= 0),
    "Evidence registry should include clinical rule summaries for every case artifact"
  );

  const dossierFixtureCase = reviewCases.find((item) => item.id === "case-005");
  assert.ok(dossierFixtureCase, "Expected accepted fixture case-005 to exist");
  const caseDossier = buildCaseValidationDossierPayload(dossierFixtureCase, reviewCases, {
    generatedAt: "2026-04-26 12:25",
    generatedBy: "API Contract Test"
  });
  assert.equal(caseDossier.artifactType, "aksh-uk-eu-case-validation-dossier");
  assert.equal(caseDossier.artifactSchemaVersion, EVIDENCE_ARTIFACT_SCHEMA_VERSION);
  assert.equal(caseDossier.caseId, dossierFixtureCase.id);
  assert.equal(caseDossier.evidence.artifactState, "frozen");
  assert.ok(caseDossier.sourceTrace.length > 0, "Case dossier should include source trace steps");
  assert.ok(caseDossier.validationProtocol.overallScore > 0, "Case dossier should include validation protocol scores");
  assert.equal(caseDossier.reviewDecision.lastDecision, "accept");
  assert.equal(caseDossier.benchmarkStatus, null, "Accepted case without expectedOutcome should report null benchmark status");
  assert.ok(caseDossier.knownLimitations.length > 0, "Case dossier should include known limitations");

  const boardPack = buildBoardPackEvidencePayload(reviewCases, [], acceptedSignoff, [], {
    generatedAt: "2026-04-26 12:30",
    generatedBy: "API Contract Test"
  });
  assert.equal(boardPack.artifactType, "aksh-uk-eu-board-pack-evidence");
  assert.equal(boardPack.artifactSchemaVersion, EVIDENCE_ARTIFACT_SCHEMA_VERSION);
  assert.equal(boardPack.benchmark.artifactType, "aksh-uk-eu-clinical-benchmark-evidence");
  assert.equal(boardPack.readiness.artifactType, "aksh-uk-eu-evidence-readiness");
  assert.equal(boardPack.boardPackSummary.readinessGateStatus, "ready");
  assert.equal(boardPack.signoff?.id, acceptedSignoff.id);
  assert.ok(boardPack.knownLimitations.length > 0, "Board pack should include known limitations");

  assert.equal(getConfiguredReviewCaseRepositoryAdapterId(), "json_file_repository");
  const databaseContract = buildDatabaseAdapterContract();
  assert.equal(databaseContract.adapterResolutionModule, "lib/storage/get-review-case-repository-adapter.ts");

  const permissionMatrix = buildRolePermissionMatrix({ generatedBy: "API Contract Test" });
  assert.equal(permissionMatrix.artifactType, "aksh-uk-eu-role-permission-matrix");
  assert.equal(permissionMatrix.productionRbacEnforced, false);
  assert.ok(
    permissionMatrix.matrix.some((entry) => entry.actionId === "demo_reset" && entry.operations_lead === "allowed"),
    "Operations lead should be allowed to reset demo data in the permission matrix"
  );

  const auditReport = deriveAuditIntegrityReport(reviewCases, { scopeKey: "shared" });
  assert.equal(auditReport.artifactType, "aksh-uk-eu-audit-integrity-report");
  assert.ok(auditReport.summary.casesChecked > 0, "Audit integrity report should check seeded cases");

  const safetyFiles = buildClinicalSafetyFilesArtifact();
  assert.equal(safetyFiles.artifactType, "aksh-uk-eu-clinical-safety-file-placeholders");
  assert.equal(safetyFiles.dcb0129SignedOff, false);
  assert.ok(safetyFiles.files.some((file) => file.id === "hazard-log"), "Safety file map should include hazard log placeholder");

  const integrationBoundary = buildIntegrationBoundaryContract({ generatedBy: "API Contract Test" });
  assert.equal(integrationBoundary.artifactType, "aksh-uk-eu-integration-boundary-contract");
  assert.equal(integrationBoundary.activeFlags.fastApiSynthesis, false);
  assert.ok(integrationBoundary.disabledByDefault.includes("ehr-connectors"));

  const invalidFastApi = validateFastApiSynthesisResponse({});
  assert.equal(invalidFastApi.ok, false, "Empty FastAPI payload should fail validation");

  const researchEvaluation = buildResearchEvaluationArtifact({
    generatedAt: "2026-05-03T09:00:00.000Z",
    generatedBy: "API Contract Test"
  });
  assert.equal(researchEvaluation.artifactType, "aksh-uk-eu-research-evaluation-boundary");
  assert.equal(researchEvaluation.syntheticOnly, true);
  assert.equal(researchEvaluation.realPatientData, false);
  assert.equal(researchEvaluation.liveModelDeployment, false);
  assert.equal(researchEvaluation.productionClinicalAiClaim, false);
  assert.equal(researchEvaluation.summary.totalTasks, researchEvaluation.tasks.length);
  assert.ok(
    researchEvaluation.tasks.some((task) => task.id === "clinical-model-training" && task.stage === "not_allowed_yet"),
    "Research evaluation artifact should block clinical model training for now"
  );

  const ownSystemBoundary = buildOwnSystemBoundaryContract();
  assert.equal(ownSystemBoundary.artifactType, "aksh-uk-eu-own-system-boundary-contract");
  assert.equal(ownSystemBoundary.syntheticOnly, true);
  assert.equal(ownSystemBoundary.realPatientData, false);
  assert.equal(ownSystemBoundary.liveNhsIntegration, false);
  assert.equal(ownSystemBoundary.productionClinicalSoftware, false);
  assert.equal(ownSystemBoundary.productionClinicalAi, false);
  assert.equal(ownSystemBoundary.productionDatabase, false);
  assert.equal(ownSystemBoundary.autonomousClinicalDecisioning, false);
  assert.equal(ownSystemBoundary.defaultSourceOfTruth, "json_file_repository");
  assert.equal(ownSystemBoundary.currentPersistence, "data/*.json scoped stores");
  assert.equal(ownSystemBoundary.plannedProductionAdapter, "planned_database_repository");
  assert.ok(ownSystemBoundary.blockedClaims.includes("Live NHS/EHR integration"));
  assert.ok(ownSystemBoundary.blockedClaims.includes("Real patient data handling"));
  assert.ok(ownSystemBoundary.blockedClaims.includes("Production clinical software"));
  assert.ok(
    ownSystemBoundary.requiredProofBoundaries.includes("FHIR-shaped exports are internal evidence artifacts, not writeback integration."),
    "Own-system boundary should prevent FHIR-shaped export from being described as live writeback"
  );
  assert.ok(
    ownSystemBoundary.interfaceContracts.some(
      (contract) => contract.id === "review-case-store" && contract.status === "available"
    ),
    "Own-system boundary should include the JSON-backed review case store"
  );
  // NHS/EHR adapters stay off; product modules may be explicitly flag-gated (e.g. ENABLE_DIABETES_MODULE in CI).
  const flagGatedProductAdapterIds = new Set([
    "diabetes-module",
    "llm-synthesis",
    "llm-guardian",
    "llm-oracle",
    "llm-dr-assist",
    "llm-equity",
  ]);
  assert.ok(
    ownSystemBoundary.externalAdapters.every(
      (adapter) => adapter.enabled === false || flagGatedProductAdapterIds.has(adapter.id)
    ),
    "Own-system boundary should keep NHS/EHR external adapters disabled by default"
  );

  const databaseBoundary = getDatabaseBoundaryPlan();
  assert.equal(databaseBoundary.currentAdapter, "json_file_repository");
  assert.equal(databaseBoundary.productionAdapter, "planned_database_repository");
  assert.ok(databaseBoundary.notYet.includes("No real patient data should be stored."));
  assert.ok(databaseBoundary.notYet.includes("No production database is configured."));

  const databaseAdapterContract = buildDatabaseAdapterContract();
  assert.equal(databaseAdapterContract.artifactType, "aksh-uk-eu-database-adapter-contract");
  assert.equal(databaseAdapterContract.syntheticOnly, true);
  assert.equal(databaseAdapterContract.realPatientData, false);
  assert.equal(databaseAdapterContract.productionDatabaseConfigured, false);
  assert.equal(databaseAdapterContract.activeAdapter, "json_file_repository");
  assert.equal(databaseAdapterContract.defaultSourceOfTruth, "json_file_repository");
  assert.equal(databaseAdapterContract.migrationStatus, "contract_defined_json_active_database_planned");
  assert.ok(
    databaseAdapterContract.adapters.some(
      (adapter) =>
        adapter.id === "json_file_repository" &&
        adapter.status === "active" &&
        adapter.enabled &&
        adapter.sourceOfTruth &&
        adapter.supports.includes("frozen_artifact_persistence")
    ),
    "Database adapter contract should keep JSON active and responsible for frozen artifacts"
  );
  assert.ok(
    databaseAdapterContract.adapters.some(
      (adapter) =>
        adapter.id === "planned_database_repository" &&
        adapter.status === "planned" &&
        !adapter.enabled &&
        !adapter.sourceOfTruth &&
        adapter.notYet.includes("No real patient dataset is allowed.")
    ),
    "Database adapter contract should keep the future database disabled and synthetic-safe"
  );
  assert.ok(
    databaseAdapterContract.repositoryInterface.some((operation) => operation.operation === "updateReviewCase"),
    "Database adapter contract should define repository operation parity before migration"
  );
  assert.ok(
    databaseAdapterContract.acceptanceCriteria.includes(
      "`json_file_repository` remains the default adapter until a database adapter passes parity tests."
    ),
    "Database adapter contract should block accidental database cutover"
  );

  const ownSystemInterfaces = getOwnSystemInterfaceContracts();
  assert.ok(
    ownSystemInterfaces.some((contract) => contract.id === "simulated-patient-registry" && contract.status === "available"),
    "Own-system interfaces should include simulated patient data for testing"
  );
  assert.ok(
    ownSystemInterfaces.some((contract) => contract.id === "external-ehr-adapters" && contract.status === "disabled"),
    "Own-system interfaces should keep external EHR adapters disabled"
  );

  const defaultAdapters = getIntegrationAdapterRegistry();
  assert.ok(
    defaultAdapters.some((adapter) => adapter.id === "fhir-export" && adapter.enabled === true),
    "FHIR-shaped evidence export can remain available because it is internal synthetic evidence"
  );
  assert.ok(
    defaultAdapters.some((adapter) => adapter.id === "medplum-sync" && adapter.enabled === false && adapter.status === "disabled"),
    "Medplum sync should be disabled by default"
  );
  assert.ok(
    defaultAdapters.some((adapter) => adapter.id === "fastapi-synthesis" && adapter.enabled === false && adapter.status === "disabled"),
    "FastAPI synthesis should be disabled by default"
  );
  assert.ok(
    defaultAdapters.some((adapter) => adapter.id === "ehr-connectors" && adapter.enabled === false && adapter.status === "planned"),
    "Live EHR connectors should stay planned placeholders"
  );

  const scopeKey = `api_contract_${Date.now()}`;
  const userId = "api-contract-user";
  const existingCase = structuredClone(reviewCases.find((item) => item.id === "case-001"));
  assert.ok(existingCase, "Expected contract fixture case-001 to exist");
  existingCase.userId = userId;

  await writeReviewCases([existingCase], scopeKey);

  const acceptedCase = structuredClone(existingCase);
  acceptedCase.status = "accepted";
  acceptedCase.reviewSummary = {
    ...acceptedCase.reviewSummary,
    lastDecision: "accept",
    lastDecisionAt: "2026-04-26 12:30",
    lastReviewer: "API Contract Reviewer",
    overrideReason: ""
  };
  acceptedCase.frozenArtifact = createFrozenArtifact(acceptedCase, {
    frozenAt: "2026-04-26 12:30",
    frozenBy: "API Contract Reviewer"
  });

  const normalizedAcceptedCase = normalizeReviewCaseForPersistence(acceptedCase);
  normalizedAcceptedCase.userId = userId;
  const persisted = await updateReviewCase(normalizedAcceptedCase, scopeKey, userId);
  const reloaded = await readReviewCaseById(existingCase.id, scopeKey, userId);
  assert.ok(reloaded, "Accepted contract case should reload from JSON persistence");
  assert.equal(reloaded.status, "accepted");
  assert.equal(reloaded.frozenArtifact?.frozenBy, "API Contract Reviewer");

  const persistedEvidence = buildEvidencePayload(persisted);
  assert.equal(persistedEvidence.artifactState, "frozen");
  assert.equal(persistedEvidence.syntheticOnly, true);
  assert.equal(persistedEvidence.reviewSummary.lastDecision, "accept");
  assert.equal(persistedEvidence.exportedResources.resourceType, "Bundle");
  assert.equal(persistedEvidence.exportedResources.syntheticOnly, true);
  assert.equal(persistedEvidence.exportedResources.integrationMode, "synthetic_evidence");
  assert.equal(persistedEvidence.exportedResources.summary.syntheticLabel, "Synthetic-only UK/EU proof artifact");
  assert.ok(
    persistedEvidence.exportedResources.summary.resourceValidation.length >= 2,
    "Evidence export should include per-resource validation summaries"
  );

  assert.equal(isMedplumSyncEnabled(), false, "Medplum sync should remain disabled by default");
  assert.equal(
    shouldSyncAcceptedCaseToMedplum(existingCase, acceptedCase, persisted),
    false,
    "Accepting a case must not trigger Medplum sync unless ENABLE_MEDPLUM_SYNC=true"
  );
  assert.equal(
    shouldSyncAcceptedCaseToMedplum(existingCase, { ...acceptedCase, status: "pending_review" }, persisted),
    false,
    "Non-accepted payloads must not trigger external sync"
  );
  assert.equal(
    shouldSyncAcceptedCaseToMedplum({ ...existingCase, status: "accepted" }, acceptedCase, persisted),
    false,
    "Already accepted cases must not trigger duplicate external sync"
  );
  assert.equal(
    shouldSyncAcceptedCaseToMedplum(existingCase, acceptedCase, { ...persisted, frozenArtifact: undefined }),
    false,
    "Cases without a frozen export artifact must not trigger external sync"
  );

  process.env.ENABLE_MEDPLUM_SYNC = "true";
  assert.equal(
    shouldSyncAcceptedCaseToMedplum(existingCase, acceptedCase, persisted),
    true,
    "Medplum sync should only become eligible when the explicit flag is enabled and the accepted case is newly frozen"
  );
  process.env.ENABLE_FASTAPI_SYNTHESIS = "true";
  assert.equal(isFastApiSynthesisEnabled(), true, "FastAPI synthesis should only enable behind its explicit environment flag");
  delete process.env.ENABLE_MEDPLUM_SYNC;
  delete process.env.ENABLE_FASTAPI_SYNTHESIS;

  const roadmapScopeKey = `roadmap_contract_${Date.now()}`;
  const roadmapUserId = "roadmap-contract-user";
  const initialRoadmapState = await readRoadmapState(roadmapScopeKey, roadmapUserId);
  assert.equal(initialRoadmapState.items.length, 12, "Roadmap tracker should seed all 12 monthly phases");
  assert.equal(initialRoadmapState.m1Checklist.length, 8, "M1 checklist should seed immediate execution blockers");
  assert.equal(initialRoadmapState.history.length, 0, "Roadmap tracker should start with an empty audit history");

  const updatedRoadmapState = await updateRoadmapItem(
    "1A",
    {
      owner: "Contract CTO",
      dueDate: "2026-04-30",
      buildStatus: "blocked",
      risk: "critical",
      evidenceLink: "/review/roadmap",
      notes: "Contract test update"
    },
    roadmapScopeKey,
    roadmapUserId
  );
  const updatedPhase = updatedRoadmapState.items.find((item) => item.id === "1A");
  assert.equal(updatedPhase?.owner, "Contract CTO");
  assert.equal(updatedPhase?.buildStatus, "blocked");
  assert.equal(updatedPhase?.risk, "critical");
  assert.equal(updatedRoadmapState.history.length, 1, "Roadmap update should append one audit event");
  assert.equal(updatedRoadmapState.history[0].itemId, "1A");
  assert.ok(updatedRoadmapState.history[0].changes.some((change) => change.field === "owner"));
  assert.ok(updatedRoadmapState.history[0].changes.some((change) => change.field === "buildStatus"));

  const updatedChecklistState = await updateM1ChecklistItem(
    "m1-emis-application",
    {
      owner: "Contract CTO",
      buildStatus: "partial",
      risk: "critical",
      evidenceLink: "/review/roadmap/report",
      notes: "Application draft ready for contract test"
    },
    roadmapScopeKey,
    roadmapUserId
  );
  const updatedChecklistItem = updatedChecklistState.m1Checklist.find((item) => item.id === "m1-emis-application");
  assert.equal(updatedChecklistItem?.owner, "Contract CTO");
  assert.equal(updatedChecklistItem?.buildStatus, "partial");
  assert.equal(updatedChecklistState.history.length, 2, "M1 checklist update should append an audit event");
  assert.equal(updatedChecklistState.history[0].itemId, "m1-emis-application");

  const trackerSummary = summarizeTrackerState(updatedRoadmapState.items);
  assert.equal(trackerSummary.total, 12);
  assert.ok(trackerSummary.blocked >= 1, "Updated roadmap state should count blocked items");
  const m1Summary = summarizeM1Checklist(updatedChecklistState.m1Checklist);
  assert.equal(m1Summary.total, 8);
  assert.ok(m1Summary.critical >= 4, "M1 checklist should preserve critical blocker visibility");
  const m1DueDateHealth = deriveM1DueDateHealth(updatedChecklistState.m1Checklist, new Date("2026-04-30T00:00:00Z"));
  assert.equal(m1DueDateHealth.counts.total, 8);
  assert.ok(m1DueDateHealth.counts.overdue >= 1, "M1 checklist should flag overdue work");
  assert.ok(m1DueDateHealth.counts.waiting_on_evidence >= 1, "M1 checklist should flag missing evidence links");
  const m1GeneratedActions = deriveM1GeneratedActions(updatedChecklistState.m1Checklist, new Date("2026-04-30T00:00:00Z"));
  assert.ok(m1GeneratedActions.length >= 1, "M1 checklist should generate owner follow-up actions");
  assert.ok(
    m1GeneratedActions.some((action) => action.reason === "waiting_on_evidence" || action.reason === "overdue"),
    "Generated actions should explain missing evidence or overdue work"
  );
  const actionToResolve = m1GeneratedActions[0];
  const actionResolvedState = await resolveM1GeneratedAction(
    {
      actionId: actionToResolve.id,
      itemId: actionToResolve.itemId,
      owner: actionToResolve.owner,
      status: "accepted",
      note: "Contract test owner accepted this follow-up."
    },
    roadmapScopeKey,
    roadmapUserId
  );
  const m1ActionResolutionSummary = summarizeM1ActionResolutions(m1GeneratedActions, actionResolvedState.m1ActionResolutions);
  assert.equal(m1ActionResolutionSummary.resolved, 1);
  assert.equal(m1ActionResolutionSummary.accepted, 1);
  const actionFollowThroughState = await resolveM1GeneratedAction(
    {
      actionId: actionToResolve.id,
      itemId: actionToResolve.itemId,
      owner: actionToResolve.owner,
      status: "accepted",
      note: "Contract test owner accepted this follow-up.",
      nextStep: "Confirm owner follow-through in the M1 board.",
      targetDate: "2026-05-03",
      blockedReason: "",
      followThroughEvidenceLink: "/review/roadmap/follow-through"
    },
    roadmapScopeKey,
    roadmapUserId
  );

  const mergedRoadmap = mergeRoadmapWithTracker(updatedRoadmapState.items);
  assert.equal(mergedRoadmap.length, 12);
  assert.equal(mergedRoadmap.find((item) => item.phase === "1A")?.tracker?.owner, "Contract CTO");

  const nextThirtyDays = getNextThirtyDayItems(updatedRoadmapState.items, new Date("2026-04-29T00:00:00Z"));
  assert.ok(nextThirtyDays.some((item) => item.phase === "1A"), "M1 should appear in the next-30-day operating view");

  const roadmapEvidence = buildRoadmapEvidencePayload(actionFollowThroughState, {
    generatedAt: "2026-04-29 21:00",
    generatedBy: "API Contract Test"
  });
  assert.equal(roadmapEvidence.artifactType, "aksh-uk-eu-12-month-roadmap-evidence");
  assert.equal(roadmapEvidence.syntheticOnly, true);
  assert.equal(roadmapEvidence.productionClinicalSoftware, false);
  assert.equal(roadmapEvidence.liveNhsIntegration, false);
  assert.equal(roadmapEvidence.summary.totalItems, 12);
  assert.equal(roadmapEvidence.summary.historyEvents, 4);
  assert.equal(roadmapEvidence.history.recent[0].itemId, actionToResolve.itemId);
  assert.equal(roadmapEvidence.summary.m1ChecklistItems, 8);
  assert.ok(roadmapEvidence.summary.m1OwnersWithOpenItems >= 4);
  assert.ok(roadmapEvidence.summary.m1OverdueItems >= 1);
  assert.ok(roadmapEvidence.summary.m1WaitingOnEvidenceItems >= 1);
  assert.ok(roadmapEvidence.summary.m1GeneratedActions >= 1);
  assert.ok(roadmapEvidence.summary.m1ActiveGeneratedActions >= 1);
  assert.equal(roadmapEvidence.summary.m1ResolvedGeneratedActions, 1);
  assert.ok(roadmapEvidence.m1Checklist.ownerFollowUps.some((owner) => owner.owner === "CEO"));
  assert.equal(roadmapEvidence.m1Checklist.dueDateHealth.rows.length, 8);
  assert.ok(roadmapEvidence.m1Checklist.generatedActions.length >= 1);
  assert.equal(roadmapEvidence.m1Checklist.actionResolutionSummary.accepted, 1);
  assert.equal(roadmapEvidence.m1Checklist.actionResolutions.length, 1);
  assert.equal(roadmapEvidence.m1Checklist.items.length, 8);
  assert.equal(roadmapEvidence.budget.mismatchK, 72);
  assert.equal(roadmapEvidence.budget.groupedLineTotalK, roadmapEvidence.budget.workbookLineItemTotalK);
  assert.ok(roadmapEvidence.doNotClaimYet.includes("Live NHS/EHR integration"));
  assert.ok(roadmapEvidence.nextThirtyDays.some((item) => item.phase === "1A"));

  const m1Pack = buildM1EvidencePackPayload(actionFollowThroughState, {
    generatedAt: "2026-04-29 21:05",
    generatedBy: "API Contract Test"
  });
  assert.equal(m1Pack.artifactType, "aksh-uk-eu-m1-execution-evidence-pack");
  assert.equal(m1Pack.syntheticOnly, true);
  assert.equal(m1Pack.summary.totalChecklistItems, 8);
  assert.ok(m1Pack.summary.criticalChecklistItems >= 4);
  assert.ok(m1Pack.summary.ownersWithOpenItems >= 4);
  assert.ok(m1Pack.summary.overdueItems >= 1);
  assert.ok(m1Pack.summary.waitingOnEvidenceItems >= 1);
  assert.ok(m1Pack.summary.generatedActions >= 1);
  assert.ok(m1Pack.summary.activeGeneratedActions >= 1);
  assert.equal(m1Pack.summary.resolvedGeneratedActions, 1);
  assert.ok(m1Pack.ownerFollowUps.some((owner) => owner.owner === "CTO"));
  assert.equal(m1Pack.dueDateHealth.rows.length, 8);
  assert.ok(m1Pack.generatedActions.length >= 1);
  assert.equal(m1Pack.actionResolutionSummary.accepted, 1);
  assert.equal(m1Pack.actionResolutions.length, 1);
  assert.equal(m1Pack.actionResolutions[0].nextStep, "Confirm owner follow-through in the M1 board.");
  assert.equal(m1Pack.actionResolutions[0].targetDate, "2026-05-03");
  assert.ok(m1Pack.handoffArtifacts.some((artifact) => artifact.route === "/review/roadmap/actions"));
  assert.ok(m1Pack.handoffArtifacts.some((artifact) => artifact.route === "/review/roadmap/actions/report"));
  assert.ok(m1Pack.handoffArtifacts.some((artifact) => artifact.route === "/review/roadmap/follow-through"));
  assert.ok(m1Pack.handoffArtifacts.some((artifact) => artifact.route === "/api/roadmap/actions"));
  assert.ok(m1Pack.handoffArtifacts.some((artifact) => artifact.route === "/review/roadmap/report"));
  assert.ok(m1Pack.handoffArtifacts.some((artifact) => artifact.route === "/api/benchmarks/evidence"));
  assert.ok(m1Pack.knownLimitations.includes("Live NHS/EHR integration"));

  const m1ActionInboxEvidence = buildM1ActionInboxEvidencePayload(actionFollowThroughState, {
    generatedAt: "2026-04-29 21:10",
    generatedBy: "API Contract Test"
  });
  assert.equal(m1ActionInboxEvidence.artifactType, "aksh-uk-eu-m1-action-inbox-evidence");
  assert.equal(m1ActionInboxEvidence.syntheticOnly, true);
  assert.equal(m1ActionInboxEvidence.productionClinicalSoftware, false);
  assert.equal(m1ActionInboxEvidence.liveNhsIntegration, false);
  assert.ok(m1ActionInboxEvidence.summary.generated >= 1);
  assert.ok(m1ActionInboxEvidence.summary.active >= 1);
  assert.equal(m1ActionInboxEvidence.summary.resolved, 1);
  assert.equal(m1ActionInboxEvidence.summary.accepted, 1);
  assert.equal(m1ActionInboxEvidence.summary.followThroughReady, 1);
  assert.equal(m1ActionInboxEvidence.summary.missingNextStep, 0);
  assert.equal(m1ActionInboxEvidence.summary.missingTargetDate, 0);
  assert.equal(m1ActionInboxEvidence.summary.evidencedFollowThrough, 1);
  assert.ok(m1ActionInboxEvidence.summary.owners >= 1);
  assert.ok(m1ActionInboxEvidence.ownerGroups.some((group) => group.owner === actionToResolve.owner));
  assert.ok(m1ActionInboxEvidence.activeActions.length >= 1);
  assert.equal(m1ActionInboxEvidence.acknowledgedActions.length, 1);
  assert.equal(m1ActionInboxEvidence.acknowledgedActions[0].resolution?.status, "accepted");

  const commandCentreDashboard: DashboardSummary = {
    persona: {
      role: "clinical_reviewer",
      title: "Clinical reviewer",
      headline: "Synthetic proof review",
      focus: "Review high-risk synthetic cases and evidence gaps."
    },
    overview: {
      pendingCount: 3,
      urgentCount: 2,
      blockedCount: 1,
      acceptedCount: 1,
      followUpCount: 2,
      completionRate: 40
    },
    productivity: {
      readyToFinalizeCount: 1,
      highRiskCount: 2,
      overdueFollowUps: 1,
      confidenceCount: 4,
      promotedCount: 1,
      needsEvidenceCount: 2,
      carryoverCount: 1,
      overdueMeetingActions: 1
    },
    priorities: [],
    recentCases: [],
    followUps: [],
    meetingFollowThrough: [],
    meetingNextActions: [],
    workstreams: []
  };
  const commandCentreState = buildCommandCentreStatePayload(commandCentreDashboard, actionFollowThroughState, {
    generatedAt: "2026-04-29 21:15",
    generatedBy: "API Contract Test"
  });
  assert.equal(commandCentreState.artifactType, "aksh-uk-eu-command-centre-product-state");
  assert.equal(commandCentreState.syntheticOnly, true);
  assert.equal(commandCentreState.productionClinicalSoftware, false);
  assert.equal(commandCentreState.liveNhsIntegration, false);
  assert.equal(commandCentreState.productStage, "synthetic-data review-first proof");
  assert.ok(commandCentreState.summary.pendingReviews >= 1);
  assert.ok(commandCentreState.summary.safeToShowSurfaces >= 5);
  assert.ok(commandCentreState.summary.notClaimableItems >= 5);
  assert.ok(commandCentreState.summary.nextBuildPriorities >= 4);
  assert.ok(commandCentreState.safeToShow.some((item) => item.route === "/review/command-centre"));
  assert.ok(commandCentreState.guardrails.includes("Live NHS/EHR integration"));
  assert.ok(commandCentreState.nextBuildPriorities.some((item) => item.route === "/review/roadmap/follow-through"));
  assert.ok(commandCentreState.actionSignals.activeActions.length >= 1);

  await resetRoadmapState(roadmapScopeKey, roadmapUserId);
  await unlink(path.join(process.cwd(), "data", `roadmap-state.${roadmapScopeKey}.json`));
  await unlink(path.join(process.cwd(), "data", `review-cases.${scopeKey}.json`));
  await unlink(path.join(process.cwd(), "data", `review-cases.${readinessRouteScope}.json`));
  await unlink(path.join(process.cwd(), "data", `benchmark-signoffs.${readinessRouteScope}.json`));
  await unlink(path.join(process.cwd(), "data", `feedback-state.${readinessRouteScope}.json`));
  await unlink(path.join(process.cwd(), "data", `readiness-history.${readinessRouteScope}.json`));
  await unlink(path.join(process.cwd(), "data", `review-cases.${concurrentSignoffScope}.json`));
  await unlink(path.join(process.cwd(), "data", `benchmark-signoffs.${concurrentSignoffScope}.json`));
  await unlink(path.join(process.cwd(), "data", `feedback-state.${concurrentSignoffScope}.json`));
  await unlink(path.join(process.cwd(), "data", `readiness-history.${concurrentSignoffScope}.json`));

  if (previousMedplumFlag === undefined) {
    delete process.env.ENABLE_MEDPLUM_SYNC;
  } else {
    process.env.ENABLE_MEDPLUM_SYNC = previousMedplumFlag;
  }
  if (previousFastApiFlag === undefined) {
    delete process.env.ENABLE_FASTAPI_SYNTHESIS;
  } else {
    process.env.ENABLE_FASTAPI_SYNTHESIS = previousFastApiFlag;
  }
}

run()
  .then(() => {
    console.log("API contract checks passed.");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
