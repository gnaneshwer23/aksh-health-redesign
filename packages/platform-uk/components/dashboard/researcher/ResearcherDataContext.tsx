"use client";

import { createContext, useContext, type ReactNode } from "react";

import { getEvaluationSummaryMetrics, researcherCohortData, type ResearcherCohortData } from "@/lib/researcher/cohort-data";

type ResearcherDataContextValue = {
  cohort: ResearcherCohortData;
  evaluation: ReturnType<typeof getEvaluationSummaryMetrics>;
};

const ResearcherDataContext = createContext<ResearcherDataContextValue | null>(null);

export function ResearcherDataProvider({ children }: { children: ReactNode }) {
  return (
    <ResearcherDataContext.Provider
      value={{
        cohort: researcherCohortData,
        evaluation: getEvaluationSummaryMetrics(),
      }}
    >
      {children}
    </ResearcherDataContext.Provider>
  );
}

export function useResearcherData() {
  const ctx = useContext(ResearcherDataContext);
  if (!ctx) {
    throw new Error("useResearcherData must be used within ResearcherDataProvider");
  }
  return ctx;
}
