"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { reviewCases as seedCases } from "@/lib/mock-data";
import type { ReviewCase } from "@/lib/types";

export function useReviewCases() {
  const [cases, setCases] = useState<ReviewCase[]>(seedCases);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedCase, setLastFailedCase] = useState<ReviewCase | null>(null);

  useEffect(() => {
    async function loadCases() {
      try {
        const response = await fetch("/api/review-cases", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load review cases.");
        }
        const payload = (await response.json()) as { cases: ReviewCase[] };
        setCases(payload.cases);
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load review cases.");
      } finally {
        setIsLoaded(true);
      }
    }

    void loadCases();
  }, []);

  const updateCase = useCallback(async (nextCase: ReviewCase) => {
    const previousCases = cases;
    setCases((current) => current.map((item) => (item.id === nextCase.id ? nextCase : item)));
    setIsSaving(true);
    setError(null);
    setLastFailedCase(null);

    try {
      const response = await fetch(`/api/review-cases/${nextCase.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(nextCase)
      });

      if (!response.ok) {
        throw new Error("Failed to save case changes.");
      }

      const payload = (await response.json()) as { reviewCase: ReviewCase };
      setCases((current) => current.map((item) => (item.id === payload.reviewCase.id ? payload.reviewCase : item)));
      setError(null);
    } catch (saveError) {
      setCases(previousCases);
      setLastFailedCase(nextCase);
      setError(saveError instanceof Error ? saveError.message : "Failed to save case changes.");
    } finally {
      // keep finally block for saving state reset
      setIsSaving(false);
    }
  }, [cases]);

  const resetCases = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/review-cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "reset" })
      });

      if (!response.ok) {
        throw new Error("Failed to reset demo cases.");
      }
      const payload = (await response.json()) as { cases: ReviewCase[] };
      setCases(payload.cases);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Failed to reset demo cases.");
    } finally {
      setIsSaving(false);
    }
  }, []);

  const retryLastSave = useCallback(async () => {
    if (!lastFailedCase) {
      return;
    }

    await updateCase(lastFailedCase);
  }, [lastFailedCase, updateCase]);

  const getCaseById = useCallback(
    (id: string) => {
      return cases.find((item) => item.id === id);
    },
    [cases]
  );

  return useMemo(
    () => ({
      cases,
      isLoaded,
      isSaving,
      error,
      updateCase,
      getCaseById,
      resetCases,
      retryLastSave
    }),
    [cases, error, getCaseById, isLoaded, isSaving, resetCases, retryLastSave, updateCase]
  );
}
