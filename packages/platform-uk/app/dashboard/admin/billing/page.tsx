"use client";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminBillingPage() {
  return (
    <DashboardShell role="admin" title="Billing">
      <div className="space-y-4 overflow-y-auto p-4">
        <ConsentBanner />
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Billing &amp; Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted">
              Billing contact and subscription (Phase 2). Contract management, invoicing, and NHS framework
              pricing will be available in a future release.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
