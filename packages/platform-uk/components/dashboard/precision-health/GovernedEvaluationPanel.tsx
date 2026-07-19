"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";

type GateId = "G-ML-1" | "G-ML-2" | "G-ML-3";

type EvaluationRecord = {
  id: string;
  recordedAt: string;
  actor: string;
  proposedAction: string;
  status: string;
  gatesAllSigned: boolean;
  autoRetrainTriggered: false;
  modelUpdated: false;
  rationale: string;
};

type LoopSummary = {
  careActionCount?: number;
  awaitingOutcomeCount?: number;
  outcomeLinkedCount?: number;
  evaluationReviewCount?: number;
  loopCompleteRatio?: number;
  autoRetrain?: boolean;
};

type Payload = {
  records?: EvaluationRecord[];
  loop?: LoopSummary;
  autoRetrain?: boolean;
  note?: string;
  error?: string;
};

const GATE_LABELS: Record<GateId, string> = {
  "G-ML-1": "G-ML-1 Engineering (eval harness / clinical-proof)",
  "G-ML-2": "G-ML-2 CSO (hazard / residual risk)",
  "G-ML-3": "G-ML-3 Release authority (promote version)"
};

/**
 * Admin governed evaluation: review outcomes → learning signals → explicit human gates.
 * Blocks "propose model update" unless G-ML-1…3 signed. Never auto-retrains.
 */
export function GovernedEvaluationPanel() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [gates, setGates] = useState<Record<GateId, boolean>>({
    "G-ML-1": false,
    "G-ML-2": false,
    "G-ML-3": false
  });
  const [proposedAction, setProposedAction] = useState<
    "no_change" | "schedule_human_review" | "propose_model_update"
  >("no_change");
  const [rationale, setRationale] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/clinical-spine/governed-evaluation", {
        credentials: "include",
        cache: "no-store"
      });
      const data = (await response.json()) as Payload;
      if (!response.ok) {
        toast({
          title: "Governed evaluation unavailable",
          description: data.error ?? "Could not load reviews."
        });
        setPayload(null);
        return;
      }
      setPayload(data);
    } catch {
      toast({ title: "Governed evaluation unavailable", description: "Network error." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = useCallback(async () => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/clinical-spine/governed-evaluation", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          learningEventIdsReviewed: [],
          proposedAction,
          rationale,
          gates: (Object.keys(gates) as GateId[]).map((gateId) => ({
            gateId,
            signed: gates[gateId],
            note: gates[gateId] ? "Signed in admin UI (rehearsal)" : "Unsigned"
          }))
        })
      });
      const data = (await response.json()) as {
        error?: string;
        blockedReason?: string;
        message?: string;
        accepted?: boolean;
        autoRetrain?: boolean;
        modelUpdated?: boolean;
      };
      if (!response.ok) {
        throw new Error(data.blockedReason ?? data.error ?? `HTTP ${response.status}`);
      }
      toast({
        title: "Evaluation recorded",
        description: `${data.message ?? "OK"} · autoRetrain:${String(data.autoRetrain ?? false)} · modelUpdated:${String(data.modelUpdated ?? false)}`
      });
      setRationale("");
      await load();
    } catch (err) {
      toast({
        title: "Evaluation blocked or failed",
        description: err instanceof Error ? err.message : "Unknown error"
      });
    } finally {
      setSubmitting(false);
    }
  }, [gates, proposedAction, rationale, load]);

  const loop = payload?.loop;
  const records = payload?.records ?? [];
  const allSigned = gates["G-ML-1"] && gates["G-ML-2"] && gates["G-ML-3"];
  const proposeBlocked = proposedAction === "propose_model_update" && !allSigned;

  return (
    <Card className="shadow-sm" data-testid="governed-evaluation-panel">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm">Governed evaluation (no auto-retrain)</CardTitle>
        <p className="text-xs text-muted">
          Review outcome-linked learning signals, then record a human gate decision.{" "}
          <strong>propose_model_update</strong> is blocked until G-ML-1…3 are signed. Even when
          approved, this never auto-retrains — ops must follow{" "}
          <code className="text-[10px]">docs/GOVERNED_MODEL_RELEASE_SOP.md</code>.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-2">
        <div
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900"
          data-testid="governed-eval-loop-banner"
        >
          {loading && !payload ? (
            "Loading…"
          ) : (
            <>
              Loop: {loop?.careActionCount ?? 0} care actions · {loop?.awaitingOutcomeCount ?? 0}{" "}
              awaiting · {loop?.outcomeLinkedCount ?? 0} linked · {loop?.evaluationReviewCount ?? 0}{" "}
              evals · autoRetrain:{String(payload?.autoRetrain ?? false)}
            </>
          )}
        </div>

        <div className="space-y-2" data-testid="governed-eval-gates">
          {(Object.keys(GATE_LABELS) as GateId[]).map((gateId) => (
            <label key={gateId} className="flex items-start gap-2 text-xs">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={gates[gateId]}
                onChange={(e) =>
                  setGates((prev) => ({ ...prev, [gateId]: e.target.checked }))
                }
                data-testid={`governed-gate-${gateId}`}
              />
              <span>{GATE_LABELS[gateId]}</span>
            </label>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] space-y-1">
            <label className="text-[10px] uppercase tracking-wide text-muted" htmlFor="geval-action">
              Proposed action
            </label>
            <select
              id="geval-action"
              data-testid="governed-eval-action"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={proposedAction}
              onChange={(e) =>
                setProposedAction(
                  e.target.value as "no_change" | "schedule_human_review" | "propose_model_update"
                )
              }
            >
              <option value="no_change">no_change</option>
              <option value="schedule_human_review">schedule_human_review</option>
              <option value="propose_model_update">propose_model_update (gated)</option>
            </select>
          </div>
          <div className="min-w-[240px] flex-1 space-y-1">
            <label className="text-[10px] uppercase tracking-wide text-muted" htmlFor="geval-rationale">
              Rationale
            </label>
            <input
              id="geval-rationale"
              data-testid="governed-eval-rationale"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Why this evaluation decision?"
            />
          </div>
          <Button
            size="sm"
            onClick={() => void submit()}
            disabled={submitting || !rationale.trim() || proposeBlocked}
            data-testid="governed-eval-submit"
          >
            {submitting ? "Recording…" : "Record evaluation"}
          </Button>
        </div>

        {proposeBlocked ? (
          <p className="text-xs text-danger" data-testid="governed-eval-blocked-hint">
            Sign G-ML-1, G-ML-2, and G-ML-3 before proposing a model update. Deploy remains manual —
            autoRetrain stays false.
          </p>
        ) : null}

        <div>
          <p className="text-xs font-semibold">Recent evaluations ({records.length})</p>
          {records.length === 0 ? (
            <p className="mt-1 text-xs text-muted">No evaluation reviews yet.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-xs" data-testid="governed-eval-list">
              {records.slice(0, 8).map((row) => (
                <li key={row.id} className="rounded-md border border-border px-2 py-1.5">
                  <span className="font-medium">{row.proposedAction}</span> · {row.status} ·
                  gatesAllSigned={String(row.gatesAllSigned)} · retrain=
                  {String(row.autoRetrainTriggered)} · modelUpdated={String(row.modelUpdated)}
                  <p className="text-muted">{row.rationale}</p>
                  <p className="text-[10px] text-muted">
                    {new Date(row.recordedAt).toLocaleString()} · {row.actor}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
