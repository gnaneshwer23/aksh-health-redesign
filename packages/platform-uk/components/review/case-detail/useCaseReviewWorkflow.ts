import { useMemo, useState } from "react";
import { deriveHumanGates } from "@/lib/human-gates";
import type { AuditEvent, FhirBundleDraft, HumanGateDecisionStatus, HumanGateId, ReviewCase, ReviewerDecision } from "@/lib/types";
import {
  createFieldChange,
  createReviewerEvent,
  deriveAcceptanceBlockers,
  deriveChecklistAcceptanceBlockers,
  deriveClinicalConcerns,
  deriveDataCollectionProfile,
  deriveReviewerDraftActions,
  deriveReviewerConfirmedActionDrafts,
  deriveFinalizationState,
  deriveReviewerChecklist,
  deriveReviewerGuidance,
  deriveSafetyFlags,
  deriveStreamTransitionChecklist,
  deriveValidationProtocol,
  deriveValidationReadiness,
  draftSectionsFromBundle,
  formatCaseTimestamp
} from "@/lib/workflow";

type ActionResult = { ok: true; reviewCase: ReviewCase; staging?: { status: string; detail?: string } } | { ok: false; error: string; code?: string };
/** Server-decided case actions (lib/use-review-cases.ts): case accept/reject/defer and human-gate decisions. */
export type CaseActions = {
  decideCase: (caseId: string, body: { decision: ReviewerDecision; notes?: string; overrideReason?: string; acknowledged: boolean }) => Promise<ActionResult>;
  decideGate: (caseId: string, gateId: string, body: { status: HumanGateDecisionStatus; note?: string }) => Promise<ActionResult>;
};

export function useCaseReviewWorkflow(reviewCase: ReviewCase, onUpdateCase: (reviewCase: ReviewCase) => void, actions: CaseActions) {
  const [draft, setDraft] = useState<FhirBundleDraft>(reviewCase.draft);
  const [auditEvents, setAuditEvents] = useState(reviewCase.auditEvents);
  const [status, setStatus] = useState(reviewCase.status);
  // Display only: the server records every decision under the signed-in account.
  const [reviewerName, setReviewerName] = useState(reviewCase.reviewSummary?.lastReviewer ?? "");
  // Placeholder for edits saved through the generic route; the server replaces it with the signed-in account.
  const editorLabel = "signed-in reviewer";
  const [reviewerNotes, setReviewerNotes] = useState(reviewCase.reviewSummary?.reviewerNotes ?? "");
  const [overrideReason, setOverrideReason] = useState(reviewCase.reviewSummary?.overrideReason ?? "");
  const [decisionError, setDecisionError] = useState("");
  const [focusSnapshot, setFocusSnapshot] = useState<Record<string, string>>({});
  const [activityFilter, setActivityFilter] = useState<AuditEvent["category"] | "all">("all");
  const [hasAcknowledgedSource, setHasAcknowledgedSource] = useState(false);
  const [isRemediating, setIsRemediating] = useState(false);
  const [humanGateDecisions, setHumanGateDecisions] = useState(reviewCase.humanGateDecisions ?? []);

  // Derived values
  const workingReviewCase = useMemo(
    () => ({
      ...reviewCase,
      draft,
      auditEvents,
      status,
      humanGateDecisions,
      reviewSummary: {
        ...reviewCase.reviewSummary,
        lastReviewer: reviewerName || reviewCase.reviewSummary?.lastReviewer,
        reviewerNotes,
        overrideReason
      }
    }),
    [auditEvents, draft, humanGateDecisions, overrideReason, reviewCase, reviewerName, reviewerNotes, status]
  );
  const sections = useMemo(() => draftSectionsFromBundle(draft), [draft]);
  const safetyFlags = useMemo(() => deriveSafetyFlags(workingReviewCase), [workingReviewCase]);
  const acceptanceBlockers = useMemo(() => deriveAcceptanceBlockers(workingReviewCase), [workingReviewCase]);
  const finalizationState = useMemo(() => deriveFinalizationState(workingReviewCase), [workingReviewCase]);
  const checklistAcceptanceBlockers = useMemo(() => deriveChecklistAcceptanceBlockers(workingReviewCase), [workingReviewCase]);
  const clinicalConcerns = useMemo(() => deriveClinicalConcerns(workingReviewCase), [workingReviewCase]);
  const dataCollectionProfile = useMemo(() => deriveDataCollectionProfile(workingReviewCase), [workingReviewCase]);
  const reviewerDraftActions = useMemo(
    () => [...deriveReviewerDraftActions(workingReviewCase), ...deriveReviewerConfirmedActionDrafts(workingReviewCase)],
    [workingReviewCase]
  );
  const reviewerGuidance = useMemo(() => deriveReviewerGuidance(workingReviewCase), [workingReviewCase]);
  const validationReadiness = useMemo(() => deriveValidationReadiness(workingReviewCase), [workingReviewCase]);
  const transitionChecklist = useMemo(() => deriveStreamTransitionChecklist(workingReviewCase), [workingReviewCase]);
  const validationProtocol = useMemo(() => deriveValidationProtocol(workingReviewCase), [workingReviewCase]);
  const reviewerChecklist = useMemo(() => deriveReviewerChecklist(workingReviewCase), [workingReviewCase]);
  const humanGates = useMemo(() => deriveHumanGates(workingReviewCase), [workingReviewCase]);
  const hasHighSeverityFlag = safetyFlags.some((flag) => flag.severity === "high");
  const isAccepted = status === "accepted";
  const hasFrozenArtifact = Boolean(reviewCase.frozenArtifact);
  const filteredAuditEvents = useMemo(() => auditEvents.filter((event) => (activityFilter === "all" ? true : event.category === activityFilter)), [activityFilter, auditEvents]);

  function persistCase(next: Partial<ReviewCase>) {
    onUpdateCase({
      ...reviewCase,
      draft,
      auditEvents,
      status,
      updatedAt: formatCaseTimestamp(),
      fieldChanges: reviewCase.fieldChanges ?? [],
      humanGateDecisions,
      reviewSummary: {
        ...reviewCase.reviewSummary,
        lastReviewer: reviewerName || reviewCase.reviewSummary?.lastReviewer,
        reviewerNotes,
        overrideReason
      },
      ...next
    });
  }

  async function updateHumanGateDecision(gateId: HumanGateId, decisionStatus: HumanGateDecisionStatus, note?: string) {
    if (isAccepted) return;
    const result = await actions.decideGate(reviewCase.id, gateId, { status: decisionStatus, note: note?.trim() || undefined });
    if (!result.ok) {
      setDecisionError(result.error);
      return;
    }
    setHumanGateDecisions(result.reviewCase.humanGateDecisions ?? []);
    setAuditEvents(result.reviewCase.auditEvents);
    setReviewerName(result.reviewCase.humanGateDecisions?.find((d) => d.id === gateId)?.decidedBy ?? reviewerName);
    setDecisionError("");
  }

  function updateDraftField(sectionId: string, fieldKey: string, value: string) {
    setDraft((current) => {
      let nextDraft: FhirBundleDraft;

      if (sectionId === "encounter") {
        nextDraft = {
          ...current,
          encounter: {
            ...current.encounter,
            [fieldKey]: value
          }
        };
      } else if (sectionId === "condition") {
        nextDraft = {
          ...current,
          condition: {
            ...current.condition,
            [fieldKey]: value
          }
        };
      } else if (sectionId === "medicationRequest" && current.medicationRequest) {
        if (fieldKey === "confidence") {
          const parsed = Number(value.replace("%", ""));
          nextDraft = {
            ...current,
            medicationRequest: {
              ...current.medicationRequest,
              confidence: Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed / 100)) : current.medicationRequest.confidence
            }
          };
        } else {
          nextDraft = {
            ...current,
            medicationRequest: {
              ...current.medicationRequest,
              [fieldKey]: value
            }
          };
        }
      } else {
        nextDraft = {
          ...current,
          observations: current.observations.map((observation) =>
            observation.id === sectionId ? { ...observation, [fieldKey]: value } : observation
          )
        };
      }

      persistCase({ draft: nextDraft });
      return nextDraft;
    });
  }

  function recordFieldEdit(sectionId: string, sectionTitle: string, fieldLabel: string, value: string) {
    if (isAccepted) {
      return;
    }

    const snapshotKey = `${sectionTitle}:${fieldLabel}`;
    const previousValue = focusSnapshot[snapshotKey] ?? value;

    if (previousValue === value) {
      return;
    }

    const nextAuditEvents = [
      ...auditEvents,
      createReviewerEvent(
        "reviewer_edit",
        `Edited ${sectionTitle}`,
        editorLabel,
        `${fieldLabel} updated from "${previousValue || "empty"}" to "${value || "empty"}"`
      )
    ];
    const nextFieldChanges = [
      ...(reviewCase.fieldChanges ?? []),
      createFieldChange(sectionId, snapshotKey, fieldLabel, previousValue, value, editorLabel)
    ];

    setAuditEvents(nextAuditEvents);
    persistCase({
      auditEvents: nextAuditEvents,
      fieldChanges: nextFieldChanges
    });
  }

  function updateChecklist(itemId: string, next: { completed?: boolean; confirmationNote?: string }) {
    const existingChecklist = reviewCase.reviewSummary?.guidanceChecklist ?? reviewerChecklist;
    const existingById = new Map(existingChecklist.map((item) => [item.id, item]));
    const sourceItem = reviewerChecklist.find((item) => item.id === itemId);

    if (!sourceItem) {
      return;
    }

    const previous = existingById.get(itemId) ?? sourceItem;
    const completed = next.completed ?? previous.completed;
    const updatedItem = {
      ...previous,
      completed,
      confirmationNote: next.confirmationNote ?? previous.confirmationNote ?? "",
      completedAt: completed ? previous.completedAt ?? formatCaseTimestamp() : undefined,
      completedBy: completed ? previous.completedBy ?? editorLabel : undefined
    };
    const nextChecklist = reviewerChecklist.map((item) =>
      item.id === itemId ? updatedItem : existingById.get(item.id) ?? item
    );

    persistCase({
      reviewSummary: {
        ...reviewCase.reviewSummary,
        lastReviewer: reviewerName || reviewCase.reviewSummary?.lastReviewer,
        reviewerNotes,
        overrideReason,
        guidanceChecklist: nextChecklist
      }
    });
  }

  function toggleChecklistItem(itemId: string, completed: boolean) {
    updateChecklist(itemId, { completed });
  }

  function updateChecklistNote(itemId: string, note: string) {
    updateChecklist(itemId, { confirmationNote: note });
  }

  async function handleDecision(decision: ReviewerDecision) {
    if (decision === "accept" && !hasAcknowledgedSource) {
      setDecisionError("Confirm the clinical accountability check before accepting this case.");
      return;
    }
    // The server re-checks every blocker and required gate, and records the decision under the signed-in account.
    const result = await actions.decideCase(reviewCase.id, {
      decision,
      notes: reviewerNotes || undefined,
      overrideReason: overrideReason || undefined,
      acknowledged: hasAcknowledgedSource,
    });
    if (!result.ok) {
      setDecisionError(result.error);
      return;
    }
    const saved = result.reviewCase;
    setStatus(saved.status);
    setAuditEvents(saved.auditEvents);
    setHumanGateDecisions(saved.humanGateDecisions ?? []);
    setReviewerName(saved.reviewSummary?.lastReviewer ?? "");
    setDecisionError(
      result.staging?.status === "failed" ? `Case accepted, but staging the accepted content failed: ${result.staging.detail ?? "unknown error"}. Nothing was written to any record.` : ""
    );
  }

  async function handleRemediate() {
    setDecisionError("FastAPI synthesis is disabled in synthetic proof mode. Use manual review edits for this build.");
  }

  return {
    draft, setDraft,
    auditEvents, setAuditEvents,
    status, setStatus,
    reviewerName, setReviewerName,
    reviewerNotes, setReviewerNotes,
    overrideReason, setOverrideReason,
    decisionError, setDecisionError,
    focusSnapshot, setFocusSnapshot,
    activityFilter, setActivityFilter,
    hasAcknowledgedSource, setHasAcknowledgedSource,
    isRemediating, setIsRemediating,
    sections,
    safetyFlags,
    acceptanceBlockers,
    finalizationState,
    checklistAcceptanceBlockers,
    clinicalConcerns,
    dataCollectionProfile,
    reviewerDraftActions,
    humanGates,
    reviewerGuidance,
    validationReadiness,
    transitionChecklist,
    validationProtocol,
    reviewerChecklist,
    hasHighSeverityFlag,
    isAccepted,
    hasFrozenArtifact,
    filteredAuditEvents,
    updateDraftField,
    recordFieldEdit,
    toggleChecklistItem,
    updateChecklistNote,
    updateHumanGateDecision,
    handleDecision,
    handleRemediate,
    reviewCase,
    onUpdateCase
  };
}
