import { BenchmarkDrilldownPage } from "@/components/review/benchmark-drilldown-page";

export const dynamic = "force-dynamic";

export default async function ReviewBenchmarksPage(
  props: {
    searchParams?: Promise<{ demo?: string; recording?: string; status?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  return (
    <BenchmarkDrilldownPage
      demoMode={searchParams?.demo === "1"}
      recordingMode={searchParams?.recording === "1"}
      status={searchParams?.status}
    />
  );
}
