"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DiabetesCoachingDraft } from "@/lib/disease-modules/diabetes";

type DiabetesCoachingResponse = {
  available?: boolean;
  coachingDrafts?: DiabetesCoachingDraft[];
  note?: string;
  error?: string;
};

const MODULE_TITLE: Record<DiabetesCoachingDraft["moduleId"], string> = {
  NUTRITION: "Nutrition",
  EXERCISE: "Exercise",
  BEHAVIOUR: "Behaviour"
};

/**
 * B4 (docs/PHASED_BUILD_PLAN.md) — Diabetes coaching drafts on the patient-companion "coaching
 * surface" only (FR-DIAB-012's routing partition), read-only, same honesty pattern as
 * HealthPlanDraftPanel's `mode="patient"` view: no Accept/Edit/Reject here (nothing to action on
 * the patient side — the underlying HORIZON/GUARDIAN contribution these drafts sit alongside is
 * still HITL-gated on the clinician side in ClinicalOrchestratePanel). Never shows a dose/
 * prescribing affordance — these are wellness talking points, not clinical advice.
 */
export function DiabetesCoachingPanel({
  patientId,
  patientLabel
}: {
  patientId: string;
  patientLabel?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);
  const [drafts, setDrafts] = useState<DiabetesCoachingDraft[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/patients/${encodeURIComponent(patientId)}/diabetes-coaching`, {
          credentials: "include"
        });
        const data = (await response.json()) as DiabetesCoachingResponse;
        if (cancelled) return;
        setAvailable(Boolean(data.available));
        setDrafts(data.coachingDrafts ?? []);
      } catch {
        if (!cancelled) {
          setAvailable(false);
          setDrafts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  if (loading || !available || drafts.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-sm" data-testid="diabetes-coaching-panel">
      <CardHeader className="space-y-0 p-4 pb-2">
        <CardTitle className="text-sm">Diabetes coaching (wellness)</CardTitle>
        <p className="text-xs text-muted">
          Demo/synthetic-cohort talking points for {patientLabel ?? patientId} · draft only · HITL-gated on
          your care team&apos;s side · isClinicalAdvice: false · ehrWrite: false.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-2">
        {drafts.map((draft) => (
          <div
            key={draft.agentId}
            className="space-y-1.5 rounded-sm border border-border-subtle p-3"
            data-testid={`diabetes-coaching-draft-${draft.moduleId}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide">
              {MODULE_TITLE[draft.moduleId]} · {draft.title}
            </p>
            <p className="text-sm">{draft.summary}</p>
            <ul className="space-y-0.5 text-xs text-muted">
              {draft.suggestions.map((suggestion) => (
                <li key={suggestion}>• {suggestion}</li>
              ))}
            </ul>
            <p className="text-xs font-semibold text-amber-700" data-testid="diabetes-coaching-not-advice">
              NOT CLINICAL ADVICE — coaching draft only, not a diagnosis.
            </p>
            <ul className="space-y-0.5 text-[10px] text-muted">
              {draft.disclaimers.map((disclaimer) => (
                <li key={disclaimer}>• {disclaimer}</li>
              ))}
            </ul>
          </div>
        ))}
        <p className="text-[10px] text-muted">
          A concerning symptom or safety signal in a check-in routes to your care team for review — never
          handled automatically.
        </p>
      </CardContent>
    </Card>
  );
}
