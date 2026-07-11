"use client";

import { CapacityChart } from "@/components/dashboard/CapacityChart";
import { HitlActions } from "@/components/dashboard/SOAPEditor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import { CURRENT_GP } from "@/lib/mock-data";
import type { HospitalData } from "@/lib/mock-data/types";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";
import { cn } from "@/lib/utils";

export function CapacityPanel({ data }: { data: HospitalData }) {
  const { acceptHospitalRec, acceptedHospitalRecs, dismissedHospitalRecs, dismissHospitalRec } = useDashboardStore();

  return (
    <div className="p-4 space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm">Capacity Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <CapacityChart data={data.capacityForecast} />
        </CardContent>
      </Card>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">AI Recommendations</h3>
        {data.aiRecommendations.map((rec) => (
          <Card key={rec.id} className="shadow-sm p-4">
            <div className="flex justify-between gap-2 mb-2">
              <p className="text-sm">{rec.text}</p>
              <Badge className={cn(rec.urgency === "Urgent" ? "bg-danger" : "bg-warning")}>{rec.urgency}</Badge>
            </div>
            {acceptedHospitalRecs.includes(rec.id) ? (
              <p className="text-xs text-accent">Written to Record · Actioned · {CURRENT_GP}</p>
            ) : dismissedHospitalRecs.includes(rec.id) ? (
              <HitlActions status="Dismissed" onAccept={() => {}} onEdit={() => {}} onReject={() => {}} />
            ) : (
              <HitlActions
                variant="command"
                status="Pending"
                onAccept={() => {
                  acceptHospitalRec(rec.id, CURRENT_GP);
                  toast({ title: "Recommendation actioned" });
                }}
                onEdit={() => {}}
                onReject={() => {}}
                onDismiss={() => {
                  dismissHospitalRec(rec.id, CURRENT_GP);
                  toast({ title: "Recommendation dismissed" });
                }}
              />
            )}
          </Card>
        ))}
      </section>
    </div>
  );
}
