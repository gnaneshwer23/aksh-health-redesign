"use client";

import { notFound } from "next/navigation";

import { CaseDetail } from "@/components/review/case-detail";
import { useReviewCases } from "@/lib/use-review-cases";

export function CasePageClient({
  demoMode = false,
  id,
  recordingMode = false
}: {
  demoMode?: boolean;
  id: string;
  recordingMode?: boolean;
}) {
  const { error, getCaseById, isLoaded, isSaving, retryLastSave, updateCase } = useReviewCases();

  if (!isLoaded) {
    return <div className="panel">Loading case...</div>;
  }

  const reviewCase = getCaseById(id);

  if (!reviewCase) {
    notFound();
  }

  return (
    <CaseDetail
      demoMode={demoMode}
      error={error}
      isSaving={isSaving}
      onRetrySave={retryLastSave}
      onUpdateCase={updateCase}
      recordingMode={recordingMode}
      reviewCase={reviewCase}
    />
  );
}
