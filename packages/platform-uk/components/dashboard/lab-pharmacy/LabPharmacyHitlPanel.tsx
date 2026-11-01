"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ReviewHonestyStrip } from "@/components/dashboard/review/ReviewHonestyStrip";
import {
  LAB_PHARMACY_HITL_DOC,
  LAB_PHARMACY_HITL_HONESTY_LINES,
  type LabPharmacyDraft,
  type LabPharmacyKind,
  type LabPharmacyReviewDecision,
} from "@/lib/lab-pharmacy-hitl";
import { cn } from "@/lib/utils";

type Mode = "stage" | "lab-queue" | "pharmacy-queue";

type LabPharmacyHitlPanelProps = {
  mode: Mode;
  /** Prefill synthetic patient from HCP session / review queue. */
  defaultPatientId?: string;
  defaultCareEpisodeId?: string;
  className?: string;
};

type ListResponse = {
  drafts?: LabPharmacyDraft[];
  error?: string;
  honestyLines?: string[];
};

const DEFAULT_LAB_ITEMS = "HbA1c, eGFR";
const DEFAULT_RX_ITEMS = "Metformin adherence follow-up";

export function LabPharmacyHitlPanel({
  mode,
  defaultPatientId = "hcp-synth-patel",
  defaultCareEpisodeId = "",
  className,
}: LabPharmacyHitlPanelProps) {
  const kindFilter: LabPharmacyKind | undefined =
    mode === "lab-queue" ? "lab" : mode === "pharmacy-queue" ? "pharmacy" : undefined;

  const [drafts, setDrafts] = useState<LabPharmacyDraft[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [stageKind, setStageKind] = useState<LabPharmacyKind>("lab");
  const [patientId, setPatientId] = useState(defaultPatientId);
  const [careEpisodeId, setCareEpisodeId] = useState(defaultCareEpisodeId);
  const [itemsText, setItemsText] = useState(DEFAULT_LAB_ITEMS);

  const [editDraftId, setEditDraftId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [reviewNote, setReviewNote] = useState("");

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const qs = new URLSearchParams({ status: "open", limit: "40" });
      if (kindFilter) qs.set("kind", kindFilter);
      const res = await fetch(`/api/lab-pharmacy-hitl?${qs.toString()}`, { credentials: "include" });
      const json = (await res.json()) as ListResponse;
      if (!res.ok) {
        setLoadError(json.error ?? `Load failed (${res.status})`);
        return;
      }
      setDrafts(json.drafts ?? []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Network error");
    }
  }, [kindFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPatientId(defaultPatientId);
  }, [defaultPatientId]);

  useEffect(() => {
    setItemsText(stageKind === "lab" ? DEFAULT_LAB_ITEMS : DEFAULT_RX_ITEMS);
  }, [stageKind]);

  async function onStage(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const items = itemsText
        .split(/[,\n;]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/lab-pharmacy-hitl", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: stageKind,
          syntheticPatientId: patientId.trim(),
          items,
          careEpisodeId: careEpisodeId.trim() || null,
        }),
      });
      const json = (await res.json()) as { error?: string; draft?: LabPharmacyDraft };
      if (!res.ok) {
        setMessage(json.error ?? `Stage failed (${res.status})`);
        return;
      }
      setMessage(`Staged ${json.draft?.kind} draft ${json.draft?.id} · pending ${json.draft?.kind} review`);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Network error");
    } finally {
      setBusy(false);
    }
  }

  async function onReview(draftId: string, decision: LabPharmacyReviewDecision) {
    setBusy(true);
    setMessage(null);
    try {
      const body: Record<string, string> = { draftId, decision };
      if (reviewNote.trim()) body.note = reviewNote.trim();
      if (decision === "edit") {
        body.editedContent = editDraftId === draftId ? editContent : "";
        if (!body.editedContent.trim()) {
          setMessage("Provide edited content before Edit.");
          setBusy(false);
          return;
        }
      }
      const res = await fetch("/api/lab-pharmacy-hitl/review", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { error?: string; draft?: LabPharmacyDraft };
      if (!res.ok) {
        setMessage(json.error ?? `Review failed (${res.status})`);
        return;
      }
      setMessage(`${decision} recorded for ${json.draft?.id} · status ${json.draft?.status}`);
      setEditDraftId(null);
      setEditContent("");
      setReviewNote("");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Network error");
    } finally {
      setBusy(false);
    }
  }

  const surface =
    mode === "stage"
      ? "GP lab/pharmacy HITL staging"
      : mode === "lab-queue"
        ? "Lab HITL review queue"
        : "Pharmacy HITL review queue";

  return (
    <div className={cn("space-y-4", className)} data-testid="lab-pharmacy-hitl-panel" data-mode={mode}>
      <ReviewHonestyStrip surface={surface} showHcpSessionLink />

      <section
        className="rounded-lg border border-border bg-surface-raised/40 p-4 space-y-2"
        data-testid="lab-pharmacy-hitl-honesty"
        role="status"
      >
        <h2 className="text-sm font-semibold tracking-tight">Lab / pharmacy HITL honesty (C3)</h2>
        <ul className="text-xs text-muted list-disc pl-4 space-y-1">
          {LAB_PHARMACY_HITL_HONESTY_LINES.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="text-[11px] text-muted">
          live: false · ehrWrite: false · clinicalValidationClaim: false · Docs: {LAB_PHARMACY_HITL_DOC}
        </p>
      </section>

      <div className="flex flex-wrap gap-3 text-xs">
        <Link href="/dashboard/gp/lab-pharmacy" className="underline text-primary" data-testid="lph-link-gp-stage">
          GP stage drafts
        </Link>
        <Link href="/dashboard/admin/lab-queue" className="underline text-primary" data-testid="lph-link-lab-queue">
          Lab review queue
        </Link>
        <Link
          href="/dashboard/pharmacist/pharmacy-queue"
          className="underline text-primary"
          data-testid="lph-link-pharmacy-queue"
        >
          Pharmacy review queue
        </Link>
        <Link href="/dashboard/gp/hcp-eval-session" className="underline text-primary" data-testid="lph-link-hcp">
          HCP eval session (C1)
        </Link>
        <Link href="/dashboard/gp/review-queue" className="underline text-primary" data-testid="lph-link-review">
          GP review · honesty (C2)
        </Link>
        <button type="button" className="underline text-primary" onClick={() => void load()} data-testid="lph-reload">
          Reload queue
        </button>
      </div>

      {mode === "stage" ? (
        <form
          onSubmit={(e) => void onStage(e)}
          className="rounded-lg border border-border p-4 space-y-3"
          data-testid="lab-pharmacy-stage-form"
        >
          <h3 className="text-sm font-semibold">Stage lab or pharmacy draft</h3>
          <p className="text-xs text-muted">
            GP / facilitator stages a draft for the lab or pharmacy role to Accept / Edit / Reject. Reuses P1-LAB
            ServiceRequest stubs for lab · never live.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="stageKind"
                checked={stageKind === "lab"}
                onChange={() => setStageKind("lab")}
                data-testid="lph-stage-kind-lab"
              />
              Lab
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="stageKind"
                checked={stageKind === "pharmacy"}
                onChange={() => setStageKind("pharmacy")}
                data-testid="lph-stage-kind-pharmacy"
              />
              Pharmacy
            </label>
          </div>
          <label className="block text-xs space-y-1">
            Synthetic patient id
            <input
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              data-testid="lph-stage-patient"
              required
            />
          </label>
          <label className="block text-xs space-y-1">
            Care episode id (optional)
            <input
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              value={careEpisodeId}
              onChange={(e) => setCareEpisodeId(e.target.value)}
              data-testid="lph-stage-episode"
              placeholder="ce-…"
            />
          </label>
          <label className="block text-xs space-y-1">
            Items (comma / newline separated)
            <textarea
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm min-h-[72px]"
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
              data-testid="lph-stage-items"
              required
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
            data-testid="lph-stage-submit"
          >
            {busy ? "Staging…" : "Stage draft (HITL)"}
          </button>
        </form>
      ) : null}

      {loadError ? (
        <p className="text-sm text-amber-700 dark:text-amber-300" data-testid="lph-load-error">
          {loadError}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-muted" data-testid="lph-message" role="status">
          {message}
        </p>
      ) : null}

      <section className="space-y-2" data-testid="lab-pharmacy-hitl-queue">
        <h3 className="text-sm font-semibold">
          {mode === "stage" ? "Open drafts (this tenant)" : "Pending review"}
          <span className="ml-2 font-normal text-muted">({drafts.length})</span>
        </h3>
        {drafts.length === 0 ? (
          <p className="text-xs text-muted" data-testid="lph-queue-empty">
            No open drafts. {mode === "stage" ? "Stage one above." : "Ask GP to stage from Lab/pharmacy HITL."}
          </p>
        ) : (
          <ul className="space-y-3">
            {drafts.map((d) => (
              <li
                key={d.id}
                className="rounded-lg border border-border p-3 space-y-2"
                data-testid="lph-queue-item"
                data-draft-id={d.id}
                data-kind={d.kind}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">
                    {d.title}{" "}
                    <span className="text-xs font-normal text-muted">
                      · {d.kind} · {d.status} · live:{String(d.live)}
                    </span>
                  </p>
                  <p className="text-[11px] font-mono text-muted">{d.id}</p>
                </div>
                <p className="text-xs text-muted">{d.summary}</p>
                <p className="text-xs">
                  Patient <span className="font-mono">{d.syntheticPatientId}</span>
                  {d.careEpisodeId ? (
                    <>
                      {" "}
                      · episode <span className="font-mono">{d.careEpisodeId}</span>
                    </>
                  ) : null}
                </p>
                <ul className="text-xs list-disc pl-4">
                  {d.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {d.serviceRequestDrafts?.length ? (
                  <p className="text-[11px] text-muted" data-testid="lph-sr-stubs">
                    ServiceRequest stubs: {d.serviceRequestDrafts.length} · status draft · ehrWrite:false
                  </p>
                ) : null}
                <details className="text-[11px] text-muted">
                  <summary>Audit trail ({d.auditTrail.length})</summary>
                  <ol className="mt-1 list-decimal pl-4 space-y-0.5">
                    {d.auditTrail.map((a) => (
                      <li key={a.id}>
                        {a.at} · {a.action} · {a.actor} · {a.detail}
                      </li>
                    ))}
                  </ol>
                </details>

                {mode !== "stage" ? (
                  <div className="flex flex-col gap-2 pt-1">
                    <label className="block text-xs space-y-1">
                      Review note (optional)
                      <input
                        className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        data-testid={`lph-note-${d.id}`}
                      />
                    </label>
                    {editDraftId === d.id ? (
                      <label className="block text-xs space-y-1">
                        Edited items
                        <textarea
                          className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm min-h-[56px]"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          data-testid={`lph-edit-${d.id}`}
                        />
                      </label>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        className="rounded-md bg-primary px-2.5 py-1 text-xs text-primary-foreground disabled:opacity-50"
                        onClick={() => void onReview(d.id, "accept")}
                        data-testid={`lph-accept-${d.id}`}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        className="rounded-md border border-border px-2.5 py-1 text-xs disabled:opacity-50"
                        onClick={() => {
                          setEditDraftId(d.id);
                          setEditContent(d.items.join(", "));
                        }}
                        data-testid={`lph-edit-open-${d.id}`}
                      >
                        Edit…
                      </button>
                      {editDraftId === d.id ? (
                        <button
                          type="button"
                          disabled={busy}
                          className="rounded-md border border-border px-2.5 py-1 text-xs disabled:opacity-50"
                          onClick={() => void onReview(d.id, "edit")}
                          data-testid={`lph-edit-submit-${d.id}`}
                        >
                          Submit edit
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={busy}
                        className="rounded-md border border-destructive/40 px-2.5 py-1 text-xs text-destructive disabled:opacity-50"
                        onClick={() => void onReview(d.id, "reject")}
                        data-testid={`lph-reject-${d.id}`}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
