/**
 * Central agent orchestration contracts — typed I/O, tools, access boundaries,
 * failure / observability / evaluation hooks.
 *
 * Maps the 12 required capabilities onto EXISTING agents (see capabilities.ts).
 * Does not replace CONDUCTOR or diabetes agent-intel; it is the shared contract
 * surface those stacks must honour.
 */

import type { AgentEscalation } from "./types";
import {
  PLATFORM_CAPABILITIES,
  type PlatformCapabilityId,
  type CapabilityAccessBoundary,
} from "./capabilities";
import type { AgentId } from "../register";
import { AGENTS, PROHIBITED_FOR_ALL } from "../register";

export type OrchestrationToolId =
  | "graph_retrieval"
  | "evidence_retrieval"
  | "context_package_assemble"
  | "guardian_gateway_evaluate"
  | "patient_state_read"
  | "lab_snapshot_read"
  | "schedule_slots_read"
  | "review_queue_enqueue"
  | "shield_audit_append"
  | "eval_score_append";

export type OrchestrationToolContract = {
  id: OrchestrationToolId;
  description: string;
  allowedCapabilities: PlatformCapabilityId[];
  sideEffects: "none" | "audit_only" | "queue_draft" | "persist_eval";
  requiresAuthorisedContext: boolean;
};

export const ORCHESTRATION_TOOLS: OrchestrationToolContract[] = [
  {
    id: "graph_retrieval",
    description: "Retrieve GraphRAG / knowledge-graph hits for authorised context",
    allowedCapabilities: ["cds", "clinical_evidence_retrieval", "clinical_context"],
    sideEffects: "none",
    requiresAuthorisedContext: true,
  },
  {
    id: "evidence_retrieval",
    description: "Retrieve guideline / fixture evidence citations",
    allowedCapabilities: ["cds", "clinical_evidence_retrieval"],
    sideEffects: "none",
    requiresAuthorisedContext: true,
  },
  {
    id: "context_package_assemble",
    description: "Assemble signed Clinical Context Package (Context Engine)",
    allowedCapabilities: ["clinical_context", "cds", "guardian_safety"],
    sideEffects: "none",
    requiresAuthorisedContext: true,
  },
  {
    id: "guardian_gateway_evaluate",
    description: "Independent PASS/REVIEW/BLOCK gateway over agent output",
    allowedCapabilities: ["guardian_safety", "medication_safety", "cds"],
    sideEffects: "audit_only",
    requiresAuthorisedContext: true,
  },
  {
    id: "patient_state_read",
    description: "Read append-only patient state facts",
    allowedCapabilities: ["clinical_context", "patient_intake", "cds", "laboratory_intelligence"],
    sideEffects: "none",
    requiresAuthorisedContext: true,
  },
  {
    id: "lab_snapshot_read",
    description: "Read laboratory snapshot / LOINC catalogue facts",
    allowedCapabilities: ["laboratory_intelligence", "cds", "clinical_context"],
    sideEffects: "none",
    requiresAuthorisedContext: true,
  },
  {
    id: "schedule_slots_read",
    description: "Read appointment / slot-fill availability (no live write)",
    allowedCapabilities: ["appointment_workflow", "care_coordination"],
    sideEffects: "none",
    requiresAuthorisedContext: true,
  },
  {
    id: "review_queue_enqueue",
    description: "Enqueue HITL draft for clinician accept/edit/reject",
    allowedCapabilities: [
      "clinical_documentation",
      "cds",
      "medication_safety",
      "care_coordination",
      "patient_intake",
    ],
    sideEffects: "queue_draft",
    requiresAuthorisedContext: true,
  },
  {
    id: "shield_audit_append",
    description: "Append SHIELD / panel audit event",
    allowedCapabilities: ["guardian_safety", "evaluation_quality", "cds", "clinical_documentation"],
    sideEffects: "audit_only",
    requiresAuthorisedContext: false,
  },
  {
    id: "eval_score_append",
    description: "Record evaluation / quality score (offline / governed)",
    allowedCapabilities: ["evaluation_quality"],
    sideEffects: "persist_eval",
    requiresAuthorisedContext: false,
  },
];

export type OrchestrationRequest = {
  requestId: string;
  careEpisodeId?: string;
  patientId: string;
  organisationId?: string;
  scopeKey: string;
  capability: PlatformCapabilityId;
  agents: AgentId[];
  actor: {
    userId: string;
    role: string;
    email?: string;
  };
  input: {
    transcript?: string;
    query?: string;
    proposedDrug?: string;
    idempotencyKey?: string;
    metadata?: Record<string, unknown>;
  };
  safety: {
    liveEmis: false;
    ehrWrite: false;
    autonomousPrescribe: false;
    hitlRequired: true;
  };
};

export type OrchestrationResponse = {
  requestId: string;
  careEpisodeId?: string;
  capability: PlatformCapabilityId;
  status: "completed" | "partial" | "blocked" | "failed";
  escalation: AgentEscalation;
  drafts: Array<{
    draftId: string;
    agent: AgentId;
    kind: string;
    status: "DRAFT";
    hitlRequired: true;
    ehrWrite: false;
  }>;
  toolsUsed: OrchestrationToolId[];
  prohibitedDetected: string[];
  uncertainties: string[];
  missingContext: string[];
  failure?: OrchestrationFailure;
  observability: OrchestrationObservability;
  evaluation: OrchestrationEvalHook;
  access: CapabilityAccessBoundary;
  synthetic: true;
};

export type OrchestrationFailure = {
  code:
    | "AUTH_DENIED"
    | "CAPABILITY_MISMATCH"
    | "AGENT_NOT_ALLOWED"
    | "TOOL_NOT_ALLOWED"
    | "PROHIBITED_ACTION"
    | "GATEWAY_BLOCK"
    | "TIMEOUT"
    | "UPSTREAM"
    | "INVALID_TRANSITION";
  message: string;
  retryable: boolean;
  agentId?: AgentId;
};

export type OrchestrationObservability = {
  correlationId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  modelId?: string;
  modelVersion?: string;
  contextPackageVersion?: string;
  shieldEventId?: string;
  dataSource: "postgres" | "file" | "mock" | "neo4j";
};

export type OrchestrationEvalHook = {
  enqueueEval: true;
  autoRetrain: false;
  modelUpdated: false;
  goldenCaseId?: string;
  scores?: Record<string, number>;
};

export type ValidateOrchestrationResult =
  | { ok: true; capability: (typeof PLATFORM_CAPABILITIES)[number]; agents: AgentId[] }
  | { ok: false; failure: OrchestrationFailure };

export function validateOrchestrationRequest(req: OrchestrationRequest): ValidateOrchestrationResult {
  if (req.safety.liveEmis !== false || req.safety.ehrWrite !== false) {
    return {
      ok: false,
      failure: {
        code: "PROHIBITED_ACTION",
        message: "Orchestration may not enable live EMR write-back.",
        retryable: false,
      },
    };
  }
  if (req.safety.autonomousPrescribe !== false || req.safety.hitlRequired !== true) {
    return {
      ok: false,
      failure: {
        code: "PROHIBITED_ACTION",
        message: "Orchestration requires HITL and forbids autonomous prescribing.",
        retryable: false,
      },
    };
  }

  const capability = PLATFORM_CAPABILITIES.find((c) => c.id === req.capability);
  if (!capability) {
    return {
      ok: false,
      failure: {
        code: "CAPABILITY_MISMATCH",
        message: `Unknown capability: ${req.capability}`,
        retryable: false,
      },
    };
  }

  if (capability.classification === "missing") {
    return {
      ok: false,
      failure: {
        code: "CAPABILITY_MISMATCH",
        message: `Capability ${req.capability} is not implemented.`,
        retryable: false,
      },
    };
  }

  const allowed = new Set<AgentId>([...capability.primaryAgents, "CONDUCTOR", "SHIELD"]);
  for (const agent of req.agents) {
    if (!allowed.has(agent)) {
      return {
        ok: false,
        failure: {
          code: "AGENT_NOT_ALLOWED",
          message: `Agent ${agent} is not mapped to capability ${req.capability}.`,
          retryable: false,
          agentId: agent,
        },
      };
    }
    const contract = AGENTS.find((a) => a.id === agent);
    if (!contract) {
      return {
        ok: false,
        failure: {
          code: "AGENT_NOT_ALLOWED",
          message: `Agent ${agent} is not in the register.`,
          retryable: false,
          agentId: agent,
        },
      };
    }
    if (contract.status === "planned" || contract.trigger === "never") {
      return {
        ok: false,
        failure: {
          code: "AGENT_NOT_ALLOWED",
          message: `Agent ${agent} is planned/never-run and cannot be orchestrated.`,
          retryable: false,
          agentId: agent,
        },
      };
    }
  }

  return { ok: true, capability, agents: req.agents };
}

export function assertToolAllowed(
  toolId: OrchestrationToolId,
  capability: PlatformCapabilityId
): OrchestrationFailure | null {
  const tool = ORCHESTRATION_TOOLS.find((t) => t.id === toolId);
  if (!tool) {
    return {
      code: "TOOL_NOT_ALLOWED",
      message: `Unknown tool: ${toolId}`,
      retryable: false,
    };
  }
  if (!tool.allowedCapabilities.includes(capability)) {
    return {
      code: "TOOL_NOT_ALLOWED",
      message: `Tool ${toolId} is not allowed for capability ${capability}.`,
      retryable: false,
    };
  }
  return null;
}

export function buildFailureResponse(
  req: OrchestrationRequest,
  failure: OrchestrationFailure,
  startedAt: string,
  correlationId: string
): OrchestrationResponse {
  const completedAt = new Date().toISOString();
  const capability = PLATFORM_CAPABILITIES.find((c) => c.id === req.capability);
  return {
    requestId: req.requestId,
    careEpisodeId: req.careEpisodeId,
    capability: req.capability,
    status: failure.code === "GATEWAY_BLOCK" || failure.code === "PROHIBITED_ACTION" ? "blocked" : "failed",
    escalation: failure.code === "GATEWAY_BLOCK" || failure.code === "PROHIBITED_ACTION" ? "BLOCK" : "REVIEW",
    drafts: [],
    toolsUsed: [],
    prohibitedDetected: failure.code === "PROHIBITED_ACTION" ? [failure.message] : [],
    uncertainties: [],
    missingContext: [],
    failure,
    observability: {
      correlationId,
      startedAt,
      completedAt,
      durationMs: Math.max(0, Date.parse(completedAt) - Date.parse(startedAt)),
      dataSource: "mock",
    },
    evaluation: {
      enqueueEval: true,
      autoRetrain: false,
      modelUpdated: false,
    },
    access: capability?.access ?? {
      draftsRequireHitl: true,
      autonomousPrescribe: false,
      liveEhrWrite: false,
      mayBypassAuthOrRules: false,
      readerRoles: [],
      approverRoles: [],
    },
    synthetic: true,
  };
}

export const ORCHESTRATION_PROHIBITED = [
  ...PROHIBITED_FOR_ALL,
  "bypass Guardian gateway",
  "auto-accept drafts",
  "release model without evaluation gate",
] as const;

export function resolveOrchestrationStack(capability: PlatformCapabilityId): {
  stack: "clinical_spine" | "diabetes_agent_intel" | "access_workflow" | "intake" | "eval";
  entrypoints: string[];
} {
  switch (capability) {
    case "patient_intake":
      return {
        stack: "intake",
        entrypoints: ["lib/intake-generation.ts", "lib/workflow/review.ts"],
      };
    case "appointment_workflow":
      return {
        stack: "access_workflow",
        entrypoints: ["lib/access/service.ts"],
      };
    case "evaluation_quality":
      return {
        stack: "eval",
        entrypoints: ["lib/evaluation-engine/index.ts", "lib/eval/score-agents.ts"],
      };
    case "care_coordination":
    case "patient_engagement":
      return {
        stack: "diabetes_agent_intel",
        entrypoints: [
          "lib/diabetes-intelligence/agent-intel-assemble.ts",
          "lib/diabetes-intelligence/connected-journey-orchestrate.ts",
        ],
      };
    case "clinical_documentation":
    case "medication_safety":
    case "cds":
    case "clinical_context":
    case "guardian_safety":
    case "clinical_evidence_retrieval":
    case "laboratory_intelligence":
      return {
        stack: "clinical_spine",
        entrypoints: [
          "lib/clinical-spine/orchestrate.ts",
          "lib/diabetes-intelligence/agent-intel-assemble.ts",
          "lib/clinical-proof/agent-orchestration.ts",
        ],
      };
    default: {
      const _exhaustive: never = capability;
      return _exhaustive;
    }
  }
}
