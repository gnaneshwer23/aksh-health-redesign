# Demo cohort seed (100 patients · 100 users)

**Synthetic only · `liveEmis:false` · no real NHS PII**

Extends the hand-authored clinical-proof fixtures **P001–P026** with generator patients **P027–P100** (100 total) and seeds **100 role-spread users** into Neon (`aksh.users` / `aksh.profiles`) for dashboard / outcomes demos.

## Quick start

```bash
cd packages/platform-uk

# Always: regenerate seed JSON + refresh file learning store
npm run seed:demo-cohort

# Upsert 100 users + learning events into Neon
npm run seed:demo-cohort -- --apply

# Also MERGE patients into Neo4j Aura
npm run seed:demo-cohort -- --apply --with-neo4j

# Delete @demo.akshhealth.com cohort users then re-seed
npm run seed:demo-cohort -- --reset --apply
```

Patients are available in-app immediately via `lib/mock-data/patients.ts` (no Neon required). Neo4j and Neon need `--apply` / `data:seed:neo4j` when those backends are configured.

## Sample logins

| Role | Email | Password |
|------|-------|----------|
| GP | `gp01@demo.akshhealth.com` | the value of `DEMO_COHORT_PASSWORD` (held by the founder, never in the repo) |
| Nurse | `nurse01@demo.akshhealth.com` | same |
| Pharmacist | `pharmacist01@demo.akshhealth.com` | same |
| Admin | `admin01@demo.akshhealth.com` | same |
| ICS | `ics01@demo.akshhealth.com` | same |
| Hospital | `hospital01@demo.akshhealth.com` | same |
| Patient | `patient01@demo.akshhealth.com` | same |
| Researcher | `researcher01@demo.akshhealth.com` | same |

Override hash source with `DEMO_COHORT_PASSWORD` in `.env.local` (never commit `.env.local`).

Full table + honesty rules: [`DEMO_LAUNCH_CREDENTIALS.md`](./DEMO_LAUNCH_CREDENTIALS.md).

## Where data lives

| Store | Location |
|-------|----------|
| Patients (app / dashboards) | `lib/mock-data/patients.ts` → P001–P100 |
| Generator | `lib/mock-data/demo-cohort-generator.ts` |
| JSON artifacts | `data/seed/demo-cohort-*.json` |
| Users / profiles | Neon `aksh.users` + `aksh.profiles` (`%@demo.akshhealth.com`) |
| Learning / outcomes | `data/learning-events.json` + Neon `aksh.learning_events` (`learn-demo-cohort-*`) |
| Neo4j graph | Aura via `npm run data:seed:neo4j` (MERGE all 100 patients) |

## Reset

```bash
# Users only (also matched by cleanup-demo-users)
npm run auth:cleanup-demo -- --apply

# Cohort-aware reset + reseed
npm run seed:demo-cohort -- --reset --apply
```

File learning events with ids `learn-demo-cohort-*` are replaced on each seed run. Shared non-cohort learning rows are retained.

## Tests

```bash
npx tsx --test tests/demo-cohort-generator.test.ts
```

## Role mix (100 users)

| Role | Count | Email prefix |
|------|------:|--------------|
| gp | 20 | `gpNN@` |
| nurse | 15 | `nurseNN@` |
| clinical-pharmacist | 12 | `pharmacistNN@` |
| practice-manager | 12 | `adminNN@` |
| ics-lead | 10 | `icsNN@` |
| hospital-executive | 10 | `hospitalNN@` |
| patient | 15 | `patientNN@` |
| researcher | 6 | `researcherNN@` |
