import { CaseHumanReviewPanels } from "./case-human-review-panels";
import type { CaseEvidencePayload } from "./case-evidence-types";
import { SyntheticOutcomeCapturePanel } from "./synthetic-outcome-capture-panel";
import type { HumanGate } from "@/lib/human-gates";

export function CaseEvidenceDecisionSummarySection({ evidence }: { evidence: CaseEvidencePayload }) {
  return (
    <div className="span-6 panel stack">
      <h3>Decision Summary</h3>
      <div className="list">
        <div className="row">
          <div>
            <strong>Last decision</strong>
            <p>{evidence.reviewSummary.lastDecision ?? "No decision recorded"}</p>
          </div>
        </div>
        <div className="row">
          <div>
            <strong>Decision time</strong>
            <p>{evidence.reviewSummary.lastDecisionAt ?? "No decision time recorded"}</p>
          </div>
        </div>
        <div className="row">
          <div>
            <strong>Reviewer notes</strong>
            <p>{evidence.reviewSummary.reviewerNotes || "No reviewer notes recorded"}</p>
          </div>
        </div>
        <div className="row">
          <div>
            <strong>Override reason</strong>
            <p>{evidence.reviewSummary.overrideReason || "No override reason recorded"}</p>
          </div>
        </div>
        <div className="row">
          <div>
            <strong>Follow-through owner</strong>
            <p>{evidence.meetingOutcome?.followThroughOwner || "No follow-through owner recorded"}</p>
            {evidence.meetingOutcome?.handoffAt ? (
              <p>
                Last handoff: {evidence.meetingOutcome.handoffBy || "Ops"} at {evidence.meetingOutcome.handoffAt}
              </p>
            ) : null}
            {evidence.meetingOutcome?.handoffNote ? <p>{evidence.meetingOutcome.handoffNote}</p> : null}
          </div>
        </div>
        {evidence.meetingOutcome?.handoffHistory?.length ? (
          <div className="row">
            <div>
              <strong>Handoff history</strong>
              <div className="stack" style={{ marginTop: 8 }}>
                {[...evidence.meetingOutcome.handoffHistory]
                  .slice()
                  .reverse()
                  .map((entry) => (
                    <div key={entry.id}>
                      <p>
                        {entry.fromOwner} -&gt; {entry.toOwner}
                      </p>
                      <p>
                        {entry.by} at {entry.at}
                      </p>
                      {entry.note ? <p>{entry.note}</p> : null}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function CaseEvidenceValidationReadinessSection({ evidence }: { evidence: CaseEvidencePayload }) {
  return (
    <div className="span-6 panel stack">
      <h3>Validation Readiness</h3>
      <div className="list">
        <div className="row">
          <div>
            <strong>Current stage</strong>
            <p>{evidence.validationReadiness.label}</p>
            <p>{evidence.validationReadiness.nextStep}</p>
          </div>
          <span
            className={`tag ${evidence.validationReadiness.urgency === "high" ? "danger" : evidence.validationReadiness.urgency === "medium" ? "warn" : "ok"}`}
          >
            {evidence.validationReadiness.urgency}
          </span>
        </div>
        <div className="row">
          <div>
            <strong>Open blockers</strong>
            <p>{evidence.validationReadiness.blockerCount} blocker(s) still affect stream progression.</p>
          </div>
          <span className="pill">{evidence.validationReadiness.blockerCount}</span>
        </div>
        <div className="row">
          <div>
            <strong>High-priority concerns</strong>
            <p>{evidence.validationReadiness.highConcernCount} high-severity concern(s) remain in the ranked concern set.</p>
          </div>
          <span className="pill">{evidence.validationReadiness.highConcernCount}</span>
        </div>
      </div>
    </div>
  );
}

export function CaseEvidenceHumanGateSection({ humanGates }: { humanGates: HumanGate[] }) {
  return (
    <CaseHumanReviewPanels
      className="span-6"
      gates={humanGates}
      gateTitle="Human-Gate Status"
      gateIntro="Reviewer-owned gates stay attached to the evidence artifact so external readers can see what still needed explicit human confirmation."
      showActions={false}
    />
  );
}

export function CaseEvidenceValidationProtocolSection({ evidence }: { evidence: CaseEvidencePayload }) {
  return (
    <div className="span-6 panel stack">
      <h3>Validation Protocol</h3>
      <div className="list">
        <div className="row">
          <div>
            <strong>Promotion recommendation</strong>
            <p>{evidence.validationProtocol.promotionRecommendation.replaceAll("_", " ")}</p>
            <p>{evidence.validationProtocol.summary}</p>
          </div>
          <span
            className={`tag ${evidence.validationProtocol.overallScore >= 80 ? "ok" : evidence.validationProtocol.overallScore >= 60 ? "warn" : "danger"}`}
          >
            {evidence.validationProtocol.overallScore}
          </span>
        </div>
        <div className="row">
          <div>
            <strong>Clinical completeness</strong>
            <p>Score for structured completeness and unresolved validation gaps.</p>
          </div>
          <span className="pill">{evidence.validationProtocol.clinicalCompletenessScore}</span>
        </div>
        <div className="row">
          <div>
            <strong>Safety review</strong>
            <p>Score for safety flags, required reviewer checks, and override closure.</p>
          </div>
          <span className="pill">{evidence.validationProtocol.safetyReviewScore}</span>
        </div>
        <div className="row">
          <div>
            <strong>Reviewer confidence</strong>
            <p>Score for recorded decision, notes, and checklist rationale.</p>
          </div>
          <span className="pill">{evidence.validationProtocol.reviewerConfidenceScore}</span>
        </div>
        <div className="row">
          <div>
            <strong>Export quality</strong>
            <p>Score for bundle validation quality and export readiness.</p>
          </div>
          <span className="pill">{evidence.validationProtocol.exportQualityScore}</span>
        </div>
      </div>
    </div>
  );
}

export function CaseEvidenceValidationHistorySection({ evidence }: { evidence: CaseEvidencePayload }) {
  return (
    <div className="span-6 panel stack">
      <h3>Validation History</h3>
      <div className="list">
        {evidence.validationHistory.length ? (
          [...evidence.validationHistory]
            .slice()
            .reverse()
            .map((entry) => (
              <div className="row" key={entry.id}>
                <div>
                  <strong>{entry.readinessLabel}</strong>
                  <p>
                    Score {entry.overallScore} • {entry.promotionRecommendation.replaceAll("_", " ")} • {entry.finalizationState}
                  </p>
                  <p>
                    {entry.blockerCount} blocker(s), {entry.highConcernCount} high-priority concern(s)
                  </p>
                  <p>{entry.summary}</p>
                </div>
                <span className="pill">{entry.recordedAt}</span>
              </div>
            ))
        ) : (
          <div className="row">
            <div>
              <strong>No validation history yet</strong>
              <p>This artifact does not yet have persisted validation progression.</p>
            </div>
            <span className="tag warn">pending</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function CaseEvidenceStreamTransitionSection({ evidence }: { evidence: CaseEvidencePayload }) {
  return (
    <div className="span-6 panel stack">
      <h3>Stream Transition Checklist</h3>
      <div className="list">
        {evidence.transitionChecklist.map((item) => (
          <div className="row" key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <p>{item.phase === "to_pilot_prep" ? "To deployment prep" : "To RWE candidate"}</p>
              <p>{item.detail}</p>
            </div>
            <span className={`tag ${item.status === "done" ? "ok" : "warn"}`}>{item.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CaseEvidenceDataCollectionSection({ evidence }: { evidence: CaseEvidencePayload }) {
  return (
    <div className="span-6 panel stack">
      <h3>Data Collection Strategy</h3>
      <div className="list">
        <div className="row">
          <div>
            <strong>Dataset</strong>
            <p>{evidence.dataCollectionProfile.datasetLabel}</p>
            <p>{evidence.dataCollectionProfile.provenance}</p>
          </div>
          <span className="pill">{evidence.dataCollectionProfile.ingestionStatus}</span>
        </div>
        <div className="row">
          <div>
            <strong>Validation stream</strong>
            <p>{evidence.dataCollectionProfile.validationStream}</p>
          </div>
          <span className="pill">{evidence.dataCollectionProfile.trainingReadiness}</span>
        </div>
        <div className="row">
          <div>
            <strong>Safety governance</strong>
            <p>{evidence.dataCollectionProfile.safetyGovernance}</p>
          </div>
        </div>
        {evidence.dataCollectionProfile.collectionNotes.map((note) => (
          <div className="row" key={note}>
            <div>
              <strong>Collection note</strong>
              <p>{note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CaseEvidenceOutcomeCaptureSection({ evidence }: { evidence: CaseEvidencePayload }) {
  return <SyntheticOutcomeCapturePanel outcomeCapture={evidence.outcomeCapture} />;
}
