import { PilotPackage } from "@/components/review/pilot-package";

export const dynamic = "force-dynamic";

export default async function PilotPackagePage(
  props: {
    searchParams?: Promise<{ demo?: string; recording?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  return <PilotPackage demoMode={searchParams?.demo === "1"} recordingMode={searchParams?.recording === "1"} />;
}
