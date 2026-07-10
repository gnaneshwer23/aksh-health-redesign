/**
 * Practo EHR adapter — Phase 0 interface stub only.
 * No live API keys; sandbox partnership required for Phase 1 (E11).
 */

export type PractoSandboxConfig = {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  sandboxMode: boolean;
};

export type PractoPatientSearchResult = {
  practoPatientId: string;
  displayName: string;
  abhaId?: string;
};

export type PractoWriteBackResult = {
  ok: boolean;
  documentReferenceId?: string;
  error?: string;
};

export interface PractoAdapter {
  searchPatient(query: string): Promise<PractoPatientSearchResult[]>;
  writeFhirDocumentReference(
    practoPatientId: string,
    bundleJson: unknown
  ): Promise<PractoWriteBackResult>;
}

export function loadPractoConfigFromEnv(): PractoSandboxConfig {
  return {
    baseUrl: process.env.PRACTO_SANDBOX_BASE_URL ?? "https://sandbox-api.practo.example/v1",
    clientId: process.env.PRACTO_SANDBOX_CLIENT_ID ?? "REPLACE_ME",
    clientSecret: process.env.PRACTO_SANDBOX_CLIENT_SECRET ?? "REPLACE_ME",
    sandboxMode: process.env.PRACTO_SANDBOX_MODE !== "false"
  };
}

/** Stub — returns empty until Practo sandbox credentials are provisioned. */
export function createPractoAdapter(_config: PractoSandboxConfig): PractoAdapter {
  return {
    async searchPatient(_query: string) {
      return [];
    },
    async writeFhirDocumentReference(_practoPatientId: string, _bundleJson: unknown) {
      return {
        ok: false,
        error: "Practo sandbox not configured — Phase 0 stub only"
      };
    }
  };
}

export function getPractoAdapter(): PractoAdapter {
  return createPractoAdapter(loadPractoConfigFromEnv());
}
