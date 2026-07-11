"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ReviewQueue } from "@/components/dashboard/ReviewQueue";
import { getPatientById } from "@/lib/mock-data";

function GpReviewQueueContent() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patient");
  const patient = patientId ? getPatientById(patientId) : null;
  const title = patient ? `Review Queue | ${patient.name}` : "AI Review Queue";

  return (
    <DashboardShell role="gp" title={title}>
      <div className="space-y-4 overflow-y-auto p-4">
        <ConsentBanner />
        <ReviewQueue patientId={patientId} showAll={!patientId} />
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
