import { generateText } from "ai";

import { getMockPatientResponse } from "@/lib/neo4j/mock-fallback";
import { isNeo4jConfigured } from "@/lib/neo4j";
import { fetchPatientFromGraph } from "@/lib/neo4j/queries";
import type { Neo4jPatientResponse } from "@/lib/neo4j/types";

export const NEXUS_MODEL = "openai/gpt-5.4-mini";

const NEXUS_SYSTEM = `You are Aksh Health NEXUS — a clinical intelligence assistant for primary care and diabetes care coordination rehearsal.
Correlate a patient's conditions, medications, and risk signals and surface 2-3 clinically significant connections a GP should consider.
Rules:
- Draft only. Never instruct writing to EMIS/SystmOne or claim any correlation is filed.
- Only correlate data that is supplied. Never invent conditions, medications, results, or risk scores.
- Be conservative; flag uncertainty explicitly.
- Use UK clinical English.
- Output JSON only with keys: summary (string), correlations (array of {link, significance, suggestedConsideration}), safetyNotes (array of strings), confidence (0-1 number).`;

export function isLlmNexusConfigured() {
  if (process.env.ENABLE_LLM_NEXUS === "false") return false;
  if (process.env.ENABLE_LLM_SYNTHESIS === "false") return false;
  return Boolean(process.env.AI_GATEWAY_API_KEY) || process.env.VERCEL === "1";
}

export type NexusCorrelation = {
  link: string;
  significance: string;
  suggestedConsideration: string;
};

export type NexusDraft = {
  agent: "NEXUS";
  mode: "llm" | "deterministic";
  dataSource: "neo4j" | "mock";
  patientId: string;
  patientLabel: string;
  conditions: string[];
  medications: string[];
  riskScore: number;
  summary: string;
  correlations: NexusCorrelation[];
  safetyNotes: string[];
  confidence: number;
  fhirResource: "ClinicalImpression";
  status: "draft";
};

function parseJsonBrief(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Deterministic rule-based correlations so NEXUS is honest without an LLM key. */
function deterministicCorrelations(patient: Neo4jPatientResponse): NexusCorrelation[] {
  const conditions = patient.conditions.map((c) => c.toLowerCase());
  const medications = patient.medications.map((m) => m.toLowerCase());
  const correlations: NexusCorrelation[] = [];

  const has = (list: string[], needle: string) => list.some((v) => v.includes(needle));

  if (has(conditions, "diabetes") && has(medications, "metformin") && has(conditions, "ckd")) {
    correlations.push({
      link: "Type 2 diabetes on metformin with co-existing CKD",
      significance: "Renal function determines metformin safety and dosing (BNF renal impairment guidance).",
      suggestedConsideration: "Confirm recent eGFR before continuing current metformin dose."
    });
  }
  if (has(conditions, "heart failure") && has(medications, "furosemide")) {
    correlations.push({
      link: "Heart failure managed with loop diuretic",
      significance: "Diuretic response and U&E trends are the earliest decompensation signals.",
      suggestedConsideration: "Review weight trend and last U&E; assess escalation criteria."
    });
  }
  if (has(medications, "warfarin") && (has(medications, "ibuprofen") || has(medications, "aspirin"))) {
    correlations.push({
      link: "Anticoagulant co-prescribed with antiplatelet/NSAID",
      significance: "Additive bleeding risk (BNF interaction guidance).",
      suggestedConsideration: "Route to GUARDIAN interaction review before any new prescription."
    });
  }
  if (has(conditions, "dvt") && patient.oracleScore >= 75) {
    correlations.push({
      link: "Recent DVT with elevated composite risk score",
      significance: "Thrombosis history compounds 14-day admission risk.",
      suggestedConsideration: "Check anticoagulation plan and pending investigations before discharge of case."
    });
  }
  if (correlations.length === 0) {
    correlations.push({
      link: `${patient.conditions.length} active condition(s) × ${patient.medications.length} medication(s)`,
      significance: "No rule-based correlation triggered on the supplied data.",
      suggestedConsideration: "Review the record directly; deterministic NEXUS only covers seeded rule pairs."
    });
  }
  return correlations;
}

function deterministicFallback(patient: Neo4jPatientResponse, dataSource: "neo4j" | "mock", patientId: string): NexusDraft {
  const correlations = deterministicCorrelations(patient);
  return {
    agent: "NEXUS",
    mode: "deterministic",
    dataSource,
    patientId,
    patientLabel: patient.name || patientId,
    conditions: patient.conditions,
    medications: patient.medications,
    riskScore: patient.oracleScore,
    summary: `NEXUS surfaced ${correlations.length} correlation(s) for clinician review. ${correlations[0].link}.`,
    correlations,
    safetyNotes: [
      `Deterministic NEXUS fallback (LLM unavailable or disabled). Data source: ${dataSource}.`,
      "HITL Accept/Edit/Reject required — correlations are prompts for review, not diagnoses."
    ],
    confidence: 0.5,
    fhirResource: "ClinicalImpression",
    status: "draft"
  };
}

async function loadNexusContext(patientId: string): Promise<{
  patient: Neo4jPatientResponse;
  dataSource: "neo4j" | "mock";
} | null> {
  if (isNeo4jConfigured()) {
    try {
      const patient = await fetchPatientFromGraph(patientId);
      if (patient) {
        return { patient, dataSource: "neo4j" };
      }
    } catch {
      // Fall through to mock.
    }
  }

  const mock = getMockPatientResponse(patientId);
  if (!mock) return null;
  return { patient: mock, dataSource: "mock" };
}

export async function runNexusAgent(options: { patientId: string }): Promise<NexusDraft | null> {
  const patientId = options.patientId.trim();
  const context = await loadNexusContext(patientId);
  if (!context) return null;

  const { patient, dataSource } = context;

  if (!isLlmNexusConfigured()) {
    return deterministicFallback(patient, dataSource, patientId);
  }

  try {
    const result = await generateText({
      model: NEXUS_MODEL,
      system: NEXUS_SYSTEM,
      prompt: `Patient: ${patient.name} (${patientId})
Data source: ${dataSource}
HORIZON risk score: ${patient.oracleScore} (${patient.oracleRisk})
Conditions: ${patient.conditions.join("; ") || "none listed"}
Medications: ${patient.medications.join("; ") || "none listed"}
Risk factors / signals:
${patient.riskFactors.length > 0 ? patient.riskFactors.map((f) => `- ${f}`).join("\n") : "- none listed"}`,
      temperature: 0.2,
      maxOutputTokens: 700
    });

    const parsed = parseJsonBrief(result.text);
    const fallback = deterministicFallback(patient, dataSource, patientId);
    if (!parsed) {
      return fallback;
    }

    const correlations = Array.isArray(parsed.correlations)
      ? (parsed.correlations as Array<Record<string, unknown>>)
          .map((c) => ({
            link: String(c.link ?? "").trim(),
            significance: String(c.significance ?? "").trim(),
            suggestedConsideration: String(c.suggestedConsideration ?? "").trim()
          }))
          .filter((c) => c.link.length > 0)
      : [];

    return {
      ...fallback,
      mode: "llm",
      summary: String(parsed.summary ?? "").trim() || fallback.summary,
      correlations: correlations.length > 0 ? correlations : fallback.correlations,
      safetyNotes: Array.isArray(parsed.safetyNotes)
        ? (parsed.safetyNotes as unknown[]).map(String)
        : ["LLM NEXUS draft — clinician must Accept/Edit/Reject before staging."],
      confidence:
        typeof parsed.confidence === "number" && parsed.confidence >= 0 && parsed.confidence <= 1
          ? parsed.confidence
          : 0.7
    };
  } catch (error) {
    console.error("[nexus] LLM path failed; using deterministic fallback", error);
    return deterministicFallback(patient, dataSource, patientId);
  }
}
