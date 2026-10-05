import { assembleClinicalContext } from "@/lib/context-engine/assemble";
import { runContractedNexus } from "@/lib/agents/contracts/run-nexus";
import { evaluateGuardianGateway } from "@/lib/guardian-gateway";
import { isModelApprovedForUse, listRegisteredModels } from "@/lib/model-registry";
import { retrieveGraphRag } from "@/lib/graphrag/retrieve";

export type EvaluationLayerResult = {
  layer: "model" | "agent" | "workflow" | "system";
  passed: boolean;
  detail: string;
};

export type EvaluationRun = {
  artifactType: "aksh-evaluation-engine-v1";
  patientId: string;
  liveEmis: false;
  hitlRequired: true;
  layers: EvaluationLayerResult[];
  passed: boolean;
};

export async function runEvaluationEngineV1(patientId = "P002"): Promise<EvaluationRun> {
  const layers: EvaluationLayerResult[] = [];

  const models = listRegisteredModels();
  layers.push({
    layer: "model",
    passed: models.some((m) => isModelApprovedForUse(m.modelId, "synthetic")),
    detail: `${models.length} registered · synthetic approval required`,
  });

  const assembled = await assembleClinicalContext({
    patientId,
    purpose: "clinical_decision_support",
    actorRole: "clinical_reviewer",
  });
  if (!assembled.ok) {
    layers.push({ layer: "agent", passed: false, detail: assembled.reason });
  } else {
    const rag = await retrieveGraphRag({
      patientId,
      query: "HbA1c metformin renal diabetes",
      context: assembled.package,
    });
    const nexus = await runContractedNexus({ context: assembled.package });
    const gate = evaluateGuardianGateway({
      context: assembled.package,
      agentOutput: nexus,
      modelId: "aksh-nexus-synthetic-v1",
      environment: "synthetic",
    });
    layers.push({
      layer: "agent",
      passed: nexus.tools_used.includes("graph_retrieval") && nexus.evidence.length > 0 && rag.hits.length > 0,
      detail: `escalation=${nexus.escalation} evidence=${nexus.evidence.length} dataSource=${rag.dataSource}`,
    });
    layers.push({
      layer: "workflow",
      passed: gate.hitlRequired === true && assembled.package.liveEmis === false && gate.output_status === "REVIEW",
      detail: `guardian=${gate.output_status} hitlRequired=${gate.hitlRequired}`,
    });
    layers.push({
      layer: "system",
      passed:
        assembled.package.provenance.length > 0 &&
        assembled.package.missing_information.includes("ADHERENCE") &&
        !assembled.package.uncertainties.some((u) => /merged silently/i.test(u)),
      detail: `missing=${assembled.package.missing_information.join(",")} provenance=${assembled.package.provenance.length}`,
    });
  }

  return {
    artifactType: "aksh-evaluation-engine-v1",
    patientId,
    liveEmis: false,
    hitlRequired: true,
    layers,
    passed: layers.every((l) => l.passed),
  };
}
