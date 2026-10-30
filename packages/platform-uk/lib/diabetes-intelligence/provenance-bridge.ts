/**
 * INT-13 — unified provenance vocabulary for Connected Diabetes Intelligence.
 *
 * Domain modules historically used different shapes:
 * - Patient 360 / glucose: `{ sourceSystem, confidence, recordedAt }`
 * - Agent intelligence: `InformationProvenance` enum
 * - Facades: entry-surface / store tags (`journey_hitl`, `medcare_template`, …)
 *
 * This bridge normalises reads into a single envelope without rewriting
 * physical stores or activating live EHR provenance.
 */

import type { Provenance as SpineProvenance } from "@/lib/patient-intelligence/types";
import type { InformationProvenance } from "./agent-intel-types";

export type ConnectedProvenanceKind =
  | "ai_generated"
  | "clinician_verified"
  | "source_system"
  | "synthetic_fixture"
  | "journey_hitl"
  | "medcare_template"
  | "continuous_care_ops"
  | "patient360_entry"
  | "medcare_entry"
  | "shared_canonical";

export type ConnectedProvenance = {
  /** Canonical kind used across modules / timeline / facades. */
  kind: ConnectedProvenanceKind;
  /** Spine-compatible source system string (never empty). */
  sourceSystem: string;
  sourceReference?: string;
  confidence: number;
  recordedAt: string;
  /** True when content is AI-drafted and not clinician-verified. */
  aiGenerated: boolean;
  /** True when a clinician Accept/Edit verified the artifact (not the EHR). */
  clinicianVerified: boolean;
  /** Honesty: connected diabetes remains synthetic / simulation. */
  synthetic: true;
  ehrWrite: false;
};

const KIND_TO_SOURCE: Record<ConnectedProvenanceKind, string> = {
  ai_generated: "agent_intelligence_draft",
  clinician_verified: "clinician_hitl_decision",
  source_system: "source_system",
  synthetic_fixture: "synthetic_fixture",
  journey_hitl: "diabetes_journey_hitl",
  medcare_template: "medication_care_template",
  continuous_care_ops: "continuous_care_ops",
  patient360_entry: "patient_360_entry",
  medcare_entry: "medication_care_entry",
  shared_canonical: "connected_diabetes_canonical",
};

export function fromAgentProvenance(
  provenance: InformationProvenance,
  recordedAt: string,
  opts?: { sourceReference?: string; confidence?: number }
): ConnectedProvenance {
  const kind = provenance as ConnectedProvenanceKind;
  return {
    kind,
    sourceSystem: KIND_TO_SOURCE[kind] ?? provenance,
    sourceReference: opts?.sourceReference,
    confidence: opts?.confidence ?? (provenance === "clinician_verified" ? 0.95 : 0.55),
    recordedAt,
    aiGenerated: provenance === "ai_generated",
    clinicianVerified: provenance === "clinician_verified",
    synthetic: true,
    ehrWrite: false,
  };
}

export function fromSpineProvenance(
  provenance: SpineProvenance,
  kind: ConnectedProvenanceKind = "source_system"
): ConnectedProvenance {
  return {
    kind,
    sourceSystem: provenance.sourceSystem || KIND_TO_SOURCE[kind],
    sourceReference: provenance.sourceReference,
    confidence: provenance.confidence,
    recordedAt: provenance.recordedAt,
    aiGenerated: kind === "ai_generated",
    clinicianVerified: kind === "clinician_verified",
    synthetic: true,
    ehrWrite: false,
  };
}

export function fromGlucoseSourceSystem(
  sourceSystem: string,
  recordedAt: string,
  confidence = 0.8
): ConnectedProvenance {
  const synthetic =
    /synthetic|fixture|seed|demo/i.test(sourceSystem) || sourceSystem.startsWith("connected_diabetes");
  return {
    kind: synthetic ? "synthetic_fixture" : "source_system",
    sourceSystem,
    confidence,
    recordedAt,
    aiGenerated: false,
    clinicianVerified: false,
    synthetic: true,
    ehrWrite: false,
  };
}

export function fromFacadeProvenanceTag(
  tag:
    | "journey_hitl"
    | "medcare_template"
    | "continuous_care_ops"
    | "patient360_entry"
    | "medcare_entry"
    | "shared_canonical",
  recordedAt: string
): ConnectedProvenance {
  return {
    kind: tag,
    sourceSystem: KIND_TO_SOURCE[tag],
    confidence: tag === "shared_canonical" ? 0.9 : 0.85,
    recordedAt,
    aiGenerated: false,
    clinicianVerified: tag === "journey_hitl",
    synthetic: true,
    ehrWrite: false,
  };
}

/** Project to Patient 360 / glucose spine shape for shared timeline consumers. */
export function toSpineProvenance(p: ConnectedProvenance): SpineProvenance {
  return {
    sourceSystem: p.sourceSystem,
    sourceReference: p.sourceReference,
    confidence: p.confidence,
    recordedAt: p.recordedAt,
  };
}

/** Project to agent-intel enum when a module only stores the coarse kind. */
export function toAgentProvenance(p: ConnectedProvenance): InformationProvenance {
  if (p.kind === "ai_generated") return "ai_generated";
  if (p.kind === "clinician_verified" || p.clinicianVerified) return "clinician_verified";
  if (p.kind === "synthetic_fixture") return "synthetic_fixture";
  return "source_system";
}
