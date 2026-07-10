import { deriveCaseFeedbackSummary, deriveFeedbackPriorityCounts } from "@/lib/feedback-insights";
import type { FeedbackEntry } from "@/lib/feedback-types";
import type { ReviewCase } from "@/lib/types";
import {
  deriveAcceptanceBlockers,
  deriveDataCollectionAnalytics,
  deriveDataCollectionProfile,
  deriveMeetingOutcomeNextAction,
  deriveMeetingOutcomePriority,
  deriveMeetingOutcomeSla,
  deriveReviewAnalytics,
  deriveSafetyFlags
} from "@/lib/workflow";

export type DashboardSummary = {
  persona: {
    role: "clinical_reviewer" | "operations_lead";
    title: string;
    headline: string;
    focus: string;
  };
  overview: {
    pendingCount: number;
    urgentCount: number;
    blockedCount: number;
    acceptedCount: number;
    followUpCount: number;
    completionRate: number;
  };
  productivity: {
    readyToFinalizeCount: number;
    highRiskCount: number;
    overdueFollowUps: number;
    confidenceCount: number;
    promotedCount: number;
    needsEvidenceCount: number;
    carryoverCount: number;
    overdueMeetingActions: number;
  };
  priorities: Array<{
    caseId: string;
    patientLabel: string;
    status: ReviewCase["status"];
    reason: string;
    blockerCount: number;
    highRisk: boolean;
    href: string;
  }>;
  recentCases: Array<{
    caseId: string;
    patientLabel: string;
    summary: string;
    status: ReviewCase["status"];
    updatedAt: string;
    blockerCount: number;
    highRisk: boolean;
    feedbackPriority: "follow_up" | "demo_ready" | "neutral";
  }>;
  followUps: Array<{
    caseId: string;
    patientLabel: string;
    owner: string | null;
    dueDate: string | null;
    overdue: boolean;
    openSessions: number;
    concernCount: number;
    href: string;
  }>;
  meetingFollowThrough: Array<{
    caseId: string;
    patientLabel: string;
    dispositionLabel: string;
    owner: string | null;
    detail: string;
    note: string | null;
    href: string;
  }>;
  meetingNextActions: Array<{
    caseId: string;
    patientLabel: string;
    dispositionLabel: string;
    owner: string | null;
    title: string;
    detail: string;
    slaLabel: string;
    slaDetail: string;
    ageDays: number;
    href: string;
    actionLabel: string;
  }>;
  workstreams: Array<{
    id: string;
    label: string;
    count: number;
  }>;
};

const workstreamLabels: Record<string, string> = {
  phase_1_synthetic: "Synthetic validation",
  phase_1_remediation: "Needs remediation",
  ics_pilot_preparation: "Pilot preparation",
  rwe_pipeline_candidate: "RWE candidate"
};

export function deriveDashboardSummary(
  cases: ReviewCase[],
  archive: FeedbackEntry[],
  role: "clinical_reviewer" | "operations_lead" = "clinical_reviewer"
): DashboardSummary {
  const reviewAnalytics = deriveReviewAnalytics(cases);
  const dataCollectionAnalytics = deriveDataCollectionAnalytics(cases);
  const feedbackPriority = deriveFeedbackPriorityCounts(cases, archive);

  const caseSummaries = cases.map((reviewCase) => {
    const blockerCount = deriveAcceptanceBlockers(reviewCase).length;
    const highRisk = deriveSafetyFlags(reviewCase).some((flag) => flag.severity === "high");
    const feedbackSummary = deriveCaseFeedbackSummary(reviewCase.id, archive);
    const meetingPriority = deriveMeetingOutcomePriority(reviewCase);

    return {
      reviewCase,
      blockerCount,
      highRisk,
      feedbackSummary,
      meetingPriority,
      priorityScore:
        (meetingPriority.priority === "promote" ? 6 : 0) +
        (meetingPriority.priority === "needs_evidence" ? 5 : 0) +
        (meetingPriority.priority === "remediation_carryover" ? 4 : 0) +
        (reviewCase.status === "pending_review" ? 4 : 0) +
        blockerCount * 3 +
        (highRisk ? 4 : 0) +
        feedbackSummary.overdueSessions * 3 +
        feedbackSummary.concernCount * 2 +
        feedbackSummary.openSessions
    };
  });

  const priorities = [...caseSummaries]
    .sort((left, right) => right.priorityScore - left.priorityScore || right.reviewCase.updatedAt.localeCompare(left.reviewCase.updatedAt))
    .slice(0, 4)
    .map(({ reviewCase, blockerCount, highRisk, feedbackSummary }) => ({
      caseId: reviewCase.id,
      patientLabel: reviewCase.patientLabel,
      status: reviewCase.status,
      reason:
        feedbackSummary.isOverdue
          ? "Follow-up overdue"
          : blockerCount > 0
            ? `${blockerCount} acceptance blocker${blockerCount === 1 ? "" : "s"}`
            : highRisk
              ? "High-risk safety review"
              : reviewCase.summary,
      blockerCount,
      highRisk,
      href: `/cases/${reviewCase.id}`
    }));

  const recentCases = [...caseSummaries]
    .sort((left, right) => right.reviewCase.updatedAt.localeCompare(left.reviewCase.updatedAt))
    .slice(0, 5)
    .map(({ reviewCase, blockerCount, highRisk, feedbackSummary }) => ({
      caseId: reviewCase.id,
      patientLabel: reviewCase.patientLabel,
      summary: reviewCase.summary,
      status: reviewCase.status,
      updatedAt: reviewCase.updatedAt,
      blockerCount,
      highRisk,
      feedbackPriority: feedbackSummary.priority
    }));

  const followUps = feedbackPriority.topFollowUpCases
    .map((item) => {
      const reviewCase = cases.find((candidate) => candidate.id === item.caseId);
      if (!reviewCase) {
        return null;
      }

      return {
        caseId: item.caseId,
        patientLabel: reviewCase.patientLabel,
        owner: item.activeOwner,
        dueDate: item.activeDueDate,
        overdue: item.isOverdue,
        openSessions: item.openSessions,
        concernCount: item.concernCount,
        href: `/cases/${item.caseId}/evidence`
      };
    })
    .filter(Boolean) as DashboardSummary["followUps"];

  const meetingFollowThrough = [...caseSummaries]
    .filter((item) => item.meetingPriority.priority !== "neutral")
    .sort((left, right) => left.meetingPriority.sortOrder - right.meetingPriority.sortOrder || right.priorityScore - left.priorityScore)
    .slice(0, 4)
    .map(({ reviewCase, meetingPriority }) => ({
      caseId: reviewCase.id,
      patientLabel: reviewCase.patientLabel,
      dispositionLabel: meetingPriority.label,
      owner: reviewCase.meetingOutcome?.followThroughOwner?.trim() || null,
      detail: meetingPriority.detail,
      note: reviewCase.meetingOutcome?.note?.trim() ? reviewCase.meetingOutcome.note.trim() : null,
      href: `/cases/${reviewCase.id}`
    }));

  const meetingNextActions = [...caseSummaries]
    .filter((item) => item.meetingPriority.priority !== "neutral")
    .sort((left, right) => left.meetingPriority.sortOrder - right.meetingPriority.sortOrder || right.priorityScore - left.priorityScore)
    .slice(0, 4)
    .map(({ reviewCase, meetingPriority }) => {
      const nextAction = deriveMeetingOutcomeNextAction(reviewCase);
      const sla = deriveMeetingOutcomeSla(reviewCase);

      return {
        caseId: reviewCase.id,
        patientLabel: reviewCase.patientLabel,
        dispositionLabel: meetingPriority.label,
        owner: reviewCase.meetingOutcome?.followThroughOwner?.trim() || null,
        title: nextAction.title,
        detail: nextAction.detail,
        slaLabel: sla.label,
        slaDetail: sla.detail,
        ageDays: sla.ageDays,
        href: nextAction.href,
        actionLabel: nextAction.actionLabel
      };
    });

  const workstreams = Object.entries(dataCollectionAnalytics.streamCounts).map(([id, count]) => ({
    id,
    label: workstreamLabels[id] ?? id,
    count
  }));

  const pendingCount = cases.filter((item) => item.status === "pending_review").length;
  const blockedCount = caseSummaries.filter((item) => item.blockerCount > 0).length;
  const urgentCount = caseSummaries.filter(
    (item) => item.highRisk || item.blockerCount > 0 || item.feedbackSummary.isOverdue
  ).length;
  const readyToFinalizeCount = caseSummaries.filter(
    (item) => item.reviewCase.status === "pending_review" && item.blockerCount === 0 && !item.highRisk
  ).length;
  const highRiskCount = caseSummaries.filter((item) => item.highRisk).length;
  const overdueFollowUps = caseSummaries.filter((item) => item.feedbackSummary.isOverdue).length;
  const confidenceCount = caseSummaries.filter((item) => item.feedbackSummary.priority === "demo_ready").length;
  const promotedCount = caseSummaries.filter((item) => item.meetingPriority.priority === "promote").length;
  const needsEvidenceCount = caseSummaries.filter((item) => item.meetingPriority.priority === "needs_evidence").length;
  const carryoverCount = caseSummaries.filter(
    (item) => item.meetingPriority.priority === "remediation_carryover" || item.meetingPriority.priority === "hold"
  ).length;
  const overdueMeetingActions = caseSummaries.filter(
    (item) => deriveMeetingOutcomeSla(item.reviewCase).status === "overdue"
  ).length;

  const persona =
    role === "operations_lead"
      ? {
          role,
          title: "Operations lead workspace",
          headline: "Coordinate follow-up ownership and keep the review pipeline moving.",
          focus: "Your priority is reducing overdue actions, clearing blockers, and preparing finalized cases for downstream reporting."
        }
      : {
          role,
          title: "Clinical reviewer workspace",
          headline: "Work the next safe clinical decision with the right evidence in view.",
          focus: "Your priority is resolving high-risk items, clearing acceptance blockers, and progressing ready cases to finalization."
        };

  return {
    persona,
    overview: {
      pendingCount,
      urgentCount,
      blockedCount,
      acceptedCount: cases.filter((item) => item.status === "accepted").length,
      followUpCount: feedbackPriority.followUpCount,
      completionRate: reviewAnalytics.acceptanceRate
    },
    productivity: {
      readyToFinalizeCount,
      highRiskCount,
      overdueFollowUps,
      confidenceCount,
      promotedCount,
      needsEvidenceCount,
      carryoverCount,
      overdueMeetingActions
    },
    priorities,
    recentCases,
    followUps,
    meetingFollowThrough,
    meetingNextActions,
    workstreams
  };
}
