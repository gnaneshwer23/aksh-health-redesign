"use client";

import { ReviewQueueItem } from "@/components/dashboard/ReviewQueueItem";
import { Badge } from "@/components/ui/badge";
import type { ReviewQueueItem as ReviewQueueItemType } from "@/lib/mock-data/types";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

export function ReviewQueue({ patientId, showAll }: { patientId?: string | null; showAll?: boolean }) {
  const items = useDashboardStore((s) => s.reviewQueueItems);
  const filtered = showAll || !patientId ? items : items.filter((i) => i.patientId === patientId);
  const pending = filtered.filter((i) => i.status === "Pending" || i.status === "Edited").length;

  return (
    <section aria-label="AI Review Queue">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-base font-semibold">AI Review Queue</h2>
        {pending > 0 && <Badge className="bg-danger text-white">{pending} pending</Badge>}
      </div>
      <div className="space-y-3">
        {filtered.map((item: ReviewQueueItemType) => (
          <ReviewQueueItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
