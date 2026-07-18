"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useNeo4jIcsPopulation } from "@/lib/hooks/use-neo4j-clinical";
import { populationData } from "@/lib/mock-data";
import type { PopulationData } from "@/lib/mock-data/types";
import type { Neo4jIcsPopulationResponse } from "@/lib/neo4j/types";

type DataSource = "neo4j" | "mock" | "demo" | null;

type IcsDataContextValue = {
  data: PopulationData;
  loading: boolean;
  liveData: Neo4jIcsPopulationResponse | null;
  source: DataSource;
};

const IcsDataContext = createContext<IcsDataContextValue | null>(null);

export function IcsDataProvider({ children }: { children: ReactNode }) {
  const { data: liveData, loading, source } = useNeo4jIcsPopulation();
  const data = liveData ?? populationData;

  return (
    <IcsDataContext.Provider value={{ data, loading, liveData, source }}>
      {children}
    </IcsDataContext.Provider>
  );
}

export function useIcsData() {
  const ctx = useContext(IcsDataContext);
  if (!ctx) {
    throw new Error("useIcsData must be used within IcsDataProvider");
  }
  return ctx;
}
