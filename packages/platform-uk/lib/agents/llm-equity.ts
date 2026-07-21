import { generateText } from "ai";

import { isNeo4jConfigured } from "@/lib/neo4j";
import { getMockIcsPopulationResponse } from "@/lib/neo4j/mock-fallback";
import { fetchIcsPopulationFromGraph } from "@/lib/neo4j/queries";
import type { Neo4jIcsPopulationResponse } from "@/lib/neo4j/types";

export const EQUITY_MODEL = "openai/gpt-5.4-mini";

const EQUITY_SYSTEM = `You are Aksh Health COMPASS (population health, formerly EQUITY) — a population health disparity assistant for NHS ICS rehearsal.
Given aggregate equity flags (no patient-level identifiers), produce a concise action brief for ICS leads.
Rules:
- Aggregate / practice-level only. Do not invent named patients.
- Draft only. Never claim write-back to EMIS, SystmOne, or national systems.
- Be conservative; escalate uncertainty.
- Use UK public-health English.
- Output JSON only with keys: summary (string), priorities (array of strings), recommendedActions (array of strings), safetyNotes (array of strings), confidence (0-1 number).`;

export function isLlmEquityConfigured() {
  if (process.env.ENABLE_LLM_EQUITY === "false") return false;
  if (process.env.ENABLE_LLM_SYNTHESIS === "false") return false;
  return Boolean(process.env.AI_GATEWAY_API_KEY) || process.env.VERCEL === "1";
}

export type EquityDraft = {
  mode: "llm" | "deterministic";
  dataSource: "neo4j" | "mock";
  icsName: string;
  equityFlags: number;
  deepDive: Neo4jIcsPopulationResponse["equityDeepDive"];
  summary: string;
  priorities: string[];
  recommendedActions: string[];
  safetyNotes: string[];
  confidence: number;
};

function parseJsonBrief(text: string): Partial<EquityDraft> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as Partial<EquityDraft>;
  } catch {
    return null;
  }
}

function deterministicFallback(input: {
  dataSource: "neo4j" | "mock";
  population: Neo4jIcsPopulationResponse;
}): EquityDraft {
  const rows = input.population.equityDeepDive;
  const top = [...rows].sort((a, b) => b.flagCount - a.flagCount)[0];
  const priorities = rows.slice(0, 3).map((row) => `${row.category} (${row.flagCount} flags @ ${row.practice})`);
  const recommendedActions = rows.map((row) => `${row.recommendedAction} — ${row.practice} (${row.status})`);

  return {
    mode: "deterministic",
    dataSource: input.dataSource,
    icsName: input.population.icsName,
    equityFlags: input.population.equityFlags,
    deepDive: rows,
    summary: top
      ? `${input.population.equityFlags} COMPASS flags across ${input.population.practices} practices. Highest: ${top.category} at ${top.practice} (${top.flagCount}).`
      : `${input.population.equityFlags} COMPASS flags across the ICS (deterministic COMPASS).`,
    priorities:
      priorities.length > 0
        ? priorities
        : ["Review deprivation-linked prevalence gaps", "Confirm practice outreach capacity"],
    recommendedActions:
      recommendedActions.length > 0
        ? recommendedActions
        : ["Generate a board-facing equity action plan for ICS review"],
    safetyNotes: [
      `Deterministic COMPASS fallback (LLM unavailable or disabled). Data source: ${input.dataSource}.`,
      "Aggregate / synthetic population signals only — no patient-level spill.",
      "HITL Accept/Edit/Reject required before any operational staging. No EHR write."
    ],
    confidence: 0.55
  };
}

async function loadPopulation(): Promise<{
  population: Neo4jIcsPopulationResponse;
  dataSource: "neo4j" | "mock";
}> {
  if (isNeo4jConfigured()) {
    try {
      const population = await fetchIcsPopulationFromGraph();
      return { population, dataSource: "neo4j" };
    } catch {
      // Fall through to mock.
    }
  }

  return {
    population: getMockIcsPopulationResponse(),
    dataSource: "mock"
  };
}

export async function runEquityAgent(options?: {
  focusCategory?: string;
}): Promise<EquityDraft> {
  const { population, dataSource } = await loadPopulation();
  let scoped = population;
  const focus = options?.focusCategory?.trim();
  if (focus) {
    const needle = focus.toLowerCase();
    const filtered = population.equityDeepDive.filter((row) =>
      row.category.toLowerCase().includes(needle)
    );
    if (filtered.length > 0) {
      scoped = { ...population, equityDeepDive: filtered };
    }
  }

  const base = { dataSource, population: scoped };

  if (!isLlmEquityConfigured()) {
    return deterministicFallback(base);
  }

  try {
    const result = await generateText({
      model: EQUITY_MODEL,
      system: EQUITY_SYSTEM,
      prompt: `ICS: ${scoped.icsName}
Data source: ${dataSource}
Total equity flags: ${scoped.equityFlags}
Practices: ${scoped.practices}
Deep-dive rows (JSON):
${JSON.stringify(scoped.equityDeepDive, null, 2)}
Focus category hint: ${focus || "none"}`,
      temperature: 0.2,
      maxOutputTokens: 800
    });

    const parsed = parseJsonBrief(result.text);
    if (!parsed) {
      return deterministicFallback(base);
    }

    const fallback = deterministicFallback(base);
    return {
      mode: "llm",
      dataSource,
      icsName: scoped.icsName,
      equityFlags: scoped.equityFlags,
      deepDive: scoped.equityDeepDive,
      summary: String(parsed.summary ?? "").trim() || fallback.summary,
      priorities: Array.isArray(parsed.priorities) ? parsed.priorities.map(String) : fallback.priorities,
      recommendedActions: Array.isArray(parsed.recommendedActions)
        ? parsed.recommendedActions.map(String)
        : fallback.recommendedActions,
      safetyNotes: Array.isArray(parsed.safetyNotes)
        ? parsed.safetyNotes.map(String)
        : [
            "LLM COMPASS draft — ICS lead must Accept/Edit/Reject before staging.",
            "Aggregate signals only; no patient-level identifiers."
          ],
      confidence:
        typeof parsed.confidence === "number" && parsed.confidence >= 0 && parsed.confidence <= 1
          ? parsed.confidence
          : 0.7
    };
  } catch (error) {
    console.error("[equity] LLM path failed; using deterministic fallback", error);
    return deterministicFallback(base);
  }
}
