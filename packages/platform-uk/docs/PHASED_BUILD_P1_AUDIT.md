# P1 Audit — Neon durability (009 / 010)

**Date:** 2026-07-21  
**Branch:** `main`  
**Scope:** Apply `db/migrations/009_practices.sql` + `010_consent_grants.sql`; verify practices seed + consent grant dual-write; keep file fallback.

## Exit criteria — PASS

| Criterion | Result | Evidence |
|---|---|---|
| Tables exist in `aksh` | **PASS** | `to_regclass('aksh.practices')` / `aksh.consent_grants` both non-null after migrate |
| Consent grant round-trip in Neon | **PASS** | `upsertConsentGrant` → row in `aksh.consent_grants` (`ehr_write=false`, `hitl_required=true`) |
| File fallback intact | **PASS** | File store remains source of truth after Neon row deleted; list still returns grant |
| App / clinical path green | **PASS** | `npm run test:clinical-proof` exit 0 |
| No live EMIS / partner unlock | **PASS** | `liveEmis:false` on orchestrate + partner readiness; synthetic practices only |

## What was applied

| Migration | Target | Result |
|---|---|---|
| `009_practices.sql` | Neon `neondb` @ `ep-summer-boat-abu0xdiw-pooler.eu-west-2.aws.neon.tech` | Created `aksh.practices` + seeded 3 synthetic ODS rows |
| `010_consent_grants.sql` | same | Created `aksh.consent_grants` + indexes |

**Apply method:** `npm run db:migrate:p1` → `scripts/apply-neon-migrations-009-010.mjs` (idempotent `CREATE IF NOT EXISTS` / `ON CONFLICT DO NOTHING`).

**Safety:** `aksh.users` and `aksh.shield_audit_events` still present after migrate (no drops).

### Seeded practices (synthetic — not live EMIS sync)

| ODS | Name | EHR (label only) |
|---|---|---|
| E81001 | The Oakfield Surgery | EMIS Web |
| B82005 | Harrogate Medical Centre | SystmOne |
| RRK | University Hospitals Birmingham NHS Trust | Epic |

## Audit gate checklist

- [x] SQL: `aksh.practices` · `aksh.consent_grants` exist
- [x] Consent step / grant path → Neon mirror attempt succeeds when `DATABASE_URL` set; file store always written first
- [x] `npm run test:clinical-proof` — **PASS** 2026-07-21 (exit 0)
- [x] Honesty: practices table ≠ live EMIS practice sync; `liveEmis:false` unchanged

## Verification evidence

### Practices readable

```text
SELECT ods_code, practice_name, synthetic FROM aksh.practices WHERE ods_code = 'E81001';
→ E81001 · The Oakfield Surgery · synthetic=true
```

### Consent durable path

1. `upsertConsentGrant({ patientId: P001-P1-AUDIT, purposeCode: care_delivery, modalities: [clinical] })`
2. File: `data/consent-grants.p1-audit.json` contained grant
3. Neon: matching `aksh.consent_grants` row (`status=active`, `ehr_write=false`, `hitl_required=true`)
4. Deleted Neon row → `listConsentGrants` still returned grant from file (fallback OK)
5. Audit rows cleaned from Neon; scoped file removed

### Clinical proof

`npm run test:clinical-proof` — all suites OK including spine A–F (`flipBlocked=true`), HITL, SHIELD, NEXUS standalone, tenant isolation.

### Honesty

| Check | Result |
|---|---|
| Orchestrate `liveEmis` | `false` |
| Orchestrate `hitlRequired` | `true` |
| Partner readiness `honesty.liveEmis` | `false` |
| Practices marketing claim | Synthetic ODS seed only — no partner unlock |

## Tooling added

| Artefact | Purpose |
|---|---|
| `scripts/apply-neon-migrations-009-010.mjs` | Idempotent apply + verify for 009/010 |
| `npm run db:migrate:p1` | Convenience wrapper (`--env-file=.env.local`) |

**Local re-apply / other Neon targets:** set `DATABASE_URL` in `.env.local`, then `npm run db:migrate:p1`. Script fails loudly if URL missing (does not invent credentials).

## Fail-if checks (none triggered)

- Migration did **not** drop SHIELD / users
- Consent remains dual-write (file SoT + best-effort Neon mirror) — not “Neon only”
- No RLS/Supabase rewrite
- `liveEmis` stayed `false`

## Blockers for user

**None for P1 exit.** Migrations applied successfully against the Neon instance in local `.env.local`.

Re-apply on any additional staging/prod Neon project by setting that project’s `DATABASE_URL` and running `npm run db:migrate:p1`.

## What’s next — P2

**P2 — NEXUS in CONDUCTOR:** wire NEXUS into default/opt-in orchestrate path with HITL + SHIELD; keep draft-only / `ehrWrite:false` / `liveEmis:false`.

See [`PHASED_BUILD_AND_AUDIT_PLAN.md`](./PHASED_BUILD_AND_AUDIT_PLAN.md).
