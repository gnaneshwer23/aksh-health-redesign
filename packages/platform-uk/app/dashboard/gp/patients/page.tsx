"use client";

import Link from "next/link";
import { useState } from "react";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PatientCard } from "@/components/dashboard/PatientCard";
import { Input } from "@/components/ui/input";
import { patients, searchPatients } from "@/lib/mock-data";

export default function GpPatientsPage() {
  const [query, setQuery] = useState("");
  const list = query ? searchPatients(query) : patients;

  return (
    <DashboardShell role="gp" title="My Patients">
      <div className="overflow-y-auto p-4 space-y-4">
        <ConsentBanner />
        <Input placeholder="Search by name or NHS number" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search patients" />
        {list.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border-subtle p-8 text-center text-sm text-muted">
            No patients match your search.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <Link key={p.id} href={`/dashboard/gp/patients/${p.id}`} className="rounded-sm border border-border bg-card p-2 shadow-sm hover:border-primary/30">
                <PatientCard patient={p} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
