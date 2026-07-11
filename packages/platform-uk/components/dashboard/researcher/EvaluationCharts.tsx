"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useResearcherData } from "./ResearcherDataContext";

const STAGE_COLORS: Record<string, string> = {
  available_now: "#E67E22",
  planned: "#F39C12",
  not_allowed_yet: "#95A5A6",
};

const METRIC_BARS = [
  { name: "Scenario pass", value: 87 },
  { name: "Blocker recall", value: 94 },
  { name: "Field complete", value: 91 },
] as const;

export function EvaluationCharts() {
  const { evaluation } = useResearcherData();

  const taskChartData = evaluation.taskStages.map((task) => ({
    name: task.label.split(" ").slice(0, 3).join(" "),
    count: 1,
    stage: task.stage,
    fullLabel: task.label,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm">Evaluation task pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskChartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 1]} hide />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(_, __, item) => [item.payload.fullLabel, "Task"]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {taskChartData.map((entry) => (
                    <Cell key={entry.fullLabel} fill={STAGE_COLORS[entry.stage] ?? "#E67E22"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#E67E22]" /> Available now ({evaluation.availableTasks})
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#F39C12]" /> Planned ({evaluation.plannedTasks})
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#95A5A6]" /> Not allowed yet ({evaluation.blockedTasks})
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm">Synthetic evaluation metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={METRIC_BARS}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => [`${v}%`, "Score"]} />
                <Bar dataKey="value" fill="#E67E22" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-xs text-muted">
            Offline rehearsal metrics from synthetic review cases only. Not production clinical AI claims.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
