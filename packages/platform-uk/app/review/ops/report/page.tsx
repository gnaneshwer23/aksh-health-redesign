import { OpsReport } from "@/components/review/ops-report";

export const dynamic = "force-dynamic";

export default function OpsReportPage({
  searchParams
}: {
  searchParams?: { demo?: string; recording?: string };
}) {
  return <OpsReport demoMode={searchParams?.demo === "1"} recordingMode={searchParams?.recording === "1"} />;
}
