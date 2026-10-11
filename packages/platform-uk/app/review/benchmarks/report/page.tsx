import { BenchmarkReport } from "@/components/review/benchmark-report";

export const dynamic = "force-dynamic";

export default async function BenchmarkReportPage(
  props: {
    searchParams?: Promise<{ demo?: string; recording?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  return <BenchmarkReport demoMode={searchParams?.demo === "1"} recordingMode={searchParams?.recording === "1"} />;
}
