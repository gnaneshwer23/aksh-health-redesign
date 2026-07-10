import { OpsDashboard } from "@/components/review/ops-dashboard";

export const dynamic = "force-dynamic";

export default function OpsDashboardPage({
  searchParams
}: {
  searchParams?: { demo?: string; recording?: string };
}) {
  return <OpsDashboard demoMode={searchParams?.demo === "1"} recordingMode={searchParams?.recording === "1"} />;
}
