"use client";

import { useEffect, useState } from "react";

import { calcBedOccupancyPct } from "@/components/dashboard/hospital/hospital-utils";
import type { HospitalData } from "@/lib/mock-data/types";

export function CommandHeader({
  data,
  hospitalName,
}: {
  data: HospitalData;
  hospitalName?: string;
}) {
  // Client-only clock: rendering the time on the server caused hydration mismatches.
  const [time, setTime] = useState<Date | null>(null);
  const bedPct = calcBedOccupancyPct(data);
  const displayName = hospitalName ?? data.hospitalName;

  useEffect(() => {
    setTime(new Date());
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-primary text-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Hospital Command Centre: {displayName}</h1>
          <p className="text-xs opacity-80">{time ? time.toLocaleString("en-GB") : "\u00a0"}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-danger/90 px-3 py-1">🔴 ED Wait: {data.edWaitingTime} hrs</span>
          <span className="rounded-full bg-warning/90 px-3 py-1 text-primary">🟡 Beds: {bedPct}% occupied</span>
          <span className="rounded-full bg-accent/90 px-3 py-1 text-primary">
            ✅ Theatres: {data.theatresRunning}/{data.theatresTotal}
          </span>
          <span className="rounded-full bg-warning/90 px-3 py-1 text-primary">🟠 Staff: Night shift -2 nurses</span>
        </div>
      </div>
    </div>
  );
}
