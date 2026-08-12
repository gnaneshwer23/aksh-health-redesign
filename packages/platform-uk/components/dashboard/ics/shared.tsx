import { cn } from "@/lib/utils";

export const RISK_COLORS = ["#00A88E", "#E67E22", "#E53E3E", "#8B3A3A"];

export function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return <div className={cn("animate-pulse rounded bg-muted/20", height)} />;
}
