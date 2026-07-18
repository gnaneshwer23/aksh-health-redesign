import { z } from "zod";

/**
 * Federated research job stub — Phase 3 scaffolding.
 * Synthetic cohort aggregates only. No patient-level export by default.
 * Ethics gate must be true to create jobs that claim research readiness.
 */

export const FEDERATED_ETHICS_GATE_ENV = "FEDERATED_RESEARCH_ETHICS_APPROVED";

export type FederatedJobStatus = "queued" | "running" | "completed" | "blocked_ethics";

export type FederatedAggregate = {
  cohortSizeSynthetic: number;
  meanOracleScore: number;
  highRiskSharePercent: number;
  sitesParticipating: number;
  note: string;
};

export type FederatedResearchJob = {
  id: string;
  title: string;
  status: FederatedJobStatus;
  ethicsGatePassed: boolean;
  patientLevelExport: false;
  syntheticAggregatesOnly: true;
  aggregate: FederatedAggregate | null;
  createdAt: string;
  completedAt: string | null;
  limitations: string[];
};

export const createFederatedJobSchema = z.object({
  title: z.string().min(3).max(200),
  /** Caller asserts ethics approval — still blocked unless env gate is set. */
  ethicsApprovedClaim: z.boolean().default(false)
});

const jobStore = new Map<string, FederatedResearchJob>();

let jobSeq = 0;

export function isFederatedEthicsGateOpen(): boolean {
  const raw = process.env[FEDERATED_ETHICS_GATE_ENV]?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

export function getFederatedResearchStatus() {
  const ethicsGatePassed = isFederatedEthicsGateOpen();
  return {
    available: true,
    syntheticAggregatesOnly: true as const,
    patientLevelExportDefault: false as const,
    ethicsGateEnv: FEDERATED_ETHICS_GATE_ENV,
    ethicsGatePassed,
    note: ethicsGatePassed
      ? "Ethics gate env set — jobs may complete with synthetic aggregates only. Still not live federated learning infra."
      : "Ethics gate closed — job creation returns blocked_ethics unless FEDERATED_RESEARCH_ETHICS_APPROVED=true. No patient-level export.",
    liveFederatedLearning: false as const,
    ehrWrite: false as const
  };
}

function buildSyntheticAggregate(): FederatedAggregate {
  return {
    cohortSizeSynthetic: 1240,
    meanOracleScore: 41.2,
    highRiskSharePercent: 18,
    sitesParticipating: 3,
    note: "Synthetic ICS-style aggregate — not a live federated training round."
  };
}

export function listFederatedJobs(): FederatedResearchJob[] {
  return [...jobStore.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createFederatedJob(input: {
  title: string;
  ethicsApprovedClaim?: boolean;
}): FederatedResearchJob {
  const ethicsGatePassed = isFederatedEthicsGateOpen() && Boolean(input.ethicsApprovedClaim);
  jobSeq += 1;
  const id = `fed-job-${Date.now()}-${jobSeq}`;
  const createdAt = new Date().toISOString();

  if (!ethicsGatePassed) {
    const blocked: FederatedResearchJob = {
      id,
      title: input.title,
      status: "blocked_ethics",
      ethicsGatePassed: false,
      patientLevelExport: false,
      syntheticAggregatesOnly: true,
      aggregate: null,
      createdAt,
      completedAt: null,
      limitations: [
        "Ethics gate blocked this job — set FEDERATED_RESEARCH_ETHICS_APPROVED=true and pass ethicsApprovedClaim:true.",
        "No patient-level export by default.",
        "Not live federated learning infrastructure."
      ]
    };
    jobStore.set(id, blocked);
    return blocked;
  }

  const completed: FederatedResearchJob = {
    id,
    title: input.title,
    status: "completed",
    ethicsGatePassed: true,
    patientLevelExport: false,
    syntheticAggregatesOnly: true,
    aggregate: buildSyntheticAggregate(),
    createdAt,
    completedAt: createdAt,
    limitations: [
      "Synthetic cohort aggregates only — not a multi-site FL round on real PHI.",
      "patientLevelExport: false by default.",
      "Not approved for publication or MHRA/DTAC claims."
    ]
  };
  jobStore.set(id, completed);
  return completed;
}

/** Test helper — clear in-memory jobs between unit runs. */
export function resetFederatedJobStoreForTests() {
  jobStore.clear();
  jobSeq = 0;
}
