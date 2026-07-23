"use client";

import Link from "next/link";

import { AdminHeroDemoPath } from "@/components/dashboard/admin/AdminHeroDemoPath";
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
        <AdminHeroDemoPath />
        <p
          className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
          data-testid="admin-honesty-banner"
        >
          Not live EMIS · liveEmis:false · designed for EMIS Web / SystmOne pathways (staging / sim).
          CONDUCTOR = queue health; BRIDGE = FHIR after clinician Accept; SHIELD = durable audit.
          Precision Health / partner readiness are scaffolding — no live write-back claim.
        </p>
        <SystemStatusStrip />

        <div>
          <h2 className="text-lg font-semibold text-foreground">Practice operations overview</h2>
          <p className="text-sm text-muted">
            Ops narrative for {orgLabel}: integrations honesty, SHIELD visibility, and access
            requests — not a developer console. Metrics mix live SHIELD/integration probes with
            synthetic rehearsal figures — not certified DCB0129 / MHRA evidence.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="Demo users" value="100" />
          <MetricCard label="Demo patients" value="100" />
          <MetricCard label="Open GUARDIAN Alerts" value={String(guardianCount)} trend="down" />
          <MetricCard label="Care Pathways pending" value={String(countAwaitingApproval())} />
          <MetricCard label="SHIELD audit" value="Live trail" />
          <MetricCard label="EMIS write-back" value="Not enabled" />
          <MetricCard label="DCB0129" value="Rehearsal only" />
          <MetricCard label="Certifications" value="None claimed" />
          <MetricCard label="Auto-writes" value="0" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/dashboard/admin/precision-health"
            className="rounded-xl border border-dashed border-border-subtle bg-surface-muted/40 p-4 transition-colors hover:border-primary/30"
            data-testid="admin-precision-health-scaffolding-link"
          >
            <p className="text-sm font-semibold text-foreground">
              Partner readiness · Precision Health
            </p>
            <p className="mt-1 text-xs text-muted">
              Scaffolding only — connectors, consent flags, partner checklist. liveEmis:false · not a
              live twin or EMIS write-back.
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
