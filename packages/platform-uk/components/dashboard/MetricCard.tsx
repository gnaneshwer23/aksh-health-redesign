import { useId } from "react";
import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TONE_CLASSES = {
  default: "dashboard-metric-card",
  accent: "dashboard-metric-card dashboard-metric-card--accent",
  warn: "dashboard-metric-card dashboard-metric-card--warn",
  danger: "dashboard-metric-card dashboard-metric-card--danger",
} as const;

const TONE_STROKE = {
  default: "#00A88E",
  accent: "#00A88E",
  warn: "#E5A43B",
  danger: "#E85D5D",
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
  const stroke = TONE_STROKE[tone];
  const fillId = `metric-fill-${useId().replace(/:/g, "")}`;

  return (
    <Card className={cn(TONE_CLASSES[tone], "border-0 shadow-none", className)}>
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <p className="dashboard-metric-label">{label}</p>
          {Icon && (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pastel-mint text-pastel-mint-ink">
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </span>
          )}
        </div>
        <div className="mt-4 flex items-end justify-between gap-2">
          <p className="dashboard-metric-value">{value}</p>
          {trend && trend !== "neutral" && (
            <span
              className={cn(
                "mb-0.5 flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                trend === "up" ? "bg-pastel-mint text-pastel-mint-ink" : "bg-pastel-coral text-pastel-coral-ink"
              )}
            >
              {trend === "up" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            </span>
          )}
        </div>
        {chartData.length > 0 && (
          <div className="mt-4 h-11">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={stroke}
                  strokeWidth={2.25}
                  fill={`url(#${fillId})`}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
