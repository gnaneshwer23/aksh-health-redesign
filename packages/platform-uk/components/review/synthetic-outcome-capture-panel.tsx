type SyntheticOutcomeCaptureView = {
  schemaVersion: string;
  benchmarkScenarioClass: string;
  reviewerDecision: string;
  finalizationState: string;
  validationLabel: string;
  reviewerConfirmedActions: {
    safetyNetting: string;
    referralPathway: string;
    medicationDecision: string;
  };
  evaluationUse: string;
  prohibitedUses: string[];
};

export function SyntheticOutcomeCapturePanel({
  outcomeCapture,
  variant = "panel"
}: {
  outcomeCapture: SyntheticOutcomeCaptureView;
  variant?: "panel" | "report";
}) {
  const wrapperClassName = variant === "report" ? "report-section" : "span-6 panel stack";

  return (
    <section className={wrapperClassName} data-testid="synthetic-outcome-capture">
      <h3>L10 Synthetic Outcome Capture</h3>
      <p>
        Offline benchmark/evaluation schema for learning from synthetic review outcomes without claiming real-patient
        learning or production clinical AI.
      </p>
      <div className="list">
        <div className="row">
          <div>
            <strong>{outcomeCapture.benchmarkScenarioClass}</strong>
            <p>
              Decision {outcomeCapture.reviewerDecision}; finalization {outcomeCapture.finalizationState}; validation{" "}
              {outcomeCapture.validationLabel}.
            </p>
            <p>{outcomeCapture.evaluationUse.replaceAll("_", " ")}</p>
          </div>
          <span className="pill">{outcomeCapture.schemaVersion}</span>
        </div>
        <div className="row">
          <div>
            <strong>Reviewer-confirmed action labels</strong>
            <p>Safety-netting: {outcomeCapture.reviewerConfirmedActions.safetyNetting}</p>
            <p>Referral/pathway: {outcomeCapture.reviewerConfirmedActions.referralPathway}</p>
            <p>Medication decision: {outcomeCapture.reviewerConfirmedActions.medicationDecision}</p>
          </div>
        </div>
        <div className="row">
          <div>
            <strong>Boundary</strong>
            <p>Not used for: {outcomeCapture.prohibitedUses.join("; ")}.</p>
          </div>
          <span className="tag ok">synthetic only</span>
        </div>
      </div>
    </section>
  );
}
