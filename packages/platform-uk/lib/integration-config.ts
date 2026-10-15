import { llmAgentEnabled } from "./ai/llm-gate";
import type { ReviewCase } from "./types";
import { aiProvider } from "./ai/model";

export function isFastApiSynthesisEnabled() {
  return process.env.ENABLE_FASTAPI_SYNTHESIS === "true";
}

export function isMedplumSyncEnabled() {
  return process.env.ENABLE_MEDPLUM_SYNC === "true";
}

/**
 * Diabetes disease-intelligence module (docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md,
 * docs/PHASED_BUILD_PLAN.md B3). Default OFF — opt-in only, same convention
 * as ENABLE_MEDPLUM_SYNC/ENABLE_FASTAPI_SYNTHESIS. When false,
 * lib/clinical-spine/orchestrate.ts never calls buildDiabetesRiskContribution
 * and HORIZON/GUARDIAN output is byte-identical to pre-B3 behaviour.
 */
export function isDiabetesModuleEnabled() {
  return process.env.ENABLE_DIABETES_MODULE === "true";
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
      boundary:
        "Rehearsal only when ENABLE_MEDPLUM_SYNC=true and an accepted case is newly frozen. OAuth via MEDPLUM_* env. Never EHR; push refuses when flag is off. See getMedplumRehearsalStatus()."
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
      boundary: "EHR, EHR, and health system live integration remain out of scope for this proof build."
    },
    {
      id: "emis-fhir-staging",
      label: "EHR FHIR staging adapter",
      status: "scaffolded" as const,
      enabled: false,
      defaultMode: "partner_track",
      boundary:
        "Scaffold only: accepts HITL-approved FHIR R4 bundles into an internal staging queue. No live EHR partner API credentials or write-back."
    },
    {
      id: "ehr-writeback-sim",
      label: "Simulated EHR write-back (test double)",
      status: "available" as const,
      enabled: false,
      defaultMode: "clinical_proof_harness",
      boundary:
        "POST /api/integrations/ehr-writeback-sim. Accepts writes only with a short-lived clinician approval token. Never calls live EHR. Disabled as an external integration; used by clinical-proof harness only."
    },
    {
      id: "llm-synthesis",
      label: `LLM SYNTHESIS (${aiProviderLabel()})`,
      status: isLlmSynthesisEnabled() ? ("enabled" as const) : ("available" as const),
      enabled: isLlmSynthesisEnabled(),
      defaultMode: "hitl_draft_only",
      boundary:
        "POST /api/agents/synthesis. Uses the configured AI provider (OpenAI direct or Vercel AI Gateway), else deterministic fallback. Never writes to EHR."
    },
    {
      id: "llm-guardian",
      label: `LLM GUARDIAN (${aiProviderLabel()})`,
      status: isLlmGuardianEnabled() ? ("enabled" as const) : ("available" as const),
      enabled: isLlmGuardianEnabled(),
      defaultMode: "hitl_draft_only",
      boundary:
        "POST /api/agents/guardian. Neo4j/mock interactions + AI narrative (OpenAI direct or Vercel AI Gateway) when configured, else deterministic fallback. Never writes to EHR."
    },
    {
      id: "llm-oracle",
      label: `LLM ORACLE (${aiProviderLabel()})`,
      status: isLlmOracleEnabled() ? ("enabled" as const) : ("available" as const),
      enabled: isLlmOracleEnabled(),
      defaultMode: "hitl_draft_only",
      boundary:
        "POST /api/agents/oracle. Neo4j/mock risk context + AI narrative (OpenAI direct or Vercel AI Gateway) when configured, else deterministic fallback. Never writes to EHR."
    },
    {
      id: "llm-dr-assist",
      label: `LLM Dr.Assist (${aiProviderLabel()})`,
      status: isLlmDrAssistEnabled() ? ("enabled" as const) : ("available" as const),
      enabled: isLlmDrAssistEnabled(),
      defaultMode: "hitl_draft_only",
      boundary:
        "POST /api/agents/dr-assist. Neo4j/mock conditions + AI coding suggestions (OpenAI direct or Vercel AI Gateway) when configured, else deterministic SNOMED/ICD-10 fallback. Never writes to EHR."
    },
    {
      id: "llm-equity",
      label: `LLM EQUITY (${aiProviderLabel()})`,
      status: isLlmEquityEnabled() ? ("enabled" as const) : ("available" as const),
      enabled: isLlmEquityEnabled(),
      defaultMode: "hitl_draft_only",
      boundary:
        "POST /api/agents/equity. Aggregate regional equity brief via Neo4j/mock + the configured AI provider (OpenAI direct or Vercel AI Gateway), else deterministic fallback. Never writes to EHR."
    },
    {
      id: "diabetes-module",
      label: "Diabetes disease intelligence (rules-based, v1)",
      status: isDiabetesModuleEnabled() ? ("enabled" as const) : ("available" as const),
      enabled: isDiabetesModuleEnabled(),
      defaultMode: "hitl_draft_only",
      boundary:
        "Feeds HORIZON/GUARDIAN as additive contributing factors/safety notes when ENABLE_DIABETES_MODULE=true. Rules-based only — no AI Gateway call, no dose/prescribing output (FR-DIAB-009). Glucose Intelligence stays insufficient_data pending OQ-DIAB-1 (modality schema)."
    },
    {
      id: "voice-care-synthetic",
      label: "VOICE CARE synthetic outbound",
      status: "available" as const,
      enabled: false,
      defaultMode: "hitl_escalation_only",
      boundary:
        "POST /api/agents/voice-care. Synthetic Day-3 outbound script → SHIELD + nurse task. No telephony. Never writes to EHR."
    },
    {
      id: "patient-access-synthetic",
      label: "Patient access integration (synthetic)",
      status: "available" as const,
      enabled: false,
      defaultMode: "hitl_outreach_only",
      boundary:
        "lib/patient-access. Inbound referral/intake/booking/no-show events → tagged FHIR + Provenance → diabetes access signals → clinician accept/reject → one non-clinical outreach request per patient. Mock transport only. No telephony. Never writes to EHR."
    }
  ];
}

/** Which AI provider the registry should name: the one lib/ai/model.ts will actually call. */
function aiProviderLabel() {
  const p = aiProvider();
  return p === "openai" ? "OpenAI" : p === "gateway" ? "AI Gateway" : "AI not configured";
}

function isLlmSynthesisEnabled() {
  return llmAgentEnabled("SYNTHESIS");
}

function isLlmGuardianEnabled() {
  return llmAgentEnabled("GUARDIAN");
}

function isLlmOracleEnabled() {
  return llmAgentEnabled("ORACLE");
}

function isLlmDrAssistEnabled() {
  return llmAgentEnabled("DR_ASSIST");
}

function isLlmEquityEnabled() {
  return llmAgentEnabled("EQUITY");
}

export function shouldSyncAcceptedCaseToMedplum(existing: ReviewCase, payload: ReviewCase, updated: ReviewCase) {
  return (
    isMedplumSyncEnabled() &&
    payload.status === "accepted" &&
    existing.status !== "accepted" &&
    Boolean(updated.frozenArtifact?.exportedResources)
  );
}
