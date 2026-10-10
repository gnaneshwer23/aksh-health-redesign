"use client";

import { useState } from "react";

import { CapacityChart } from "@/components/dashboard/CapacityChart";
import { HitlActions } from "@/components/dashboard/SOAPEditor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import { useReviewerIdentity } from "@/lib/hooks/use-reviewer-identity";
import type { HospitalData } from "@/lib/mock-data/types";
import { describeShieldOutcome, recordShieldEvent, type ShieldWriteOutcome } from "@/lib/shield-client";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";
import { cn } from "@/lib/utils";

export function CapacityPanel({ data, hospitalName }: { data: HospitalData; hospitalName?: string }) {
  const { acceptHospitalRec, acceptedHospitalRecs, dismissedHospitalRecs, dismissHospitalRec } = useDashboardStore();
  const label = hospitalName ?? data.hospitalName;
  const reviewer = useReviewerIdentity();
  const [outcomes, setOutcomes] = useState<Record<string, ShieldWriteOutcome>>({});

  const logDecision = async (recId: string, text: string, action: "accept" | "reject") => {
    const outcome = await recordShieldEvent(
      {
        action,
        agentLabel: "HORIZON",
        label: `SHIELD: hospital capacity recommendation ${action === "accept" ? "accepted" : "dismissed"}`,
        detail: text,
        resourceRef: `${label} / ${recId}`,
      },
      { authenticated: reviewer.authenticated }
    );
    setOutcomes((prev) => ({ ...prev, [recId]: outcome }));
    return outcome;
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold">Capacity & Forecast</h2>
        <p className="text-xs text-muted">{label} · synthetic forecast (not a live hospital system)</p>
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
              <Badge className={cn(rec.urgency === "Urgent" ? "bg-[#b42318]" : "bg-[#8a5a00]")}>{rec.urgency}</Badge>
            </div>
            {acceptedHospitalRecs.includes(rec.id) ? (
              <p className="text-xs text-accent">
                {outcomes[rec.id] ? describeShieldOutcome(outcomes[rec.id]) : "Recorded in this browser"} · actioned by{" "}
                {reviewer.name} · no hospital system write-back
              </p>
            ) : dismissedHospitalRecs.includes(rec.id) ? (
              <HitlActions status="Dismissed" onAccept={() => {}} onEdit={() => {}} onReject={() => {}} />
            ) : (
              <HitlActions
                variant="command"
                status="Pending"
                onAccept={async () => {
                  acceptHospitalRec(rec.id, reviewer.name);
                  const outcome = await logDecision(rec.id, rec.text, "accept");
                  toast({
                    title: "Recommendation actioned",
                    description: `${describeShieldOutcome(outcome)} · no hospital system write`
                  });
                }}
                onEdit={() => {}}
                onReject={() => {}}
                onDismiss={async () => {
                  dismissHospitalRec(rec.id, reviewer.name);
                  const outcome = await logDecision(rec.id, rec.text, "reject");
                  toast({
                    title: "Recommendation dismissed",
                    description: `${describeShieldOutcome(outcome)} · no hospital system write`
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
