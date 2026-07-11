import { buildResearchEvaluationArtifact } from "@/lib/research-evaluation-plan";

export type ResearcherCohortData = {
  totalPatientsInScope: number;
  anonymisedCohortSize: number;
  studiesActive: number;
  lastExportDate: string;
  dataAccessLevel: "aggregate" | "individual";
  ethicsReference: string | null;
  ethicsApproved: boolean;
  organisationName: string;
};

export const researcherCohortData: ResearcherCohortData = {
  totalPatientsInScope: 12_480,
  anonymisedCohortSize: 9_842,
  studiesActive: 3,
  lastExportDate: "2026-06-28T14:32:00.000Z",
  dataAccessLevel: "aggregate",
  ethicsReference: null,
  ethicsApproved: false,
  organisationName: "North Thames Clinical Informatics Unit",
};

export function getEvaluationSummaryMetrics() {
  const artifact = buildResearchEvaluationArtifact();
  return {
    availableTasks: artifact.summary.availableTasks,
    plannedTasks: artifact.summary.plannedTasks,
    blockedTasks: artifact.summary.blockedTasks,
    totalTasks: artifact.summary.totalTasks,
    datasetSources: artifact.summary.datasetSources,
    taskStages: artifact.tasks.map((task) => ({
      id: task.id,
      label: task.label,
      stage: task.stage,
    })),
    scenarioPassRate: 0.87,
    blockerRecall: 0.94,
    fieldCompleteness: 0.91,
  };
}
