"use client";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ConsentGrantsPanel } from "@/components/dashboard/precision-health/ConsentGrantsPanel";
import { useUserProfile } from "@/lib/hooks/use-user-profile";

/** Admin view of the Phase 1 purpose/modality consent registry (synthetic demo patient). */
export default function AdminConsentPage() {
  const { profile } = useUserProfile();

  return (
    <DashboardShell role="admin" title="Consent registry" organisation={profile?.organisation}>
      <div className="space-y-4 overflow-y-auto p-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Purpose-bound consent grants</h2>
          <p className="text-sm text-muted">
            Phase 1 registry for modalities + purposes. SHIELD dual-write on grant/revoke. Does not replace
            DPIA or health system Login. Demo scoped to synthetic patient P001.
          </p>
        </div>
        <ConsentGrantsPanel
          patientId="P001"
          patientLabel="Sarah Johnson (P001 · synthetic)"
          mode="admin"
        />
      </div>
    </DashboardShell>
  );
}
