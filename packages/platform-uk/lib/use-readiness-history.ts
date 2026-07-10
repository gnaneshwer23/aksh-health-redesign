"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { EvidenceReadinessHistoryState } from "./readiness-history-types";

const defaultState: EvidenceReadinessHistoryState = {
  userId: "anonymous",
  archive: []
};

export function useReadinessHistory() {
  const [state, setState] = useState<EvidenceReadinessHistoryState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const response = await fetch("/api/readiness/history", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load readiness history.");
        }
        const payload = (await response.json()) as { state: EvidenceReadinessHistoryState };
        setState(payload.state);
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load readiness history.");
      } finally {
        setIsLoaded(true);
      }
    }

    void loadHistory();
  }, []);

  const saveSnapshot = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/readiness/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        throw new Error("Failed to save readiness snapshot.");
      }

      const payload = (await response.json()) as { state: EvidenceReadinessHistoryState };
      setState(payload.state);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save readiness snapshot.");
    } finally {
      setIsSaving(false);
    }
  }, []);

  return useMemo(
    () => ({
      archive: state.archive,
      isLoaded,
      isSaving,
      error,
      saveSnapshot
    }),
    [error, isLoaded, isSaving, saveSnapshot, state.archive]
  );
}
