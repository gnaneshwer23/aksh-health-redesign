"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import {
  MODALITY_IDS,
  type ModalityId,
} from "@/lib/precision-health/modalities";
import {
  PURPOSE_CODES,
  PURPOSE_CATALOGUE,
  type ConsentGrant,
  type PurposeCode,
} from "@/lib/precision-health/consent";
import { cn } from "@/lib/utils";

type PurposeRow = {
  code: PurposeCode;
  label: string;
  description: string;
  allowsClinicalWrite: false;
};

type GrantsResponse = {
  purposes?: PurposeRow[];
  grants?: ConsentGrant[];
  note?: string;
  error?: string;
};

const MODALITY_LABELS: Record<ModalityId, string> = {
  wearable: "Wearable (synthetic)",
  lifestyle: "Lifestyle",
  clinical: "Clinical",
  lab: "Lab",
  imaging_meta: "Imaging meta",
  omics_meta: "Omics meta",
  environment: "Environment",
};

export function ConsentGrantsPanel({
  patientId,
  patientLabel,
  mode = "clinician",
}: {
  patientId: string;
  patientLabel?: string;
  mode?: "clinician" | "patient" | "admin";
}) {
  const [grants, setGrants] = useState<ConsentGrant[]>([]);
  const [purposes, setPurposes] = useState<PurposeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [purposeCode, setPurposeCode] = useState<PurposeCode>("care_delivery");
  const [modalities, setModalities] = useState<ModalityId[]>(["clinical", "lifestyle"]);
  const [includeRevoked, setIncludeRevoked] = useState(mode === "admin");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ patientId });
      if (includeRevoked) params.set("includeRevoked", "true");
      const response = await fetch(`/api/consent/grants?${params.toString()}`, {
        credentials: "include",
      });
      const data = (await response.json()) as GrantsResponse;
      if (!response.ok) {
        toast({
          title: "Consent registry unavailable",
          description: data.error ?? "Could not load purpose grants.",
        });
        return;
      }
      setGrants(data.grants ?? []);
      setPurposes(
        data.purposes?.length
          ? data.purposes
          : PURPOSE_CODES.map((code) => ({ code, ...PURPOSE_CATALOGUE[code] }))
      );
    } catch {
      toast({ title: "Consent registry unavailable", description: "Network error." });
    } finally {
      setLoading(false);
    }
  }, [patientId, includeRevoked]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleModality = (id: ModalityId) => {
    setModalities((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const grant = async () => {
    if (!modalities.length) {
      toast({ title: "Select modalities", description: "At least one modality is required." });
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/consent/grants", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, purposeCode, modalities }),
      });
      const data = (await response.json()) as { error?: string; action?: string };
      if (!response.ok) {
        toast({ title: "Grant failed", description: data.error ?? "Could not save grant." });
        return;
      }
      toast({
        title: "Purpose grant saved",
        description: `${data.action ?? "grant"} · SHIELD logged · no EHR write`,
      });
      await load();
    } catch {
      toast({ title: "Grant failed", description: "Network error." });
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (grantId: string) => {
    setBusy(true);
    try {
      const response = await fetch("/api/consent/grants", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, revokeGrantId: grantId }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast({ title: "Revoke failed", description: data.error ?? "Could not revoke grant." });
        return;
      }
      toast({
        title: "Grant revoked",
        description: "SHIELD dual-write · no EHR write · Phase 1 registry only",
      });
      await load();
    } catch {
      toast({ title: "Revoke failed", description: "Network error." });
    } finally {
      setBusy(false);
    }
  };

  const title =
    mode === "patient"
      ? "My data purpose grants"
      : mode === "admin"
        ? "Consent / purpose registry"
        : "Consent purpose grants";

  return (
    <Card className="shadow-sm" data-testid="consent-grants-panel">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        <p className="text-xs text-muted">
          {patientLabel ? `${patientLabel} · ` : ""}
          Purpose-bound registry (Phase 1) — does not replace DPIA or NHS Login · no EHR write
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-2">
        {loading ? (
          <p className="text-sm text-muted">Loading grants…</p>
        ) : grants.length === 0 ? (
          <p
            role="status"
            data-testid="consent-grants-empty"
            className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted"
          >
            No purpose grants yet for this patient. Synthetic demo — not live device streams.
          </p>
        ) : (
          <ul className="space-y-2" data-testid="consent-grants-list">
            {grants.map((g) => (
              <li
                key={g.id}
                className={cn(
                  "rounded-sm border border-border p-3 text-xs",
                  g.status === "revoked" && "opacity-60"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">
                      {PURPOSE_CATALOGUE[g.purposeCode]?.label ?? g.purposeCode}
                      <span
                        className={cn(
                          "ml-2 inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                          g.status === "active"
                            ? "bg-accent/15 text-accent"
                            : "bg-muted text-muted"
                        )}
                      >
                        {g.status}
                      </span>
                    </p>
                    <p className="mt-1 text-muted">
                      Modalities: {g.modalities.map((m) => MODALITY_LABELS[m] ?? m).join(", ")}
                    </p>
                    <p className="mt-0.5 text-muted">
                      Granted {new Date(g.grantedAt).toLocaleString("en-GB")}
                      {g.revokedAt
                        ? ` · revoked ${new Date(g.revokedAt).toLocaleString("en-GB")}`
                        : ""}
                    </p>
                  </div>
                  {g.status === "active" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-danger text-danger"
                      disabled={busy}
                      onClick={() => void revoke(g.id)}
                    >
                      Revoke
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-3 rounded-sm border border-border-subtle bg-surface-muted/40 p-3">
          <p className="text-xs font-semibold text-foreground">Grant purpose + modalities</p>
          <label className="block text-xs text-muted">
            Purpose
            <select
              className="mt-1 w-full rounded-sm border border-border bg-card px-2 py-1.5 text-sm text-foreground"
              value={purposeCode}
              onChange={(e) => setPurposeCode(e.target.value as PurposeCode)}
              aria-label="Consent purpose"
            >
              {(purposes.length
                ? purposes
                : PURPOSE_CODES.map((code) => ({ code, ...PURPOSE_CATALOGUE[code] }))
              ).map((p) => (
                <option key={p.code} value={p.code}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <div>
            <p className="mb-1 text-xs text-muted">Modalities (contracts only — no live streams)</p>
            <div className="flex flex-wrap gap-2">
              {MODALITY_IDS.map((id) => {
                const selected = modalities.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleModality(id)}
                    className={cn(
                      "rounded-sm border px-2 py-1 text-[11px]",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted hover:border-primary/40"
                    )}
                    aria-pressed={selected}
                  >
                    {MODALITY_LABELS[id]}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" disabled={busy} onClick={() => void grant()}>
              {busy ? "Saving…" : "Grant purpose"}
            </Button>
            {mode !== "patient" ? (
              <label className="flex items-center gap-1.5 text-[11px] text-muted">
                <input
                  type="checkbox"
                  checked={includeRevoked}
                  onChange={(e) => setIncludeRevoked(e.target.checked)}
                />
                Show revoked
              </label>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
