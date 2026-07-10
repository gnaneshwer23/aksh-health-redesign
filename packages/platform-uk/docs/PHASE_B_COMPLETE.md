# Phase B — Complete

**Date:** July 2026  
**Repo:** `akshhealth-uk-eu-platform`  
**Plan reference:** `docs/AKSH_PLATFORM_IMPLEMENTATION_PLAN.md` — Phase B (Weeks 5–12)

---

## Goal

Production-path UX, governance surfaces, Postgres persistence scaffold, and compliance-neutral copy — still synthetic-capable.

**Phase B exit criterion:** External stakeholder can complete onboarding → clinician dashboard → review queue → SHIELD FHIR audit trail in staging; marketing surfaces live with neutral compliance framing.

---

## Built in Phase B

### B1 — `/pilot` marketing page

- Pilot program CTA, compliance badges (GDPR, HIPAA-ready design, ABDM-aligned, European data protection, FHIR R4, clinical safety governance, ISO 27001 pathway)
- Neutral language only in user-facing copy

**Route:** `/pilot`

### B2 — `/docs` portal stub

- Architecture overview, FHIR resource list, HITL spec, integration placeholders
- Links to API contracts for database and integration boundaries

**Route:** `/docs`

### B3 — Auth scaffold (generic OAuth)

- `lib/auth/config.ts` — clinical identity provider OAuth stub
- Sign-in page shows OAuth button when `CLINICAL_OAUTH_*` env vars are set
- Proof-mode banner when federation is not configured
- No country-specific identity naming

**Files:** `lib/auth/config.ts`, `lib/auth.ts`, `app/auth/signin/page.tsx`, `.env.local.example`

### B4 / B11 — Postgres persistence + RLS scaffold

- `db/migrations/001_review_cases.sql` — `aksh.review_cases` with `practice_id`, RLS policy
- `lib/db/client.ts`, `lib/db/tenant-context.ts`
- `lib/repositories/review-case-repository.ts` — Postgres adapter with seed rehydration parity
- `USE_POSTGRES=true` or `AKSH_STORAGE_ADAPTER=postgres_repository` selects Postgres
- JSON file adapter remains default for local demos

### B5 — 5-step onboarding wizard

- Roles: Clinician, Nurse, Pharmacist, Practice Admin, Regional Lead
- Steps: role → practice profile → compliance acknowledgement → dashboard tour → complete
- State persisted in `localStorage` (`aksh-onboarding-v1`)

**Route:** `/onboarding`

### B7–B9 — Role dashboards (functional stubs)

| Route | Content |
|---|---|
| `/dashboard/nurse` | Patient list + vitals review queue stub |
| `/dashboard/pharmacist` | GUARDIAN medication queue wired to case V-UK1 |
| `/dashboard/admin` | Extraction jobs mock, SHIELD audit summary, compliance flags |
| `/dashboard/regional` | Aggregate metrics + EQUITY flags stub |
| `/dashboard/ics` | Redirects to `/dashboard/regional` |

**Shared layout:** `components/dashboard/dashboard-layout.tsx`

### B10 — SHIELD FHIR AuditEvent

- `createFhirShieldAuditEvent()` in `lib/shield-audit.ts`
- Full case Accept / Reject / Defer appends FHIR R4 `AuditEvent` JSON
- Export bundle includes AuditEvent entries on frozen artifact

### Compliance copy pass

- `lib/compliance-labels.ts` centralizes neutral compliance strings
- Clinician Dashboard label in new GP dashboard header and public nav
- No new country-specific references in Phase B files

### SEO metadata

- Root layout uses neutral `SEO_DEFAULTS` from compliance labels

---

## Routes added / updated

| Route | Type |
|---|---|
| `/pilot` | New marketing |
| `/docs` | New docs stub |
| `/dashboard/regional` | New (replaces ICS naming) |
| `/dashboard/nurse` | Functional stub |
| `/dashboard/pharmacist` | Functional stub |
| `/dashboard/admin` | Functional stub |
| `/dashboard/ics` | Redirect → regional |

---

## How to demo Phase B locally

```bash
cd akshhealth-uk-eu-platform
npm install
npm run data:seed
npm run dev
```

1. **Marketing:** `/pilot`, `/docs` — compliance badges with disclaimer
2. **Onboarding:** `/onboarding` — complete 5-step wizard (localStorage)
3. **Clinician flow:** `/dashboard/gp` — HITL queue on V-UK1
4. **Pharmacist:** `/dashboard/pharmacist` — GUARDIAN alert from case-v-uk1
5. **Admin:** `/dashboard/admin` — SHIELD summary + compliance flags
6. **Regional:** `/dashboard/regional` — aggregate metrics only
7. **SHIELD FHIR:** Accept a case at `/cases/case-v-uk1` → check evidence export for `AuditEvent` resources
8. **Auth:** `/auth/signin` — demo credentials + OAuth placeholder button

### Optional Postgres demo (Neon — connected July 2026)

```bash
# Copy Neon pooled DATABASE_URL into .env.local (see .env.local.example)
USE_POSTGRES=true
AKSH_STORAGE_ADAPTER=postgres_repository
DATABASE_URL=postgresql://USER:PASSWORD@ep-XXXX-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require

# Apply Phase B migration (idempotent)
psql "$DATABASE_URL" -f db/migrations/001_review_cases.sql
npm run dev
```

**Neon project:** `Aksh Health` · region `aws-eu-west-2` · schema `aksh.review_cases`

### Local Docker Postgres (legacy)

```bash
# From repo root docker-compose
docker compose up -d postgres
createdb -h localhost -U medplum akshhealth
psql "$DATABASE_URL" -f db/migrations/001_review_cases.sql

# In akshhealth-uk-eu-platform/.env.local
USE_POSTGRES=true
DATABASE_URL=postgresql://medplum:medplum_password@localhost:5432/akshhealth
```

---

## Compliance copy approach

- **Allowed:** GDPR, HIPAA-ready design, ABDM-aligned, European data protection, FHIR R4, clinical safety governance, ISO 27001 pathway, data residency
- **Neutral terms:** primary care, clinic, practice, clinician, EHR connector, regional compliance
- **Disclaimers:** All badges use "aligned design" / "pathway" language — no certification claims
- **Centralized in:** `lib/compliance-labels.ts`
- **Existing Phase A files:** Not mass-refactored (NHS/UK strings may remain in older proof surfaces)

---

## Deferred to Phase C

| Item | Plan ticket |
|---|---|
| India production fork (ap-south-1) | C1–C2 |
| ABDM FHIR profiles + national health ID live | C4 |
| DPDPA consent production | C5 |
| Hindi-first clinician dashboard | C3 |
| Practo / HealthPlix adapters | C7 |
| Indian Pharmacopoeia GUARDIAN dataset | C8 |

## Deferred to Phase D+

| Item | Plan ticket |
|---|---|
| LangGraph 7-agent orchestrator | D3 |
| Medplum production EKS | D1 |
| Neo4j / Kafka MSK | D2, D7 |
| Redis cache layer | B12 |
| Live clinical identity OAuth sandbox | B3 production |
| GP dashboard P95 polish | B6 |
| Public docs site (Nextra/Mintlify) | B2 v2 |

---

## Verify

```bash
npm run verify
npm run build
```

---

*Phase B does not claim HIPAA/GDPR/ABDM certification, live EHR integration, or production clinical AI deployment.*
