# Demo cohort seed (stakeholder scale · removable)

**Synthetic only · `syntheticDemo: true` · `removable: true` · `liveEmis: false` · `ehrWrite: false`**  
**Cohort id:** `demo-cohort-v2-stakeholder`  
**Email domain:** `@demo.akshhealth.com`

Extends hand-authored clinical-proof fixtures **P001–P026** with generator patients **P027–P200** (**200** total) and seeds **375** role-spread users into Neon for multi-stakeholder demos (GP, nurse, pharmacy, lab, front desk, admin, ICS, hospital, patient, researcher).

This pack is for **external demo / rehearsal** — not clinical production. Do **not** flip `productionRbacEnforced`. Purge before loading real practice data.

## Counts seeded

| Entity | Count | Notes |
| --- | ---: | --- |
| Patients (app mock) | **200** | P001–P026 fixtures + P027–P200 generator |
| GP | **50** | `gp01`–`gp50@demo.akshhealth.com` |
| Nurse | **50** | `nurse01`–`nurse50@` |
| Clinical pharmacist | **50** | `pharmacist01`–`pharmacist50@` |
| Lab operator | **50** | `lab01`–`lab50@` — `practice-manager` + `subRole: lab_operator` → `/dashboard/admin/lab-queue` |
| Organisation admin | **30** | `admin01`–`admin30@` — `subRole: organisation_admin` |
| Front desk / reception | **25** | `frontdesk01`–`frontdesk25@` — `subRole: front_desk` → `/dashboard/front-desk` |
| ICS / population lead | **25** | `ics01`–`ics25@` |
| Hospital executive | **25** | `hospital01`–`hospital25@` |
| Patient accounts | **50** | `patient01`–`patient50@` (bound charts where configured) |
| Researcher | **20** | `researcher01`–`researcher20@` |
| **Users total** | **375** | All tagged `demoCohortId` + `@demo.akshhealth.com` |
| Care episodes (file glue) | **48** | `ce-demo-cohort-*` |
| Lab HITL drafts | **24** | `lph-lab-demo-cohort-*` pending review |
| Pharmacy HITL drafts | **24** | `lph-pharmacy-demo-cohort-*` pending review |
| Review-queue extras | **36** | `RQ-demo-cohort-*` merged into mock queue |
| Learning event pairs | **40** | `learn-demo-cohort-*` |

**Not seeded as separate UserRole:** MDT reviewer (exists only as AppRole / eval persona, not signup RBAC). Lab and front desk are **personas** on `practice-manager`.

## Quick start

```bash
cd packages/platform-uk

# Regenerate JSON artifacts + file stores (care episodes, HITL, learning)
npm run seed:demo-cohort

# Upsert 375 users + learning events into simulation Neon
npm run seed:demo-cohort -- --apply

# Also MERGE patients into Neo4j Aura
npm run seed:demo-cohort -- --apply --with-neo4j

# Delete cohort users then re-seed
npm run seed:demo-cohort -- --reset --apply
```

Patients and review-queue extras are available in-app immediately via `lib/mock-data/patients.ts` / `review-queue.ts` (no Neon required). Neon needs `--apply` when auth logins are required.

## Password

Set in `.env.local` (never commit):

- Prefer `DEMO_SEED_PASSWORD`
- Compat: `DEMO_COHORT_PASSWORD`

If neither is set, seed uses the **local synthetic default** documented as `AkshLocalSyntheticDemo1!` (generator constant `DEMO_SEED_PASSWORD_LOCAL_DEFAULT`) — **local simulation only**, never production.

## Sample logins

| Role | Email | Password |
|------|-------|----------|
| GP | `gp01@demo.akshhealth.com` | `DEMO_SEED_PASSWORD` / `DEMO_COHORT_PASSWORD` |
| Nurse | `nurse01@demo.akshhealth.com` | same |
| Pharmacist | `pharmacist01@demo.akshhealth.com` | same → `/dashboard/pharmacist/pharmacy-queue` |
| Lab operator | `lab01@demo.akshhealth.com` | same → `/dashboard/admin/lab-queue` |
| Front desk | `frontdesk01@demo.akshhealth.com` | same → `/dashboard/front-desk` |
| Admin | `admin01@demo.akshhealth.com` | same → Agent Ops |
| ICS | `ics01@demo.akshhealth.com` | same |
| Hospital | `hospital01@demo.akshhealth.com` | same |
| Patient | `patient01@demo.akshhealth.com` | same |
| Researcher | `researcher01@demo.akshhealth.com` | same |

Full honesty rules: [`DEMO_LAUNCH_CREDENTIALS.md`](./DEMO_LAUNCH_CREDENTIALS.md).  
Launch gates: [`launch/LAUNCH_READINESS.md`](./launch/LAUNCH_READINESS.md).

## Purge (removable before launch / real-data swap)

```bash
# Dry run — counts only
npm run purge:demo-cohort

# Delete tagged file stores + @demo.akshhealth.com Neon users (simulation DB only)
npm run purge:demo-cohort -- --apply

# File stores only
npm run purge:demo-cohort -- --files-only --apply
```

Purge matches:

- Emails `@demo.akshhealth.com`
- Ids `ce-demo-cohort-*`, `lph-*-demo-cohort-*`, `learn-demo-cohort-*`, `RQ-demo-cohort-*`, `usr_demo_cohort_*`
- Metadata / preferences `demoCohortId = demo-cohort-v2-stakeholder`

**Does not** delete hand fixtures P001–P026 / RQ001–RQ010 code, HSI seeds, e2e `@…example` accounts, or non-demo Neon rows.

### Swap to real data later

1. `npm run purge:demo-cohort -- --apply` on the simulation sandbox (or leave demo host separate).  
2. Point production at a non-simulation DB with real org tenancy.  
3. Do **not** re-run `seed:demo-cohort -- --apply` against production.  
4. Complete clinical-production gates in [`launch/LAUNCH_READINESS.md`](./launch/LAUNCH_READINESS.md).

## Where data lives

| Store | Location |
|-------|----------|
| Patients | `lib/mock-data/patients.ts` → P001–P200 |
| Review queue | `lib/mock-data/review-queue.ts` (core + `RQ-demo-cohort-*`) |
| Generator | `lib/mock-data/demo-cohort-generator.ts` |
| Terminology (curated) | `lib/mock-data/demo-terminology.ts` + `data/seed/demo-terminology-curated.json` |
| JSON artifacts | `data/seed/demo-cohort-*.json` |
| Users / profiles | Neon `aksh.users` + `aksh.profiles` |
| Care episodes (file) | `data/care-episodes.json` (`ce-demo-cohort-*`) |
| Lab/pharmacy HITL (file) | `data/lab-pharmacy-hitl.json` (items + `codedItems`) |
| Learning / outcomes | `data/learning-events.json` + Neon `aksh.learning_events` |
| Neo4j graph | Aura via `--with-neo4j` / `data:seed:neo4j` |

## Terminology (SNOMED · LOINC · ATC)

The 200-patient cohort carries **curated open codes** for realistic UK-oriented demos:

| Surface | Code system | Attached as |
| --- | --- | --- |
| Problems / conditions | SNOMED CT (`http://snomed.info/sct`) | `patient.codedConditions[]` |
| Lab HITL drafts + longitudinal labs | LOINC (`http://loinc.org`) | HITL `codedItems[]` · lab `loinc` |
| Medications / pharmacy HITL | ATC (`http://www.whocc.no/atc`) | `patient.codedMedications[]` · pharmacy `codedItems[]` |

**Licensing / honesty (read before claiming “UK coded”):**

- We **do not** vendor full SNOMED CT UK Edition RF2, full LOINC, ATC/DDD dumps, MIMIC, SynPUF, or awesome-healthcare-data bulk ingest.
- Demo uses a **small curated JSON/TS table** of commonly used concept ids (UK GP–familiar SNOMED concepts where the International id is the usual reference; production UK Edition still needs NHS / SNOMED International registration + a terminology server).
- **dm+d** AMP/VMP product ids are **citation-only** (`dmdCitationNote`) — not ingested. Map ATC → dm+d in a licensed environment before any clinical prescribing story.
- Optional future path: fetch-at-seed from allowed public APIs when keys/env exist — not required for this pack; document any env in `.env.local` if added later.
- **This is not clinical validation.** Codes are illustrative for stakeholder walkthroughs. Do not claim coded EHR parity or MHRA-grade terminology assurance.

Samples (always resolvable in `test:demo-cohort`):

- SNOMED `44054006` — Type 2 diabetes mellitus  
- LOINC `4548-4` — HbA1c  
- ATC `A10BA02` — metformin  

## Tests

```bash
npm run test:demo-cohort
# hermetic: min counts, relational glue tags, purge keeps non-demo rows,
# sample SNOMED/LOINC/ATC bindings on patients + HITL drafts
```

## Honesty

- Agent Ops shows a synthetic demo-cohort banner (`demo-cohort-synthetic-honesty`).  
- No autonomous Rx · no live EPS · no live EHR write.  
- `productionRbacEnforced` stays false.
- Curated terminology ≠ clinical validation / ≠ licensed full distributions.
