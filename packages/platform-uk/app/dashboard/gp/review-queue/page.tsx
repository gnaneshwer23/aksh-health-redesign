"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DemoDataBanner } from "@/components/dashboard/DemoDataBanner";
import { GpHeroDemoPath } from "@/components/dashboard/GpHeroDemoPath";
import { ClinicalOrchestratePanel } from "@/components/dashboard/precision-health/ClinicalOrchestratePanel";
import { ReviewQueue } from "@/components/dashboard/ReviewQueue";
import { getPatientById } from "@/lib/mock-data";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { buildReviewQueueLabel } from "@/lib/profile/personalization";
import { useSession } from "next-auth/react";

function GpReviewQueueContent() {
  const searchParams = useSearchParams();
  const { status } = useSession();
  const { profile } = useUserProfile();
  const patientId = searchParams.get("patient");
  const patient = patientId ? getPatientById(patientId) : null;
  const title = patient ? `Review Queue | ${patient.name}` : buildReviewQueueLabel(profile?.fullName);
  const isPublicDemo = status === "unauthenticated";

  return (
    <DashboardShell role="gp" title={title} organisation={profile?.organisation}>
      <div className="space-y-4 overflow-y-auto p-4">
        {isPublicDemo ? <DemoDataBanner surface="GP review queue" /> : null}
        <GpHeroDemoPath />
        <ConsentBanner />
        {patient && (
          <ClinicalOrchestratePanel patientId={patient.id} patientLabel={patient.name} />
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
        <DashboardShell role="gp" title="AI Review Queue">
          <div className="p-4 text-sm text-muted">Loading review queue…</div>
        </DashboardShell>
      }
    >
      <GpReviewQueueContent />
    </Suspense>
  );
}
