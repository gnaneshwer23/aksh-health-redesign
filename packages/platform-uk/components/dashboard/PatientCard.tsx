import Link from "next/link";

import { RiskScoreBadge } from "@/components/dashboard/RiskScoreBadge";
import type { Patient } from "@/lib/mock-data/types";
import { cn } from "@/lib/utils";

export function PatientCard({
  patient,
  selected,
  onClick,
  showTime,
}: {
  patient: Patient;
  selected?: boolean;
  onClick?: () => void;
  showTime?: boolean;
}) {
  const initial = patient.name.split(" ").pop()?.[0] ?? "?";
  const guardian = patient.flags.includes("GUARDIAN");

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        selected && "bg-primary/5 border-l-4 border-accent"
      )}
      aria-label={`Select patient ${patient.name}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{initial}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="font-medium truncate">{patient.name}</span>
          <span className="text-xs text-muted">{patient.age}</span>
          {showTime && patient.appointmentTime && <span className="text-xs text-muted ml-auto">{patient.appointmentTime}</span>}
        </div>
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
          <RiskScoreBadge score={patient.oracleScore} risk={patient.oracleRisk} />
          {patient.openAiItems > 0 && (
            <span className="rounded-full bg-danger px-1.5 text-[10px] text-white">{patient.openAiItems}</span>
          )}
          {guardian && <span aria-label="Guardian alert">🔴</span>}
          {patient.flags.includes("URGENT") && <span aria-label="Urgent">🔴</span>}
          {patient.flags.includes("EQUITY") && <span aria-label="Equity flag">🟡</span>}
        </div>
      </div>
    </button>
  );
}
