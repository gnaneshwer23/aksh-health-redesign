"use client";

import { useEffect, useState } from "react";

import type {
  Neo4jGuardianResponse,
  Neo4jIcsPopulationResponse,
  Neo4jPatientResponse,
} from "@/lib/neo4j/types";

type DataSource = "neo4j" | "mock" | null;

async function fetchWithSource<T>(url: string): Promise<{ data: T | null; source: DataSource }> {
  const response = await fetch(url);
  if (!response.ok) return { data: null, source: null };
  const source = (response.headers.get("X-Data-Source") as DataSource) ?? null;
  return { data: (await response.json()) as T, source };
}

export function useNeo4jPatient(patientId: string | null | undefined) {
  const [data, setData] = useState<Neo4jPatientResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<DataSource>(null);

  useEffect(() => {
    if (!patientId) {
      setData(null);
      setSource(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchWithSource<Neo4jPatientResponse>(`/api/neo4j/patient?id=${encodeURIComponent(patientId)}`)
      .then((result) => {
        if (cancelled) return;
        setData(result.data);
        setSource(result.source);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [patientId]);

  return { data, loading, source };
}

export function useNeo4jGuardian(patientId: string | null | undefined) {
  const [data, setData] = useState<Neo4jGuardianResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<DataSource>(null);

  useEffect(() => {
    if (!patientId) {
      setData(null);
      setSource(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchWithSource<Neo4jGuardianResponse>(
      `/api/neo4j/guardian?patientId=${encodeURIComponent(patientId)}`
    )
      .then((result) => {
        if (cancelled) return;
        setData(result.data);
        setSource(result.source);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [patientId]);

  return { data, loading, source };
}

export function useNeo4jIcsPopulation() {
  const [data, setData] = useState<Neo4jIcsPopulationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<DataSource>(null);

  useEffect(() => {
    let cancelled = false;

    fetchWithSource<Neo4jIcsPopulationResponse>("/api/neo4j/ics-population")
      .then((result) => {
        if (cancelled) return;
        setData(result.data);
        setSource(result.source);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, source };
}
