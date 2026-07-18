"use client";

import { useState } from "react";

import { ViewAnalysisDialog } from "@/components/dashboard/hospital/ViewAnalysisDialog";
import { Button } from "@/components/ui/button";
import type { HospitalData } from "@/lib/mock-data/types";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

export function SurgeAlertBanner({ data }: { data: HospitalData }) {
  const { dismissedHospitalAlerts, dismissHospitalAlert } = useDashboardStore();
  const [analysisOpen, setAnalysisOpen] = useState(false);

  if (dismissedHospitalAlerts.includes("surge")) return null;

  return (
    <>
      <div className="bg-warning/15 border-b border-warning/30 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm">
          Risk-state alert: 73% probability of ED surge in next 12 hours (model demo — not a physiological twin).
          Recommend: accelerate discharge reviews in wards 3A, 3B, 4A
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setAnalysisOpen(true)}>
            View Analysis
          </Button>
          <Button size="sm" variant="ghost" onClick={() => dismissHospitalAlert("surge")}>
            Dismiss
          </Button>
        </div>
      </div>
      <ViewAnalysisDialog data={data} open={analysisOpen} onOpenChange={setAnalysisOpen} />
    </>
  );
}
