import type { buildEvidenceReadinessPayload } from "./readiness-evidence";

export type EvidenceReadinessSnapshot = ReturnType<typeof buildEvidenceReadinessPayload> & {
  id: string;
  userId: string;
  savedAt: string;
};

export type EvidenceReadinessHistoryState = {
  userId: string;
  archive: EvidenceReadinessSnapshot[];
};
