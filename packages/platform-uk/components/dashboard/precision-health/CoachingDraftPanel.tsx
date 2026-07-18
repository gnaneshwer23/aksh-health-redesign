"use client";

import { useState } from "react";

import { HitlActions } from "@/components/dashboard/SOAPEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import type { CoachingDraft } from "@/lib/precision-health/coaching";

type AgentKind = "nutrition" | "sleep";

type CoachingResponse = {
  draft?: CoachingDraft;
  isClinicalAdvice?: boolean;
  ehrWrite?: boolean;
  error?: string;
};

export function CoachingDraftPanel({
  patientId,
  patientLabel,
  mode = "patient",
}: {
  patientId: string;
  patientLabel?: string;
  mode?: "patient" | "clinician";
}) {
  const [nutrition, setNutrition] = useState<CoachingDraft | null>(null);
  const [sleep, setSleep] = useState<CoachingDraft | null>(null);
  const [busy, setBusy] = useState<AgentKind | null>(null);
  const [escalating, setEscalating] = useState<AgentKind | null>(null);
  const [escalated, setEscalated] = useState<Partial<Record<AgentKind, boolean>>>({});

  const generate = async (kind: AgentKind) => {
    setBusy(kind);
    try {
      const response = await fetch(`/api/agents/${kind}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, patientLabel }),
      });
      const data = (await response.json()) as CoachingResponse;
      if (!response.ok || !data.draft) {
        toast({
          title: `${kind === "nutrition" ? "Nutrition" : "Sleep"} unavailable`,
          description: data.error ?? "Could not generate coaching draft.",
        });
        return;
      }
      if (data.isClinicalAdvice === true || data.draft.isClinicalAdvice) {
        toast({
          title: "Refused",
          description: "API incorrectly labelled coaching as clinical advice.",
        });
        return;
      }
      if (kind === "nutrition") setNutrition(data.draft);
      else setSleep(data.draft);
      setEscalating(null);
      toast({
        title: `${data.draft.title} ready`,
        description: "Not clinical advice · no EHR write",
      });
    } catch {
      toast({ title: "Coaching unavailable", description: "Network error." });
    } finally {
      setBusy(null);
    }
  };

  const escalate = async (kind: AgentKind, draft: CoachingDraft) => {
    try {
      await fetch("/api/audit/shield", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "defer",
          agentLabel: draft.agentId,
          label: `SHIELD: ${draft.agentId} coaching escalated for clinician HITL`,
          detail: draft.summary.slice(0, 200),
          resourceRef: `${patientLabel ?? patientId} (${patientId})`,
          category: "reviewer_decision",
          payload: {
            mode: draft.mode,
            isClinicalAdvice: false,
            ehrWrite: false,
            hitlRequired: true,
            escalated: true,
          },
        }),
      });
    } catch {
      // Local escalate still applies.
    }
    setEscalated((prev) => ({ ...prev, [kind]: true }));
    setEscalating(null);
    toast({
      title: "Escalated for clinician review",
      description: "Coaching draft staged to SHIELD · still not clinical advice · no EHR write",
    });
  };

  return (
    <Card className="shadow-sm" data-testid="coaching-draft-panel">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm">Nutrition & sleep coaching</CardTitle>
        <p className="text-xs text-muted">
          Wellness coaching drafts only — <strong>not clinical advice</strong>
          {mode === "patient" ? " · escalate to your care team if concerned" : " · HITL if escalating"}
          {" · "}no live wearable sleep stream · no EHR write
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-2">
        <DraftBlock
          kind="nutrition"
          label="Nutrition"
          draft={nutrition}
          busy={busy === "nutrition"}
          escalating={escalating === "nutrition"}
          escalated={Boolean(escalated.nutrition)}
          onGenerate={() => void generate("nutrition")}
          onStartEscalate={() => setEscalating("nutrition")}
          onCancelEscalate={() => setEscalating(null)}
          onConfirmEscalate={() => nutrition && void escalate("nutrition", nutrition)}
        />
        <DraftBlock
          kind="sleep"
          label="Sleep"
          draft={sleep}
          busy={busy === "sleep"}
          escalating={escalating === "sleep"}
          escalated={Boolean(escalated.sleep)}
          onGenerate={() => void generate("sleep")}
          onStartEscalate={() => setEscalating("sleep")}
          onCancelEscalate={() => setEscalating(null)}
          onConfirmEscalate={() => sleep && void escalate("sleep", sleep)}
        />
      </CardContent>
    </Card>
  );
}

function DraftBlock({
  kind,
  label,
  draft,
  busy,
  escalating,
  escalated,
  onGenerate,
  onStartEscalate,
  onCancelEscalate,
  onConfirmEscalate,
}: {
  kind: AgentKind;
  label: string;
  draft: CoachingDraft | null;
  busy: boolean;
  escalating: boolean;
  escalated: boolean;
  onGenerate: () => void;
  onStartEscalate: () => void;
  onCancelEscalate: () => void;
  onConfirmEscalate: () => void;
}) {
  return (
    <div
      className="space-y-2 rounded-sm border border-border-subtle p-3"
      data-testid={`coaching-${kind}-block`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold">{label} coaching draft</p>
        <Button size="sm" variant="outline" disabled={busy} onClick={onGenerate}>
          {busy ? "Generating…" : draft ? "Regenerate" : `Get ${label.toLowerCase()} draft`}
        </Button>
      </div>
      {!draft ? (
        <p className="text-xs text-muted">
          No draft yet. Generates wellness talking points only — not a clinical prescription or diagnosis.
        </p>
      ) : (
        <>
          <p className="rounded-md bg-amber-50 px-2 py-1.5 text-[11px] text-amber-950">
            NOT CLINICAL ADVICE — coaching draft only · HITL before any care-plan attachment
          </p>
          <p className="text-sm">{draft.summary}</p>
          <ul className="space-y-0.5 text-xs text-muted">
            {draft.suggestions.map((s) => (
              <li key={s}>• {s}</li>
            ))}
          </ul>
          <p className="text-[10px] font-semibold text-muted">Escalate if:</p>
          <ul className="space-y-0.5 text-[10px] text-muted">
            {draft.clinicalEscalationHints.map((h) => (
              <li key={h}>• {h}</li>
            ))}
          </ul>
          {escalated ? (
            <p className="text-xs text-accent">
              Escalated for clinician HITL · SHIELD logged · no EHR write
            </p>
          ) : escalating ? (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-warning">
                Confirm clinician escalation (HITL)
              </p>
              <HitlActions
                status="Pending"
                onAccept={onConfirmEscalate}
                onEdit={onCancelEscalate}
                onReject={() => {
                  onCancelEscalate();
                  toast({ title: "Escalation cancelled" });
                }}
                itemContext={`${label} coaching`}
              />
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={onStartEscalate}>
              Escalate to clinician (HITL)
            </Button>
          )}
        </>
      )}
    </div>
  );
}
