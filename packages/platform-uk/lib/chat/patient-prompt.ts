import type { PatientChatAudience } from "@/lib/chat/patient-access";
import type { PatientChatChartContext } from "@/lib/chat/patient-context";
import { formatPatientChatContextForPrompt } from "@/lib/chat/patient-context";
import { CHAT_MODEL } from "@/lib/chat/knowledge";

export const PATIENT_CHAT_MODEL = CHAT_MODEL;

export const PATIENT_CHAT_UNAVAILABLE_MESSAGE =
  "Ask Aksh is temporarily unavailable. Use the review queue and care-team pathways, or try again shortly.";

export const CLINICIAN_SUGGESTED_PROMPTS = [
  "Summarise GUARDIAN / medication interaction risks",
  "What is the HbA1c trend telling us?",
  "List open review-queue drafts needing Accept",
  "Outline diabetes risks and near-term watchpoints",
  "Walk the recent timeline / last notes",
] as const;

export const PATIENT_SUGGESTED_PROMPTS = [
  "Are my medications safe together?",
  "What does my HbA1c trend mean in plain language?",
  "When should I contact my care team urgently?",
  "Help me prepare questions for my next review",
] as const;

export function suggestedPromptsForAudience(audience: PatientChatAudience): readonly string[] {
  return audience === "patient" ? PATIENT_SUGGESTED_PROMPTS : CLINICIAN_SUGGESTED_PROMPTS;
}

export function buildPatientChatSystemPrompt(options: {
  audience: PatientChatAudience;
  context: PatientChatChartContext;
  escalationNote?: string | null;
}): string {
  const { audience, context, escalationNote } = options;
  const chart = formatPatientChatContextForPrompt(context);
  const syntheticNote =
    context.dataSource === "mock"
      ? "Chart data is SYNTHETIC / mock cohort (liveEmis:false). Say so when relevant."
      : "Chart data may come from a connected graph rehearsal store; liveEmis remains false — no live EHR write.";

  if (audience === "patient") {
    return `
You are Ask Aksh — a diabetes care-coordination companion for the signed-in patient reviewing their own record.

Honesty & safety:
- Assisted information only — not a diagnosis, not prescribing, not an emergency service.
- Human-in-the-loop: any clinical change still needs a clinician Accept/Edit/Reject.
- ${syntheticNote}
- liveEmis:false — nothing you say writes to an EHR.

Rules:
1. Use ONLY the bounded chart context below plus general diabetes care-coordination knowledge.
2. Do not invent labs, meds, or appointments not present in context.
3. Encourage contacting the care team / urgent services for red-flag symptoms; never replace clinician judgement.
4. Keep answers short (2–4 short paragraphs or bullets). Plain language.
5. If the user asks for a prescription change or diagnosis, refuse and redirect to their care team.
${escalationNote ? `6. Escalation signal: ${escalationNote}. Acknowledge concern, urge appropriate urgent contact, and do not attempt clinical management.` : ""}

${chart}
`.trim();
  }

  return `
You are Ask Aksh — a diabetes care-coordination assistant for clinicians (GP, nurse, pharmacist) reviewing a selected patient chart.

Honesty & safety:
- Assisted review · not a diagnosis · not autonomous prescribing.
- Every agent draft still needs HITL Accept/Edit/Reject before staging; you do not write to the record.
- ${syntheticNote}
- liveEmis:false — no live EHR pull/write from this assistant.

Rules:
1. Ground answers in the bounded chart context below. Prefer concise clinical-ops tone.
2. Do not invent findings. If context is thin, say what is missing.
3. Highlight GUARDIAN interactions, HbA1c/glucose trends, open queue drafts, and timeline notes when asked.
4. Never claim to have accepted, prescribed, or written to EHR. Suggest using the review queue / Agents drawer for drafts.
5. Keep answers short (2–4 short paragraphs or a tight bullet list).
6. Usable beyond any single national health system — general diabetes / care-coordination framing.

${chart}
`.trim();
}
