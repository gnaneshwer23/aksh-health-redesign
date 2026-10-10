import type { deriveOpsAnalytics } from "@/lib/ops-analytics";

type OpsAnalytics = ReturnType<typeof deriveOpsAnalytics>;

export function FeedbackSignalsCard({ feedbackAnalytics }: { feedbackAnalytics: OpsAnalytics["feedbackAnalytics"] }) {
  return (
    <div className="span-6 panel stack">
      <h3>Feedback Signals</h3>
      <div className="list">
        <div className="row">
          <div>
            <strong>High-readiness sessions</strong>
            <p>Sessions scored 4 or 5 and likely reusable as-is.</p>
          </div>
          <span className="pill">{feedbackAnalytics.highReadiness}</span>
        </div>
        <div className="row">
          <div>
            <strong>Active archive</strong>
            <p>Saved sessions contributing to feedback trend analysis.</p>
          </div>
          <span className="pill">{feedbackAnalytics.total}</span>
        </div>
        <div className="row">
          <div>
            <strong>Open follow-up sessions</strong>
            <p>Linked objections or action items that are still being treated as active work.</p>
          </div>
          <span className="pill">{feedbackAnalytics.openSessions}</span>
        </div>
        <div className="row">
          <div>
            <strong>Resolved sessions</strong>
            <p>Feedback entries marked closed out and no longer counted as active follow-up.</p>
          </div>
          <span className="pill">{feedbackAnalytics.resolvedSessions}</span>
        </div>
      </div>
    </div>
  );
}

export function ValidationStreamReadoutCard({
  dataCollectionAnalytics
}: {
  dataCollectionAnalytics: OpsAnalytics["dataCollectionAnalytics"];
}) {
  return (
    <div className="span-6 panel stack">
      <h3>Validation Stream Readout</h3>
      <div className="list">
        <div className="row">
          <div>
            <strong>Phase 1 synthetic</strong>
            <p>Baseline synthetic cohort currently in validation-only mode.</p>
          </div>
          <span className="pill">{dataCollectionAnalytics.streamCounts.phase_1_synthetic}</span>
        </div>
        <div className="row">
          <div>
            <strong>Phase 1 remediation</strong>
            <p>Blocked cases still requiring remediation and hazard-review attention.</p>
          </div>
          <span className="pill">{dataCollectionAnalytics.streamCounts.phase_1_remediation}</span>
        </div>
        <div className="row">
          <div>
            <strong>regional pilot preparation</strong>
            <p>Cases suitable for training flows and pre-pilot walk-throughs.</p>
          </div>
          <span className="pill">{dataCollectionAnalytics.streamCounts.ics_pilot_preparation}</span>
        </div>
        <div className="row">
          <div>
            <strong>RWE pipeline candidate</strong>
            <p>Accepted artifacts promoted into the roadmap's downstream evidence rehearsal stream.</p>
          </div>
          <span className="pill">{dataCollectionAnalytics.streamCounts.rwe_pipeline_candidate}</span>
        </div>
      </div>
    </div>
  );
}

export function GovernanceTrainingCard({
  dataCollectionAnalytics
}: {
  dataCollectionAnalytics: OpsAnalytics["dataCollectionAnalytics"];
}) {
  return (
    <div className="span-6 panel stack">
      <h3>Governance And Training</h3>
      <div className="list">
        <div className="row">
          <div>
            <strong>Hazard review required</strong>
            <p>Cases that still need explicit safety-governance remediation before pilot packaging.</p>
          </div>
          <span className="pill">{dataCollectionAnalytics.governanceCounts.hazard_review_required}</span>
        </div>
        <div className="row">
          <div>
            <strong>Safety case candidate</strong>
            <p>Accepted reviewed artifacts positioned for safety-case and evidence packaging.</p>
          </div>
          <span className="pill">{dataCollectionAnalytics.governanceCounts.safety_case_candidate}</span>
        </div>
        <div className="row">
          <div>
            <strong>Training ready</strong>
            <p>Cases currently suitable for internal clinician training and rehearsal sessions.</p>
          </div>
          <span className="pill">{dataCollectionAnalytics.trainingCounts.training_ready}</span>
        </div>
        <div className="row">
          <div>
            <strong>Training required</strong>
            <p>Cases that still belong in the remediation or sandbox-prep track before reviewer reuse.</p>
          </div>
          <span className="pill">{dataCollectionAnalytics.trainingCounts.training_required}</span>
        </div>
      </div>
    </div>
  );
}
