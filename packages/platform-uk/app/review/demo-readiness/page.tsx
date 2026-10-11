import { DemoReadinessChecklist } from "@/components/review/demo-readiness-checklist";

export const dynamic = "force-dynamic";

export default async function DemoReadinessPage(
  props: {
    searchParams?: Promise<{ demo?: string; recording?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  return <DemoReadinessChecklist demoMode={searchParams?.demo === "1"} recordingMode={searchParams?.recording === "1"} />;
}
