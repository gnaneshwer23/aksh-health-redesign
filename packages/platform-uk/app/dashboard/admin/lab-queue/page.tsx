"use client";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { LabPharmacyHitlPanel } from "@/components/dashboard/lab-pharmacy/LabPharmacyHitlPanel";
import { useUserProfile } from "@/lib/hooks/use-user-profile";

/**
 * Milestone C3 — Lab-role review queue (admin / lab_operator persona).
 * Accept / Edit / Reject GP-staged lab drafts · simulation only.
 */
export default function AdminLabQueuePage() {
  const { profile } = useUserProfile();

  return (
    <DashboardShell
      role="admin"
      title="Lab HITL queue"
      organisation={profile?.organisation}
      honesty={{ surface: "Lab HITL review queue (simulation)" }}
    >
      <div className="space-y-4 overflow-y-auto p-4">
        <ConsentBanner />
        <p className="text-xs text-muted" data-testid="lph-lab-page-intro">
          Lab operator / admin review of GP-staged investigation drafts. ServiceRequest stubs stay draft · no live
          NHS pathology · ehrWrite:false. Distinct from admin E2E sim buttons.
        </p>
        <LabPharmacyHitlPanel mode="lab-queue" />
      </div>
    </DashboardShell>
  );
}
