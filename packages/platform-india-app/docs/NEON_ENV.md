# Neon environment (Phase 0)

Copy these into `.env.local` (not committed). Neon `akeno health` project is connected in `aws-eu-west-2`.

```bash
# Identity / consent (Akeno platform)
IDENTITY_CONSENT_URL=http://localhost:8103
DATABASE_URL=postgresql://USER:PASSWORD@ep-XXXX-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
POSTGRES_DSN=postgresql://USER:PASSWORD@ep-XXXX-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require

# Local India docker overlay fallback (optional)
# POSTGRES_DSN=postgresql://akeno:akeno@localhost:5434/akeno_india
```

India production will use `ap-south-1` Neon when provisioned; EU Neon is for Phase 0 dev against shared identity-consent schema.
