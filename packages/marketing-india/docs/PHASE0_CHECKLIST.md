# Phase 0 Checklist — Months 11–12 (Pre-launch prep)

**Last updated:** June 2026  
**Source:** [INDIA_TECH_BUILD_STRATEGY.md](./INDIA_TECH_BUILD_STRATEGY.md) §4, §7 (E01–E12)

Legend: **DONE** · **STUB** (code scaffold, no live integration) · **BLOCKED** (AWS/founder/hire) · **NEEDS FOUNDER**

## Phase 0 exit criteria

| Criterion | Status | Notes |
|---|---|---|
| Mumbai VPC live (empty) | **BLOCKED** | Terraform skeleton in `akshhealth-india-app/docs/PHASE0_INFRA.md` |
| DPDPA architecture signed | **NEEDS FOUNDER** | E07 — legal/DPO sign-off |
| Hindi NER >82% F1 | **BLOCKED** | V-IN1 — annotator budget, Azure keys |
| Practo sandbox FHIR POST | **BLOCKED** | E11 stub only; partnership required |
| India app repo builds | **DONE** | `akshhealth-india-app` — `npm run verify` |

---

## P0 — Launch blockers (E01–E07)

| Epic | Deliverable | Status | Owner / blocker |
|---|---|---|---|
| **E01** | Extract `@akshhealth/foundation` | **DONE** | `mock-data.ts`, workflow modules, `npm run verify` green |
| **E02** | Bootstrap `akshhealth-india-app` | **DONE** | Next.js 15, Hindi UI stubs, UK NHS strings removed |
| **E03** | AWS ap-south-1 Terraform/CDK skeleton | **STUB** | `docs/PHASE0_INFRA.md` — apply blocked on AWS account |
| **E04** | DPDPA consent model extension | **DONE (stub)** | Akeno `002_dpdpa_consent.sql` + API fields |
| **E05** | Neon Postgres ap-south-1 | **BLOCKED** | Founder decision D5; no credentials |
| **E06** | India Postgres repository layer | **STUB** | Phase 1 — JSON repos in app for now |
| **E07** | DPDPA architecture + legal review | **NEEDS FOUNDER** | DPO appointment, breach runbook sign-off |

## P1 — Core product path (E08–E12, Phase 0 scope)

| Epic | Deliverable | Status | Owner / blocker |
|---|---|---|---|
| **E08** | IndicBERT Hindi NER v0 | **STUB** | `lib/nlp/india-nlp.ts` + V-IN1 harness skeleton |
| **E09** | Azure Speech Hindi streaming | **STUB** | Interface only; **BLOCKED** on Azure India keys |
| **E10** | Extend intake-generation for Indic | **PARTIAL** | Foundation `intake-generation.ts` reused; Indic path in app stub |
| **E11** | Practo sandbox adapter | **STUB** | `lib/integrations/practo.ts` — **BLOCKED** on sandbox access |
| **E12** | Medplum Mumbai instance | **BLOCKED** | Founder D1; no deploy |

## Non-engineering Phase 0 gates

| Item | Status | Notes |
|---|---|---|
| CDSCO pre-consult | **NEEDS FOUNDER** | India Reg + UK RCT interim |
| India Country Head hired | **NEEDS FOUNDER** | CEO — clinic intros before M13 |
| DPO appointed | **NEEDS FOUNDER** | Blocks E07 legal sign-off |

---

## Verify commands (Phase 0)

```bash
# Foundation package
cd akshhealth-shared-uk-india-foundation && npm run verify

# India clinical app
cd akshhealth-india-app && npm run verify

# Akeno DPDPA migration (local Postgres required)
cd akeno_health_platform && python scripts/migrate_dpdpa_consent.py --dry-run
```

## Recommended Phase 1 next steps

1. **Provision Neon ap-south-1 + apply E06 Postgres repositories** (after founder D5)
2. **IndicBERT training pipeline + 200 gold Hindi cases** (E08, V-IN1)
3. **Practo sandbox partnership + live adapter** (E11) with HealthPlix parallel spike (E20)

*Do not mark CDSCO Class B, ABDM HIP, or DPDPA audit as complete in product or marketing copy.*
