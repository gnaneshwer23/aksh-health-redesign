/**
 * Maps onboarding checkbox consents → purpose/modality grants in the PH consent registry.
 * Same store as `/api/consent/grants` — not a parallel consent product.
 * Always ehrWrite:false · hitlRequired:true · no live twin / EMIS claims.
 */

import type { UserRole } from "@/lib/onboarding/roles";
import {
  type ConsentGrant,
  type ConsentGrantInput,
  type PurposeCode
} from "@/lib/precision-health/consent";
import type { ModalityId } from "@/lib/precision-health/modalities";
import { upsertConsentGrant } from "@/lib/repositories/consent-grant-repository";

const CLINICAL_MODALITIES: ModalityId[] = ["clinical", "lab"];
const CARE_MODALITIES: ModalityId[] = ["clinical", "lab", "lifestyle"];
const COACHING_MODALITIES: ModalityId[] = ["lifestyle", "wearable"];
const POPULATION_MODALITIES: ModalityId[] = ["clinical", "environment"];
const RESEARCH_MODALITIES: ModalityId[] = ["clinical", "lab", "omics_meta"];

export type OnboardingConsentSyncResult = {
  subjectId: string;
  grantsCreated: number;
  purposes: PurposeCode[];
  grants: ConsentGrant[];
  ehrWrite: false;
  note: string;
};

function truthy(consents: Record<string, unknown>, key: string): boolean {
  return consents[key] === true;
}

/** Stable registry subject for this user — scoped grants live under this id. */
export function resolveOnboardingSubjectId(userId: string): string {
  const safe = userId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48);
  return `user-${safe || "unknown"}`;
}

/**
 * Pure mapping: onboarding checkboxes → purpose-bound grant inputs.
 * Returns empty when nothing maps (e.g. empty consents).
 */
export function mapOnboardingConsentsToGrantInputs(options: {
  role: UserRole;
  userId: string;
  consents: Record<string, unknown>;
  actor: string;
}): ConsentGrantInput[] {
  const { role, userId, consents, actor } = options;
  const patientId = resolveOnboardingSubjectId(userId);
  const inputs: ConsentGrantInput[] = [];

  const push = (
    purposeCode: PurposeCode,
    modalities: ModalityId[],
    notes: string,
    when: boolean
  ) => {
    if (!when) return;
    inputs.push({
      patientId,
      purposeCode,
      modalities,
      grantedBy: actor,
      notes
    });
  };

  const fromOnboarding = "Synced from onboarding consent step — scaffolding only; ehrWrite:false.";

  switch (role) {
    case "patient":
      push(
        "care_delivery",
        CARE_MODALITIES,
        `${fromOnboarding} Patient care-contact / GP-approval acknowledgements.`,
        truthy(consents, "healthContact") ||
          truthy(consents, "gpApproval") ||
          truthy(consents, "careImprovement")
      );
      push(
        "care_improvement",
        CLINICAL_MODALITIES,
        `${fromOnboarding} Optional care-improvement learning (no auto-retrain).`,
        truthy(consents, "careImprovement")
      );
      push(
        "coaching_wellness",
        COACHING_MODALITIES,
        `${fromOnboarding} Optional voice check-in / wellness coaching drafts.`,
        truthy(consents, "voiceCalls")
      );
      break;

    case "gp":
    case "nurse":
    case "clinical-pharmacist":
      push(
        "care_delivery",
        CLINICAL_MODALITIES,
        `${fromOnboarding} Clinician AI documentation + HITL acknowledgement.`,
        truthy(consents, "aiDocumentation") || truthy(consents, "hitlApproval")
      );
      push(
        "care_improvement",
        CLINICAL_MODALITIES,
        `${fromOnboarding} Optional anonymised outcome learning (no auto-retrain).`,
        truthy(consents, "anonymisedOutcomes")
      );
      push(
        "risk_stratification_demo",
        CLINICAL_MODALITIES,
        `${fromOnboarding} ORACLE / risk demos on synthetic or consented pilot data.`,
        truthy(consents, "hitlApproval")
      );
      break;

    case "practice-manager":
      push(
        "care_delivery",
        CLINICAL_MODALITIES,
        `${fromOnboarding} Practice DPA / DSPT controller acknowledgements.`,
        truthy(consents, "dpa") || truthy(consents, "dspt")
      );
      push(
        "population_analytics",
        POPULATION_MODALITIES,
        `${fromOnboarding} EHR integration intent recorded — liveEmis remains false until partner go/no-go.`,
        truthy(consents, "ehrIntegration")
      );
      break;

    case "ics-lead":
      push(
        "population_analytics",
        POPULATION_MODALITIES,
        `${fromOnboarding} ICS data-sharing / pseudonymised population analytics.`,
        truthy(consents, "dataSharing") || truthy(consents, "pseudonymised")
      );
      push(
        "care_improvement",
        CLINICAL_MODALITIES,
        `${fromOnboarding} Pilot evaluation learning boundary.`,
        truthy(consents, "pilotEvaluation")
      );
      break;

    case "hospital-executive":
      push(
        "care_delivery",
        CLINICAL_MODALITIES,
        `${fromOnboarding} Enterprise DPA / controller acknowledgements.`,
        truthy(consents, "enterpriseDpa") || truthy(consents, "gdprController")
      );
      break;

    case "researcher":
      push(
        "clinical_research_deidentified",
        RESEARCH_MODALITIES,
        `${fromOnboarding} Research governance / ethics acknowledgements.`,
        truthy(consents, "dataGovernance") || truthy(consents, "ethicsCompliance")
      );
      break;

    default:
      break;
  }

  return inputs;
}

/**
 * Writes mapped grants into the shared consent registry (file/Postgres via repository).
 * Non-throwing for empty maps; callers should not block onboarding on registry failure.
 */
export async function syncOnboardingConsentsToRegistry(options: {
  role: UserRole;
  userId: string;
  consents: Record<string, unknown>;
  actor: string;
  scopeKey: string;
}): Promise<OnboardingConsentSyncResult> {
  const inputs = mapOnboardingConsentsToGrantInputs(options);
  const subjectId = resolveOnboardingSubjectId(options.userId);
  const grants: ConsentGrant[] = [];
  const purposes: PurposeCode[] = [];

  for (const input of inputs) {
    const { grant } = await upsertConsentGrant(input, {
      scopeKey: options.scopeKey,
      actor: options.actor
    });
    grants.push(grant);
    if (!purposes.includes(grant.purposeCode)) {
      purposes.push(grant.purposeCode);
    }
  }

  return {
    subjectId,
    grantsCreated: grants.length,
    purposes,
    grants,
    ehrWrite: false,
    note:
      "Onboarding checkboxes mirrored into purpose/modality consent registry. Does not enable live EMR write-back or physiological twin."
  };
}
