import React from "react";

export function DecisionPanel({
  reviewerName,
  setReviewerName,
  reviewerNotes,
  setReviewerNotes,
  overrideReason,
  setOverrideReason,
  decisionError,
  isAccepted,
  hasAcknowledgedSource,
  setHasAcknowledgedSource,
  isRemediating,
  handleDecision,
  handleRemediate
}: {
  reviewerName: string;
  setReviewerName: (v: string) => void;
  reviewerNotes: string;
  setReviewerNotes: (v: string) => void;
  overrideReason: string;
  setOverrideReason: (v: string) => void;
  decisionError: string;
  isAccepted: boolean;
  hasAcknowledgedSource: boolean;
  setHasAcknowledgedSource: (v: boolean) => void;
  isRemediating: boolean;
  handleDecision: (d: "accept" | "defer" | "reject") => void;
  handleRemediate: () => void;
}) {
  return (
    <div className="panel stack">
      <h3>Reviewer Decision</h3>
      <p className="muted" data-testid="decision-reviewer-name">
        Decisions are recorded under your signed-in account{reviewerName ? ` (last decision by ${reviewerName})` : ""}.
      </p>
      <label className="stack" style={{ gap: 8 }}>
        <strong>Reviewer Notes</strong>
        <textarea
          data-testid="decision-reviewer-notes"
          disabled={isAccepted}
          onChange={e => setReviewerNotes(e.target.value)}
          value={reviewerNotes}
        />
      </label>
      <label className="stack" style={{ gap: 8 }}>
        <strong>Override Reason</strong>
        <textarea
          disabled={isAccepted}
          onChange={e => setOverrideReason(e.target.value)}
          value={overrideReason}
        />
      </label>
      {decisionError && (
        <div style={{ color: "var(--danger)", background: "var(--danger-soft)", padding: 8, borderRadius: 8 }}>{decisionError}</div>
      )}
      <div className="panel" style={{ background: "var(--panel-alt)", border: "1px solid var(--warn)", padding: 12, borderRadius: 8 }}>
        <label className="stack" style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <input
            data-testid="decision-accountability-check"
            type="checkbox"
            disabled={isAccepted}
            checked={hasAcknowledgedSource}
            onChange={e => setHasAcknowledgedSource(e.target.checked)}
            style={{ width: 20, height: 20 }}
          />
          <span style={{ fontSize: "0.95em" }}>
            <strong>Clinical Accountability Check:</strong> I confirm I have independently reviewed the original source input, validated the AI extractions, and take professional responsibility for this drafted clinical record.
          </span>
        </label>
      </div>
      <div className="actions">
        <button data-testid="decision-accept" className="button primary" disabled={isAccepted || !hasAcknowledgedSource || isRemediating} onClick={() => handleDecision("accept")} type="button">
          Accept Draft
        </button>
        <button className="button secondary" disabled={isAccepted || isRemediating} onClick={() => handleDecision("defer")} type="button">
          Defer Case
        </button>
        <button className="button secondary" disabled={isAccepted || isRemediating} onClick={() => handleDecision("reject")} type="button">
          Reject Draft
        </button>
        <button className="button" disabled={isAccepted || isRemediating || !reviewerNotes.trim()} onClick={handleRemediate} type="button" style={{ background: "var(--accent)", color: "white", marginLeft: "auto" }}>
          {isRemediating ? "Remediating with LLM..." : "Remediate via AI"}
        </button>
      </div>
    </div>
  );
}
