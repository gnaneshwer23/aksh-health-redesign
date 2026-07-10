import { formatCaseTimestamp } from "../time-format";
import type { RemediationActionResolution, ReviewCase } from "../types";
import { deriveAcceptanceBlockers, deriveClinicalConcerns } from "./safety";
import { deriveValidationFailureDrilldown } from "./validation";

function parseCaseTimestamp(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function durationMinutes(start: string | undefined, end: string | undefined) {
  const startDate = parseCaseTimestamp(start);
  const endDate = parseCaseTimestamp(end);

  if (!startDate || !endDate) {
    return null;
  }

  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
}

export function deriveRemediationActionCohorts(cases: ReviewCase[]) {
  const counts = new Map<string, number>();

  for (const reviewCase of cases) {
    const drilldown = deriveValidationFailureDrilldown([reviewCase]);
    for (const caseItem of drilldown) {
      for (const step of caseItem.matchingSteps) {
        for (const action of step.remediationActions) {
          if (action.status !== "resolved") {
            counts.set(action.label, (counts.get(action.label) ?? 0) + 1);
          }
        }
      }
    }
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 8);
}

export function createRemediationActionResolution(
  reviewCase: ReviewCase,
  input: {
    stepId: string;
    stepTitle: string;
    stage: string;
    actionLabel: string;
    detail: string;
    status: "open" | "resolved";
    updatedBy: string;
    owner?: string;
    handoffNote?: string;
  }
): RemediationActionResolution[] {
  const existing = reviewCase.remediationActionResolutions ?? [];
  const updatedAt = formatCaseTimestamp();
  const nextEntry: RemediationActionResolution = {
    id: `remed-${reviewCase.id}-${Math.random().toString(36).slice(2, 8)}`,
    stepId: input.stepId,
    stepTitle: input.stepTitle,
    stage: input.stage,
    actionLabel: input.actionLabel,
    detail: input.detail,
    status: input.status,
    updatedAt,
    updatedBy: input.updatedBy,
    owner: input.owner,
    handoffNote: input.handoffNote
  };

  return [...existing, nextEntry];
}

export function deriveRemediationActionOwner(reviewCase: ReviewCase, actionLabel: string) {
  const explicitOwner = reviewCase.meetingOutcome?.followThroughOwner?.trim();
  if (explicitOwner) {
    return explicitOwner;
  }

  if (actionLabel === "Resolve export blockers") return "FHIR Validation Lead";
  if (actionLabel === "Advance governance state" || actionLabel === "Confirm governance readiness") return "Safety Lead";
  if (actionLabel === "Promote validation stream") return "Operations Lead";
  if (
    actionLabel === "Complete reviewer checklist" ||
    actionLabel === "Capture reviewer rationale" ||
    actionLabel === "Finish checklist evidence" ||
    actionLabel === "Close high-priority concern"
  ) {
    return "Clinical Review Lead";
  }

  return "Operations Lead";
}

export function deriveRemediationResolutionAnalytics(cases: ReviewCase[]) {
  const resolvedCounts = new Map<string, number>();

  for (const reviewCase of cases) {
    const entries = reviewCase.frozenArtifact?.remediationActionResolutions ?? reviewCase.remediationActionResolutions ?? [];
    for (const entry of entries) {
      if (entry.status === "resolved") {
        resolvedCounts.set(entry.actionLabel, (resolvedCounts.get(entry.actionLabel) ?? 0) + 1);
      }
    }
  }

  return [...resolvedCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 6);
}

export function deriveRemediationTurnaroundAnalytics(cases: ReviewCase[]) {
  const durations = new Map<string, number[]>();

  for (const reviewCase of cases) {
    const entries = [...(reviewCase.frozenArtifact?.remediationActionResolutions ?? reviewCase.remediationActionResolutions ?? [])];
    const grouped = new Map<string, typeof entries>();

    for (const entry of entries) {
      const key = `${entry.stepId}::${entry.actionLabel}`;
      const current = grouped.get(key) ?? [];
      current.push(entry);
      grouped.set(key, current);
    }

    for (const groupEntries of grouped.values()) {
      const sorted = [...groupEntries].sort((left, right) => {
        const leftTime = parseCaseTimestamp(left.updatedAt)?.getTime() ?? 0;
        const rightTime = parseCaseTimestamp(right.updatedAt)?.getTime() ?? 0;
        return leftTime - rightTime;
      });

      const firstOpen = sorted.find((entry) => entry.status === "open");
      const firstResolved = sorted.find((entry) => entry.status === "resolved");

      if (!firstOpen || !firstResolved) {
        continue;
      }

      const minutes = durationMinutes(firstOpen.updatedAt, firstResolved.updatedAt);
      if (minutes === null) {
        continue;
      }

      const label = firstResolved.actionLabel;
      const current = durations.get(label) ?? [];
      current.push(minutes);
      durations.set(label, current);
    }
  }

  return [...durations.entries()]
    .map(([label, values]) => ({
      label,
      averageMinutes: Math.round(values.reduce((total, value) => total + value, 0) / values.length),
      resolvedCount: values.length
    }))
    .sort((left, right) => right.averageMinutes - left.averageMinutes)
    .slice(0, 6);
}

function deriveRemediationHandoffHistory(
  reviewCase: ReviewCase,
  stepId: string,
  actionLabel: string
) {
  const entries = [...(reviewCase.frozenArtifact?.remediationActionResolutions ?? reviewCase.remediationActionResolutions ?? [])]
    .filter((entry) => entry.stepId === stepId && entry.actionLabel === actionLabel && entry.status === "open")
    .sort((left, right) => {
      const leftTime = parseCaseTimestamp(left.updatedAt)?.getTime() ?? 0;
      const rightTime = parseCaseTimestamp(right.updatedAt)?.getTime() ?? 0;
      return leftTime - rightTime;
    });

  const history: Array<{
    id: string;
    fromOwner: string;
    toOwner: string;
    note?: string;
    by: string;
    at: string;
  }> = [];

  let previousOwner = "unassigned";
  for (const entry of entries) {
    const nextOwner = entry.owner?.trim();
    if (!nextOwner) {
      continue;
    }

    history.push({
      id: entry.id,
      fromOwner: previousOwner,
      toOwner: nextOwner,
      note: entry.handoffNote,
      by: entry.updatedBy,
      at: entry.updatedAt
    });
    previousOwner = nextOwner;
  }

  return history;
}

const remediationDefaultThresholds: Record<string, number> = {
  "Resolve blocker": 120,
  "Close high-priority concern": 180,
  "Complete reviewer checklist": 90,
  "Capture reviewer rationale": 90,
  "Finish checklist evidence": 90,
  "Complete acceptance review": 120,
  "Freeze artifact": 60,
  "Resolve export blockers": 180,
  "Promote validation stream": 240,
  "Confirm governance readiness": 240,
  "Advance governance state": 240
};

export function deriveRemediationStalledAlerts(cases: ReviewCase[]) {
  const turnaround = deriveRemediationTurnaroundAnalytics(cases);
  const turnaroundMap = new Map(turnaround.map((item) => [item.label, item.averageMinutes]));
  const alerts: Array<{
    caseId: string;
    patientLabel: string;
    stepId: string;
    stepTitle: string;
    actionLabel: string;
    detail: string;
    ageMinutes: number;
    thresholdMinutes: number;
    stage: string;
    owner: string;
    handoffNote?: string;
    handoffHistory: Array<{
      id: string;
      fromOwner: string;
      toOwner: string;
      note?: string;
      by: string;
      at: string;
    }>;
  }> = [];

  for (const reviewCase of cases) {
    const entries = [...(reviewCase.frozenArtifact?.remediationActionResolutions ?? reviewCase.remediationActionResolutions ?? [])];
    const grouped = new Map<string, typeof entries>();

    for (const entry of entries) {
      const key = `${entry.stepId}::${entry.actionLabel}`;
      const current = grouped.get(key) ?? [];
      current.push(entry);
      grouped.set(key, current);
    }

    for (const groupEntries of grouped.values()) {
      const sorted = [...groupEntries].sort((left, right) => {
        const leftTime = parseCaseTimestamp(left.updatedAt)?.getTime() ?? 0;
        const rightTime = parseCaseTimestamp(right.updatedAt)?.getTime() ?? 0;
        return leftTime - rightTime;
      });
      const latest = sorted[sorted.length - 1];

      if (!latest || latest.status !== "open") {
        continue;
      }

      const ageMinutes = durationMinutes(latest.updatedAt, formatCaseTimestamp()) ?? 0;
      const thresholdMinutes = turnaroundMap.get(latest.actionLabel) ?? remediationDefaultThresholds[latest.actionLabel] ?? 120;

      if (ageMinutes >= thresholdMinutes) {
        const handoffHistory = deriveRemediationHandoffHistory(reviewCase, latest.stepId, latest.actionLabel);
        alerts.push({
          caseId: reviewCase.id,
          patientLabel: reviewCase.patientLabel,
          stepId: latest.stepId,
          stepTitle: latest.stepTitle,
          actionLabel: latest.actionLabel,
          detail: latest.detail,
          ageMinutes,
          thresholdMinutes,
          stage: latest.stage,
          owner: latest.owner ?? deriveRemediationActionOwner(reviewCase, latest.actionLabel),
          handoffNote: latest.handoffNote,
          handoffHistory
        });
      }
    }
  }

  return alerts.sort((left, right) => right.ageMinutes - left.ageMinutes).slice(0, 8);
}

export function deriveRemediationOwnerLoad(cases: ReviewCase[]) {
  const stalledAlerts = deriveRemediationStalledAlerts(cases);
  const ownerCounts = new Map<string, { count: number; longestAgeMinutes: number; actions: Set<string> }>();

  for (const alert of stalledAlerts) {
    const current = ownerCounts.get(alert.owner) ?? { count: 0, longestAgeMinutes: 0, actions: new Set<string>() };
    current.count += 1;
    current.longestAgeMinutes = Math.max(current.longestAgeMinutes, alert.ageMinutes);
    current.actions.add(alert.actionLabel);
    ownerCounts.set(alert.owner, current);
  }

  return [...ownerCounts.entries()]
    .map(([owner, value]) => ({
      owner,
      count: value.count,
      longestAgeMinutes: value.longestAgeMinutes,
      actionLabels: [...value.actions]
    }))
    .sort((left, right) => right.count - left.count || right.longestAgeMinutes - left.longestAgeMinutes)
    .slice(0, 6);
}

export function deriveRemediationHandoffChurnAnalytics(cases: ReviewCase[]) {
  const actionCounts = new Map<string, number>();
  const caseSummaries: Array<{
    caseId: string;
    patientLabel: string;
    actionLabel: string;
    ownerChangeCount: number;
    latestOwner: string;
    owners: string[];
    lastHandoffAt: string;
  }> = [];

  for (const reviewCase of cases) {
    const entries = [...(reviewCase.frozenArtifact?.remediationActionResolutions ?? reviewCase.remediationActionResolutions ?? [])];
    const grouped = new Map<string, typeof entries>();

    for (const entry of entries) {
      if (entry.status !== "open") continue;
      const key = `${entry.stepId}::${entry.actionLabel}`;
      const current = grouped.get(key) ?? [];
      current.push(entry);
      grouped.set(key, current);
    }

    for (const groupEntries of grouped.values()) {
      const first = groupEntries[0];
      if (!first) continue;

      const history = deriveRemediationHandoffHistory(reviewCase, first.stepId, first.actionLabel);
      const ownerChangeCount = Math.max(0, history.length - 1);
      if (ownerChangeCount === 0) continue;

      const latest = history[history.length - 1];
      if (!latest) continue;

      actionCounts.set(first.actionLabel, (actionCounts.get(first.actionLabel) ?? 0) + ownerChangeCount);
      caseSummaries.push({
        caseId: reviewCase.id,
        patientLabel: reviewCase.patientLabel,
        actionLabel: first.actionLabel,
        ownerChangeCount,
        latestOwner: latest.toOwner,
        owners: [...new Set(history.map((entry) => entry.toOwner))],
        lastHandoffAt: latest.at
      });
    }
  }

  return {
    totalChurnEvents: caseSummaries.reduce((total, item) => total + item.ownerChangeCount, 0),
    churnedCases: caseSummaries.length,
    topCases: caseSummaries
      .sort((left, right) => right.ownerChangeCount - left.ownerChangeCount || left.patientLabel.localeCompare(right.patientLabel))
      .slice(0, 6),
    topActions: [...actionCounts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 6)
  };
}

export function deriveRemediationChurnRisk(cases: ReviewCase[]) {
  const stalledAlerts = deriveRemediationStalledAlerts(cases);
  const churnAnalytics = deriveRemediationHandoffChurnAnalytics(cases);
  const stalledByCase = new Map<string, typeof stalledAlerts>();
  const churnByCase = new Map<string, typeof churnAnalytics.topCases>();

  for (const alert of stalledAlerts) {
    const current = stalledByCase.get(alert.caseId) ?? [];
    current.push(alert);
    stalledByCase.set(alert.caseId, current);
  }

  for (const item of churnAnalytics.topCases) {
    const current = churnByCase.get(item.caseId) ?? [];
    current.push(item);
    churnByCase.set(item.caseId, current);
  }

  return cases
    .map((reviewCase) => {
      const stalled = stalledByCase.get(reviewCase.id) ?? [];
      const churned = churnByCase.get(reviewCase.id) ?? [];
      const blockerCount = deriveAcceptanceBlockers(reviewCase).length;
      const highConcernCount = deriveClinicalConcerns(reviewCase).filter((item) => item.severity === "high").length;
      const ownerChangeCount = churned.reduce((total, item) => total + item.ownerChangeCount, 0);
      const maxStalledAgeMinutes = stalled.reduce((max, item) => Math.max(max, item.ageMinutes), 0);
      const score = Math.min(
        100,
        ownerChangeCount * 25 +
          stalled.length * 20 +
          Math.min(25, Math.floor(maxStalledAgeMinutes / 60) * 5) +
          blockerCount * 10 +
          highConcernCount * 10
      );

      const drivers = [
        ownerChangeCount > 0 ? `${ownerChangeCount} owner change(s)` : "",
        stalled.length > 0 ? `${stalled.length} stalled remediation action(s)` : "",
        blockerCount > 0 ? `${blockerCount} acceptance blocker(s)` : "",
        highConcernCount > 0 ? `${highConcernCount} high clinical concern(s)` : ""
      ].filter(Boolean);
      const triage = reviewCase.coordinationRiskTriage;
      const triageUpdatedAt = parseCaseTimestamp(triage?.updatedAt);
      const triageAgeHours = triageUpdatedAt
        ? Math.max(0, Math.floor((Date.now() - triageUpdatedAt.getTime()) / 3600000))
        : null;
      const triageThresholdHours =
        triage?.status === "escalated" ? 24 : triage?.status === "focused_recovery" ? 48 : triage?.status === "parked" ? 168 : null;
      const triageSlaStatus =
        triageAgeHours === null || triageThresholdHours === null
          ? ("not_triaged" as const)
          : triageAgeHours > triageThresholdHours
            ? ("overdue" as const)
            : triageAgeHours === triageThresholdHours
              ? ("due_now" as const)
              : ("within_sla" as const);

      return {
        caseId: reviewCase.id,
        patientLabel: reviewCase.patientLabel,
        summary: reviewCase.summary,
        score,
        level: score >= 70 ? ("high" as const) : score >= 40 ? ("medium" as const) : ("low" as const),
        ownerChangeCount,
        stalledActionCount: stalled.length,
        maxStalledAgeMinutes,
        blockerCount,
        highConcernCount,
        latestOwner: stalled[0]?.owner ?? churned[0]?.latestOwner ?? reviewCase.meetingOutcome?.followThroughOwner ?? "Operations Lead",
        topAction: stalled[0]?.actionLabel ?? churned[0]?.actionLabel ?? "No active remediation action",
        drivers,
        triage,
        triageAgeHours,
        triageThresholdHours,
        triageSlaStatus,
        triageSlaLabel:
          triageSlaStatus === "overdue"
            ? "Triage overdue"
            : triageSlaStatus === "due_now"
              ? "Triage due now"
              : triageSlaStatus === "within_sla"
                ? "Triage within SLA"
                : "Not triaged"
      };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || right.maxStalledAgeMinutes - left.maxStalledAgeMinutes)
    .slice(0, 8);
}
