import { BenchmarkDrilldownPage } from "@/components/review/benchmark-drilldown-page";

export const dynamic = "force-dynamic";

export default function ReviewBenchmarksPage({
  searchParams
}: {
  searchParams?: { demo?: string; recording?: string; status?: string };
}) {
  return (
    <BenchmarkDrilldownPage
      demoMode={searchParams?.demo === "1"}
      recordingMode={searchParams?.recording === "1"}
      status={searchParams?.status}
    />
  );
}
