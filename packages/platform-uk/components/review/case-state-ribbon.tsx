import type { FinalizationState, SafetyFlag, WorkflowStatus } from "@/lib/types";
import { finalizationStateLabel } from "@/lib/workflow";

function workflowStatusLabel(status: WorkflowStatus) {
  return status.replace(/_/g, " ");
}

function finalizationTone(state: FinalizationState) {
  if (state === "blocked") return "danger";
  if (state === "warn") return "warn";
  return "ok";
}

export function deriveCaseStateSummary({
  acceptanceBlockerCount,
  finalizationState,
  hasFrozenArtifact,
  safetyFlags,
  status
}: {
  acceptanceBlockerCount: number;
  finalizationState: FinalizationState;
  hasFrozenArtifact: boolean;
  safetyFlags: SafetyFlag[];
  status: WorkflowStatus;
}) {
  const highRiskCount = safetyFlags.filter((flag) => flag.severity === "high").length;

  return {
    artifactLabel: hasFrozenArtifact ? "Frozen reviewed artifact" : "Live review draft",
    detail:
      acceptanceBlockerCount > 0
        ? `${acceptanceBlockerCount} blocker${acceptanceBlockerCount === 1 ? "" : "s"} must be resolved before acceptance.`
        : finalizationState === "warn"
          ? "Review can progress, but warning-level issues remain visible."
          : "No active acceptance blockers are currently derived.",
    finalizationLabel: finalizationStateLabel(finalizationState),
    finalizationTone: finalizationTone(finalizationState),
    highRiskCount,
    safetyLabel: highRiskCount ? `${highRiskCount} high risk` : `${safetyFlags.length} safety flags`,
    safetyTone: highRiskCount ? "danger" : safetyFlags.length ? "warn" : "ok",
    statusLabel: workflowStatusLabel(status),
    statusTone: status === "accepted" ? "ok" : status === "rejected" ? "danger" : "warn"
  };
}

export function CaseStateChips({
  acceptanceBlockerCount,
  finalizationState,
  hasFrozenArtifact,
  safetyFlags,
  status
}: {
  acceptanceBlockerCount: number;
  finalizationState: FinalizationState;
  hasFrozenArtifact: boolean;
  safetyFlags: SafetyFlag[];
  status: WorkflowStatus;
}) {
  const summary = deriveCaseStateSummary({
    acceptanceBlockerCount,
    finalizationState,
    hasFrozenArtifact,
    safetyFlags,
    status
  });

  return (
    <>
      <span className="pill">{summary.artifactLabel}</span>
      <span className={`tag ${summary.statusTone}`}>{summary.statusLabel}</span>
      <span className={`tag ${summary.finalizationTone}`}>{summary.finalizationLabel}</span>
      <span className={`tag ${summary.safetyTone}`}>{summary.safetyLabel}</span>
    </>
  );
}

export function CaseStateRibbon({
  acceptanceBlockerCount,
  finalizationState,
  hasFrozenArtifact,
  safetyFlags,
  status
}: {
  acceptanceBlockerCount: number;
  finalizationState: FinalizationState;
  hasFrozenArtifact: boolean;
  safetyFlags: SafetyFlag[];
  status: WorkflowStatus;
}) {
  const summary = deriveCaseStateSummary({
    acceptanceBlockerCount,
    finalizationState,
    hasFrozenArtifact,
    safetyFlags,
    status
  });

  return (
    <section className="case-state-ribbon" aria-label="Case state">
      <div>
        <span className="case-state-ribbon__label">Case state</span>
        <strong>{summary.artifactLabel}</strong>
        <p>{summary.detail}</p>
      </div>

      <div className="case-state-ribbon__metrics">
        <span className={`tag ${summary.statusTone}`}>{summary.statusLabel}</span>
        <span className={`tag ${summary.finalizationTone}`}>{summary.finalizationLabel}</span>
        <span className={`tag ${summary.safetyTone}`}>{summary.safetyLabel}</span>
      </div>
    </section>
  );
}
