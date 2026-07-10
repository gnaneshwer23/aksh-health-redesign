import { useMemo, useState } from "react";
import { createHumanGateDecision, deriveHumanGates, ensureHumanGateDecisionSnapshot } from "@/lib/human-gates";
import { appendCaseLevelShieldAudit } from "@/lib/shield-audit";
import type { AuditEvent, FhirBundleDraft, HumanGateDecisionStatus, HumanGateId, ReviewCase, ReviewerDecision } from "@/lib/types";
import {
  createFrozenArtifact,
  createFieldChange,
  createReviewerEvent,
  decisionLabel,
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
  formatCaseTimestamp,
  toStatus
} from "@/lib/workflow";

export function useCaseReviewWorkflow(reviewCase: ReviewCase, onUpdateCase: (reviewCase: ReviewCase) => void) {
  const [draft, setDraft] = useState<FhirBundleDraft>(reviewCase.draft);
  const [auditEvents, setAuditEvents] = useState(reviewCase.auditEvents);
  const [status, setStatus] = useState(reviewCase.status);
  const [reviewerName, setReviewerName] = useState(reviewCase.reviewSummary?.lastReviewer ?? "Dr Morgan");
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

  function updateHumanGateDecision(gateId: HumanGateId, decisionStatus: HumanGateDecisionStatus, note?: string) {
    if (!reviewerName.trim() || isAccepted) {
      setDecisionError("Add a reviewer name before recording a human-gate decision.");
      return;
    }

    const decidedAt = formatCaseTimestamp();
    const nextDecision = createHumanGateDecision({
      id: gateId,
      status: decisionStatus,
      note: note?.trim() || undefined,
      decidedAt,
      decidedBy: reviewerName
    });
    const nextHumanGateDecisions = [
      ...humanGateDecisions.filter((decision) => decision.id !== gateId),
      nextDecision
    ];
    const nextAuditEvents = [
      ...auditEvents,
      createReviewerEvent(
        "reviewer_note",
        "Human gate decision recorded",
        reviewerName,
        `${gateId.replaceAll("_", " ")} marked ${decisionStatus.replaceAll("_", " ")}${note?.trim() ? `: ${note.trim()}` : ""}`
      )
    ];

    setHumanGateDecisions(nextHumanGateDecisions);
    setAuditEvents(nextAuditEvents);
    setDecisionError("");
    persistCase({
      humanGateDecisions: nextHumanGateDecisions,
      auditEvents: nextAuditEvents
    });
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
    if (!reviewerName.trim() || isAccepted) {
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
        reviewerName,
        `${fieldLabel} updated from "${previousValue || "empty"}" to "${value || "empty"}"`
      )
    ];
    const nextFieldChanges = [
      ...(reviewCase.fieldChanges ?? []),
      createFieldChange(sectionId, snapshotKey, fieldLabel, previousValue, value, reviewerName)
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
      completedBy: completed ? previous.completedBy ?? reviewerName : undefined
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

  function handleDecision(decision: ReviewerDecision) {
    if (!reviewerName.trim()) {
      setDecisionError("Add a reviewer name before recording a decision.");
      return;
    }

    const workingCase: ReviewCase = {
      ...workingReviewCase,
      reviewSummary: {
        ...workingReviewCase.reviewSummary,
        lastReviewer: reviewerName,
        reviewerNotes,
        overrideReason
      }
    };
    const blockers = deriveAcceptanceBlockers(workingCase);
    const checklistBlockers = deriveChecklistAcceptanceBlockers(workingCase);
    const humanGateBlockers = deriveHumanGates(workingCase)
      .filter((gate) => gate.status === "required")
      .map((gate) => `${gate.label} still requires an explicit reviewer decision.`);

    if (decision === "accept") {
      if (!hasAcknowledgedSource) {
        setDecisionError("Confirm the clinical accountability check before accepting this case.");
        return;
      }

      if (blockers.length || checklistBlockers.length) {
        setDecisionError([...blockers, ...checklistBlockers][0] ?? "Resolve open blockers before accepting this case.");
        return;
      }

      if (humanGateBlockers.length) {
        setDecisionError(humanGateBlockers[0]);
        return;
      }
    }

    const nextStatus = toStatus(decision);
    const decisionEvent = createReviewerEvent(
      "reviewer_decision",
      decisionLabel(decision),
      reviewerName,
      reviewerNotes || undefined
    );
    const overrideEvent =
      decision === "accept" && overrideReason.trim()
        ? createReviewerEvent("override", "Override reason recorded", reviewerName, overrideReason)
        : null;
    const nextAuditEvents = [...auditEvents, decisionEvent, ...(overrideEvent ? [overrideEvent] : [])];
    const nextHumanGateDecisions = ensureHumanGateDecisionSnapshot(workingCase, {
      decidedAt: formatCaseTimestamp(),
      decidedBy: reviewerName
    });
    const nextReviewCase: ReviewCase = {
      ...workingCase,
      status: nextStatus,
      updatedAt: formatCaseTimestamp(),
      auditEvents: nextAuditEvents,
      humanGateDecisions: nextHumanGateDecisions,
      reviewSummary: {
        ...workingCase.reviewSummary,
        lastReviewer: reviewerName,
        lastDecision: decision,
        lastDecisionAt: formatCaseTimestamp(),
        reviewerNotes,
        overrideReason
      }
    };

    const nextCase =
      decision === "accept"
        ? appendCaseLevelShieldAudit(
            {
              ...nextReviewCase,
              frozenArtifact: createFrozenArtifact(nextReviewCase, { frozenBy: reviewerName })
            },
            {
              action: "accept",
              actor: reviewerName,
              detail: `Case ${reviewCase.id} accepted with frozen evidence artifact`
            }
          )
        : appendCaseLevelShieldAudit(nextReviewCase, {
            action: decision === "reject" ? "reject" : "defer",
            actor: reviewerName,
            detail: `Case ${reviewCase.id} marked ${decision}`
          });

    setStatus(nextStatus);
    setAuditEvents(nextCase.auditEvents);
    setHumanGateDecisions(nextHumanGateDecisions);
    setDecisionError("");
    onUpdateCase(nextCase);
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
