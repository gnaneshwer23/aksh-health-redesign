"use client";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { LabPharmacyHitlPanel } from "@/components/dashboard/lab-pharmacy/LabPharmacyHitlPanel";
import { useUserProfile } from "@/lib/hooks/use-user-profile";

/**
 * Milestone C3 — Pharmacist review queue for GP-staged pharmacy / adherence drafts.
 * Complements Med Review; simulation only · no live EPS.
 */
export default function PharmacistPharmacyQueuePage() {
  const { profile } = useUserProfile();

  return (
    <DashboardShell
      role="pharmacist"
      title="Pharmacy HITL queue"
      organisation={profile?.organisation}
      honesty={{ surface: "Pharmacy HITL review queue (simulation)" }}
    >
      <div className="space-y-4 overflow-y-auto p-4">
        <ConsentBanner />
        <p className="text-xs text-muted" data-testid="lph-pharmacy-page-intro">
          Pharmacist Accept / Edit / Reject on GP-staged pharmacy drafts (adherence / dispense barriers). Not live
          EPS · ehrWrite:false · complements Med Review.
        </p>
        <LabPharmacyHitlPanel mode="pharmacy-queue" />
      </div>
    </DashboardShell>
  );
}
