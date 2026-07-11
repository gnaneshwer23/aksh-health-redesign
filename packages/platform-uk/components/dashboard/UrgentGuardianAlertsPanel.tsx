"use client";

import { Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import { reviewQueueItems } from "@/lib/mock-data";

function getUrgentGuardianAlerts() {
  return reviewQueueItems.filter(
    (item) => item.agentType === "GUARDIAN" && item.priority === "Urgent" && item.status === "Pending"
  );
}

export function getUrgentGuardianAlertCount() {
  return getUrgentGuardianAlerts().length;
}

export function UrgentGuardianAlertsPanel() {
  const alerts = getUrgentGuardianAlerts();

  return (
    <Card className="shadow-sm border-red-200/60">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4 text-red-600" />
          Urgent GUARDIAN Alerts
        </CardTitle>
        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
          {alerts.length} open
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <p className="text-sm text-muted">No urgent GUARDIAN alerts pending GP review.</p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((alert) => (
              <li key={alert.id} className="rounded-lg border border-border-subtle bg-surface-muted px-3 py-2 text-xs">
                <p className="font-medium text-foreground">{alert.title}</p>
                <p className="mt-0.5 text-muted">
                  {alert.patientName} · NHS {alert.patientNhsNumber}
                </p>
                <p className="mt-1 line-clamp-2 text-muted">{alert.content}</p>
              </li>
            ))}
          </ul>
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() =>
            toast({
              title: "GP dashboard required",
              description:
                "GUARDIAN alerts are reviewed in the GP dashboard. Sign in with a GP account to accept or reject clinical safety items.",
            })
          }
        >
          View in GP dashboard (requires GP login)
        </Button>
      </CardContent>
    </Card>
  );
}
