"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";

type CareAction = {
  learningEventId: string;
  patientId: string | null;
  agentLabel: string;
  predictionId: string;
  predictionSummary?: string;
  decision: string;
  outcomeKind: string;
  loopStage: "awaiting_outcome" | "outcome_linked" | "immediate_outcome" | "no_action_required";
  recordedAt: string;
};

type LoopStatus = {
  careActionCount?: number;
  awaitingOutcomeCount?: number;
  outcomeLinkedCount?: number;
  noActionRequiredCount?: number;
  evaluationReviewCount?: number;
  /** Any Accept/Edit/Reject disposition recorded — workload signal, not a real-outcome measure. */
  dispositionCompleteRatio?: number;
  /** A human actually reported what happened — honesty signal, excludes Reject closures. */
  realOutcomeCaptureRatio?: number;
  openActions?: CareAction[];
  autoRetrain?: boolean;
  note?: string;
  error?: string;
};

const OUTCOME_KINDS = [
  "care_action_completed",
  "care_action_deferred",
  "adverse_event_none",
  "adverse_event_suspected",
  "follow_up_scheduled",
  "unknown"
] as const;

/**
 * Capture eventual outcomes against prior spine care-action learning events.
 * Clinician or patient-reported; append-only; never auto-retrains.
 */
export function SpineOutcomesCapturePanel({
  patientId,
  patientLabel,
  mode = "clinician",
  onCaptured
}: {
  patientId: string;
  patientLabel?: string;
  mode?: "clinician" | "patient";
  onCaptured?: () => void;
}) {
  const [status, setStatus] = useState<LoopStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [sourceEventId, setSourceEventId] = useState("");
  const [outcomeKind, setOutcomeKind] =
    useState<(typeof OUTCOME_KINDS)[number]>("care_action_completed");
  const [summary, setSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/clinical-spine/outcomes?patientId=${encodeURIComponent(patientId)}`,
        { credentials: "include", cache: "no-store" }
      );
      const data = (await response.json()) as LoopStatus;
      if (!response.ok) {
        toast({
          title: "Outcomes loop unavailable",
          description: data.error ?? "Could not load care actions."
        });
        setStatus(null);
        return;
      }
      setStatus(data);
      const open = data.openActions ?? [];
      setSourceEventId((current) => {
        if (current && open.some((a) => a.learningEventId === current)) return current;
        return open[0]?.learningEventId ?? "";
      });
    } catch {
      toast({ title: "Outcomes loop unavailable", description: "Network error." });
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = useCallback(async () => {
    if (!sourceEventId) {
      toast({ title: "Select a care action", description: "Pick a prior HITL decision to link." });
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/clinical-spine/outcomes", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sourceEventId,
          outcomeKind,
          outcomeSummary:
            summary.trim() ||
            `${mode === "patient" ? "Patient-reported" : "Clinician"} outcome for ${patientLabel ?? patientId}`,
          reporterRole: mode === "patient" ? "patient" : "clinician"
        })
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
        autoRetrain?: boolean;
        outcomeEventId?: string;
        shieldAuditWriteFailed?: boolean;
      };
      if (!response.ok) {
        throw new Error(data.error ?? `HTTP ${response.status}`);
      }
      toast({
        title: data.shieldAuditWriteFailed ? "Outcome linked — audit write degraded" : "Outcome linked",
        description: `${data.message ?? "Append-only."} autoRetrain:${String(data.autoRetrain ?? false)}${
          data.shieldAuditWriteFailed
            ? " · SHIELD audit mirror failed for this write — retry from the admin SHIELD ledger."
            : ""
        }`
      });
      setSummary("");
      await load();
      onCaptured?.();
    } catch (err) {
      toast({
        title: "Outcome capture failed",
        description: err instanceof Error ? err.message : "Unknown error"
      });
    } finally {
      setSubmitting(false);
    }
  }, [sourceEventId, outcomeKind, summary, mode, patientId, patientLabel, load, onCaptured]);

  const openActions = status?.openActions ?? [];

  return (
    <Card className="shadow-sm" data-testid="spine-outcomes-capture-panel">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm">
          {mode === "patient" ? "Report an outcome" : "Capture care outcome"}
        </CardTitle>
        <p className="text-xs text-muted">
          Link an eventual outcome to a prior Accept / Edit / Reject (or pharmacist review) on the
          same clinical spine. Append-only · autoRetrain:false · not a live EMR write.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-2">
        <div
          className="rounded-md border border-border px-3 py-2 text-xs text-muted space-y-1"
          data-testid="spine-outcomes-loop-status"
        >
          {loading && !status ? (
            "Loading loop status…"
          ) : (
            <>
              <p>
                Care actions: {status?.careActionCount ?? 0} · awaiting outcome:{" "}
                {status?.awaitingOutcomeCount ?? 0} · outcome linked:{" "}
                {status?.outcomeLinkedCount ?? 0} · no action required (rejected):{" "}
                {status?.noActionRequiredCount ?? 0} · eval reviews:{" "}
                {status?.evaluationReviewCount ?? 0} · autoRetrain:
                {String(status?.autoRetrain ?? false)}
              </p>
              <p
                data-testid="spine-outcomes-disposition-ratio"
                title="Every item with an Accept/Edit/Reject disposition recorded — includes Reject's no-action-required closure. A workload signal, not a real-outcome measure."
              >
                Disposition complete (Accept/Edit/Reject recorded):{" "}
                {Math.round((status?.dispositionCompleteRatio ?? 0) * 100)}%
              </p>
              <p
                data-testid="spine-outcomes-real-outcome-ratio"
                title="Only counts items where a human reported what actually happened to the patient — excludes Reject's no-action-required closure. Best-effort/self-serve today; expected to stay low."
              >
                Real outcome captured (verified what happened):{" "}
                {Math.round((status?.realOutcomeCaptureRatio ?? 0) * 100)}%
              </p>
            </>
          )}
        </div>

        {openActions.length === 0 ? (
          <p className="text-xs text-muted" data-testid="spine-outcomes-empty">
            No open care actions awaiting eventual outcome for this patient. Accept a draft or
            complete a pharmacist review first — then return here to close the loop.
          </p>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1 space-y-1">
              <label className="text-[10px] uppercase tracking-wide text-muted" htmlFor="spine-outcome-source">
                Prior care action
              </label>
              <select
                id="spine-outcome-source"
                data-testid="spine-outcome-source"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={sourceEventId}
                onChange={(e) => setSourceEventId(e.target.value)}
              >
                {openActions.map((action) => (
                  <option key={action.learningEventId} value={action.learningEventId}>
                    {action.agentLabel} · {action.decision} · {action.predictionId}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[160px] space-y-1">
              <label className="text-[10px] uppercase tracking-wide text-muted" htmlFor="spine-outcome-kind">
                Outcome
              </label>
              <select
                id="spine-outcome-kind"
                data-testid="spine-outcome-kind"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={outcomeKind}
                onChange={(e) =>
                  setOutcomeKind(e.target.value as (typeof OUTCOME_KINDS)[number])
                }
              >
                {OUTCOME_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[200px] flex-[2] space-y-1">
              <label className="text-[10px] uppercase tracking-wide text-muted" htmlFor="spine-outcome-summary">
                Summary
              </label>
              <input
                id="spine-outcome-summary"
                data-testid="spine-outcome-summary"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder={
                  mode === "patient"
                    ? "e.g. Feeling better after meds change"
                    : "e.g. 30-day follow-up completed"
                }
              />
            </div>
            <Button
              size="sm"
              onClick={() => void submit()}
              disabled={submitting || !sourceEventId}
              data-testid="spine-outcome-submit"
            >
              {submitting ? "Linking…" : "Link outcome"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
