"use client";

import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

import { HitlActions } from "@/components/dashboard/SOAPEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CURRENT_GP } from "@/lib/mock-data";
import type { Patient } from "@/lib/mock-data/types";
import { useState } from "react";

export function DigitalTwinPanel({ patient }: { patient: Patient | null }) {
  const [accepted, setAccepted] = useState(false);

  if (!patient) return <p className="text-sm text-muted">Select a patient for Digital Twin insights</p>;

  const data = [{ name: "risk", value: patient.digitalTwinPrediction.admissionRisk14Days, fill: "#003D7A" }];

  return (
    <Card className="shadow-sm">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-sm">Digital Twin Insights</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-28 w-28">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
                <RadialBar background dataKey="value" cornerRadius={4} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{patient.digitalTwinPrediction.admissionRisk14Days}%</p>
            <p className="text-xs text-muted">14-day admission risk</p>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold mb-1">Deterioration signals</p>
          <ul className="text-xs text-muted space-y-1">
            {patient.digitalTwinPrediction.deteriorationSignals.map((s) => <li key={s}>• {s}</li>)}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold mb-1">Recommended actions</p>
          {patient.digitalTwinPrediction.recommendedActions.map((a) => (
            <div key={a} className="mb-2 rounded-sm border border-border p-2 text-xs">
              <p>{a}</p>
              {!accepted && (
                <div className="mt-2">
                  <HitlActions
                    status="Pending"
                    onAccept={() => setAccepted(true)}
                    onEdit={() => {}}
                    onReject={() => {}}
                  />
                </div>
              )}
              {accepted && <p className="mt-1 text-accent text-[10px]">Written to Record · {CURRENT_GP}</p>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
