"use client";

import type { HumanGate } from "@/lib/human-gates";
import type { HumanGateDecisionStatus, HumanGateId } from "@/lib/types";

function gateTone(status: HumanGate["status"]) {
  if (status === "required") {
    return "danger";
  }

  if (status === "recommended") {
    return "warn";
  }

  return "ok";
}

function gateLabel(status: HumanGate["status"]) {
  return status.replaceAll("_", " ");
}

export function HumanGateSummary({
  gates,
  title = "Human Gates",
  intro,
  className,
  variant = "panel",
  disabled = false,
  onDecision
}: {
  gates: HumanGate[];
  title?: string;
  intro?: string;
  className?: string;
  variant?: "panel" | "report";
  disabled?: boolean;
  onDecision?: (gateId: HumanGateId, status: HumanGateDecisionStatus) => void;
}) {
  const required = gates.filter((gate) => gate.status === "required").length;
  const recommended = gates.filter((gate) => gate.status === "recommended").length;
  const completed = gates.filter((gate) => gate.status === "completed").length;
  const clear = gates.filter((gate) => gate.status === "clear").length;
  const wrapperClassName = [variant === "report" ? "report-section" : "panel stack", className]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={wrapperClassName} data-testid="human-gate-summary">
      <h3>{title}</h3>
      <p>
        {intro ??
          "Explicit reviewer-owned checkpoints for escalation, referral or pathway handling, and medication decisions."}
      </p>
      <div className="pill-row">
        <span className="pill">Required {required}</span>
        <span className="pill">Recommended {recommended}</span>
        <span className="pill">Completed {completed}</span>
        <span className="pill">Clear {clear}</span>
      </div>
      <div className="list">
        {gates.map((gate) => (
          <div className="row" data-testid={`human-gate-${gate.id}`} key={gate.id}>
            <div>
              <strong>{gate.label}</strong>
              <p>{gate.reason}</p>
              <p>{gate.reviewerAction}</p>
              <p>
                Evidence: {gate.evidence.length ? gate.evidence.join("; ") : "No direct supporting evidence captured."}
              </p>
            </div>
            <div className="stack stack--actions">
              <span className={`tag ${gateTone(gate.status)}`}>{gateLabel(gate.status)}</span>
              {gate.mandatory ? <span className="pill">Mandatory</span> : null}
              {gate.decision?.decidedBy ? (
                <span className="meta">
                  {gate.decision.decidedBy}
                  <br />
                  {gate.decision.decidedAt ?? "time not captured"}
                </span>
              ) : null}
              {onDecision && gate.status !== "completed" ? (
                <div className="actions">
                  <button
                    className="button secondary"
                    data-testid={`human-gate-${gate.id}-confirm`}
                    disabled={disabled}
                    onClick={() => onDecision(gate.id, "confirmed")}
                    type="button"
                  >
                    Confirm
                  </button>
                  <button
                    className="button secondary"
                    data-testid={`human-gate-${gate.id}-not-applicable`}
                    disabled={disabled}
                    onClick={() => onDecision(gate.id, "not_applicable")}
                    type="button"
                  >
                    Not Applicable
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
