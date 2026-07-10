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
    }
  ];
}

export function shouldSyncAcceptedCaseToMedplum(existing: ReviewCase, payload: ReviewCase, updated: ReviewCase) {
  return (
    isMedplumSyncEnabled() &&
    payload.status === "accepted" &&
    existing.status !== "accepted" &&
    Boolean(updated.frozenArtifact?.exportedResources)
  );
}
