"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type HealthPayload = {
  status?: string;
  database?: { mode?: string; connected?: boolean; configured?: boolean };
  neo4j?: { mode?: string; connected?: boolean; note?: string; configured?: boolean };
};

type TwinStatus = {
  physiologicalTwin?: boolean;
  simulationMode?: string;
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
    credentialsConfigured?: boolean;
    note?: string;
    dryRunEligible?: boolean;
  };
};

type EmisChecklist = {
  liveEmis?: boolean;
  liveWriteBack?: boolean;
  note?: string;
};

type LoopCapabilities = {
  stages?: string[];
  honesty?: {
    physiologicalTwin?: boolean;
    liveEmis?: boolean;
    autoRetrain?: boolean;
    ehrWrite?: boolean;
    note?: string;
  };
};

type OutcomesLoopStatus = {
  careActionCount?: number;
  awaitingOutcomeCount?: number;
  outcomeLinkedCount?: number;
  evaluationReviewCount?: number;
  loopCompleteRatio?: number;
  autoRetrain?: boolean;
  note?: string;
};

type PartnerReadinessSummary = {
  notLiveBanner?: string;
  liveEmis?: boolean;
  tracks?: Array<{ id: string; label: string; uiStatus: string }>;
  gateArtifacts?: { total?: number };
  sandbox?: {
    mode?: string;
    writePath?: string;
    sandboxFlagEnabled?: boolean;
    credentialsConfigured?: boolean;
    missingEnv?: string[];
  };
  note?: string;
};

type ConnectorsPayload = {
  connectors?: Array<{ id: string; liveStream?: boolean; enabled?: boolean }>;
};

type AgentProbe = {
  id: string;
  label: string;
  href: string;
  ok: boolean | null;
};

const AGENT_PROBES: Array<{ id: string; label: string; href: string }> = [
  { id: "guardian", label: "GUARDIAN", href: "/api/agents/guardian" },
  { id: "oracle", label: "HORIZON", href: "/api/agents/oracle" },
  { id: "nexus", label: "NEXUS", href: "/api/agents/nexus" },
  { id: "pathway", label: "PATHWAY", href: "/api/agents/pathway" },
  { id: "dr-assist", label: "Dr.Assist (sub-cap)", href: "/api/agents/dr-assist" },
];

/**
 * Single ops view of the Aksh clinical spine — Postgres, Neo4j, agents, EMIS/Medplum honesty,
 * whole-loop capabilities. Extends admin Precision Health; not a second product.
 */
export function SystemSpinePanel() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [twin, setTwin] = useState<TwinStatus | null>(null);
  const [medplum, setMedplum] = useState<MedplumStatus | null>(null);
  const [emis, setEmis] = useState<EmisChecklist | null>(null);
  const [loop, setLoop] = useState<LoopCapabilities | null>(null);
  const [outcomesLoop, setOutcomesLoop] = useState<OutcomesLoopStatus | null>(null);
  const [partnerReady, setPartnerReady] = useState<PartnerReadinessSummary | null>(null);
  const [connectors, setConnectors] = useState<ConnectorsPayload | null>(null);
  const [bridge, setBridge] = useState<{
    queueDepth?: number;
    storagePreference?: string;
    note?: string;
    liveEmis?: boolean;
  } | null>(null);
  const [agents, setAgents] = useState<AgentProbe[]>(
    AGENT_PROBES.map((a) => ({ ...a, ok: null }))
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [
        healthRes,
        twinRes,
        medplumRes,
        emisRes,
        loopRes,
        connectorsRes,
        outcomesRes,
        partnerRes,
        bridgeRes,
        ...agentRes
      ] = await Promise.all([
          fetch("/api/health"),
          fetch("/api/precision-health/twin/status"),
          fetch("/api/integrations/medplum-status", { credentials: "include" }),
          fetch("/api/integrations/emis-partner-checklist", { credentials: "include" }),
          fetch("/api/precision-health/whole-loop"),
          fetch("/api/precision-health/connectors", { credentials: "include" }),
          fetch("/api/clinical-spine/outcomes", { credentials: "include" }),
          fetch("/api/clinical-spine/partner-readiness", { credentials: "include" }),
          fetch("/api/integrations/bridge-staging", { credentials: "include" }),
          ...AGENT_PROBES.map((a) => fetch(a.href).catch(() => null))
        ]);

      if (healthRes.ok) setHealth((await healthRes.json()) as HealthPayload);
      if (twinRes.ok) setTwin((await twinRes.json()) as TwinStatus);
      if (medplumRes.ok) setMedplum((await medplumRes.json()) as MedplumStatus);
      if (emisRes.ok) setEmis((await emisRes.json()) as EmisChecklist);
      else setEmis({ liveEmis: false, liveWriteBack: false, note: "Auth required for checklist" });
      if (loopRes.ok) setLoop((await loopRes.json()) as LoopCapabilities);
      if (connectorsRes.ok) setConnectors((await connectorsRes.json()) as ConnectorsPayload);
      else setConnectors(null);
      if (outcomesRes.ok) setOutcomesLoop((await outcomesRes.json()) as OutcomesLoopStatus);
      else setOutcomesLoop(null);
      if (partnerRes.ok) setPartnerReady((await partnerRes.json()) as PartnerReadinessSummary);
      else setPartnerReady(null);
      if (bridgeRes.ok) {
        setBridge(
          (await bridgeRes.json()) as {
            queueDepth?: number;
            storagePreference?: string;
            note?: string;
            liveEmis?: boolean;
          }
        );
      } else setBridge(null);

      setAgents(
        AGENT_PROBES.map((a, i) => {
          const res = agentRes[i];
          const ok = res ? res.ok || res.status < 500 : false;
          return { ...a, ok };
        })
      );
    } catch {
      setError("Could not load system spine status.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const medplumInner = medplum?.status ?? medplum;
  const liveEmis = emis?.liveEmis ?? false;
  const physiologicalTwin = twin?.physiologicalTwin ?? false;
  const autoRetrain = loop?.honesty?.autoRetrain ?? false;
  const connectorRows = connectors?.connectors ?? [];
  const liveStreamCount = connectorRows.filter((c) => c.liveStream).length;

  return (
    <Card className="shadow-sm" data-testid="system-spine-panel">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm">System spine</CardTitle>
        <p className="text-xs text-muted">
          One ops view of the Aksh clinical backend — same Neon, Neo4j, SHIELD, agents, and HITL
          path used by onboarding → dashboard → review. liveEmis:false · autoRetrain:false · not a
          parallel product.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-2">
        {error ? <p className="text-xs text-danger">{error}</p> : null}

        {medplumInner ? (
          <p
            role="status"
            data-testid="medplum-honesty-banner"
            className={
              medplumInner.mode === "disabled" || !medplumInner.syncFlagEnabled
                ? "rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted"
                : "rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950"
            }
          >
            <strong>Medplum:</strong>{" "}
            {medplumInner.mode === "disabled" || !medplumInner.syncFlagEnabled
              ? "Sync flag off (default) — accept path never pushes; dry-run cleared. Not live EMIS."
              : medplumInner.mode === "rehearsal_no_credentials"
                ? "Flag on but credentials missing — set MEDPLUM_CLIENT_ID + MEDPLUM_CLIENT_SECRET. Staging rehearsal only · liveEmis:false."
                : "CLIENT_ID/SECRET present — OAuth not verified. If smoke:medplum / ?probe=auth returns Invalid client, regenerate Client Secret in Medplum App → Clients (UUID placeholders fail). Not EMIS · liveEmis:false."}{" "}
            {medplumInner.note ?? medplum?.note ?? ""}
          </p>
        ) : null}

        <p
          role="status"
          data-testid="bridge-honesty-banner"
          className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-950"
        >
          <strong>BRIDGE:</strong> In-app FHIR staging (Neon JSONB or durable file) after HITL Accept —
          labelled preliminary/staging. Medplum OAuth not required.{" "}
          {bridge?.note ?? "liveEmis:false · handoff export via /api/review-cases/{id}/export/fhir"}
          {typeof bridge?.queueDepth === "number" ? ` · recent ${bridge.queueDepth}` : ""}
          {bridge?.storagePreference ? ` · storage=${bridge.storagePreference}` : ""}
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Flag
            label="Postgres"
            value={health?.database?.mode ?? "…"}
            ok={health?.database?.connected !== false}
            detail={`platform: ${health?.status ?? "…"}`}
          />
          <Flag
            label="Neo4j"
            value={health?.neo4j?.mode ?? "…"}
            ok={true}
            detail={health?.neo4j?.note ?? "from /api/health"}
          />
          <Flag
            label="liveEmis"
            value={String(liveEmis)}
            ok={!liveEmis}
            detail={emis?.note ?? "Partner write-back blocked"}
          />
          <Flag
            label="BRIDGE staging"
            value={bridge?.storagePreference ?? "Neon/file"}
            ok={bridge?.liveEmis !== true}
            detail={`preliminary · queue≈${bridge?.queueDepth ?? "…"} · liveEmis:false`}
          />
          <Flag
            label="Medplum"
            value={
              medplumInner?.mode === "rehearsal_no_credentials"
                ? "credentials needed"
                : medplumInner?.mode === "rehearsal_ready"
                  ? "keys present · verify OAuth"
                  : medplumInner?.syncFlagEnabled
                    ? "flag on"
                    : "flag off · dry-run"
            }
            ok={true}
            detail={`mode:${medplumInner?.mode ?? "…"} · liveEmis:${String(medplum?.liveEmis ?? medplumInner?.liveEmis ?? false)}`}
          />
          <Flag
            label="physiologicalTwin"
            value={String(physiologicalTwin)}
            ok={!physiologicalTwin}
            detail={twin?.simulationMode ? `mode:${twin.simulationMode}` : "synthetic_rules"}
          />
          <Flag
            label="autoRetrain"
            value={String(autoRetrain)}
            ok={!autoRetrain}
            detail="Learning recorder only — governed release required for model change"
          />
          <Flag
            label="Connectors"
            value={`${connectorRows.length || "…"} registered`}
            ok={liveStreamCount === 0}
            detail={
              connectorRows.length
                ? `liveStream:${liveStreamCount} (expect 0 without Fitbit/OpenWeather keys)`
                : "Auth may be required for registry"
            }
          />
        </div>

        <div>
          <p className="text-xs font-semibold">Agents (route health)</p>
          <ul className="mt-1 flex flex-wrap gap-2 text-xs">
            {agents.map((a) => (
              <li
                key={a.id}
                className={`rounded-md border px-2 py-1 ${
                  a.ok === null
                    ? "border-border text-muted"
                    : a.ok
                      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                      : "border-rose-300 bg-rose-50 text-rose-900"
                }`}
              >
                {a.label}: {a.ok === null ? "…" : a.ok ? "reachable" : "error"}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[11px] text-muted">
            GET capability probes only — no agent draft generation, no EHR write.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold">Precision Health loop</p>
          <p className="mt-1 text-xs text-muted">
            {loop?.stages?.length
              ? `${loop.stages.length} stages in whole-loop orchestrator — synthetic modalities replay of this spine.`
              : "Loading loop capabilities…"}{" "}
            {loop?.honesty?.note ?? ""}
          </p>
        </div>

        <div data-testid="spine-phase-b-ingest">
          <p className="text-xs font-semibold">Phase B role ingest paths</p>
          <p className="mt-1 text-xs text-muted">
            Consent-gated synthetic wearable / lifestyle / file_import from patient companion and GP
            patient pages → same timeline · Neo4j MEASURED (when live) · SHIELD. Fitbit stays disabled
            without FITBIT_CLIENT_* keys. Admin connector registry below remains the full ops view.
          </p>
          <ul className="mt-2 flex flex-wrap gap-2 text-xs">
            <li className="rounded-md border border-border px-2 py-1 text-muted">
              Patient → /dashboard/patient
            </li>
            <li className="rounded-md border border-border px-2 py-1 text-muted">
              GP → /dashboard/gp/patients/[id]
            </li>
            <li className="rounded-md border border-border px-2 py-1 text-muted">
              liveEmis:false · autoRetrain:false
            </li>
          </ul>
        </div>

        <div data-testid="spine-phase-c-intelligence">
          <p className="text-xs font-semibold">Phase C intelligence paths</p>
          <p className="mt-1 text-xs text-muted">
            GP CONDUCTOR · Orchestrate (SYNTHESIS→GUARDIAN→HORIZON→NEXUS) + twin ranking (synthetic_rules)
            on patient / review pages; CANVAS intake + BRIDGE staging labels in Agent Control; safety-route
            gates patient coaching; HORIZON model card visible. Not live EMR or physiological twin.
          </p>
          <ul className="mt-2 flex flex-wrap gap-2 text-xs">
            <li className="rounded-md border border-border px-2 py-1 text-muted">
              POST /api/agents/orchestrate
            </li>
            <li className="rounded-md border border-border px-2 py-1 text-muted">
              GET /api/patients/[id]/safety-route
            </li>
            <li className="rounded-md border border-border px-2 py-1 text-muted">
              physiologicalTwin:false
            </li>
          </ul>
        </div>

        <div data-testid="spine-phase-d-stakeholders">
          <p className="text-xs font-semibold">Phase D stakeholder paths</p>
          <p className="mt-1 text-xs text-muted">
            Nurse vitals → timeline/KG; pharmacist review → SHIELD + learning; ICS/hospital aggregates
            from the same stores; patient companion plan + consent from GP APIs. Write-back remains
            sim/staging only (ehr-writeback-sim · emis-staging) — liveEmis:false.
          </p>
          <ul className="mt-2 flex flex-wrap gap-2 text-xs">
            <li className="rounded-md border border-border px-2 py-1 text-muted">
              POST /api/clinical-spine/nurse-vitals
            </li>
            <li className="rounded-md border border-border px-2 py-1 text-muted">
              POST /api/clinical-spine/pharmacist-review
            </li>
            <li className="rounded-md border border-border px-2 py-1 text-muted">
              GET /api/clinical-spine/aggregates
            </li>
            <li className="rounded-md border border-border px-2 py-1 text-muted">
              sim write-back only
            </li>
          </ul>
        </div>

        <div data-testid="spine-phase-e-outcomes">
          <p className="text-xs font-semibold">Phase E outcomes / learning closed loop</p>
          <p className="mt-1 text-xs text-muted">
            Care actions → eventual outcomes → governed evaluation on the same learning store.
            autoRetrain:false hard — propose_model_update blocked without G-ML-1…3.{" "}
            {outcomesLoop
              ? `${outcomesLoop.careActionCount ?? 0} actions · ${outcomesLoop.awaitingOutcomeCount ?? 0} awaiting · ${outcomesLoop.outcomeLinkedCount ?? 0} linked · ${outcomesLoop.evaluationReviewCount ?? 0} evals · ${Math.round((outcomesLoop.loopCompleteRatio ?? 0) * 100)}% closed.`
              : "Auth required for live loop counts (or no events yet)."}
          </p>
          <ul className="mt-2 flex flex-wrap gap-2 text-xs">
            <li className="rounded-md border border-border px-2 py-1 text-muted">
              GET/POST /api/clinical-spine/outcomes
            </li>
            <li className="rounded-md border border-border px-2 py-1 text-muted">
              GET/POST /api/clinical-spine/governed-evaluation
            </li>
            <li className="rounded-md border border-border px-2 py-1 text-muted">
              autoRetrain:false
            </li>
          </ul>
        </div>

        <div data-testid="spine-phase-f-partners">
          <p className="text-xs font-semibold">Phase F partner / regulatory track</p>
          <p className="mt-1 text-xs text-muted">
            In-repo readiness only — EMIS/SystmOne staging + N5 sandbox flag, DPIA/CSO/G-ML gate
            tracker, evidence pack export.{" "}
            {partnerReady?.tracks?.length
              ? partnerReady.tracks.map((t) => `${t.id}:${t.uiStatus}`).join(" · ")
              : "Auth required for track status."}{" "}
            Gate artefacts noted: {partnerReady?.gateArtifacts?.total ?? 0}. liveEmis:false hard.
          </p>
          {partnerReady?.sandbox ? (
            <p
              className="mt-1 rounded-sm border border-border bg-muted/30 px-2 py-1 text-[11px] text-muted"
              data-testid="spine-partner-sandbox"
            >
              Sandbox: mode={partnerReady.sandbox.mode} · writePath={partnerReady.sandbox.writePath}{" "}
              · flag={String(partnerReady.sandbox.sandboxFlagEnabled)} · creds=
              {String(partnerReady.sandbox.credentialsConfigured)}
              {partnerReady.sandbox.missingEnv?.length
                ? ` · needs_partner missing:${partnerReady.sandbox.missingEnv.join(",")}`
                : ""}{" "}
              — not live EMIS.
            </p>
          ) : null}
          {partnerReady?.notLiveBanner ? (
            <p className="mt-1 rounded-sm border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] text-amber-950">
              {partnerReady.notLiveBanner}
            </p>
          ) : null}
          <ul className="mt-2 flex flex-wrap gap-2 text-xs">
            <li className="rounded-md border border-border px-2 py-1 text-muted">
              GET /api/clinical-spine/partner-readiness
            </li>
            <li className="rounded-md border border-border px-2 py-1 text-muted">
              GET /api/integrations/emis-partner-sandbox
            </li>
            <li className="rounded-md border border-border px-2 py-1 text-muted">
              GET/POST /api/clinical-spine/partner-gates
            </li>
            <li className="rounded-md border border-border px-2 py-1 text-muted">
              GET /api/clinical-spine/evidence-pack-export
            </li>
            <li className="rounded-md border border-border px-2 py-1 text-muted">
              liveEmis:false
            </li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-3 text-xs">
          <Link
            href="/dashboard/admin/audit"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            SHIELD audit →
          </Link>
          <Link
            href="/dashboard/admin/learning"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Learning events →
          </Link>
          <Link
            href="/dashboard/admin/consent"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Consent registry →
          </Link>
          <Link
            href="/dashboard/admin/integrations"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Integrations →
          </Link>
          <Link
            href="/demo/precision-health-loop"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Replay clinical spine (demo) →
          </Link>
          <Link
            href="/demo/script"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Guided demo script (Capture→export) →
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
  detail
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
