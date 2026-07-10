import { ArrowDown, ArrowUp } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  trend,
  sparkline,
  className,
}: {
  label: string;
  value: string;
  trend?: "up" | "down" | "neutral";
  sparkline?: number[];
  className?: string;
}) {
  const chartData = sparkline?.map((v, i) => ({ i, v })) ?? [];

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardContent className="p-4">
        <p className="text-xs text-muted">{label}</p>
        <div className="mt-1 flex items-end justify-between gap-2">
          <p className="text-2xl font-bold text-primary">{value}</p>
          {trend && trend !== "neutral" && (
            <span className={cn("flex items-center text-xs", trend === "up" ? "text-accent" : "text-danger")}>
              {trend === "up" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            </span>
          )}
        </div>
        {chartData.length > 0 && (
          <div className="mt-2 h-10">
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
