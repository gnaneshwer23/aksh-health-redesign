"use client";

import Link from "next/link";

import { AdminQuickLinks } from "@/components/dashboard/AdminQuickLinks";
import { AuditLogTable } from "@/components/dashboard/AuditLogTable";
import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { IntegrationStatus } from "@/components/dashboard/IntegrationStatus";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { OrganisationEnquiriesPanel } from "@/components/dashboard/OrganisationEnquiriesPanel";
import { UrgentGuardianAlertsPanel, getUrgentGuardianAlertCount } from "@/components/dashboard/UrgentGuardianAlertsPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { countAwaitingApproval } from "@/lib/mock-data";

export default function AdminDashboardPage() {
  const guardianCount = getUrgentGuardianAlertCount();
  const { profile } = useUserProfile();
  const orgLabel = profile?.organisation ?? "your organisation";

  return (
    <DashboardShell
      role="admin"
      title="Practice Manager"
      organisation={profile?.organisation}
    >
      <div className="space-y-6 overflow-y-auto p-4">
        <ConsentBanner />

        <div>
          <h2 className="text-lg font-semibold text-foreground">Organisation overview</h2>
          <p className="text-sm text-muted">Dashboard stats for {orgLabel}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="Total Users" value="12" sparkline={[10, 11, 11, 12, 12, 12, 12]} />
          <MetricCard label="Last Extraction" value="00:00 UTC ✓" trend="up" />
          <MetricCard label="FHIR Bundles Today" value="847" sparkline={[800, 820, 830, 840, 845, 847, 847]} />
          <MetricCard label="Open GUARDIAN Alerts" value={String(guardianCount)} trend="down" />
          <MetricCard label="DCB0129 Status" value="Active" />
          <MetricCard label="Care Pathways" value={`4 / ${countAwaitingApproval()} pending`} />
        </div>

        <AdminQuickLinks />

        <div className="grid gap-4 lg:grid-cols-2">
          <UrgentGuardianAlertsPanel />
          <IntegrationStatus />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Recent Audit Events</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/admin/audit">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <AuditLogTable limit={5} />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Recent Organisation Enquiries</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/admin/organisation-enquiries">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0 pt-0">
              <OrganisationEnquiriesPanel compact highlightOrg={profile?.organisation} />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
