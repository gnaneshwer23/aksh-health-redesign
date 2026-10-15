import { llmAgentEnabled } from "../ai/llm-gate";
import { generateText } from "ai";

import { getMockPatientResponse } from "@/lib/neo4j/mock-fallback";
import { isNeo4jConfigured } from "@/lib/neo4j";
import { fetchPatientFromGraph } from "@/lib/neo4j/queries";
import type { Neo4jPatientResponse } from "@/lib/neo4j/types";
import { languageModel } from "../ai/model";

export const DR_ASSIST_MODEL = "openai/gpt-5.4-mini";

const DR_ASSIST_SYSTEM = `You are Aksh Health Dr.Assist — a clinical coding assistant for primary care and diabetes care coordination rehearsal.
Given known conditions, medications, and risk context, suggest SNOMED CT codes (primary, as used in UK primary care records) and WHO ICD-10 codes (secondary) for clinician review.
Rules:
- Draft only. Never instruct writing to EMIS/SystmOne or claim codes are filed.
- Be conservative; escalate uncertainty.
- Use clear, plain clinical English.
- Do not invent conditions that are not supplied.
- Output JSON only with keys: summary (string), codes (array of {system, code, display, confidence}), clinicianActions (array of strings), safetyNotes (array of strings), confidence (0-1 number).
- system must be "SNOMED CT" or "ICD-10".
- ICD-10 means the WHO edition used in the UK (e.g. I80.2, E11.9). Never use US ICD-10-CM codes (e.g. I82.4x, E11.65).`;

export function isLlmDrAssistConfigured() {
  return llmAgentEnabled("DR_ASSIST");
}

export type DrAssistCodeSuggestion = {
  system: "SNOMED CT" | "ICD-10";
  code: string;
  display: string;
  confidence: number;
};

export type DrAssistDraft = {
  mode: "llm" | "deterministic";
  dataSource: "neo4j" | "mock";
  patientId: string;
  patientLabel: string;
  conditions: string[];
  medications: string[];
  summary: string;
  codes: DrAssistCodeSuggestion[];
  clinicianActions: string[];
  safetyNotes: string[];
  confidence: number;
};

function parseJsonBrief(text: string): Partial<DrAssistDraft> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as Partial<DrAssistDraft>;
  } catch {
    return null;
  }
}

function normaliseCodes(raw: unknown): DrAssistCodeSuggestion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const systemRaw = String(row.system ?? "").toLowerCase();
      const system: DrAssistCodeSuggestion["system"] =
        systemRaw.includes("snomed") ? "SNOMED CT" : "ICD-10";
      const code = String(row.code ?? "").trim();
      const display = String(row.display ?? "").trim();
      const confidence =
        typeof row.confidence === "number" && row.confidence >= 0 && row.confidence <= 1
          ? row.confidence
          : 0.6;
      if (!code || !display) return null;
      return { system, code, display, confidence };
    })
    .filter((c): c is DrAssistCodeSuggestion => Boolean(c));
}

/** Deterministic SNOMED / ICD-10 suggestions from free-text conditions (rehearsal lexicon). */
export function suggestCodesFromConditions(conditions: string[]): DrAssistCodeSuggestion[] {
  const codes: DrAssistCodeSuggestion[] = [];
  const seen = new Set<string>();

  const push = (suggestion: DrAssistCodeSuggestion) => {
    const key = `${suggestion.system}:${suggestion.code}`;
    if (seen.has(key)) return;
    seen.add(key);
    codes.push(suggestion);
  };

  for (const condition of conditions) {
    const lower = condition.toLowerCase();

    if (lower.includes("dvt") || lower.includes("deep vein") || lower.includes("thrombosis")) {
      push({
        system: "SNOMED CT",
        code: "128053003",
        display: "Deep venous thrombosis",
        confidence: 0.88
      });
      push({
        system: "ICD-10",
        code: "I80.2",
        display: "Phlebitis and thrombophlebitis of other deep vessels of lower extremities",
        confidence: 0.86
      });
    }

    if (lower.includes("type 2") || lower.includes("t2d") || lower.includes("diabetes")) {
      push({
        system: "SNOMED CT",
        code: "44054006",
        display: "Type 2 diabetes mellitus",
        confidence: 0.9
      });
      push({
        system: "ICD-10",
        code: "E11.9",
        display: "Type 2 diabetes mellitus without complications",
        confidence: 0.85
      });
    }

    if (lower.includes("hypertension") || lower.includes("high blood pressure")) {
      push({
        system: "SNOMED CT",
        code: "38341003",
        display: "Hypertensive disorder",
        confidence: 0.88
      });
      push({
        system: "ICD-10",
        code: "I10",
        display: "Essential (primary) hypertension",
        confidence: 0.87
      });
    }

    if (lower.includes("ckd") || lower.includes("chronic kidney") || lower.includes("renal")) {
      push({
        system: "SNOMED CT",
        code: "709044004",
        display: "Chronic kidney disease",
        confidence: 0.84
      });
      push({
        system: "ICD-10",
        code: "N18.9",
        display: "Chronic kidney disease, unspecified",
        confidence: 0.8
      });
    }

    if (lower.includes("af") || lower.includes("atrial fibrillation")) {
      push({
        system: "SNOMED CT",
        code: "49436004",
        display: "Atrial fibrillation",
        confidence: 0.89
      });
      push({
        system: "ICD-10",
        code: "I48.9",
        display: "Atrial fibrillation and flutter, unspecified",
        confidence: 0.86
      });
    }

    if (lower.includes("asthma")) {
      push({
        system: "SNOMED CT",
        code: "195967001",
        display: "Asthma",
        confidence: 0.9
      });
      push({
        system: "ICD-10",
        code: "J45.9",
        display: "Asthma, unspecified",
        confidence: 0.88
      });
    }

    if (lower.includes("copd") || lower.includes("chronic obstructive")) {
      push({
        system: "SNOMED CT",
        code: "13645005",
        display: "Chronic obstructive lung disease",
        confidence: 0.88
      });
      push({
        system: "ICD-10",
        code: "J44.9",
        display: "Chronic obstructive pulmonary disease, unspecified",
        confidence: 0.86
      });
    }

    if (lower.includes("heart failure") || lower.includes("hfref") || lower.includes("hfpef")) {
      push({
        system: "SNOMED CT",
        code: "84114007",
        display: "Heart failure",
        confidence: 0.87
      });
      push({
        system: "ICD-10",
        code: "I50.9",
        display: "Heart failure, unspecified",
        confidence: 0.84
      });
    }
  }

  if (codes.length === 0 && conditions.length > 0) {
    push({
      system: "SNOMED CT",
      code: "404684003",
      display: `Clinical finding — review: ${conditions[0]}`,
      confidence: 0.45
    });
  }

  return codes;
}

function deterministicFallback(input: {
  patientId: string;
  patientLabel: string;
  dataSource: "neo4j" | "mock";
  conditions: string[];
  medications: string[];
}): DrAssistDraft {
  const codes = suggestCodesFromConditions(input.conditions);
  return {
    mode: "deterministic",
    dataSource: input.dataSource,
    patientId: input.patientId,
    patientLabel: input.patientLabel,
    conditions: input.conditions,
    medications: input.medications,
    summary:
      codes.length > 0
        ? `Dr.Assist suggests ${codes.length} code(s) from known conditions for clinician coding review.`
        : "No confident coding suggestions from current conditions — clinician should code from the record.",
    codes,
    clinicianActions: [
      "Confirm each code against the clinical record",
      "Decide Accept / Edit / Reject before staging to the GP review queue",
      "Do not write back to the EHR from this rehearsal path"
    ],
    safetyNotes: [
      `Deterministic Dr.Assist fallback (LLM unavailable or disabled). Data source: ${input.dataSource}.`,
      "HITL Accept/Edit/Reject required before any staging or record impact.",
      "Codes are rehearsal suggestions only — not a certified terminology service."
    ],
    confidence: codes.length > 0 ? 0.55 : 0.35
  };
}

async function loadDrAssistContext(patientId: string): Promise<{
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

export async function runDrAssistAgent(options: {
  patientId: string;
  conditionHint?: string;
}): Promise<DrAssistDraft | null> {
  const patientId = options.patientId.trim();
  const context = await loadDrAssistContext(patientId);
  if (!context) return null;

  const { patient, dataSource } = context;
  const conditions =
    options.conditionHint?.trim()
      ? [...new Set([options.conditionHint.trim(), ...patient.conditions])]
      : patient.conditions;

  const base = {
    patientId,
    patientLabel: patient.name || patientId,
    dataSource,
    conditions,
    medications: patient.medications
  };

  if (!isLlmDrAssistConfigured()) {
    return deterministicFallback(base);
  }

  try {
    const result = await generateText({
      model: languageModel(DR_ASSIST_MODEL),
      system: DR_ASSIST_SYSTEM,
      prompt: `Patient: ${patient.name} (${patientId})
Data source: ${dataSource}
Conditions: ${conditions.join("; ") || "none listed"}
Medications: ${patient.medications.join("; ") || "none listed"}
Risk band: ${patient.oracleRisk} (score ${patient.oracleScore})
Risk factors:
${patient.riskFactors.length > 0 ? patient.riskFactors.map((f) => `- ${f}`).join("\n") : "- none listed"}`,
      temperature: 0.2,
      maxOutputTokens: 800
    });

    const parsed = parseJsonBrief(result.text);
    if (!parsed) {
      return deterministicFallback(base);
    }

    const fallback = deterministicFallback(base);
    const codes = normaliseCodes(parsed.codes);
    return {
      mode: "llm",
      dataSource,
      patientId,
      patientLabel: patient.name || patientId,
      conditions,
      medications: patient.medications,
      summary: String(parsed.summary ?? "").trim() || fallback.summary,
      codes: codes.length > 0 ? codes : fallback.codes,
      clinicianActions: Array.isArray(parsed.clinicianActions)
        ? parsed.clinicianActions.map(String)
        : fallback.clinicianActions,
      safetyNotes: Array.isArray(parsed.safetyNotes)
        ? parsed.safetyNotes.map(String)
        : ["LLM Dr.Assist draft — clinician must Accept/Edit/Reject before staging."],
      confidence:
        typeof parsed.confidence === "number" && parsed.confidence >= 0 && parsed.confidence <= 1
          ? parsed.confidence
          : 0.7
    };
  } catch (error) {
    console.error("[dr-assist] LLM path failed; using deterministic fallback", error);
    return deterministicFallback(base);
  }
}
