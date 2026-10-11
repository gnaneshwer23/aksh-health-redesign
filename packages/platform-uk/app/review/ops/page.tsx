import { OpsDashboard } from "@/components/review/ops-dashboard";

export const dynamic = "force-dynamic";

export default async function OpsDashboardPage(
  props: {
    searchParams?: Promise<{ demo?: string; recording?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  return <OpsDashboard demoMode={searchParams?.demo === "1"} recordingMode={searchParams?.recording === "1"} />;
}
