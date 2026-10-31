"use client";

import { useCallback, useEffect, useState } from "react";

import { HitlActions, SOAPEditor } from "@/components/dashboard/SOAPEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import type { HealthPlanDraft } from "@/lib/precision-health/health-plan";

type PanelPlan = {
  id: string;
  patientId: string;
  patientLabel: string;
  status: string;
  createdAt: string;
  createdBy: string;
  trigger?: string;
  sections: HealthPlanDraft["sections"];
  safetyNotes: string[];
};

type PlansResponse = {
  plans?: Array<Partial<PanelPlan> & { id: string; patientId: string; sections: HealthPlanDraft["sections"]; title?: string; decidedAt?: string | null }>;
  note?: string;
  ehrWrite?: boolean;
  patientVisibleOnly?: boolean;
  draftsHidden?: boolean;
  error?: string;
};

type DraftResponse = {
  draft?: HealthPlanDraft;
  ehrWrite?: boolean;
  physiologicalTwin?: boolean;
  error?: string;
};

function planNote(plan: PanelPlan) {
  return plan.sections.map((s) => `${s.title}: ${s.items.join("; ")}`).join("\n");
}

function toPanelPlan(
  p: NonNullable<PlansResponse["plans"]>[number]
): PanelPlan {
  return {
    id: p.id,
    patientId: p.patientId,
    patientLabel: p.patientLabel ?? p.title ?? p.patientId,
    status: p.status ?? "DRAFT",
    createdAt: p.createdAt ?? p.decidedAt ?? new Date().toISOString(),
    createdBy: p.createdBy ?? "care-team",
    trigger: p.trigger,
    sections: p.sections,
    safetyNotes: p.safetyNotes ?? [],
  };
}

export function HealthPlanDraftPanel({
  patientId,
  patientLabel,
  mode = "clinician",
}: {
  patientId: string;
  patientLabel?: string;
  /** Patient companion: APPROVED care plans only (canonical SoT); no draft request / HITL. */
  mode?: "clinician" | "patient";
}) {
  const [plans, setPlans] = useState<PanelPlan[]>([]);
  const [active, setActive] = useState<PanelPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [edited, setEdited] = useState(false);
  const [note, setNote] = useState("");
  const [hitlStatus, setHitlStatus] = useState<"Pending" | "Accepted" | "Rejected" | "Edited">(
    "Pending"
  );
  const [rejectReason, setRejectReason] = useState<string | null>(null);

  const selectPlan = useCallback((plan: PanelPlan) => {
    setActive(plan);
    setNote(planNote(plan));
    setHitlStatus(plan.status === "APPROVED" ? "Accepted" : "Pending");
    setEdited(false);
    setRejectReason(null);
    setEditing(false);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Patient companion: APPROVED care_plan_records only (never DRAFT health-plan store).
      const path =
        mode === "patient"
          ? `/api/patients/${encodeURIComponent(patientId)}/care-plans?visibility=patient`
          : `/api/patients/${encodeURIComponent(patientId)}/health-plan`;
      const response = await fetch(path, { credentials: "include" });
      const data = (await response.json()) as PlansResponse;
      if (!response.ok) {
        toast({
          title: mode === "patient" ? "Care plans unavailable" : "Health plans unavailable",
          description: data.error ?? "Could not list plans.",
        });
        return;
      }
      const list = (data.plans ?? []).map(toPanelPlan);
      setPlans(list);
      setActive((current) => {
        if (current) return current;
        if (list[0]) {
          setNote(planNote(list[0]));
          setHitlStatus(list[0].status === "APPROVED" ? "Accepted" : "Pending");
          return list[0];
        }
        return null;
      });
    } catch {
      toast({
        title: mode === "patient" ? "Care plans unavailable" : "Health plans unavailable",
        description: "Network error.",
      });
    } finally {
      setLoading(false);
    }
  }, [patientId, mode]);

  useEffect(() => {
    void load();
  }, [load]);

  const requestDraft = async () => {
    setRequesting(true);
    setHitlStatus("Pending");
    setEdited(false);
    setRejectReason(null);
    setEditing(false);
    try {
      const response = await fetch(`/api/patients/${encodeURIComponent(patientId)}/health-plan`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger: "manual_request" }),
      });
      const data = (await response.json()) as DraftResponse;
      if (!response.ok || !data.draft) {
        toast({
          title: "Draft failed",
          description: data.error ?? "Could not create health plan draft.",
        });
        return;
      }
      if (data.ehrWrite === true || data.physiologicalTwin === true) {
        toast({
          title: "Honesty check failed",
          description: "API claimed EHR write or physiological twin — refuse to stage.",
        });
        return;
      }
      const panel = toPanelPlan(data.draft);
      selectPlan(panel);
      setPlans((prev) => [panel, ...prev]);
      toast({
        title: "Health plan DRAFT ready",
        description: "HITL Accept/Edit/Reject required · never auto-writes EHR",
      });
    } catch {
      toast({ title: "Draft failed", description: "Network error." });
    } finally {
      setRequesting(false);
    }
  };

  const stageAccept = async () => {
    if (!active) return;
    try {
      await fetch("/api/audit/shield", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "staged", subject: "health_plan", action: "accept", agent: "SYNTHESIS", note: note.slice(0, 280), resourceRef: `${patientLabel ?? patientId} (${patientId})` }),
      });
    } catch {
      // Local staging still applies.
    }
    setHitlStatus("Accepted");
    toast({
      title: "Staged for review queue",
      description: "Health plan DRAFT logged to SHIELD · no EHR write-back",
    });
  };

  return (
    <Card className="shadow-sm" data-testid="health-plan-draft-panel">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-4 pb-2">
        <div>
          <CardTitle className="text-sm">
            {mode === "patient" ? "Your care plan" : "Personalised health plan (DRAFT)"}
          </CardTitle>
          <p className="text-xs text-muted">
            {mode === "patient"
              ? "APPROVED plans from your care team only · drafts never shown · ehrWrite: false"
              : "Clinician-requested draft only — HITL required · ehrWrite: false · not a physiological twin"}
          </p>
        </div>
        {mode === "clinician" ? (
          <Button size="sm" variant="outline" disabled={requesting} onClick={() => void requestDraft()}>
            {requesting ? "Drafting…" : "Request plan draft"}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-2">
        {loading && !active ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : !active ? (
          <p
            role="status"
            data-testid="health-plan-empty"
            className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted"
          >
            {mode === "patient"
              ? "No approved care plan yet. Your care team publishes plans here after clinical review — drafts stay private."
              : "No health plan drafts yet. Request a DRAFT for clinician review — nothing writes to the EHR."}
          </p>
        ) : (
          <div className="space-y-3" data-testid="health-plan-draft">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
              <span
                className={
                  active.status === "APPROVED"
                    ? "rounded bg-accent/15 px-1.5 py-0.5 font-semibold uppercase text-accent"
                    : "rounded bg-warning/15 px-1.5 py-0.5 font-semibold uppercase text-warning"
                }
              >
                {active.status}
              </span>
              {active.trigger ? <span>Trigger: {active.trigger}</span> : null}
              <span>· {new Date(active.createdAt).toLocaleString("en-GB")}</span>
            </div>

            {mode === "clinician" && editing ? (
              <SOAPEditor
                value={note}
                onChange={setNote}
                onSave={() => {
                  setEditing(false);
                  setEdited(true);
                  setHitlStatus("Edited");
                }}
                onCancel={() => {
                  setEditing(false);
                  setNote(planNote(active));
                }}
              />
            ) : (
              <div className="space-y-2">
                {active.sections.map((section) => (
                  <div key={section.id} className="rounded-sm border border-border p-2 text-xs">
                    <p className="font-semibold">
                      {section.title}
                      {section.clinical ? (
                        <span className="ml-2 text-[10px] font-normal text-muted">clinical</span>
                      ) : (
                        <span className="ml-2 text-[10px] font-normal text-muted">wellness</span>
                      )}
                    </p>
                    <ul className="mt-1 space-y-0.5 text-muted">
                      {section.items.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            <ul className="space-y-0.5 text-[10px] text-muted">
              {active.safetyNotes.map((n) => (
                <li key={n}>• {n}</li>
              ))}
            </ul>

            {mode === "patient" ? (
              <p className="text-xs text-muted" data-testid="health-plan-patient-view">
                Approved care plan · not medical advice · changes only via your care team HITL · draftsHidden
              </p>
            ) : hitlStatus === "Accepted" ? (
              <p className="text-xs font-medium text-accent">
                Staged to SHIELD · pending queue Accept · no EHR write
              </p>
            ) : hitlStatus === "Rejected" ? (
              <p className="text-xs font-medium text-danger">
                Rejected: {rejectReason || "No reason provided"}
              </p>
            ) : (
              <HitlActions
                status={edited ? "Edited" : "Pending"}
                onAccept={() => void stageAccept()}
                onEdit={() => setEditing(true)}
                onReject={(reason) => {
                  setHitlStatus("Rejected");
                  setRejectReason(reason || null);
                  toast({
                    title: "Health plan draft rejected",
                    description: reason || "No reason provided",
                  });
                }}
              />
            )}
          </div>
        )}

        {plans.length > 1 ? (
          <div className="border-t border-border-subtle pt-2">
            <p className="mb-1 text-[11px] font-semibold text-muted">
              {mode === "patient" ? "Earlier approved plans" : "Earlier drafts"}
            </p>
            <ul className="space-y-1 text-[11px] text-muted">
              {plans.slice(1, 4).map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="text-left underline-offset-2 hover:underline"
                    onClick={() => selectPlan(p)}
                  >
                    {p.id} · {new Date(p.createdAt).toLocaleString("en-GB")}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
