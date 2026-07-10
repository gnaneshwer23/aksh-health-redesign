import { buildValidationIssues } from "../export-mapping";
import { formatCaseTimestamp } from "../time-format";
import type { BenchmarkActionResolution, ReviewCase, ScenarioExpectedOutcome } from "../types";
import { deriveAcceptanceBlockers, deriveFinalizationState, deriveSafetyFlags } from "./safety";
import { deriveValidationProtocol } from "./validation";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

const ukClinicalRiskCoverageTargets = [
  {
    id: "low-risk-clean-review",
    label: "Low-risk clean review",
    minimumCases: 1,
    matchedScenarioClasses: ["low-risk clean", "straightforward eczema", "eczema accepted"]
  },
  {
    id: "incomplete-vitals",
    label: "Incomplete vitals",
    minimumCases: 1,
    matchedScenarioClasses: ["incomplete vitals", "hypertension missing bp"]
  },
  {
    id: "medication-allergy-intolerance",
    label: "Medication allergy or intolerance",
    minimumCases: 1,
    matchedScenarioClasses: ["medication allergy", "allergy conflict", "statin intolerance"]
  },
  {
    id: "respiratory-escalation",
    label: "Respiratory escalation",
    minimumCases: 1,
    matchedScenarioClasses: ["respiratory escalation"]
  },
  {
    id: "conflicting-evidence",
    label: "Conflicting source evidence",
    minimumCases: 1,
    matchedScenarioClasses: ["conflicting evidence"]
  },
  {
    id: "medication-dosing-ambiguity",
    label: "Medication dosing ambiguity",
    minimumCases: 1,
    matchedScenarioClasses: ["medication dosing ambiguity"]
  },
  {
    id: "chronic-disease-follow-up",
    label: "Chronic disease follow-up",
    minimumCases: 1,
    matchedScenarioClasses: ["chronic disease follow-up", "hypertension follow-up", "lipid follow-up"]
  }
];

function inferScenarioClass(reviewCase: ReviewCase) {
  const explicitClass = reviewCase.expectedOutcome?.scenarioClass;
  if (explicitClass) {
    return explicitClass;
  }

  const text = normalize(`${reviewCase.summary} ${reviewCase.input.summary} ${reviewCase.draft.condition.codeText}`);
  if (
    reviewCase.draft.observations.some(
      (observation) => normalize(observation.codeText) === "blood pressure" && !normalize(observation.valueText)
    )
  ) {
    return "incomplete vitals";
  }
  if (text.includes("eczema")) return "straightforward eczema";
  if (text.includes("hypertension") || text.includes("blood pressure")) return "hypertension follow-up";
  if (text.includes("statin") || text.includes("lipid") || text.includes("cholesterol")) return "lipid follow-up";
  if (text.includes("allergy") || text.includes("amoxicillin") || text.includes("penicillin")) return "medication allergy";
  return "unclassified";
}

export function deriveClinicalRuleCoverageMatrix(cases: ReviewCase[]) {
  const scenarioRows = cases.map((reviewCase) => ({
    caseId: reviewCase.id,
    patientLabel: reviewCase.patientLabel,
    scenarioClass: inferScenarioClass(reviewCase),
    benchmarked: Boolean(reviewCase.expectedOutcome)
  }));

  const rows = ukClinicalRiskCoverageTargets.map((target) => {
    const matchedCases = scenarioRows.filter((scenario) =>
      target.matchedScenarioClasses.some((scenarioClass) => normalize(scenario.scenarioClass).includes(normalize(scenarioClass)))
    );
    const benchmarkedCount = matchedCases.filter((item) => item.benchmarked).length;

    return {
      id: target.id,
      label: target.label,
      minimumCases: target.minimumCases,
      caseCount: matchedCases.length,
      benchmarkedCount,
      status:
        matchedCases.length >= target.minimumCases && benchmarkedCount > 0
          ? ("covered" as const)
          : matchedCases.length >= target.minimumCases
            ? ("needs_expected_outcome" as const)
            : ("missing" as const),
      cases: matchedCases
    };
  });

  return {
    totalTargets: rows.length,
    coveredTargets: rows.filter((item) => item.status === "covered").length,
    missingTargets: rows.filter((item) => item.status === "missing").length,
    needsExpectedOutcomeTargets: rows.filter((item) => item.status === "needs_expected_outcome").length,
    rows
  };
}

function expectedItemsPass(actualValues: string[], expectedValues: string[] | undefined) {
  if (!expectedValues?.length) {
    return true;
  }

  const normalizedActual = actualValues.map(normalize);
  return expectedValues.every((expected) => normalizedActual.some((actual) => actual.includes(normalize(expected))));
}

export function deriveScenarioBenchmark(cases: ReviewCase[]) {
  const benchmarked = cases
    .filter((reviewCase) => reviewCase.expectedOutcome)
    .map((reviewCase) => {
      const expected = reviewCase.expectedOutcome as ScenarioExpectedOutcome;
      const finalizationState = deriveFinalizationState(reviewCase);
      const safetyLabels = deriveSafetyFlags(reviewCase).map((item) => item.label);
      const blockers = deriveAcceptanceBlockers(reviewCase);
      const validationLabels = buildValidationIssues(reviewCase.draft).map((item) => item.label);
      const promotionRecommendation = deriveValidationProtocol(reviewCase).promotionRecommendation;
      const checks = [
        {
          label: "Finalization state",
          passed: finalizationState === expected.expectedFinalizationState,
          expected: expected.expectedFinalizationState,
          actual: finalizationState
        },
        {
          label: "Safety labels",
          passed: expectedItemsPass(safetyLabels, expected.expectedSafetyLabels),
          expected: expected.expectedSafetyLabels?.join(", ") || "No specific safety labels expected",
          actual: safetyLabels.join(", ") || "No safety labels"
        },
        {
          label: "Acceptance blockers",
          passed: expectedItemsPass(blockers, expected.expectedBlockerIncludes),
          expected: expected.expectedBlockerIncludes?.join(", ") || "No specific blockers expected",
          actual: blockers.join(", ") || "No blockers"
        },
        {
          label: "Validation labels",
          passed: expectedItemsPass(validationLabels, expected.expectedValidationLabels),
          expected: expected.expectedValidationLabels?.join(", ") || "No specific validation labels expected",
          actual: validationLabels.join(", ") || "No validation labels"
        },
        {
          label: "Promotion recommendation",
          passed: expected.expectedPromotionRecommendation
            ? promotionRecommendation === expected.expectedPromotionRecommendation
            : true,
          expected: expected.expectedPromotionRecommendation ?? "No specific recommendation expected",
          actual: promotionRecommendation
        }
      ];

      return {
        caseId: reviewCase.id,
        patientLabel: reviewCase.patientLabel,
        scenarioClass: expected.scenarioClass,
        passed: checks.every((item) => item.passed),
        checks
      };
    });

  return {
    total: benchmarked.length,
    passed: benchmarked.filter((item) => item.passed).length,
    failed: benchmarked.filter((item) => !item.passed).length,
    cases: benchmarked
  };
}

function benchmarkActionForCheck(label: string) {
  if (label === "Finalization state") {
    return {
      action: "Reconcile finalization state",
      owner: "Clinical Workflow Lead",
      severity: "high" as const,
      rationale: "The workflow is reaching a different ready/warn/blocked state than the scenario contract expects."
    };
  }
  if (label === "Safety labels") {
    return {
      action: "Tune safety rule coverage",
      owner: "Clinical Safety Lead",
      severity: "high" as const,
      rationale: "The safety engine is missing, overcalling, or renaming a clinically important expected finding."
    };
  }
  if (label === "Acceptance blockers") {
    return {
      action: "Review acceptance guard semantics",
      owner: "Clinical Governance Lead",
      severity: "high" as const,
      rationale: "The case can be finalized too easily, or is being blocked differently from the expected governance path."
    };
  }
  if (label === "Validation labels") {
    return {
      action: "Fix validation evidence mapping",
      owner: "FHIR Validation Lead",
      severity: "medium" as const,
      rationale: "The evidence layer is not explaining the structured-data weakness the scenario expects."
    };
  }
  if (label === "Promotion recommendation") {
    return {
      action: "Recheck promotion protocol",
      owner: "Evidence Readiness Lead",
      severity: "medium" as const,
      rationale: "The case is being routed to a different roadmap stream than the expected proof pathway."
    };
  }

  return {
    action: "Review benchmark expectation",
    owner: "Clinical Product Lead",
    severity: "low" as const,
    rationale: "The benchmark contract and workflow output need to be reconciled."
  };
}

export function deriveScenarioBenchmarkActionQueue(cases: ReviewCase[]) {
  const benchmark = deriveScenarioBenchmark(cases);
  const coverage = deriveClinicalRuleCoverageMatrix(cases);
  const caseMap = new Map(cases.map((reviewCase) => [reviewCase.id, reviewCase]));
  const latestResolutionFor = (caseId: string | undefined, actionId: string) => {
    if (!caseId) return undefined;
    const reviewCase = caseMap.get(caseId);
    const entries = [...(reviewCase?.benchmarkActionResolutions ?? [])].filter((entry) => entry.actionId === actionId);
    return entries[entries.length - 1];
  };
  const benchmarkActions = benchmark.cases.flatMap((item) =>
    item.checks
      .filter((check) => !check.passed)
      .map((check) => {
        const actionTemplate = benchmarkActionForCheck(check.label);
        const actionId = `${item.caseId}-${check.label.toLowerCase().replace(/\s+/g, "-")}`;
        const latestResolution = latestResolutionFor(item.caseId, actionId);

        return {
          id: actionId,
          type: "benchmark_failure" as const,
          caseId: item.caseId,
          patientLabel: item.patientLabel,
          scenarioClass: item.scenarioClass,
          checkLabel: check.label,
          expected: check.expected,
          actual: check.actual,
          action: actionTemplate.action,
          owner: actionTemplate.owner,
          severity: actionTemplate.severity,
          rationale: actionTemplate.rationale,
          resolutionStatus: latestResolution?.status ?? ("open" as const),
          resolvedAt: latestResolution?.status === "resolved" ? latestResolution.updatedAt : undefined,
          resolvedBy: latestResolution?.status === "resolved" ? latestResolution.updatedBy : undefined,
          resolutionNote: latestResolution?.note
        };
      })
  );

  const coverageActions = coverage.rows
    .filter((item) => item.status !== "covered")
    .map((item) => {
      const caseId = item.cases[0]?.caseId;
      const actionId = `coverage-${item.id}`;
      const latestResolution = latestResolutionFor(caseId, actionId);

      return {
        id: actionId,
        type: item.status === "missing" ? ("coverage_gap" as const) : ("expectation_gap" as const),
        caseId,
        patientLabel: item.cases[0]?.patientLabel ?? item.label,
        scenarioClass: item.label,
        checkLabel: item.status === "missing" ? "Coverage target missing" : "Expected outcome missing",
        expected: `${item.minimumCases} benchmarked case(s)`,
        actual: `${item.caseCount} case(s), ${item.benchmarkedCount} benchmarked`,
        action: item.status === "missing" ? "Author missing synthetic scenario" : "Add expected-outcome contract",
        owner: item.status === "missing" ? "Clinical Product Lead" : "Clinical Safety Lead",
        severity: item.status === "missing" ? ("high" as const) : ("medium" as const),
        rationale:
          item.status === "missing"
            ? "A UK clinical risk class is not represented by the synthetic proof pack."
            : "A scenario exists, but it is not yet benchmarked against explicit clinical expectations.",
        resolutionStatus: latestResolution?.status ?? ("open" as const),
        resolvedAt: latestResolution?.status === "resolved" ? latestResolution.updatedAt : undefined,
        resolvedBy: latestResolution?.status === "resolved" ? latestResolution.updatedBy : undefined,
        resolutionNote: latestResolution?.note
      };
    });

  const allItems = [...benchmarkActions, ...coverageActions].sort((left, right) => {
    const severityRank = { high: 3, medium: 2, low: 1 };
    return severityRank[right.severity] - severityRank[left.severity] || left.patientLabel.localeCompare(right.patientLabel);
  });
  const items = allItems.filter((item) => item.resolutionStatus !== "resolved");
  const resolvedItems = allItems.filter((item) => item.resolutionStatus === "resolved");

  return {
    total: items.length,
    high: items.filter((item) => item.severity === "high").length,
    medium: items.filter((item) => item.severity === "medium").length,
    low: items.filter((item) => item.severity === "low").length,
    resolved: resolvedItems.length,
    items,
    resolvedItems
  };
}

export function createScenarioBenchmarkActionResolution(
  reviewCase: ReviewCase,
  input: {
    actionId: string;
    actionLabel: string;
    status: "open" | "resolved";
    updatedBy: string;
    owner?: string;
    note?: string;
  }
): BenchmarkActionResolution[] {
  const existing = reviewCase.benchmarkActionResolutions ?? [];
  const nextEntry: BenchmarkActionResolution = {
    id: `bench-${reviewCase.id}-${Math.random().toString(36).slice(2, 8)}`,
    actionId: input.actionId,
    actionLabel: input.actionLabel,
    status: input.status,
    updatedAt: formatCaseTimestamp(),
    updatedBy: input.updatedBy,
    owner: input.owner,
    note: input.note?.trim() || undefined
  };

  return [...existing, nextEntry];
}
