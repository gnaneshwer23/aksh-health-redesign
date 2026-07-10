import { IntakePage } from "@/components/review/intake-page";

export const dynamic = "force-dynamic";

export default function IntakeRoute({
  searchParams
}: {
  searchParams?: { demo?: string; recording?: string };
}) {
  return <IntakePage demoMode={searchParams?.demo === "1"} recordingMode={searchParams?.recording === "1"} />;
}
