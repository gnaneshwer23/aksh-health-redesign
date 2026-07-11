"use client";

import { HospitalCommandMap } from "@/components/dashboard/HospitalCommandMap";
import type { HospitalData } from "@/lib/mock-data/types";

export function WardStatusPanel({
  data,
  fullPage = false,
  hospitalName,
}: {
  data: HospitalData;
  fullPage?: boolean;
  hospitalName?: string;
}) {
  const label = hospitalName ?? data.hospitalName;
  return (
    <div className={fullPage ? "p-4" : ""}>
      <h2 className="text-sm font-semibold mb-1">Ward Status</h2>
      <p className="text-xs text-muted mb-3">{label}</p>
      <HospitalCommandMap wards={data.wards} />
    </div>
  );
}
