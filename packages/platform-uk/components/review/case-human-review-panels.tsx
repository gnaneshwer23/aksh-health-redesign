"use client";

import { HumanGateSummary } from "./human-gate-summary";
import { ReviewerDraftActions } from "./reviewer-draft-actions";
import type { HumanGate } from "@/lib/human-gates";
import type { HumanGateDecisionStatus, HumanGateId, ReviewerDraftAction } from "@/lib/types";

export function CaseHumanReviewPanels({
  gates,
  actions,
  gateTitle = "Human-Gate Status",
  gateIntro,
  actionTitle = "Reviewer Draft Actions",
  actionIntro,
  className,
  variant = "panel",
  disabled = false,
  showGates = true,
  showActions = true,
  onGateDecision
}: {
  gates: HumanGate[];
  actions?: ReviewerDraftAction[];
  gateTitle?: string;
  gateIntro?: string;
  actionTitle?: string;
  actionIntro?: string;
  className?: string;
  variant?: "panel" | "report";
  disabled?: boolean;
  showGates?: boolean;
  showActions?: boolean;
  onGateDecision?: (gateId: HumanGateId, status: HumanGateDecisionStatus) => void;
}) {
  return (
    <>
      {showGates ? (
        <HumanGateSummary
          className={className}
          disabled={disabled}
          gates={gates}
          intro={gateIntro}
          onDecision={onGateDecision}
          title={gateTitle}
          variant={variant}
        />
      ) : null}
      {showActions && actions ? (
        <ReviewerDraftActions
          actions={actions}
          className={className}
          intro={actionIntro}
          title={actionTitle}
          variant={variant}
        />
      ) : null}
    </>
  );
}
