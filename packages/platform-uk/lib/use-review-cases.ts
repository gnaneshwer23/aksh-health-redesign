"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { reviewCases as seedCases } from "@/lib/mock-data";
import type { ReviewCase } from "@/lib/types";

export type ShieldAuditWarning = {
  failedShieldAuditLearningEventIds: string[];
};

export function useReviewCases() {
  const [cases, setCases] = useState<ReviewCase[]>(seedCases);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedCase, setLastFailedCase] = useState<ReviewCase | null>(null);
  const [shieldAuditWarning, setShieldAuditWarning] = useState<ShieldAuditWarning | null>(null);
  const [isRetryingShieldAudit, setIsRetryingShieldAudit] = useState(false);

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

  const updateCase = useCallback(
    async (nextCase: ReviewCase, options?: { offerHealthPlan?: boolean }) => {
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
          body: JSON.stringify({
            ...nextCase,
            ...(options?.offerHealthPlan ? { offerHealthPlan: true } : {})
          })
        });

        if (!response.ok) {
          throw new Error("Failed to save case changes.");
        }

        const payload = (await response.json()) as {
          reviewCase: ReviewCase;
          spine?: {
            patientId?: string;
            learningEventIds?: string[];
            healthPlanId?: string | null;
            shieldAuditWriteFailed?: boolean;
            failedShieldAuditLearningEventIds?: string[];
          } | null;
        };
        setCases((current) =>
          current.map((item) => (item.id === payload.reviewCase.id ? payload.reviewCase : item))
        );
        setError(null);
        // OQ-HITL-2: honest, fail-visible flag — the decision above already saved;
        // this only means the SHIELD durable audit mirror failed for it.
        if (payload.spine?.shieldAuditWriteFailed) {
          setShieldAuditWarning({
            failedShieldAuditLearningEventIds: payload.spine.failedShieldAuditLearningEventIds ?? []
          });
        }
        return payload;
      } catch (saveError) {
        setCases(previousCases);
        setLastFailedCase(nextCase);
        setError(saveError instanceof Error ? saveError.message : "Failed to save case changes.");
        return null;
      } finally {
        // keep finally block for saving state reset
        setIsSaving(false);
      }
    },
    [cases]
  );

  /**
   * Accept, edit or reject one draft. The server decides and stores the result (with its audit record); the screen
   * shows what was stored, never an optimistic guess.
   */
  const decideItem = useCallback(
    async (caseId: string, itemId: string, body: { action: "accept" | "edit" | "reject"; content?: string; reason?: string; offerHealthPlan?: boolean }) => {
      const current = cases.find((c) => c.id === caseId);
      setIsSaving(true);
      setError(null);
      try {
        const response = await fetch(`/api/review-cases/${caseId}/items/${itemId}/decision`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, expectedVersion: current?.version ?? 0 }),
        });
        const data = (await response.json().catch(() => ({}))) as { reviewCase?: ReviewCase; error?: string; code?: string };
        if (!response.ok || !data.reviewCase) {
          if (data.code === "STALE_CASE") {
            const fresh = await fetch("/api/review-cases", { cache: "no-store" });
            if (fresh.ok) setCases(((await fresh.json()) as { cases: ReviewCase[] }).cases);
          }
          setError(data.error ?? "The decision was not recorded.");
          return null;
        }
        setCases((all) => all.map((c) => (c.id === caseId ? data.reviewCase! : c)));
        return data;
      } catch {
        setError("The decision was not recorded. Check your connection and try again.");
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [cases]
  );

  /**
   * Case-level decisions (accept / reject / defer) and human-gate decisions, decided on the server. Returns the stored
   * case, or the server's reason (blockers, stale version) so the screen can show it.
   */
  const postCaseAction = useCallback(
    async (caseId: string, path: string, body: Record<string, unknown>) => {
      const current = cases.find((c) => c.id === caseId);
      setIsSaving(true);
      setError(null);
      try {
        const response = await fetch(`/api/review-cases/${caseId}/${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, expectedVersion: current?.version ?? 0 }),
        });
        const data = (await response.json().catch(() => ({}))) as {
          reviewCase?: ReviewCase;
          error?: string;
          code?: string;
          blockers?: string[];
          staging?: { status: string; detail?: string };
        };
        if (!response.ok || !data.reviewCase) {
          if (data.code === "STALE_CASE") {
            const fresh = await fetch("/api/review-cases", { cache: "no-store" });
            if (fresh.ok) setCases(((await fresh.json()) as { cases: ReviewCase[] }).cases);
          }
          return { ok: false as const, error: (data.blockers?.[0] ?? data.error ?? "The decision was not recorded.").replace(/^[A-Z_]+: /, ""), code: data.code };
        }
        setCases((all) => all.map((c) => (c.id === caseId ? data.reviewCase! : c)));
        return { ok: true as const, reviewCase: data.reviewCase, staging: data.staging };
      } catch {
        return { ok: false as const, error: "The decision was not recorded. Check your connection and try again." };
      } finally {
        setIsSaving(false);
      }
    },
    [cases]
  );
  const decideCase = useCallback(
    (caseId: string, body: { decision: "accept" | "reject" | "defer"; notes?: string; overrideReason?: string; acknowledged: boolean }) => postCaseAction(caseId, "decision", body),
    [postCaseAction]
  );
  const decideGate = useCallback(
    (caseId: string, gateId: string, body: { status: "open" | "confirmed" | "not_applicable"; note?: string }) => postCaseAction(caseId, `gates/${gateId}`, body),
    [postCaseAction]
  );

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

  const dismissShieldAuditWarning = useCallback(() => {
    setShieldAuditWarning(null);
  }, []);

  const retryShieldAuditWrite = useCallback(async () => {
    if (!shieldAuditWarning?.failedShieldAuditLearningEventIds.length) {
      return;
    }

    setIsRetryingShieldAudit(true);
    try {
      const stillFailing: string[] = [];
      for (const learningEventId of shieldAuditWarning.failedShieldAuditLearningEventIds) {
        try {
          const response = await fetch("/api/clinical-spine/shield-audit-retry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ learningEventId })
          });
          if (!response.ok) {
            stillFailing.push(learningEventId);
          }
        } catch {
          stillFailing.push(learningEventId);
        }
      }

      setShieldAuditWarning(
        stillFailing.length > 0 ? { failedShieldAuditLearningEventIds: stillFailing } : null
      );
    } finally {
      setIsRetryingShieldAudit(false);
    }
  }, [shieldAuditWarning]);

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
      decideItem,
      decideCase,
      decideGate,
      getCaseById,
      resetCases,
      retryLastSave,
      shieldAuditWarning,
      isRetryingShieldAudit,
      dismissShieldAuditWarning,
      retryShieldAuditWrite
    }),
    [
      cases,
      dismissShieldAuditWarning,
      error,
      getCaseById,
      isLoaded,
      isRetryingShieldAudit,
      isSaving,
      resetCases,
      retryLastSave,
      retryShieldAuditWrite,
      shieldAuditWarning,
      updateCase,
      decideItem,
      decideCase,
      decideGate
    ]
  );
}
