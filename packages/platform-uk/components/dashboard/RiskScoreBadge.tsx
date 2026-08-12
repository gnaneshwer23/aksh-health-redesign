import type { OracleRisk } from "@/lib/mock-data/types";
import { cn } from "@/lib/utils";

const RISK_TONE: Record<OracleRisk, string> = {
  Low: "risk-tone-low",
  Medium: "risk-tone-medium",
  High: "risk-tone-high",
  VeryHigh: "risk-tone-very-high",
};

const RISK_TEXT: Record<OracleRisk, string> = {
  Low: "text-accent",
  Medium: "text-warning",
  High: "text-danger",
  VeryHigh: "text-[#8B3A3A]",
};

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
  const tone = RISK_TONE[risk];
  const textTone = RISK_TEXT[risk];

  if (size === "lg") {
    return (
      <div className={cn("flex flex-col items-center gap-2", className)} aria-label={`HORIZON risk score ${score}, ${risk}`}>
        <div className={cn("relative flex h-20 w-20 items-center justify-center rounded-full border-4 bg-card shadow-card", tone)}>
          <span className={cn("text-xl font-bold", textTone)}>{score}</span>
        </div>
        <span className={cn("text-xs font-semibold uppercase tracking-wide", textTone)}>{risk}</span>
      </div>
    );
  }

  return (
    <span className={cn("dashboard-status-badge border", tone, className)} aria-label={`Risk ${risk}, score ${score}`}>
      {risk} · {score}
    </span>
  );
}

export function RiskGauge({ score, risk }: { score: number; risk: OracleRisk }) {
  const tone = RISK_TONE[risk];
  const textTone = RISK_TEXT[risk];

  return (
    <div className="flex items-center gap-3">
      <div className={cn("flex h-14 w-14 items-center justify-center rounded-full border-[5px] bg-card shadow-sm", tone)}>
        <span className={cn("text-sm font-bold", textTone)}>{score}</span>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">HORIZON Score</p>
        <p className={cn("text-sm font-semibold", textTone)}>{risk} risk</p>
      </div>
    </div>
  );
}
