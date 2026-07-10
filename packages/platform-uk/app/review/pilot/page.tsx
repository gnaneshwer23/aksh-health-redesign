import { PilotPackage } from "@/components/review/pilot-package";

export const dynamic = "force-dynamic";

export default function PilotPackagePage({
  searchParams
}: {
  searchParams?: { demo?: string; recording?: string };
}) {
  return <PilotPackage demoMode={searchParams?.demo === "1"} recordingMode={searchParams?.recording === "1"} />;
}
