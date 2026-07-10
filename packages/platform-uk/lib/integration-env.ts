export type IntegrationEnvironmentVariable = {
  name: string;
  defaultValue: string;
  required: boolean;
  scope: "server" | "client" | "integration_rehearsal";
  purpose: string;
  failureModes: string[];
};

export function getIntegrationEnvironmentVariables(): IntegrationEnvironmentVariable[] {
  return [
    {
      name: "ENABLE_FASTAPI_SYNTHESIS",
      defaultValue: "false",
      required: false,
      scope: "integration_rehearsal",
      purpose: "Enables FastAPI-backed intake synthesis instead of deterministic local generation.",
      failureModes: [
        "When false, intake creation must stay deterministic and must not call the FastAPI service.",
        "When true and the service is unreachable, intake creation should fail explicitly rather than silently downgrade."
      ]
    },
    {
      name: "FASTAPI_SYNTHESIS_URL",
      defaultValue: "http://localhost:8000/api/v1/synthesis",
      required: false,
      scope: "integration_rehearsal",
      purpose: "Target URL for FastAPI synthesis rehearsal.",
      failureModes: ["Invalid URL or offline service returns a rehearsal failure response."]
    },
    {
      name: "ENABLE_MEDPLUM_SYNC",
      defaultValue: "false",
      required: false,
      scope: "integration_rehearsal",
      purpose: "Allows accepted frozen cases to push FHIR bundles to Medplum during rehearsal.",
      failureModes: [
        "When false, accepting a case must never trigger Medplum sync.",
        "When true, missing Medplum credentials should log a non-blocking failure only."
      ]
    },
    {
      name: "MEDPLUM_URL",
      defaultValue: "http://localhost:8103/fhir/R4",
      required: false,
      scope: "integration_rehearsal",
      purpose: "Medplum FHIR endpoint for rehearsal sync.",
      failureModes: ["Unreachable endpoint returns false from pushToMedplum without changing proof behavior."]
    },
    {
      name: "MEDPLUM_CLIENT_ID",
      defaultValue: "",
      required: false,
      scope: "integration_rehearsal",
      purpose: "Optional OAuth client id for Medplum rehearsal.",
      failureModes: ["Missing credentials fall back to unauthenticated local rehearsal attempts."]
    },
    {
      name: "MEDPLUM_CLIENT_SECRET",
      defaultValue: "",
      required: false,
      scope: "integration_rehearsal",
      purpose: "Optional OAuth client secret for Medplum rehearsal.",
      failureModes: ["Missing credentials fall back to unauthenticated local rehearsal attempts."]
    },
    {
      name: "DEEPGRAM_API_KEY",
      defaultValue: "",
      required: false,
      scope: "integration_rehearsal",
      purpose: "Enables live audio transcription when @deepgram/sdk is installed.",
      failureModes: [
        "Missing or placeholder key uses simulated transcript output.",
        "Missing optional SDK package uses simulated transcript output."
      ]
    },
    {
      name: "AKSH_STORAGE_ADAPTER",
      defaultValue: "json_file_repository",
      required: false,
      scope: "server",
      purpose: "Selects the active review-case repository adapter.",
      failureModes: ["Unknown adapter values throw before any repository read/write."]
    },
    {
      name: "NEXTAUTH_SECRET",
      defaultValue: "",
      required: true,
      scope: "server",
      purpose: "Session signing secret for authenticated proof routes.",
      failureModes: ["Missing secret breaks authenticated review and export routes."]
    },
    {
      name: "NEXTAUTH_URL",
      defaultValue: "http://localhost:3000",
      required: true,
      scope: "server",
      purpose: "Base URL for NextAuth callbacks.",
      failureModes: ["Misconfigured URL breaks sign-in redirects in local and deployed environments."]
    }
  ];
}

export function buildIntegrationEnvironmentContract(options?: { generatedAt?: string; generatedBy?: string }) {
  return {
    artifactType: "aksh-uk-eu-integration-environment-contract",
    generatedAt: options?.generatedAt ?? new Date().toISOString(),
    generatedBy: options?.generatedBy ?? "Aksh Health UK/EU synthetic proof system",
    syntheticOnly: true,
    defaultIntegrationMode: "synthetic_proof",
    rehearsalModeRequiresExplicitFlags: true,
    variables: getIntegrationEnvironmentVariables(),
    guardrails: [
      "External adapters remain disabled unless their explicit environment flag is true.",
      "Synthetic proof behavior must not silently change when an external service is offline.",
      "FHIR-shaped exports remain internal evidence artifacts even when Medplum rehearsal is enabled."
    ]
  };
}
