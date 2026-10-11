import { SessionSummary } from "@/components/review/session-summary";

export const dynamic = "force-dynamic";

export default async function ReviewSummaryPage(
  props: {
    searchParams?: Promise<{ demo?: string; recording?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  return <SessionSummary demoMode={searchParams?.demo === "1"} recordingMode={searchParams?.recording === "1"} />;
}
