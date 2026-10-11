import { EvidenceReadinessPage } from "@/components/review/evidence-readiness-page";

export const dynamic = "force-dynamic";

export default async function ReviewEvidenceReadinessPage(
  props: {
    searchParams?: Promise<{ demo?: string; recording?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  return <EvidenceReadinessPage demoMode={searchParams?.demo === "1"} recordingMode={searchParams?.recording === "1"} />;
}
