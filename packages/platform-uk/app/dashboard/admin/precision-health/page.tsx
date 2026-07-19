"use client";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ConnectorsIngestPanel } from "@/components/dashboard/precision-health/ConnectorsIngestPanel";
import { PartnerReadinessPanel } from "@/components/dashboard/precision-health/PartnerReadinessPanel";
import { PharmaPayerStubPanel } from "@/components/dashboard/precision-health/PharmaPayerStubPanel";
import { PrecisionHealthStatusPanel } from "@/components/dashboard/precision-health/PrecisionHealthStatusPanel";
import { SystemSpinePanel } from "@/components/dashboard/precision-health/SystemSpinePanel";
import { useUserProfile } from "@/lib/hooks/use-user-profile";

/**
 * Admin Precision Health + system spine — connectors, honesty flags, and one ops view of the
 * shared Aksh backend. Does not claim live Fitbit/DICOM/omics, liveEmis, or physiological twin.
 */
export default function AdminPrecisionHealthPage() {
  const { profile } = useUserProfile();

  return (
    <DashboardShell role="admin" title="Precision Health" organisation={profile?.organisation}>
      <div className="space-y-4 overflow-y-auto p-4" data-testid="admin-precision-health-page">
        <div>
          <h2 className="text-lg font-semibold text-foreground">System spine &amp; Precision Health</h2>
          <p className="text-sm text-muted">
            Same Aksh backend as onboarding → dashboard → review → audit. liveEmis:false ·
            physiologicalTwin:false · autoRetrain:false · no invented device or omics streams.
          </p>
        </div>
        <SystemSpinePanel />
        <PartnerReadinessPanel />
        <PrecisionHealthStatusPanel />
        <ConnectorsIngestPanel />
        <PharmaPayerStubPanel />
      </div>
    </DashboardShell>
  );
}
