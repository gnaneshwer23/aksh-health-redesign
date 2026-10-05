import type { ClinicalContextPackage } from "@/lib/context-engine/types";
import type { AgentEscalation } from "@/lib/agents/contracts/types";
import type { ContractedAgentResult } from "@/lib/agents/contracts/run-nexus";
import { isModelApprovedForUse } from "@/lib/model-registry";

const INJECTION_PATTERN =
  /ignore previous instructions|reveal another patient|disable (the )?medication safety|jailbreak/i;

export type GuardianGatewayInput = {
  context: ClinicalContextPackage;
  agentOutput?: Partial<ContractedAgentResult> | null;
  actorRole?: string;
  modelId?: string;
  environment?: "synthetic" | "production";
  userText?: string;
};

export type GuardianGatewayResult = {
  output_status: AgentEscalation;
  checks: Record<string, boolean>;
  reasons: string[];
  liveEmis: false;
  hitlRequired: true;
  independentOfAgentModel: true;
};

export function evaluateGuardianGateway(input: GuardianGatewayInput): GuardianGatewayResult {
  const reasons: string[] = [];
  const env = input.environment ?? "synthetic";
  const modelId = input.modelId ?? "aksh-nexus-synthetic-v1";

  const identityOk = Boolean(input.context.patient_context.patientId);
  const purposeOk = Boolean(input.context.purpose);
  const modelOk = isModelApprovedForUse(modelId, env);
  const groundingOk = (input.agentOutput?.evidence?.length ?? input.context.evidence.length) > 0;
  const missing = input.context.missing_information.length > 0;
  const injection = Boolean(input.userText && INJECTION_PATTERN.test(input.userText));
  const prohibited = (input.agentOutput?.prohibitedDetected?.length ?? 0) > 0;

  if (!identityOk) reasons.push("Patient identity missing");
  if (!purposeOk) reasons.push("Purpose missing");
  if (!modelOk) reasons.push("Model not approved for this environment");
  if (!groundingOk) reasons.push("No retrieved evidence");
  if (missing) reasons.push(`Missing information: ${input.context.missing_information.join(", ")}`);
  if (injection) reasons.push("Prompt/tool injection signal");
  if (prohibited) reasons.push("Prohibited action detected");

  let output_status: AgentEscalation = "PASS";
  if (!identityOk || !modelOk || injection || prohibited) output_status = "BLOCK";
  else if (missing || !groundingOk || input.agentOutput?.escalation === "REVIEW") output_status = "REVIEW";
  if (input.agentOutput?.escalation === "BLOCK") output_status = "BLOCK";

  return {
    output_status,
    checks: {
      identity: identityOk,
      purpose: purposeOk,
      model_approval: modelOk,
      evidence_grounding: groundingOk,
      missing_information: !missing,
      injection: !injection,
      prohibited_actions: !prohibited,
    },
    reasons,
    liveEmis: false,
    hitlRequired: true,
    independentOfAgentModel: true,
  };
}
