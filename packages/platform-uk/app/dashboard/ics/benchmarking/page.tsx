"use client";

import { PracticeBenchmarkTable } from "@/components/dashboard/ics/PracticeBenchmarkTable";
import { useIcsData } from "@/components/dashboard/ics/IcsDataContext";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { getPersonalizedLabel } from "@/lib/profile/personalization";

export default function IcsBenchmarkingPage() {
  const { data } = useIcsData();
  const { profile } = useUserProfile();
  const icsName = getPersonalizedLabel(profile, data.icsName);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Practice Benchmarking</h2>
        <p className="text-sm text-muted">
          Compare AI adoption, queue clearance, and equity performance across practices in {icsName}.
        </p>
      </div>
      <PracticeBenchmarkTable />
    </div>
  );
}
