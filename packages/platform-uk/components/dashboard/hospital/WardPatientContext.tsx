"use client";

import { MessageSquareOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Ward } from "@/lib/mock-data/types";
import { patients } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

/**
 * Ward drill-in for hospital ops home.
 * Shows synthetic bed/patient context without enabling named PHI Ask for operations_lead.
 */
export function WardPatientContext({
  ward,
  onClear,
  className,
}: {
  ward: Ward;
  onClear: () => void;
  className?: string;
}) {
  // Synthetic rehearsal cohort — illustrative occupancy names, not a live PAS census.
  const samplePatients = patients.slice(0, Math.min(4, Math.max(2, ward.awaitingDischarge ?? 2)));

  return (
    <section
      data-testid="hospital-ward-patient-context"
      aria-label={`Ward context: ${ward.name}`}
      className={cn(
        "rounded-xl border border-border-subtle bg-card/80 px-4 py-3 shadow-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{ward.name}</p>
          <p className="mt-0.5 text-xs text-muted">
            {ward.occupiedBeds}/{ward.totalBeds} beds · staff {ward.staffRatio} ·{" "}
            {ward.awaitingDischarge ?? 0} awaiting discharge · synthetic PAS rehearsal
          </p>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={onClear} data-testid="ward-context-clear">
          Close
        </Button>
      </div>

      <ul className="mt-3 space-y-2" aria-label="Illustrative ward patients">
        {samplePatients.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-subtle/80 bg-surface-muted/20 px-3 py-2 text-sm"
          >
            <div>
              <p className="font-medium text-foreground">{p.name}</p>
              <p className="text-[11px] text-muted">
                {p.id} · {p.activeConditions[0] ?? "diabetes / care coordination"} · synthetic
              </p>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {p.oracleRisk}
            </Badge>
          </li>
        ))}
      </ul>

      <div
        data-testid="ops-ask-aksh-denied"
        className="mt-3 flex gap-2 rounded-lg border border-dashed border-border-subtle bg-muted/20 px-3 py-2.5"
      >
        <MessageSquareOff className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">Ask Aksh · named chart denied</p>
          <p className="text-[11px] leading-relaxed text-muted">
            Hospital executive is an operations role (`operations_lead`). Named patient Ask Aksh stays
            denied by RBAC — no PHI chat from this surface. Use a clinical role (GP / nurse /
            pharmacist) for patient-scoped Ask, or stay on ward occupancy metrics here.
          </p>
          <Button type="button" size="sm" variant="outline" disabled data-testid="hospital-ask-aksh-disabled">
            Ask Aksh (not available)
          </Button>
        </div>
      </div>
    </section>
  );
}
