import Link from "next/link";

import { PatientCard } from "@/components/dashboard/PatientCard";
import { Input } from "@/components/ui/input";
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
  embedded = false,
}: {
  patients: Patient[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  pathwayApprovalCount: number;
  guardianAlertCount: number;
  /** When true, omit outer aside chrome (parent provides sidebar shell). */
  embedded?: boolean;
}) {
  const content = (
    <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Today, {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
            </h2>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">{patients.length}</span>
          </div>
          <div className="space-y-1">
            {patients.map((p) => (
              <PatientCard key={p.id} patient={p} selected={selectedId === p.id} onClick={() => onSelect(p.id)} showTime />
            ))}
          </div>
        </section>

        <section>
          <label className="text-[11px] font-semibold uppercase tracking-wide text-muted" htmlFor="patient-search">
            Patient search
          </label>
          <Input
            id="patient-search"
            className="mt-2 rounded-xl border-border-subtle bg-surface-muted shadow-none"
            placeholder="Name or patient ID"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </section>

        <section>
          <Link
            href="/dashboard/gp/care-pathways"
            className="flex items-center justify-between rounded-xl border border-warning/20 bg-warning/10 px-3 py-2.5 text-xs font-medium text-warning transition-colors hover:bg-warning/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span>{pathwayApprovalCount} pathway steps need approval</span>
            <span className="rounded-full bg-warning px-2 py-0.5 text-[10px] font-bold text-white">{pathwayApprovalCount}</span>
          </Link>
        </section>

        <section>
          <div
            className={cn(
              "rounded-xl border px-3 py-2.5 text-xs",
              guardianAlertCount > 0 ? "border-danger/20 bg-danger/10 text-danger" : "border-border-subtle bg-surface-muted text-muted"
            )}
          >
            Active GUARDIAN alerts: <strong className="font-semibold">{guardianAlertCount}</strong>
          </div>
        </section>
      </div>
  );

  if (embedded) {
    return <div className="flex min-h-0 flex-1 flex-col">{content}</div>;
  }

  return (
    <aside className="flex h-full w-sidebar shrink-0 flex-col border-r border-border-subtle bg-card">
      {content}
    </aside>
  );
}
