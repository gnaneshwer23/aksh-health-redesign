import { IntakePage } from "@/components/review/intake-page";

export const dynamic = "force-dynamic";

export default async function IntakeRoute(
  props: {
    searchParams?: Promise<{ demo?: string; recording?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  return <IntakePage demoMode={searchParams?.demo === "1"} recordingMode={searchParams?.recording === "1"} />;
}
