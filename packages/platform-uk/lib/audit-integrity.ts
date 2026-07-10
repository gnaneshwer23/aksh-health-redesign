import type { ReviewCase } from "./types";
import { formatCaseTimestamp } from "./workflow";

export type AuditIntegrityIssue = {
  caseId: string;
  patientLabel: string;
  code: string;
  severity: "warning" | "error";
  detail: string;
};

export type AuditIntegrityReport = {
  artifactType: "aksh-uk-eu-audit-integrity-report";
  generatedAt: string;
  syntheticOnly: true;
  scopeKey: string;
  summary: {
    casesChecked: number;
    issueCount: number;
    errorCount: number;
    warningCount: number;
    acceptedWithoutFrozenArtifact: number;
    duplicateAuditEventIds: number;
    missingDecisionEvidence: number;
  };
  status: "pass" | "warn" | "fail";
  issues: AuditIntegrityIssue[];
  checks: Array<{
    id: string;
    label: string;
    status: "pass" | "warn" | "fail";
    detail: string;
  }>;
};

function pushIssue(
  issues: AuditIntegrityIssue[],
  reviewCase: ReviewCase,
  issue: Omit<AuditIntegrityIssue, "caseId" | "patientLabel">
) {
  issues.push({
    caseId: reviewCase.id,
    patientLabel: reviewCase.patientLabel,
    ...issue
  });
}

export function deriveAuditIntegrityReport(cases: ReviewCase[], options?: { scopeKey?: string; generatedAt?: string }) {
  const issues: AuditIntegrityIssue[] = [];
  let duplicateAuditEventIds = 0;
  let acceptedWithoutFrozenArtifact = 0;
  let missingDecisionEvidence = 0;

  for (const reviewCase of cases) {
    const auditEvents = reviewCase.auditEvents ?? [];
    const eventIds = auditEvents.map((event) => event.id);
    const duplicateIds = eventIds.filter((id, index) => eventIds.indexOf(id) !== index);

    if (duplicateIds.length) {
      duplicateAuditEventIds += 1;
      pushIssue(issues, reviewCase, {
        code: "duplicate_audit_event_ids",
        severity: "error",
        detail: `Duplicate audit event ids: ${Array.from(new Set(duplicateIds)).join(", ")}`
      });
    }

    for (const event of auditEvents) {
      if (!event.category || !event.label?.trim() || !event.actor?.trim() || !event.timestamp?.trim()) {
        pushIssue(issues, reviewCase, {
          code: "incomplete_audit_event",
          severity: "error",
          detail: `Audit event ${event.id || "unknown"} is missing required fields.`
        });
      }
    }

    const hasDecisionEvent = auditEvents.some((event) => event.category === "reviewer_decision");
    const hasReviewSummaryDecision = Boolean(reviewCase.reviewSummary?.lastDecision);

    if (reviewCase.status === "accepted") {
      if (!reviewCase.frozenArtifact) {
        acceptedWithoutFrozenArtifact += 1;
        pushIssue(issues, reviewCase, {
          code: "accepted_without_frozen_artifact",
          severity: "error",
          detail: "Accepted case is missing a frozen evidence artifact."
        });
      }

      if (!hasDecisionEvent && !hasReviewSummaryDecision) {
        missingDecisionEvidence += 1;
        pushIssue(issues, reviewCase, {
          code: "accepted_without_decision_evidence",
          severity: "error",
          detail: "Accepted case has no reviewer decision event or review summary decision."
        });
      }
    }

    if (hasReviewSummaryDecision && !hasDecisionEvent) {
      pushIssue(issues, reviewCase, {
        code: "decision_summary_without_audit_event",
        severity: "warning",
        detail: "Review summary records a decision but no reviewer_decision audit event is present."
      });
    }

    if (reviewCase.frozenArtifact) {
      const frozenTimeline = reviewCase.frozenArtifact.activityTimeline ?? [];
      if (!frozenTimeline.length) {
        pushIssue(issues, reviewCase, {
          code: "frozen_artifact_missing_timeline",
          severity: "warning",
          detail: "Frozen artifact is missing an activity timeline snapshot."
        });
      }

      if (reviewCase.frozenArtifact.reviewSummary?.lastDecision !== reviewCase.reviewSummary?.lastDecision) {
        pushIssue(issues, reviewCase, {
          code: "frozen_review_summary_mismatch",
          severity: "warning",
          detail: "Frozen artifact review summary does not match the live review summary."
        });
      }
    }
  }

  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  const status = errorCount > 0 ? "fail" : warningCount > 0 ? "warn" : "pass";

  const checks = [
    {
      id: "unique_audit_event_ids",
      label: "Audit event ids are unique per case",
      status: duplicateAuditEventIds > 0 ? ("fail" as const) : ("pass" as const),
      detail: duplicateAuditEventIds > 0 ? `${duplicateAuditEventIds} case(s) contain duplicate audit ids.` : "All checked cases have unique audit event ids."
    },
    {
      id: "accepted_frozen_artifact",
      label: "Accepted cases retain frozen evidence artifacts",
      status: acceptedWithoutFrozenArtifact > 0 ? ("fail" as const) : ("pass" as const),
      detail:
        acceptedWithoutFrozenArtifact > 0
          ? `${acceptedWithoutFrozenArtifact} accepted case(s) are missing frozen artifacts.`
          : "All accepted cases include frozen artifacts."
    },
    {
      id: "decision_evidence",
      label: "Accepted cases retain reviewer decision evidence",
      status: missingDecisionEvidence > 0 ? ("fail" as const) : ("pass" as const),
      detail:
        missingDecisionEvidence > 0
          ? `${missingDecisionEvidence} accepted case(s) are missing decision evidence.`
          : "Accepted cases include reviewer decision evidence."
    }
  ];

  return {
    artifactType: "aksh-uk-eu-audit-integrity-report",
    generatedAt: options?.generatedAt ?? formatCaseTimestamp(),
    syntheticOnly: true as const,
    scopeKey: options?.scopeKey ?? "shared",
    summary: {
      casesChecked: cases.length,
      issueCount: issues.length,
      errorCount,
      warningCount,
      acceptedWithoutFrozenArtifact,
      duplicateAuditEventIds,
      missingDecisionEvidence
    },
    status,
    issues,
    checks
  } satisfies AuditIntegrityReport;
}
