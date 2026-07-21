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

async function logHospitalShield(payload: {
  action: "accept" | "reject";
  label: string;
  detail: string;
  resourceRef: string;
}) {
  try {
    await fetch("/api/audit/shield", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        agentLabel: "HORIZON",
        category: "reviewer_decision"
      })
    });
  } catch {
    // Local store still updates.
  }
}

export function CapacityPanel({ data, hospitalName }: { data: HospitalData; hospitalName?: string }) {
  const { acceptHospitalRec, acceptedHospitalRecs, dismissedHospitalRecs, dismissHospitalRec } = useDashboardStore();
  const label = hospitalName ?? data.hospitalName;

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold">Capacity & Forecast</h2>
        <p className="text-xs text-muted">{label} · synthetic forecast (not live PAS)</p>
      </div>
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
              <p className="text-xs text-accent">
                Logged to SHIELD · actioned by {CURRENT_GP} · no hospital system write-back
              </p>
            ) : dismissedHospitalRecs.includes(rec.id) ? (
              <HitlActions status="Dismissed" onAccept={() => {}} onEdit={() => {}} onReject={() => {}} />
            ) : (
              <HitlActions
                variant="command"
                status="Pending"
                onAccept={() => {
                  acceptHospitalRec(rec.id, CURRENT_GP);
                  void logHospitalShield({
                    action: "accept",
                    label: "SHIELD: hospital capacity recommendation accepted",
                    detail: rec.text,
                    resourceRef: `${label} / ${rec.id}`
                  });
                  toast({
                    title: "Recommendation actioned",
                    description: "Logged to SHIELD · no PAS/EPR write"
                  });
                }}
                onEdit={() => {}}
                onReject={() => {}}
                onDismiss={() => {
                  dismissHospitalRec(rec.id, CURRENT_GP);
                  void logHospitalShield({
                    action: "reject",
                    label: "SHIELD: hospital capacity recommendation dismissed",
                    detail: rec.text,
                    resourceRef: `${label} / ${rec.id}`
                  });
                  toast({
                    title: "Recommendation dismissed",
                    description: "Logged to SHIELD · no PAS/EPR write"
                  });
                }}
              />
            )}
          </Card>
        ))}
      </section>
    </div>
  );
}
