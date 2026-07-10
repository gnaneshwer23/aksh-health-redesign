import { PresenterGuide } from "@/components/review/presenter-guide";

export const dynamic = "force-dynamic";

export default function PresenterGuidePage({
  searchParams
}: {
  searchParams?: { demo?: string; recording?: string };
}) {
  return <PresenterGuide demoMode={searchParams?.demo === "1"} recordingMode={searchParams?.recording === "1"} />;
}
