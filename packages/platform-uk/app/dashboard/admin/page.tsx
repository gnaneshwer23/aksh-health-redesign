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
import { RoleWorkspaceIntro } from "@/components/dashboard/RoleWorkspaceIntro";
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
  const pathwaysPending = countAwaitingApproval();

  return (
    <DashboardShell
      role="admin"
      title="Practice Manager"
      organisation={profile?.organisation}
      showFirstRun
      honesty={{ surface: "Practice ops" }}
    >
      <div className="space-y-5 overflow-y-auto p-5 sm:p-6">
        <ConsentBanner />
        <AdminHeroDemoPath />
        {/* Honesty lives in HonestyStatusBar; keep accessible copy for smoke / a11y. */}
        <p className="sr-only" data-testid="admin-honesty-banner">
          Not live EMIS · liveEmis:false · designed for EMIS Web / SystmOne pathways (staging / sim).
          CONDUCTOR = queue health; BRIDGE = FHIR after clinician Accept; SHIELD = durable audit.
          Precision Health / partner readiness are scaffolding — no live write-back claim.
        </p>
        <SystemStatusStrip />

        <RoleWorkspaceIntro
          eyebrow="Practice operations"
          title="Ops that stay honest about what is live"
          lede={
            <>
              Ops for {orgLabel}: queue health, integration posture, and access enquiries — not a
              certification scoreboard.
            </>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="admin-ops-metrics">
          <MetricCard
            label="Care pathways pending"
            value={String(pathwaysPending)}
            tone={pathwaysPending > 0 ? "warn" : "default"}
          />
          <MetricCard
            label="Open GUARDIAN alerts"
            value={String(guardianCount)}
            trend="down"
            tone={guardianCount > 0 ? "danger" : "default"}
          />
          <MetricCard label="EHR write-back" value="Not enabled" />
          <MetricCard label="Organisation enquiries" value="Inbox" />
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
              live twin or EHR write-back.
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
          <Link
            href="/dashboard/admin/e2e"
            className="rounded-xl border border-dashed border-border-subtle bg-surface-muted/40 p-4 transition-colors hover:border-primary/30"
            data-testid="admin-e2e-dashboard-link"
          >
            <p className="text-sm font-semibold text-foreground">E2E platform validation</p>
            <p className="mt-1 text-xs text-muted">
              Dev/test — refresh, report download, golden filter, lab/pharmacy sims. Seed/cleanup stay
              CLI. Disabled in production.
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
