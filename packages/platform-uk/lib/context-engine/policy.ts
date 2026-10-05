import { createHash } from "crypto";

import { evaluatePatientChatAccess } from "@/lib/chat/patient-access";
import type { AppRole } from "@/lib/permission-matrix";

import type { ContextAssemblyInput, ContextPurpose } from "./types";

const PURPOSE_MIN_FIELDS: Record<ContextPurpose, string[]> = {
  clinical_decision_support: ["conditions", "medications", "allergies", "laboratory_results", "risk_factors"],
  documentation: ["conditions", "medications", "observations"],
  medication_safety: ["medications", "allergies", "conditions"],
  patient_self: ["conditions", "medications"],
};

export function authorizeContextAssembly(input: ContextAssemblyInput): {
  allowed: boolean;
  reason: string;
  status: 200 | 401 | 403;
} {
  const role = (input.actorRole ?? "clinical_reviewer") as AppRole;
  if (input.purpose === "patient_self") {
    return evaluatePatientChatAccess({
      appRole: role,
      boundPatientId: input.boundPatientId,
      requestedPatientId: input.patientId,
      audience: "patient",
    });
  }
  return evaluatePatientChatAccess({
    appRole: role === "patient" ? "patient" : role,
    boundPatientId: input.boundPatientId,
    requestedPatientId: input.patientId,
    audience: role === "patient" ? "patient" : "clinician",
  });
}

export function requiredFieldsForPurpose(purpose: ContextPurpose): string[] {
  return PURPOSE_MIN_FIELDS[purpose];
}

export function stableContextHash(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 24);
}
