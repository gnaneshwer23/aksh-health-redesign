# Environments: production, simulation, preview

## Current state (2026-10-10)

| Environment | Neon | Vercel (`aksh-health-redesign`) |
| --- | --- | --- |
| Production | Project **Aksh Health Production** (`tiny-river-29853628`, eu-west-2): schema from migrations 001–022, no data | Production: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `AKSH_ENVIRONMENT=production`, `CRON_SECRET` (all sensitive) |
| Simulation | Project **Aksh Health** (`floral-salad-21467299`), branch `production` (default; name predates this split): all test, demo and scenario data | Preview: per-branch Neon branches via the integration, `AKSH_ENVIRONMENT=simulation`, `NEXT_PUBLIC_AKSH_ENVIRONMENT=simulation`, `SIMULATION_RUNNER_TOKEN` |

Schema-only branching is not available on the simulation project (it has the custom `aksh_tenant` role), so production is a separate Neon project. That also separates credentials, compute and backups.

Local: `.env.local` targets simulation; `.env.production.local` (gitignored) targets production for `db:migrate` and `db:inventory` only.


Aksh runs the same code in every environment. What differs is the database and `AKSH_ENVIRONMENT`.

| Environment | `AKSH_ENVIRONMENT` | Database | Holds |
| --- | --- | --- | --- |
| Production | `production` | New, empty Neon branch | Real organisations, staff and patients only. Seed scripts refuse to run. |
| Simulation | `simulation` | The current Neon database | The rehearsal world: test organisations, professionals, pharmacies and patients, created through the product's own APIs. |
| Preview | `preview` | Throwaway Neon branch per PR (CI) | Whatever a test run creates; deleted afterwards. |
| Local | `local` (default) | Your `.env.local` | Development. |

`AKSH_ENVIRONMENT` is never inferred from a URL. Set it explicitly in every Vercel environment.

## Why production gets a new database

The current Neon database (inventory on 2026-10-10, `npm run db:inventory`):

- 3,213 accounts, of which 3,206 are test or demo accounts (`akshhealth.test` 2,981, `e2e.akshhealth.com` 112, `demo.akshhealth.com` 109, others 4) and 7 are other accounts.
- 9,869 SHIELD audit events, 1,820 learning events, 4,206 patient-state facts and 236 FHIR staging bundles written by tests.
- A `public` schema of 21 tables (users, messages, encryption keys, profiles) that this app does not use; it belongs to another project sharing the database.

Audit tables are append-only by design, so test rows are not deleted. Instead the current database becomes the **simulation** environment and production starts clean.

## Runbook (founder actions marked ⚑)

1. ⚑ Sign in to Neon CLI: `npx neonctl@latest auth` (the stored CLI session has expired).
2. ⚑ Create the production branch with schema only (or a new empty branch if schema-only is unavailable on your plan):
   `npx neonctl@latest branches create --name production --schema-only`
   then copy its pooled connection string.
3. Bootstrap the schema on the new branch:
   `AKSH_ENVIRONMENT=production DATABASE_URL='<production url>' npx tsx scripts/db-migrate.ts --apply`
4. Prove it is clean: `AKSH_ENVIRONMENT=production DATABASE_URL='<production url>' npx tsx scripts/db-inventory.ts` should report no test or demo accounts.
5. ⚑ Vercel → Settings → Environment Variables:
   - Production: `DATABASE_URL` = production branch, `AKSH_ENVIRONMENT=production`.
   - Preview: `DATABASE_URL` = current database, `AKSH_ENVIRONMENT=simulation`, `NEXT_PUBLIC_AKSH_ENVIRONMENT=simulation` (shows a "Simulation environment" badge on every dashboard).
6. ⚑ Move the 7 non-test accounts to production only if they are real people who should keep access (they re-register otherwise).
7. ⚑ Move the other project's `public` schema to its own Neon project when convenient; nothing in Aksh reads it.

## Migrations

`npm run db:migrate` shows applied / pending / changed migrations; `npm run db:migrate -- --apply` applies pending ones in order inside a transaction and records them in `aksh.schema_migrations` with a checksum. Never edit an applied migration; add a new one.

## Demo cohort password

The shared demo password is no longer stored in the repository. It lives in `DEMO_COHORT_PASSWORD` (local `.env.local`, gitignored; Vercel env for any deployed seed job).

⚑ Rotate the live demo accounts after the old password was published: `npm run demo:rotate-password -- --apply` (reads `DEMO_COHORT_PASSWORD`). Then make the public `gnaneshwer23/0ne-Health` repository private or archive it, since its history still contains the old password.
