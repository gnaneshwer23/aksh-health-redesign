import type { ReviewCase } from "./types";

export function isFastApiSynthesisEnabled() {
  return process.env.ENABLE_FASTAPI_SYNTHESIS === "true";
}

export function isMedplumSyncEnabled() {
  return process.env.ENABLE_MEDPLUM_SYNC === "true";
}

export function integrationModeLabel(enabled: boolean) {
  return enabled ? "integration enabled" : "integration rehearsal";
}

export function getIntegrationAdapterRegistry() {
  return [
    {
      id: "fhir-export",
      label: "FHIR-shaped export",
      status: "available" as const,
      enabled: true,
      defaultMode: "synthetic_evidence",
      boundary: "Builds internal FHIR R4-shaped evidence payloads; not a live EHR write."
    },
    {
      id: "medplum-sync",
      label: "Medplum sync",
      status: isMedplumSyncEnabled() ? "enabled" as const : "disabled" as const,
      enabled: isMedplumSyncEnabled(),
      defaultMode: "integration_rehearsal",
      boundary: "Only attempts sync when ENABLE_MEDPLUM_SYNC=true and an accepted case is newly frozen."
    },
    {
      id: "fastapi-synthesis",
      label: "FastAPI synthesis",
      status: isFastApiSynthesisEnabled() ? "enabled" as const : "disabled" as const,
      enabled: isFastApiSynthesisEnabled(),
      defaultMode: "integration_rehearsal",
      boundary: "Synthetic intake generation remains deterministic unless ENABLE_FASTAPI_SYNTHESIS=true."
    },
    {
      id: "ehr-connectors",
      label: "EHR connectors",
      status: "planned" as const,
      enabled: false,
      defaultMode: "interface_placeholder",
      boundary: "EMIS, SystmOne, and NHS live integration remain out of scope for this proof build."
    },
    {
      id: "emis-fhir-staging",
      label: "EMIS FHIR staging adapter",
      status: "scaffolded" as const,
      enabled: false,
      defaultMode: "partner_track",
      boundary:
        "Scaffold only: accepts HITL-approved FHIR R4 bundles into an internal staging queue. No live EMIS Partner API credentials or write-back."
    },
    {
      id: "llm-synthesis",
      label: "LLM SYNTHESIS (AI Gateway)",
      status: isLlmSynthesisEnabled() ? ("enabled" as const) : ("available" as const),
      enabled: isLlmSynthesisEnabled(),
      defaultMode: "hitl_draft_only",
      boundary:
        "POST /api/agents/synthesis. Uses AI Gateway when configured, else deterministic fallback. Never writes to EHR."
    }
  ];
}

function isLlmSynthesisEnabled() {
  if (process.env.ENABLE_LLM_SYNTHESIS === "false") return false;
  return Boolean(process.env.AI_GATEWAY_API_KEY) || process.env.VERCEL === "1";
}

export function shouldSyncAcceptedCaseToMedplum(existing: ReviewCase, payload: ReviewCase, updated: ReviewCase) {
  return (
    isMedplumSyncEnabled() &&
    payload.status === "accepted" &&
    existing.status !== "accepted" &&
    Boolean(updated.frozenArtifact?.exportedResources)
  );
}
