"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  defaultBenchmarkSignoffDraft,
  type BenchmarkSignoffDraft,
  type BenchmarkSignoffState
} from "@/lib/benchmark-signoff-types";

const defaultState: BenchmarkSignoffState = {
  userId: "anonymous",
  draft: { ...defaultBenchmarkSignoffDraft },
  archive: []
};

export function useBenchmarkSignoff() {
  const [state, setState] = useState<BenchmarkSignoffState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadState() {
      try {
        const response = await fetch("/api/benchmarks/signoff", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load benchmark sign-off state.");
        }
        const payload = (await response.json()) as { state: BenchmarkSignoffState };
        setState(payload.state);
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load benchmark sign-off state.");
      } finally {
        setIsLoaded(true);
      }
    }

    void loadState();
  }, []);

  const updateDraft = useCallback(async (updates: Partial<BenchmarkSignoffDraft>) => {
    setState((current) => ({
      ...current,
      draft: {
        ...current.draft,
        ...updates
      }
    }));
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/benchmarks/signoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_draft", draft: updates })
      });

      if (!response.ok) {
        throw new Error("Failed to save benchmark sign-off draft.");
      }

      const payload = (await response.json()) as { state: BenchmarkSignoffState };
      setState(payload.state);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save benchmark sign-off draft.");
    } finally {
      setIsSaving(false);
    }
  }, []);

  const saveSignoff = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/benchmarks/signoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_signoff", draft: state.draft })
      });

      if (!response.ok) {
        throw new Error("Failed to save benchmark sign-off.");
      }

      const payload = (await response.json()) as { state: BenchmarkSignoffState };
      setState(payload.state);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save benchmark sign-off.");
    } finally {
      setIsSaving(false);
    }
  }, [state.draft]);

  return useMemo(
    () => ({
      draft: state.draft,
      archive: state.archive,
      isLoaded,
      isSaving,
      error,
      updateDraft,
      saveSignoff
    }),
    [error, isLoaded, isSaving, saveSignoff, state.archive, state.draft, updateDraft]
  );
}
