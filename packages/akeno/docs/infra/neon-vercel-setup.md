# Neon + Vercel Setup

**Status (July 2026):** Neon is connected for Akeno (`akeno health`, `aws-eu-west-2`) and Aksh UK (`Aksh Health`, `aws-eu-west-2`). Local `.env.local` files use pooled `DATABASE_URL`; production secrets live in Vercel/GitHub env only.

## Database

Akeno uses **Neon Postgres** as the primary transactional database for:

- `patients`
- `consent_grants`
- `ingestion_events`
- `schema_migrations`

## Local development

1. Copy `.env.example` to `.env.local`
2. Set `DATABASE_URL` to your Neon pooled connection string
3. Run migrations:

```bash
export $(grep -v '^#' .env.local | xargs)
python scripts/apply_neon_migrations.py
```

## Vercel environment variables

Set these in the `akenohealth` Vercel project:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon pooled Postgres URL (server-side only) |
| `POSTGRES_DSN` | Same as `DATABASE_URL` for FastAPI services |
| `IDENTITY_CONSENT_URL` | Deployed identity-consent service URL |
| `INGESTION_API_URL` | Deployed ingestion service URL |
| `AI_SAFETY_API_URL` | Deployed AI safety service URL |

Never expose database credentials in `NEXT_PUBLIC_*` variables.

## Security

- Rotate Neon credentials if they were shared in chat or tickets.
- Use Neon pooled connection strings for serverless/Vercel workloads.
- Enable RLS and app-layer consent checks before production PHI.
