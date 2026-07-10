import type { buildEvidencePayload } from "@/lib/workflow";

export type CaseEvidencePayload = ReturnType<typeof buildEvidencePayload>;
