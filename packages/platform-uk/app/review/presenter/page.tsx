import { PresenterGuide } from "@/components/review/presenter-guide";

export const dynamic = "force-dynamic";

export default async function PresenterGuidePage(
  props: {
    searchParams?: Promise<{ demo?: string; recording?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  return <PresenterGuide demoMode={searchParams?.demo === "1"} recordingMode={searchParams?.recording === "1"} />;
}
