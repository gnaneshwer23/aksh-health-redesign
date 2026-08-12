"use client";

import { ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { ReviewQueueItem } from "@/components/dashboard/ReviewQueueItem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPatientById } from "@/lib/mock-data";
import { sortReviewQueueItems } from "@/lib/dashboard/sort-review-queue";
import type { ReviewQueueItem as ReviewQueueItemType } from "@/lib/mock-data/types";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { buildEmptyStateMessage, buildReviewQueueLabel } from "@/lib/profile/personalization";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

function isActionable(item: ReviewQueueItemType) {
  return item.status === "Pending" || item.status === "Edited";
}

export function ReviewQueue({
  patientId,
  showAll,
  queueLabel,
}: {
  patientId?: string | null;
  showAll?: boolean;
  queueLabel?: string;
}) {
  const items = useDashboardStore((s) => s.reviewQueueItems);
  const { profile } = useUserProfile();

  const filtered = useMemo(() => {
    const scoped = showAll || !patientId ? items : items.filter((i) => i.patientId === patientId);
    return sortReviewQueueItems(scoped.filter(isActionable));
  }, [items, patientId, showAll]);

  const patientName = patientId ? getPatientById(patientId)?.name : null;
  const showPatientEmpty = Boolean(patientId && patientName && filtered.length === 0);
  const showGlobalEmpty = Boolean(showAll && !patientId && filtered.length === 0);
  const heading = queueLabel ?? (showAll ? buildReviewQueueLabel(profile?.fullName) : "Review Queue");
  const globalEmptyMessage = buildEmptyStateMessage(
    profile,
    "review items",
    "No drafts are awaiting your approval."
  );

  return (
    <section aria-label="Review Queue" data-testid="gp-review-queue">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <h2 className="text-base font-semibold">{heading}</h2>
          {showAll && profile?.fullName ? (
            <p className="text-xs text-muted">{profile.fullName}&apos;s queue</p>
          ) : null}
          {filtered.length > 0 && <Badge className="bg-danger text-white">{filtered.length} pending</Badge>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href="/review/pilot?demo=1" data-testid="gp-queue-accept-cta">
              Accept on pilot (HITL)
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/cases/case-005/evidence?demo=1" data-testid="gp-queue-export-cta">
              Export FHIR Bundle
            </Link>
          </Button>
        </div>
      </div>
      <p className="mb-3 text-[11px] text-muted">
        Accept / Edit / Reject every draft. After Accept, BRIDGE stages FHIR (Neon/file) ·{" "}
        <span className="font-medium text-foreground">liveEmis:false</span> · Bundle export is handoff, not
        live EHR write.
      </p>

      {showPatientEmpty ? (
        <div className="dashboard-card flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-subtle p-10 text-center">
          <ClipboardCheck className="h-10 w-10 text-steel" aria-hidden />
          <p className="text-sm font-medium text-foreground">No drafts pending for {patientName}</p>
          <p className="text-xs text-muted">Accepted and rejected items are cleared from this queue.</p>
        </div>
      ) : showGlobalEmpty ? (
        <div className="dashboard-card flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-subtle p-10 text-center">
          <ClipboardCheck className="h-10 w-10 text-steel" aria-hidden />
          <p className="text-sm font-medium text-foreground">Review queue is clear</p>
          <p className="text-xs text-muted">{globalEmptyMessage}</p>
          <Button size="sm" asChild>
            <Link href="/review/pilot?demo=1">Open pilot Accept → export path</Link>
          </Button>
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
