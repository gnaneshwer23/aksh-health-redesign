"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PatientCard } from "@/components/dashboard/PatientCard";
import { Input } from "@/components/ui/input";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { patients, searchPatients } from "@/lib/mock-data";
import { buildEmptyStateMessage, filterGpPatientsForProfile } from "@/lib/profile/personalization";

export default function GpPatientsPage() {
  const { profile } = useUserProfile();
  const [query, setQuery] = useState("");
  const list = useMemo(() => {
    const source = query ? searchPatients(query) : patients;
    return filterGpPatientsForProfile(source, profile);
  }, [query, profile]);

  return (
    <DashboardShell role="gp" title="My Patients" organisation={profile?.organisation}>
      <div className="overflow-y-auto p-4 space-y-4">
        <ConsentBanner />
        <Input placeholder="Search by name or patient ID" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search patients" />
        {list.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border-subtle p-8 text-center text-sm text-muted">
            {query
              ? "No patients match your search."
              : buildEmptyStateMessage(profile, "patients", "No patients in your list yet.")}
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
