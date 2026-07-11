import { notFound } from "next/navigation";

import { KnownLimitationsFooter } from "@/components/review/known-limitations-footer";
import { ReportActions } from "@/components/review/report-actions";
import { buildCaseValidationDossierPayload } from "@/lib/case-dossier-evidence";
import { EVIDENCE_ARTIFACT_SCHEMA_VERSION } from "@/lib/evidence-artifact-metadata";
import { readFeedbackEntriesForCase } from "@/lib/feedback-repository";
import { readReviewCaseById, readReviewCases } from "@/lib/review-case-repository";
import { readUserScopeFromServerContext } from "@/lib/user-scope";

function buildCaseQuery(demoMode: boolean, recordingMode: boolean) {
  return `${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;
}

export default async function CaseValidationDossierPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { demo?: string; recording?: string };
}) {
  const scopeKey = await readUserScopeFromServerContext();
  const reviewCase = await readReviewCaseById(params.id, scopeKey);
  const allCases = await readReviewCases(scopeKey);
  const demoMode = searchParams?.demo === "1";
  const recordingMode = searchParams?.recording === "1";

  if (!reviewCase) {
    notFound();
  }

  const linkedFeedback = await readFeedbackEntriesForCase(params.id, scopeKey);
  const dossier = buildCaseValidationDossierPayload(reviewCase, allCases, {
    linkedFeedback,
    scopeKey
  });
  const query = buildCaseQuery(demoMode, recordingMode);

  return (
    <div className="stack printable-report">
      <div className="panel stack">
        <ReportActions
          backHref={`/cases/${params.id}${query}`}
          exportHref={`/api/review-cases/${params.id}/dossier`}
        />
        <h1>Case Validation Dossier</h1>
        <p>
          Internal review artifact for {dossier.patientLabel}, combining protocol score, transition gates, reviewer
          evidence, benchmark status, blockers, and stream placement in one place.
        </p>
        <div className="pill-row">
          <span className="pill">schema {EVIDENCE_ARTIFACT_SCHEMA_VERSION}</span>
          <span className="pill">{dossier.evidence.artifactState}</span>
          <span className="pill">{dossier.reviewDecision.lastDecision ?? "pending"}</span>
        </div>
      </div>

      <div className="layout-grid">
        <section className="report-section">
          <h2>Dossier Summary</h2>
          <div className="list">
            <div className="row">
              <div>
                <strong>Validation protocol score</strong>
                <p>{dossier.dossierSummary.validationProtocolScore}</p>
              </div>
              <span className="tag ok">{dossier.dossierSummary.promotionRecommendation.replaceAll("_", " ")}</span>
            </div>
            <div className="row">
              <div>
                <strong>Benchmark status</strong>
                <p>{dossier.benchmarkStatus?.scenarioClass ?? "Not benchmarked in current cohort"}</p>
              </div>
              <span className={`tag ${dossier.benchmarkStatus?.passed ? "ok" : "warn"}`}>
                {dossier.benchmarkStatus?.passed ? "passed" : "open"}
              </span>
            </div>
          </div>
        </section>

        <section className="report-section">
          <h2>Source Trace</h2>
          <div className="list">
            {dossier.sourceTrace.map((item) => (
              <div className="row" key={`${item.step}-${item.detail}`}>
                <div>
                  <strong>{item.step}</strong>
                  <p>{item.detail}</p>
                </div>
                              </div>
            ))}
          </div>
        </section>

        <section className="report-section">
          <h2>Validation Protocol</h2>
          <p>Overall score {dossier.validationProtocol.overallScore}</p>
          <p>{dossier.validationProtocol.summary}</p>
        </section>

        <section className="report-section">
          <h2>Feedback And Follow-Up Context</h2>
          <div className="list">
            {linkedFeedback.length ? (
              linkedFeedback.map((entry) => (
                <div className="row" key={entry.id}>
                  <div>
                    <strong>{entry.followUpOwner || entry.sessionType}</strong>
                    <p>{entry.nextActions || entry.confusionPoint || entry.strongestMoment}</p>
                  </div>
                  <span className="tag">{entry.resolutionStatus}</span>
                </div>
              ))
            ) : (
              <p>No linked walkthrough feedback captured for this case yet.</p>
            )}
          </div>
        </section>

        <KnownLimitationsFooter artifactLabel="This case validation dossier" />
      </div>
    </div>
  );
}
