import { RehearsalGuide } from "@/components/review/rehearsal-guide";

export const dynamic = "force-dynamic";

export default function RehearsalGuidePage({
  searchParams
}: {
  searchParams?: { demo?: string; recording?: string };
}) {
  return <RehearsalGuide demoMode={searchParams?.demo === "1"} recordingMode={searchParams?.recording === "1"} />;
}
