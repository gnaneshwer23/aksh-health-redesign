"use client";

import type { BenchmarkSignoffDecision } from "@/lib/benchmark-signoff-types";
import { useBenchmarkSignoff } from "@/lib/use-benchmark-signoff";

import { ProofEmptyState } from "./proof-empty-state";

const decisionLabels: Record<BenchmarkSignoffDecision, string> = {
  accepted_for_internal_evidence: "Accepted for internal evidence",
  accepted_with_follow_up: "Accepted with follow-up",
  not_accepted: "Not accepted"
};

export function BenchmarkSignoffPanel() {
  const { draft, archive, isLoaded, isSaving, error, updateDraft, saveSignoff } = useBenchmarkSignoff();
  const latest = archive[0];

  if (!isLoaded) {
    return <div className="panel">Loading benchmark sign-off...</div>;
  }

  return (
    <div className="panel stack">
      <div className="row">
        <div>
          <h2>Benchmark Session Sign-Off</h2>
          <p>Record who reviewed this benchmark run, whether it can be used as internal evidence, and what follow-up remains.</p>
        </div>
        <span className={`tag ${latest?.decision === "accepted_for_internal_evidence" ? "ok" : latest?.decision === "not_accepted" ? "danger" : "warn"}`}>
          {latest ? decisionLabels[latest.decision] : "unsigned"}
        </span>
      </div>

      {error ? (
        <div className="panel" style={{ background: "var(--danger-soft)", boxShadow: "none" }}>
          {error}
        </div>
      ) : null}

      <div className="diff-grid">
        <label className="stack" style={{ gap: 8 }}>
          <strong>Reviewer</strong>
          <input
            data-testid="benchmark-signoff-reviewer"
            onChange={(event) => void updateDraft({ reviewerName: event.target.value })}
            placeholder="Clinical reviewer name"
            style={{ borderRadius: 14, border: "1px solid var(--line)", padding: 12, font: "inherit", color: "var(--ink)" }}
            value={draft.reviewerName}
          />
        </label>
        <label className="stack" style={{ gap: 8 }}>
          <strong>Decision</strong>
          <select
            data-testid="benchmark-signoff-decision"
            onChange={(event) => void updateDraft({ decision: event.target.value as BenchmarkSignoffDecision })}
            style={{ borderRadius: 14, border: "1px solid var(--line)", padding: 12, font: "inherit", color: "var(--ink)" }}
            value={draft.decision}
          >
            <option value="accepted_for_internal_evidence">Accepted for internal evidence</option>
            <option value="accepted_with_follow_up">Accepted with follow-up</option>
            <option value="not_accepted">Not accepted</option>
          </select>
        </label>
      </div>

      <div className="diff-grid">
        <label className="stack" style={{ gap: 8 }}>
          <strong>Follow-Up Owner</strong>
          <input
            onChange={(event) => void updateDraft({ followUpOwner: event.target.value })}
            placeholder="Owner if follow-up remains"
            style={{ borderRadius: 14, border: "1px solid var(--line)", padding: 12, font: "inherit", color: "var(--ink)" }}
            value={draft.followUpOwner}
          />
        </label>
        <label className="stack" style={{ gap: 8 }}>
          <strong>Due Date</strong>
          <input
            onChange={(event) => void updateDraft({ dueDate: event.target.value })}
            style={{ borderRadius: 14, border: "1px solid var(--line)", padding: 12, font: "inherit", color: "var(--ink)" }}
            type="date"
            value={draft.dueDate}
          />
        </label>
      </div>

      <label className="stack" style={{ gap: 8 }}>
        <strong>Reviewer Notes</strong>
        <textarea
          data-testid="benchmark-signoff-notes"
          onChange={(event) => void updateDraft({ notes: event.target.value })}
          placeholder="What was accepted, what remains uncertain, and what should be done next?"
          rows={4}
          style={{ borderRadius: 14, border: "1px solid var(--line)", padding: 12, font: "inherit", color: "var(--ink)" }}
          value={draft.notes}
        />
      </label>

      <div className="actions">
        <button data-testid="benchmark-signoff-save" className="button primary" disabled={isSaving || !draft.reviewerName.trim()} onClick={() => void saveSignoff()} type="button">
          Save Sign-Off
        </button>
        {isSaving ? <span className="pill">saving...</span> : null}
      </div>

      {latest ? (
        <div className="list" data-testid="benchmark-signoff-latest">
          <div className="row">
            <div>
              <strong>Latest sign-off</strong>
              <p>
                {latest.reviewerName} · {decisionLabels[latest.decision]} · {latest.signedAt}
              </p>
              <p>
                Benchmark {latest.passedCases}/{latest.benchmarkedCases} passing, {latest.openBenchmarkActions} open action(s).
              </p>
              {latest.followUpOwner || latest.dueDate ? (
                <p>
                  Follow-up: {latest.followUpOwner || "Unassigned"}
                  {latest.dueDate ? ` by ${latest.dueDate}` : ""}
                </p>
              ) : null}
              {latest.notes ? <p>{latest.notes}</p> : null}
            </div>
            <span className="tag ok">archived</span>
          </div>
        </div>
      ) : (
        <div className="list" data-testid="benchmark-signoff-empty">
          <ProofEmptyState
            detail="Fill in reviewer name and decision above, then save to archive the benchmark evidence decision."
            status="empty"
            title="No sign-off saved yet"
          />
        </div>
      )}
    </div>
  );
}
