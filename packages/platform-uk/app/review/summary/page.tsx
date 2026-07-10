import { SessionSummary } from "@/components/review/session-summary";

export const dynamic = "force-dynamic";

export default function ReviewSummaryPage({
  searchParams
}: {
  searchParams?: { demo?: string; recording?: string };
}) {
  return <SessionSummary demoMode={searchParams?.demo === "1"} recordingMode={searchParams?.recording === "1"} />;
}
