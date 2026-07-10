import { DemoReadinessChecklist } from "@/components/review/demo-readiness-checklist";

export const dynamic = "force-dynamic";

export default function DemoReadinessPage({
  searchParams
}: {
  searchParams?: { demo?: string; recording?: string };
}) {
  return <DemoReadinessChecklist demoMode={searchParams?.demo === "1"} recordingMode={searchParams?.recording === "1"} />;
}
