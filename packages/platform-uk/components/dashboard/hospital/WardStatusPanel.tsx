"use client";

import { HospitalCommandMap } from "@/components/dashboard/HospitalCommandMap";
import type { HospitalData } from "@/lib/mock-data/types";

export function WardStatusPanel({ data, fullPage = false }: { data: HospitalData; fullPage?: boolean }) {
  return (
    <div className={fullPage ? "p-4" : ""}>
      <h2 className="text-sm font-semibold mb-3">Ward Status</h2>
      <HospitalCommandMap wards={data.wards} />
    </div>
  );
}
