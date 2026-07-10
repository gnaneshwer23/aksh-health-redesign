# Phase A — Complete

**Date:** July 2026  
**Repo:** `akshhealth-uk-eu-platform`  
**Plan reference:** `docs/AKSH_PLATFORM_IMPLEMENTATION_PLAN.md` — Phase A (Weeks 1–4)

---

## Goal

Align the UK synthetic proof to the TechDoc patient journey **without** production EMIS, Mirth, Medplum, or LangGraph.

**Phase A exit criterion (from plan):** Founder can walk TechDoc §5.1 GP dashboard flow in synthetic proof; gap list is ticketed; no production claims added.

---

## Built in Phase A

### A7 / T03 — Agent naming layer

| Agent | Mapped to | UI surface |
|---|---|---|
| VOICE | `ConsultationInput` / transcript intake | GP dashboard, review queue badges |
| SYNTHESIS | `intake-generation.ts` → encounter SOAP | Queue item `soap_note` |
| DrASSIST | Condition / ICD suggestions | Queue item `diagnosis_codes` |
| GUARDIAN | `lib/workflow/safety.ts` DDI flags | Queue item `guardian_alert` |
| ORACLE | `oracleRiskScore` on case | Queue item `oracle_update` |
| SHIELD | `lib/shield-audit.ts` | Audit events on Accept / Edit / Reject |

**Files:** `lib/agents.ts`, `lib/shield-audit.ts`, `lib/workflow/review-queue.ts`, `components/review/agent-badge.tsx`

### A2 / T04 — HITL queue UX

- Per-item types: SOAP note, diagnosis codes, guardian alert, oracle update (+ voice transcript)
- **Accept / Edit / Reject** on each queue item in GP dashboard
- Status badges: `DRAFT`, `ACCEPTED`, `REJECTED`
- Agent badges on `/review` case list

**Files:** `components/gp/review-queue-panel.tsx`, `components/review/case-list.tsx`

### T05 — SHIELD audit (partial)

- Every queue item Accept / Edit / Reject appends SHIELD-labelled `AuditEvent`
- Full case-level SHIELD + FHIR AuditEvent export → **Phase B** (B10)

### T11 / T12 — GP 3-column dashboard

| Column | Content |
|---|---|
| A — Patient panel | Medications, observations, voice excerpt |
| B — AI review queue | HITL items with actions |
| C — Agent control | VOICE / SYNTHESIS / DrASSIST / GUARDIAN / ORACLE / SHIELD cards |

**Routes:** `/gp-dashboard`, `/dashboard/gp`

**Files:** `components/gp/*`, `app/gp-dashboard/page.tsx`, `app/dashboard/gp/page.tsx`, `app/globals.css` (GP styles)

### Golden scenario V-UK1 (T2D + DVT)

- Patient on Metformin + Aspirin, HbA1c 58, leg swelling
- SYNTHESIS SOAP with DVT + poor glycaemic control
- DrASSIST: I82.4 + E11.65 (94% confidence)
- GUARDIAN HIGH: Aspirin + proposed Apixaban
- ORACLE: 78 → 82 after DVT flag
- All queue items **DRAFT** until GP actions
- Case id: `case-v-uk1`, scenario id: `V-UK1`

**Files:** `data/seed/review-cases.seed.json`, `lib/mock-data.ts`

### A3 / T09 — 5-role onboarding (UI)

- GP, Nurse, Pharmacist, Admin, ICS Lead persona switcher
- CIS2 **proof-mode banner** (no live SSO)
- GP path → `/gp-dashboard`

**File:** `components/product/user-onboarding.tsx`

### A4 / T10 — Dashboard route scaffold

| Route | Status |
|---|---|
| `/dashboard/gp` | Populated (same as `/gp-dashboard`) |
| `/dashboard/nurse` | Placeholder |
| `/dashboard/pharmacist` | Placeholder |
| `/dashboard/admin` | Placeholder → links to `/review/ops` |
| `/dashboard/ics` | Placeholder |

### A5 / T06–T07 — Marketing stubs

- `/for-clinicians` — VOICE workflow + CTA to GP dashboard
- `/for-administrators` — multi-tenancy / SHIELD preview copy

---

## How to demo locally

```bash
cd akshhealth-uk-eu-platform
npm install
npm run data:seed          # loads V-UK1 into data/review-cases.json
npm run dev
```

1. Open **http://localhost:3000/gp-dashboard** — three-column GP flow with Margaret T. (V-UK1)
2. Accept / Edit / Reject each queue item; confirm SHIELD events in case audit (open **/cases/case-v-uk1**)
3. Optional: **/onboarding** → GP role → quick links
4. Optional: **/for-clinicians**, **/review** (agent badges on cases)

---

## Deferred to Phase B

| Item | Plan ticket |
|---|---|
| CIS2 OAuth sandbox | B3 |
| Supabase Auth + practice RLS | B4 |
| 5-step persisted onboarding wizard | B5 |
| Full GP dashboard P95 / polish | B6 |
| Nurse + Pharmacist dashboards (functional) | B7 |
| Admin SHIELD panel (live governance-pack) | B8, T20 |
| ICS aggregate dashboard | B9 |
| SHIELD AuditEvent on full case Accept/Edit/Reject | B10 |
| Postgres migration | B11 |
| UK marketing pages (production copy, SEO, `/pilot`) | B1 |
| Public `/docs` portal | B2, T18 |

## Deferred to Phase D+

- LangGraph 7-agent orchestrator
- Medplum / Neo4j / Kafka production stack
- Real BNF GUARDIAN dataset
- Agent validation gates (TechDoc §9 thresholds)
- EMIS / Mirth live connectors (Phase E)

---

## Verify

Run before release:

```bash
npm run verify
npm run build
```

---

*Phase A does not claim production NHS integration, DTAC, or live Medplum write-back.*
