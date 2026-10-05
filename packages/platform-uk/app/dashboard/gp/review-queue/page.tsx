"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { GpHeroDemoPath } from "@/components/dashboard/GpHeroDemoPath";
import { ClinicalIntelligenceWorkspace } from "@/components/dashboard/ClinicalIntelligenceWorkspace";
import { ClinicalOrchestratePanel } from "@/components/dashboard/precision-health/ClinicalOrchestratePanel";
import { ReviewQueue } from "@/components/dashboard/ReviewQueue";
import { getPatientById } from "@/lib/mock-data";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { buildReviewQueueLabel } from "@/lib/profile/personalization";

function GpReviewQueueContent() {
  const searchParams = useSearchParams();
  const { profile } = useUserProfile();
  const patientId = searchParams.get("patient");
  const patient = patientId ? getPatientById(patientId) : null;
  const title = patient ? `Review Queue | ${patient.name}` : buildReviewQueueLabel(profile?.fullName);

  return (
    <DashboardShell
      role="gp"
      title={title}
      organisation={profile?.organisation}
      honesty={{ surface: "GP review queue" }}
    >
      <div className="space-y-4 overflow-y-auto p-4">
        {/* Keep hero available for U4/smoke; dismissible + Demo menu */}
        <GpHeroDemoPath />
        <ConsentBanner />
        {patient && (
          <>
            <ClinicalIntelligenceWorkspace patientId={patient.id} patientLabel={patient.name} />
            <ClinicalOrchestratePanel patientId={patient.id} patientLabel={patient.name} />
          </>
        )}
        <ReviewQueue
          patientId={patientId}
          showAll={!patientId}
          queueLabel={buildReviewQueueLabel(profile?.fullName)}
        />
      </div>
    </DashboardShell>
  );
}

export default function GpReviewQueuePage() {
  return (
    <Suspense
      fallback={
        <DashboardShell role="gp" title="Review Queue">
          <div className="p-4 text-sm text-muted">Loading review queue…</div>
        </DashboardShell>
      }
    >
      <GpReviewQueueContent />
    </Suspense>
  );
}
