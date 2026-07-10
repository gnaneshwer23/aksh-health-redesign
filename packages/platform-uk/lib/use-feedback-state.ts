"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { defaultFeedbackDraft, type FeedbackDraft, type FeedbackState } from "@/lib/feedback-types";

const draftFields = [
  "audience",
  "sessionType",
  "relatedCaseId",
  "followUpOwner",
  "dueDate",
  "nextCheckpoint",
  "overdueNote",
  "readinessScore",
  "strongestMoment",
  "confusionPoint",
  "objections",
  "nextActions"
] as const;

type DraftField = (typeof draftFields)[number];

function hasDraftChanges(previous: FeedbackDraft, next: FeedbackDraft) {
  return draftFields.some((field) => previous[field] !== next[field]);
}

export function useFeedbackState() {
  const [state, setState] = useState<FeedbackState>({
    userId: "anonymous",
    draft: {
      ...defaultFeedbackDraft
    },
    archive: []
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastPersistedDraft = useRef<FeedbackDraft>({
    ...defaultFeedbackDraft
  });

  useEffect(() => {
    async function loadState() {
      try {
        const response = await fetch("/api/feedback", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load feedback state.");
        }

        const payload = (await response.json()) as { state: FeedbackState };
        setState(payload.state);
        lastPersistedDraft.current = payload.state.draft;
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load feedback state.");
      } finally {
        setIsLoaded(true);
      }
    }

    void loadState();
  }, []);

  useEffect(() => {
    if (!isLoaded || !hasDraftChanges(lastPersistedDraft.current, state.draft)) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      setIsSaving(true);

      try {
        const response = await fetch("/api/feedback", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ draft: state.draft })
        });

        if (!response.ok) {
          throw new Error("Failed to save feedback draft.");
        }

        const payload = (await response.json()) as { state: FeedbackState };
        setState(payload.state);
        lastPersistedDraft.current = payload.state.draft;
        setError(null);
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Failed to save feedback draft.");
      } finally {
        setIsSaving(false);
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [isLoaded, state.draft]);

  const updateDraftField = useCallback(<T extends DraftField>(field: T, value: FeedbackDraft[T]) => {
    setState((current) => ({
      ...current,
      draft: {
        ...current.draft,
        [field]: value,
        savedAt: new Date().toLocaleString("en-GB")
      }
    }));
  }, []);

  const saveSession = useCallback(async () => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "save_session",
          draft: state.draft
        })
      });

      if (!response.ok) {
        throw new Error("Failed to save feedback session.");
      }

      const payload = (await response.json()) as { state: FeedbackState };
      setState(payload.state);
      lastPersistedDraft.current = payload.state.draft;
      setError(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save feedback session.");
    } finally {
      setIsSaving(false);
    }
  }, [state.draft]);

  const clearArchive = useCallback(async () => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "clear_archive" })
      });

      if (!response.ok) {
        throw new Error("Failed to clear feedback archive.");
      }

      const payload = (await response.json()) as { state: FeedbackState };
      setState(payload.state);
      lastPersistedDraft.current = payload.state.draft;
      setError(null);
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : "Failed to clear feedback archive.");
    } finally {
      setIsSaving(false);
    }
  }, []);

  const resetDraftNotes = useCallback(async () => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "reset_draft_notes" })
      });

      if (!response.ok) {
        throw new Error("Failed to reset feedback notes.");
      }

      const payload = (await response.json()) as { state: FeedbackState };
      setState(payload.state);
      lastPersistedDraft.current = payload.state.draft;
      setError(null);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Failed to reset feedback notes.");
    } finally {
      setIsSaving(false);
    }
  }, []);

  const updateResolution = useCallback(
    async (id: string, resolutionStatus: "open" | "resolved") => {
      setIsSaving(true);

      try {
        const response = await fetch("/api/feedback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            action: "update_resolution",
            id,
            resolutionStatus
          })
        });

        if (!response.ok) {
          throw new Error("Failed to update feedback resolution.");
        }

        const payload = (await response.json()) as { state: FeedbackState };
        setState(payload.state);
        lastPersistedDraft.current = payload.state.draft;
        setError(null);
      } catch (resolutionError) {
        setError(resolutionError instanceof Error ? resolutionError.message : "Failed to update feedback resolution.");
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const updateFollowUp = useCallback(
    async (
      id: string,
      followUp: Partial<Pick<FeedbackState["archive"][number], "followUpOwner" | "dueDate" | "nextCheckpoint" | "overdueNote">>
    ) => {
      setIsSaving(true);

      try {
        const response = await fetch("/api/feedback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            action: "update_follow_up",
            id,
            followUp
          })
        });

        if (!response.ok) {
          throw new Error("Failed to update follow-up details.");
        }

        const payload = (await response.json()) as { state: FeedbackState };
        setState(payload.state);
        lastPersistedDraft.current = payload.state.draft;
        setError(null);
      } catch (followUpError) {
        setError(followUpError instanceof Error ? followUpError.message : "Failed to update follow-up details.");
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  return useMemo(
    () => ({
      draft: state.draft,
      archive: state.archive,
      isLoaded,
      isSaving,
      error,
      updateDraftField,
      saveSession,
      clearArchive,
      resetDraftNotes,
      updateResolution,
      updateFollowUp
    }),
    [clearArchive, error, isLoaded, isSaving, resetDraftNotes, saveSession, state.archive, state.draft, updateDraftField, updateResolution, updateFollowUp]
  );
}
