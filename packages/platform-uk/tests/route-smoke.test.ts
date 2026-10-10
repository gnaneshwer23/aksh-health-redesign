import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();

async function assertFileIncludes(relativePath: string, expectedText: string) {
  const absolutePath = path.join(projectRoot, relativePath);
  const source = await readFile(absolutePath, "utf8");
  assert.ok(source.includes(expectedText), `${relativePath} should include "${expectedText}"`);
}

async function assertFileExcludes(relativePath: string, unexpectedText: string) {
  const absolutePath = path.join(projectRoot, relativePath);
  const source = await readFile(absolutePath, "utf8");
  assert.ok(!source.includes(unexpectedText), `${relativePath} should not include "${unexpectedText}"`);
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
  await assertFileIncludes("components/dashboard/OracleRiskPanel.tsx", "Generate HORIZON brief");
  await assertFileIncludes("app/api/agents/dr-assist/route.ts", "runDrAssistAgent");
  await assertFileIncludes("lib/agents/llm-dr-assist.ts", "isLlmDrAssistConfigured");
  await assertFileIncludes("components/dashboard/AgentControlPanel.tsx", "/api/agents/dr-assist");
  await assertFileIncludes("components/dashboard/AgentControlPanel.tsx", "/api/agents/synthesis");
  await assertFileIncludes("components/dashboard/AgentControlPanel.tsx", "/api/agents/referral");
  await assertFileIncludes("components/dashboard/AgentControlPanel.tsx", "gp-agent-brand-strip");
  await assertFileIncludes("components/dashboard/AgentControlPanel.tsx", "CANVAS");
  await assertFileIncludes("components/dashboard/AgentControlPanel.tsx", "BRIDGE");
  await assertFileIncludes("components/dashboard/AgentControlPanel.tsx", "CONDUCTOR");
  await assertFileIncludes("components/dashboard/AgentControlPanel.tsx", "sub-capability");
  await assertFileIncludes("components/dashboard/AgentControlPanel.tsx", "liveEmis:false");
  await assertFileIncludes("components/dashboard/AgentControlPanel.tsx", "not wired");
  await assertFileIncludes("components/dashboard/AgentControlPanel.tsx", "AGENT_JOB_IN_LOOP");
  await assertFileIncludes("components/dashboard/AgentControlPanel.tsx", "gp-horizon-panel");
  await assertFileIncludes("components/dashboard/GpHeroDemoPath.tsx", "gp-hero-demo-path");
  await assertFileIncludes("components/dashboard/GpHeroDemoPath.tsx", "/demo/script");
  await assertFileIncludes("app/dashboard/gp/page.tsx", "GpHeroDemoPath");
  await assertFileIncludes("app/dashboard/gp/review-queue/page.tsx", "GpHeroDemoPath");
  await assertFileIncludes("lib/product-journey.ts", "/demo/script");
  await assertFileIncludes("components/demo/DemoLaunchScript.tsx", "gp-hero-script-panel");
  await assertFileIncludes("components/dashboard/nurse/NurseHeroDemoPath.tsx", "nurse-hero-demo-path");
  await assertFileIncludes("components/dashboard/nurse/NurseHeroDemoPath.tsx", "liveEmis:false");
  await assertFileIncludes("components/dashboard/admin/AdminHeroDemoPath.tsx", "liveEmis:false");
  await assertFileIncludes("components/dashboard/admin/AdminHeroDemoPath.tsx", "Ops demo");
  await assertFileIncludes("components/dashboard/ics/IcsHeroDemoPath.tsx", "ics-hero-demo-path");
  await assertFileIncludes("components/dashboard/ics/IcsHeroDemoPath.tsx", "liveEmis:false");
  await assertFileIncludes("components/dashboard/ics/IcsHeroDemoPath.tsx", "COMPASS");
  await assertFileIncludes("app/dashboard/ics/page.tsx", "IcsHeroDemoPath");
  await assertFileIncludes("app/dashboard/ics/page.tsx", "no patient-level spill");
  await assertFileIncludes("components/dashboard/hospital/HospitalHeroDemoPath.tsx", "hospital-hero-demo-path");
  await assertFileIncludes("components/dashboard/hospital/HospitalHeroDemoPath.tsx", "synthetic PAS");
  await assertFileIncludes("app/dashboard/hospital/page.tsx", "HospitalHeroDemoPath");
  await assertFileIncludes("app/dashboard/hospital/page.tsx", "Not live PAS");
  await assertFileIncludes("components/dashboard/patient/PatientHeroDemoPath.tsx", "patient-hero-demo-path");
  await assertFileIncludes("components/dashboard/patient/PatientHeroDemoPath.tsx", "liveEmis:false");
  await assertFileIncludes("components/dashboard/patient/PatientHeroDemoPath.tsx", "invite-by-practice");
  await assertFileIncludes("components/dashboard/PatientCompanion.tsx", "PatientHeroDemoPath");
  await assertFileIncludes("components/dashboard/PatientCompanion.tsx", "patient-honesty-banner");
  await assertFileIncludes("components/dashboard/researcher/ResearcherHeroDemoPath.tsx", "researcher-hero-demo-path");
  await assertFileIncludes("components/dashboard/researcher/ResearcherHeroDemoPath.tsx", "ATLAS Phase 2");
  await assertFileIncludes("app/dashboard/researcher/layout.tsx", "ResearcherHeroDemoPath");
  await assertFileIncludes("app/dashboard/researcher/page.tsx", "researcher-honesty-banner");
  await assertFileIncludes("components/demo/DemoLaunchScript.tsx", "ics-hero-script-panel");
  await assertFileIncludes("components/demo/DemoLaunchScript.tsx", "hospital-hero-script-panel");
  await assertFileIncludes("components/demo/DemoLaunchScript.tsx", "patient-hero-script-panel");
  await assertFileIncludes("components/demo/DemoLaunchScript.tsx", "researcher-hero-script-panel");
  await assertFileIncludes("app/dashboard/nurse/page.tsx", "NurseHeroDemoPath");
  await assertFileIncludes(
    "components/dashboard/pharmacist/PharmacistHeroDemoPath.tsx",
    "pharmacist-hero-demo-path"
  );
  await assertFileIncludes("app/dashboard/pharmacist/page.tsx", "PharmacistHeroDemoPath");
  await assertFileIncludes("components/demo/DemoLaunchScript.tsx", "nurse-hero-script-panel");
  await assertFileIncludes("components/demo/DemoLaunchScript.tsx", "pharmacist-hero-script-panel");
  await assertFileIncludes("components/dashboard/precision-health/ClinicalOrchestratePanel.tsx", "CONDUCTOR · Orchestrate");
  await assertFileIncludes("lib/agents.ts", "AGENT_DIRECTORY");
  await assertFileIncludes("lib/agents.ts", 'name: "CANVAS"');
  await assertFileIncludes("lib/agents.ts", "phase: 2, live: false");
  await assertFileIncludes("lib/agents.ts", "John Snow Labs NLP path is not wired");
  await assertFileExcludes("lib/agents.ts", 'name: "VOICE"');
  await assertFileExcludes("lib/agents.ts", 'name: "DrASSIST"');
  await assertFileExcludes("lib/agents.ts", "14 live agents");
  await assertFileExcludes("components/marketing/platform-page-content.tsx", "Seven agents");
  await assertFileExcludes("components/marketing/platform-page-content.tsx", "Twelve Phase-1 directory agents");
  await assertFileIncludes("components/marketing/platform-page-content.tsx", "The Aksh Intelligence Platform");
  await assertFileIncludes("components/marketing/platform-page-content.tsx", "a named clinician decides");
  await assertFileIncludes(
    "components/marketing/lavender/LvAgents.tsx",
    "None of them decides."
  );
  await assertFileIncludes("components/gp/voice-mic-panel.tsx", "feeds CANVAS");
  await assertFileExcludes("components/gp/voice-mic-panel.tsx", "feeds VOICE agent");
  await assertFileIncludes("app/api/agents/equity/route.ts", "runEquityAgent");
  await assertFileIncludes("lib/agents/llm-equity.ts", "isLlmEquityConfigured");
  await assertFileIncludes("components/dashboard/ics/EquityDeepDive.tsx", "/api/agents/equity");
  await assertFileIncludes("app/api/agents/voice-care/route.ts", "synthetic_outbound");
  await assertFileIncludes("lib/agents/voice-care.ts", "VOICE CARE — DAY 3 OUTBOUND (SYNTHETIC)");
  await assertFileIncludes("components/dashboard/nurse/VoiceCareEscalationCard.tsx", "/api/agents/voice-care");
  await assertFileIncludes("app/api/agents/nutrition/route.ts", "coaching_draft_only");
  await assertFileIncludes("app/api/agents/sleep/route.ts", "isClinicalAdvice");
  await assertFileIncludes("app/api/agents/exercise/route.ts", "coaching_draft_only");
  await assertFileIncludes("app/api/agents/mental-health/route.ts", "isClinicalAdvice");
  await assertFileIncludes("app/api/consent/grants/route.ts", "Purpose-bound consent registry");
  await assertFileIncludes("app/api/precision-health/modalities/route.ts", "liveStream");
  await assertFileIncludes("app/api/precision-health/connectors/route.ts", "listConnectorStatuses");
  await assertFileIncludes("app/api/precision-health/ingest/route.ts", "runIngestionPipeline");
  await assertFileIncludes("app/api/integrations/emis-partner-checklist/route.ts", "liveEmis: false");
  await assertFileIncludes("app/api/integrations/emis-partner-sandbox/route.ts", "liveEmis: false");
  await assertFileIncludes("lib/emis-partner-sandbox.ts", "ENABLE_EMIS_PARTNER_SANDBOX");
  await assertFileIncludes("lib/emis-partner-sandbox.ts", "needs_partner");
  await assertFileIncludes("docs/P7_PARTNER_OUTREACH_PACK.md", "ENABLE_EMIS_PARTNER_SANDBOX");
  await assertFileIncludes("app/api/agents/oracle/route.ts", "getOracleModelCard");
  await assertFileIncludes("lib/precision-health/oracle-model-card.ts", "autoRetrain: false");
  await assertFileIncludes("docs/PHASE2_PARTNER_CHECKLIST.md", "liveEmis");
  await assertFileIncludes("docs/P7_PARTNER_OUTREACH_PACK.md", "liveEmis: false");
  await assertFileIncludes("docs/P7_PARTNER_OUTREACH_PACK.md", "im1.team@nhs.net");
  await assertFileIncludes("docs/PHASED_BUILD_P7_AUDIT.md", "NO-GO");
  await assertFileIncludes("docs/PHASED_BUILD_P7_AUDIT.md", "liveEmis");
  await assertFileIncludes("lib/clinical-spine/partner-readiness.ts", "p7-outreach-pack");
  await assertFileIncludes(
    "components/dashboard/precision-health/PartnerReadinessPanel.tsx",
    "P7_PARTNER_OUTREACH_PACK"
  );
  await assertFileIncludes("app/api/patients/[id]/timeline/route.ts", "buildPatientTimeline");
  await assertFileIncludes("app/api/patients/[id]/health-plan/route.ts", "physiologicalTwin");
  await assertFileIncludes("app/api/patients/[id]/risk-state/route.ts", "notAPhysiologicalTwin");
  await assertFileIncludes("components/dashboard/DigitalTwinPanel.tsx", "Patient risk state");
  await assertFileIncludes("components/dashboard/DigitalTwinPanel.tsx", "/api/patients/");
  await assertFileIncludes("components/dashboard/DigitalTwinPanel.tsx", "oracle-model-card");
  await assertFileIncludes("components/dashboard/precision-health/ConsentGrantsPanel.tsx", "/api/consent/grants");
  await assertFileIncludes("components/dashboard/precision-health/PatientTimelinePanel.tsx", "/timeline");
  await assertFileIncludes("components/dashboard/precision-health/HealthPlanDraftPanel.tsx", "Request plan draft");
  await assertFileIncludes("components/dashboard/precision-health/CoachingDraftPanel.tsx", "NOT CLINICAL ADVICE");
  await assertFileIncludes("components/dashboard/precision-health/CoachingDraftPanel.tsx", "mental-health");
  await assertFileIncludes("app/dashboard/gp/patients/[id]/page.tsx", "HealthPlanDraftPanel");
  await assertFileIncludes("app/dashboard/admin/consent/page.tsx", "ConsentGrantsPanel");
  await assertFileIncludes("components/dashboard/Sidebar.tsx", "/dashboard/admin/consent");
  await assertFileIncludes(
    "components/dashboard/precision-health/SafetyRouteCoachingGate.tsx",
    "CoachingDraftPanel"
  );
  await assertFileIncludes("docs/PRECISION_HEALTH_DELIVERY_ROADMAP.md", "Phase 1");
  await assertFileIncludes("docs/PRECISION_HEALTH_DELIVERY_ROADMAP.md", "Phase 2 readiness scaffolding");
  await assertFileIncludes("docs/PRECISION_HEALTH_DELIVERY_ROADMAP.md", "PHASE2_PARTNER_CHECKLIST");
  await assertFileIncludes("docs/PRECISION_HEALTH_DELIVERY_ROADMAP.md", "PHASE3_REGULATORY_PATH");
  await assertFileIncludes("docs/PRECISION_HEALTH_FLOWCHART_GAP.md", "PRECISION_HEALTH_DELIVERY_ROADMAP.md");
  await assertFileIncludes("docs/PRECISION_HEALTH_DELIVERY_ROADMAP.md", "Consent / purpose grants UI");
  await assertFileIncludes("lib/precision-health/modalities.ts", "liveStream: false");
  await assertFileIncludes("lib/precision-health/twin-simulation.ts", "synthetic_rules");
  await assertFileIncludes("lib/precision-health/twin-simulation.ts", "physiologicalTwin: false");
  await assertFileIncludes("app/api/precision-health/twin/simulate/route.ts", "ehrWrite: false");
  await assertFileIncludes("app/api/precision-health/twin/status/route.ts", "getTwinSimulationStatus");
  await assertFileIncludes("lib/precision-health/whole-loop.ts", "physiologicalTwin: false");
  await assertFileIncludes("lib/precision-health/whole-loop.ts", "liveEmis: false");
  await assertFileIncludes("lib/precision-health/whole-loop.ts", "autoRetrain: false");
  await assertFileIncludes("app/api/precision-health/whole-loop/route.ts", "runWholeLoop");
  await assertFileIncludes("app/demo/precision-health-loop/page.tsx", "PrecisionHealthLoopDemo");
  await assertFileIncludes("components/demo/PrecisionHealthLoopDemo.tsx", "Replay the Aksh clinical spine");
  await assertFileIncludes("app/dashboard/admin/precision-health/page.tsx", "SystemSpinePanel");
  await assertFileIncludes("lib/onboarding/consent-registry-sync.ts", "syncOnboardingConsentsToRegistry");
  await assertFileIncludes("lib/clinical-spine/queue-decision.ts", "recordSpineQueueDecisions");
  await assertFileIncludes("app/api/onboarding/complete/route.ts", "syncOnboardingConsentsToRegistry");
  await assertFileIncludes("app/api/review-cases/[id]/route.ts", "recordSpineQueueDecisions");
  await assertFileIncludes("app/api/agents/causal/route.ts", "hypothesis only, not causal proof");
  await assertFileIncludes("app/api/research/federated/jobs/route.ts", "patientLevelExport");
  await assertFileIncludes("app/api/integrations/pharma-rwe/route.ts", "getPharmaRweSummary");
  await assertFileIncludes("app/api/integrations/payer-vbc/route.ts", "getPayerVbcMetrics");
  await assertFileIncludes("lib/precision-health/pharma-payer.ts", "livePharmaIntegration");
  await assertFileIncludes("lib/precision-health/pharma-payer.ts", "livePayerIntegration");
  await assertFileIncludes("lib/precision-health/pharma-payer.ts", "Not a live payer/pharma");
  await assertFileIncludes("docs/PHASE3_REGULATORY_PATH.md", "UNSIGNED");
  await assertFileIncludes(
    "components/dashboard/precision-health/ScenarioRankingPanel.tsx",
    "not a living digital twin"
  );
  await assertFileIncludes("components/dashboard/precision-health/FederatedJobsPanel.tsx", "synthetic aggregates");
  await assertFileIncludes("components/dashboard/precision-health/PharmaPayerStubPanel.tsx", "Not a live payer/pharma");
  await assertFileIncludes("app/dashboard/gp/patients/[id]/page.tsx", "ScenarioRankingPanel");
  await assertFileIncludes("app/dashboard/hospital/page.tsx", "ScenarioRankingPanel");
  await assertFileIncludes("app/dashboard/researcher/page.tsx", "FederatedJobsPanel");
  await assertFileIncludes("app/dashboard/admin/integrations/page.tsx", "PharmaPayerStubPanel");
  await assertFileIncludes("app/dashboard/admin/precision-health/page.tsx", "PrecisionHealthStatusPanel");
  await assertFileIncludes("app/dashboard/admin/precision-health/page.tsx", "ConnectorsIngestPanel");
  await assertFileIncludes("app/dashboard/gp/patients/[id]/page.tsx", "ConnectorsIngestPanel");
  await assertFileIncludes("app/dashboard/gp/patients/[id]/page.tsx", 'mode="clinician"');
  await assertFileIncludes("components/dashboard/PatientCompanion.tsx", "ConnectorsIngestPanel");
  await assertFileIncludes("components/dashboard/PatientCompanion.tsx", 'mode="patient"');
  await assertFileIncludes(
    "components/dashboard/precision-health/PatientTimelinePanel.tsx",
    "timeline-biomarker-lite"
  );
  await assertFileIncludes(
    "components/dashboard/precision-health/SystemSpinePanel.tsx",
    "spine-phase-b-ingest"
  );
  await assertFileIncludes("lib/precision-health/biomarkers.ts", "extractBiomarkerLite");
  await assertFileIncludes("lib/precision-health/connectors.ts", "ROLE_INGEST_CONNECTOR_IDS");
  await assertFileIncludes("docs/CLINICAL_SPINE_PHASE_B.md", "liveEmis: false");
  await assertFileIncludes("docs/CLINICAL_SPINE_PHASE_C.md", "physiologicalTwin: false");
  await assertFileIncludes("docs/CLINICAL_SPINE_PHASE_D.md", "liveEmis: false");
  await assertFileIncludes("docs/CLINICAL_SPINE_PHASE_E.md", "autoRetrain: false");
  await assertFileIncludes("docs/CLINICAL_SPINE_PHASE_F.md", "liveEmis: false");
  await assertFileIncludes("app/api/clinical-spine/partner-readiness/route.ts", "buildPartnerReadinessPack");
  await assertFileIncludes("app/api/clinical-spine/partner-gates/route.ts", "recordPartnerGateArtifact");
  await assertFileIncludes(
    "app/api/clinical-spine/evidence-pack-export/route.ts",
    "getEvidencePackLinks"
  );
  await assertFileIncludes(
    "components/dashboard/precision-health/SystemSpinePanel.tsx",
    "spine-phase-f-partners"
  );
  await assertFileIncludes(
    "app/dashboard/admin/precision-health/page.tsx",
    "PartnerReadinessPanel"
  );
  await assertFileIncludes("app/api/clinical-spine/nurse-vitals/route.ts", "recordNurseVitalsOnSpine");
  await assertFileIncludes(
    "app/api/clinical-spine/pharmacist-review/route.ts",
    "recordPharmacistReviewOnSpine"
  );
  await assertFileIncludes("app/api/clinical-spine/aggregates/route.ts", "buildSpineAggregates");
  await assertFileIncludes("app/api/clinical-spine/outcomes/route.ts", "captureSpineOutcome");
  await assertFileIncludes(
    "app/api/clinical-spine/governed-evaluation/route.ts",
    "submitGovernedEvaluation"
  );
  await assertFileIncludes(
    "components/dashboard/precision-health/SystemSpinePanel.tsx",
    "spine-phase-d-stakeholders"
  );
  await assertFileIncludes(
    "components/dashboard/precision-health/SystemSpinePanel.tsx",
    "spine-phase-e-outcomes"
  );
  await assertFileIncludes(
    "app/dashboard/gp/patients/[id]/page.tsx",
    "SpineOutcomesCapturePanel"
  );
  await assertFileIncludes("components/dashboard/PatientCompanion.tsx", "SpineOutcomesCapturePanel");
  await assertFileIncludes("app/dashboard/admin/learning/page.tsx", "GovernedEvaluationPanel");
  await assertFileIncludes("lib/clinical-spine/outcomes-loop.ts", "autoRetrain: false");
  await assertFileIncludes("components/dashboard/PatientCompanion.tsx", "HealthPlanDraftPanel");
  await assertFileIncludes("app/dashboard/nurse/observations/page.tsx", "PatientTimelinePanel");
  await assertFileIncludes("app/dashboard/ics/page.tsx", "SpineSharedEventsPanel");
  await assertFileIncludes("app/dashboard/hospital/page.tsx", "WardPatientContext");
  await assertFileIncludes("app/dashboard/hospital/page.tsx", "HospitalCommandMap");
  await assertFileIncludes("app/api/agents/orchestrate/route.ts", "runClinicalSpineOrchestrate");
  await assertFileIncludes("app/dashboard/gp/patients/[id]/page.tsx", "ClinicalOrchestratePanel");
  await assertFileIncludes("app/dashboard/gp/review-queue/page.tsx", "ClinicalOrchestratePanel");
  await assertFileIncludes("components/dashboard/PatientCompanion.tsx", "SafetyRouteCoachingGate");
  await assertFileIncludes("components/dashboard/OracleRiskPanel.tsx", "oracle-risk-model-card");
  await assertFileIncludes("components/dashboard/nurse/VitalsForm.tsx", "nurse-vitals-timeline-note");
  await assertFileIncludes(
    "components/dashboard/precision-health/ConnectorsIngestPanel.tsx",
    "Fitbit stub disabled"
  );
  await assertFileIncludes(
    "components/dashboard/precision-health/CausalHypothesisPanel.tsx",
    "hypothesis only, not causal proof"
  );
  await assertFileIncludes("app/dashboard/gp/patients/[id]/page.tsx", "CausalHypothesisPanel");
  await assertFileIncludes("app/dashboard/hospital/page.tsx", "panel === \"digital-twin\"");
  await assertFileIncludes("app/dashboard/hospital/page.tsx", "DigitalTwinPanel");
  await assertFileIncludes("components/dashboard/Sidebar.tsx", "/dashboard/admin/precision-health");
  await assertFileIncludes("components/dashboard/Sidebar.tsx", "/dashboard/researcher#federated");
  await assertFileIncludes("app/security/page.tsx", "precision-health");
  await assertFileIncludes("app/security/page.tsx", "not a live digital twin claim");
  await assertFileIncludes("app/security/page.tsx", "validated physiological digital twin");
  await assertFileIncludes("scripts/generate-evidence-pack.mjs", "gate-checklist-progress.json");
  await assertFileIncludes("scripts/generate-evidence-pack.mjs", "precision-health-scaffold-snapshot.json");
  await assertFileIncludes("scripts/evidence-precision-health-summary.ts", "physiologicalTwin");
  await assertFileIncludes("lib/precision-health/connectors.ts", "imaging_dicom_meta_stub");
  await assertFileIncludes("lib/precision-health/connectors.ts", "omics_panel_stub");
  await assertFileIncludes("lib/precision-health/connectors.ts", "environment_openweather_stub");
  await assertFileIncludes("lib/medplum-client.ts", "dryRunMedplumStagingSync");
  await assertFileIncludes("lib/emis-staging.ts", "liveEmis: false");
  await assertFileIncludes("lib/simulated-ehr/index.ts", "liveEmis: false");
  await assertFileIncludes("lib/simulated-ehr/index.ts", "realPatientData: false");
  await assertFileIncludes("lib/simulated-ehr/index.ts", "simulated_emis");
  await assertFileIncludes("lib/simulated-ehr/index.ts", "simulated_systmone");
  await assertFileIncludes("app/api/integrations/simulated-ehr/route.ts", "liveEmis: false");
  await assertFileIncludes("app/api/integrations/simulated-ehr/route.ts", "getSimulatedEhrChartForPatient");
  await assertFileIncludes("components/dashboard/SimulatedEhrWrittenPanel.tsx", "liveEmis:false");
  await assertFileIncludes("app/dashboard/gp/page.tsx", "SimulatedEhrWrittenPanel");
  await assertFileIncludes("lib/clinical-proof/hitl-writeback-chain.ts", "upsertSimulatedEhrCharts");
  await assertFileIncludes("docs/reports/AKSH_SYNTHETIC_EHR_REHEARSAL.md", "SIM-EMR rehearsal");
  await assertFileIncludes("docs/reports/AKSH_SYNTHETIC_EHR_REHEARSAL.md", "GOV-002");
  await assertFileIncludes("app/api/eval/agents/route.ts", "runGoldenEval");
  await assertFileIncludes("lib/eval/golden-cases.ts", "GOLDEN_CASES");
  await assertFileIncludes("docs/AGENT_EVAL_HARNESS.md", "npm run eval:agents");
  await assertFileIncludes("package.json", "\"eval:agents\"");
  await assertFileIncludes("middleware.ts", '"/dashboard/ics"');
  await assertFileIncludes("middleware.ts", '"/dashboard/hospital"');
  await assertFileIncludes("components/dashboard/DemoDataBanner.tsx", "demo-data-banner");
  await assertFileIncludes("components/dashboard/Neo4jMockModeBanner.tsx", "source === null");
  await assertFileIncludes("components/dashboard/Neo4jMockModeBanner.tsx", "neo4j-live-mode-banner");
  await assertFileIncludes("components/dashboard/HonestyStatusBar.tsx", "honesty-status-bar");
  await assertFileIncludes("components/dashboard/HonestyStatusBar.tsx", "liveEmis:false");
  await assertFileIncludes("components/dashboard/HonestyStatusBar.tsx", "Not live PAS");
  await assertFileIncludes("components/dashboard/AggregateAskStub.tsx", "aggregate-ask-stub");
  await assertFileIncludes("components/dashboard/AggregateAskStub.tsx", "no PHI");
  await assertFileIncludes("components/dashboard/hospital/WardPatientContext.tsx", "ops-ask-aksh-denied");
  await assertFileIncludes("app/dashboard/admin/page.tsx", "admin-ops-metrics");
  await assertFileIncludes("app/dashboard/ics/page.tsx", "AggregateAskStub");
  await assertFileIncludes("app/dashboard/researcher/page.tsx", "AggregateAskStub");
  await assertFileIncludes("components/dashboard/DemoMenu.tsx", "demo-menu-trigger");
  await assertFileIncludes("components/dashboard/DemoMenu.tsx", "product-help-links");
  await assertFileIncludes("components/dashboard/DemoMenu.tsx", "/dashboard/admin/integrations");
  await assertFileIncludes("components/dashboard/DemoMenu.tsx", "/dashboard/ics/population");
  await assertFileIncludes("components/dashboard/nurse/VoiceCareEscalationCard.tsx", "voice-care-strip");
  await assertFileIncludes("lib/hooks/use-dismissible-demo.ts", "useDismissibleDemo");
  await assertFileIncludes("components/dashboard/FirstRunGuidance.tsx", "first-run-guidance");
  await assertFileIncludes("components/dashboard/FirstRunGuidance.tsx", "liveEmis:false");
  await assertFileIncludes("components/dashboard/ProductHelpLinks.tsx", "product-help-links");
  await assertFileIncludes("lib/product-journey.ts", "Capture → draft → approve");
  await assertFileIncludes("lib/product-journey.ts", "liveEmis:false");
  await assertFileIncludes("lib/onboarding/role-paths.ts", "ROLE_ONBOARDING_PATHS");
  await assertFileIncludes("lib/onboarding/role-paths.ts", "liveEmis:false");
  await assertFileIncludes("lib/onboarding/roles.ts", "hasTutorial: true");
  await assertFileIncludes("components/onboarding/OnboardingCard.tsx", "onboarding-honesty-banner");
  await assertFileIncludes("components/onboarding/TutorialPlayer.tsx", 'aria-label="Skip tutorial"');
  await assertFileIncludes("components/marketing/lavender/LvHero.tsx", "Clinical intelligence");
  await assertFileIncludes("components/marketing/lavender/LvHero.tsx", "Aksh Intelligence Platform");
  await assertFileIncludes("components/marketing/lavender/LvHero.tsx", "Start free");
  await assertFileIncludes("components/marketing/lavender/LvHero.tsx", "Not a live record");
  await assertFileIncludes("components/marketing/TrustStrip.tsx", "Human review");
  await assertFileIncludes("components/marketing/lavender/LvClinicianGate.tsx", "Every output is a draft");
  await assertFileIncludes("components/marketing/lavender/LvClinicianGate.tsx", "named clinician decides");
  await assertFileIncludes("app/security/page.tsx", "Trust is a gate");
  await assertFileExcludes("components/marketing/lavender/LvHero.tsx", "100 patients");
  await assertFileIncludes("components/onboarding/SandboxPreview.tsx", "What you&apos;ll see next");
  await assertFileIncludes("components/onboarding/SandboxPreview.tsx", "You approve:");
  await assertFileIncludes("components/onboarding/ConsentForm.tsx", "precision-health-consent-note");
  await assertFileIncludes("components/dashboard/DashboardShell.tsx", "FirstRunGuidance");
  await assertFileIncludes("components/dashboard/DashboardShell.tsx", "HonestyStatusBar");
  await assertFileIncludes("app/dashboard/gp/page.tsx", "gp-agents-drawer-trigger");
  await assertFileIncludes("app/dashboard/gp/page.tsx", "AskAkshDrawer");
  await assertFileIncludes("app/dashboard/gp/page.tsx", "gp-ask-aksh-trigger");
  await assertFileIncludes("app/api/chat/patient/route.ts", "evaluatePatientChatAccess");
  await assertFileIncludes("app/api/chat/patient/route.ts", "liveEmis");
  await assertFileIncludes("components/chat/AskAkshPanel.tsx", "Assisted review · not a diagnosis");
  await assertFileIncludes("components/dashboard/PatientCompanion.tsx", "AskAkshPanel");
  await assertFileIncludes("lib/clinical-proof/graph-assertions.ts", "TAKES_MEDICATION");
  await assertFileIncludes("app/dashboard/admin/learning/page.tsx", "learning-events-table");
  await assertFileIncludes("app/dashboard/admin/learning/page.tsx", "learning-export-csv");
  await assertFileIncludes("app/dashboard/admin/learning/page.tsx", "learning-empty-state");
  await assertFileIncludes("app/dashboard/admin/learning/page.tsx", "learning-decision-filter");
  await assertFileIncludes("components/dashboard/Sidebar.tsx", "/dashboard/admin/learning");
  await assertFileIncludes("app/api/neo4j/ics-population/route.ts", "X-Data-Source\": \"demo\"");
  await assertFileIncludes("lib/clinical-proof/graph-assertions.ts", "LIVE_GRAPH_SEED_PATIENT_IDS");
  await assertFileIncludes("scripts/smoke-neo4j-live.mjs", "SMOKE_GP_EMAIL");
  await assertFileIncludes("scripts/smoke-neo4j-live.mjs", "Throwaway GP signup");
  await assertFileIncludes("scripts/generate-evidence-pack.mjs", "neo4j-smoke-snapshot.json");
  await assertFileIncludes("scripts/generate-evidence-pack.mjs", "gate-checklist-paths.json");
  await assertFileIncludes("package.json", "\"smoke:neo4j\"");
  await assertFileIncludes("docs/evidence-pack/gate-1-platform-readiness.md", "G1-01");
  await assertFileIncludes("docs/evidence-pack/gate-2-clinical-safety.md", "G2-01");
  await assertFileIncludes("docs/evidence-pack/gate-3-pilot-authority.md", "G3-01");
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
  await assertFileIncludes("components/review/case-evidence-header.tsx", "Download FHIR Bundle");
  await assertFileIncludes("components/review/case-evidence-header.tsx", "export/fhir");
  await assertFileIncludes("app/api/integrations/bridge-staging/route.ts", "liveEmis: false");
  await assertFileIncludes("app/api/integrations/bridge-staging/route.ts", "clinicianAccept");
  await assertFileIncludes("app/api/review-cases/[id]/export/fhir/route.ts", "application/fhir+json");
  await assertFileIncludes("app/demo/script/page.tsx", "DemoLaunchScript");
  await assertFileIncludes("docs/DEMO_LAUNCH_D1_AUDIT.md", "PASS");
  await assertFileIncludes("docs/DEMO_LAUNCH_CREDENTIALS.md", "/signup");
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

  // D5 (docs/PHASED_BUILD_PLAN_D.md, P2-3): Patient State timeline panel.
  await assertFileIncludes("app/api/patients/[id]/state/route.ts", "facts: factHistory.facts");
  await assertFileIncludes("components/dashboard/precision-health/PatientStatePanel.tsx", "patient-state-panel");
  await assertFileIncludes("components/dashboard/precision-health/PatientStatePanel.tsx", "/state");
  await assertFileIncludes("components/dashboard/precision-health/PatientStatePanel.tsx", "patient-state-fact-superseded");
  await assertFileIncludes("app/dashboard/gp/patients/[id]/page.tsx", "PatientStatePanel");
  await assertFileIncludes("app/dashboard/gp/patients/[id]/page.tsx", "ClinicalIntelligenceWorkspace");
  await assertFileIncludes("app/dashboard/gp/page.tsx", "ClinicalIntelligenceWorkspace");
  await assertFileIncludes("app/dashboard/gp/review-queue/page.tsx", "ClinicalIntelligenceWorkspace");
  await assertFileIncludes("lib/workflow/review-queue.ts", "mayEnqueueAgentDraft");
  await assertFileIncludes("lib/db/schema-sql.ts", "aksh.model_registry");
  await assertFileIncludes("app/api/context/package/route.ts", "assembleClinicalContext");
  await assertFileIncludes("lib/guardian-gateway/index.ts", "independentOfAgentModel");
  await assertFileIncludes("lib/agents/contracts/types.ts", "NEXUS_AGENT_CONTRACT");

  // D6 (docs/PHASED_BUILD_PLAN_D.md, P2-4): Data & Interoperability audit panel.
  await assertFileIncludes(
    "components/dashboard/precision-health/DataInteropAuditPanel.tsx",
    "/api/system/integration-contract"
  );
  await assertFileIncludes(
    "components/dashboard/precision-health/DataInteropAuditPanel.tsx",
    "data-interop-audit-panel"
  );
  await assertFileIncludes(
    "components/dashboard/precision-health/DataInteropAuditPanel.tsx",
    "data-interop-live-banner"
  );
  await assertFileIncludes("app/dashboard/admin/precision-health/page.tsx", "DataInteropAuditPanel");

  console.log("Route and UI smoke checks passed.");
}

void run();
