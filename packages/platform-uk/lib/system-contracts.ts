import { getIntegrationAdapterRegistry } from "./integration-config";

export type OwnSystemContract = {
  id: string;
  label: string;
  status: "available" | "planned" | "disabled";
  boundary: string;
  evidenceRoute?: string;
};

export type DatabaseAdapterContract = {
  id: "json_file_repository" | "planned_database_repository";
  label: string;
  status: "active" | "planned";
  enabled: boolean;
  sourceOfTruth: boolean;
  storageBoundary: string;
  contractRole: string;
  supports: string[];
  mustPreserve: string[];
  notYet: string[];
};

export function getOwnSystemInterfaceContracts(): OwnSystemContract[] {
  return [
    {
      id: "review-case-store",
      label: "Own-system review case store",
      status: "available",
      boundary: "JSON-backed synthetic review cases are the current source of truth for proof work.",
      evidenceRoute: "/api/review-cases"
    },
    {
      id: "simulated-patient-registry",
      label: "Simulated patient registry",
      status: "available",
      boundary: "Curated fake longitudinal profiles support realistic testing without real patient records.",
      evidenceRoute: "/review/simulated-patients"
    },
    {
      id: "clinical-governance-pack",
      label: "Clinical governance pack",
      status: "available",
      boundary: "Hazard rehearsal and safety-case sections support production-readiness planning, not signed-off safety claims.",
      evidenceRoute: "/review/governance-pack"
    },
    {
      id: "research-evaluation-boundary",
      label: "Research evaluation boundary",
      status: "planned",
      boundary: "Offline synthetic evaluation can use dataset/task/metric patterns, but no live model deployment or production clinical AI claim is enabled.",
      evidenceRoute: "/review/governance-pack"
    },
    {
      id: "fhir-shaped-export",
      label: "FHIR-shaped evidence export",
      status: "available",
      boundary: "Internal evidence/export shape only; not live health system/EHR writeback.",
      evidenceRoute: "/api/evidence/registry"
    },
    {
      id: "external-ehr-adapters",
      label: "External EHR adapters",
      status: "disabled",
      boundary: "External health system/EHR integration is not part of the current own-system proof."
    }
  ];
}

export function getDatabaseBoundaryPlan() {
  return {
    artifactType: "aksh-uk-eu-database-boundary-plan",
    currentAdapter: "json_file_repository",
    productionAdapter: "planned_database_repository",
    currentStatus: "proof_only",
    defaultSourceOfTruth: "data/*.json scoped stores",
    migrationPrinciples: [
      "Keep ReviewCase, feedback, roadmap, sign-off, and readiness repository contracts stable.",
      "Introduce database-backed adapters behind existing repository functions.",
      "Preserve deterministic seed/reset behavior for synthetic demos.",
      "Keep synthetic and any future controlled datasets separated by environment and access policy.",
      "Add audit integrity checks before any production clinical claim."
    ],
    notYet: [
      "No production database is configured.",
      "No real patient data should be stored.",
      "No multi-tenant access model is production-ready.",
      "No production backup, restore, retention, or audit integrity process is signed off."
    ]
  };
}

export function buildDatabaseAdapterContract() {
  const currentAdapter: DatabaseAdapterContract = {
    id: "json_file_repository",
    label: "JSON file repository",
    status: "active",
    enabled: true,
    sourceOfTruth: true,
    storageBoundary: "data/*.json scoped stores",
    contractRole: "Default proof adapter for synthetic review cases, roadmap state, feedback, sign-off, and readiness evidence.",
    supports: [
      "read_all_review_cases",
      "read_review_case_by_id",
      "create_review_case",
      "update_review_case",
      "reset_seed_cases",
      "scope_key_isolation",
      "user_id_ownership_checks",
      "frozen_artifact_persistence"
    ],
    mustPreserve: [
      "Deterministic seed/reset behavior for clean demos.",
      "ReviewCase shape and frozen artifact payloads.",
      "Audit events, field changes, reviewer decisions, and validation history.",
      "User-scoped proof stores without deleting scoped session files automatically."
    ],
    notYet: [
      "Not a production clinical database.",
      "Not suitable for real patient data.",
      "No production backup, restore, retention, or audit-integrity guarantees."
    ]
  };

  const plannedAdapter: DatabaseAdapterContract = {
    id: "planned_database_repository",
    label: "Planned database repository",
    status: "planned",
    enabled: false,
    sourceOfTruth: false,
    storageBoundary: "Future database adapter behind the same repository function contracts.",
    contractRole: "Future production-readiness adapter; not configured in the synthetic proof build.",
    supports: [
      "repository_contract_parity",
      "transactional_case_updates",
      "audit_integrity_checks",
      "environment_separated_datasets",
      "backup_restore_policy",
      "retention_policy"
    ],
    mustPreserve: [
      "Current repository function names and return shapes.",
      "Synthetic seed/reset capability in demo environments.",
      "Explicit separation between synthetic proof data and any future controlled datasets.",
      "Human reviewer decision and frozen evidence artifact semantics."
    ],
    notYet: [
      "No database URL is required for this build.",
      "No production schema migration has been run.",
      "No real patient dataset is allowed.",
      "No production access-control model is signed off."
    ]
  };

  return {
    artifactType: "aksh-uk-eu-database-adapter-contract",
    syntheticOnly: true,
    realPatientData: false,
    productionDatabaseConfigured: false,
    activeAdapter: currentAdapter.id,
    adapterResolutionModule: "lib/storage/get-review-case-repository-adapter.ts",
    defaultSourceOfTruth: currentAdapter.id,
    migrationStatus: "contract_defined_json_active_database_planned",
    adapters: [currentAdapter, plannedAdapter],
    repositoryInterface: [
      {
        operation: "readReviewCases",
        contract: "Returns all cases for a scope, reseeding missing synthetic fixtures when needed."
      },
      {
        operation: "readReviewCaseById",
        contract: "Returns one case or null and enforces optional user ownership checks."
      },
      {
        operation: "writeReviewCases",
        contract: "Persists a complete scoped case collection without changing ReviewCase shape."
      },
      {
        operation: "updateReviewCase",
        contract: "Persists one updated case and preserves ownership validation."
      },
      {
        operation: "createReviewCase",
        contract: "Creates a scoped synthetic case and assigns an explicit user owner."
      },
      {
        operation: "resetReviewCases",
        contract: "Restores seeded synthetic cases for the chosen scope."
      }
    ],
    requiredParityChecks: [
      {
        id: "scoped_round_trip",
        behavior: "A repository adapter must write and read cases by scope without leaking cases into other scopes."
      },
      {
        id: "seed_rehydration",
        behavior: "A repository adapter must restore missing synthetic seed cases when reading an incomplete proof store."
      },
      {
        id: "create_assigns_owner_and_prepends",
        behavior: "A repository adapter must assign an explicit owner on create and place the created case first."
      },
      {
        id: "read_enforces_optional_ownership",
        behavior: "A repository adapter must return owned cases and reject reads when a different user is supplied."
      },
      {
        id: "update_persists_review_state",
        behavior: "A repository adapter must persist status, reviewer decision metadata, and frozen evidence artifacts."
      },
      {
        id: "update_blocks_wrong_owner",
        behavior: "A repository adapter must reject updates when the supplied user does not own the case."
      },
      {
        id: "reset_restores_seed_cases",
        behavior: "A repository adapter must reset the selected proof scope back to deterministic synthetic seed cases."
      }
    ],
    acceptanceCriteria: [
      "`json_file_repository` remains the default adapter until a database adapter passes parity tests.",
      "A future database adapter must satisfy the same repository operations before UI routes switch to it.",
      "No live patient data, health system integration, or production clinical claim is unlocked by this contract.",
      "Demo seed/reset behavior must remain available after any storage migration."
    ]
  };
}

export function buildOwnSystemBoundaryContract() {
  const databaseBoundary = getDatabaseBoundaryPlan();
  const databaseAdapterContract = buildDatabaseAdapterContract();
  const interfaceContracts = getOwnSystemInterfaceContracts();
  const externalAdapters = getIntegrationAdapterRegistry()
    .filter((adapter) => adapter.id !== "fhir-export")
    .map((adapter) => ({
      id: adapter.id,
      label: adapter.label,
      status: adapter.status,
      enabled: adapter.enabled,
      defaultMode: adapter.defaultMode,
      boundary: adapter.boundary
    }));

  return {
    artifactType: "aksh-uk-eu-own-system-boundary-contract",
    syntheticOnly: true,
    realPatientData: false,
    liveNhsIntegration: false,
    productionClinicalSoftware: false,
    productionClinicalAi: false,
    productionDatabase: false,
    autonomousClinicalDecisioning: false,
    defaultSourceOfTruth: databaseBoundary.currentAdapter,
    currentPersistence: databaseBoundary.defaultSourceOfTruth,
    plannedProductionAdapter: databaseBoundary.productionAdapter,
    databaseAdapterContract: {
      artifactType: databaseAdapterContract.artifactType,
      activeAdapter: databaseAdapterContract.activeAdapter,
      productionDatabaseConfigured: databaseAdapterContract.productionDatabaseConfigured,
      migrationStatus: databaseAdapterContract.migrationStatus
    },
    interfaceContracts,
    externalAdapters,
    blockedClaims: [
      "Live health system/EHR integration",
      "Real patient data handling",
      "Production clinical software",
      "Production clinical AI",
      "Production database readiness",
      "Autonomous clinical decisioning"
    ],
    requiredProofBoundaries: [
      "JSON file repositories remain the proof source of truth.",
      "Synthetic patient profiles are not real patient records.",
      "External adapters are disabled, planned, or explicitly flag-gated.",
      "FHIR-shaped exports are internal evidence artifacts, not writeback integration.",
      "Reviewer decisions remain human-governed; the system does not autonomously finalize care."
    ]
  };
}
