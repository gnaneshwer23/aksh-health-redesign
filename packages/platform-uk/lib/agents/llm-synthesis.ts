import { generateText } from "ai";

import { buildInputSummary, extractPatientLabel } from "@/lib/intake-generation";

export const SYNTHESIS_MODEL = "openai/gpt-5.4-mini";

const SYNTHESIS_SYSTEM = `You are Aksh Health SYNTHESIS — a clinical documentation assistant for NHS primary care rehearsal.
Produce a structured SOAP-style draft from the clinician transcript.
Rules:
- Draft only. Never instruct writing to EMIS/SystmOne or claim the note is filed.
- Be conservative; flag uncertainty.
- Use UK clinical English.
- Output JSON only with keys: subjective, objective, assessment, plan, safetyNotes (array of strings), confidence (0-1 number).`;

export function isLlmSynthesisConfigured() {
  if (process.env.ENABLE_LLM_SYNTHESIS === "false") return false;
  return Boolean(process.env.AI_GATEWAY_API_KEY) || process.env.VERCEL === "1";
}

export type SynthesisDraft = {
  mode: "llm" | "deterministic";
  patientLabel: string;
  inputSummary: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  safetyNotes: string[];
  confidence: number;
  rawText: string;
};

function parseJsonDraft(text: string): Partial<SynthesisDraft> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as Partial<SynthesisDraft>;
  } catch {
    return null;
  }
}

function deterministicFallback(transcript: string, patientLabel: string): SynthesisDraft {
  const summary = buildInputSummary(transcript);
  return {
    mode: "deterministic",
    patientLabel: extractPatientLabel(patientLabel),
    inputSummary: summary,
    subjective: summary,
    objective: "Structured observations pending clinician confirmation.",
    assessment: "Working impression from transcript heuristics — requires clinician review.",
    plan: "Confirm findings, safety-net, and decide record write-back only after Accept.",
    safetyNotes: [
      "Deterministic SYNTHESIS fallback (LLM unavailable or disabled).",
      "HITL Accept/Edit/Reject required before any record staging."
    ],
    confidence: 0.45,
    rawText: transcript
  };
}

export async function runSynthesisAgent(options: {
  transcript: string;
  patientLabel?: string;
}): Promise<SynthesisDraft> {
  const patientLabel = extractPatientLabel(options.patientLabel ?? "");
  const transcript = options.transcript.trim();
  if (!transcript) {
    return deterministicFallback("No transcript provided.", patientLabel);
  }

  if (!isLlmSynthesisConfigured()) {
    return deterministicFallback(transcript, patientLabel);
  }

  try {
    const result = await generateText({
      model: SYNTHESIS_MODEL,
      system: SYNTHESIS_SYSTEM,
      prompt: `Patient label: ${patientLabel}\n\nTranscript:\n${transcript}`,
      temperature: 0.2,
      maxOutputTokens: 900
    });

    const parsed = parseJsonDraft(result.text);
    if (!parsed) {
      return deterministicFallback(transcript, patientLabel);
    }

    return {
      mode: "llm",
      patientLabel,
      inputSummary: buildInputSummary(transcript),
      subjective: String(parsed.subjective ?? "").trim() || buildInputSummary(transcript),
      objective: String(parsed.objective ?? "").trim() || "See transcript.",
      assessment: String(parsed.assessment ?? "").trim() || "Assessment pending clinician confirmation.",
      plan: String(parsed.plan ?? "").trim() || "Plan pending clinician confirmation.",
      safetyNotes: Array.isArray(parsed.safetyNotes)
        ? parsed.safetyNotes.map(String)
        : ["LLM draft — clinician must Accept/Edit/Reject before staging."],
      confidence:
        typeof parsed.confidence === "number" && parsed.confidence >= 0 && parsed.confidence <= 1
          ? parsed.confidence
          : 0.7,
      rawText: transcript
    };
  } catch (error) {
    console.error("[synthesis] LLM path failed; using deterministic fallback", error);
    return deterministicFallback(transcript, patientLabel);
  }
}
