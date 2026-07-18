import { generateText } from "ai";

import { getMockPatientResponse } from "@/lib/neo4j/mock-fallback";
import { isNeo4jConfigured } from "@/lib/neo4j";
import { fetchPatientFromGraph } from "@/lib/neo4j/queries";
import type { Neo4jPatientResponse } from "@/lib/neo4j/types";
import type { OracleRisk } from "@/lib/mock-data/types";

export const ORACLE_MODEL = "openai/gpt-5.4-mini";

const ORACLE_SYSTEM = `You are Aksh Health ORACLE — a CVD / long-term condition risk stratification assistant for NHS primary care rehearsal.
Given a patient's known risk score, conditions, medications, and contributing factors, produce a concise risk narrative for clinician review.
Rules:
- Draft only. Never instruct writing to EMIS/SystmOne or claim the score is filed.
- Be conservative; escalate uncertainty.
- Use UK clinical English.
- Do not invent scores, conditions, or medications that are not supplied.
- Output JSON only with keys: summary (string), contributingFactors (array of strings), clinicianActions (array of strings), safetyNotes (array of strings), confidence (0-1 number).`;

export function isLlmOracleConfigured() {
  if (process.env.ENABLE_LLM_ORACLE === "false") return false;
  if (process.env.ENABLE_LLM_SYNTHESIS === "false") return false;
  return Boolean(process.env.AI_GATEWAY_API_KEY) || process.env.VERCEL === "1";
}

export type OracleDraft = {
  mode: "llm" | "deterministic";
  dataSource: "neo4j" | "mock";
  patientId: string;
  patientLabel: string;
  oracleScore: number;
  oracleRisk: OracleRisk;
  conditions: string[];
  medications: string[];
  riskFactors: string[];
  admissionRisk14Days: number;
  summary: string;
  contributingFactors: string[];
  clinicianActions: string[];
  safetyNotes: string[];
  confidence: number;
};

function parseJsonBrief(text: string): Partial<OracleDraft> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as Partial<OracleDraft>;
  } catch {
    return null;
  }
}

function deterministicFallback(input: {
  patientId: string;
  patientLabel: string;
  dataSource: "neo4j" | "mock";
  oracleScore: number;
  oracleRisk: OracleRisk;
  conditions: string[];
  medications: string[];
  riskFactors: string[];
  admissionRisk14Days: number;
}): OracleDraft {
  const factors =
    input.riskFactors.length > 0
      ? input.riskFactors
      : [
          ...(input.conditions.length > 0
            ? [`Active conditions: ${input.conditions.slice(0, 3).join(", ")}`]
            : []),
          ...(input.medications.length > 0
            ? [`Current medicines: ${input.medications.slice(0, 3).join(", ")}`]
            : []),
          `14-day admission risk estimate: ${input.admissionRisk14Days}%`
        ];

  return {
    mode: "deterministic",
    dataSource: input.dataSource,
    patientId: input.patientId,
    patientLabel: input.patientLabel,
    oracleScore: input.oracleScore,
    oracleRisk: input.oracleRisk,
    conditions: input.conditions,
    medications: input.medications,
    riskFactors: input.riskFactors,
    admissionRisk14Days: input.admissionRisk14Days,
    summary: `ORACLE risk ${input.oracleScore} (${input.oracleRisk}). ${factors[0] ?? "Review full record for contributing factors."}`,
    contributingFactors: factors,
    clinicianActions: [
      "Review contributing factors against the clinical record",
      "Decide Accept / Edit / Reject before staging to the GP review queue",
      "Do not write back to the EHR from this rehearsal path"
    ],
    safetyNotes: [
      `Deterministic ORACLE fallback (LLM unavailable or disabled). Data source: ${input.dataSource}.`,
      "HITL Accept/Edit/Reject required before any staging or record impact."
    ],
    confidence: 0.5
  };
}

async function loadOracleContext(patientId: string): Promise<{
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

export async function runOracleAgent(options: { patientId: string }): Promise<OracleDraft | null> {
  const patientId = options.patientId.trim();
  const context = await loadOracleContext(patientId);
  if (!context) return null;

  const { patient, dataSource } = context;
  const base = {
    patientId,
    patientLabel: patient.name || patientId,
    dataSource,
    oracleScore: patient.oracleScore,
    oracleRisk: patient.oracleRisk,
    conditions: patient.conditions,
    medications: patient.medications,
    riskFactors: patient.riskFactors,
    admissionRisk14Days: patient.admissionRisk14Days
  };

  if (!isLlmOracleConfigured()) {
    return deterministicFallback(base);
  }

  try {
    const result = await generateText({
      model: ORACLE_MODEL,
      system: ORACLE_SYSTEM,
      prompt: `Patient: ${patient.name} (${patientId})
Data source: ${dataSource}
ORACLE score: ${patient.oracleScore}
ORACLE risk band: ${patient.oracleRisk}
14-day admission risk %: ${patient.admissionRisk14Days}
Conditions: ${patient.conditions.join("; ") || "none listed"}
Medications: ${patient.medications.join("; ") || "none listed"}
Risk factors / signals:
${patient.riskFactors.length > 0 ? patient.riskFactors.map((f) => `- ${f}`).join("\n") : "- none listed"}`,
      temperature: 0.2,
      maxOutputTokens: 700
    });

    const parsed = parseJsonBrief(result.text);
    if (!parsed) {
      return deterministicFallback(base);
    }

    const fallback = deterministicFallback(base);
    return {
      mode: "llm",
      dataSource,
      patientId,
      patientLabel: patient.name || patientId,
      oracleScore: patient.oracleScore,
      oracleRisk: patient.oracleRisk,
      conditions: patient.conditions,
      medications: patient.medications,
      riskFactors: patient.riskFactors,
      admissionRisk14Days: patient.admissionRisk14Days,
      summary: String(parsed.summary ?? "").trim() || fallback.summary,
      contributingFactors: Array.isArray(parsed.contributingFactors)
        ? parsed.contributingFactors.map(String)
        : fallback.contributingFactors,
      clinicianActions: Array.isArray(parsed.clinicianActions)
        ? parsed.clinicianActions.map(String)
        : fallback.clinicianActions,
      safetyNotes: Array.isArray(parsed.safetyNotes)
        ? parsed.safetyNotes.map(String)
        : ["LLM ORACLE draft — clinician must Accept/Edit/Reject before staging."],
      confidence:
        typeof parsed.confidence === "number" && parsed.confidence >= 0 && parsed.confidence <= 1
          ? parsed.confidence
          : 0.7
    };
  } catch (error) {
    console.error("[oracle] LLM path failed; using deterministic fallback", error);
    return deterministicFallback(base);
  }
}
