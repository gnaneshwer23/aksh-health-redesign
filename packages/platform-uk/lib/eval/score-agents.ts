import { runGuardianAgent } from "@/lib/agents/llm-guardian";
import { runOracleAgent } from "@/lib/agents/llm-oracle";
import { runSynthesisAgent } from "@/lib/agents/llm-synthesis";

import { GOLDEN_CASES, listGoldenCases, type GoldenAgentId, type GoldenCase } from "./golden-cases";

export type EvalCheckResult = {
  id: string;
  passed: boolean;
  detail: string;
};

export type GoldenCaseResult = {
  caseId: string;
  agent: GoldenAgentId;
  label: string;
  passed: boolean;
  score: number;
  mode: "llm" | "deterministic" | "unavailable";
  dataSource?: "neo4j" | "mock";
  checks: EvalCheckResult[];
  ehrWrite: false;
  hitlRequired: true;
};

export type EvalReport = {
  kind: "aksh-agent-golden-eval";
  generatedAt: string;
  agentFilter: GoldenAgentId | "all";
  caseCount: number;
  passedCount: number;
  failedCount: number;
  passRate: number;
  ehrWrite: false;
  hitlRequired: true;
  results: GoldenCaseResult[];
};

function includesCI(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function scoreMentions(haystack: string, needles: string[], prefix: string): EvalCheckResult[] {
  return needles.map((needle) => {
    const passed = includesCI(haystack, needle);
    return {
      id: `${prefix}:${needle}`,
      passed,
      detail: passed ? `Found "${needle}"` : `Missing expected mention "${needle}"`
    };
  });
}

async function runCase(golden: GoldenCase): Promise<GoldenCaseResult> {
  if (golden.agent === "SYNTHESIS") {
    const draft = await runSynthesisAgent({
      transcript: golden.input.transcript ?? "",
      patientLabel: golden.input.patientLabel
    });
    const narrative = [draft.subjective, draft.objective, draft.assessment, draft.plan, draft.inputSummary].join(
      "\n"
    );
    const safety = draft.safetyNotes.join("\n");
    const checks = [
      ...scoreMentions(narrative, golden.mustMention, "mention"),
      ...scoreMentions(safety, golden.safetyMustMention, "safety"),
      {
        id: "confidence",
        passed: golden.minConfidence == null || draft.confidence >= golden.minConfidence,
        detail: `confidence=${draft.confidence}`
      },
      {
        id: "structure",
        passed: Boolean(draft.subjective && draft.plan),
        detail: "SOAP fields present"
      }
    ];
    const passed = checks.every((c) => c.passed);
    return {
      caseId: golden.id,
      agent: golden.agent,
      label: golden.label,
      passed,
      score: checks.filter((c) => c.passed).length / checks.length,
      mode: draft.mode,
      checks,
      ehrWrite: false,
      hitlRequired: true
    };
  }

  if (golden.agent === "GUARDIAN") {
    const draft = await runGuardianAgent({
      patientId: golden.input.patientId ?? "P002",
      proposedDrug: golden.input.proposedDrug
    });
    const narrative = [draft.summary, ...(draft.clinicianActions ?? [])].join("\n");
    const safety = draft.safetyNotes.join("\n");
    const checks = [
      ...scoreMentions(narrative, golden.mustMention, "mention"),
      ...scoreMentions(safety, golden.safetyMustMention, "safety"),
      {
        id: "confidence",
        passed: golden.minConfidence == null || draft.confidence >= golden.minConfidence,
        detail: `confidence=${draft.confidence}; status=${draft.overallStatus}`
      }
    ];
    const passed = checks.every((c) => c.passed);
    return {
      caseId: golden.id,
      agent: golden.agent,
      label: golden.label,
      passed,
      score: checks.filter((c) => c.passed).length / checks.length,
      mode: draft.mode,
      dataSource: draft.dataSource,
      checks,
      ehrWrite: false,
      hitlRequired: true
    };
  }

  const draft = await runOracleAgent({ patientId: golden.input.patientId ?? "P002" });
  if (!draft) {
    return {
      caseId: golden.id,
      agent: golden.agent,
      label: golden.label,
      passed: false,
      score: 0,
      mode: "unavailable",
      checks: [{ id: "patient", passed: false, detail: "Patient not found for ORACLE eval" }],
      ehrWrite: false,
      hitlRequired: true
    };
  }

  const narrative = [draft.summary, ...(draft.contributingFactors ?? []), ...(draft.clinicianActions ?? [])].join(
    "\n"
  );
  const safety = draft.safetyNotes.join("\n");
  const checks = [
    ...scoreMentions(narrative, golden.mustMention, "mention"),
    ...scoreMentions(safety, golden.safetyMustMention, "safety"),
    {
      id: "confidence",
      passed: golden.minConfidence == null || draft.confidence >= golden.minConfidence,
      detail: `confidence=${draft.confidence}; score=${draft.oracleScore}`
    }
  ];
  const passed = checks.every((c) => c.passed);
  return {
    caseId: golden.id,
    agent: golden.agent,
    label: golden.label,
    passed,
    score: checks.filter((c) => c.passed).length / checks.length,
    mode: draft.mode,
    dataSource: draft.dataSource,
    checks,
    ehrWrite: false,
    hitlRequired: true
  };
}

export async function runGoldenEval(options?: {
  agent?: GoldenAgentId;
  caseIds?: string[];
}): Promise<EvalReport> {
  let cases = listGoldenCases(options?.agent);
  if (options?.caseIds?.length) {
    const allow = new Set(options.caseIds);
    cases = cases.filter((c) => allow.has(c.id));
  }

  const results: GoldenCaseResult[] = [];
  for (const golden of cases) {
    results.push(await runCase(golden));
  }

  const passedCount = results.filter((r) => r.passed).length;
  return {
    kind: "aksh-agent-golden-eval",
    generatedAt: new Date().toISOString(),
    agentFilter: options?.agent ?? "all",
    caseCount: results.length,
    passedCount,
    failedCount: results.length - passedCount,
    passRate: results.length === 0 ? 0 : passedCount / results.length,
    ehrWrite: false,
    hitlRequired: true,
    results
  };
}

export function listEvalFixtures() {
  return GOLDEN_CASES.map((c) => ({
    id: c.id,
    agent: c.agent,
    label: c.label
  }));
}
