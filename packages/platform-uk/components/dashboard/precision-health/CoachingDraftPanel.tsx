"use client";

import { useState } from "react";

import { HitlActions } from "@/components/dashboard/SOAPEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import type { CoachingDraft } from "@/lib/precision-health/coaching";
import { useReviewerIdentity } from "@/lib/hooks/use-reviewer-identity";
import { describeShieldOutcome, recordShieldEvent, type ShieldWriteOutcome } from "@/lib/shield-client";

type AgentKind = "nutrition" | "sleep" | "exercise" | "mental-health";

type CoachingResponse = {
  draft?: CoachingDraft;
  isClinicalAdvice?: boolean;
  ehrWrite?: boolean;
  error?: string;
};

const AGENT_LABELS: Record<AgentKind, string> = {
  nutrition: "Nutrition",
  sleep: "Sleep",
  exercise: "Exercise",
  "mental-health": "Mental health",
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
  const [drafts, setDrafts] = useState<Partial<Record<AgentKind, CoachingDraft>>>({});
  const [busy, setBusy] = useState<AgentKind | null>(null);
  const [escalating, setEscalating] = useState<AgentKind | null>(null);
  const [escalated, setEscalated] = useState<Partial<Record<AgentKind, ShieldWriteOutcome>>>({});
  const reviewer = useReviewerIdentity();

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
          title: `${AGENT_LABELS[kind]} unavailable`,
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
      setDrafts((prev) => ({ ...prev, [kind]: data.draft }));
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
    const outcome = await recordShieldEvent(
      {
        event: "escalated",
        subject: "coaching",
        action: "defer",
        agent: draft.agentId,
        note: draft.summary.slice(0, 200),
        // C4 — opaque id only; /api/audit/shield normalises to pt_* (no labels).
        resourceRef: patientId,
      },
      { authenticated: reviewer.authenticated }
    );
    setEscalated((prev) => ({ ...prev, [kind]: outcome }));
    setEscalating(null);
    toast({
      title: "Escalated for clinician review",
      description: `${describeShieldOutcome(outcome)} · still not clinical advice · no EHR write`,
    });
  };

  const kinds: AgentKind[] = ["nutrition", "sleep", "exercise", "mental-health"];

  return (
    <Card className="shadow-sm" data-testid="coaching-draft-panel">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm">Wellness coaching drafts</CardTitle>
        <p className="text-xs text-muted">
          Nutrition, sleep, exercise & mental-health — <strong>not clinical advice</strong>
          {mode === "patient" ? " · escalate to your care team if concerned" : " · HITL if escalating"}
          {" · "}no invented live wearable stream · no EHR write
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-2">
        {kinds.map((kind) => {
          const draft = drafts[kind] ?? null;
          return (
            <DraftBlock
              key={kind}
              kind={kind}
              label={AGENT_LABELS[kind]}
              draft={draft}
              busy={busy === kind}
              escalating={escalating === kind}
              escalated={escalated[kind] ?? null}
              onGenerate={() => void generate(kind)}
              onStartEscalate={() => setEscalating(kind)}
              onCancelEscalate={() => setEscalating(null)}
              onConfirmEscalate={() => draft && void escalate(kind, draft)}
            />
          );
        })}
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
  escalated: ShieldWriteOutcome | null;
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
              Escalated for clinician HITL · {describeShieldOutcome(escalated)} · no EHR write
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
