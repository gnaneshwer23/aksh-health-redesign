"use client";

import { useState } from "react";

import { ReviewQueueItem } from "@/components/dashboard/ReviewQueueItem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { patients } from "@/lib/mock-data";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

const PHARMACIST_ACCENT = "text-[#6B46C1]";

export function MedReviewQueue() {
  const { medicationReviewsCompleted, markMedicationReviewed, reviewQueueItems } = useDashboardStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const medQueue = patients.filter((p) => p.activeMedications.length >= 2);

  return (
    <section>
      <h2 className={`text-lg font-semibold mb-3 ${PHARMACIST_ACCENT}`}>
        Medication Review Queue <Badge className="bg-[#6B46C1] text-white">{medQueue.length}</Badge>
      </h2>
      <div className="space-y-2">
        {medQueue.map((p) => (
          <Card key={p.id} className="shadow-sm border-[#6B46C1]/10">
            <CardHeader className="p-4 cursor-pointer" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm">{p.name}</CardTitle>
                <Badge variant="outline" className="border-[#6B46C1]/30 text-[#6B46C1]">
                  {p.activeMedications.length} meds
                </Badge>
              </div>
              <p className="text-xs text-muted">Last review: {p.lastEncounterDate}</p>
            </CardHeader>
            {expanded === p.id && (
              <CardContent className="p-4 pt-0 space-y-2">
                <ul className="text-xs">
                  {p.activeMedications.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
                {reviewQueueItems
                  .filter((r) => r.patientId === p.id && r.agentType === "GUARDIAN")
                  .map((r) => (
                    <ReviewQueueItem key={r.id} item={r} />
                  ))}
                <Button
                  size="sm"
                  className="bg-[#6B46C1] hover:bg-[#6B46C1]/90"
                  disabled={medicationReviewsCompleted.includes(p.id)}
                  onClick={() => markMedicationReviewed(p.id)}
                >
                  {medicationReviewsCompleted.includes(p.id) ? "Reviewed ✓" : "Mark Reviewed"}
                </Button>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}
