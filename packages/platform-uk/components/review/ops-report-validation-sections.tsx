"use client";

import type { deriveOpsAnalytics } from "@/lib/ops-analytics";

type OpsAnalytics = ReturnType<typeof deriveOpsAnalytics>;

export function ValidationReadinessActionsReportSection({
  query,
  validationActionQueues
}: {
  query: string;
  validationActionQueues: OpsAnalytics["validationActionQueues"];
}) {
  return (
    <section className="report-section">
      <h2>Validation Readiness Actions</h2>
      <div className="list">
        {validationActionQueues.pilotPromotionCandidates.length ? (
          validationActionQueues.pilotPromotionCandidates.map((item) => (
            <div className="row" key={`promote-${item.id}`}>
              <div>
                <strong>{item.patientLabel}</strong>
                <p>Promotion candidate: {item.label}</p>
                <p>
                  {item.blockerCount} blocker(s), {item.highConcernCount} high concern(s), {item.safetyFlagCount} safety flag(s)
                </p>
                <p>{item.nextStep}</p>
              </div>
              <div className="actions">
                <span className={`tag ${item.urgency === "high" ? "danger" : item.urgency === "medium" ? "warn" : "ok"}`}>
                  {item.urgency}
                </span>
                <a className="button secondary" href={`/cases/${item.id}${query}`}>
                  Case
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No promotion candidates yet</strong>
              <p>The current dataset does not yet contain cases close enough to promote toward pilot-prep use.</p>
            </div>
          </div>
        )}
        {validationActionQueues.remediationPriority.length ? (
          validationActionQueues.remediationPriority.map((item) => (
            <div className="row" key={`remediate-${item.id}`}>
              <div>
                <strong>{item.patientLabel}</strong>
                <p>Remediation priority: {item.label}</p>
                <p>
                  {item.blockerCount} blocker(s), {item.highConcernCount} high concern(s), {item.safetyFlagCount} safety flag(s)
                </p>
                <p>{item.nextStep}</p>
              </div>
              <div className="actions">
                <span className="tag danger">remediation</span>
                <a className="button secondary" href={`/cases/${item.id}${query}`}>
                  Case
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No remediation backlog</strong>
              <p>No cases are currently stuck in the remediation stream.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function ValidationProtocolSignalsReportSection({
  validationProtocolAnalytics
}: {
  validationProtocolAnalytics: OpsAnalytics["validationProtocolAnalytics"];
}) {
  return (
    <section className="report-section">
      <h2>Validation Protocol Signals</h2>
      <div className="list">
        <div className="row">
          <div>
            <strong>Ready for pilot prep</strong>
            <p>Cases already strong enough for pilot-prep walkthrough and clinician training use.</p>
          </div>
          <span className="pill">{validationProtocolAnalytics.recommendationCounts.ready_for_pilot_prep}</span>
        </div>
        <div className="row">
          <div>
            <strong>Ready for RWE candidate</strong>
            <p>Frozen, evidence-complete artifacts suitable for downstream RWE rehearsal.</p>
          </div>
          <span className="pill">{validationProtocolAnalytics.recommendationCounts.ready_for_rwe_candidate}</span>
        </div>
        <div className="row">
          <div>
            <strong>Needs reviewer validation</strong>
            <p>Cases that are close but still missing reviewer confirmations or transition gate completion.</p>
          </div>
          <span className="pill">{validationProtocolAnalytics.recommendationCounts.complete_reviewer_validation}</span>
        </div>
        <div className="row">
          <div>
            <strong>Hold in remediation</strong>
            <p>Cases that still need blocker resolution before promotion.</p>
          </div>
          <span className="pill">{validationProtocolAnalytics.recommendationCounts.hold_in_remediation}</span>
        </div>
        <div className="row">
          <div>
            <strong>Continue synthetic validation</strong>
            <p>Cases that still need deeper evidence before they become pilot-prep candidates.</p>
          </div>
          <span className="pill">{validationProtocolAnalytics.recommendationCounts.continue_synthetic_validation}</span>
        </div>
        <div className="row">
          <div>
            <strong>High-score cohort</strong>
            <p>Cases scoring 80+ on the validation protocol.</p>
          </div>
          <span className="pill">{validationProtocolAnalytics.scoreBands.high}</span>
        </div>
        <div className="row">
          <div>
            <strong>One step from pilot prep</strong>
            <p>Cases with only one open transition step left before pilot-prep promotion.</p>
          </div>
          <span className="pill">{validationProtocolAnalytics.transitionProximity.oneStepFromPilotPrep}</span>
        </div>
        <div className="row">
          <div>
            <strong>One step from RWE candidate</strong>
            <p>Cases with only one open transition step left before RWE-candidate promotion.</p>
          </div>
          <span className="pill">{validationProtocolAnalytics.transitionProximity.oneStepFromRweCandidate}</span>
        </div>
      </div>
    </section>
  );
}

export function ValidationTrendMetricsReportSection({
  validationProtocolAnalytics,
  validationTrendAnalytics
}: {
  validationProtocolAnalytics: OpsAnalytics["validationProtocolAnalytics"];
  validationTrendAnalytics: OpsAnalytics["validationTrendAnalytics"];
}) {
  return (
    <section className="report-section">
      <h2>Validation Trend Metrics</h2>
      <div className="list">
        <div className="row">
          <div>
            <strong>Cases with history</strong>
            <p>Cases that now have a persisted validation-progression trail.</p>
          </div>
          <span className="pill">{validationTrendAnalytics.casesWithHistory}</span>
        </div>
        <div className="row">
          <div>
            <strong>Average score delta</strong>
            <p>Average change between first and latest validation snapshots across the tracked cohort.</p>
          </div>
          <span className="pill">{validationTrendAnalytics.averageScoreDelta}</span>
        </div>
        <div className="row">
          <div>
            <strong>Improved vs regressed</strong>
            <p>
              Improved {validationTrendAnalytics.improvedCases}, regressed {validationTrendAnalytics.regressedCases}.
            </p>
          </div>
        </div>
        <div className="row">
          <div>
            <strong>Promoted cases</strong>
            <p>Cases that moved forward into pilot-prep or RWE-oriented readiness states.</p>
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
        <div className="row">
          <div>
            <strong>Average score by stream</strong>
            <p>
              Phase 1 synthetic {validationProtocolAnalytics.streamAverages.phase_1_synthetic}, remediation{" "}
              {validationProtocolAnalytics.streamAverages.phase_1_remediation}, pilot prep{" "}
              {validationProtocolAnalytics.streamAverages.ics_pilot_preparation}, RWE{" "}
              {validationProtocolAnalytics.streamAverages.rwe_pipeline_candidate}.
            </p>
          </div>
        </div>
        {validationTrendAnalytics.topResolvedStages.length
          ? validationTrendAnalytics.topResolvedStages.map((item) => (
              <div className="row" key={`resolved-${item.label}`}>
                <div>
                  <strong>{item.label}</strong>
                  <p>Readiness stage where blocker reduction is landing most often.</p>
                </div>
                <span className="pill">{item.count}</span>
              </div>
            ))
          : null}
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
              <p>The cohort has no unresolved transition step patterns right now.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function StageFailureSignalsReportSection({
  query,
  validationStageFailureAnalytics
}: {
  query: string;
  validationStageFailureAnalytics: OpsAnalytics["validationStageFailureAnalytics"];
}) {
  return (
    <section className="report-section">
      <h2>Stage Failure Signals</h2>
      <div className="list">
        {validationStageFailureAnalytics.topFailedStages.length ? (
          validationStageFailureAnalytics.topFailedStages.map((item) => (
            <div className="row" key={item.label}>
              <div>
                <strong>{item.label}</strong>
                <p>Most common transition stage currently failing across the cohort.</p>
              </div>
              <div className="actions">
                <span className="pill">{item.count}</span>
                <a className="button secondary" href={`/review/failures?stage=${encodeURIComponent(item.label)}${query}`}>
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
                href={`/review/failures?stage=${encodeURIComponent(item.stage)}&step=${encodeURIComponent(item.label)}${query}`}
              >
                Open
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DossierReadinessReportSection({
  validationDossierAnalytics
}: {
  validationDossierAnalytics: OpsAnalytics["validationDossierAnalytics"];
}) {
  return (
    <section className="report-section">
      <h2>Dossier Readiness</h2>
      <div className="list">
        <div className="row">
          <div>
            <strong>Strong dossiers</strong>
            <p>Cases with high scores and no missing dossier sections.</p>
          </div>
          <span className="pill">{validationDossierAnalytics.strongDossiers}</span>
        </div>
        <div className="row">
          <div>
            <strong>Incomplete dossiers</strong>
            <p>Cases still missing one or more dossier sections for internal review.</p>
          </div>
          <span className="pill">{validationDossierAnalytics.incompleteDossiers}</span>
        </div>
        {validationDossierAnalytics.topMissingSections.length ? (
          validationDossierAnalytics.topMissingSections.map((item) => (
            <div className="row" key={item.label}>
              <div>
                <strong>{item.label}</strong>
                <p>Most common missing dossier section across the cohort.</p>
              </div>
              <span className="pill">{item.count}</span>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No missing dossier sections</strong>
              <p>The current cohort has complete dossier coverage for all tracked sections.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function DossierSpotlightReportSection({
  query,
  validationDossierAnalytics
}: {
  query: string;
  validationDossierAnalytics: OpsAnalytics["validationDossierAnalytics"];
}) {
  return (
    <section className="report-section">
      <h2>Dossier Spotlight</h2>
      <div className="list">
        {validationDossierAnalytics.spotlightCases.length ? (
          validationDossierAnalytics.spotlightCases.map((item) => (
            <div className="row" key={item.caseId}>
              <div>
                <strong>{item.patientLabel}</strong>
                <p>Score {item.overallScore} · {item.recommendation.replaceAll("_", " ")}</p>
                <p>{item.missingSections.length ? `Missing: ${item.missingSections.join(", ")}` : "No missing dossier sections"}</p>
              </div>
              <div className="actions">
                <a className="button secondary" href={`/cases/${item.caseId}/dossier${query}`}>
                  Dossier
                </a>
                <a className="button secondary" href={`/cases/${item.caseId}${query}`}>
                  Case
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No dossier spotlight cases</strong>
              <p>There are no current cases available for dossier-level spotlighting.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function MeetingReadyDossierBatchesReportSection({
  demoMode,
  recordingMode
}: {
  demoMode?: boolean;
  recordingMode?: boolean;
}) {
  const modeQuery = `${demoMode ? "&demo=1" : ""}${recordingMode ? "&recording=1" : ""}`;

  return (
    <section className="report-section">
      <h2>Meeting-Ready Dossier Batches</h2>
      <div className="list">
        {[
          ["strong", "Strong dossiers", "High-quality internal review packages ready to discuss first."],
          ["incomplete", "Incomplete dossiers", "Cases still missing one or more dossier sections."],
          ["near-promotion", "Near promotion", "Cases closest to pilot-prep or RWE-candidate movement."],
          ["remediation", "Remediation dossiers", "Batch-review dossiers still needing remediation closure."]
        ].map(([filter, title, detail]) => (
          <div className="row" key={filter}>
            <div>
              <strong>{title}</strong>
              <p>{detail}</p>
            </div>
            <a className="button secondary" href={`/review/dossiers?filter=${filter}${modeQuery}`}>
              Open
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
