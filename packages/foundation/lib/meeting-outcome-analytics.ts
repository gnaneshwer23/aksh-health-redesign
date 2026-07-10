import type { MeetingDisposition, ReviewCase } from "./types";

function parseMeetingTimestamp(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(" ", "T");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function deriveMeetingOutcomeAnalytics(cases: ReviewCase[]) {
  const counts = new Map<MeetingDisposition, number>();
  const missingCount = cases.filter((item) => !item.meetingOutcome).length;

  for (const item of cases) {
    if (!item.meetingOutcome) continue;
    counts.set(item.meetingOutcome.disposition, (counts.get(item.meetingOutcome.disposition) ?? 0) + 1);
  }

  return {
    totalCaptured: cases.length - missingCount,
    missingCount,
    counts: {
      promote: counts.get("promote") ?? 0,
      hold: counts.get("hold") ?? 0,
      remediate: counts.get("remediate") ?? 0,
      needs_evidence: counts.get("needs_evidence") ?? 0
    }
  };
}

export function deriveMeetingOutcomePriority(reviewCase: ReviewCase) {
  const outcome = reviewCase.meetingOutcome;

  if (!outcome) {
    return {
      priority: "neutral" as const,
      sortOrder: 3,
      label: "No meeting outcome",
      detail: "This case has not yet been triaged through a meeting packet."
    };
  }

  if (outcome.disposition === "promote") {
    return {
      priority: "promote" as const,
      sortOrder: 0,
      label: "Promoted",
      detail: "Internal review meeting marked this case for forward movement."
    };
  }

  if (outcome.disposition === "needs_evidence") {
    return {
      priority: "needs_evidence" as const,
      sortOrder: 1,
      label: "Needs evidence",
      detail: "Internal review meeting wants more evidence before promotion."
    };
  }

  if (outcome.disposition === "remediate") {
    return {
      priority: "remediation_carryover" as const,
      sortOrder: 2,
      label: "Remediation carryover",
      detail: "Internal review meeting explicitly carried this case into remediation work."
    };
  }

  return {
    priority: "hold" as const,
    sortOrder: 4,
    label: "Hold",
    detail: "Internal review meeting left this case on hold for later review."
  };
}

export function deriveMeetingOutcomeNextAction(reviewCase: ReviewCase) {
  const priority = deriveMeetingOutcomePriority(reviewCase);

  if (priority.priority === "promote") {
    return {
      title: "Prepare final evidence review",
      detail: "Move this case into evidence and dossier review so it can progress cleanly after the meeting decision.",
      href: `/cases/${reviewCase.id}/evidence`,
      actionLabel: "Open evidence"
    };
  }

  if (priority.priority === "needs_evidence") {
    return {
      title: "Fill the evidence gap",
      detail: "Review the dossier and add the missing support the meeting called out before promotion continues.",
      href: `/cases/${reviewCase.id}/dossier`,
      actionLabel: "Open dossier"
    };
  }

  if (priority.priority === "remediation_carryover") {
    return {
      title: "Return to remediation",
      detail: "Send this case back through the review queue and clear the issues that caused remediation carryover.",
      href: `/review?filter=carryover`,
      actionLabel: "Open carryover queue"
    };
  }

  if (priority.priority === "hold") {
    return {
      title: "Revisit later",
      detail: "Keep this case visible in the carryover queue until the team is ready to re-open it.",
      href: `/review?filter=carryover`,
      actionLabel: "Open carryover queue"
    };
  }

  return {
    title: "No action recorded",
    detail: "This case does not yet have a meeting-driven next action.",
    href: `/cases/${reviewCase.id}`,
    actionLabel: "Open case"
  };
}

export function deriveMeetingOutcomeSla(reviewCase: ReviewCase) {
  const outcome = reviewCase.meetingOutcome;
  const priority = deriveMeetingOutcomePriority(reviewCase);

  if (!outcome || priority.priority === "neutral") {
    return {
      ageDays: 0,
      thresholdDays: 0,
      status: "not_applicable" as const,
      label: "No SLA",
      detail: "No meeting outcome has been captured for this case yet."
    };
  }

  const reviewedAt = parseMeetingTimestamp(outcome.reviewedAt);
  const now = new Date();
  const ageDays = reviewedAt ? Math.max(0, Math.floor((now.getTime() - reviewedAt.getTime()) / 86400000)) : 0;

  const thresholdDays =
    priority.priority === "promote"
      ? 2
      : priority.priority === "needs_evidence"
        ? 3
        : priority.priority === "remediation_carryover"
          ? 4
          : 5;

  if (ageDays > thresholdDays) {
    return {
      ageDays,
      thresholdDays,
      status: "overdue" as const,
      label: "Overdue",
      detail: `This meeting action is ${ageDays} days old and has passed its ${thresholdDays}-day follow-through target.`
    };
  }

  if (ageDays === thresholdDays) {
    return {
      ageDays,
      thresholdDays,
      status: "due_today" as const,
      label: "Due today",
      detail: `This meeting action reaches its ${thresholdDays}-day follow-through target today.`
    };
  }

  return {
    ageDays,
    thresholdDays,
    status: "within_sla" as const,
    label: "Within SLA",
    detail: `${Math.max(0, thresholdDays - ageDays)} day(s) remain before this meeting action breaches its follow-through target.`
  };
}

export function deriveMeetingOutcomeEscalation(cases: ReviewCase[]) {
  const enriched = cases
    .map((reviewCase) => {
      const priority = deriveMeetingOutcomePriority(reviewCase);
      const nextAction = deriveMeetingOutcomeNextAction(reviewCase);
      const sla = deriveMeetingOutcomeSla(reviewCase);

      return {
        id: reviewCase.id,
        patientLabel: reviewCase.patientLabel,
        dispositionLabel: priority.label,
        priority: priority.priority,
        owner: reviewCase.meetingOutcome?.followThroughOwner?.trim() || null,
        slaStatus: sla.status,
        slaLabel: sla.label,
        slaDetail: sla.detail,
        ageDays: sla.ageDays,
        thresholdDays: sla.thresholdDays,
        actionTitle: nextAction.title,
        actionLabel: nextAction.actionLabel,
        href: nextAction.href,
        note: reviewCase.meetingOutcome?.note?.trim() || null
      };
    })
    .filter((item) => item.priority !== "neutral");

  return {
    overdueCount: enriched.filter((item) => item.slaStatus === "overdue").length,
    dueTodayCount: enriched.filter((item) => item.slaStatus === "due_today").length,
    overdueItems: enriched
      .filter((item) => item.slaStatus === "overdue")
      .sort((left, right) => right.ageDays - left.ageDays || left.patientLabel.localeCompare(right.patientLabel))
      .slice(0, 5),
    dueTodayItems: enriched
      .filter((item) => item.slaStatus === "due_today")
      .sort((left, right) => right.thresholdDays - left.thresholdDays || left.patientLabel.localeCompare(right.patientLabel))
      .slice(0, 5)
  };
}

export function deriveMeetingOwnerWorkload(cases: ReviewCase[]) {
  const ownerMap = new Map<
    string,
    {
      owner: string;
      totalAssigned: number;
      overdueCount: number;
      dueTodayCount: number;
      needsEvidenceCount: number;
      carryoverCount: number;
      promoteCount: number;
      topCases: Array<{
        id: string;
        patientLabel: string;
        dispositionLabel: string;
        slaLabel: string;
        ageDays: number;
        href: string;
      }>;
    }
  >();

  for (const reviewCase of cases) {
    const owner = reviewCase.meetingOutcome?.followThroughOwner?.trim();
    if (!owner) continue;

    const priority = deriveMeetingOutcomePriority(reviewCase);
    if (priority.priority === "neutral") continue;

    const sla = deriveMeetingOutcomeSla(reviewCase);
    const existing =
      ownerMap.get(owner) ??
      {
        owner,
        totalAssigned: 0,
        overdueCount: 0,
        dueTodayCount: 0,
        needsEvidenceCount: 0,
        carryoverCount: 0,
        promoteCount: 0,
        topCases: []
      };

    existing.totalAssigned += 1;
    if (sla.status === "overdue") existing.overdueCount += 1;
    if (sla.status === "due_today") existing.dueTodayCount += 1;
    if (priority.priority === "needs_evidence") existing.needsEvidenceCount += 1;
    if (priority.priority === "remediation_carryover" || priority.priority === "hold") existing.carryoverCount += 1;
    if (priority.priority === "promote") existing.promoteCount += 1;
    existing.topCases.push({
      id: reviewCase.id,
      patientLabel: reviewCase.patientLabel,
      dispositionLabel: priority.label,
      slaLabel: sla.label,
      ageDays: sla.ageDays,
      href: `/cases/${reviewCase.id}`
    });

    ownerMap.set(owner, existing);
  }

  return [...ownerMap.values()]
    .map((item) => ({
      ...item,
      topCases: item.topCases
        .sort((left, right) => right.ageDays - left.ageDays || left.patientLabel.localeCompare(right.patientLabel))
        .slice(0, 3)
    }))
    .sort((left, right) => {
      if (right.overdueCount !== left.overdueCount) {
        return right.overdueCount - left.overdueCount;
      }
      if (right.totalAssigned !== left.totalAssigned) {
        return right.totalAssigned - left.totalAssigned;
      }
      return left.owner.localeCompare(right.owner);
    });
}
