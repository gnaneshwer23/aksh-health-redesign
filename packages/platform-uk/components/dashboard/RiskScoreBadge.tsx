import { RISK_COLORS } from "@/lib/mock-data";
import type { OracleRisk } from "@/lib/mock-data/types";
import { cn } from "@/lib/utils";

export function RiskScoreBadge({
  score,
  risk,
  size = "sm",
  className,
}: {
  score: number;
  risk: OracleRisk;
  size?: "sm" | "lg";
  className?: string;
}) {
  const color = RISK_COLORS[risk];
  const pct = Math.min(100, Math.max(0, score));

  if (size === "lg") {
    return (
      <div className={cn("flex flex-col items-center gap-1", className)} aria-label={`ORACLE risk score ${score}, ${risk}`}>
        <div
          className="relative flex h-20 w-20 items-center justify-center rounded-full border-4"
          style={{ borderColor: color }}
        >
          <span className="text-xl font-bold" style={{ color }}>{score}</span>
        </div>
        <span className="text-xs font-semibold" style={{ color }}>{risk}</span>
      </div>
    );
  }

  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-white", className)}
      style={{ backgroundColor: color }}
      aria-label={`Risk ${risk}, score ${score}`}
    >
      {risk} · {score}
    </span>
  );
}

export function RiskGauge({ score, risk }: { score: number; risk: OracleRisk }) {
  const color = RISK_COLORS[risk];
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-14 w-14 rounded-full border-[5px] flex items-center justify-center"
        style={{ borderColor: color, background: `conic-gradient(${color} ${score}%, #E2E8F0 0)` }}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-sm font-bold" style={{ color }}>
          {score}
        </div>
      </div>
      <div>
        <p className="text-xs text-muted">ORACLE Score</p>
        <p className="text-sm font-semibold" style={{ color }}>{risk} risk</p>
      </div>
    </div>
  );
}
