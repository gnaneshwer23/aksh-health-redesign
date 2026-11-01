"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  ADAPTER_SIM_LABELS,
  REVIEW_HONESTY_LINES,
  buildReviewHonestyStripModel,
  type AgentExecutionModeLike,
  type ReviewHonestyRunSummary,
  type LlmSessionMode,
} from "@/lib/review/honesty-strip-client";
import { cn } from "@/lib/utils";

type CapsPayload = {
  llmSessionMode?: LlmSessionMode;
  llmSessionLabel?: string;
  llmEnabledAgents?: string[];
  llmSessionNote?: string;
  adapters?: Array<{ id: string; label: string; live: false }>;
  honestyLines?: string[];
  clinicalValidationClaim?: false;
  ehrWrite?: false;
  simulationMode?: string;
};

export type ReviewHonestyStripProps = {
  surface?: string;
  className?: string;
  /** When set (e.g. after CONDUCTOR), show per-run executionMode honesty. */
  runSummary?: ReviewHonestyRunSummary | null;
  agentModes?: AgentExecutionModeLike[] | null;
  /** Link back to facilitator session when opened from HCP eval. */
  showHcpSessionLink?: boolean;
  /** Fetch GET /api/agents/orchestrate for session-mode (default true). */
  fetchSessionMode?: boolean;
  /**
   * `full` — session mode + adapters + honesty lines (page chrome).
   * `run` — compact executionMode strip after an agent brief (omit duplicate static copy).
   */
  variant?: "full" | "run";
};

/**
 * Milestone C2 — honesty strip for GP / clinician review surfaces.
 * Reuses Agent Ops honesty patterns + A1 executionMode metadata when a run is present.
 */
export function ReviewHonestyStrip({
  surface = "GP review",
  className,
  runSummary = null,
  agentModes = null,
  showHcpSessionLink = true,
  fetchSessionMode = true,
  variant = "full",
}: ReviewHonestyStripProps) {
  const [caps, setCaps] = useState<CapsPayload | null>(null);

  useEffect(() => {
    if (!fetchSessionMode || variant === "run") return;
    let cancelled = false;
    fetch("/api/agents/orchestrate", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: CapsPayload | null) => {
        if (!cancelled && d) setCaps(d);
      })
      .catch(() => {
        /* strip still renders static honesty */
      });
    return () => {
      cancelled = true;
    };
  }, [fetchSessionMode, variant]);

  const model = useMemo(() => {
    const base = buildReviewHonestyStripModel({
      surface,
      sessionMode: caps?.llmSessionMode,
      sessionLabel: caps?.llmSessionLabel,
      sessionNote: caps?.llmSessionNote,
      enabledAgents: caps?.llmEnabledAgents,
      runSummary,
      agentModes,
    });
    return base;
  }, [surface, caps, runSummary, agentModes]);

  const lines = caps?.honestyLines?.length ? caps.honestyLines : REVIEW_HONESTY_LINES;
  const adapters = caps?.adapters?.length ? caps.adapters : ADAPTER_SIM_LABELS;

  if (variant === "run") {
    if (!model.run) return null;
    return (
      <div
        role="status"
        data-testid="review-honesty-strip"
        data-variant="run"
        data-surface={surface}
        data-run-mode={model.run.overallMode}
        className={cn(
          "rounded-md border border-border-subtle bg-muted/30 px-3 py-2 space-y-1.5 text-[11px]",
          className
        )}
      >
        <div className="flex flex-wrap gap-2 items-center">
          <span className="font-semibold tracking-tight">Run honesty</span>
          <span
            className="rounded bg-accent/10 px-1.5 py-0.5 font-medium text-accent"
            data-testid="review-honesty-run-mode"
          >
            {model.run.overallLabel}
          </span>
          <span className="rounded bg-muted px-1.5 py-0.5" data-testid="review-honesty-hitl">
            HITL · ehrWrite: false
          </span>
        </div>
        {model.run.agentModes.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5 text-[10px]" data-testid="review-honesty-agent-modes">
            {model.run.agentModes.map((a) => (
              <li
                key={`${a.agentId}-${a.executionMode}`}
                className="rounded border border-border-subtle px-1.5 py-0.5"
                data-agent-id={a.agentId}
                data-execution-mode={a.executionMode}
              >
                {a.agentId}: {a.executionMode}
              </li>
            ))}
          </ul>
        ) : null}
        {model.run.evidenceRefCount > 0 ? (
          <p className="text-muted" data-testid="review-honesty-evidence">
            Evidence refs: {model.run.evidenceRefCount}
            {model.run.guardianOutcome ? ` · Guardian: ${model.run.guardianOutcome}` : ""}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <section
      role="status"
      data-testid="review-honesty-strip"
      data-variant="full"
      data-surface={surface}
      data-llm-session-mode={model.session.mode}
      data-run-mode={model.run?.overallMode ?? "none"}
      className={cn(
        "rounded-lg border border-border bg-surface-raised/40 p-4 space-y-2",
        className
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight" data-testid="review-honesty-title">
          Review honesty
        </h2>
        <p className="text-[11px] text-muted" data-testid="review-honesty-surface">
          {surface} · clinicalValidationClaim: false · ehrWrite: false
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px]" data-testid="review-honesty-session-mode">
        <span
          className={cn(
            "rounded px-1.5 py-0.5 font-semibold uppercase tracking-wide",
            model.session.mode === "deterministic_week"
              ? "bg-muted text-foreground/80"
              : "bg-pastel-amber-ink/15 text-pastel-amber-ink"
          )}
          data-testid="review-honesty-llm-week"
        >
          {model.session.label}
        </span>
        <span className="rounded bg-muted px-1.5 py-0.5" data-testid="review-honesty-hitl">
          HITL required · no EHR write
        </span>
        {model.run ? (
          <span
            className="rounded bg-accent/10 px-1.5 py-0.5 font-medium text-accent"
            data-testid="review-honesty-run-mode"
          >
            Run: {model.run.overallLabel}
          </span>
        ) : (
          <span className="rounded bg-muted px-1.5 py-0.5 text-muted" data-testid="review-honesty-run-pending">
            Run executionMode appears after CONDUCTOR / agent brief
          </span>
        )}
      </div>

      {model.session.note ? (
        <p className="text-[11px] text-muted" data-testid="review-honesty-session-note">
          {model.session.note}
        </p>
      ) : null}

      {model.run && model.run.agentModes.length > 0 ? (
        <ul
          className="flex flex-wrap gap-1.5 text-[10px]"
          data-testid="review-honesty-agent-modes"
        >
          {model.run.agentModes.map((a) => (
            <li
              key={`${a.agentId}-${a.executionMode}`}
              className="rounded border border-border-subtle px-1.5 py-0.5"
              data-agent-id={a.agentId}
              data-execution-mode={a.executionMode}
            >
              {a.agentId}: {a.executionMode}
            </li>
          ))}
        </ul>
      ) : null}

      {model.run && model.run.evidenceRefCount > 0 ? (
        <p className="text-[11px] text-muted" data-testid="review-honesty-evidence">
          Evidence refs in run metadata: {model.run.evidenceRefCount}
          {model.run.guardianOutcome ? ` · Guardian gateway: ${model.run.guardianOutcome}` : ""}
          {model.run.correlationId ? ` · corr ${model.run.correlationId.slice(0, 16)}…` : ""}
        </p>
      ) : null}

      <ul
        className="text-xs text-muted space-y-1 list-disc pl-4"
        data-testid="review-honesty-lines"
      >
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2 text-[10px]" data-testid="review-honesty-adapters">
        {adapters.map((a) => (
          <span
            key={a.id}
            data-adapter={a.id}
            data-live="false"
            className="rounded border border-border-subtle px-1.5 py-0.5 text-pastel-amber-ink"
          >
            {a.label}
          </span>
        ))}
      </div>

      <p className="text-[11px] text-muted flex flex-wrap gap-x-3 gap-y-1">
        <span data-testid="review-honesty-doc">Docs: docs/milestone-c/REVIEW_HONESTY.md</span>
        {showHcpSessionLink ? (
          <Link
            href="/dashboard/gp/hcp-eval-session"
            className="underline text-primary"
            data-testid="review-honesty-hcp-session-link"
          >
            HCP eval session
          </Link>
        ) : null}
        <Link
          href="/dashboard/admin/agent-ops"
          className="underline text-primary"
          data-testid="review-honesty-agent-ops-link"
        >
          Agent Ops honesty
        </Link>
      </p>
    </section>
  );
}
