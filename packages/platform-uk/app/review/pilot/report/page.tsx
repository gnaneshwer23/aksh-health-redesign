import { PilotReport } from "@/components/review/pilot-report";

export const dynamic = "force-dynamic";

export default function PilotReportPage({
  searchParams
}: {
  searchParams?: { demo?: string; recording?: string };
}) {
  return <PilotReport demoMode={searchParams?.demo === "1"} recordingMode={searchParams?.recording === "1"} />;
}
