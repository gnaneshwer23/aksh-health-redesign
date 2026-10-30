/**
 * P2-INTAKE-01 — optional CONDUCTOR after classic intake.
 *
 * Default OFF (`ENABLE_CONDUCTOR_FROM_INTAKE` unset/false). When enabled and the
 * caller opts in, runs the canonical clinical-spine CONDUCTOR with existing
 * Guardian / honesty gates. Never auto-accepts drafts; never weakens SHIELD.
 * Evaluation-only posture: ehrWrite remains false.
 */
import { runClinicalSpineOrchestrate } from "@/lib/clinical-spine/orchestrate";
import { correlateCareEpisodeStage } from "@/lib/care-episode";
import { isConductorFromIntakeEnabled } from "@/lib/integration-config";

export type ConductorFromIntakeOffer = {
  available: boolean;
  enabled: boolean;
  ran: boolean;
  evaluationOnly: true;
  ehrWrite: false;
  careEpisodeId?: string;
  orchestrate?: Awaited<ReturnType<typeof runClinicalSpineOrchestrate>> & {
    careEpisodeId?: string;
  };
  reason?: string;
};

/**
 * Offer or run CONDUCTOR after intake case create.
 * - Flag off → available:false (safe default).
 * - Flag on, opt-in false → available:true, ran:false (UI can offer).
 * - Flag on + orchestrateAfterIntake → run CONDUCTOR (Guardian gates intact).
 */
export async function maybeConductorFromIntake(input: {
  patientId?: string;
  careEpisodeId?: string;
  caseId?: string;
  transcript?: string;
  actor: string;
  scopeKey: string;
  orchestrateAfterIntake?: boolean;
}): Promise<ConductorFromIntakeOffer> {
  const enabled = isConductorFromIntakeEnabled();
  if (!enabled) {
    return {
      available: false,
      enabled: false,
      ran: false,
      evaluationOnly: true,
      ehrWrite: false,
      reason: "ENABLE_CONDUCTOR_FROM_INTAKE is off (default).",
    };
  }

  if (!input.orchestrateAfterIntake) {
    return {
      available: true,
      enabled: true,
      ran: false,
      evaluationOnly: true,
      ehrWrite: false,
      careEpisodeId: input.careEpisodeId,
      reason: "Flag on — pass orchestrateAfterIntake:true to run CONDUCTOR (evaluation only).",
    };
  }

  const patientId = input.patientId?.trim();
  if (!patientId) {
    return {
      available: true,
      enabled: true,
      ran: false,
      evaluationOnly: true,
      ehrWrite: false,
      careEpisodeId: input.careEpisodeId,
      reason: "patientId required to run CONDUCTOR from intake.",
    };
  }

  const result = await runClinicalSpineOrchestrate({
    patientId,
    transcript: input.transcript,
    includeDrAssist: false,
    includeNexus: true,
    includeTwinRanking: true,
    caseId: input.caseId,
    actor: input.actor,
  });

  if (
    result.ehrWrite !== false ||
    result.physiologicalTwin !== false ||
    result.autoRetrain !== false ||
    result.liveEmis !== false
  ) {
    throw new Error("Honesty invariants violated — refusing CONDUCTOR-from-intake.");
  }

  const correlated = await correlateCareEpisodeStage({
    patientId,
    actor: input.actor,
    scopeKey: input.scopeKey,
    careEpisodeId: input.careEpisodeId,
    stage: "orchestrate",
    linkId: input.caseId ?? `intake-orch-${patientId}`,
    linkLabel: "CONDUCTOR from intake (evaluation)",
  });

  return {
    available: true,
    enabled: true,
    ran: true,
    evaluationOnly: true,
    ehrWrite: false,
    careEpisodeId: correlated.careEpisodeId,
    orchestrate: {
      ...result,
      careEpisodeId: correlated.careEpisodeId,
    },
  };
}
