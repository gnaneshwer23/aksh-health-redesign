"use client";

import { calcBedOccupancyPct } from "@/components/dashboard/hospital/hospital-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { HospitalData } from "@/lib/mock-data/types";

export function ViewAnalysisDialog({
  data,
  open,
  onOpenChange,
}: {
  data: HospitalData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const bedPct = calcBedOccupancyPct(data);
  const forecastSnippet = data.capacityForecast.slice(0, 7);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Digital Twin: ED surge analysis</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p>
            Model predicts a <strong>73% probability</strong> of ED surge within the next 12 hours based on admission
            velocity, discharge backlog, and seasonal patterns.
          </p>
          <Card className="shadow-sm border-warning/30 bg-warning/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Capacity summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-muted">
              <p>
                Current bed occupancy: {bedPct}% across {data.wards.length} wards
              </p>
              <p>
                ED wait time: {data.edWaitingTime} hours ({data.edPatientsWaiting} patients waiting)
              </p>
              <p>
                Net bed demand (14-day forecast): +
                {data.capacityForecast.slice(0, 3).reduce((s, d) => s + d.netBedDemand, 0)} beds over next 3 days
              </p>
            </CardContent>
          </Card>
          <div>
            <p className="font-medium mb-1">14-day admission forecast</p>
            <ul className="space-y-1 text-muted text-xs">
              {forecastSnippet.map((day) => (
                <li key={day.day} className="flex justify-between gap-4">
                  <span>{day.day}</span>
                  <span>
                    +{day.predictedAdmissions} adm / −{day.predictedDischarges} disch (net {day.netBedDemand > 0 ? "+" : ""}
                    {day.netBedDemand})
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">Recommended actions</p>
            <ul className="list-disc pl-5 space-y-1 text-muted">
              <li>Accelerate discharge reviews in wards 3A, 3B, 4A</li>
              <li>Pre-position overflow beds in Ward 2B respiratory unit</li>
              <li>Trigger agency staffing review for night shift</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
