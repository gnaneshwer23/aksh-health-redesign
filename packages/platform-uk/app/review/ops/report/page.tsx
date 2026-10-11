import { OpsReport } from "@/components/review/ops-report";

export const dynamic = "force-dynamic";

export default async function OpsReportPage(
  props: {
    searchParams?: Promise<{ demo?: string; recording?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  return <OpsReport demoMode={searchParams?.demo === "1"} recordingMode={searchParams?.recording === "1"} />;
}
