import { EvidenceReadinessPage } from "@/components/review/evidence-readiness-page";

export const dynamic = "force-dynamic";

export default function ReviewEvidenceReadinessPage({
  searchParams
}: {
  searchParams?: { demo?: string; recording?: string };
}) {
  return <EvidenceReadinessPage demoMode={searchParams?.demo === "1"} recordingMode={searchParams?.recording === "1"} />;
}
