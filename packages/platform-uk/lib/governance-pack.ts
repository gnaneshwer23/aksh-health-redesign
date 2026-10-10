import type { ReviewCase } from "./types";
import { getResearchEvaluationPlan, type ResearchEvaluationPlan } from "./research-evaluation-plan";
import {
  deriveClinicalRuleResults,
  deriveFinalizationState,
  deriveScenarioBenchmark,
  deriveValidationDossierAnalytics,
  deriveValidationProtocolAnalytics
} from "./workflow";

export type GovernancePackHazard = {
  id: string;
  title: string;
  severity: "low" | "medium" | "high";
  status: "controlled_in_synthetic_proof" | "needs_safety_owner" | "not_started";
  evidence: string;
  requiredControl: string;
};

export type GovernancePack = {
  artifactType: "aksh-uk-eu-governance-pack";
  syntheticOnly: true;
  productionClinicalSafetyCase: false;
  signedClinicalSafetyOfficer: false;
  realPatientData: false;
  externalNhsIntegration: false;
  liveModelDeployment: false;
  operatingModel: "own-system synthetic clinical proof";
  summary: {
    totalCases: number;
    blockedCases: number;
    highImpactClinicalRules: number;
    benchmarkPassRate: number;
    averageValidationScore: number;
    strongDossiers: number;
    incompleteDossiers: number;
    hazards: number;
    hazardsNeedingOwner: number;
  };
  researchEvaluation: ResearchEvaluationPlan;
  safetyCaseSections: string[];
  hazards: GovernancePackHazard[];
  productionReadinessGaps: string[];
};

export function buildGovernancePack(cases: ReviewCase[]): GovernancePack {
  const clinicalRules = cases.flatMap((reviewCase) => deriveClinicalRuleResults(reviewCase));
  const highImpactRules = clinicalRules.filter((rule) => rule.severity === "high");
  const blockedCases = cases.filter((reviewCase) => deriveFinalizationState(reviewCase) === "blocked");
  const benchmark = deriveScenarioBenchmark(cases);
  const protocol = deriveValidationProtocolAnalytics(cases);
  const dossier = deriveValidationDossierAnalytics(cases);
  const researchEvaluation = getResearchEvaluationPlan();

  const hazards: GovernancePackHazard[] = [
    {
      id: "haz-medication-conflict",
      title: "Medication conflict or allergy risk is finalized without clinician review",
      severity: highImpactRules.some((rule) => rule.category === "medication_risk") ? "high" : "medium",
      status: "controlled_in_synthetic_proof",
      evidence: "High-severity medication and allergy rules create cannot-finalize blockers and reviewer override requirements.",
      requiredControl: "Named safety owner must review medication-risk rules before any production clinical use."
    },
    {
      id: "haz-missing-vitals",
      title: "Missing required observations are hidden in a structured draft",
      severity: highImpactRules.some((rule) => rule.category === "missing_data") ? "high" : "medium",
      status: "controlled_in_synthetic_proof",
      evidence: "Missing required observations are surfaced as safety/validation blockers and shown in evidence reports.",
      requiredControl: "Define production minimum data sets per pathway before live use."
    },
    {
      id: "haz-source-quality",
      title: "Low-confidence source input produces a misleading structured draft",
      severity: "medium",
      status: "controlled_in_synthetic_proof",
      evidence: "Transcript/source confidence is carried into safety flags, generation trace, and reviewer evidence.",
      requiredControl: "Set production confidence thresholds and escalation handling with clinical safety officer sign-off."
    },
    {
      id: "haz-governance-overclaim",
      title: "Synthetic proof is mistaken for production clinical safety assurance",
      severity: "high",
      status: "needs_safety_owner",
      evidence: "All current artifacts are labelled synthetic-only and not production clinical software.",
      requiredControl: "Create signed clinical safety case, hazard log ownership, safety incident workflow, and release approvals."
    },
    {
      id: "haz-own-system-boundary",
      title: "Own-system records are treated as externally integrated records",
      severity: "medium",
      status: "needs_safety_owner",
      evidence: "Current architecture uses internal synthetic records and evidence exports; no live health system/EHR writeback is enabled.",
      requiredControl: "Document own-system record lifecycle, retention, access, audit, and downstream export rules before production."
    }
  ];

  return {
    artifactType: "aksh-uk-eu-governance-pack",
    syntheticOnly: true,
    productionClinicalSafetyCase: false,
    signedClinicalSafetyOfficer: false,
    realPatientData: false,
    externalNhsIntegration: false,
    liveModelDeployment: false,
    operatingModel: "own-system synthetic clinical proof",
    summary: {
      totalCases: cases.length,
      blockedCases: blockedCases.length,
      highImpactClinicalRules: highImpactRules.length,
      benchmarkPassRate: benchmark.total ? Math.round((benchmark.passed / benchmark.total) * 100) : 0,
      averageValidationScore: protocol.averageOverallScore,
      strongDossiers: dossier.strongDossiers,
      incompleteDossiers: dossier.incompleteDossiers,
      hazards: hazards.length,
      hazardsNeedingOwner: hazards.filter((hazard) => hazard.status === "needs_safety_owner").length
    },
    researchEvaluation,
    safetyCaseSections: [
      "System scope and intended use",
      "Synthetic patient cohort definition",
      "Clinical risk management plan",
      "Hazard log and mitigations",
      "Reviewer accountability and override governance",
      "Evidence artifact and audit trail controls",
      "Own-system data lifecycle and access model",
      "Research evaluation and model-output boundary",
      "Release gate, incident, and rollback process"
    ],
    hazards,
    productionReadinessGaps: [
      "Named clinical safety officer sign-off",
      "Formal clinical safety case standard-style hazard log ownership",
      "Production data protection impact assessment",
      "Role-based access control and audit integrity",
      "Offline ML/research evaluation protocol and model-output governance",
      "Incident reporting and rollback workflow",
      "Clinical validation protocol with real-world governance approval"
    ]
  };
}
