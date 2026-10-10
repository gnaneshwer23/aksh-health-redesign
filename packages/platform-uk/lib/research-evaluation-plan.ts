export type ResearchEvaluationStage = "available_now" | "planned" | "not_allowed_yet";

export type ResearchEvaluationTask = {
  id: string;
  label: string;
  stage: ResearchEvaluationStage;
  datasetBoundary: string;
  targetMetric: string;
  productionClaimAllowed: false;
};

export type ResearchEvaluationPlan = {
  artifactType: "aksh-uk-eu-research-evaluation-boundary";
  inspiredBy: string;
  syntheticOnly: true;
  realPatientData: false;
  liveModelDeployment: false;
  productionClinicalAiClaim: false;
  defaultEvaluationEnvironment: "offline_research_rehearsal";
  currentDatasetSources: string[];
  futureArchitectureBoundary: string[];
  tasks: ResearchEvaluationTask[];
  notYet: string[];
};

export type ResearchEvaluationArtifact = ResearchEvaluationPlan & {
  generatedAt: string;
  generatedBy: string;
  exportPurpose: "offline_research_evaluation_boundary";
  summary: {
    totalTasks: number;
    availableTasks: number;
    plannedTasks: number;
    blockedTasks: number;
    datasetSources: number;
    notYetClaims: number;
  };
};

export function getResearchEvaluationPlan(): ResearchEvaluationPlan {
  const tasks: ResearchEvaluationTask[] = [
    {
      id: "draft-extraction-quality",
      label: "Structured draft extraction quality",
      stage: "available_now",
      datasetBoundary: "Use synthetic review cases, generated drafts, source trace, and field-change history only.",
      targetMetric: "field completeness, source-trace coverage, reviewer correction rate",
      productionClaimAllowed: false
    },
    {
      id: "safety-rule-detection",
      label: "Safety and missing-data detection",
      stage: "available_now",
      datasetBoundary: "Use seeded synthetic scenarios with known blockers, warnings, and expected outcomes.",
      targetMetric: "scenario pass rate, blocker recall, warning precision, false-ready rate",
      productionClaimAllowed: false
    },
    {
      id: "reviewer-decision-support",
      label: "Reviewer decision support calibration",
      stage: "planned",
      datasetBoundary: "Use synthetic decisions and reviewer-authored notes until formal governance permits controlled real-world evaluation.",
      targetMetric: "agreement with reviewer decision, override explanation quality, uncertainty calibration",
      productionClaimAllowed: false
    },
    {
      id: "clinical-model-training",
      label: "Clinical model training or fine-tuning",
      stage: "not_allowed_yet",
      datasetBoundary: "No model training on real patient data is permitted in the current proof system.",
      targetMetric: "not applicable until data governance, safety case, consent, and evaluation protocol exist",
      productionClaimAllowed: false
    }
  ];

  return {
    artifactType: "aksh-uk-eu-research-evaluation-boundary",
    inspiredBy: "PyHealth-style dataset/task/model/metric separation",
    syntheticOnly: true,
    realPatientData: false,
    liveModelDeployment: false,
    productionClinicalAiClaim: false,
    defaultEvaluationEnvironment: "offline_research_rehearsal",
    currentDatasetSources: [
      "Synthetic ReviewCase records",
      "Simulated patient profiles",
      "Expected benchmark outcomes",
      "Frozen evidence artifacts",
      "Reviewer field-change history and notes"
    ],
    futureArchitectureBoundary: [
      "Keep research evaluation outside the production review workflow.",
      "Treat model outputs as offline evidence until clinical governance approves any active use.",
      "Version datasets, task definitions, metrics, prompts, and model artifacts separately.",
      "Require calibration, explainability, clinical safety review, and bias analysis before any production AI claim."
    ],
    tasks,
    notYet: [
      "No real patient data model training.",
      "No autonomous clinical decisioning.",
      "No production clinical AI safety claim.",
      "No live model deployment into reviewer workflow.",
      "No health system/EHR integration dependency."
    ]
  };
}

export function buildResearchEvaluationArtifact(options?: { generatedAt?: string; generatedBy?: string }): ResearchEvaluationArtifact {
  const generatedAt = options?.generatedAt ?? new Date().toISOString();
  const generatedBy = options?.generatedBy ?? "Aksh Health Platform";
  const plan = getResearchEvaluationPlan();
  const availableTasks = plan.tasks.filter((task) => task.stage === "available_now").length;
  const plannedTasks = plan.tasks.filter((task) => task.stage === "planned").length;
  const blockedTasks = plan.tasks.filter((task) => task.stage === "not_allowed_yet").length;

  return {
    ...plan,
    generatedAt,
    generatedBy,
    exportPurpose: "offline_research_evaluation_boundary",
    summary: {
      totalTasks: plan.tasks.length,
      availableTasks,
      plannedTasks,
      blockedTasks,
      datasetSources: plan.currentDatasetSources.length,
      notYetClaims: plan.notYet.length
    }
  };
}
