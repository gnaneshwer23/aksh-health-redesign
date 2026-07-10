"use client";

import type { OpsAnalytics } from "./ops-dashboard-section-types";

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
            <strong>ICS pilot preparation</strong>
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

export function ValidationProtocolSignalsCard({
  validationProtocolAnalytics
}: {
  validationProtocolAnalytics: OpsAnalytics["validationProtocolAnalytics"];
}) {
  return (
    <div className="span-6 panel stack">
      <h3>Validation Protocol Signals</h3>
      <div className="list">
        <div className="row">
          <div>
            <strong>Ready for pilot prep</strong>
            <p>Cases already strong enough for pilot-prep walkthrough and training use.</p>
          </div>
          <span className="pill">{validationProtocolAnalytics.recommendationCounts.ready_for_pilot_prep}</span>
        </div>
        <div className="row">
          <div>
            <strong>Ready for RWE candidate</strong>
            <p>Frozen, evidence-complete cases suitable for downstream RWE rehearsal.</p>
          </div>
          <span className="pill">{validationProtocolAnalytics.recommendationCounts.ready_for_rwe_candidate}</span>
        </div>
        <div className="row">
          <div>
            <strong>Needs reviewer validation</strong>
            <p>Cases that are close, but still missing reviewer confirmations or transition gates.</p>
          </div>
          <span className="pill">{validationProtocolAnalytics.recommendationCounts.complete_reviewer_validation}</span>
        </div>
        <div className="row">
          <div>
            <strong>Hold in remediation</strong>
            <p>Cases that still need blocker resolution before any promotion step.</p>
          </div>
          <span className="pill">{validationProtocolAnalytics.recommendationCounts.hold_in_remediation}</span>
        </div>
        <div className="row">
          <div>
            <strong>Continue synthetic validation</strong>
            <p>Cases that still need evidence depth before they become pilot-prep candidates.</p>
          </div>
          <span className="pill">{validationProtocolAnalytics.recommendationCounts.continue_synthetic_validation}</span>
        </div>
      </div>
    </div>
  );
}

export function ValidationTrendSignalsCard({
  validationTrendAnalytics
}: {
  validationTrendAnalytics: OpsAnalytics["validationTrendAnalytics"];
}) {
  return (
    <div className="span-6 panel stack">
      <h3>Validation Trend Signals</h3>
      <div className="list">
        <div className="row">
          <div>
            <strong>Cases with history</strong>
            <p>Cases with at least one persisted validation snapshot.</p>
          </div>
          <span className="pill">{validationTrendAnalytics.casesWithHistory}</span>
        </div>
        <div className="row">
          <div>
            <strong>Improved cases</strong>
            <p>Cases whose latest validation score is higher than their first recorded score.</p>
          </div>
          <span className="pill">{validationTrendAnalytics.improvedCases}</span>
        </div>
        <div className="row">
          <div>
            <strong>Promoted cases</strong>
            <p>Cases that progressed into pilot-prep or RWE-oriented readiness states.</p>
          </div>
          <span className="pill">{validationTrendAnalytics.promotedCases}</span>
        </div>
        <div className="row">
          <div>
            <strong>Avg remediation dwell</strong>
            <p>Average remediation-stage snapshots per case with recorded validation history.</p>
          </div>
          <span className="pill">{validationTrendAnalytics.averageRemediationSnapshots}</span>
        </div>
        {validationTrendAnalytics.topResolvedStages.length ? (
          validationTrendAnalytics.topResolvedStages.map((item) => (
            <div className="row" key={item.label}>
              <div>
                <strong>{item.label}</strong>
                <p>Readiness stage where blocker reduction is landing most often.</p>
              </div>
              <span className="pill">{item.count}</span>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No trend movement yet</strong>
              <p>Persist more validation changes to surface score movement and promotion momentum.</p>
            </div>
            <span className="tag warn">pending</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function StageFailureSignalsCard({
  demoMode,
  recordingMode,
  validationStageFailureAnalytics
}: {
  demoMode?: boolean;
  recordingMode?: boolean;
  validationStageFailureAnalytics: OpsAnalytics["validationStageFailureAnalytics"];
}) {
  const modeQuery = `${demoMode ? "&demo=1" : ""}${recordingMode ? "&recording=1" : ""}`;

  return (
    <div className="span-6 panel stack">
      <h3>Stage Failure Signals</h3>
      <div className="list">
        {validationStageFailureAnalytics.topFailedStages.length ? (
          validationStageFailureAnalytics.topFailedStages.map((item) => (
            <div className="row" key={item.label}>
              <div>
                <strong>{item.label}</strong>
                <p>Most common transition stage currently holding cases back.</p>
              </div>
              <div className="actions">
                <span className="pill">{item.count}</span>
                <a className="button secondary" href={`/review/failures?stage=${encodeURIComponent(item.label)}${modeQuery}`}>
                  Open
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No stage failures yet</strong>
              <p>No open transition failures are currently recorded across the cohort.</p>
            </div>
            <span className="tag ok">clear</span>
          </div>
        )}
        {validationStageFailureAnalytics.topFailedSteps.map((item) => (
          <div className="row" key={`${item.stage}-${item.label}`}>
            <div>
              <strong>{item.label}</strong>
              <p>{item.stage}</p>
            </div>
            <div className="actions">
              <span className="pill">{item.count}</span>
              <a
                className="button secondary"
                href={`/review/failures?stage=${encodeURIComponent(item.stage)}&step=${encodeURIComponent(item.label)}${modeQuery}`}
              >
                Open
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProtocolTrendMetricsCard({
  validationProtocolAnalytics
}: {
  validationProtocolAnalytics: OpsAnalytics["validationProtocolAnalytics"];
}) {
  return (
    <div className="span-6 panel stack">
      <h3>Protocol Trend Metrics</h3>
      <div className="list">
        <div className="row">
          <div>
            <strong>High-score cohort</strong>
            <p>Cases scoring 80+ on the validation protocol.</p>
          </div>
          <span className="pill">{validationProtocolAnalytics.scoreBands.high}</span>
        </div>
        <div className="row">
          <div>
            <strong>Medium-score cohort</strong>
            <p>Cases scoring 60-79 and likely close to promotion with targeted work.</p>
          </div>
          <span className="pill">{validationProtocolAnalytics.scoreBands.medium}</span>
        </div>
        <div className="row">
          <div>
            <strong>Low-score cohort</strong>
            <p>Cases still well below promotion readiness.</p>
          </div>
          <span className="pill">{validationProtocolAnalytics.scoreBands.low}</span>
        </div>
        <div className="row">
          <div>
            <strong>One step from pilot prep</strong>
            <p>Cases with exactly one open transition step left before pilot-prep promotion.</p>
          </div>
          <span className="pill">{validationProtocolAnalytics.transitionProximity.oneStepFromPilotPrep}</span>
        </div>
        <div className="row">
          <div>
            <strong>One step from RWE candidate</strong>
            <p>Cases with exactly one open transition step left before RWE-candidate promotion.</p>
          </div>
          <span className="pill">{validationProtocolAnalytics.transitionProximity.oneStepFromRweCandidate}</span>
        </div>
      </div>
    </div>
  );
}

export function AverageScoreByStreamCard({
  validationProtocolAnalytics
}: {
  validationProtocolAnalytics: OpsAnalytics["validationProtocolAnalytics"];
}) {
  return (
    <div className="span-6 panel stack">
      <h3>Average Score By Stream</h3>
      <div className="list">
        {[
          ["Phase 1 synthetic", "Average validation protocol score for the baseline synthetic cohort.", validationProtocolAnalytics.streamAverages.phase_1_synthetic],
          ["Phase 1 remediation", "Average score for cases still blocked in remediation.", validationProtocolAnalytics.streamAverages.phase_1_remediation],
          ["ICS pilot preparation", "Average score for cases already promoted into pilot-prep handling.", validationProtocolAnalytics.streamAverages.ics_pilot_preparation],
          ["RWE pipeline candidate", "Average score for frozen evidence-ready artifacts.", validationProtocolAnalytics.streamAverages.rwe_pipeline_candidate]
        ].map(([label, detail, value]) => (
          <div className="row" key={label}>
            <div>
              <strong>{label}</strong>
              <p>{detail}</p>
            </div>
            <span className="pill">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OpenTransitionStepsCard({
  validationProtocolAnalytics
}: {
  validationProtocolAnalytics: OpsAnalytics["validationProtocolAnalytics"];
}) {
  return (
    <div className="span-6 panel stack">
      <h3>Most Common Open Transition Steps</h3>
      <div className="list">
        {validationProtocolAnalytics.topOpenTransitionSteps.length ? (
          validationProtocolAnalytics.topOpenTransitionSteps.map((item) => (
            <div className="row" key={item.label}>
              <div>
                <strong>{item.label}</strong>
                <p>Transition step most often still open across the current cohort.</p>
              </div>
              <span className="pill">{item.count}</span>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No open transition steps</strong>
              <p>The current cohort has cleared all derived transition steps.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ValidationActionQueuesCards({
  sharedQuery,
  validationActionQueues
}: {
  sharedQuery: string;
  validationActionQueues: OpsAnalytics["validationActionQueues"];
}) {
  return (
    <>
      <div className="span-6 panel stack">
        <h3>Closest To Pilot-Prep Promotion</h3>
        <div className="list">
          {validationActionQueues.pilotPromotionCandidates.length ? (
            validationActionQueues.pilotPromotionCandidates.map((item) => (
              <div className="row" key={item.id}>
                <div>
                  <strong>{item.patientLabel}</strong>
                  <p>{item.summary}</p>
                  <p>
                    {item.label} · {item.validationStream.replaceAll("_", " ")}
                  </p>
                  <p>
                    {item.blockerCount} blocker(s), {item.highConcernCount} high concern(s), {item.safetyFlagCount} safety flag(s)
                  </p>
                  <p>{item.nextStep}</p>
                </div>
                <div className="actions">
                  <span className={`tag ${item.urgency === "high" ? "danger" : item.urgency === "medium" ? "warn" : "ok"}`}>
                    {item.urgency}
                  </span>
                  <a className="button secondary" href={`/cases/${item.id}${sharedQuery}`}>
                    Case
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="row">
              <div>
                <strong>No promotion candidates yet</strong>
                <p>The current dataset does not yet contain cases close enough to pilot-prep promotion.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="span-6 panel stack">
        <h3>Most Stuck In Remediation</h3>
        <div className="list">
          {validationActionQueues.remediationPriority.length ? (
            validationActionQueues.remediationPriority.map((item) => (
              <div className="row" key={item.id}>
                <div>
                  <strong>{item.patientLabel}</strong>
                  <p>{item.summary}</p>
                  <p>
                    {item.blockerCount} blocker(s), {item.highConcernCount} high concern(s), {item.safetyFlagCount} safety flag(s)
                  </p>
                  <p>{item.nextStep}</p>
                </div>
                <div className="actions">
                  <span className="tag danger">{item.label}</span>
                  <a className="button secondary" href={`/cases/${item.id}${sharedQuery}`}>
                    Case
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="row">
              <div>
                <strong>No remediation backlog</strong>
                <p>No cases are currently sitting in the remediation stream.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
