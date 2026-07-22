export type RoadmapBuildStatus = "built" | "partial" | "planned" | "not_started" | "blocked";
export type RoadmapRisk = "low" | "medium" | "high" | "critical";

export type RoadmapItem = {
  month: string;
  phase: string;
  deliverable: string;
  owner: string;
  budgetK: number;
  team: number;
  validationGate: string;
  workbookStatus: string;
  buildStatus: RoadmapBuildStatus;
  currentReality: string;
  nextBuild: string;
};

export type CriticalPathItem = {
  timeline: string;
  priority: "critical" | "high" | "medium";
  blocker: string;
  owner: string;
  impact: string;
  buildStatus: RoadmapBuildStatus;
  currentReality: string;
};

export type BudgetLine = {
  category: string;
  item: string;
  totalK: number;
  months: number;
  monthlyK: number;
  buildStatus: RoadmapBuildStatus;
};

export type RoadmapTrackerItem = {
  id: string;
  owner: string;
  dueDate: string;
  buildStatus: RoadmapBuildStatus;
  risk: RoadmapRisk;
  evidenceLink: string;
  notes: string;
  lastUpdated: string;
};

export type M1ChecklistItem = {
  id: string;
  week: string;
  title: string;
  owner: string;
  dueDate: string;
  doneWhen: string;
  buildStatus: RoadmapBuildStatus;
  risk: RoadmapRisk;
  evidenceLink: string;
  notes: string;
  lastUpdated: string;
};

export type M1DueDateStatus = "overdue" | "due_this_week" | "waiting_on_evidence" | "on_track" | "done";
export type M1GeneratedAction = {
  id: string;
  owner: string;
  itemId: string;
  title: string;
  priority: "critical" | "high" | "medium";
  reason: M1DueDateStatus | "critical_risk";
  suggestedAction: string;
  evidenceLink: string;
  dueDate: string;
};

export type M1ActionResolutionStatus = "accepted" | "done" | "deferred" | "not_needed";

export type M1ActionResolution = {
  actionId: string;
  itemId: string;
  owner: string;
  status: M1ActionResolutionStatus;
  note: string;
  nextStep: string;
  targetDate: string;
  blockedReason: string;
  followThroughEvidenceLink: string;
  resolvedAt: string;
  resolvedBy: string;
};

export type RoadmapHistoryEntry = {
  id: string;
  itemId: string;
  changedAt: string;
  changedBy: string;
  summary: string;
  changes: Array<{
    field: keyof Omit<RoadmapTrackerItem, "id" | "lastUpdated">;
    before: string;
    after: string;
  }>;
};

export type RoadmapTrackerState = {
  userId: string;
  updatedAt: string;
  items: RoadmapTrackerItem[];
  m1Checklist: M1ChecklistItem[];
  m1ActionResolutions: M1ActionResolution[];
  history: RoadmapHistoryEntry[];
};

export const roadmapItems: RoadmapItem[] = [
  {
    month: "M1 (Apr 26)",
    phase: "1A",
    deliverable: "AWS EKS + FHIR PoC + CSO Hire",
    owner: "CTO + CEO",
    budgetK: 48,
    team: 6,
    validationGate: "Infrastructure ready + CSO onboard",
    workbookStatus: "Critical",
    buildStatus: "partial",
    currentReality: "FHIR-shaped proof, synthetic workflows, integration guards, and evidence exports exist. AWS EKS, RDS, deployed Medplum sandbox, and CSO hiring are not built or completed in the app.",
    nextBuild: "Add roadmap/gap tracking, keep FHIR export proof stable, then define infrastructure and clinical safety work packages outside the app."
  },
  {
    month: "M2 (May 26)",
    phase: "1B",
    deliverable: "SYNTHESIS + DrASSIST Agents (LangGraph)",
    owner: "AI/ML + Frontend",
    budgetK: 36,
    team: 8,
    validationGate: "50 synthetic encounters processed",
    workbookStatus: "Planned",
    buildStatus: "partial",
    currentReality: "Deterministic synthetic intake-to-draft generation exists, with reviewable traces and seeded scenario coverage. LangGraph and separately deployed DrASSIST agents are not implemented.",
    nextBuild: "Add scenario volume tracking and keep the current deterministic generator as the safe default before external agent orchestration."
  },
  {
    month: "M3 (Jun 26)",
    phase: "1C",
    deliverable: "Voice Layer + JSL NLP Integration",
    owner: "Frontend + AI/ML",
    budgetK: 42,
    team: 8,
    validationGate: "Voice SOAP generation <3.5min",
    workbookStatus: "Planned",
    buildStatus: "partial",
    currentReality:
      "VOICE is a CANVAS dictation sub-capability (Deepgram when keyed, else labelled simulated). John Snow Labs NLP microservice is Phase 2 / not wired — not a live product integration and not a peer directory agent.",
    nextBuild:
      "Keep simulated/live ASR honesty banners. Do not market JSL as integrated until a real vendor path exists."
  },
  {
    month: "M4 (Jul 26)",
    phase: "1D",
    deliverable: "SHIELD + EQUITY Agents + Graph DB",
    owner: "AI/ML + CSO",
    budgetK: 40,
    team: 8,
    validationGate: "Safety validation 0 missed alerts",
    workbookStatus: "Planned",
    buildStatus: "partial",
    currentReality: "Safety flags, blockers, finalization states, benchmark checks, and remediation actions exist. Named SHIELD/EQUITY agents and graph databases are not implemented.",
    nextBuild: "Extract safety/validation analytics from workflow code and formalize clinical rule coverage before graph infrastructure."
  },
  {
    month: "M5 (Aug 26)",
    phase: "1E",
    deliverable: "Phase 1 Validation Complete",
    owner: "QA + Clinical",
    budgetK: 30,
    team: 6,
    validationGate: "DrASSIST F1 >= 0.82, triage accuracy >= 90%",
    workbookStatus: "Planned",
    buildStatus: "partial",
    currentReality: "Synthetic benchmark checks and workflow tests pass. Formal clinical validation studies, F1 measurement, and triage accuracy studies are not complete.",
    nextBuild: "Add measurable benchmark evidence and scenario coverage reporting tied to validation claims."
  },
  {
    month: "M6 (Sep 26)",
    phase: "1F",
    deliverable: "DCB0129 Safety Case Draft + NHS Partners Engaged",
    owner: "CSO + CEO",
    budgetK: 38,
    team: 6,
    validationGate: "DTAC pre-submission approved",
    workbookStatus: "Planned",
    buildStatus: "not_started",
    currentReality: "Architecture docs and synthetic evidence reports exist. A DCB0129 safety case, DTAC approval, and partner engagement record are not built or approved.",
    nextBuild: "Create safety-file placeholders and evidence index, but keep approval language out until a CSO/regulatory owner signs off."
  },
  {
    month: "M7 (Oct 26)",
    phase: "2A",
    deliverable: "EMIS Web Integration + 3 GP Pilot Sites Selected",
    owner: "CTO + NHS BD",
    budgetK: 52,
    team: 8,
    validationGate: "EMIS sandbox testing passed",
    workbookStatus: "Planned",
    buildStatus: "not_started",
    currentReality: "No live EMIS/SystmOne integration exists. Current FHIR outputs are evidence-oriented and integration rehearsal only.",
    nextBuild: "Define mocked EMIS/SystmOne contract tests before vendor or pilot claims."
  },
  {
    month: "M8 (Nov 26)",
    phase: "2B",
    deliverable: "VOICE Agent + SystmOne prep",
    owner: "AI/ML + Frontend",
    budgetK: 44,
    team: 8,
    validationGate: "SOAP auto-generation >85% accuracy",
    workbookStatus: "Planned",
    buildStatus: "not_started",
    currentReality: "No production voice agent or SystmOne integration prep is complete. Existing voice behavior is a route-level rehearsal/fallback.",
    nextBuild: "Create controlled voice evidence scenarios only after current clinical proof is maintainable."
  },
  {
    month: "M9 (Dec 26)",
    phase: "2C",
    deliverable: "IntelliProve Integration + Mental Health Bundle",
    owner: "Frontend + Product",
    budgetK: 32,
    team: 6,
    validationGate: "Biomarker FHIR schema validated",
    workbookStatus: "Planned",
    buildStatus: "not_started",
    currentReality: "No IntelliProve integration, mental health bundle, or biomarker schema validation exists in the current app.",
    nextBuild: "Keep this parked until the core review/evidence workflow is stable and validated."
  },
  {
    month: "M10 (Jan 27)",
    phase: "2D",
    deliverable: "3 ICS Pilots Launch + ORACLE Agent MVP",
    owner: "NHS BD + AI/ML",
    budgetK: 56,
    team: 10,
    validationGate: "150 clinicians trained, 5K patients",
    workbookStatus: "Planned",
    buildStatus: "blocked",
    currentReality: "No real-patient pilot, clinician training programme, or ORACLE agent MVP is live. Current product is synthetic proof only.",
    nextBuild: "Do not build live pilot flows until clinical safety, data protection, auth, infrastructure, and partner agreements are ready."
  },
  {
    month: "M11 (Feb 27)",
    phase: "2E",
    deliverable: "Federated Learning Architecture + RWE pipeline",
    owner: "AI/ML + DevOps",
    budgetK: 48,
    team: 8,
    validationGate: "3-node model design approved",
    workbookStatus: "Planned",
    buildStatus: "not_started",
    currentReality: "No federated learning architecture or real-world evidence pipeline exists.",
    nextBuild: "Document future architecture only; do not implement until real data governance exists."
  },
  {
    month: "M12 (Mar 27)",
    phase: "2F",
    deliverable: "DCB0129 Safety Case Submission Ready + NHS App prep",
    owner: "CSO + CTO",
    budgetK: 54,
    team: 8,
    validationGate: "DTAC approval + MHRA pathway open",
    workbookStatus: "Planned",
    buildStatus: "blocked",
    currentReality: "No DCB0129 submission, DTAC approval, MHRA pathway, or NHS App preparation is complete.",
    nextBuild: "Keep as future programme milestone; current build can only support evidence preparation."
  }
];

export const defaultRoadmapTrackerItems: RoadmapTrackerItem[] = [
  {
    id: "1A",
    owner: "CTO + CEO",
    dueDate: "2026-04-30",
    buildStatus: "partial",
    risk: "critical",
    evidenceLink: "/review/roadmap",
    notes: "Current app proves synthetic FHIR-shaped evidence. AWS EKS, RDS, Medplum sandbox deployment, and CSO hire remain open.",
    lastUpdated: "2026-04-29"
  },
  {
    id: "1B",
    owner: "AI/ML + Frontend",
    dueDate: "2026-05-31",
    buildStatus: "partial",
    risk: "high",
    evidenceLink: "/intake",
    notes: "Deterministic synthetic generation exists; LangGraph/DrASSIST orchestration is not built.",
    lastUpdated: "2026-04-29"
  },
  {
    id: "1C",
    owner: "Frontend + AI/ML",
    dueDate: "2026-06-30",
    buildStatus: "partial",
    risk: "medium",
    evidenceLink: "/intake",
    notes: "Transcription fallback exists. Vendor NLP/voice accuracy evidence is not complete.",
    lastUpdated: "2026-04-29"
  },
  {
    id: "1D",
    owner: "AI/ML + CSO",
    dueDate: "2026-07-31",
    buildStatus: "partial",
    risk: "high",
    evidenceLink: "/review/benchmarks",
    notes: "Safety flags and benchmark coverage exist. Named SHIELD/EQUITY agents and graph DB are not built.",
    lastUpdated: "2026-04-29"
  },
  {
    id: "1E",
    owner: "QA + Clinical",
    dueDate: "2026-08-31",
    buildStatus: "partial",
    risk: "high",
    evidenceLink: "/review/benchmarks/report",
    notes: "Synthetic benchmarks pass. Formal clinical F1/triage studies are not complete.",
    lastUpdated: "2026-04-29"
  },
  {
    id: "1F",
    owner: "CSO + CEO",
    dueDate: "2026-09-30",
    buildStatus: "not_started",
    risk: "critical",
    evidenceLink: "/review/readiness",
    notes: "Evidence readiness exists. DCB0129 safety case draft and DTAC pre-submission are not complete.",
    lastUpdated: "2026-04-29"
  },
  {
    id: "2A",
    owner: "CTO + NHS BD",
    dueDate: "2026-10-31",
    buildStatus: "not_started",
    risk: "critical",
    evidenceLink: "",
    notes: "No EMIS sandbox or GP pilot-site selection is complete.",
    lastUpdated: "2026-04-29"
  },
  {
    id: "2B",
    owner: "AI/ML + Frontend",
    dueDate: "2026-11-30",
    buildStatus: "not_started",
    risk: "high",
    evidenceLink: "",
    notes: "VOICE dictation (CANVAS sub-capability) and SystmOne preparation are future roadmap items. JSL NLP remains not wired.",
    lastUpdated: "2026-04-29"
  },
  {
    id: "2C",
    owner: "Frontend + Product",
    dueDate: "2026-12-31",
    buildStatus: "not_started",
    risk: "medium",
    evidenceLink: "",
    notes: "IntelliProve, mental health bundle, and biomarker schema validation are not started.",
    lastUpdated: "2026-04-29"
  },
  {
    id: "2D",
    owner: "NHS BD + AI/ML",
    dueDate: "2027-01-31",
    buildStatus: "blocked",
    risk: "critical",
    evidenceLink: "",
    notes: "Real-patient pilots remain blocked until safety, privacy, infrastructure, and partner governance are ready.",
    lastUpdated: "2026-04-29"
  },
  {
    id: "2E",
    owner: "AI/ML + DevOps",
    dueDate: "2027-02-28",
    buildStatus: "not_started",
    risk: "medium",
    evidenceLink: "",
    notes: "Federated learning and RWE pipeline are not started.",
    lastUpdated: "2026-04-29"
  },
  {
    id: "2F",
    owner: "CSO + CTO",
    dueDate: "2027-03-31",
    buildStatus: "blocked",
    risk: "critical",
    evidenceLink: "",
    notes: "DCB0129 submission, DTAC approval, MHRA pathway, and NHS App prep are not complete.",
    lastUpdated: "2026-04-29"
  }
];

export const defaultM1ChecklistItems: M1ChecklistItem[] = [
  {
    id: "m1-cso-hire",
    week: "Week 1",
    title: "CSO job spec finalized + RCGP/NMC/GPhC reach-out",
    owner: "CEO",
    dueDate: "2026-04-05",
    doneWhen: "Clinical Safety Officer candidate pipeline identified and interview process scheduled.",
    buildStatus: "not_started",
    risk: "critical",
    evidenceLink: "",
    notes: "This is a real-world hiring/governance blocker, not an app feature.",
    lastUpdated: "2026-04-30"
  },
  {
    id: "m1-emis-application",
    week: "Week 1",
    title: "EMIS Web Partner Programme application submitted",
    owner: "CTO",
    dueDate: "2026-04-05",
    doneWhen: "Formal acknowledgement or next-step email from EMIS is captured.",
    buildStatus: "not_started",
    risk: "critical",
    evidenceLink: "",
    notes: "Do not claim EMIS integration until partner/sandbox pathway is confirmed.",
    lastUpdated: "2026-04-30"
  },
  {
    id: "m1-reg-consultant",
    week: "Week 1",
    title: "DTAC/DCB0129 regulatory consultant engaged",
    owner: "CEO",
    dueDate: "2026-04-05",
    doneWhen: "Consultant contract signed and kickoff booked.",
    buildStatus: "not_started",
    risk: "critical",
    evidenceLink: "",
    notes: "Current product evidence can support the conversation but is not a safety case.",
    lastUpdated: "2026-04-30"
  },
  {
    id: "m1-infra-decision",
    week: "Week 1",
    title: "AWS London EKS/RDS decision and implementation plan",
    owner: "CTO + DevOps",
    dueDate: "2026-04-12",
    doneWhen: "Architecture decision record exists with environment, cost, security, and migration assumptions.",
    buildStatus: "partial",
    risk: "high",
    evidenceLink: "/review/roadmap/report",
    notes: "The app remains JSON-backed proof-stage; production-style infrastructure is not deployed.",
    lastUpdated: "2026-04-30"
  },
  {
    id: "m1-synthetic-validation-scope",
    week: "Week 2",
    title: "Synthetic validation scope locked",
    owner: "QA + Clinical",
    dueDate: "2026-04-12",
    doneWhen: "Scenario classes, expected outcomes, benchmark gates, and evidence exports are documented.",
    buildStatus: "partial",
    risk: "high",
    evidenceLink: "/review/benchmarks/report",
    notes: "The synthetic benchmark suite exists; formal validation scope still needs sign-off.",
    lastUpdated: "2026-04-30"
  },
  {
    id: "m1-medplum-fhir-plan",
    week: "Week 2",
    title: "Medplum/FHIR sandbox plan",
    owner: "CTO + AI/ML",
    dueDate: "2026-04-12",
    doneWhen: "FHIR resource plan and sandbox boundaries are documented without enabling live sync by default.",
    buildStatus: "partial",
    risk: "medium",
    evidenceLink: "/cases/case-005/evidence",
    notes: "Current FHIR output is evidence-shaped; Medplum sync remains gated off.",
    lastUpdated: "2026-04-30"
  },
  {
    id: "m1-hazard-log-template",
    week: "Week 3",
    title: "Hazard log template aligned to DCB0129/clinical safety work",
    owner: "CSO + Regulatory Consultant",
    dueDate: "2026-04-19",
    doneWhen: "Hazard log framework exists with owners, mitigations, evidence links, and open assumptions.",
    buildStatus: "partial",
    risk: "critical",
    evidenceLink: "/review/readiness",
    notes: "A regulatory folder exists, but this still needs accountable clinical safety review.",
    lastUpdated: "2026-04-30"
  },
  {
    id: "m1-safety-board",
    week: "Week 4",
    title: "Safety committee and first review board scheduled",
    owner: "CSO + CEO",
    dueDate: "2026-04-26",
    doneWhen: "Meeting date, attendees, agenda, and evidence pack are captured.",
    buildStatus: "not_started",
    risk: "critical",
    evidenceLink: "/review/meeting-packet",
    notes: "Keep this as planned until a named safety owner is accountable.",
    lastUpdated: "2026-04-30"
  }
];

export const criticalPathItems: CriticalPathItem[] = [
  {
    timeline: "Week 1",
    priority: "critical",
    blocker: "Hire Clinical Safety Officer",
    owner: "CEO",
    impact: "No clinical safety owner blocks DCB0129-style claims.",
    buildStatus: "not_started",
    currentReality: "Not an app feature; needs real hiring and governance."
  },
  {
    timeline: "Week 2",
    priority: "critical",
    blocker: "Apply to EMIS Web Partner Programme",
    owner: "CTO",
    impact: "Delays any real EMIS pathway.",
    buildStatus: "not_started",
    currentReality: "No vendor application evidence is tracked in the app."
  },
  {
    timeline: "Week 3",
    priority: "critical",
    blocker: "Engage DTAC/DCB0129 regulatory consultant",
    owner: "CEO",
    impact: "Delays clinical safety and regulatory pathway.",
    buildStatus: "not_started",
    currentReality: "Current docs are internal proof docs, not consultant-reviewed regulatory files."
  },
  {
    timeline: "Week 4",
    priority: "high",
    blocker: "AWS EKS London setup + load 100 Synthea patients",
    owner: "CTO",
    impact: "Blocks production-style infrastructure and scaled synthetic validation.",
    buildStatus: "partial",
    currentReality: "Synthetic cases exist locally in JSON, not AWS/EKS."
  },
  {
    timeline: "M2",
    priority: "high",
    blocker: "LangGraph SYNTHESIS agent operational",
    owner: "AI/ML Lead",
    impact: "Blocks agent programme claims.",
    buildStatus: "partial",
    currentReality: "Deterministic intake generation exists; LangGraph agent orchestration does not."
  },
  {
    timeline: "M5",
    priority: "medium",
    blocker: "Phase 1 validation gates passed",
    owner: "QA Lead",
    impact: "Weakens external evidence and funding story.",
    buildStatus: "partial",
    currentReality: "Synthetic benchmark suite passes; formal clinical validation metrics are not complete."
  },
  {
    timeline: "M7",
    priority: "high",
    blocker: "EMIS Web API sandbox testing passed",
    owner: "CTO",
    impact: "Blocks GP integration claims.",
    buildStatus: "not_started",
    currentReality: "No EMIS sandbox integration is implemented."
  },
  {
    timeline: "M10",
    priority: "high",
    blocker: "3 ICS pilot sites trained and live with real patients",
    owner: "NHS BD",
    impact: "Blocks real-world validation and scale-up.",
    buildStatus: "blocked",
    currentReality: "Out of scope until safety, privacy, infrastructure, and partner governance are ready."
  },
  {
    timeline: "M12",
    priority: "critical",
    blocker: "DCB0129 Safety Case submission ready",
    owner: "CSO",
    impact: "Blocks regulated clinical deployment pathway.",
    buildStatus: "blocked",
    currentReality: "The app can generate evidence artifacts, but it is not a submitted safety case."
  }
];

export const budgetLines: BudgetLine[] = [
  { category: "Personnel", item: "Engineering, AI/ML, frontend, DevOps, QA, clinical, NHS BD", totalK: 492, months: 12, monthlyK: 41, buildStatus: "planned" },
  { category: "Regulatory", item: "DCB0129, DTAC, ISO 27001, DSPT", totalK: 168, months: 12, monthlyK: 14, buildStatus: "not_started" },
  { category: "Cloud", item: "AWS EKS, RDS, egress, backup", totalK: 144, months: 12, monthlyK: 12, buildStatus: "not_started" },
  { category: "APIs & Licenses", item: "Deepgram (+ planned JSL NLP — not wired), ElevenLabs, Claude/GPT", totalK: 132, months: 12, monthlyK: 11, buildStatus: "partial" },
  { category: "Infrastructure", item: "Neo4j, Weaviate, Mirth Connect", totalK: 72, months: 12, monthlyK: 6, buildStatus: "not_started" },
  { category: "Clinical", item: "GP pilot sites and Phase 1 validation studies", totalK: 90, months: 12, monthlyK: 7.5, buildStatus: "blocked" },
  { category: "Commercial", item: "EMIS + SystmOne partner engagement", totalK: 36, months: 12, monthlyK: 3, buildStatus: "not_started" },
  { category: "Contingency", item: "Risk buffer", totalK: 118, months: 12, monthlyK: 9.8, buildStatus: "planned" }
];

export const workbookBudgetTotalK = 1252;
export const workbookHeaderBudgetK = 1180;

export const doNotClaimYet = [
  "Production clinical software",
  "Live NHS/EHR integration",
  "Real patient-data readiness",
  "Completed DCB0129 safety case",
  "DTAC approval",
  "EMIS/SystmOne sandbox approval",
  "Live GP/ICS pilot",
  "Clinically validated NLP/triage accuracy"
];

export function summarizeRoadmapStatus(items = roadmapItems) {
  return items.reduce(
    (summary, item) => {
      summary[item.buildStatus] += 1;
      summary.total += 1;
      summary.budgetK += item.budgetK;
      return summary;
    },
    { built: 0, partial: 0, planned: 0, not_started: 0, blocked: 0, total: 0, budgetK: 0 }
  );
}

export function summarizeTrackerState(items: RoadmapTrackerItem[]) {
  return items.reduce(
    (summary, item) => {
      summary[item.buildStatus] += 1;
      summary[item.risk] += 1;
      summary.total += 1;
      return summary;
    },
    {
      built: 0,
      partial: 0,
      planned: 0,
      not_started: 0,
      blocked: 0,
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
      total: 0
    }
  );
}

export function summarizeRoadmapHistory(history: RoadmapHistoryEntry[]) {
  const changedItemIds = new Set(history.map((entry) => entry.itemId));

  return {
    totalEvents: history.length,
    changedItems: changedItemIds.size,
    latestEvent: history[0] ?? null
  };
}

export function summarizeM1Checklist(items: M1ChecklistItem[]) {
  return items.reduce(
    (summary, item) => {
      summary[item.buildStatus] += 1;
      summary[item.risk] += 1;
      summary.total += 1;
      return summary;
    },
    {
      built: 0,
      partial: 0,
      planned: 0,
      not_started: 0,
      blocked: 0,
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
      total: 0
    }
  );
}

function getUtcDay(value: Date) {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

export function deriveM1DueDateStatus(item: M1ChecklistItem, today = new Date()): M1DueDateStatus {
  if (item.buildStatus === "built") {
    return "done";
  }

  if (!item.evidenceLink.trim()) {
    return "waiting_on_evidence";
  }

  const todayMs = getUtcDay(today);
  const dueMs = Date.parse(`${item.dueDate}T00:00:00Z`);
  const weekMs = todayMs + 7 * 24 * 60 * 60 * 1000;

  if (Number.isNaN(dueMs)) {
    return "on_track";
  }

  if (dueMs < todayMs) {
    return "overdue";
  }

  if (dueMs <= weekMs) {
    return "due_this_week";
  }

  return "on_track";
}

export function deriveM1DueDateHealth(items: M1ChecklistItem[], today = new Date()) {
  const rows = items.map((item) => ({
    item,
    status: deriveM1DueDateStatus(item, today)
  }));

  const counts = rows.reduce(
    (summary, row) => {
      summary[row.status] += 1;
      summary.total += 1;
      return summary;
    },
    {
      overdue: 0,
      due_this_week: 0,
      waiting_on_evidence: 0,
      on_track: 0,
      done: 0,
      total: 0
    }
  );

  return { counts, rows };
}

export function deriveM1OwnerFollowUps(items: M1ChecklistItem[]) {
  const ownerMap = new Map<string, M1ChecklistItem[]>();

  for (const item of items) {
    const owners = item.owner.split("+").map((owner) => owner.trim()).filter(Boolean);
    for (const owner of owners.length ? owners : ["Unassigned"]) {
      ownerMap.set(owner, [...(ownerMap.get(owner) ?? []), item]);
    }
  }

  return [...ownerMap.entries()]
    .map(([owner, ownerItems]) => {
      const openItems = ownerItems.filter((item) => item.buildStatus !== "built");
      const criticalItems = openItems.filter((item) => item.risk === "critical" || item.buildStatus === "blocked");
      const missingEvidenceItems = openItems.filter((item) => !item.evidenceLink.trim());
      const nextDueItem = [...openItems].sort((a, b) => Date.parse(`${a.dueDate}T00:00:00Z`) - Date.parse(`${b.dueDate}T00:00:00Z`))[0] ?? null;

      const dueHealth = deriveM1DueDateHealth(openItems);

      return {
        owner,
        totalItems: ownerItems.length,
        openItems: openItems.length,
        criticalItems: criticalItems.length,
        missingEvidenceItems: missingEvidenceItems.length,
        overdueItems: dueHealth.counts.overdue,
        dueThisWeekItems: dueHealth.counts.due_this_week,
        waitingOnEvidenceItems: dueHealth.counts.waiting_on_evidence,
        nextDueItem,
        items: ownerItems
      };
    })
    .sort((a, b) => {
      if (b.criticalItems !== a.criticalItems) return b.criticalItems - a.criticalItems;
      if (b.openItems !== a.openItems) return b.openItems - a.openItems;
      return a.owner.localeCompare(b.owner);
    });
}

export function deriveM1GeneratedActions(items: M1ChecklistItem[], today = new Date()): M1GeneratedAction[] {
  return items
    .flatMap((item) => {
      if (item.buildStatus === "built") {
        return [];
      }

      const owners = item.owner.split("+").map((owner) => owner.trim()).filter(Boolean);
      const ownerList = owners.length ? owners : ["Unassigned"];
      const dueStatus = deriveM1DueDateStatus(item, today);
      const reason: M1GeneratedAction["reason"] | null =
        dueStatus !== "on_track" ? dueStatus : item.risk === "critical" ? "critical_risk" : null;

      if (!reason) {
        return [];
      }

      const priority: M1GeneratedAction["priority"] =
        reason === "overdue" || item.risk === "critical" || item.buildStatus === "blocked"
          ? "critical"
          : reason === "due_this_week" || reason === "waiting_on_evidence"
            ? "high"
            : "medium";

      const suggestedAction =
        reason === "waiting_on_evidence"
          ? `Attach evidence for "${item.title}" or explicitly mark why evidence is not available yet.`
          : reason === "overdue"
            ? `Resolve or re-date overdue M1 item "${item.title}" and capture the evidence trail.`
            : reason === "due_this_week"
              ? `Confirm this week's next step for "${item.title}" and update owner notes.`
              : `Escalate critical-risk item "${item.title}" for owner review.`;

      return ownerList.map((owner) => ({
        id: `${item.id}-${owner.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        owner,
        itemId: item.id,
        title: item.title,
        priority,
        reason,
        suggestedAction,
        evidenceLink: item.evidenceLink,
        dueDate: item.dueDate
      }));
    })
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) return priorityOrder[a.priority] - priorityOrder[b.priority];
      return Date.parse(`${a.dueDate}T00:00:00Z`) - Date.parse(`${b.dueDate}T00:00:00Z`);
    });
}

export function summarizeM1ActionResolutions(actions: M1GeneratedAction[], resolutions: M1ActionResolution[] = []) {
  const generatedIds = new Set(actions.map((action) => action.id));
  const currentResolutions = resolutions.filter((resolution) => generatedIds.has(resolution.actionId));
  const resolvedActionIds = new Set(currentResolutions.map((resolution) => resolution.actionId));

  return currentResolutions.reduce(
    (summary, resolution) => {
      summary[resolution.status] += 1;
      summary.resolved += 1;
      return summary;
    },
    {
      generated: actions.length,
      active: actions.filter((action) => !resolvedActionIds.has(action.id)).length,
      resolved: 0,
      accepted: 0,
      done: 0,
      deferred: 0,
      not_needed: 0
    }
  );
}

export function mergeRoadmapWithTracker(stateItems: RoadmapTrackerItem[]) {
  const trackerById = new Map(stateItems.map((item) => [item.id, item]));
  return roadmapItems.map((item) => ({
    ...item,
    tracker: trackerById.get(item.phase) ?? defaultRoadmapTrackerItems.find((trackerItem) => trackerItem.id === item.phase)
  }));
}

export function getNextThirtyDayItems(stateItems: RoadmapTrackerItem[], today = new Date()) {
  const todayMs = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const thirtyDaysMs = todayMs + 30 * 24 * 60 * 60 * 1000;

  return mergeRoadmapWithTracker(stateItems)
    .filter((item) => {
      if (!item.tracker?.dueDate) return false;
      const dueMs = Date.parse(`${item.tracker.dueDate}T00:00:00Z`);
      return dueMs <= thirtyDaysMs && item.tracker.buildStatus !== "built";
    })
    .sort((a, b) => Date.parse(`${a.tracker?.dueDate ?? "9999-12-31"}T00:00:00Z`) - Date.parse(`${b.tracker?.dueDate ?? "9999-12-31"}T00:00:00Z`));
}

export function statusLabel(status: RoadmapBuildStatus) {
  return status.replace("_", " ");
}

export function riskLabel(risk: RoadmapRisk) {
  return risk;
}
