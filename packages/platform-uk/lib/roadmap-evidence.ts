import {
  budgetLines,
  criticalPathItems,
  deriveM1DueDateHealth,
  deriveM1GeneratedActions,
  deriveM1OwnerFollowUps,
  doNotClaimYet,
  getNextThirtyDayItems,
  mergeRoadmapWithTracker,
  summarizeM1ActionResolutions,
  summarizeM1Checklist,
  summarizeRoadmapHistory,
  summarizeTrackerState,
  workbookBudgetTotalK,
  workbookHeaderBudgetK,
  type RoadmapTrackerState
} from "./roadmap";
import { formatCaseTimestamp } from "./workflow";

export function buildM1ActionInboxEvidencePayload(
  state: RoadmapTrackerState,
  options?: { generatedAt?: string; generatedBy?: string }
) {
  const generatedAt = options?.generatedAt ?? formatCaseTimestamp();
  const generatedActions = deriveM1GeneratedActions(state.m1Checklist, new Date("2026-04-30T00:00:00Z"));
  const resolutionById = new Map(state.m1ActionResolutions.map((resolution) => [resolution.actionId, resolution]));
  const actionResolutionSummary = summarizeM1ActionResolutions(generatedActions, state.m1ActionResolutions);
  const owners = Array.from(new Set(generatedActions.map((action) => action.owner))).sort();
  const actions = generatedActions.map((action) => {
    const resolution = resolutionById.get(action.id) ?? null;

    return {
      ...action,
      state: resolution ? "acknowledged" as const : "active" as const,
      resolution
    };
  });

  return {
    artifactType: "aksh-uk-eu-m1-action-inbox-evidence",
    generatedAt,
    generatedBy: options?.generatedBy ?? "Aksh Health UK/EU synthetic proof system",
    syntheticOnly: true,
    productionClinicalSoftware: false,
    liveNhsIntegration: false,
    roadmapStateUpdatedAt: state.updatedAt,
    summary: {
      ...actionResolutionSummary,
      owners: owners.length,
      criticalActive: actions.filter((action) => action.state === "active" && action.priority === "critical").length,
      highActive: actions.filter((action) => action.state === "active" && action.priority === "high").length,
      missingEvidenceActive: actions.filter((action) => action.state === "active" && action.reason === "waiting_on_evidence").length,
      followThroughReady: actions.filter((action) => action.resolution?.nextStep && action.resolution?.targetDate).length,
      missingNextStep: actions.filter((action) => action.state === "acknowledged" && !action.resolution?.nextStep).length,
      missingTargetDate: actions.filter((action) => action.state === "acknowledged" && !action.resolution?.targetDate).length,
      blockedFollowThrough: actions.filter((action) => action.resolution?.blockedReason).length,
      evidencedFollowThrough: actions.filter((action) => action.resolution?.followThroughEvidenceLink).length
    },
    ownerGroups: owners.map((owner) => {
      const ownerActions = actions.filter((action) => action.owner === owner);

      return {
        owner,
        total: ownerActions.length,
        active: ownerActions.filter((action) => action.state === "active").length,
        acknowledged: ownerActions.filter((action) => action.state === "acknowledged").length,
        criticalActive: ownerActions.filter((action) => action.state === "active" && action.priority === "critical").length,
        actions: ownerActions
      };
    }),
    activeActions: actions.filter((action) => action.state === "active"),
    acknowledgedActions: actions.filter((action) => action.state === "acknowledged"),
    allActions: actions
  };
}

export function buildRoadmapEvidencePayload(
  state: RoadmapTrackerState,
  options?: { generatedAt?: string; generatedBy?: string }
) {
  const generatedAt = options?.generatedAt ?? formatCaseTimestamp();
  const mergedRoadmap = mergeRoadmapWithTracker(state.items);
  const nextThirtyDays = getNextThirtyDayItems(state.items, new Date("2026-04-29T00:00:00Z"));
  const summary = summarizeTrackerState(state.items);
  const m1ChecklistSummary = summarizeM1Checklist(state.m1Checklist);
  const m1DueDateHealth = deriveM1DueDateHealth(state.m1Checklist, new Date("2026-04-30T00:00:00Z"));
  const m1GeneratedActions = deriveM1GeneratedActions(state.m1Checklist, new Date("2026-04-30T00:00:00Z"));
  const m1ActionResolutionSummary = summarizeM1ActionResolutions(m1GeneratedActions, state.m1ActionResolutions);
  const m1OwnerFollowUps = deriveM1OwnerFollowUps(state.m1Checklist);
  const budgetLineTotalK = budgetLines.reduce((total, line) => total + line.totalK, 0);
  const blockedOrCritical = mergedRoadmap.filter((item) => item.tracker?.buildStatus === "blocked" || item.tracker?.risk === "critical");
  const historySummary = summarizeRoadmapHistory(state.history);

  return {
    artifactType: "aksh-uk-eu-12-month-roadmap-evidence",
    generatedAt,
    generatedBy: options?.generatedBy ?? "Aksh Health UK/EU synthetic proof system",
    syntheticOnly: true,
    productionClinicalSoftware: false,
    liveNhsIntegration: false,
    roadmapStateUpdatedAt: state.updatedAt,
    summary: {
      totalItems: summary.total,
      built: summary.built,
      partial: summary.partial,
      planned: summary.planned,
      notStarted: summary.not_started,
      blocked: summary.blocked,
      highRisk: summary.high,
      criticalRisk: summary.critical,
      nextThirtyDayItems: nextThirtyDays.length,
      blockedOrCriticalItems: blockedOrCritical.length,
      historyEvents: historySummary.totalEvents,
      changedRoadmapItems: historySummary.changedItems,
      m1ChecklistItems: m1ChecklistSummary.total,
      m1CriticalItems: m1ChecklistSummary.critical,
      m1NotStartedItems: m1ChecklistSummary.not_started,
      m1OwnersWithOpenItems: m1OwnerFollowUps.filter((owner) => owner.openItems > 0).length,
      m1OverdueItems: m1DueDateHealth.counts.overdue,
      m1DueThisWeekItems: m1DueDateHealth.counts.due_this_week,
      m1WaitingOnEvidenceItems: m1DueDateHealth.counts.waiting_on_evidence,
      m1GeneratedActions: m1GeneratedActions.length,
      m1ActiveGeneratedActions: m1ActionResolutionSummary.active,
      m1ResolvedGeneratedActions: m1ActionResolutionSummary.resolved
    },
    budget: {
      workbookHeaderBudgetK,
      workbookLineItemTotalK: workbookBudgetTotalK,
      groupedLineTotalK: budgetLineTotalK,
      mismatchK: workbookBudgetTotalK - workbookHeaderBudgetK,
      lines: budgetLines
    },
    nextThirtyDays,
    blockedOrCritical,
    criticalPath: criticalPathItems,
    doNotClaimYet,
    history: {
      summary: historySummary,
      recent: state.history.slice(0, 20)
    },
    m1Checklist: {
      summary: m1ChecklistSummary,
      dueDateHealth: m1DueDateHealth,
      ownerFollowUps: m1OwnerFollowUps,
      actionResolutionSummary: m1ActionResolutionSummary,
      generatedActions: m1GeneratedActions,
      actionResolutions: state.m1ActionResolutions,
      items: state.m1Checklist
    },
    roadmap: mergedRoadmap
  };
}

export type ReturnTypeOfRoadmapEvidence = ReturnType<typeof buildRoadmapEvidencePayload>;

export function buildM1EvidencePackPayload(
  state: RoadmapTrackerState,
  options?: { generatedAt?: string; generatedBy?: string }
) {
  const roadmapEvidence = buildRoadmapEvidencePayload(state, options);
  const criticalChecklistItems = state.m1Checklist.filter((item) => item.risk === "critical" || item.buildStatus === "blocked");
  const openChecklistItems = state.m1Checklist.filter((item) => item.buildStatus !== "built");

  return {
    artifactType: "aksh-uk-eu-m1-execution-evidence-pack",
    generatedAt: roadmapEvidence.generatedAt,
    generatedBy: roadmapEvidence.generatedBy,
    syntheticOnly: true,
    productionClinicalSoftware: false,
    liveNhsIntegration: false,
    summary: {
      totalChecklistItems: roadmapEvidence.summary.m1ChecklistItems,
      criticalChecklistItems: criticalChecklistItems.length,
      openChecklistItems: openChecklistItems.length,
      ownersWithOpenItems: roadmapEvidence.summary.m1OwnersWithOpenItems,
      overdueItems: roadmapEvidence.summary.m1OverdueItems,
      dueThisWeekItems: roadmapEvidence.summary.m1DueThisWeekItems,
      waitingOnEvidenceItems: roadmapEvidence.summary.m1WaitingOnEvidenceItems,
      generatedActions: roadmapEvidence.summary.m1GeneratedActions,
      activeGeneratedActions: roadmapEvidence.summary.m1ActiveGeneratedActions,
      resolvedGeneratedActions: roadmapEvidence.summary.m1ResolvedGeneratedActions,
      roadmapHistoryEvents: roadmapEvidence.summary.historyEvents,
      budgetMismatchK: roadmapEvidence.budget.mismatchK
    },
    handoffArtifacts: [
      {
        label: "M1 execution checklist",
        route: "/review/roadmap#m1-checklist",
        purpose: "Immediate operating checklist for April blockers."
      },
      {
        label: "M1 action inbox",
        route: "/review/roadmap/actions",
        purpose: "Owner-facing queue for active and acknowledged generated M1 follow-up actions."
      },
      {
        label: "M1 action report",
        route: "/review/roadmap/actions/report",
        purpose: "Printable owner follow-up report for active and acknowledged M1 generated actions."
      },
      {
        label: "M1 follow-through board",
        route: "/review/roadmap/follow-through",
        purpose: "Tracks next step, target date, blocker, and evidence link for acknowledged M1 actions."
      },
      {
        label: "M1 action JSON export",
        route: "/api/roadmap/actions",
        purpose: "Machine-readable M1 action inbox evidence payload."
      },
      {
        label: "Roadmap report",
        route: "/review/roadmap/report",
        purpose: "Printable 12-month roadmap evidence and gap report."
      },
      {
        label: "Roadmap JSON export",
        route: "/api/roadmap/evidence",
        purpose: "Machine-readable roadmap status, budget, checklist, and history artifact."
      },
      {
        label: "Evidence readiness",
        route: "/review/readiness",
        purpose: "Readiness gate for current synthetic proof evidence."
      },
      {
        label: "Readiness JSON export",
        route: "/api/readiness/evidence",
        purpose: "Machine-readable readiness evidence payload."
      },
      {
        label: "Benchmark report",
        route: "/review/benchmarks/report",
        purpose: "Synthetic benchmark, clinical coverage, and action status report."
      },
      {
        label: "Benchmark JSON export",
        route: "/api/benchmarks/evidence",
        purpose: "Machine-readable benchmark evidence payload."
      },
      {
        label: "Meeting packet",
        route: "/review/meeting-packet",
        purpose: "Internal follow-through packet for evidence and remediation discussions."
      }
    ],
    ownerFollowUps: roadmapEvidence.m1Checklist.ownerFollowUps,
    dueDateHealth: roadmapEvidence.m1Checklist.dueDateHealth,
    actionResolutionSummary: roadmapEvidence.m1Checklist.actionResolutionSummary,
    generatedActions: roadmapEvidence.m1Checklist.generatedActions,
    actionResolutions: roadmapEvidence.m1Checklist.actionResolutions,
    immediateBlockers: criticalChecklistItems,
    checklist: state.m1Checklist,
    recentHistory: state.history.slice(0, 10),
    knownLimitations: doNotClaimYet,
    budget: roadmapEvidence.budget
  };
}

export type ReturnTypeOfM1EvidencePack = ReturnType<typeof buildM1EvidencePackPayload>;
export type ReturnTypeOfM1ActionInboxEvidence = ReturnType<typeof buildM1ActionInboxEvidencePayload>;
