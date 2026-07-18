import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();

async function assertFileIncludes(relativePath: string, expectedText: string) {
  const absolutePath = path.join(projectRoot, relativePath);
  const source = await readFile(absolutePath, "utf8");
  assert.ok(source.includes(expectedText), `${relativePath} should include "${expectedText}"`);
}

async function run() {
  const criticalRoutes = [
    ["app/page.tsx", "HomePage"],
    ["app/onboarding/page.tsx", "OnboardingPage"],
    ["app/platform/page.tsx", "PlatformPage"],
    ["app/review/page.tsx", "ReviewPageClient"],
    ["app/review/command-centre/page.tsx", "CommandCentre"],
    ["app/review/demo-readiness/page.tsx", "DemoReadinessChecklist"],
    ["app/review/simulated-patients/page.tsx", "SimulatedPatientsPage"],
    ["app/review/governance-pack/page.tsx", "GovernancePackPage"],
    ["app/review/ops/page.tsx", "OpsDashboard"],
    ["app/review/ops/report/page.tsx", "OpsReport"],
    ["app/review/benchmarks/page.tsx", "BenchmarkDrilldownPage"],
    ["app/review/benchmarks/report/page.tsx", "BenchmarkReport"],
    ["app/review/readiness/page.tsx", "EvidenceReadinessPage"],
    ["app/review/command-centre/report/page.tsx", "CommandCentreReport"],
    ["app/review/roadmap/report/page.tsx", "RoadmapReport"],
    ["app/review/roadmap/actions/report/page.tsx", "M1ActionReport"],
    ["app/review/roadmap/m1-pack/page.tsx", "M1EvidencePack"],
    ["app/review/pilot/report/page.tsx", "PilotReport"],
    ["app/api/research/evaluation/route.ts", "buildResearchEvaluationArtifact"],
    ["app/api/system/database-contract/route.ts", "buildDatabaseAdapterContract"],
    ["app/api/review-cases/[id]/dossier/route.ts", "buildCaseValidationDossierPayload"],
    ["app/api/evidence/board-pack/route.ts", "buildBoardPackEvidencePayload"],
    ["app/cases/[id]/page.tsx", "CasePage"],
    ["app/cases/[id]/evidence/page.tsx", "CaseEvidencePage"],
    ["app/cases/[id]/dossier/page.tsx", "CaseValidationDossierPage"],
    ["app/cases/[id]/report/page.tsx", "CaseReportPage"]
  ] as const;

  for (const [routeFile, expectedText] of criticalRoutes) {
    await assertFileIncludes(routeFile, expectedText);
  }

  await assertFileIncludes("components/app-shell.tsx", "ProductModeBanner");
  await assertFileIncludes("components/review/product-mode-banner.tsx", "Synthetic validation mode");
  await assertFileIncludes("components/review/case-list.tsx", "CaseStateChips");
  await assertFileIncludes("components/review/case-detail.tsx", "CaseStateRibbon");
  await assertFileIncludes("components/review/ops-dashboard.tsx", "ValidationProtocolSignalsCard");
  await assertFileIncludes("components/review/ops-dashboard.tsx", "StalledRemediationAlertsCard");
  await assertFileIncludes("components/review/ops-dashboard.tsx", "useOpsDashboardControls");
  await assertFileIncludes("components/review/ops-dashboard-remediation-sections.tsx", "CoordinationRiskCard");
  await assertFileIncludes("components/review/ops-dashboard-remediation-sections.tsx", "Save Triage");
  await assertFileIncludes("components/review/ops-dashboard-header-sections.tsx", "OpsDashboardHero");
  await assertFileIncludes("components/review/ops-dashboard-feedback-sections.tsx", "FeedbackPhrasePanels");
  await assertFileIncludes("components/review/useOpsDashboardControls.ts", "saveRemediationOwner");
  await assertFileIncludes("components/review/ops-dashboard-remediation-sections.tsx", "RemediationActionCohortsCard");
  await assertFileIncludes("components/review/ops-dashboard-meeting-sections.tsx", "OwnerWorkloadBalancingCard");
  await assertFileIncludes("components/review/ops-dashboard-validation-sections.tsx", "ValidationActionQueuesCards");
  await assertFileIncludes("components/review/ops-dashboard-dossier-sections.tsx", "DossierSpotlightCasesCard");
  await assertFileIncludes("components/review/ops-report-validation-sections.tsx", "ValidationReadinessActionsReportSection");
  await assertFileIncludes("components/review/ops-report-validation-sections.tsx", "DossierReadinessReportSection");
  await assertFileIncludes("components/review/ops-report-remediation-sections.tsx", "RemediationActionCohortsReportSection");
  await assertFileIncludes("components/review/ops-report-remediation-sections.tsx", "CoordinationRiskReportSection");
  await assertFileIncludes("components/review/demo-readiness-checklist.tsx", "Manual Rehearsal Checks");
  await assertFileIncludes("components/review/demo-readiness-checklist.tsx", "Research evaluation boundary is exportable");
  await assertFileIncludes("components/review/demo-readiness-checklist.tsx", "Database adapter contract is exportable");
  await assertFileIncludes("components/review/demo-readiness-checklist.tsx", "Board-pack export is available");
  await assertFileIncludes("components/review/demo-readiness-checklist.tsx", "Case dossier export is available");
  await assertFileIncludes("lib/case-dossier-evidence.ts", "aksh-uk-eu-case-validation-dossier");
  await assertFileIncludes("lib/board-pack-evidence.ts", "aksh-uk-eu-board-pack-evidence");
  await assertFileIncludes("lib/evidence-artifact-metadata.ts", "EVIDENCE_ARTIFACT_SCHEMA_VERSION");
  await assertFileIncludes("app/cases/[id]/dossier/page.tsx", "KnownLimitationsFooter");
  await assertFileIncludes("app/cases/[id]/dossier/page.tsx", "/dossier");
  await assertFileIncludes("components/review/benchmark-report.tsx", "/api/evidence/board-pack");
  await assertFileIncludes("components/review/evidence-readiness-page.tsx", "/api/evidence/board-pack");
  await assertFileIncludes("components/review/known-limitations-footer.tsx", 'data-testid="known-limitations-footer"');
  await assertFileIncludes("components/review/proof-empty-state.tsx", 'data-testid="proof-empty-state"');
  await assertFileIncludes("app/cases/[id]/report/page.tsx", "KnownLimitationsFooter");
  await assertFileIncludes("components/review/benchmark-report.tsx", "KnownLimitationsFooter");
  await assertFileIncludes("components/review/command-centre-report.tsx", "KnownLimitationsFooter");
  await assertFileIncludes("components/review/evidence-readiness-page.tsx", "ProofEmptyState");
  await assertFileIncludes("components/review/benchmark-signoff-panel.tsx", "benchmark-signoff-empty");
  await assertFileIncludes("scripts/smoke-walkthrough-path.mjs", "/review/command-centre/report?demo=1");
  await assertFileIncludes("components/review/simulated-patients-page.tsx", "Richer fake patient profiles");
  await assertFileIncludes("components/review/governance-pack-page.tsx", "Production-readiness safety structure");
  await assertFileIncludes("components/review/governance-pack-page.tsx", "ML / Research Evaluation Boundary");
  await assertFileIncludes("components/review/governance-pack-page.tsx", "Export Research JSON");
  await assertFileIncludes("components/review/governance-pack-page.tsx", "Export Database JSON");
  await assertFileIncludes("components/product/product-landing.tsx", "56");
  await assertFileIncludes("package.json", "\"smoke:walkthrough\"");
  await assertFileIncludes("next.config.mjs", ".next-build-active");
  await assertFileIncludes("scripts/smoke-walkthrough-path.mjs", "/review/demo-readiness?demo=1");
  await assertFileIncludes("scripts/smoke-walkthrough-path.mjs", "requireSmokeCredentials");
  await assertFileIncludes("lib/simulated-patients.ts", "realPatientData: false");
  await assertFileIncludes("lib/governance-pack.ts", "productionClinicalSafetyCase: false");
  await assertFileIncludes("lib/research-evaluation-plan.ts", "productionClinicalAiClaim: false");
  await assertFileIncludes("lib/research-evaluation-plan.ts", "buildResearchEvaluationArtifact");
  await assertFileIncludes("docs/RESEARCH_EVALUATION_BOUNDARY.md", "No real patient data model training.");
  await assertFileIncludes("lib/system-contracts.ts", "external-ehr-adapters");
  await assertFileIncludes("lib/system-contracts.ts", "aksh-uk-eu-own-system-boundary-contract");
  await assertFileIncludes("lib/system-contracts.ts", "aksh-uk-eu-database-adapter-contract");
  await assertFileIncludes("lib/system-contracts.ts", "Live NHS/EHR integration");
  await assertFileIncludes("lib/system-contracts.ts", "FHIR-shaped exports are internal evidence artifacts");
  await assertFileIncludes("lib/system-contracts.ts", "json_file_repository");
  await assertFileIncludes("lib/storage/get-review-case-repository-adapter.ts", "json_file_repository");
  await assertFileIncludes("lib/audit-integrity.ts", "aksh-uk-eu-audit-integrity-report");
  await assertFileIncludes("lib/permission-matrix.ts", "aksh-uk-eu-role-permission-matrix");
  await assertFileIncludes("lib/clinical-safety-files.ts", "DCB0129-style rehearsal");
  await assertFileIncludes("components/review/governance-pack-page.tsx", "DCB0129-Style Safety File Placeholders");
  await assertFileIncludes("components/review/governance-pack-page.tsx", "Role And Action Permission Matrix");
  await assertFileIncludes("package.json", "\"data:seed\"");
  await assertFileIncludes("package.json", "\"data:seed:neo4j\"");
  await assertFileIncludes("package.json", "\"auth:cleanup-demo\"");
  await assertFileIncludes("app/api/neo4j/health/route.ts", "checkNeo4jHealth");
  await assertFileIncludes("app/api/health/route.ts", "checkNeo4jHealth");
  await assertFileIncludes("components/dashboard/Neo4jMockModeBanner.tsx", "neo4j-mock-mode-banner");
  await assertFileIncludes("app/api/agents/oracle/route.ts", "runOracleAgent");
  await assertFileIncludes("lib/agents/llm-oracle.ts", "isLlmOracleConfigured");
  await assertFileIncludes("components/dashboard/OracleRiskPanel.tsx", "Generate ORACLE brief");
  await assertFileIncludes("app/api/agents/dr-assist/route.ts", "runDrAssistAgent");
  await assertFileIncludes("lib/agents/llm-dr-assist.ts", "isLlmDrAssistConfigured");
  await assertFileIncludes("components/dashboard/AgentControlPanel.tsx", "/api/agents/dr-assist");
  await assertFileIncludes("components/dashboard/AgentControlPanel.tsx", "/api/agents/synthesis");
  await assertFileIncludes("components/dashboard/AgentControlPanel.tsx", "/api/agents/referral");
  await assertFileIncludes("app/api/agents/equity/route.ts", "runEquityAgent");
  await assertFileIncludes("lib/agents/llm-equity.ts", "isLlmEquityConfigured");
  await assertFileIncludes("components/dashboard/ics/EquityDeepDive.tsx", "/api/agents/equity");
  await assertFileIncludes("app/api/agents/voice-care/route.ts", "synthetic_outbound");
  await assertFileIncludes("lib/agents/voice-care.ts", "VOICE CARE — DAY 3 OUTBOUND (SYNTHETIC)");
  await assertFileIncludes("components/dashboard/nurse/VoiceCareEscalationCard.tsx", "/api/agents/voice-care");
  await assertFileIncludes("app/api/eval/agents/route.ts", "runGoldenEval");
  await assertFileIncludes("lib/eval/golden-cases.ts", "GOLDEN_CASES");
  await assertFileIncludes("docs/AGENT_EVAL_HARNESS.md", "npm run eval:agents");
  await assertFileIncludes("package.json", "\"eval:agents\"");
  await assertFileIncludes("middleware.ts", '"/dashboard/ics"');
  await assertFileIncludes("components/dashboard/DemoDataBanner.tsx", "demo-data-banner");
  await assertFileIncludes("components/dashboard/SystemStatusStrip.tsx", "/api/health");
  await assertFileIncludes("components/dashboard/IntegrationStatus.tsx", "emis-staging");
  await assertFileIncludes("app/api/agents/referral/route.ts", "eReferralWrite");
  await assertFileIncludes("docs/SAFETY_CASE_REHEARSAL.md", "POST /api/agents/oracle");
  await assertFileIncludes("docs/SAFETY_CASE_REHEARSAL.md", "POST /api/agents/dr-assist");
  await assertFileIncludes("docs/SAFETY_CASE_REHEARSAL.md", "POST /api/agents/equity");
  await assertFileIncludes("docs/SAFETY_CASE_REHEARSAL.md", "POST /api/agents/voice-care");
  await assertFileIncludes("docs/SAFETY_CASE_REHEARSAL.md", "npm run eval:agents");
  await assertFileIncludes("components/dashboard/researcher/ExportEvaluationButton.tsx", "/api/audit/shield");
  await assertFileIncludes("components/dashboard/hospital/HospitalMockModeBanner.tsx", "hospital-mock-mode-banner");
  await assertFileIncludes("app/api/profile/route.ts", "buildUserProfile");
  await assertFileIncludes("lib/hooks/use-user-profile.ts", "useUserProfile");
  await assertFileIncludes("components/dashboard/TopBar.tsx", "useUserProfile");
  await assertFileIncludes("package.json", "\"data:reset\"");
  await assertFileIncludes("package.json", "\"data:audit-integrity\"");
  await assertFileIncludes("app/api/system/audit-integrity/route.ts", "deriveAuditIntegrityReport");
  await assertFileIncludes("app/api/system/permission-matrix/route.ts", "buildRolePermissionMatrix");
  await assertFileIncludes("lib/fastapi-synthesis.ts", "validateFastApiSynthesisResponse");
  await assertFileIncludes("lib/integration-boundary-contract.ts", "aksh-uk-eu-integration-boundary-contract");
  await assertFileIncludes("lib/integration-env.ts", "aksh-uk-eu-integration-environment-contract");
  await assertFileIncludes("lib/transcription-config.ts", "aksh-uk-eu-transcription-dependency-status");
  await assertFileIncludes("app/api/system/integration-contract/route.ts", "buildIntegrationBoundaryContract");
  await assertFileIncludes("app/api/review-cases/route.ts", "deterministic_synthetic");
  await assertFileIncludes("app/api/transcribe/route.ts", "resolveTranscriptionMode");
  await assertFileIncludes("tests/integration-boundary.test.ts", "Integration boundary checks passed");
  await assertFileIncludes("lib/human-gates.ts", "red_flag_escalation");
  await assertFileIncludes("lib/human-gates.ts", "referral_pathway");
  await assertFileIncludes("lib/human-gates.ts", "medication_decision");
  await assertFileIncludes("components/review/case-detail.tsx", "Reviewer Human Gates");
  await assertFileIncludes("components/review/case-detail/useCaseReviewWorkflow.ts", "updateHumanGateDecision");
  await assertFileIncludes("components/review/case-detail/useCaseReviewWorkflow.ts", "humanGateBlockers");
  await assertFileIncludes("components/review/human-gate-summary.tsx", 'data-testid="human-gate-summary"');
  await assertFileIncludes("components/review/human-gate-summary.tsx", "human-gate-${gate.id}");
  await assertFileIncludes("components/review/human-gate-summary.tsx", "human-gate-${gate.id}-confirm");
  await assertFileIncludes("components/review/human-gate-summary.tsx", "human-gate-${gate.id}-not-applicable");
  await assertFileIncludes("lib/human-gates.ts", "Red-flag escalation gate");
  await assertFileIncludes("lib/human-gates.ts", "Referral/pathway gate");
  await assertFileIncludes("lib/human-gates.ts", "Medication/decision gate");
  await assertFileIncludes("components/review/case-human-review-panels.tsx", "HumanGateSummary");
  await assertFileIncludes("components/review/case-human-review-panels.tsx", "showGates");
  await assertFileIncludes("components/review/case-evidence-validation-sections.tsx", "CaseEvidenceHumanGateSection");
  await assertFileIncludes("components/review/case-evidence-validation-sections.tsx", "CaseHumanReviewPanels");
  await assertFileIncludes("components/review/case-evidence-validation-sections.tsx", "Human-Gate Status");
  await assertFileIncludes("components/review/case-evidence-validation-sections.tsx", "showActions={false}");
  await assertFileIncludes("components/review/case-detail.tsx", "onGateDecision={workflow.updateHumanGateDecision}");
  await assertFileIncludes("components/review/case-evidence-clinical-sections.tsx", "CaseEvidenceDraftActionsSection");
  await assertFileIncludes("components/review/case-evidence-clinical-sections.tsx", "showGates={false}");
  await assertFileIncludes("components/review/synthetic-outcome-capture-panel.tsx", "synthetic-outcome-capture");
  await assertFileIncludes("components/review/case-evidence-export-sections.tsx", "FHIR Export Bundle");
  await assertFileIncludes("components/review/case-evidence-clinical-sections.tsx", "Safety And Acceptance");
  await assertFileIncludes("app/cases/[id]/evidence/page.tsx", "CaseEvidenceHeader");
  await assertFileIncludes("app/cases/[id]/evidence/page.tsx", "CaseEvidenceHumanGateSection");
  await assertFileIncludes("app/cases/[id]/evidence/page.tsx", "CaseEvidenceOutcomeCaptureSection");
  await assertFileIncludes("app/cases/[id]/evidence/page.tsx", "deriveHumanGates");
  await assertFileIncludes("app/cases/[id]/report/page.tsx", "deriveHumanGates");
  await assertFileIncludes("app/cases/[id]/report/page.tsx", "CaseHumanReviewPanels");
  await assertFileIncludes("app/cases/[id]/report/page.tsx", 'gateTitle="Human-Gate Status"');
  await assertFileIncludes("app/cases/[id]/report/page.tsx", 'variant="report"');
  await assertFileIncludes("app/cases/[id]/report/page.tsx", "SyntheticOutcomeCapturePanel");
  await assertFileIncludes("lib/workflow/evidence.ts", "humanGateDecisions");
  await assertFileIncludes("scripts/smoke-browser-loop.mjs", "Confirmed and persisted medication human gate");
  await assertFileIncludes("scripts/smoke-browser-loop.mjs", "Medication decision: reviewer_confirmed");
  await assertFileIncludes("lib/command-centre-evidence.ts", "Demo readiness");
  await assertFileIncludes("components/review/ops-report.tsx", "deriveOpsAnalytics");
  await assertFileIncludes("lib/ops-analytics.ts", "deriveOpsAnalytics");

  console.log("Route and UI smoke checks passed.");
}

void run();
