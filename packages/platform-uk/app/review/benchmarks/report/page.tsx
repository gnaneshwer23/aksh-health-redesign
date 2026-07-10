import { BenchmarkReport } from "@/components/review/benchmark-report";

export const dynamic = "force-dynamic";

export default function BenchmarkReportPage({
  searchParams
}: {
  searchParams?: { demo?: string; recording?: string };
}) {
  return <BenchmarkReport demoMode={searchParams?.demo === "1"} recordingMode={searchParams?.recording === "1"} />;
}
