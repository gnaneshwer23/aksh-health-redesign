"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/toaster";
import type { HospitalData } from "@/lib/mock-data/types";
import { wardStaffing } from "@/lib/mock-data";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

/** A staffing recommendation was accepted or dismissed; the server writes the audit wording. */
async function logStaffingShield(payload: {
  action: "accept" | "reject";
  detail: string;
  resourceRef: string;
}) {
  try {
    await fetch("/api/audit/shield", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "decided",
        subject: "staffing_recommendation",
        action: payload.action,
        agent: "SHIELD",
        note: payload.detail,
        resourceRef: payload.resourceRef
      })
    });
  } catch {
    // Local store still updates.
  }
}

export function StaffingPanel({ data, hospitalName }: { data: HospitalData; hospitalName?: string }) {
  const { dismissedAgencyAlerts, dismissAgencyAlert } = useDashboardStore();
  const label = hospitalName ?? data.hospitalName;

  const visibleTriggers = data.agencyTriggers.filter((t) => !dismissedAgencyAlerts.includes(t.ward));

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold">Staffing & Alerts</h2>
        <p className="text-xs text-muted">{label} · synthetic staffing (not live e-roster)</p>
      </div>
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
              <TableCell className="text-xs">{s.ward.split(":")[0]}</TableCell>
              <TableCell>{s.required}</TableCell>
              <TableCell className={s.actual < s.required ? "text-danger font-semibold" : ""}>{s.actual}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {visibleTriggers.map((t) => (
        <Card key={t.ward} className="shadow-sm border-danger/30 bg-danger/5 p-3">
          <p className="text-xs font-medium text-danger">
            {t.ward}: {t.message}
          </p>
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              variant="accent"
              onClick={() => {
                void logStaffingShield({
                  action: "accept",
                  detail: t.message,
                  resourceRef: `${label} / ${t.ward}`
                });
                toast({
                  title: "Agency request logged",
                  description: "SHIELD audit only · no live roster/agency API"
                });
                dismissAgencyAlert(t.ward);
              }}
            >
              Yes, Request
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                dismissAgencyAlert(t.ward);
                void logStaffingShield({
                  action: "reject",
                  detail: t.message,
                  resourceRef: `${label} / ${t.ward}`
                });
                toast({
                  title: "Acknowledged",
                  description: "Logged to SHIELD · no agency request"
                });
              }}
            >
              No
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
