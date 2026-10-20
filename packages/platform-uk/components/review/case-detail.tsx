"use client";

import { ActivityTimelinePanel } from "./case-detail/ActivityTimelinePanel";
import { CaseHumanReviewPanels } from "./case-human-review-panels";
import { DecisionPanel } from "./case-detail/DecisionPanel";
import { DraftEditorPanel } from "./case-detail/DraftEditorPanel";
import { SafetyAndValidationPanel } from "./case-detail/SafetyAndValidationPanel";
import { sourceProfileLabel } from "@/lib/synthetic-source-profiles";
import { useCaseReviewWorkflow } from "./case-detail/useCaseReviewWorkflow";
import { CaseStateRibbon } from "@/components/review/case-state-ribbon";
import { FeedbackLinkedPanel } from "@/components/review/feedback-linked-panel";
import { PatientHistory } from "@/components/review/patient-history";
import type { ShieldAuditWarning } from "@/lib/use-review-cases";
import type { ReviewCase } from "@/lib/types";
import type { CaseActions } from "@/components/review/case-detail/useCaseReviewWorkflow";

export function CaseDetail({
  demoMode = false,
  recordingMode = false,
  error,
  isSaving,
  onRetrySave,
  reviewCase,
  onUpdateCase,
  onDecideCase,
  onDecideGate,
  shieldAuditWarning = null,
  isRetryingShieldAudit = false,
  onDismissShieldAuditWarning,
  onRetryShieldAuditWrite
}: {
  demoMode?: boolean;
  recordingMode?: boolean;
  error: string | null;
  isSaving: boolean;
  onRetrySave: () => Promise<void>;
  reviewCase: ReviewCase;
  onUpdateCase: (reviewCase: ReviewCase) => void;
  onDecideCase: CaseActions["decideCase"];
  onDecideGate: CaseActions["decideGate"];
  shieldAuditWarning?: ShieldAuditWarning | null;
  isRetryingShieldAudit?: boolean;
  onDismissShieldAuditWarning?: () => void;
  onRetryShieldAuditWrite?: () => Promise<void>;
}) {
  const workflow = useCaseReviewWorkflow(reviewCase, onUpdateCase, { decideCase: onDecideCase, decideGate: onDecideGate });
  const demoQuery =
    demoMode || recordingMode
      ? `?${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`
      : "";

  return (
    <div className="two-col">
      <div className="panel stack">
        <div className="stack" style={{ gap: 8 }}>
          <div className="actions">
            <a className="button secondary" href={`/review${demoQuery}`}>
              Back To Queue
            </a>
            <a className="button secondary" href={`/cases/${reviewCase.id}/evidence${demoQuery}`}>
              Open Evidence Page
            </a>
            <a className="button secondary" href={`/cases/${reviewCase.id}/dossier${demoQuery}`}>
              Open Validation Dossier
            </a>
            {demoMode || recordingMode ? (
              <a className="button secondary" href={`/review/summary${demoQuery}`}>
                Demo Summary
              </a>
            ) : null}
            <a className="button primary" href={`/api/review-cases/${reviewCase.id}/export`} target="_blank">
              Export JSON
            </a>
          </div>
          {demoMode || recordingMode ? (
            <div className="panel" style={{ background: "var(--accent-soft)", boxShadow: "none" }}>
              {recordingMode
                ? "Recording mode is active. This screen is trimmed for clearer presentation capture."
                : "Demo mode is active. This screen emphasizes the decision story, safety state, and reviewed outcome."}
            </div>
          ) : null}
          <h2>{reviewCase.patientLabel}</h2>
          <p>{reviewCase.summary}</p>
          <div className="pill-row">
            <span className="pill">{reviewCase.input.sourceType}</span>
            {reviewCase.input.sourceProfile ? <span className="pill">{sourceProfileLabel(reviewCase.input.sourceProfile)}</span> : null}
            <span className="pill">Input confidence {Math.round(reviewCase.input.transcriptConfidence * 100)}%</span>
            <span className="pill">Updated {reviewCase.updatedAt}</span>
            {reviewCase.reviewSummary?.lastReviewer ? (
              <span className="pill">Reviewer {reviewCase.reviewSummary.lastReviewer}</span>
            ) : null}
          </div>
        </div>

        <CaseStateRibbon
          acceptanceBlockerCount={workflow.acceptanceBlockers.length}
          finalizationState={workflow.finalizationState}
          hasFrozenArtifact={workflow.hasFrozenArtifact}
          safetyFlags={workflow.safetyFlags}
          status={workflow.status}
        />

        {isSaving ? (
          <div className="panel" style={{ background: "var(--accent-soft)", boxShadow: "none" }}>
            Saving case changes...
          </div>
        ) : null}
        {workflow.isAccepted ? (
          <div className="panel stack" style={{ background: "var(--accent-soft)", boxShadow: "none" }}>
            <strong>Accepted Artifact Locked</strong>
            <p>
              This reviewed case is now treated as the frozen artifact.
              {workflow.hasFrozenArtifact && reviewCase.frozenArtifact
                ? ` Frozen at ${reviewCase.frozenArtifact.frozenAt} by ${reviewCase.frozenArtifact.frozenBy}.`
                : ""}
            </p>
          </div>
        ) : null}
        {error ? (
          <div className="panel stack" style={{ background: "var(--danger-soft)", boxShadow: "none" }}>
            <strong>Save Error</strong>
            <p>{error}</p>
            <div className="actions">
              <button className="button secondary" onClick={() => void onRetrySave()} type="button">
                Retry Save
              </button>
            </div>
          </div>
        ) : null}
        {shieldAuditWarning ? (
          <div
            className="panel stack"
            data-testid="shield-audit-degraded-banner"
            style={{ background: "var(--danger-soft)", boxShadow: "none" }}
          >
            <strong>Audit write degraded</strong>
            <p>
              Your Accept / Edit / Reject decision was saved, but the SHIELD durable audit record for it
              failed to write ({shieldAuditWarning.failedShieldAuditLearningEventIds.length} pending). The
              decision is not lost — retry the audit write below, or dismiss and retry later from the
              admin SHIELD ledger.
            </p>
            <div className="actions">
              <button
                className="button secondary"
                disabled={isRetryingShieldAudit}
                onClick={() => void onRetryShieldAuditWrite?.()}
                type="button"
              >
                {isRetryingShieldAudit ? "Retrying audit write..." : "Retry audit write"}
              </button>
              <button className="button secondary" onClick={() => onDismissShieldAuditWarning?.()} type="button">
                Dismiss
              </button>
            </div>
          </div>
        ) : null}

        <div className="panel" style={{ background: "var(--panel-alt)", boxShadow: "none" }}>
          <h3>Source Input</h3>
          <p>{reviewCase.input.summary}</p>
          <p className="meta">Captured at {reviewCase.input.capturedAt}</p>
        </div>

        <PatientHistory patientLabel={reviewCase.patientLabel} />
        <FeedbackLinkedPanel caseId={reviewCase.id} demoMode={demoMode} recordingMode={recordingMode} />
        <DraftEditorPanel
          sections={workflow.sections}
          isAccepted={workflow.isAccepted}
          recordFieldEdit={workflow.recordFieldEdit}
          updateDraftField={workflow.updateDraftField}
          setFocusSnapshot={workflow.setFocusSnapshot}
        />
      </div>

      <div className="stack">
        <CaseHumanReviewPanels
          actions={workflow.reviewerDraftActions}
          disabled={workflow.isAccepted}
          gates={workflow.humanGates}
          gateTitle="Reviewer Human Gates"
          gateIntro="These reviewer-owned checkpoints must stay visible while the case moves from draft review to accepted evidence."
          actionTitle="Reviewer Draft Actions"
          actionIntro="Derived next-step actions that still require explicit human confirmation before the case is treated as safe evidence."
          onGateDecision={workflow.updateHumanGateDecision}
        />
        <SafetyAndValidationPanel
          safetyFlags={workflow.safetyFlags}
          acceptanceBlockers={workflow.acceptanceBlockers}
          finalizationState={workflow.finalizationState}
          checklistAcceptanceBlockers={workflow.checklistAcceptanceBlockers}
          validationReadiness={workflow.validationReadiness}
          validationProtocol={workflow.validationProtocol}
          clinicalConcerns={workflow.clinicalConcerns}
          reviewerGuidance={workflow.reviewerGuidance}
          reviewerChecklist={workflow.reviewerChecklist}
          transitionChecklist={workflow.transitionChecklist}
          dataCollectionProfile={workflow.dataCollectionProfile}
          isAccepted={workflow.isAccepted}
          toggleChecklistItem={workflow.toggleChecklistItem}
          updateChecklistNote={workflow.updateChecklistNote}
        />
        <DecisionPanel
          reviewerName={workflow.reviewerName}
          setReviewerName={workflow.setReviewerName}
          reviewerNotes={workflow.reviewerNotes}
          setReviewerNotes={workflow.setReviewerNotes}
          overrideReason={workflow.overrideReason}
          setOverrideReason={workflow.setOverrideReason}
          decisionError={workflow.decisionError}
          isAccepted={workflow.isAccepted}
          hasAcknowledgedSource={workflow.hasAcknowledgedSource}
          setHasAcknowledgedSource={workflow.setHasAcknowledgedSource}
          isRemediating={workflow.isRemediating}
          handleDecision={workflow.handleDecision}
          handleRemediate={workflow.handleRemediate}
        />
        {!demoMode && !recordingMode ? (
          <>
            <div className="panel stack">
              <h3>Field Change History</h3>
              {(reviewCase.fieldChanges ?? []).length ? (
                (reviewCase.fieldChanges ?? []).map((change) => (
                  <div className="row" key={change.id}>
                    <div>
                      <strong>{change.fieldLabel}</strong>
                      <p>
                        From "{change.oldValue || "empty"}" to "{change.newValue || "empty"}"
                      </p>
                      <p>{change.sectionId}</p>
                    </div>
                    <span className="meta">
                      {change.actor}
                      <br />
                      {change.timestamp}
                    </span>
                  </div>
                ))
              ) : (
                <div className="row">
                  <div>
                    <strong>No field changes recorded</strong>
                    <p>Edits will appear here once a reviewer changes and blurs a field.</p>
                  </div>
                </div>
              )}
            </div>
            <ActivityTimelinePanel
              filteredAuditEvents={workflow.filteredAuditEvents}
              activityFilter={workflow.activityFilter}
              setActivityFilter={workflow.setActivityFilter}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
