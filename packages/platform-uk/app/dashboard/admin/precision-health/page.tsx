"use client";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ConnectorsIngestPanel } from "@/components/dashboard/precision-health/ConnectorsIngestPanel";
import { PharmaPayerStubPanel } from "@/components/dashboard/precision-health/PharmaPayerStubPanel";
import { PrecisionHealthStatusPanel } from "@/components/dashboard/precision-health/PrecisionHealthStatusPanel";
import { useUserProfile } from "@/lib/hooks/use-user-profile";

/**
 * Admin Precision Health status — connectors, consent/Medplum/EMIS/Neo4j honesty, partner doc pointers.
 * Does not claim live Fitbit/DICOM/omics, liveEmis, or physiological twin.
 */
export default function AdminPrecisionHealthPage() {
  const { profile } = useUserProfile();

  return (
    <DashboardShell role="admin" title="Precision Health" organisation={profile?.organisation}>
      <div className="space-y-4 overflow-y-auto p-4" data-testid="admin-precision-health-page">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Precision Health scaffolding status</h2>
          <p className="text-sm text-muted">
            Phases 1–3 in-repo contracts and stubs. liveEmis:false · physiologicalTwin:false · no
            invented device or omics streams. Partner / CSO items remain external.
          </p>
        </div>
        <PrecisionHealthStatusPanel />
        <ConnectorsIngestPanel />
        <PharmaPayerStubPanel />
      </div>
    </DashboardShell>
  );
}
