import { CasePageClient } from "@/components/review/case-page";

export default function CasePage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { demo?: string; recording?: string };
}) {
  return <CasePageClient demoMode={searchParams?.demo === "1"} id={params.id} recordingMode={searchParams?.recording === "1"} />;
}
