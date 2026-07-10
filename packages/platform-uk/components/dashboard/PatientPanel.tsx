import Link from "next/link";

import { PatientCard } from "@/components/dashboard/PatientCard";
import type { Patient } from "@/lib/mock-data/types";
import { cn } from "@/lib/utils";

export function PatientPanel({
  patients,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
  pathwayApprovalCount,
  guardianAlertCount,
}: {
  patients: Patient[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  pathwayApprovalCount: number;
  guardianAlertCount: number;
}) {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Today — {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</h2>
            <span className="rounded-full bg-primary/10 px-2 text-xs text-primary">{patients.length}</span>
          </div>
          <div className="space-y-0.5">
            {patients.map((p) => (
              <PatientCard key={p.id} patient={p} selected={selectedId === p.id} onClick={() => onSelect(p.id)} showTime />
            ))}
          </div>
        </section>

        <section>
          <label className="text-xs font-medium text-muted" htmlFor="patient-search">Patient search</label>
          <input
            id="patient-search"
            className="mt-1 w-full rounded-sm border border-border px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            placeholder="Name or NHS number"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </section>

        <section>
          <Link href="/dashboard/gp/care-pathways" className="flex items-center justify-between rounded-sm bg-warning/10 px-2 py-2 text-xs hover:bg-warning/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <span>{pathwayApprovalCount} pathway steps need approval</span>
            <span className="rounded-full bg-warning px-1.5 text-white">{pathwayApprovalCount}</span>
          </Link>
        </section>

        <section>
          <div className={cn("rounded-sm px-2 py-2 text-xs", guardianAlertCount > 0 ? "bg-danger/10 text-danger" : "bg-background text-muted")}>
            Active GUARDIAN alerts: <strong>{guardianAlertCount}</strong>
          </div>
        </section>
      </div>
    </aside>
  );
}
