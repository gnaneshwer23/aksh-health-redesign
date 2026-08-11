"use client";

import { DiabetesPopulationSignal } from "@/components/dashboard/ics/DiabetesPopulationSignal";
import { IcsHeroDemoPath } from "@/components/dashboard/ics/IcsHeroDemoPath";
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
      <IcsHeroDemoPath />
      <div>
        <h2 className="text-lg font-semibold text-foreground">Population Health</h2>
        <p className="text-sm text-muted">
          Risk profile and condition prevalence for {icsName} across deprivation quintiles —
          aggregate synthetic cohorts · liveEmis:false · no patient-level spill.
          {!loading && source
            ? ` · Data source: ${
                source === "neo4j"
                  ? "live Neo4j graph"
                  : source === "demo"
                    ? "public synthetic demo"
                    : "local fallback"
              }`
            : null}
        </p>
        <p className="mt-1 text-xs text-muted">
          These numbers ({data.totalPatients.toLocaleString()} patients) are an illustrative,
          hand-authored, synthetic-scale demonstration fixture — not a live computed aggregate, and
          not linked to the platform&apos;s actual ~100-patient synthetic cohort used for individual
          HORIZON/GUARDIAN/Diabetes-module demos. This is Population Intelligence&apos;s Segment/Predict
          stages as they exist today (static, not yet a real computed pipeline) — see the Diabetes
          population signal below for the one aggregate on this page that is genuinely computed.
        </p>
      </div>
      <PopulationCharts />
      <DiabetesPopulationSignal />
    </div>
  );
}
