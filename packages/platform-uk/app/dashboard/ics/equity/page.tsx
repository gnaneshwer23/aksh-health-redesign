"use client";

import { EquityDeepDive } from "@/components/dashboard/ics/EquityDeepDive";
import { useIcsData } from "@/components/dashboard/ics/IcsDataContext";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { getPersonalizedLabel } from "@/lib/profile/personalization";

export default function IcsEquityPage() {
  const { data } = useIcsData();
  const { profile } = useUserProfile();
  const icsName = getPersonalizedLabel(profile, data.icsName);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Equity Metrics</h2>
        <p className="text-sm text-muted">COMPASS agent flags and recommended interventions for {icsName}.</p>
      </div>
      <EquityDeepDive />
    </div>
  );
}
