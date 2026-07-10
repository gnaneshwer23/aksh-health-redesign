import { FailureDrilldownPage } from "@/components/review/failure-drilldown-page";

export const dynamic = "force-dynamic";

export default function ReviewFailuresPage({
  searchParams
}: {
  searchParams?: { stage?: string; step?: string; action?: string; demo?: string; recording?: string };
}) {
  return (
    <FailureDrilldownPage
      demoMode={searchParams?.demo === "1"}
      recordingMode={searchParams?.recording === "1"}
      stage={searchParams?.stage}
      step={searchParams?.step}
      action={searchParams?.action}
    />
  );
}
