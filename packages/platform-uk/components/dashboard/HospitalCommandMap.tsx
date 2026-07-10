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

export function HospitalCommandMap({ wards }: { wards: Ward[] }) {
  const awaitingDischarge = wards.reduce((s, w) => s + (w.awaitingDischarge ?? 0), 0);

  return (
    <div className="space-y-4">
      <TooltipProvider>
        <div className="grid grid-cols-4 gap-2">
          {wards.map((ward) => {
            const pct = Math.round((ward.occupiedBeds / ward.totalBeds) * 100);
            return (
              <Tooltip key={ward.name}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={cn("rounded-sm p-3 text-left text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", wardColor(ward))}
                    style={{ minHeight: `${40 + ward.totalBeds}px` }}
                    aria-label={`${ward.name}, ${pct}% occupied`}
                  >
                    <p className="text-[10px] font-bold leading-tight">{ward.name.split("—")[0]?.trim()}</p>
                    <p className="text-xs mt-1">{ward.occupiedBeds}/{ward.totalBeds}</p>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">{ward.name}</p>
                  <p>Beds: {ward.occupiedBeds}/{ward.totalBeds}</p>
                  <p>Staff ratio: {ward.staffRatio}</p>
                  <p>Avg LOS: {ward.averageLos} days</p>
                  <p>Awaiting discharge: {ward.awaitingDischarge}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
      <button type="button" className="text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        {awaitingDischarge} patients medically fit but awaiting discharge
      </button>
    </div>
  );
}
