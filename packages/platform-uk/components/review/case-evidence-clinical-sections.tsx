import { CaseHumanReviewPanels } from "./case-human-review-panels";
import type { CaseEvidencePayload } from "./case-evidence-types";
import type { HumanGate } from "@/lib/human-gates";
import type { FeedbackEntry } from "@/lib/feedback-types";
import type { ChecklistItem, ReviewerDraftAction, ReviewerGuidance } from "@/lib/types";

export function CaseEvidenceLinkedFeedbackSection({
  linkedFeedback,
  openFeedback,
  resolvedFeedback,
  strongestFeedback,
  topConcern,
  nextAction,
  nextOwner,
  nextDueDate
}: {
  linkedFeedback: FeedbackEntry[];
  openFeedback: FeedbackEntry[];
  resolvedFeedback: FeedbackEntry[];
  strongestFeedback?: FeedbackEntry;
  topConcern?: FeedbackEntry;
  nextAction?: FeedbackEntry;
  nextOwner?: FeedbackEntry;
  nextDueDate?: FeedbackEntry;
}) {
  return (
    <div className="span-6 panel stack">
      <h3>Linked Stakeholder Feedback</h3>
      <div className="list">
        <div className="row">
          <div>
            <strong>Saved linked sessions</strong>
            <p>Rehearsal or stakeholder notes explicitly tied to this case.</p>
          </div>
          <div className="pill-row">
            <span className="pill">{linkedFeedback.length} total</span>
            <span className="pill">{openFeedback.length} open</span>
            <span className="pill">{resolvedFeedback.length} resolved</span>
          </div>
        </div>
        <div className="row">
          <div>
            <strong>Strongest moment</strong>
            <p>{strongestFeedback?.strongestMoment || "No strongest-moment feedback linked yet."}</p>
          </div>
        </div>
        <div className="row">
          <div>
            <strong>Top concern</strong>
            <p>{(topConcern && (topConcern.objections || topConcern.confusionPoint)) || "No unresolved objections or confusion points linked yet."}</p>
          </div>
        </div>
        <div className="row">
          <div>
            <strong>Next action</strong>
            <p>{nextAction?.nextActions || "No unresolved next action linked yet."}</p>
          </div>
        </div>
        <div className="row">
          <div>
            <strong>Owner and due date</strong>
            <p>
              {nextOwner?.followUpOwner || "Unassigned"}
              {nextDueDate?.dueDate ? ` · Due ${nextDueDate.dueDate}` : " · No due date set"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CaseEvidenceSafetyAcceptanceSection({ evidence }: { evidence: CaseEvidencePayload }) {
  return (
    <div className="span-6 panel stack">
      <h3>Safety And Acceptance</h3>
      <div className="list">
        <div className="row">
          <div>
            <strong>Finalization state</strong>
            <p>
              {evidence.finalizationState === "blocked"
                ? "Cannot finalize until the blocking structural or override requirements are resolved."
                : evidence.finalizationState === "warn"
                  ? "Structurally reviewable, but warning-level clinical or validation concerns remain."
                  : "Ready for finalized review output with no active blocking or warning-level validation issues."}
            </p>
          </div>
          <span className={`tag ${evidence.finalizationState === "blocked" ? "danger" : evidence.finalizationState === "warn" ? "warn" : "ok"}`}>
            {evidence.finalizationState}
          </span>
        </div>
        {evidence.safetyFlags.map((flag) => (
          <div className="row" key={flag.id}>
            <div>
              <strong>{flag.label}</strong>
              <p>{flag.detail}</p>
            </div>
            <span className={`tag ${flag.severity === "high" ? "danger" : flag.severity === "medium" ? "warn" : "ok"}`}>
              {flag.severity}
            </span>
          </div>
        ))}
        {evidence.acceptanceBlockers.length ? (
          evidence.acceptanceBlockers.map((blocker) => (
            <div className="row" key={blocker}>
              <div>
                <strong>Acceptance blocker</strong>
                <p>{blocker}</p>
              </div>
              <span className="tag danger">blocked</span>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>{evidence.finalizationState === "warn" ? "No active blockers, warnings remain" : "No active acceptance blockers"}</strong>
              <p>
                {evidence.finalizationState === "warn"
                  ? "The case can move forward, but warning-level issues still deserve clinician attention."
                  : "The case is structurally ready for final review."}
              </p>
            </div>
            <span className={`tag ${evidence.finalizationState === "warn" ? "warn" : "ok"}`}>
              {evidence.finalizationState === "warn" ? "warn" : "ready"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function CaseEvidenceClinicalConcernsSection({ evidence }: { evidence: CaseEvidencePayload }) {
  return (
    <div className="span-6 panel stack">
      <h3>Ranked Clinical Concerns</h3>
      <div className="list">
        {evidence.clinicalConcerns.length ? (
          evidence.clinicalConcerns.slice(0, 6).map((concern) => (
            <div className="row" key={concern.id}>
              <div>
                <strong>{concern.label}</strong>
                <p>{concern.detail}</p>
                <p>{concern.source}</p>
              </div>
              <span className={`tag ${concern.severity === "high" ? "danger" : concern.severity === "medium" ? "warn" : "ok"}`}>
                {concern.severity}
              </span>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No ranked concerns</strong>
              <p>No active blocker, safety, or validation concerns are derived for this case.</p>
            </div>
            <span className="tag ok">clear</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function CaseEvidenceReviewerGuidanceSection({ reviewerGuidance }: { reviewerGuidance: ReviewerGuidance[] }) {
  return (
    <div className="span-6 panel stack">
      <h3>Reviewer Guidance</h3>
      <div className="list">
        {reviewerGuidance.length ? (
          reviewerGuidance.map((item) => (
            <div className="row" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.instruction}</p>
                <p>{item.category.replace("_", " ")}</p>
              </div>
              <span className={`tag ${item.severity === "high" ? "danger" : item.severity === "medium" ? "warn" : "ok"}`}>
                {item.severity}
              </span>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No extra reviewer prompts</strong>
              <p>No additional confirmation or override guidance is currently derived for this case.</p>
            </div>
            <span className="tag ok">clear</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function CaseEvidenceDraftActionsSection({
  humanGates,
  reviewerDraftActions
}: {
  humanGates: HumanGate[];
  reviewerDraftActions: ReviewerDraftAction[];
}) {
  return (
    <CaseHumanReviewPanels
      actions={reviewerDraftActions}
      className="span-6"
      gates={humanGates}
      actionTitle="Reviewer Draft Actions"
      actionIntro="Action suggestions derived from the current safety and validation state. Checklist completion is the human-confirmation record for each action."
      showGates={false}
    />
  );
}

export function CaseEvidenceReviewerChecklistSection({ reviewerChecklist }: { reviewerChecklist: ChecklistItem[] }) {
  return (
    <div className="span-6 panel stack">
      <h3>Reviewer Checklist</h3>
      <div className="list">
        {reviewerChecklist.length ? (
          reviewerChecklist.map((item) => (
            <div className="row" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.category.replace("_", " ")}</p>
                <p>
                  {item.completed
                    ? `Completed by ${item.completedBy ?? "reviewer"} at ${item.completedAt ?? "unknown time"}`
                    : "Not yet completed"}
                </p>
                <p>{item.confirmationNote?.trim() ? `Note: ${item.confirmationNote}` : "No confirmation note recorded."}</p>
              </div>
              <span className={`tag ${item.completed ? "ok" : item.category === "missing_evidence" ? "warn" : "danger"}`}>
                {item.completed ? "done" : "open"}
              </span>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No checklist items</strong>
              <p>No checklist completion is currently required for this case.</p>
            </div>
            <span className="tag ok">clear</span>
          </div>
        )}
      </div>
    </div>
  );
}
