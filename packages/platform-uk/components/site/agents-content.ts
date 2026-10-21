/**
 * Public copy for the AI agents (founder decision 21 Oct 2026: the site names the agents by product name, with their
 * roles and how the clinician stays in charge). Status, review items, gates and model permissions come from the agent
 * register (lib/agents/register.ts); this file only adds plain-language wording. Internal code ids never appear here.
 */
import { agent, AGENTS, type AgentId } from "@/lib/agents/register";
import { RULES } from "@/lib/rules/registry";
import { STATUS_LABEL, type CapabilityStatus } from "@/lib/status/capabilities";

export type AgentStage = "capture" | "draft" | "decide" | "coordinate" | "govern" | "next";

export type PublicAgent = {
  id: AgentId;
  name: string;
  /** One line: what it does for the care team. */
  role: string;
  /** What it hands to people, and who decides. */
  handsOver: string;
  stage: AgentStage;
  /** Short label used inside the figure. */
  short: string;
  status: CapabilityStatus;
  statusLabel: string;
  /** May call a language model on synthetic data in validation (never on patient data in production). */
  usesModel: boolean;
};

const COPY: Record<AgentId, { role: string; handsOver: string; stage: AgentStage; short: string }> = {
  CONDUCTOR: { role: "Runs every agent in a fixed, inspectable order against one view of the patient, and decides what the clinician sees first.", handsOver: "A review list in safety-first order. It decides nothing clinical itself.", stage: "govern", short: "Orchestrator" },
  VOICE: { role: "Turns a dictated consultation into a transcript with a confidence score.", handsOver: "The transcript, which the clinician checks before anything relies on it.", stage: "capture", short: "Voice" },
  CANVAS: { role: "Structures the consultation into draft records, tracing every value back to the words it came from.", handsOver: "Structured drafts with their source, for the clinician to verify.", stage: "capture", short: "Canvas" },
  SYNTHESIS: { role: "Drafts the consultation note in a structured format.", handsOver: "A note draft the clinician accepts, edits or rejects.", stage: "draft", short: "Synthesis" },
  DrASSIST: { role: "Suggests diagnosis and procedure codes with a confidence for each.", handsOver: "Code suggestions the clinician confirms; none are final until accepted.", stage: "draft", short: "DrAssist" },
  GUARDIAN: { role: "Checks medicines for interactions, allergies and low-glucose risk, and is the only agent that can mark a case urgent on safety grounds.", handsOver: "A safety alert; medication decisions need the prescriber.", stage: "draft", short: "Guardian" },
  HORIZON: { role: "Gives one risk picture with the factors behind it, including glucose, HbA1c and laboratory results.", handsOver: "A risk brief with its reasons, for clinician review.", stage: "draft", short: "Horizon" },
  NEXUS: { role: "Points out two or three connections across results and medicines worth considering.", handsOver: "Correlations as input to the clinician's own assessment; it cannot trigger an action.", stage: "draft", short: "Nexus" },
  PATHWAY: { role: "Prepares a referral package once the clinician has accepted the assessment, citing the result and rule that indicated it.", handsOver: "A referral draft the responsible clinician confirms before anything is sent.", stage: "coordinate", short: "Pathway" },
  BRIDGE: { role: "Packages accepted work in the FHIR R4 standard so it can reach the records system.", handsOver: "A staged package; nothing is written to a live record.", stage: "coordinate", short: "Bridge" },
  SHIELD: { role: "Keeps an append-only, tamper-evident record of every agent run and every decision, with who and when.", handsOver: "The audit trail your clinical safety officer reviews.", stage: "govern", short: "Shield" },
  COMPASS: { role: "Summarises outcomes across the organisation for population leads, without naming any patient.", handsOver: "Aggregate briefs; small counts are suppressed.", stage: "govern", short: "Compass" },
  PRISM: { role: "Imaging intelligence.", handsOver: "Not built.", stage: "next", short: "Prism" },
  ATLAS: { role: "Clinical research: protocol parsing, eligibility matching and trial analytics.", handsOver: "Not built.", stage: "next", short: "Trials" },
};

export const PUBLIC_AGENTS: PublicAgent[] = (Object.keys(COPY) as AgentId[]).map((id) => {
  const a = agent(id);
  return { id, name: a.productName.replace(/ \(part of .*\)$/, ""), ...COPY[id], status: a.status, statusLabel: STATUS_LABEL[a.status], usesModel: a.modelFlag !== null };
});

export const STAGES: { key: AgentStage; title: string; detail: string }[] = [
  { key: "capture", title: "Capture and structure", detail: "The consultation becomes structured, sourced drafts." },
  { key: "draft", title: "Draft and check", detail: "Specialised agents work in parallel on one view of the patient." },
  { key: "decide", title: "The clinician decides", detail: "Every draft is accepted, edited or rejected by a named person." },
  { key: "coordinate", title: "Coordinate and stage", detail: "Only accepted work moves on, and nothing reaches a record without approval." },
  { key: "govern", title: "Orchestrate, audit and learn", detail: "One supervisor, one audit trail, outcomes measured." },
  { key: "next", title: "Planned", detail: "Not built; listed so the roadmap is honest." },
];

/** True numbers for the page (kept beside the copy so they change together). */
export const AGENT_FACTS = {
  agents: AGENTS.length,
  humanGates: 3,
  registeredRules: RULES.length,
  releaseMinDecided: agent("SYNTHESIS").release?.minDecided ?? 50,
};
