"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/toaster";
import type { HospitalData } from "@/lib/mock-data/types";
import { wardStaffing } from "@/lib/mock-data";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

export function StaffingPanel({ data }: { data: HospitalData }) {
  const { dismissedAgencyAlerts, dismissAgencyAlert } = useDashboardStore();

  const visibleTriggers = data.agencyTriggers.filter((t) => !dismissedAgencyAlerts.includes(t.ward));

  return (
    <div className="p-4 space-y-4">
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
                toast({ title: "Agency request submitted" });
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
                toast({ title: "Acknowledged — no agency request logged" });
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
