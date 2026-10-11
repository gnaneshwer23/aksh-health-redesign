import { CasePageClient } from "@/components/review/case-page";

export default async function CasePage(
  props: {
    params: Promise<{ id: string }>;
    searchParams?: Promise<{ demo?: string; recording?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  return <CasePageClient demoMode={searchParams?.demo === "1"} id={params.id} recordingMode={searchParams?.recording === "1"} />;
}
