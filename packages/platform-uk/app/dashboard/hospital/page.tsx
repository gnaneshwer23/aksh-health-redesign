"use client";

import { useEffect, useState } from "react";

import { CapacityChart } from "@/components/dashboard/CapacityChart";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { HitlActions } from "@/components/dashboard/SOAPEditor";
import { HospitalCommandMap } from "@/components/dashboard/HospitalCommandMap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/toaster";
import { CURRENT_GP, hospitalData, wardStaffing } from "@/lib/mock-data";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";
import { cn } from "@/lib/utils";

export default function HospitalDashboardPage() {
  const { dismissedHospitalAlerts, acceptHospitalRec, acceptedHospitalRecs, dismissedHospitalRecs, dismissHospitalAlert, dismissHospitalRec } = useDashboardStore();
  const [time, setTime] = useState(new Date());
  const data = hospitalData;
  const bedPct = Math.round((data.wards.reduce((s, w) => s + w.occupiedBeds, 0) / data.wards.reduce((s, w) => s + w.totalBeds, 0)) * 100);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <DashboardShell role="hospital" title="Command Centre">
      <div className="flex flex-col h-full overflow-hidden">
        <div className="bg-primary text-white px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold">Hospital Command Centre — {data.hospitalName}</h1>
              <p className="text-xs opacity-80">{time.toLocaleString("en-GB")}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-danger/90 px-3 py-1">🔴 ED Wait: {data.edWaitingTime} hrs</span>
              <span className="rounded-full bg-warning/90 px-3 py-1 text-primary">🟡 Beds: {bedPct}% occupied</span>
              <span className="rounded-full bg-accent/90 px-3 py-1 text-primary">✅ Theatres: {data.theatresRunning}/{data.theatresTotal}</span>
              <span className="rounded-full bg-warning/90 px-3 py-1 text-primary">🟠 Staff: Night shift -2 nurses</span>
            </div>
          </div>
        </div>

        {!dismissedHospitalAlerts.includes("surge") && (
          <div className="bg-warning/15 border-b border-warning/30 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm">Digital Twin Alert: 73% probability of ED surge in next 12 hours. Recommend: accelerate discharge reviews in wards 3A, 3B, 4A</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">View Analysis</Button>
              <Button size="sm" variant="ghost" onClick={() => dismissHospitalAlert("surge")}>Dismiss</Button>
            </div>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          <aside className="w-80 shrink-0 overflow-y-auto border-r border-border p-4">
            <h2 className="text-sm font-semibold mb-3">Ward Status</h2>
            <HospitalCommandMap wards={data.wards} />
          </aside>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-sm">Capacity Forecast</CardTitle></CardHeader>
              <CardContent><CapacityChart data={data.capacityForecast} /></CardContent>
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
                      onAccept={() => { acceptHospitalRec(rec.id, CURRENT_GP); toast({ title: "Recommendation actioned" }); }}
                      onEdit={() => {}}
                      onReject={() => {}}
                      onDismiss={() => { dismissHospitalRec(rec.id, CURRENT_GP); toast({ title: "Recommendation dismissed" }); }}
                    />
                  )}
                </Card>
              ))}
            </section>
          </div>

          <aside className="w-72 shrink-0 overflow-y-auto border-l border-border p-4 space-y-4">
            <h2 className="text-sm font-semibold">Staffing & Alerts</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ward</TableHead>
                  <TableHead>Req</TableHead>
                  <TableHead>Actual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wardStaffing.map((s) => (
                  <TableRow key={s.ward} className={s.actual < s.required ? "bg-danger/5" : ""}>
                    <TableCell className="text-xs">{s.ward.split("—")[0]}</TableCell>
                    <TableCell>{s.required}</TableCell>
                    <TableCell className={s.actual < s.required ? "text-danger font-semibold" : ""}>{s.actual}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {data.agencyTriggers.map((t) => (
              <Card key={t.ward} className="shadow-sm border-danger/30 bg-danger/5 p-3">
                <p className="text-xs font-medium text-danger">{t.ward}: {t.message}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="accent" onClick={() => toast({ title: "Agency request submitted" })}>Yes, Request</Button>
                  <Button size="sm" variant="outline">No</Button>
                </div>
              </Card>
            ))}
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}
