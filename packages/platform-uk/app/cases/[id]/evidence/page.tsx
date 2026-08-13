import { notFound } from "next/navigation";

import {
  CaseEvidenceClinicalConcernsSection,
  CaseEvidenceDraftActionsSection,
  CaseEvidenceLinkedFeedbackSection,
  CaseEvidenceReviewerChecklistSection,
  CaseEvidenceReviewerGuidanceSection,
  CaseEvidenceSafetyAcceptanceSection
} from "@/components/review/case-evidence-clinical-sections";
import {
  CaseEvidenceFhirExportBundleSection,
  CaseEvidenceFhirJsonSections,
  CaseEvidenceFieldChangesSection,
  CaseEvidenceGenerationTraceSection,
  CaseEvidenceSourceTraceSection,
  CaseEvidenceValidationReportSection
} from "@/components/review/case-evidence-export-sections";
import { CaseEvidenceHeader } from "@/components/review/case-evidence-header";
import {
  CaseEvidenceDataCollectionSection,
  CaseEvidenceDecisionSummarySection,
  CaseEvidenceHumanGateSection,
  CaseEvidenceOutcomeCaptureSection,
  CaseEvidenceStreamTransitionSection,
  CaseEvidenceValidationHistorySection,
  CaseEvidenceValidationProtocolSection,
  CaseEvidenceValidationReadinessSection
} from "@/components/review/case-evidence-validation-sections";
import { readFeedbackEntriesForCase } from "@/lib/feedback-repository";
import { deriveHumanGates } from "@/lib/human-gates";
import { readReviewCaseById } from "@/lib/review-case-repository";
import { readUserScopeFromServerContext } from "@/lib/user-scope";
import {
  buildEvidencePayload,
  deriveReviewerChecklist,
  deriveReviewerConfirmedActionDrafts,
  deriveReviewerDraftActions,
  deriveReviewerGuidance
} from "@/lib/workflow";

function buildEvidenceQuery(demoMode: boolean, recordingMode: boolean) {
  return `${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;
}

export default async function CaseEvidencePage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { demo?: string; recording?: string };
}) {
  const scopeKey = await readUserScopeFromServerContext();
  const demoMode = searchParams?.demo === "1";
  const recordingMode = searchParams?.recording === "1";

  // Demo walkthroughs use shared seeded cases (e.g. case-005). Prefer the caller
  // scope first, then fall back to shared when demo=1 so cohort logins still work.
  // Swallow ownership mismatches from seed userId="demo" vs authenticated cohort ids.
  async function loadCase(id: string, scope: string) {
    try {
      return await readReviewCaseById(id, scope);
    } catch {
      return null;
    }
  }

  let reviewCase = await loadCase(params.id, scopeKey);
  if (!reviewCase && demoMode && scopeKey !== "shared") {
    reviewCase = await loadCase(params.id, "shared");
  }

  if (!reviewCase) {
    notFound();
  }

  let evidence;
  let humanGates;
  let reviewerDraftActions;
  let reviewerChecklist;
  let reviewerGuidance;
  try {
    evidence = buildEvidencePayload(reviewCase);
    humanGates = deriveHumanGates(reviewCase);
    reviewerDraftActions = [
      ...deriveReviewerDraftActions(reviewCase),
      ...deriveReviewerConfirmedActionDrafts(reviewCase)
    ];
    reviewerChecklist = deriveReviewerChecklist(reviewCase);
    reviewerGuidance = deriveReviewerGuidance(reviewCase);
  } catch {
    notFound();
  }

  let linkedFeedback: Awaited<ReturnType<typeof readFeedbackEntriesForCase>> = [];
  try {
    linkedFeedback = await readFeedbackEntriesForCase(params.id, scopeKey);
  } catch {
    linkedFeedback = [];
  }
  const openFeedback = linkedFeedback.filter((entry) => entry.resolutionStatus !== "resolved");
  const resolvedFeedback = linkedFeedback.filter((entry) => entry.resolutionStatus === "resolved");
  const strongestFeedback = linkedFeedback.find((entry) => entry.strongestMoment?.trim());
  const topConcern = openFeedback.find((entry) => (entry.objections || entry.confusionPoint || "").trim());
  const nextAction = openFeedback.find((entry) => entry.nextActions?.trim());
  const nextOwner = openFeedback.find((entry) => entry.followUpOwner?.trim());
  const nextDueDate = openFeedback.find((entry) => entry.dueDate?.trim());
  const query = buildEvidenceQuery(demoMode, recordingMode);
  const showTechnicalDetail = !demoMode && !recordingMode;

  return (
    <div className="stack">
      <CaseEvidenceHeader
        caseId={params.id}
        demoMode={demoMode}
        evidence={evidence}
        query={query}
        recordingMode={recordingMode}
        sourceProfile={reviewCase.input.sourceProfile}
      />

      <div className="layout-grid">
        <CaseEvidenceDecisionSummarySection evidence={evidence} />
        <CaseEvidenceValidationReadinessSection evidence={evidence} />
        <CaseEvidenceHumanGateSection humanGates={humanGates} />
        <CaseEvidenceOutcomeCaptureSection evidence={evidence} />
        <CaseEvidenceValidationProtocolSection evidence={evidence} />
        <CaseEvidenceValidationHistorySection evidence={evidence} />
        <CaseEvidenceStreamTransitionSection evidence={evidence} />
        <CaseEvidenceDataCollectionSection evidence={evidence} />
        <CaseEvidenceLinkedFeedbackSection
          linkedFeedback={linkedFeedback}
          nextAction={nextAction}
          nextDueDate={nextDueDate}
          nextOwner={nextOwner}
          openFeedback={openFeedback}
          resolvedFeedback={resolvedFeedback}
          strongestFeedback={strongestFeedback}
          topConcern={topConcern}
        />
        <CaseEvidenceSafetyAcceptanceSection evidence={evidence} />
        <CaseEvidenceClinicalConcernsSection evidence={evidence} />
        <CaseEvidenceReviewerGuidanceSection reviewerGuidance={reviewerGuidance} />
        <CaseEvidenceDraftActionsSection humanGates={humanGates} reviewerDraftActions={reviewerDraftActions} />
        <CaseEvidenceReviewerChecklistSection reviewerChecklist={reviewerChecklist} />
        <CaseEvidenceValidationReportSection evidence={evidence} />
        <CaseEvidenceFhirExportBundleSection evidence={evidence} />
        {showTechnicalDetail ? <CaseEvidenceFieldChangesSection evidence={evidence} /> : null}
        <CaseEvidenceSourceTraceSection evidence={evidence} />
        <CaseEvidenceGenerationTraceSection evidence={evidence} />
        {showTechnicalDetail ? <CaseEvidenceFhirJsonSections evidence={evidence} /> : null}
      </div>
    </div>
  );
}
