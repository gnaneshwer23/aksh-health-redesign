import type { FeedbackEntry } from "./feedback-types";
import type { ReviewCase } from "./types";

export type CaseFeedbackSummary = {
  caseId: string;
  linkedSessions: number;
  openSessions: number;
  resolvedSessions: number;
  overdueSessions: number;
  activeOwner: string | null;
  activeDueDate: string | null;
  isOverdue: boolean;
  highReadinessSessions: number;
  lowReadinessSessions: number;
  concernCount: number;
  nextActionCount: number;
  strongestMomentCount: number;
  lastSavedAt: string | null;
  priority: "follow_up" | "demo_ready" | "neutral";
  score: number;
};

function hasConcern(entry: FeedbackEntry) {
  return entry.resolutionStatus !== "resolved" && Boolean(entry.objections.trim() || entry.confusionPoint.trim());
}

function hasNextAction(entry: FeedbackEntry) {
  return entry.resolutionStatus !== "resolved" && Boolean(entry.nextActions.trim());
}

function hasStrongestMoment(entry: FeedbackEntry) {
  return Boolean(entry.strongestMoment.trim());
}

export function isFeedbackEntryOverdue(entry: FeedbackEntry, referenceDate = new Date()) {
  if (entry.resolutionStatus === "resolved" || !entry.dueDate.trim()) {
    return false;
  }

  const dueDate = new Date(`${entry.dueDate}T23:59:59`);
  return !Number.isNaN(dueDate.getTime()) && dueDate.getTime() < referenceDate.getTime();
}

export function deriveCaseFeedbackSummary(caseId: string, archive: FeedbackEntry[]): CaseFeedbackSummary {
  const linkedEntries = archive.filter((entry) => entry.relatedCaseId === caseId);
  const openEntries = linkedEntries.filter((entry) => entry.resolutionStatus !== "resolved");
  const openSessions = openEntries.length;
  const resolvedSessions = linkedEntries.filter((entry) => entry.resolutionStatus === "resolved").length;
  const overdueSessions = openEntries.filter((entry) => isFeedbackEntryOverdue(entry)).length;
  const highReadinessSessions = linkedEntries.filter((entry) => Number(entry.readinessScore) >= 4).length;
  const lowReadinessSessions = linkedEntries.filter(
    (entry) => entry.resolutionStatus !== "resolved" && Number(entry.readinessScore) < 4
  ).length;
  const concernCount = linkedEntries.filter(hasConcern).length;
  const nextActionCount = linkedEntries.filter(hasNextAction).length;
  const strongestMomentCount = linkedEntries.filter(hasStrongestMoment).length;
  const lastSavedAt = linkedEntries[0]?.savedAt ?? null;
  const activeOwner = openEntries.find((entry) => entry.followUpOwner.trim())?.followUpOwner ?? null;
  const activeDueDate = openEntries.find((entry) => entry.dueDate.trim())?.dueDate ?? null;
  const score =
    highReadinessSessions * 3 +
    strongestMomentCount * 2 -
    lowReadinessSessions * 2 -
    concernCount * 2 -
    nextActionCount -
    overdueSessions * 3;

  let priority: CaseFeedbackSummary["priority"] = "neutral";

  if (concernCount > 0 || nextActionCount > 0 || lowReadinessSessions > 0) {
    priority = "follow_up";
  } else if (highReadinessSessions > 0 || strongestMomentCount > 0) {
    priority = "demo_ready";
  }

  return {
    caseId,
    linkedSessions: linkedEntries.length,
    openSessions,
    resolvedSessions,
    overdueSessions,
    activeOwner,
    activeDueDate,
    isOverdue: overdueSessions > 0,
    highReadinessSessions,
    lowReadinessSessions,
    concernCount,
    nextActionCount,
    strongestMomentCount,
    lastSavedAt,
    priority,
    score
  };
}

export function deriveFeedbackPriorityCounts(cases: ReviewCase[], archive: FeedbackEntry[]) {
  const summaries = cases.map((item) => deriveCaseFeedbackSummary(item.id, archive));

  return {
    followUpCount: summaries.filter((item) => item.priority === "follow_up").length,
    demoReadyCount: summaries.filter((item) => item.priority === "demo_ready").length,
    resolvedCaseCount: summaries.filter((item) => item.resolvedSessions > 0).length,
    overdueCaseCount: summaries.filter((item) => item.isOverdue).length,
    topFollowUpCases: summaries
      .filter((item) => item.priority === "follow_up")
      .sort(
        (left, right) =>
          right.overdueSessions - left.overdueSessions ||
          right.concernCount + right.nextActionCount - (left.concernCount + left.nextActionCount)
      )
      .slice(0, 3),
    topDemoReadyCases: summaries
      .filter((item) => item.priority === "demo_ready")
      .sort((left, right) => right.score - left.score)
      .slice(0, 3)
  };
}
