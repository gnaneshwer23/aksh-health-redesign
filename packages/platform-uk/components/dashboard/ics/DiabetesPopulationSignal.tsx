"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildDiabetesPopulationAggregate } from "@/lib/precision-health/population-diabetes";

/**
 * B6 — the platform's one genuinely-computed Population Intelligence
 * number (docs/PHASED_BUILD_PLAN.md B6): real arithmetic over the actual
 * ~100-patient synthetic cohort, distinct from the illustrative
 * 47,832-patient static fixture the rest of this dashboard shows.
 */
export function DiabetesPopulationSignal() {
  const aggregate = buildDiabetesPopulationAggregate();

  return (
    <Card className="shadow-sm" data-testid="diabetes-population-signal">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-sm">Diabetes population signal (Segment stage)</CardTitle>
        <p className="text-xs text-muted">
          Computed live from the platform's actual {aggregate.totalPatients}-patient synthetic cohort —
          not the illustrative 47,832-patient fixture above. Segment stage only; no Predict/forecast, no
          recommendation, no EHR write.
        </p>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="T2D/T1D-flagged" value={aggregate.diabetesFlagged.display} />
          <Metric
            label="Prevalence"
            value={aggregate.prevalencePercent !== null ? `${aggregate.prevalencePercent}%` : "suppressed"}
          />
          <Metric label="With B3 signal data" value={aggregate.fixturedSignalPatients.display} />
          <Metric label="≥1 complication flag" value={aggregate.complicationSignalPatients.display} />
        </div>
        <ul className="space-y-1 text-[11px] text-muted leading-relaxed">
          {aggregate.limitations.map((limitation) => (
            <li key={limitation}>• {limitation}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-2">
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
