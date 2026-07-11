"use client";

import { EvaluationCharts } from "@/components/dashboard/researcher/EvaluationCharts";
import { ExportEvaluationButton } from "@/components/dashboard/researcher/ExportEvaluationButton";
import { useResearcherData } from "@/components/dashboard/researcher/ResearcherDataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResearcherEvaluationPage() {
  const { evaluation } = useResearcherData();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Outcome Evaluation</h2>
          <p className="text-sm text-muted">
            Pseudonymised cohort metrics and offline AI outcome signals for approved studies.
          </p>
        </div>
        <ExportEvaluationButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Available tasks", value: evaluation.availableTasks },
          { label: "Planned tasks", value: evaluation.plannedTasks },
          { label: "Blocked tasks", value: evaluation.blockedTasks },
          { label: "Dataset sources", value: evaluation.datasetSources },
        ].map((metric) => (
          <Card key={metric.label} className="border-l-4 border-l-[#E67E22] shadow-sm">
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{metric.label}</p>
              <p className="mt-1 text-2xl font-bold text-[#E67E22]">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <EvaluationCharts />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm">Evaluation boundary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted">
          <p>
            Exports include the offline research evaluation boundary artifact — task definitions, dataset boundaries,
            and explicit &quot;not yet&quot; claims. No production clinical AI safety claims are included.
          </p>
          <p>
            Use the export button above to download a JSON file authenticated to your researcher session.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
