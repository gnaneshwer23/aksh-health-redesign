"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";

type Track = {
  id: string;
  label: string;
  uiStatus: string;
  owner: string;
  externalAction: string;
  note: string;
};

type FlipItem = {
  id: string;
  label: string;
  status: string;
  metInCode?: boolean;
  note: string;
};

type EvidenceLink = {
  id: string;
  label: string;
  path: string;
  kind: string;
  note: string;
};

type GateRecord = {
  id: string;
  recordedAt: string;
  gateId: string;
  status: string;
  externalRef?: string;
  note: string;
  certified: false;
  unlocksLiveEmis: false;
};

type ReadinessPayload = {
  notLiveBanner?: string;
  tracks?: Track[];
  liveEmisFlipChecklist?: FlipItem[];
  evidencePackLinks?: EvidenceLink[];
  gateArtifacts?: { total?: number; byStatus?: Record<string, number>; latest?: GateRecord[] };
  liveEmis?: boolean;
  autoRetrain?: boolean;
  physiologicalTwin?: boolean;
  sandbox?: {
    mode?: string;
    writePath?: string;
    sandboxFlagEnabled?: boolean;
    credentialsConfigured?: boolean;
    missingEnv?: string[];
    note?: string;
  };
  note?: string;
  error?: string;
};

const GATE_OPTIONS = [
  "DPIA_EMR",
  "DPIA_MODALITY",
  "CSO_GATE2",
  "NAMED_CSO",
  "G_ML_2",
  "EMIS_GO_NOGO",
  "MODALITY_CREDENTIALS",
  "DTAC",
  "DCB0129",
  "MHRA_ROUTE"
] as const;

const STATUS_OPTIONS = ["unsigned", "pending_review", "external_ref_noted", "blocked"] as const;

function statusClass(status: string) {
  if (status === "scaffold_ready") return "border-emerald-300 bg-emerald-50 text-emerald-900";
  if (status === "pending" || status === "pending_review" || status === "external_ref_noted") {
    return "border-amber-300 bg-amber-50 text-amber-950";
  }
  if (status === "blocked" || status === "needs_partner" || status === "needs_cso") {
    return "border-rose-200 bg-rose-50 text-rose-900";
  }
  return "border-border text-muted";
}

/**
 * Phase F partner / regulatory readiness — honest unsigned/pending/blocked status.
 * Never claims live EHR, signed DPIA/CSO, or certifications.
 */
export function PartnerReadinessPanel() {
  const [pack, setPack] = useState<ReadinessPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [gateId, setGateId] = useState<(typeof GATE_OPTIONS)[number]>("DPIA_EMR");
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("pending_review");
  const [externalRef, setExternalRef] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/clinical-spine/partner-readiness", {
        credentials: "include",
        cache: "no-store"
      });
      const data = (await response.json()) as ReadinessPayload;
      if (!response.ok) {
        toast({
          title: "Partner readiness unavailable",
          description: data.error ?? "Could not load pack."
        });
        setPack(null);
        return;
      }
      setPack(data);
    } catch {
      toast({ title: "Partner readiness unavailable", description: "Network error." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submitGate = useCallback(async () => {
    if (!note.trim()) {
      toast({ title: "Note required", description: "Describe the pending human artefact." });
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/clinical-spine/partner-gates", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          gateId,
          status,
          externalRef: externalRef.trim() || undefined,
          note: note.trim()
        })
      });
      const data = (await response.json()) as {
        error?: string;
        accepted?: boolean;
        certified?: boolean;
        liveEmis?: boolean;
      };
      if (!response.ok) {
        toast({
          title: "Gate artefact rejected",
          description: data.error ?? "Could not record."
        });
        return;
      }
      toast({
        title: "Pending artefact noted",
        description: "Not certified · liveEmis:false · does not unlock write-back."
      });
      setNote("");
      setExternalRef("");
      await load();
    } catch {
      toast({ title: "Gate artefact failed", description: "Network error." });
    } finally {
      setSubmitting(false);
    }
  }, [externalRef, gateId, load, note, status]);

  const exportEvidence = useCallback(async () => {
    try {
      const response = await fetch("/api/clinical-spine/evidence-pack-export", {
        credentials: "include",
        cache: "no-store"
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: "Evidence export failed", description: "Auth or network error." });
        return;
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aksh-evidence-pack-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: "Evidence pack index downloaded",
        description: "Links only — not a signed certification pack."
      });
    } catch {
      toast({ title: "Evidence export failed", description: "Network error." });
    }
  }, []);

  return (
    <Card className="shadow-sm" data-testid="partner-readiness-panel">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm">Partner / regulatory readiness (Phase F)</CardTitle>
        <p className="text-xs text-muted">
          the EHR · DPIA · CSO Gate 2 · G-ML · modality credentials. liveEmis:false ·
          autoRetrain:false · physiologicalTwin:false · no invented certifications. Outreach
          checklist: docs/P7_PARTNER_OUTREACH_PACK.md (paperwork ≠ live EHR).
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-2">
        <div
          className="rounded-sm border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950"
          data-testid="partner-not-live-banner"
        >
          {pack?.notLiveBanner ??
            "NOT LIVE EHR — staging / sim write-back only. liveEmis:false until partner actions complete."}
        </div>

        <div
          className="rounded-sm border border-border bg-muted/30 px-3 py-2 text-xs text-muted"
          data-testid="partner-sandbox-status"
        >
          <span className="font-semibold text-foreground">Partner sandbox (N5):</span>{" "}
          {pack?.sandbox
            ? `mode=${pack.sandbox.mode} · writePath=${pack.sandbox.writePath} · flag=${String(pack.sandbox.sandboxFlagEnabled)} · creds=${String(pack.sandbox.credentialsConfigured)}${
                pack.sandbox.missingEnv?.length
                  ? ` · missing:${pack.sandbox.missingEnv.join(",")}`
                  : ""
              }`
            : "Loading…"}{" "}
          — liveEmis:false hard. Flag off = sim; flag on without Partner env = needs_partner.
        </div>

        {loading ? <p className="text-xs text-muted">Loading partner readiness…</p> : null}

        <div>
          <p className="text-xs font-semibold">Tracks</p>
          <ul className="mt-2 space-y-2">
            {(pack?.tracks ?? []).map((t) => (
              <li key={t.id} className={`rounded-sm border px-3 py-2 text-xs ${statusClass(t.uiStatus)}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold">{t.label}</span>
                  <span className="uppercase tracking-wide">{t.uiStatus}</span>
                </div>
                <p className="mt-1 opacity-90">
                  Owner: {t.owner}. External: {t.externalAction}
                </p>
                <p className="mt-0.5 opacity-80">{t.note}</p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold">What partner must provide to flip liveEmis</p>
          <p className="mt-1 text-[11px] text-muted">
            Code never auto-flips. All rows must be real + signed out-of-band before engineering
            considers enabling Partner write-back.
          </p>
          <ul className="mt-2 space-y-1.5">
            {(pack?.liveEmisFlipChecklist ?? []).map((item) => (
              <li
                key={item.id}
                className={`rounded-sm border px-2 py-1.5 text-xs ${statusClass(item.status)}`}
              >
                <span className="font-medium">{item.label}</span>
                <span className="ml-2 uppercase">{item.status}</span>
                {item.metInCode ? (
                  <span className="ml-2 text-[10px]">(scaffold met in-repo)</span>
                ) : null}
                <p className="mt-0.5 opacity-80">{item.note}</p>
              </li>
            ))}
          </ul>
        </div>

        <div data-testid="partner-gate-tracker">
          <p className="text-xs font-semibold">Gate artefact tracker (pending human)</p>
          <p className="mt-1 text-[11px] text-muted">
            Record external refs as pending — never marks certified, never unlocks liveEmis.
            Artefacts noted: {pack?.gateArtifacts?.total ?? 0}.
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label className="text-[11px] text-muted">
              Gate
              <select
                className="mt-1 w-full rounded-sm border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                value={gateId}
                onChange={(e) => setGateId(e.target.value as (typeof GATE_OPTIONS)[number])}
              >
                {GATE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px] text-muted">
              Status
              <select
                className="mt-1 w-full rounded-sm border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                value={status}
                onChange={(e) => setStatus(e.target.value as (typeof STATUS_OPTIONS)[number])}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px] text-muted sm:col-span-2">
              External ref (optional DPIA ID / thread)
              <input
                className="mt-1 w-full rounded-sm border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                value={externalRef}
                onChange={(e) => setExternalRef(e.target.value)}
                placeholder="e.g. DPIA-2026-041 draft"
              />
            </label>
            <label className="text-[11px] text-muted sm:col-span-2">
              Note
              <textarea
                className="mt-1 w-full rounded-sm border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Pending IG review — not signed"
              />
            </label>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={submitting} onClick={() => void submitGate()}>
              {submitting ? "Saving…" : "Note pending artefact"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => void exportEvidence()}>
              Download evidence pack index
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => void load()}>
              Refresh
            </Button>
          </div>
          {(pack?.gateArtifacts?.latest?.length ?? 0) > 0 ? (
            <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-[11px] text-muted">
              {pack?.gateArtifacts?.latest?.slice(0, 8).map((r) => (
                <li key={r.id} className="border-b border-border/60 pb-1">
                  {r.recordedAt.slice(0, 19)} · {r.gateId} · {r.status}
                  {r.externalRef ? ` · ref:${r.externalRef}` : ""} — certified:false
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div>
          <p className="text-xs font-semibold">Evidence pack links (partner review)</p>
          <ul className="mt-2 grid gap-1 text-[11px] text-muted sm:grid-cols-2">
            {(pack?.evidencePackLinks ?? []).slice(0, 10).map((l) => (
              <li key={l.id} className="rounded-sm border border-border px-2 py-1">
                <span className="font-medium text-foreground">{l.label}</span>
                <br />
                <span className="font-mono">{l.path}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
