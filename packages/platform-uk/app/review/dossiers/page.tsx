import { DossierBatchPage, type DossierFilterId } from "@/components/review/dossier-batch-page";

export const dynamic = "force-dynamic";

const allowedFilters: DossierFilterId[] = ["strong", "incomplete", "near-promotion", "remediation"];

export default async function ReviewDossiersPage(
  props: {
    searchParams?: Promise<{ filter?: string; demo?: string; recording?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const requestedFilter = searchParams?.filter;
  const initialFilter: DossierFilterId =
    requestedFilter && allowedFilters.includes(requestedFilter as DossierFilterId)
      ? (requestedFilter as DossierFilterId)
      : "strong";

  return (
    <DossierBatchPage
      demoMode={searchParams?.demo === "1"}
      initialFilter={initialFilter}
      recordingMode={searchParams?.recording === "1"}
    />
  );
}
