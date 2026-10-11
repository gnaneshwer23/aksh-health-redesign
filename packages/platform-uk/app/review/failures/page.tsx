import { FailureDrilldownPage } from "@/components/review/failure-drilldown-page";

export const dynamic = "force-dynamic";

export default async function ReviewFailuresPage(
  props: {
    searchParams?: Promise<{ stage?: string; step?: string; action?: string; demo?: string; recording?: string }>;
  }
) {
  const searchParams = await props.searchParams;
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
