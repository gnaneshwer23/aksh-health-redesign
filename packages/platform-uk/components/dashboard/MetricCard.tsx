import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TONE_CLASSES = {
  default: "dashboard-metric-card",
  accent: "dashboard-metric-card dashboard-metric-card--accent",
  warn: "dashboard-metric-card dashboard-metric-card--warn",
  danger: "dashboard-metric-card dashboard-metric-card--danger",
} as const;

export function MetricCard({
  label,
  value,
  trend,
  sparkline,
  icon: Icon,
  tone = "default",
  className,
}: {
  label: string;
  value: string;
  trend?: "up" | "down" | "neutral";
  sparkline?: number[];
  icon?: LucideIcon;
  tone?: keyof typeof TONE_CLASSES;
  className?: string;
}) {
  const chartData = sparkline?.map((v, i) => ({ i, v })) ?? [];

  return (
    <Card className={cn(TONE_CLASSES[tone], "border-0 shadow-none", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
          {Icon && (
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </span>
          )}
        </div>
        <div className="mt-2 flex items-end justify-between gap-2">
          <p className="text-3xl font-bold tracking-tight text-primary">{value}</p>
          {trend && trend !== "neutral" && (
            <span className={cn("flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", trend === "up" ? "bg-accent/10 text-accent" : "bg-danger/10 text-danger")}>
              {trend === "up" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            </span>
          )}
        </div>
        {chartData.length > 0 && (
          <div className="mt-3 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line type="monotone" dataKey="v" stroke="#003D7A" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
