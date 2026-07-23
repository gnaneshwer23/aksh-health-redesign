"use client";

import { AdmissionForecast } from "@/components/dashboard/ics/AdmissionForecast";
import { IcsHeroDemoPath } from "@/components/dashboard/ics/IcsHeroDemoPath";
import { DigitalTwinPanel } from "@/components/dashboard/DigitalTwinPanel";
import { useIcsData } from "@/components/dashboard/ics/IcsDataContext";

export default function IcsForecastPage() {
  const { data } = useIcsData();

  return (
    <div className="space-y-6">
      <IcsHeroDemoPath />
      <div>
        <h2 className="text-lg font-semibold text-foreground">Admission Forecast & Population risk state</h2>
        <p className="text-sm text-muted">
          ICS-level admission trajectory with aggregate risk-state intelligence (HORIZON / PATHWAY
          scaffolding — not a physiological twin) · liveEmis:false.
        </p>
      </div>
      <AdmissionForecast />
      <DigitalTwinPanel mode="ics" icsData={data} readOnly />
    </div>
  );
}
