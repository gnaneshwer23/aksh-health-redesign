"use client";

import { useEffect, useMemo, useState } from "react";

import type { deriveOpsAnalytics } from "@/lib/ops-analytics";
import type { ReviewCase } from "@/lib/types";
import {
  createCoordinationRiskTriage,
  createReviewerEvent,
  createRemediationActionResolution
} from "@/lib/workflow";

type OpsAnalytics = ReturnType<typeof deriveOpsAnalytics>;

type StalledAlert = OpsAnalytics["remediationStalledAlerts"][number];

export function useOpsDashboardControls({
  cases,
  updateCase,
  opsAnalytics
}: {
  cases: ReviewCase[];
  updateCase: (reviewCase: ReviewCase) => Promise<void>;
  opsAnalytics: OpsAnalytics;
}) {
  const {
    clinicalRuleCoverage,
    dataCollectionAnalytics,
    dataHealthSummary,
    evidenceReadinessGate,
    feedbackAnalytics,
    meetingOutcomeEscalation,
    meetingOwnerWorkload,
    remediationActionCohorts,
    remediationChurnRisk,
    remediationHandoffChurnAnalytics,
    remediationOwnerLoad,
    remediationResolutionAnalytics,
    remediationStalledAlerts,
    remediationTurnaroundAnalytics,
    reviewAnalytics,
    scenarioBenchmark,
    scenarioBenchmarkActionQueue,
    validationActionQueues,
    validationDossierAnalytics,
    validationProtocolAnalytics,
    validationStageFailureAnalytics,
    validationTrendAnalytics
  } = opsAnalytics;

  const [ownerDrafts, setOwnerDrafts] = useState<Record<string, string>>({});
  const [handoffDrafts, setHandoffDrafts] = useState<Record<string, { note: string; by: string }>>({});
  const [remediationOwnerDrafts, setRemediationOwnerDrafts] = useState<Record<string, string>>({});
  const [remediationHandoffDrafts, setRemediationHandoffDrafts] = useState<Record<string, string>>({});
  const [riskTriageDrafts, setRiskTriageDrafts] = useState<
    Record<string, { status: "escalated" | "parked" | "focused_recovery"; owner: string; note: string; by: string }>
  >({});

  useEffect(() => {
    setOwnerDrafts(
      Object.fromEntries(
        cases.map((item) => [item.id, item.meetingOutcome?.followThroughOwner?.trim() || "Operations Lead"])
      )
    );
    setHandoffDrafts(
      Object.fromEntries(
        cases.map((item) => [
          item.id,
          {
            note: item.meetingOutcome?.handoffNote ?? "",
            by: item.meetingOutcome?.handoffBy ?? "Ops Dashboard"
          }
        ])
      )
    );
  }, [cases]);

  useEffect(() => {
    setRemediationOwnerDrafts(
      Object.fromEntries(
        remediationStalledAlerts.map((item) => [`${item.caseId}:${item.stepId}:${item.actionLabel}`, item.owner])
      )
    );
    setRemediationHandoffDrafts(
      Object.fromEntries(
        remediationStalledAlerts.map((item) => [`${item.caseId}:${item.stepId}:${item.actionLabel}`, item.handoffNote ?? ""])
      )
    );
  }, [remediationStalledAlerts]);

  useEffect(() => {
    setRiskTriageDrafts(
      Object.fromEntries(
        remediationChurnRisk.map((item) => [
          item.caseId,
          {
            status: item.triage?.status ?? "focused_recovery",
            owner: item.triage?.owner ?? item.latestOwner,
            note: item.triage?.note ?? "",
            by: item.triage?.updatedBy ?? "Ops Dashboard"
          }
        ])
      )
    );
  }, [remediationChurnRisk]);

  const opsReport = useMemo(
    () => ({
      generatedAt: new Date().toLocaleString("en-GB"),
      reviewMetrics: {
        acceptanceRate: reviewAnalytics.acceptanceRate,
        averageDecisionMinutes: reviewAnalytics.averageDecisionMinutes,
        decisionCounts: reviewAnalytics.decisionCounts,
        blockerCategories: reviewAnalytics.blockerCategories,
        safetyCategories: reviewAnalytics.safetyCategories,
        scenarioBenchmark,
        scenarioBenchmarkActionQueue,
        clinicalRuleCoverage,
        dataHealthSummary,
        evidenceReadinessGate
      },
      dataCollectionMetrics: {
        validationStreams: dataCollectionAnalytics.streamCounts,
        safetyGovernance: dataCollectionAnalytics.governanceCounts,
        trainingReadiness: dataCollectionAnalytics.trainingCounts,
        actionQueues: validationActionQueues,
        validationProtocol: validationProtocolAnalytics,
        validationTrends: validationTrendAnalytics,
        validationStageFailures: validationStageFailureAnalytics,
        remediationActionCohorts,
        remediationResolutionAnalytics,
        remediationTurnaroundAnalytics,
        remediationStalledAlerts,
        remediationOwnerLoad,
        remediationHandoffChurnAnalytics,
        remediationChurnRisk,
        validationDossier: validationDossierAnalytics
      },
      feedbackMetrics: {
        totalSessions: feedbackAnalytics.total,
        highReadinessSessions: feedbackAnalytics.highReadiness,
        recurringObjections: feedbackAnalytics.objections,
        strongestProofMoments: feedbackAnalytics.strongestMoments,
        commonNextActions: feedbackAnalytics.nextActions,
        linkedCases: feedbackAnalytics.linkedCases,
        openSessions: feedbackAnalytics.openSessions,
        resolvedSessions: feedbackAnalytics.resolvedSessions
      },
      meetingOutcomeEscalation: {
        overdueCount: meetingOutcomeEscalation.overdueCount,
        dueTodayCount: meetingOutcomeEscalation.dueTodayCount,
        overdueItems: meetingOutcomeEscalation.overdueItems,
        dueTodayItems: meetingOutcomeEscalation.dueTodayItems
      },
      meetingOwnerWorkload
    }),
    [
      clinicalRuleCoverage,
      dataCollectionAnalytics,
      dataHealthSummary,
      evidenceReadinessGate,
      feedbackAnalytics,
      meetingOutcomeEscalation,
      meetingOwnerWorkload,
      remediationActionCohorts,
      remediationChurnRisk,
      remediationHandoffChurnAnalytics,
      remediationOwnerLoad,
      remediationResolutionAnalytics,
      remediationStalledAlerts,
      remediationTurnaroundAnalytics,
      reviewAnalytics,
      scenarioBenchmark,
      scenarioBenchmarkActionQueue,
      validationActionQueues,
      validationDossierAnalytics,
      validationProtocolAnalytics,
      validationStageFailureAnalytics,
      validationTrendAnalytics
    ]
  );

  function exportOpsReport() {
    const blob = new Blob([JSON.stringify(opsReport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pilot-ops-report.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function saveOwner(caseId: string) {
    const reviewCase = cases.find((item) => item.id === caseId);
    const nextOwner = ownerDrafts[caseId]?.trim();
    const handoffNote = handoffDrafts[caseId]?.note?.trim() ?? "";
    const handoffBy = handoffDrafts[caseId]?.by?.trim() || "Ops Dashboard";

    if (!reviewCase?.meetingOutcome || !nextOwner) {
      return;
    }

    const previousOwner = reviewCase.meetingOutcome.followThroughOwner?.trim() || "unassigned";
    const ownershipChanged = previousOwner !== nextOwner;
    const handoffAt = ownershipChanged
      ? new Date().toISOString().slice(0, 16).replace("T", " ")
      : reviewCase.meetingOutcome.handoffAt;
    const nextAuditEvents = ownershipChanged
      ? [
          ...reviewCase.auditEvents,
          createReviewerEvent(
            "system",
            "Follow-through owner reassigned",
            handoffBy,
            `${previousOwner} -> ${nextOwner}${handoffNote ? ` | ${handoffNote}` : ""}`
          )
        ]
      : reviewCase.auditEvents;
    const nextHandoffHistory = ownershipChanged
      ? [
          ...(reviewCase.meetingOutcome.handoffHistory ?? []),
          {
            id: `handoff-${caseId}-${Date.now()}`,
            fromOwner: previousOwner,
            toOwner: nextOwner,
            note: handoffNote || undefined,
            by: handoffBy,
            at: handoffAt!
          }
        ]
      : reviewCase.meetingOutcome.handoffHistory;

    await updateCase({
      ...reviewCase,
      updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      auditEvents: nextAuditEvents,
      meetingOutcome: {
        ...reviewCase.meetingOutcome,
        followThroughOwner: nextOwner,
        handoffNote: handoffNote || undefined,
        handoffBy,
        handoffAt,
        handoffHistory: nextHandoffHistory
      }
    });
  }

  async function saveRemediationOwner(alert: StalledAlert) {
    const reviewCase = cases.find((item) => item.id === alert.caseId);
    const draftKey = `${alert.caseId}:${alert.stepId}:${alert.actionLabel}`;
    const nextOwner = remediationOwnerDrafts[draftKey]?.trim();
    const handoffNote = remediationHandoffDrafts[draftKey]?.trim();
    if (!reviewCase || !nextOwner) {
      return;
    }

    await updateCase({
      ...reviewCase,
      updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      auditEvents: [
        ...reviewCase.auditEvents,
        createReviewerEvent(
          "system",
          "Stalled remediation owner reassigned",
          "Ops Dashboard",
          `${alert.actionLabel} (${alert.stepTitle}) -> ${nextOwner}${handoffNote ? ` | ${handoffNote}` : ""}`
        )
      ],
      remediationActionResolutions: createRemediationActionResolution(reviewCase, {
        stepId: alert.stepId,
        stepTitle: alert.stepTitle,
        stage: alert.stage,
        actionLabel: alert.actionLabel,
        detail: alert.detail,
        status: "open",
        updatedBy: "Ops Dashboard",
        owner: nextOwner,
        handoffNote: handoffNote || undefined
      })
    });
  }

  async function saveRiskTriage(caseId: string) {
    const reviewCase = cases.find((item) => item.id === caseId);
    const draft = riskTriageDrafts[caseId];
    if (!reviewCase || !draft?.owner.trim()) {
      return;
    }

    const triage = createCoordinationRiskTriage({
      status: draft.status,
      owner: draft.owner.trim(),
      note: draft.note.trim(),
      updatedBy: draft.by.trim() || "Ops Dashboard"
    });

    await updateCase({
      ...reviewCase,
      updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      auditEvents: [
        ...reviewCase.auditEvents,
        createReviewerEvent(
          "system",
          "Coordination risk triaged",
          triage.updatedBy,
          `${triage.status.replaceAll("_", " ")} -> ${triage.owner}${triage.note ? ` | ${triage.note}` : ""}`
        )
      ],
      coordinationRiskTriage: triage
    });
  }

  return {
    exportOpsReport,
    handoffDrafts,
    ownerDrafts,
    remediationHandoffDrafts,
    remediationOwnerDrafts,
    riskTriageDrafts,
    saveOwner,
    saveRemediationOwner,
    saveRiskTriage,
    setHandoffDrafts,
    setOwnerDrafts,
    setRemediationHandoffDrafts,
    setRemediationOwnerDrafts,
    setRiskTriageDrafts
  };
}
