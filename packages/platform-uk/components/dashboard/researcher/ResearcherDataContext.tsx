"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { getEvaluationSummaryMetrics, researcherCohortData, type ResearcherCohortData } from "@/lib/researcher/cohort-data";
import { getPersonalizedLabel } from "@/lib/profile/personalization";

type ResearcherDataContextValue = {
  cohort: ResearcherCohortData;
  evaluation: ReturnType<typeof getEvaluationSummaryMetrics>;
};

const ResearcherDataContext = createContext<ResearcherDataContextValue | null>(null);

export function ResearcherDataProvider({ children }: { children: ReactNode }) {
  const { profile } = useUserProfile();
  const cohort = useMemo(
    () => ({
      ...researcherCohortData,
      organisationName: getPersonalizedLabel(profile, researcherCohortData.organisationName),
    }),
    [profile]
  );

  return (
    <ResearcherDataContext.Provider
      value={{
        cohort,
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
