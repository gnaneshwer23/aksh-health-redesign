"use client";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ReviewQueue } from "@/components/dashboard/ReviewQueue";

export default function GpReviewQueuePage() {
  return (
    <DashboardShell role="gp" title="AI Review Queue">
      <div className="overflow-y-auto p-4 space-y-4">
        <ConsentBanner />
        <ReviewQueue showAll />
      </div>
    </DashboardShell>
  );
}
