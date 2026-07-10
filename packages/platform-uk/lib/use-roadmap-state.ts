"use client";

import { useCallback, useEffect, useState } from "react";

import {
  defaultM1ChecklistItems,
  defaultRoadmapTrackerItems,
  type M1ActionResolution,
  type M1ChecklistItem,
  type RoadmapTrackerItem,
  type RoadmapTrackerState
} from "@/lib/roadmap";

const defaultState: RoadmapTrackerState = {
  userId: "anonymous",
  updatedAt: new Date().toISOString().slice(0, 10),
  items: defaultRoadmapTrackerItems,
  m1Checklist: defaultM1ChecklistItems,
  m1ActionResolutions: [],
  history: []
};

export function useRoadmapState() {
  const [state, setState] = useState<RoadmapTrackerState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadState() {
      try {
        const response = await fetch("/api/roadmap", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load roadmap state.");
        }

        const payload = (await response.json()) as { state: RoadmapTrackerState };
        setState(payload.state);
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load roadmap state.");
      } finally {
        setIsLoaded(true);
      }
    }

    void loadState();
  }, []);

  const updateItem = useCallback(async (id: string, updates: Partial<Omit<RoadmapTrackerItem, "id">>) => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "update_item",
          id,
          updates
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update roadmap item.");
      }

      const payload = (await response.json()) as { state: RoadmapTrackerState };
      setState(payload.state);
      setError(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update roadmap item.");
    } finally {
      setIsSaving(false);
    }
  }, []);

  const resetState = useCallback(async () => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "reset" })
      });

      if (!response.ok) {
        throw new Error("Failed to reset roadmap state.");
      }

      const payload = (await response.json()) as { state: RoadmapTrackerState };
      setState(payload.state);
      setError(null);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Failed to reset roadmap state.");
    } finally {
      setIsSaving(false);
    }
  }, []);

  const updateM1ChecklistItem = useCallback(async (id: string, checklistUpdates: Partial<Omit<M1ChecklistItem, "id" | "week" | "title" | "doneWhen">>) => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "update_m1_checklist_item",
          id,
          checklistUpdates
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update M1 checklist item.");
      }

      const payload = (await response.json()) as { state: RoadmapTrackerState };
      setState(payload.state);
      setError(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update M1 checklist item.");
    } finally {
      setIsSaving(false);
    }
  }, []);

  const resolveM1Action = useCallback(async (
    resolution: Pick<M1ActionResolution, "actionId" | "itemId" | "owner" | "status" | "note"> &
      Partial<Pick<M1ActionResolution, "nextStep" | "targetDate" | "blockedReason" | "followThroughEvidenceLink">>
  ) => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "resolve_m1_action",
          resolution
        })
      });

      if (!response.ok) {
        throw new Error("Failed to resolve M1 action.");
      }

      const payload = (await response.json()) as { state: RoadmapTrackerState };
      setState(payload.state);
      setError(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to resolve M1 action.");
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    state,
    items: state.items,
    m1Checklist: state.m1Checklist,
    m1ActionResolutions: state.m1ActionResolutions,
    isLoaded,
    isSaving,
    error,
    updateItem,
    updateM1ChecklistItem,
    resolveM1Action,
    resetState
  };
}
