import Link from "next/link";

import { AgentBadge } from "@/components/review/agent-badge";
import { CaseStateChips } from "@/components/review/case-state-ribbon";
import { deriveActiveAgents } from "@/lib/agents";
import { deriveCaseFeedbackSummary } from "@/lib/feedback-insights";
import type { FeedbackEntry } from "@/lib/feedback-types";
import type { ReviewCase, WorkflowStatus } from "@/lib/types";
import {
  deriveAcceptanceBlockers,
  deriveFinalizationState,
  deriveMeetingOutcomePriority,
  deriveSafetyFlags,
  deriveValidationReadiness,
  severityLabel
} from "@/lib/workflow";

const statusOrder: WorkflowStatus[] = ["pending_review", "deferred", "rejected", "accepted"];

export function CaseList({
  cases,
  feedbackArchive = [],
  demoMode = false,
  recordingMode = false,
  emptyMessage = "No review cases match this filter."
}: {
  cases: ReviewCase[];
  feedbackArchive?: FeedbackEntry[];
  demoMode?: boolean;
  recordingMode?: boolean;
  emptyMessage?: string;
}) {
  const orderedCases = [...cases].sort((left, right) => {
    const statusDelta = statusOrder.indexOf(left.status) - statusOrder.indexOf(right.status);

    if (statusDelta !== 0) {
      return statusDelta;
    }

    const leftFeedback = deriveCaseFeedbackSummary(left.id, feedbackArchive);
    const rightFeedback = deriveCaseFeedbackSummary(right.id, feedbackArchive);
    const leftMeetingOutcome = deriveMeetingOutcomePriority(left);
    const rightMeetingOutcome = deriveMeetingOutcomePriority(right);

    if (leftMeetingOutcome.sortOrder !== rightMeetingOutcome.sortOrder) {
      return leftMeetingOutcome.sortOrder - rightMeetingOutcome.sortOrder;
    }

    if (leftFeedback.priority !== rightFeedback.priority) {
      const priorityOrder = { follow_up: 0, demo_ready: 1, neutral: 2 };
      return priorityOrder[leftFeedback.priority] - priorityOrder[rightFeedback.priority];
    }

    if (leftFeedback.isOverdue !== rightFeedback.isOverdue) {
      return leftFeedback.isOverdue ? -1 : 1;
    }

    if (leftFeedback.score !== rightFeedback.score) {
      return rightFeedback.score - leftFeedback.score;
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });

  return (
    <div className="panel stack">
      <h2>Review Queue</h2>
      {!orderedCases.length ? (
        <div className="row">
          <div>
            <strong>No Cases In This View</strong>
            <p>{emptyMessage}</p>
          </div>
        </div>
      ) : null}
      <div className="list">
        {orderedCases.map((item) => {
          const safetyFlags = deriveSafetyFlags(item);
          const acceptanceBlockers = deriveAcceptanceBlockers(item);
          const finalizationState = deriveFinalizationState(item);
          const hasHighSeverityFlag = safetyFlags.some((flag) => flag.severity === "high");
          const feedbackSummary = deriveCaseFeedbackSummary(item.id, feedbackArchive);
          const validationReadiness = deriveValidationReadiness(item);
          const meetingOutcome = deriveMeetingOutcomePriority(item);
          const activeAgents = deriveActiveAgents(item);

          return (
            <div className="row" key={item.id}>
              <div className="stack stack--tight">
                <strong>{item.patientLabel}</strong>
                <span className="meta">{item.summary}</span>
                <div className="pill-row">
                  <span className="pill">{item.input.sourceType}</span>
                  {activeAgents.map((agentId) => (
                    <AgentBadge agentId={agentId} compact key={agentId} />
                  ))}
                  <CaseStateChips
                    acceptanceBlockerCount={acceptanceBlockers.length}
                    finalizationState={finalizationState}
                    hasFrozenArtifact={Boolean(item.frozenArtifact)}
                    safetyFlags={safetyFlags}
                    status={item.status}
                  />
                  <span className="pill">{severityLabel(safetyFlags.length)}</span>
                  <span className="pill">{validationReadiness.label}</span>
                  <span className="pill">Updated {item.updatedAt}</span>
                  {feedbackSummary.priority === "follow_up" ? (
                    <span className="pill">Feedback follow-up</span>
                  ) : feedbackSummary.priority === "demo_ready" ? (
                    <span className="pill">High confidence</span>
                  ) : null}
                  {feedbackSummary.isOverdue ? <span className="pill">Overdue</span> : null}
                  {feedbackSummary.linkedSessions ? (
                    <span className="pill">{feedbackSummary.linkedSessions} linked sessions</span>
                  ) : null}
                  {item.meetingOutcome ? <span className="pill">{meetingOutcome.label}</span> : null}
                  {item.reviewSummary?.lastReviewer ? (
                    <span className="pill">Reviewer {item.reviewSummary.lastReviewer}</span>
                  ) : null}
                </div>
                {item.reviewSummary?.lastDecision ? (
                  <span className="meta">
                    Last decision: {item.reviewSummary.lastDecision}
                    {item.reviewSummary.lastDecisionAt ? ` at ${item.reviewSummary.lastDecisionAt}` : ""}
                  </span>
                ) : (
                  <span className="meta">No reviewer decision recorded yet.</span>
                )}
                {acceptanceBlockers.length ? (
                  <span className="meta meta--danger">
                    Acceptance blocked: {acceptanceBlockers[0]}
                  </span>
                ) : validationReadiness.stage === "remediation" ? (
                  <span className="meta meta--danger">
                    Validation stream: remediation. {validationReadiness.nextStep}
                  </span>
                ) : validationReadiness.stage === "pilot_prep" ? (
                  <span className="meta meta--accent">
                    Validation stream: deployment prep. {validationReadiness.nextStep}
                  </span>
                ) : validationReadiness.stage === "rwe_candidate" ? (
                  <span className="meta meta--accent">
                    Validation stream: evidence ready. Frozen evidence is prepared for downstream reporting.
                  </span>
                ) : finalizationState === "warn" ? (
                  <span className="meta meta--warn">
                    Structurally reviewable, but warning-level clinical or validation issues remain.
                  </span>
                ) : hasHighSeverityFlag ? (
                  <span className="meta meta--warn">
                    High-severity issue present. Override reason required before acceptance.
                  </span>
                ) : feedbackSummary.priority === "follow_up" ? (
                  <span className="meta meta--warn">
                    Stakeholder follow-up needed: {feedbackSummary.concernCount} concern(s), {feedbackSummary.nextActionCount} action item(s).
                    {feedbackSummary.isOverdue ? " Due date has passed." : ""}
                  </span>
                ) : feedbackSummary.priority === "demo_ready" ? (
                  <span className="meta meta--accent">
                    Strong candidate for rapid progression based on linked readiness signals and low active friction.
                  </span>
                ) : item.meetingOutcome ? (
                  <span className="meta meta--accent">
                    Meeting outcome: {meetingOutcome.detail}
                    {item.meetingOutcome.note?.trim() ? ` Note: ${item.meetingOutcome.note.trim()}` : ""}
                  </span>
                ) : null}
              </div>
              <div className="stack stack--actions">
                <span
                  className={`tag ${
                    acceptanceBlockers.length ||
                    hasHighSeverityFlag ||
                    feedbackSummary.isOverdue ||
                    validationReadiness.urgency === "high" ||
                    meetingOutcome.priority === "needs_evidence" ||
                    meetingOutcome.priority === "remediation_carryover"
                      ? "danger"
                      : finalizationState === "warn" ||
                          feedbackSummary.priority === "follow_up" ||
                          validationReadiness.urgency === "medium" ||
                          meetingOutcome.priority === "hold"
                        ? "warn"
                        : safetyFlags.length || feedbackSummary.priority === "demo_ready" || meetingOutcome.priority === "promote"
                          ? "warn"
                          : "ok"
                  }`}
                >
                  {acceptanceBlockers.length
                    ? `${acceptanceBlockers.length} blockers`
                    : feedbackSummary.isOverdue
                      ? "overdue"
                    : meetingOutcome.priority === "promote"
                      ? "promoted"
                    : meetingOutcome.priority === "needs_evidence"
                      ? "needs-evidence"
                    : meetingOutcome.priority === "remediation_carryover"
                      ? "carryover"
                    : meetingOutcome.priority === "hold"
                      ? "hold"
                    : validationReadiness.stage === "remediation"
                      ? "remediation"
                    : validationReadiness.stage === "pilot_prep"
                      ? "deploy-prep"
                    : validationReadiness.stage === "rwe_candidate"
                      ? "evidence-ready"
                    : finalizationState === "warn"
                      ? "warnings"
                    : feedbackSummary.priority === "follow_up"
                      ? "follow-up"
                      : feedbackSummary.priority === "demo_ready"
                        ? "high-confidence"
                    : `${safetyFlags.length} flags`}
                </span>
                <Link
                  className="button secondary"
                  href={`/cases/${item.id}${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`}
                >
                  Open Case
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
