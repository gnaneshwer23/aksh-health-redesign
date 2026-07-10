# Phase 0 Infrastructure — AWS ap-south-1 Target Architecture

**Status:** Documentation + local docker overlay only. No AWS credentials required for Phase 0.

**Related:** [INDIA_TECH_BUILD_STRATEGY.md](../../akshhealth-india-web/docs/INDIA_TECH_BUILD_STRATEGY.md) §3, Epic E03.

## Target region

All PHI and sensitive personal data **must** remain in **ap-south-1 (Mumbai)** before any live patient pilot (DPDPA).

## Phase 0 deliverables (this doc)

| Component | Phase 0 state | Phase 1 owner |
|---|---|---|
| VPC + subnets | **STUB** — Terraform skeleton below | DevOps |
| ECS Fargate cluster | **STUB** | DevOps |
| S3 (audio/transcripts, Object Lock) | **STUB** | DevOps |
| Secrets Manager | **STUB** | DevOps |
| Route 53 `akshhealth.in` | **BLOCKED** — domain/DNS founder decision | CTO |
| Neon Postgres ap-south-1 | **BLOCKED** — E05, founder D5 decision | DevOps |
| Medplum Mumbai | **BLOCKED** — D1 Cloud vs ECS | Backend |

## Local dev (no AWS)

```bash
# From akeno_health_platform:
docker compose -f infra/docker-compose.yml \
  -f "../Desktop/akshhealth 2031/akshhealth-india-app/infra/docker-compose.india.yml" up -d
```

India overlay exposes:

- Postgres `localhost:5434` (DB `akeno_india`)
- identity-consent `localhost:8103` (DPDPA-extended schema)
- india-nlp-stub `localhost:8090`

## AWS topology (high level)

```
Route 53 → CloudFront/WAF → ECS (india-app Next.js + FastAPI services)
                         → Vercel (akshhealth-india-web marketing only)

Data plane (ap-south-1 only):
  Neon/RDS Postgres · Medplum FHIR · S3 encrypted · Weaviate (Phase 2+)
```

## Terraform skeleton (not applied in Phase 0)

Create under `infra/terraform/` in Phase 1. Minimum modules:

1. `modules/vpc` — 2 AZ, private + public subnets, NAT
2. `modules/ecs` — Fargate cluster, task execution role
3. `modules/s3` — `aksh-india-audio-{env}`, SSE-KMS, Object Lock 90d default
4. `modules/secrets` — ABHA, Practo, Azure Speech placeholders
5. `modules/route53` — hosted zone (when domain ready)

Example stub variables:

```hcl
variable "aws_region" {
  default = "ap-south-1"
}

variable "environment" {
  default = "staging"
}
```

## DPDPA hard rules (engineering)

- No cross-region replication of PHI to eu-west-2 or other regions
- UK synthetic proof data **never** commingles with India production
- Audit logs append-only (S3 Object Lock or Postgres audit table)
- Consent purpose + retention enforced in Akeno `identity-consent` (migration `002_dpdpa_consent.sql`)

## Verification (Phase 0)

- [ ] Local docker overlay starts without AWS keys
- [ ] `identity-consent` health returns OK on `:8103`
- [ ] Architecture reviewed by legal/DPO — **NEEDS FOUNDER** (E07)

*Do not claim DPDPA audit complete or CDSCO registration in product UI.*
