"use client";

import { ClipboardCheck } from "lucide-react";
import { useMemo } from "react";

import { ReviewQueueItem } from "@/components/dashboard/ReviewQueueItem";
import { Badge } from "@/components/ui/badge";
import { getPatientById } from "@/lib/mock-data";
import { sortReviewQueueItems } from "@/lib/dashboard/sort-review-queue";
import type { ReviewQueueItem as ReviewQueueItemType } from "@/lib/mock-data/types";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

function isActionable(item: ReviewQueueItemType) {
  return item.status === "Pending" || item.status === "Edited";
}

export function ReviewQueue({ patientId, showAll }: { patientId?: string | null; showAll?: boolean }) {
  const items = useDashboardStore((s) => s.reviewQueueItems);

  const filtered = useMemo(() => {
    const scoped = showAll || !patientId ? items : items.filter((i) => i.patientId === patientId);
    return sortReviewQueueItems(scoped.filter(isActionable));
  }, [items, patientId, showAll]);

  const patientName = patientId ? getPatientById(patientId)?.name : null;
  const showPatientEmpty = Boolean(patientId && patientName && filtered.length === 0);
  const showGlobalEmpty = Boolean(showAll && !patientId && filtered.length === 0);

  return (
    <section aria-label="AI Review Queue">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-base font-semibold">AI Review Queue</h2>
        {filtered.length > 0 && <Badge className="bg-danger text-white">{filtered.length} pending</Badge>}
      </div>

      {showPatientEmpty ? (
        <div className="dashboard-card flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-subtle p-10 text-center">
          <ClipboardCheck className="h-10 w-10 text-steel" aria-hidden />
          <p className="text-sm font-medium text-foreground">No AI items pending for {patientName}</p>
          <p className="text-xs text-muted">Accepted and rejected items are cleared from this queue.</p>
        </div>
      ) : showGlobalEmpty ? (
        <div className="dashboard-card flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-subtle p-10 text-center">
          <ClipboardCheck className="h-10 w-10 text-steel" aria-hidden />
          <p className="text-sm font-medium text-foreground">Review queue is clear</p>
          <p className="text-xs text-muted">No AI outputs are awaiting your approval.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item: ReviewQueueItemType) => (
            <ReviewQueueItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
