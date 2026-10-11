import { ReviewPageClient, type QueueFilterId } from "@/components/review/review-page";

export const dynamic = "force-dynamic";

const allowedFilters: QueueFilterId[] = ["all", "blocked", "high-risk", "pending", "deferred", "accepted"];

export default async function ReviewPage(
  props: {
    searchParams?: Promise<{ filter?: string; demo?: string; recording?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const requestedFilter = searchParams?.filter;
  const initialFilter: QueueFilterId =
    requestedFilter && allowedFilters.includes(requestedFilter as QueueFilterId)
      ? (requestedFilter as QueueFilterId)
      : "all";

  return (
    <ReviewPageClient
      demoMode={searchParams?.demo === "1"}
      initialFilter={initialFilter}
      recordingMode={searchParams?.recording === "1"}
    />
  );
}
