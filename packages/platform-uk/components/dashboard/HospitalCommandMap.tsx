"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Ward } from "@/lib/mock-data/types";
import { cn } from "@/lib/utils";

function wardColor(ward: Ward) {
  const pct = ward.occupiedBeds / ward.totalBeds;
  if (pct > 0.95) return "bg-danger";
  if (pct >= 0.8) return "bg-warning";
  return "bg-accent";
}

export function HospitalCommandMap({
  wards,
  selectedWardName = null,
  onSelectWard,
}: {
  wards: Ward[];
  selectedWardName?: string | null;
  onSelectWard?: (ward: Ward) => void;
}) {
  const awaitingDischarge = wards.reduce((s, w) => s + (w.awaitingDischarge ?? 0), 0);

  return (
    <div className="space-y-4">
      <TooltipProvider>
        <div className="grid grid-cols-4 gap-2">
          {wards.map((ward) => {
            const pct = Math.round((ward.occupiedBeds / ward.totalBeds) * 100);
            const selected = selectedWardName === ward.name;
            return (
              <Tooltip key={ward.name}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    data-testid={`hospital-ward-${ward.name.split(":")[0]?.trim().replace(/\s+/g, "-").toLowerCase()}`}
                    className={cn(
                      "rounded-sm p-3 text-left text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      wardColor(ward),
                      selected && "ring-2 ring-offset-2 ring-primary"
                    )}
                    style={{ minHeight: `${40 + ward.totalBeds}px` }}
                    aria-label={`${ward.name}, ${pct}% occupied`}
                    aria-pressed={onSelectWard ? selected : undefined}
                    onClick={() => onSelectWard?.(ward)}
                  >
                    <p className="text-[10px] font-bold leading-tight">{ward.name.split(":")[0]?.trim()}</p>
                    <p className="mt-1 text-xs">
                      {ward.occupiedBeds}/{ward.totalBeds}
                    </p>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">{ward.name}</p>
                  <p>
                    Beds: {ward.occupiedBeds}/{ward.totalBeds}
                  </p>
                  <p>Staff ratio: {ward.staffRatio}</p>
                  <p>Avg LOS: {ward.averageLos} days</p>
                  <p>Awaiting discharge: {ward.awaitingDischarge}</p>
                  {onSelectWard ? <p className="mt-1 text-[10px]">Click for ward context</p> : null}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
      <p className="text-xs text-muted">
        {awaitingDischarge} patients medically fit but awaiting discharge (synthetic)
      </p>
    </div>
  );
}
