/**
 * Disease domain plugin registry.
 *
 * Common infrastructure: discover domains, read activation honesty, invoke
 * plugin methods. Disease-specific logic lives only inside each plugin.
 */

import { validationGatesMet } from "./activation";
import { cardiovascularDomain } from "./domains/cardiovascular";
import { chronicKidneyDiseaseDomain } from "./domains/ckd";
import { diabetesMetabolicDomain } from "./domains/diabetes";
import { obesityMetabolicDomain } from "./domains/obesity";
import { listOtherChronicCandidates, otherChronicDomain } from "./domains/other";
import {
  DISEASE_DOMAIN_IDS,
  type DiseaseDomainId,
  type DiseaseDomainPlugin,
  type DomainActivationStatus,
  type DomainResult,
  type DomainRiskEvaluationData,
  type DomainRiskEvaluationInput,
} from "./types";

const BUILTIN_PLUGINS: readonly DiseaseDomainPlugin[] = [
  diabetesMetabolicDomain,
  cardiovascularDomain,
  chronicKidneyDiseaseDomain,
  obesityMetabolicDomain,
  otherChronicDomain,
];

const registry = new Map<DiseaseDomainId, DiseaseDomainPlugin>();

function seedBuiltin(): void {
  if (registry.size > 0) return;
  for (const plugin of BUILTIN_PLUGINS) {
    registry.set(plugin.id, plugin);
  }
}

seedBuiltin();

export type DomainRegistrySummary = {
  domainId: DiseaseDomainId;
  name: string;
  activationStatus: DomainActivationStatus;
  ehrWrite: false;
  autonomousClinicalAction: false;
  validationGatesMet: boolean;
};

/** List all registered domains with honesty summary. */
export function listDiseaseDomains(): DomainRegistrySummary[] {
  seedBuiltin();
  return DISEASE_DOMAIN_IDS.map((id) => {
    const plugin = registry.get(id)!;
    return {
      domainId: plugin.id,
      name: plugin.name,
      activationStatus: plugin.activationStatus,
      ehrWrite: false as const,
      autonomousClinicalAction: false as const,
      validationGatesMet: validationGatesMet(plugin.validationRequirements),
    };
  });
}

export function getDiseaseDomain(id: DiseaseDomainId): DiseaseDomainPlugin | undefined {
  seedBuiltin();
  return registry.get(id);
}

export function requireDiseaseDomain(id: DiseaseDomainId): DiseaseDomainPlugin {
  const plugin = getDiseaseDomain(id);
  if (!plugin) {
    throw new Error(`Unknown disease domain: ${id}`);
  }
  return plugin;
}

/** Domains that may expose synthetic clinical paths today. */
export function listActiveSyntheticDomains(): DiseaseDomainPlugin[] {
  seedBuiltin();
  return [...registry.values()].filter((p) => p.activationStatus === "active_synthetic");
}

/** Domains that must not emit clinical intelligence. */
export function listInactiveDomains(): DiseaseDomainPlugin[] {
  seedBuiltin();
  return [...registry.values()].filter((p) => p.activationStatus !== "active_synthetic");
}

export function evaluateDomainRisk(
  domainId: DiseaseDomainId,
  input: DomainRiskEvaluationInput
): DomainResult<DomainRiskEvaluationData> {
  return requireDiseaseDomain(domainId).evaluateRisk(input);
}

export function listDomainObservationKinds(
  domainId: DiseaseDomainId
): DomainResult<{ observationKindIds: readonly string[] }> {
  return requireDiseaseDomain(domainId).listObservationKinds();
}

export function listDomainCarePathways(
  domainId: DiseaseDomainId
): DomainResult<{ pathwayIds: readonly string[] }> {
  return requireDiseaseDomain(domainId).listCarePathways();
}

/**
 * Register an additional plugin (tests / future). Built-ins are seeded once.
 * Rejects replacing an active_synthetic domain with a less-activated plugin.
 */
export function registerDiseaseDomain(plugin: DiseaseDomainPlugin): void {
  seedBuiltin();
  const existing = registry.get(plugin.id);
  if (existing?.activationStatus === "active_synthetic" && plugin.activationStatus !== "active_synthetic") {
    throw new Error(`Refusing to downgrade active_synthetic domain ${plugin.id}`);
  }
  if (plugin.honesty.ehrWrite !== false || plugin.honesty.autonomousClinicalAction !== false) {
    throw new Error(`Domain ${plugin.id} must keep ehrWrite and autonomousClinicalAction false`);
  }
  registry.set(plugin.id, plugin);
}

/** Test helper — restore built-in plugins only. */
export function resetDiseaseDomainRegistryForTests(): void {
  registry.clear();
  for (const plugin of BUILTIN_PLUGINS) {
    registry.set(plugin.id, plugin);
  }
}

export { listOtherChronicCandidates };
