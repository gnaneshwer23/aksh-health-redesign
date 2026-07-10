import { buildIntegrationEnvironmentContract } from "./integration-env";
import { getIntegrationAdapterRegistry, isFastApiSynthesisEnabled, isMedplumSyncEnabled } from "./integration-config";
import { buildOwnSystemBoundaryContract, getOwnSystemInterfaceContracts } from "./system-contracts";
import { buildTranscriptionDependencyStatus } from "./transcription-config";

export function buildIntegrationBoundaryContract(options?: { generatedAt?: string; generatedBy?: string }) {
  const adapters = getIntegrationAdapterRegistry();
  const ownSystemBoundary = buildOwnSystemBoundaryContract();
  const environmentContract = buildIntegrationEnvironmentContract(options);
  const transcription = buildTranscriptionDependencyStatus();

  return {
    artifactType: "aksh-uk-eu-integration-boundary-contract",
    generatedAt: options?.generatedAt ?? new Date().toISOString(),
    generatedBy: options?.generatedBy ?? "Aksh Health UK/EU synthetic proof system",
    syntheticOnly: true,
    defaultMode: "synthetic_proof",
    activeFlags: {
      fastApiSynthesis: isFastApiSynthesisEnabled(),
      medplumSync: isMedplumSyncEnabled()
    },
    ownSystemBoundary: {
      artifactType: ownSystemBoundary.artifactType,
      defaultSourceOfTruth: ownSystemBoundary.defaultSourceOfTruth,
      blockedClaims: ownSystemBoundary.blockedClaims
    },
    ownSystemInterfaces: getOwnSystemInterfaceContracts(),
    externalAdapters: adapters.filter((adapter) => adapter.id !== "fhir-export"),
    internalEvidenceAdapters: adapters.filter((adapter) => adapter.id === "fhir-export"),
    environmentContract,
    transcription,
    rehearsalRules: [
      "External adapters stay disabled unless their explicit environment flag is true.",
      "Deterministic synthetic intake generation is the default when ENABLE_FASTAPI_SYNTHESIS is false.",
      "FastAPI rehearsal failures must surface explicitly and must not silently replace synthetic proof behavior.",
      "Transcription uses simulated output until both DEEPGRAM_API_KEY and @deepgram/sdk are available.",
      "Medplum sync only runs on newly accepted frozen cases when ENABLE_MEDPLUM_SYNC=true."
    ],
    disabledByDefault: adapters.filter((adapter) => !adapter.enabled).map((adapter) => adapter.id)
  };
}
