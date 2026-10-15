import { llmAgentEnabled } from "../ai/llm-gate";
import { generateText } from "ai";

import { getMockGuardianResponse, getMockPatientResponse } from "@/lib/neo4j/mock-fallback";
import { isNeo4jConfigured } from "@/lib/neo4j";
import { fetchGuardianFromGraph, fetchPatientFromGraph } from "@/lib/neo4j/queries";
import type { GuardianSeverity, Neo4jGuardianInteraction } from "@/lib/neo4j/types";
import { languageModel } from "../ai/model";

export const GUARDIAN_MODEL = "openai/gpt-5.4-mini";

const GUARDIAN_SYSTEM = `You are Aksh Health GUARDIAN — a medicines safety assistant for primary care and diabetes care coordination rehearsal.
Given known drug–drug interactions for a patient, produce a concise clinical safety brief.
Rules:
- Draft only. Never instruct writing to EMIS/SystmOne or claim the alert is filed.
- Be conservative; escalate uncertainty.
- Use clear clinical English; cite the supplied medicines reference when one is given.
- Output JSON only with keys: summary (string), clinicianActions (array of strings), safetyNotes (array of strings), confidence (0-1 number).`;

export function isLlmGuardianConfigured() {
  return llmAgentEnabled("GUARDIAN");
}

export type GuardianDraft = {
  mode: "llm" | "deterministic";
  dataSource: "neo4j" | "mock";
  patientId: string;
  patientLabel: string;
  proposedDrug: string | null;
  overallStatus: GuardianSeverity;
  interactions: Neo4jGuardianInteraction[];
  summary: string;
  clinicianActions: string[];
  safetyNotes: string[];
  confidence: number;
};

function parseJsonBrief(text: string): Partial<GuardianDraft> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as Partial<GuardianDraft>;
  } catch {
    return null;
  }
}

function severityRank(severity: GuardianSeverity) {
  if (severity === "red") return 3;
  if (severity === "amber") return 2;
  return 1;
}

function filterForProposedDrug(
  interactions: Neo4jGuardianInteraction[],
  proposedDrug: string | null
): Neo4jGuardianInteraction[] {
  if (!proposedDrug) return interactions;
  const needle = proposedDrug.toLowerCase();
  return interactions.filter(
    (ix) => ix.drugA.toLowerCase().includes(needle) || ix.drugB.toLowerCase().includes(needle)
  );
}

function deterministicFallback(input: {
  patientId: string;
  patientLabel: string;
  proposedDrug: string | null;
  dataSource: "neo4j" | "mock";
  overallStatus: GuardianSeverity;
  interactions: Neo4jGuardianInteraction[];
}): GuardianDraft {
  const interactions = input.interactions;
  const top = [...interactions].sort((a, b) => severityRank(b.severity) - severityRank(a.severity))[0];

  const summary =
    interactions.length === 0
      ? input.proposedDrug
        ? `No significant interactions found for proposed ${input.proposedDrug} against current medicines (deterministic GUARDIAN).`
        : "No significant drug–drug interactions flagged for current medicines (deterministic GUARDIAN)."
      : top
        ? `${interactions.length} interaction(s); highest ${top.severity.toUpperCase()}: ${top.drugA} + ${top.drugB}. ${top.recommendation}`
        : `${interactions.length} interaction(s) require clinician review.`;

  return {
    mode: "deterministic",
    dataSource: input.dataSource,
    patientId: input.patientId,
    patientLabel: input.patientLabel,
    proposedDrug: input.proposedDrug,
    overallStatus: input.overallStatus,
    interactions,
    summary,
    clinicianActions:
      interactions.length === 0
        ? ["Confirm medicines list is complete", "Document clinical rationale if starting a new medicine"]
        : [
            "Review formulary advice for each flagged pair",
            "Decide Accept / Edit / Reject before staging to the GP review queue",
            "Do not write back to the EHR from this rehearsal path"
          ],
    safetyNotes: [
      `Deterministic GUARDIAN fallback (LLM unavailable or disabled). Data source: ${input.dataSource}.`,
      "HITL Accept/Edit/Reject required before any staging or record impact."
    ],
    confidence: interactions.length === 0 ? 0.55 : 0.5
  };
}

async function loadGuardianContext(patientId: string): Promise<{
  patientLabel: string;
  dataSource: "neo4j" | "mock";
  overallStatus: GuardianSeverity;
  interactions: Neo4jGuardianInteraction[];
}> {
  if (isNeo4jConfigured()) {
    try {
      const [guardian, patient] = await Promise.all([
        fetchGuardianFromGraph(patientId),
        fetchPatientFromGraph(patientId)
      ]);
      if (guardian) {
        return {
          patientLabel: patient?.name ?? patientId,
          dataSource: "neo4j",
          overallStatus: guardian.overallStatus,
          interactions: guardian.interactions
        };
      }
    } catch {
      // Fall through to mock.
    }
  }

  const mock = getMockGuardianResponse(patientId);
  const mockPatient = getMockPatientResponse(patientId);
  if (!mock) {
    return {
      patientLabel: patientId,
      dataSource: "mock",
      overallStatus: "green",
      interactions: []
    };
  }

  return {
    patientLabel: mockPatient?.name ?? patientId,
    dataSource: "mock",
    overallStatus: mock.overallStatus,
    interactions: mock.interactions
  };
}

export async function runGuardianAgent(options: {
  patientId: string;
  proposedDrug?: string;
}): Promise<GuardianDraft> {
  const patientId = options.patientId.trim();
  const proposedDrug = options.proposedDrug?.trim() || null;
  const context = await loadGuardianContext(patientId);
  const interactions = filterForProposedDrug(context.interactions, proposedDrug);
  const overallStatus: GuardianSeverity =
    interactions.some((i) => i.severity === "red")
      ? "red"
      : interactions.some((i) => i.severity === "amber")
        ? "amber"
        : "green";

  const base: {
    patientId: string;
    patientLabel: string;
    proposedDrug: string | null;
    dataSource: "neo4j" | "mock";
    overallStatus: GuardianSeverity;
    interactions: Neo4jGuardianInteraction[];
  } = {
    patientId,
    patientLabel: context.patientLabel,
    proposedDrug,
    dataSource: context.dataSource,
    overallStatus,
    interactions
  };

  if (!isLlmGuardianConfigured()) {
    return deterministicFallback(base);
  }

  try {
    const interactionBlock =
      interactions.length === 0
        ? "None flagged."
        : interactions
            .map(
              (ix) =>
                `- ${ix.severity.toUpperCase()}: ${ix.drugA} + ${ix.drugB} (${ix.bnfRef}) — ${ix.recommendation}`
            )
            .join("\n");

    const result = await generateText({
      model: languageModel(GUARDIAN_MODEL),
      system: GUARDIAN_SYSTEM,
      prompt: `Patient: ${context.patientLabel} (${patientId})
Proposed drug: ${proposedDrug ?? "none (review current regimen)"}
Data source: ${context.dataSource}
Overall status: ${overallStatus}

Interactions:
${interactionBlock}`,
      temperature: 0.2,
      maxOutputTokens: 700
    });

    const parsed = parseJsonBrief(result.text);
    if (!parsed) {
      return deterministicFallback(base);
    }

    return {
      mode: "llm",
      dataSource: context.dataSource,
      patientId,
      patientLabel: context.patientLabel,
      proposedDrug,
      overallStatus,
      interactions,
      summary: String(parsed.summary ?? "").trim() || deterministicFallback(base).summary,
      clinicianActions: Array.isArray(parsed.clinicianActions)
        ? parsed.clinicianActions.map(String)
        : deterministicFallback(base).clinicianActions,
      safetyNotes: Array.isArray(parsed.safetyNotes)
        ? parsed.safetyNotes.map(String)
        : ["LLM GUARDIAN draft — clinician must Accept/Edit/Reject before staging."],
      confidence:
        typeof parsed.confidence === "number" && parsed.confidence >= 0 && parsed.confidence <= 1
          ? parsed.confidence
          : 0.7
    };
  } catch (error) {
    console.error("[guardian] LLM path failed; using deterministic fallback", error);
    return deterministicFallback(base);
  }
}
