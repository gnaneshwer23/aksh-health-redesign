import type { ReviewQueueItem } from "@/lib/mock-data/types";
import { prioritiseHumanReviewQueue } from "../hsi/sharedTechnology";

/** Same product ordering, executed by the canonical HSI algorithm in this app's process. */
export function sortReviewQueueItems(items: ReviewQueueItem[]): ReviewQueueItem[] {
  return prioritiseHumanReviewQueue(items);
}
