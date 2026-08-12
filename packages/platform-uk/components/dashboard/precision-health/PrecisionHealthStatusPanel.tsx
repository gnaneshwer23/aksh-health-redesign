"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type HealthPayload = {
  status?: string;
  database?: { mode?: string; connected?: boolean };
  neo4j?: { mode?: string; connected?: boolean; note?: string };
};

type TwinStatus = {
  physiologicalTwin?: boolean;
  simulationMode?: string;
  available?: boolean;
  note?: string;
};

type MedplumStatus = {
  syncFlagEnabled?: boolean;
  liveEmis?: boolean;
  mode?: string;
  note?: string;
  status?: {
    syncFlagEnabled?: boolean;
    liveEmis?: boolean;
    mode?: string;
    note?: string;
  };
};

type EmisChecklist = {
  liveEmis?: boolean;
  liveWriteBack?: boolean;
  partnerChecklistDoc?: string;
  items?: Array<{ id: string; label: string; status: string }>;
  note?: string;
};

type ConsentPayload = {
  grants?: Array<{ status?: string; modalities?: string[]; purposeCode?: string }>;
};

type ConnectorsPayload = {
  connectors?: Array<{ id: string; liveStream: boolean; enabled: boolean; label: string }>;
};

/**
 * Admin roll-up: connectors, consent, Neo4j/Medplum/EMIS honesty flags, twin status, doc links.
 */
export function PrecisionHealthStatusPanel() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [twin, setTwin] = useState<TwinStatus | null>(null);
  const [medplum, setMedplum] = useState<MedplumStatus | null>(null);
  const [emis, setEmis] = useState<EmisChecklist | null>(null);
  const [consent, setConsent] = useState<ConsentPayload | null>(null);
  const [connectors, setConnectors] = useState<ConnectorsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [healthRes, twinRes, medplumRes, emisRes, consentRes, connectorsRes] =
        await Promise.all([
          fetch("/api/health"),
          fetch("/api/precision-health/twin/status"),
          fetch("/api/integrations/medplum-status", { credentials: "include" }),
          fetch("/api/integrations/emis-partner-checklist", { credentials: "include" }),
          fetch("/api/consent/grants?patientId=P001", { credentials: "include" }),
          fetch("/api/precision-health/connectors", { credentials: "include" }),
        ]);

      if (healthRes.ok) setHealth((await healthRes.json()) as HealthPayload);
      if (twinRes.ok) setTwin((await twinRes.json()) as TwinStatus);
      if (medplumRes.ok) setMedplum((await medplumRes.json()) as MedplumStatus);
      if (emisRes.ok) setEmis((await emisRes.json()) as EmisChecklist);
      else setEmis({ liveEmis: false, liveWriteBack: false, note: "Auth required for checklist detail" });
      if (consentRes.ok) setConsent((await consentRes.json()) as ConsentPayload);
      if (connectorsRes.ok) setConnectors((await connectorsRes.json()) as ConnectorsPayload);
    } catch {
      setError("Could not load Precision Health status (network).");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeGrants =
    consent?.grants?.filter((g) => (g.status ?? "active") !== "revoked").length ?? null;
  const liveConnectors = connectors?.connectors?.filter((c) => c.liveStream).length ?? 0;
  const liveEmis = emis?.liveEmis ?? false;
  const physiologicalTwin = twin?.physiologicalTwin ?? false;
  const medplumInner = medplum?.status ?? medplum;
  const medplumEnabled = Boolean(medplumInner?.syncFlagEnabled);
  const medplumMode = medplumInner?.mode ?? "…";
  const medplumLiveEmis = medplum?.liveEmis ?? medplumInner?.liveEmis;

  return (
    <Card className="shadow-sm" data-testid="precision-health-status-panel">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm">Precision Health status (honest flags)</CardTitle>
        <p className="text-xs text-muted">
          Scaffolding roll-up — not a live Precision Health OS or physiological twin claim
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-2">
        {error ? <p className="text-xs text-danger">{error}</p> : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Flag
            label="liveEmis"
            value={String(liveEmis)}
            ok={!liveEmis}
            detail="Partner write-back blocked until signed go/no-go"
          />
          <Flag
            label="physiologicalTwin"
            value={String(physiologicalTwin)}
            ok={!physiologicalTwin}
            detail={twin?.simulationMode ? `mode:${twin.simulationMode}` : "synthetic_rules only"}
          />
          <Flag
            label="Neo4j"
            value={health?.neo4j?.mode ?? "…"}
            ok={true}
            detail={health?.neo4j?.note ?? "from /api/health"}
          />
          <Flag
            label="Postgres"
            value={health?.database?.mode ?? "…"}
            ok={health?.database?.connected !== false}
            detail={`platform health: ${health?.status ?? "…"}`}
          />
          <Flag
            label="Medplum rehearsal"
            value={medplumEnabled ? "flag on" : "flag off"}
            ok={true}
            detail={
              medplumLiveEmis === false || medplumLiveEmis === undefined
                ? `liveEmis:false · ${medplumMode}`
                : "unexpected liveEmis"
            }
          />
          <Flag
            label="Connector liveStream"
            value={`${liveConnectors} live`}
            ok={liveConnectors === 0}
            detail="0 expected without Fitbit / OpenWeather keys"
          />
        </div>

        <div>
          <p className="text-xs font-semibold">Consent summary (P001 demo)</p>
          <p className="mt-1 text-xs text-muted">
            {activeGrants === null
              ? "Sign in as admin to load grants."
              : `${activeGrants} active grant(s) in scope · SHIELD on change · ehrWrite:false`}
          </p>
          <Link
            href="/dashboard/admin/consent"
            className="mt-1 inline-block text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            Open consent registry →
          </Link>
          <Link
            href="/demo/precision-health-loop"
            className="mt-1 ml-3 inline-block text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            Replay clinical spine →
          </Link>
        </div>

        {emis?.items && emis.items.length > 0 ? (
          <div>
            <p className="text-xs font-semibold">EMIS partner checklist</p>
            <ul className="mt-1 space-y-1 text-xs text-muted">
              {emis.items.map((item) => (
                <li key={item.id}>
                  {item.label}: <span className="font-medium text-foreground">{item.status}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3 text-xs">
          <DocLink href="/docs/PHASE2_PARTNER_CHECKLIST.md" label="Phase 2 partner checklist" />
          <DocLink href="/docs/PHASE3_REGULATORY_PATH.md" label="Phase 3 regulatory path" />
          <DocLink
            href="/docs/PRECISION_HEALTH_DELIVERY_ROADMAP.md"
            label="Delivery roadmap"
          />
          <Link
            href="/security#precision-health"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Marketing resources (roadmap language) →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function Flag({
  label,
  value,
  ok,
  detail,
}: {
  label: string;
  value: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <div className="rounded-sm border border-border p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${ok ? "text-foreground" : "text-danger"}`}>{value}</p>
      <p className="mt-1 text-[11px] text-muted">{detail}</p>
    </div>
  );
}

function DocLink({ href, label }: { href: string; label: string }) {
  // Docs are repo-relative; surface as text path for auditors (not a public static route).
  if (href.startsWith("/docs/")) {
    return (
      <span className="rounded-md border border-dashed border-border px-2 py-1 text-muted">
        {label}: <code className="text-[10px] text-foreground">{href.slice(1)}</code>
      </span>
    );
  }
  return (
    <Link href={href} className="font-medium text-primary underline-offset-2 hover:underline">
      {label}
    </Link>
  );
}
