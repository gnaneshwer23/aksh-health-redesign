"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import type { ConsentGrant } from "@/lib/precision-health/consent";
import { isModalityGranted } from "@/lib/precision-health/consent";
import type { ConnectorId, ConnectorStatus } from "@/lib/precision-health/connectors";
import { ROLE_INGEST_CONNECTOR_IDS } from "@/lib/precision-health/connectors";
import { cn } from "@/lib/utils";

type ConnectorsResponse = {
  connectors?: ConnectorStatus[];
  liveStreamInvented?: boolean;
  ehrWrite?: boolean;
  note?: string;
  error?: string;
};

type GrantsResponse = {
  grants?: ConsentGrant[];
  error?: string;
};

type IngestResponse = {
  accepted?: boolean;
  connectorId?: string;
  liveStream?: boolean;
  ehrWrite?: boolean;
  message?: string;
  error?: string;
  kg?: { attempted?: boolean; applied?: boolean; mode?: string };
  shieldLogged?: boolean;
};

const ADMIN_DEMO_CONNECTORS: ConnectorId[] = [
  "wearable_synthetic_stream",
  "lifestyle_diary",
  "file_import",
];

type IngestMode = "admin" | "clinician" | "patient";

/**
 * Consent-gated connector ingest — admin registry + Phase B role UIs (patient / GP).
 * Fitbit / OpenWeather remain disabled for liveStream without keys — never invents device reads.
 */
export function ConnectorsIngestPanel({
  patientId = "P001",
  patientLabel = "Sarah Johnson (P001 · synthetic)",
  mode = "admin",
  onIngestSuccess,
}: {
  patientId?: string;
  patientLabel?: string;
  mode?: IngestMode;
  /** Called after a successful consent-gated ingest so the timeline can refresh. */
  onIngestSuccess?: () => void;
}) {
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [grants, setGrants] = useState<ConsentGrant[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState<ConnectorId | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const roleMode = mode === "patient" || mode === "clinician";
  const ingestableIds = useMemo(
    () => (roleMode ? ROLE_INGEST_CONNECTOR_IDS : ADMIN_DEMO_CONNECTORS),
    [roleMode]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [connectorsRes, grantsRes] = await Promise.all([
        fetch("/api/precision-health/connectors", { credentials: "include" }),
        fetch(`/api/consent/grants?patientId=${encodeURIComponent(patientId)}`, {
          credentials: "include",
        }),
      ]);

      const connectorsData = (await connectorsRes.json()) as ConnectorsResponse;
      if (!connectorsRes.ok) {
        toast({
          title: "Connectors unavailable",
          description: connectorsData.error ?? "Auth required to list connector registry.",
        });
      } else {
        setConnectors(connectorsData.connectors ?? []);
        setNote(connectorsData.note ?? "");
      }

      if (grantsRes.ok) {
        const grantsData = (await grantsRes.json()) as GrantsResponse;
        setGrants(grantsData.grants ?? []);
      } else {
        setGrants([]);
      }
    } catch {
      toast({ title: "Connectors unavailable", description: "Network error." });
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleConnectors = useMemo(() => {
    if (!roleMode) return connectors;
    const roleIds = new Set<ConnectorId>([
      ...ROLE_INGEST_CONNECTOR_IDS,
      "fitbit_oauth_stub",
    ]);
    return connectors.filter((c) => roleIds.has(c.id));
  }, [connectors, roleMode]);

  const consentFor = (connector: ConnectorStatus): boolean =>
    isModalityGranted(grants, patientId, connector.requiresConsentModality, "care_delivery");

  const runIngest = async (connector: ConnectorStatus) => {
    if (connector.id === "fitbit_oauth_stub" && !connector.liveStream) {
      toast({
        title: "Fitbit stub disabled",
        description:
          "FITBIT_CLIENT_ID / FITBIT_CLIENT_SECRET not set — no invented device reads. Use synthetic wearable or file import.",
      });
      return;
    }

    if (!consentFor(connector)) {
      toast({
        title: "Consent required before ingest",
        description: `Grant an active care_delivery consent covering ${connector.requiresConsentModality} for this patient, then retry.`,
      });
      setLastResult(
        `refused · consent missing for ${connector.requiresConsentModality} · liveStream:false`
      );
      return;
    }

    setIngesting(connector.id);
    setLastResult(null);
    try {
      const response = await fetch("/api/precision-health/ingest", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectorId: connector.id,
          purposeCode: "care_delivery",
          patientId,
          updateKg: true,
        }),
      });
      const data = (await response.json()) as IngestResponse;
      const summary = [
        data.accepted ? "accepted" : "refused",
        `liveStream:${String(data.liveStream ?? false)}`,
        `ehrWrite:${String(data.ehrWrite ?? false)}`,
        data.shieldLogged ? "SHIELD:logged" : "SHIELD:skipped",
        data.kg?.mode ? `kg:${data.kg.mode}` : null,
        data.message ?? data.error ?? "",
      ]
        .filter(Boolean)
        .join(" · ");
      setLastResult(summary);

      if (response.status === 403 || data.accepted === false) {
        toast({
          title: "Ingest blocked (consent)",
          description:
            data.message ??
            "Grant wearable/lifestyle consent for this patient, then retry the synthetic demo.",
        });
      } else if (!response.ok) {
        toast({
          title: "Ingest failed",
          description: data.error ?? data.message ?? "Could not run ingest.",
        });
      } else {
        toast({
          title: "Synthetic ingest OK",
          description:
            "Consent-gated sample stored · timeline + SHIELD · liveStream:false · no EHR write",
        });
        onIngestSuccess?.();
        void load();
      }
    } catch {
      toast({ title: "Ingest failed", description: "Network error." });
    } finally {
      setIngesting(null);
    }
  };

  const title =
    mode === "patient"
      ? "Share health data (synthetic)"
      : mode === "clinician"
        ? "Consent-gated modality ingest"
        : "Modality connectors + consent-gated ingest";

  const blurb =
    mode === "patient"
      ? `Pick a synthetic connector for ${patientLabel}. Requires your active care_delivery consent. Fitbit stays off without partner keys — never invents device reads.`
      : mode === "clinician"
        ? `Phase B role ingest for ${patientLabel} — synthetic wearable / lifestyle / file import into the shared timeline + SHIELD spine. Fitbit disabled without keys.`
        : `Phase 2 scaffolding — synthetic demo for ${patientLabel}. Fitbit liveStream stays off without FITBIT_CLIENT_* keys. Never invents device / DICOM / omics streams.`;

  return (
    <Card
      className="shadow-sm"
      data-testid="connectors-ingest-panel"
      data-ingest-mode={mode}
    >
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        <p className="text-xs text-muted">{blurb}</p>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-2">
        {loading && visibleConnectors.length === 0 ? (
          <p className="text-sm text-muted">Loading connector registry…</p>
        ) : (
          <ul className="space-y-2">
            {visibleConnectors.map((c) => {
              const isFitbit = c.id === "fitbit_oauth_stub";
              const demoable = ingestableIds.includes(c.id);
              const hasConsent = consentFor(c);
              const fitbitBlocked = isFitbit && !c.liveStream;

              return (
                <li
                  key={c.id}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-sm border border-border p-2 text-xs"
                  data-testid={`connector-row-${c.id}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {c.label}{" "}
                      <span className="font-normal text-muted">· {c.modality}</span>
                    </p>
                    <p className="mt-0.5 text-muted">{c.note}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-muted">
                      enabled:{String(c.enabled)} · liveStream:{String(c.liveStream)}
                      {fitbitBlocked ? " · Fitbit stub disabled (no client key)" : null}
                      {demoable
                        ? hasConsent
                          ? " · consent:active"
                          : " · consent:missing"
                        : null}
                    </p>
                  </div>
                  {demoable ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={ingesting !== null}
                      onClick={() => void runIngest(c)}
                      className={cn(!hasConsent && "opacity-80")}
                      data-testid={`ingest-btn-${c.id}`}
                    >
                      {ingesting === c.id
                        ? "Ingesting…"
                        : !hasConsent
                          ? "Needs consent"
                          : roleMode
                            ? "Ingest"
                            : "Demo ingest"}
                    </Button>
                  ) : fitbitBlocked ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      data-testid="fitbit-disabled-btn"
                      title="Fitbit stub disabled without FITBIT_CLIENT_* keys"
                    >
                      Disabled (no keys)
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}

        {note ? <p className="text-[11px] text-muted">{note}</p> : null}
        {lastResult ? (
          <p
            className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted"
            data-testid="ingest-last-result"
          >
            Last ingest: {lastResult}
          </p>
        ) : null}
        {roleMode ? (
          <p className="text-[10px] text-muted" data-testid="role-ingest-honesty">
            Synthetic until partners · liveEmis:false · autoRetrain:false · same spine as admin
            connectors (timeline · Neo4j when live · SHIELD).
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
