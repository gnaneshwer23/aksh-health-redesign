# Aksh Health India — Clinical App (Phase 0)

Production clinical dashboard forked from UK/EU proof patterns. **Synthetic-only** until Mumbai DPDPA residency audit passes.

## Phase 0 status (M11–12)

| Epic | Status |
|---|---|
| E01 `@akshhealth/foundation` | **DONE** — `../akshhealth-shared-uk-india-foundation` |
| E02 Bootstrap india-app | **DONE** — this repo |
| E03 AWS ap-south-1 IaC | **STUB** — see [docs/PHASE0_INFRA.md](./docs/PHASE0_INFRA.md) |
| E04 DPDPA consent extension | **DONE (schema stub)** — Akeno `002_dpdpa_consent.sql` |
| E08–E09 Indic NLP / Azure Speech | **STUB** — `lib/nlp/india-nlp.ts` |
| E11 Practo sandbox | **STUB** — `lib/integrations/practo.ts` |
| E15 Hindi UI shell | **PARTIAL** — `/intake`, `/review` Hindi-first labels |

**Strategy source of truth:** [INDIA_TECH_BUILD_STRATEGY.md](../akshhealth-india-web/docs/INDIA_TECH_BUILD_STRATEGY.md)

## Quick start

```bash
cd akshhealth-india-app
cp .env.local.example .env.local   # placeholders only
npm install
npm run verify
npm run dev
```

Open http://localhost:3000 — `/intake`, `/review`.

## Stack

- Next.js 15 App Router
- `@akshhealth/foundation` — shared types + workflow helpers
- Hindi-first UI (`lib/i18n/hi.ts`)
- ICMR / Indian Pharmacopoeia copy (not NICE/BNF)

## Not in Phase 0

- Live PHI, ABHA, HIP/HIU registration, CDSCO claims
- Practo/HealthPlix live write-back
- AWS deploy, Neon ap-south-1 provisioning (EU Neon `akeno health` connected for Phase 0 identity/consent dev)

See [docs/PHASE0_CHECKLIST.md](../akshhealth-india-web/docs/PHASE0_CHECKLIST.md) for full gate tracking.
