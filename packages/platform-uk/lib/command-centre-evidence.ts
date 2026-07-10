import type { DashboardSummary } from "./dashboard-summary";
import type { RoadmapTrackerState } from "./roadmap";
import { buildM1ActionInboxEvidencePayload, buildRoadmapEvidencePayload } from "./roadmap-evidence";
import { formatCaseTimestamp } from "./workflow";

export const commandCentreSafeToShow = [
  { label: "Command centre", route: "/review/command-centre", purpose: "Start-here product state view." },
  { label: "Team mode", route: "/review/team-mode", purpose: "Internal execution path." },
  { label: "Demo mode", route: "/review/demo-mode", purpose: "External walkthrough path with guardrails." },
  { label: "Demo readiness", route: "/review/demo-readiness", purpose: "Clean-demo checklist for data, evidence, guardrails, and rehearsal readiness." },
  { label: "Simulated patients", route: "/review/simulated-patients", purpose: "Curated synthetic patient cohort for own-system workflow testing." },
  { label: "Governance pack", route: "/review/governance-pack", purpose: "Clinical safety and governance rehearsal pack; not a production safety case." },
  { label: "Review queue", route: "/review", purpose: "Working clinician review workflow." },
  { label: "Evidence readiness", route: "/review/readiness", purpose: "Current readiness gate and evidence status." },
  { label: "Evidence registry", route: "/api/evidence/registry", purpose: "Machine-readable index of case evidence artifacts and clinical rule summaries." },
  { label: "Benchmark report", route: "/review/benchmarks/report", purpose: "Synthetic scenario benchmark proof." },
  { label: "Roadmap report", route: "/review/roadmap/report", purpose: "12-month build state, gaps, and boundaries." }
];

export function buildCommandCentreStatePayload(
  dashboard: DashboardSummary,
  roadmapState: RoadmapTrackerState,
  options?: { generatedAt?: string; generatedBy?: string }
) {
  const generatedAt = options?.generatedAt ?? formatCaseTimestamp();
  const roadmapEvidence = buildRoadmapEvidencePayload(roadmapState, { generatedAt, generatedBy: options?.generatedBy });
  const actionEvidence = buildM1ActionInboxEvidencePayload(roadmapState, { generatedAt, generatedBy: options?.generatedBy });
  const nextBuildPriorities = [
    {
      title: "Run clean-demo readiness before stakeholder walkthroughs",
      rationale: "Data health, evidence sign-off, readiness snapshots, safe routes, and language guardrails should be confirmed before showing the proof.",
      route: "/review/demo-readiness"
    },
    {
      title: "Clear or follow through active M1 actions",
      rationale: `${actionEvidence.summary.active} active generated M1 action(s) still need owner follow-through.`,
      route: "/review/roadmap/follow-through"
    },
    {
      title: "Protect evidence readiness before external conversations",
      rationale: "Benchmark, readiness, roadmap, and action exports should stay current before advisor or pilot-style review.",
      route: "/review/readiness"
    },
    {
      title: "Refactor large workflow surfaces",
      rationale: "Case detail, ops dashboard, ops report, and roadmap page remain large enough to create regression risk.",
      route: "/review/ops"
    }
  ];

  return {
    artifactType: "aksh-uk-eu-command-centre-product-state",
    generatedAt,
    generatedBy: options?.generatedBy ?? "Aksh Health UK/EU synthetic proof system",
    syntheticOnly: true,
    productionClinicalSoftware: false,
    liveNhsIntegration: false,
    productStage: "synthetic-data review-first proof",
    summary: {
      pendingReviews: dashboard.overview.pendingCount,
      acceptedArtifacts: dashboard.overview.acceptedCount,
      blockedCases: dashboard.overview.blockedCount,
      urgentClinicalItems: dashboard.overview.urgentCount,
      highRiskReviews: dashboard.productivity.highRiskCount,
      evidenceGaps: dashboard.productivity.needsEvidenceCount,
      roadmapItems: roadmapEvidence.summary.totalItems,
      roadmapBlockedOrCritical: roadmapEvidence.summary.blockedOrCriticalItems,
      m1GeneratedActions: actionEvidence.summary.generated,
      m1ActiveActions: actionEvidence.summary.active,
      m1AcknowledgedActions: actionEvidence.summary.resolved,
      safeToShowSurfaces: commandCentreSafeToShow.length,
      notClaimableItems: roadmapEvidence.doNotClaimYet.length,
      nextBuildPriorities: nextBuildPriorities.length
    },
    builtState: {
      clinicalWorkflow: "Synthetic intake, generated draft, safety checks, clinician decision, frozen evidence, and export workflow are built.",
      simulatedPatients: "Curated simulated patient profiles are available for own-system workflow testing without using real patient data.",
      governancePack: "A clinical safety governance pack is available as a production-readiness rehearsal, not a signed-off production safety case.",
      evidenceLayer: "Case evidence, benchmark evidence, readiness evidence, roadmap evidence, M1 action evidence, and printable reports are built.",
      operatingLayer: "Feedback, ops, meeting follow-through, roadmap tracking, and generated M1 action acknowledgement are built.",
      navigationLayer: "Command Centre, Team Mode, and Demo Mode now provide a clearer operating spine.",
      reliabilityGate: "npm run verify and npm run build are the current release confidence gates; the latest verified build generated 54 routes."
    },
    safeToShow: commandCentreSafeToShow,
    guardrails: roadmapEvidence.doNotClaimYet,
    nextBuildPriorities,
    clinicalSignals: dashboard,
    roadmapSignals: {
      summary: roadmapEvidence.summary,
      budget: roadmapEvidence.budget,
      blockedOrCritical: roadmapEvidence.blockedOrCritical,
      nextThirtyDays: roadmapEvidence.nextThirtyDays
    },
    actionSignals: {
      summary: actionEvidence.summary,
      ownerGroups: actionEvidence.ownerGroups,
      activeActions: actionEvidence.activeActions,
      acknowledgedActions: actionEvidence.acknowledgedActions
    }
  };
}

export type ReturnTypeOfCommandCentreState = ReturnType<typeof buildCommandCentreStatePayload>;
