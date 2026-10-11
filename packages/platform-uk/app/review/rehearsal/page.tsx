import { RehearsalGuide } from "@/components/review/rehearsal-guide";

export const dynamic = "force-dynamic";

export default async function RehearsalGuidePage(
  props: {
    searchParams?: Promise<{ demo?: string; recording?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  return <RehearsalGuide demoMode={searchParams?.demo === "1"} recordingMode={searchParams?.recording === "1"} />;
}
