# Partner API Contract (L10)

## Access Tiers

- `research.read`: cohort discovery (de-identified aggregates)
- `trial.match`: eligibility matching endpoints
- `ops.benchmark.read`: AMC benchmark views

## Endpoint Sketch

- `GET /v1/cohorts?condition=...&ageBand=...`
- `POST /v1/trials/match`
- `GET /v1/benchmarks/{amcId}`

## Mandatory Controls

- Tenant-scoped access token with purpose binding.
- Request-level audit event logging.
- Policy checks for consent and de-identification.
- Rate limiting by contract tier.
