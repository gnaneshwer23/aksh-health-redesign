"use client";

import Link from "next/link";

import { AdminQuickLinks } from "@/components/dashboard/AdminQuickLinks";
import { AuditLogTable } from "@/components/dashboard/AuditLogTable";
import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { IntegrationStatus } from "@/components/dashboard/IntegrationStatus";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { OrganisationEnquiriesPanel } from "@/components/dashboard/OrganisationEnquiriesPanel";
import { SystemStatusStrip } from "@/components/dashboard/SystemStatusStrip";
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
      showFirstRun
    >
      <div className="space-y-6 overflow-y-auto p-4">
        <ConsentBanner />
        <SystemStatusStrip />

        <div>
          <h2 className="text-lg font-semibold text-foreground">Organisation overview</h2>
          <p className="text-sm text-muted">
            Dashboard for {orgLabel}. Metrics below mix live SHIELD/integration probes with synthetic rehearsal
            figures — not certified DCB0129 / MHRA evidence. Precision Health surfaces are scaffolding (connectors,
            consent registry) — not a live twin or EMIS write-back.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/dashboard/admin/precision-health"
            className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4 transition-colors hover:border-primary/40"
          >
            <p className="text-sm font-semibold text-foreground">System spine &amp; Precision Health</p>
            <p className="mt-1 text-xs text-muted">
              Postgres, Neo4j, agents, EMIS/Medplum honesty, loop status — one ops view
            </p>
          </Link>
          <Link
            href="/dashboard/admin/consent"
            className="rounded-xl border border-accent/25 bg-accent/5 p-4 transition-colors hover:border-accent/40"
          >
            <p className="text-sm font-semibold text-foreground">Consent registry</p>
            <p className="mt-1 text-xs text-muted">
              Purpose + modality grants after first login — SHIELD logged, no EHR write
            </p>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="Open GUARDIAN Alerts" value={String(guardianCount)} trend="down" />
          <MetricCard label="Care Pathways pending" value={String(countAwaitingApproval())} />
          <MetricCard label="SHIELD audit" value="Live trail" />
          <MetricCard label="EMIS write-back" value="Not enabled" />
          <MetricCard label="DCB0129" value="Rehearsal only" />
          <MetricCard label="Certifications" value="None claimed" />
        </div>

        <AdminQuickLinks />

        <div className="grid gap-4 lg:grid-cols-2">
          <UrgentGuardianAlertsPanel />
          <IntegrationStatus />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Recent SHIELD Audit Events</CardTitle>
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
