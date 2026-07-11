import type { ReviewQueueItem } from "@/lib/mock-data/types";

const PRIORITY_RANK: Record<ReviewQueueItem["priority"], number> = {
  Urgent: 0,
  High: 1,
  Normal: 2,
};

/** Urgent GUARDIAN items first, then Urgent → High → Normal, newest within tier. */
export function sortReviewQueueItems(items: ReviewQueueItem[]): ReviewQueueItem[] {
  return [...items].sort((a, b) => {
    const aGuardianUrgent = a.agentType === "GUARDIAN" && a.priority === "Urgent" ? 0 : 1;
    const bGuardianUrgent = b.agentType === "GUARDIAN" && b.priority === "Urgent" ? 0 : 1;
    if (aGuardianUrgent !== bGuardianUrgent) return aGuardianUrgent - bGuardianUrgent;

    const priorityDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
