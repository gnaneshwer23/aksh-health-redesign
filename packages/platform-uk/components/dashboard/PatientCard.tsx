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
      className={cn("dashboard-patient-row", selected && "dashboard-patient-row--selected")}
      aria-label={`Select patient ${patient.name}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary ring-2 ring-white">
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate font-medium text-foreground">{patient.name}</span>
          <span className="text-xs text-muted">{patient.age}</span>
          {showTime && patient.appointmentTime && (
            <span className="ml-auto text-xs font-medium text-steel">{patient.appointmentTime}</span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <RiskScoreBadge score={patient.oracleScore} risk={patient.oracleRisk} />
          {patient.openAiItems > 0 && (
            <span className="rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">{patient.openAiItems}</span>
          )}
          {guardian && <span className="dashboard-status-badge bg-danger/10 text-danger">Guardian</span>}
          {patient.flags.includes("URGENT") && <span className="dashboard-status-badge bg-danger/10 text-danger">Urgent</span>}
          {patient.flags.includes("EQUITY") && <span className="dashboard-status-badge bg-warning/10 text-warning">Equity</span>}
        </div>
      </div>
    </button>
  );
}
