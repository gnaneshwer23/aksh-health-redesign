import { notFound } from "next/navigation";

import { CaseHumanReviewPanels } from "@/components/review/case-human-review-panels";
import { KnownLimitationsFooter } from "@/components/review/known-limitations-footer";
import { ReportActions } from "@/components/review/report-actions";
import { SyntheticOutcomeCapturePanel } from "@/components/review/synthetic-outcome-capture-panel";
import { deriveHumanGates } from "@/lib/human-gates";
import { readReviewCaseById } from "@/lib/review-case-repository";
import { readUserScopeFromServerContext } from "@/lib/user-scope";
import {
  buildEvidencePayload,
  deriveReviewerConfirmedActionDrafts,
  deriveReviewerDraftActions
} from "@/lib/workflow";

function buildCaseQuery(demoMode: boolean, recordingMode: boolean) {
  return `${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;
}

export default async function CaseReportPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { demo?: string; recording?: string };
}) {
  const scopeKey = await readUserScopeFromServerContext();
  const reviewCase = await readReviewCaseById(params.id, scopeKey);
  const demoMode = searchParams?.demo === "1";
  const recordingMode = searchParams?.recording === "1";

  if (!reviewCase) {
    notFound();
  }

  const evidence = buildEvidencePayload(reviewCase);
  const humanGates = deriveHumanGates(reviewCase);
  const reviewerDraftActions = [
    ...deriveReviewerDraftActions(reviewCase),
    ...deriveReviewerConfirmedActionDrafts(reviewCase)
  ];
  const query = buildCaseQuery(demoMode, recordingMode);

  return (
    <div className="stack printable-report">
      <div className="panel stack">
        <ReportActions
          backHref={`/cases/${params.id}${query}`}
          exportHref={`/api/review-cases/${params.id}/export`}
        />
        <h1>Case Evidence Report</h1>
        <p>
          Printable synthetic proof summary for {evidence.patientLabel}, including validation readiness, reviewer
          decisions, and human-gate status.
        </p>
        <div className="pill-row">
          <span className="pill">{evidence.finalizationState}</span>
          <span className="pill">{evidence.artifactState}</span>
          <span className="pill">{evidence.validationReadiness.label}</span>
        </div>
      </div>

      <div className="layout-grid">
        <section className="report-section">
          <h2>Decision Summary</h2>
          <p>Last decision: {evidence.reviewSummary.lastDecision ?? "pending"}</p>
          <p>Reviewer: {evidence.reviewSummary.lastReviewer ?? "Unassigned"}</p>
          <p>{evidence.reviewSummary.reviewerNotes ?? "No reviewer notes captured."}</p>
        </section>

        <section className="report-section">
          <h2>Validation Readiness</h2>
          <p>{evidence.validationReadiness.label}</p>
          <p>{evidence.validationReadiness.nextStep}</p>
        </section>

        <section className="report-section">
          <CaseHumanReviewPanels
            actions={reviewerDraftActions}
            gateTitle="Human-Gate Status"
            gates={humanGates}
            variant="report"
          />
        </section>

        <section className="report-section">
          <SyntheticOutcomeCapturePanel outcomeCapture={evidence.outcomeCapture} />
        </section>

        <KnownLimitationsFooter artifactLabel="This case evidence report" />
      </div>
    </div>
  );
}
