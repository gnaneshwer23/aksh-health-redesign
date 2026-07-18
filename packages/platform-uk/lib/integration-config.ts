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
    },
    {
      id: "llm-guardian",
      label: "LLM GUARDIAN (AI Gateway)",
      status: isLlmGuardianEnabled() ? ("enabled" as const) : ("available" as const),
      enabled: isLlmGuardianEnabled(),
      defaultMode: "hitl_draft_only",
      boundary:
        "POST /api/agents/guardian. Neo4j/mock interactions + AI Gateway narrative when configured, else deterministic fallback. Never writes to EHR."
    },
    {
      id: "llm-oracle",
      label: "LLM ORACLE (AI Gateway)",
      status: isLlmOracleEnabled() ? ("enabled" as const) : ("available" as const),
      enabled: isLlmOracleEnabled(),
      defaultMode: "hitl_draft_only",
      boundary:
        "POST /api/agents/oracle. Neo4j/mock risk context + AI Gateway narrative when configured, else deterministic fallback. Never writes to EHR."
    },
    {
      id: "llm-dr-assist",
      label: "LLM Dr.Assist (AI Gateway)",
      status: isLlmDrAssistEnabled() ? ("enabled" as const) : ("available" as const),
      enabled: isLlmDrAssistEnabled(),
      defaultMode: "hitl_draft_only",
      boundary:
        "POST /api/agents/dr-assist. Neo4j/mock conditions + AI Gateway coding suggestions when configured, else deterministic SNOMED/ICD-10 fallback. Never writes to EHR."
    },
    {
      id: "llm-equity",
      label: "LLM EQUITY (AI Gateway)",
      status: isLlmEquityEnabled() ? ("enabled" as const) : ("available" as const),
      enabled: isLlmEquityEnabled(),
      defaultMode: "hitl_draft_only",
      boundary:
        "POST /api/agents/equity. Aggregate ICS equity brief via Neo4j/mock + AI Gateway when configured, else deterministic fallback. Never writes to EHR."
    },
    {
      id: "voice-care-synthetic",
      label: "VOICE CARE synthetic outbound",
      status: "available" as const,
      enabled: false,
      defaultMode: "hitl_escalation_only",
      boundary:
        "POST /api/agents/voice-care. Synthetic Day-3 outbound script → SHIELD + nurse task. No telephony. Never writes to EHR."
    }
  ];
}

function isLlmSynthesisEnabled() {
  if (process.env.ENABLE_LLM_SYNTHESIS === "false") return false;
  return Boolean(process.env.AI_GATEWAY_API_KEY) || process.env.VERCEL === "1";
}

function isLlmGuardianEnabled() {
  if (process.env.ENABLE_LLM_GUARDIAN === "false") return false;
  return isLlmSynthesisEnabled();
}

function isLlmOracleEnabled() {
  if (process.env.ENABLE_LLM_ORACLE === "false") return false;
  return isLlmSynthesisEnabled();
}

function isLlmDrAssistEnabled() {
  if (process.env.ENABLE_LLM_DR_ASSIST === "false") return false;
  return isLlmSynthesisEnabled();
}

function isLlmEquityEnabled() {
  if (process.env.ENABLE_LLM_EQUITY === "false") return false;
  return isLlmSynthesisEnabled();
}

export function shouldSyncAcceptedCaseToMedplum(existing: ReviewCase, payload: ReviewCase, updated: ReviewCase) {
  return (
    isMedplumSyncEnabled() &&
    payload.status === "accepted" &&
    existing.status !== "accepted" &&
    Boolean(updated.frozenArtifact?.exportedResources)
  );
}
