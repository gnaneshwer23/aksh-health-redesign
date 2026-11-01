"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { LabPharmacyHitlPanel } from "@/components/dashboard/lab-pharmacy/LabPharmacyHitlPanel";
import { useUserProfile } from "@/lib/hooks/use-user-profile";

function GpLabPharmacyInner() {
  const search = useSearchParams();
  const patientId = search.get("patientId") ?? search.get("patient") ?? "hcp-synth-patel";
  const careEpisodeId = search.get("careEpisodeId") ?? "";

  return (
    <LabPharmacyHitlPanel
      mode="stage"
      defaultPatientId={patientId}
      defaultCareEpisodeId={careEpisodeId}
    />
  );
}

/**
 * Milestone C3 — GP / clinician staging surface for lab & pharmacy HITL drafts.
 * Simulation only; no live pathology / EPS.
 */
export default function GpLabPharmacyPage() {
  const { profile } = useUserProfile();

  return (
    <DashboardShell
      role="gp"
      title="Lab / pharmacy HITL"
      organisation={profile?.organisation}
      honesty={{ surface: "Lab/pharmacy HITL staging (simulation)" }}
    >
      <div className="space-y-4 overflow-y-auto p-4">
        <ConsentBanner />
        <p className="text-xs text-muted" data-testid="lph-gp-page-intro">
          Stage a synthetic lab or pharmacy draft for multi-role HCP eval. Lab and pharmacy roles review on their
          queues (Accept / Edit / Reject). Not clinical validation · live:false · ehrWrite:false.
        </p>
        <Suspense fallback={<p className="text-sm text-muted">Loading HITL staging…</p>}>
          <GpLabPharmacyInner />
        </Suspense>
      </div>
    </DashboardShell>
  );
}
