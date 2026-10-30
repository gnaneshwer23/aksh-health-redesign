# Phase 6 — Future chronic disease expansion

**Date:** 30 October 2026  
**Status:** Domain framework scaffolding in `packages/platform-uk`  
**Capability:** `chronic_disease_domain_framework` = `synthetic_demo`  
**Evidence:** `tests/disease-domain-framework.test.ts`  
**LIVE_ORGANISATIONS:** `0` — no new disease clinical intelligence activated; **Neon production untouched**.

## What shipped

| Surface | Path |
|---------|------|
| Domain contracts | `lib/disease-domains/types.ts` |
| Activation helpers | `lib/disease-domains/activation.ts` |
| Plugin registry | `lib/disease-domains/registry.ts` |
| Diabetes plugin | `lib/disease-domains/domains/diabetes.ts` (`active_synthetic`) |
| CVD scaffold | `lib/disease-domains/domains/cardiovascular.ts` (`planned`) |
| CKD scaffold | `lib/disease-domains/domains/ckd.ts` (`planned`) |
| Obesity scaffold | `lib/disease-domains/domains/obesity.ts` (`planned`) |
| Other chronic placeholder | `lib/disease-domains/domains/other.ts` (`research`) |
| Barrel | `lib/disease-domains/index.ts` |

No new Postgres migration — this phase is a TypeScript interface / registry layer only.

## Coverage vs BUILD DIRECTIVE

| Feature | Classification | Notes |
|---------|----------------|-------|
| Diabetes and metabolic health | `active_synthetic` / existing `synthetic_demo` caps | Registers against `disease-modules/diabetes` + diabetes-intelligence |
| Cardiovascular health | `planned` | Scaffold; `evaluateRisk` → `not_activated` |
| Chronic kidney disease | `planned` | Scaffold; no fabricated renal outputs |
| Obesity and related metabolic | `planned` | Scaffold; no fabricated weight outputs |
| Other chronic diseases | `research` | Placeholder candidate registry; evidence insufficient |
| Separate common infra from disease-specific | **done** | Guidelines / observations / risk / pathways / validation on plugin |
| Do not activate without validation | **enforced** | Inactive ops return `not_activated` + `clinicalOutput: null` |

## Capability register (honest)

| Id | Status |
|----|--------|
| `chronic_disease_domain_framework` | `synthetic_demo` |
| `cardiovascular_disease_intelligence` | `planned` |
| `ckd_disease_intelligence` | `planned` |
| `obesity_metabolic_intelligence` | `planned` |

## How to inspect

1. From `packages/platform-uk`:
   ```bash
   npx tsx tests/disease-domain-framework.test.ts
   npx tsx tests/capability-status.test.ts
   ```
2. In code / REPL:
   ```ts
   import { listDiseaseDomains, evaluateDomainRisk } from "@/lib/disease-domains";
   listDiseaseDomains();
   evaluateDomainRisk("cardiovascular", { patientId: "P002" }); // not_activated
   evaluateDomainRisk("diabetes_metabolic", { patientId: "P002" }); // pointer into disease-modules/diabetes
   ```
3. Docs: this file + [02-target-architecture.md](./02-target-architecture.md) layer table.

## Explicit non-claims

- No CVD / CKD / obesity clinical intelligence activated
- No autonomous clinical actions; `ehrWrite: false`
- Not clinically validated; CLINICAL_RELEASE gates unmet on all domains
- No package merge/delete (ADR-DIAB-001)
- No production Neon apply

## Gaps / leftovers

- Org pilot synthetic → shadow → live (still blocked by CLINICAL_RELEASE)
- Productization leftovers from Phases 1–5 (E2E, org FK/RLS, live connectors)
- Clinical-lead specs required before promoting CVD/CKD/obesity beyond `planned`
- OQ-ARC-4 (second-module Volume ownership) still open / Product-owned
