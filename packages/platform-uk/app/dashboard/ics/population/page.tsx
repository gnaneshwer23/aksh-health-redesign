"use client";

import { PopulationCharts } from "@/components/dashboard/ics/PopulationCharts";
import { useIcsData } from "@/components/dashboard/ics/IcsDataContext";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { getPersonalizedLabel } from "@/lib/profile/personalization";

export default function IcsPopulationPage() {
  const { data, source, loading } = useIcsData();
  const { profile } = useUserProfile();
  const icsName = getPersonalizedLabel(profile, data.icsName);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Population Health</h2>
        <p className="text-sm text-muted">
          Risk profile and condition prevalence for {icsName} across deprivation quintiles.
          {!loading && source
            ? ` · Data source: ${source === "neo4j" ? "live Neo4j graph" : "local fallback"}`
            : null}
        </p>
      </div>
      <PopulationCharts />
    </div>
  );
}
