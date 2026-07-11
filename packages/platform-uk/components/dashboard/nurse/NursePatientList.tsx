"use client";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { PatientCard } from "@/components/dashboard/PatientCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { patients } from "@/lib/mock-data";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

export function NursePatientList() {
  const { nurseFilter, setNurseFilter, selectedPatientId, setSelectedPatient } = useDashboardStore();

  const filtered = patients.filter((p) => {
    if (nurseFilter === "alerts") return p.flags.includes("GUARDIAN") || p.flags.includes("URGENT");
    if (nurseFilter === "observations") return !p.lastObsTime?.startsWith("2026-07-10");
    if (nurseFilter === "completed") return p.lastObsTime?.startsWith("2026-07-10");
    return true;
  });

  return (
    <aside className="w-72 shrink-0 overflow-y-auto border-r border-border bg-card p-3">
      <ConsentBanner className="mb-3" />
      <Tabs value={nurseFilter} onValueChange={(v) => setNurseFilter(v as typeof nurseFilter)}>
        <TabsList className="grid h-auto w-full grid-cols-2">
          <TabsTrigger value="all" className="text-[10px]">
            All
          </TabsTrigger>
          <TabsTrigger value="alerts" className="text-[10px]">
            🔴 Alerts
          </TabsTrigger>
          <TabsTrigger value="observations" className="text-[10px]">
            Obs Due
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-[10px]">
            Done
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="mt-3 space-y-1">
        {filtered.map((p) => (
          <PatientCard
            key={p.id}
            patient={p}
            selected={(selectedPatientId ?? "P001") === p.id}
            onClick={() => setSelectedPatient(p.id)}
          />
        ))}
      </div>
    </aside>
  );
}
