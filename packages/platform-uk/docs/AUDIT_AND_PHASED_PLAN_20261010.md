# Aksh Health — End-to-End QA Audit & Phased Build Plan

**Date:** 2026-10-10
**Scope:** front end, back end, all role dashboards, test suites, data, positioning.
**Positioning (founder correction, 2026-10-10):** Aksh is **not an NHS product**. It is a diabetes care platform for any healthcare professional and any person with diabetes, in any care setting. Markets (UK, India, US, UAE first) are configuration. Regulation stays per market.
**Vision sources read:** `Aksh_Health_How_It_Works_End_to_End_Vision.docx` (Jul 2026), `Aksh_Health_PRD_EndToEnd_v1.0`, `AkshHealth_GapAnalysis_v1.0` (Apr 2026), India/UK strategy guides, `docs/AKSH_VISION_PRD_OVERVIEW.md`, Volume I. Claude.ai chat history is not accessible from this environment.

---

## 1. Blockers first

| # | Blocker | Severity | Owner | Action |
| --- | --- | --- | --- | --- |
| B1 | **Public repo exposes live demo passwords.** `gnaneshwer23/0ne-Health` is public; `docs/DEMO_LAUNCH_CREDENTIALS.md` and `docs/DEMO_COHORT_SEED.md` list one shared password for 100 demo accounts (incl. **admin**) that work on akshhealth.com. Admin can read organisation enquiries (real contact details), approve campaigns, reset demos. | **Critical** | Founder | Make 0ne-Health private or archive it; rotate the demo cohort password via env (not source); restrict enquiry PII to non-demo admins. |
| B2 | Clinical use in any market needs that market's pathway: privacy impact assessment (GDPR / HIPAA / DPDP), clinical safety case + named Clinical Safety Officer, regulator opinion on device status (MHRA / FDA / CDSCO). | Blocking for Track B | Founder + CSO | Pick the first live market; appoint CSO (Gap 1 of Apr 2026 analysis is still open). |
| B3 | Front Desk shared state needs migration `016_front_desk_state.sql` on the shared Neon database; until then the live site keeps state per server instance. | High | Engineering | Apply migration (additive). |
| B4 | Live site is behind the repo: PRD-aligned homepage build failed on a Vercel git hiccup; PR #2 (CI) and PR #3 (Front Desk) unmerged. | High | Founder | Merge PR #2 → #3 → this PR. |

## 2. Audit results

### 2.1 Automated suites (local, 2026-10-10)

| Suite | Result | Notes |
| --- | --- | --- |
| `verify` (typecheck + build checks) | PASS | |
| `test:workflow` (+ `test:clinical-proof`) | PASS | includes HITL, SHIELD, RBAC, decision scope, Front Desk, synthetic world |
| `test:e2e:platform-unit-gates` | PASS | |
| `test:aksh20:eval`, `test:demo-cohort`, `test:patient-access`, `test:front-desk`, `test:synthetic-world` | PASS | |
| `AKSH_MASTER_SKIP_DURABLE=true test:master` | PASS | |
| `smoke:all` (8 role dashboards, signed in) | PASS | |
| `test:golden` | FAIL (environmental) | sign-up rate limit after repeated runs (429), not a code fault; re-run after the window |
| Playwright marketing + accessibility + RBAC + Front Desk | 36/36 PASS | |

### 2.2 Signed-in crawl of every role dashboard (8 roles, 47 pages)

| Finding | Status |
| --- | --- |
| **Pharmacist blocked from medication-safety graph:** every pharmacist page got 403 from `/api/neo4j/guardian`. Allow-list said `"pharmacist"`; the real role id is `"clinical-pharmacist"`. The isolation test only checked the legacy string. | **Fixed** (`lib/clinical-proof/tenant-isolation.ts`; test now checks real role ids) |
| GP / nurse on Front Desk called an admin-only API (401): page rendered the admin shell before the profile loaded. | **Fixed** (role from session; non-admin shell by default) |
| Hospital command centre: React hydration mismatch from a server-rendered clock. | **Fixed** (client-only clock) |
| Asha safety messages hard-coded UK numbers (999 / NHS 111) for every caller. | **Fixed** (market-aware: 999/111, 112 + Tele-MANAS 14416, 911 + 988, 998) |
| Researcher `#federated` anchor timed out in crawler (same-page hash). | Crawler artefact, not a defect |
| Shared dashboard header has colour-contrast issues (radix menu, avatar). | Open (pre-existing) |

### 2.3 Data for end-to-end testing (new)

Deterministic synthetic world (`lib/synthetic-world`, seed 20261010), all fictional:

| Entity | Count | Detail |
| --- | ---: | --- |
| Patients | **500** | UK 150 · India 160 · US 110 · UAE 80. Type 2, type 1, prediabetes, gestational, LADA, MODY. 12-month HbA1c (mmol/mol + %), medicines by class, comorbidities, BP/BMI/eGFR/ACR/LDL, eye and foot status, hypos, CGM for 78, care team, pharmacy, payer, contact preference, risk with drivers, care gaps |
| Healthcare professionals | **100** | family physicians, endocrinologists, diabetes specialist nurses, educators, practice nurses, clinical and community pharmacists, dietitians, podiatrists, eye specialists, nephrologists, cardiologists, psychologists, care coordinators, practice managers |
| Organisations | 57 | 12 primary care clinics, 4 diabetes centres, 4 hospitals, **20 pharmacies**, 4 labs, 8 payers, 2 research institutes, 3 device partners |

Integrity and clinical-coherence tests: `tests/synthetic-world.test.ts` (no metformin with eGFR < 30, type 1 on basal-bolus, CGM percentages sum to 100, every clinician has a caseload, synthetic-only phone ranges and `.example` emails).
Surfaces: `/dashboard/network` (overview, registry, professionals, organisations; patient-level data follows clinical-record RBAC); Asha identifies any of the 500.
Sign-in accounts: `npm run seed:synthetic-world` (dry run) → `--apply` with `SYNTHETIC_WORLD_PASSWORD` creates 600 accounts. **Not applied** pending B1.

### 2.4 Positioning changes made

Trust strip "UK data posture" → "Regional data residency"; Track B "Live NHS clinical use" → "Live clinical use" per market; security page lists UK, US and India pathways; compliance badges cover GDPR, HIPAA and DPDP; pilot request form offers global regions, more organisation types (pharmacy group, payer, diabetes centre) and more EHRs (Epic, Oracle Health, athenahealth, eClinicalWorks, EMIS, SystmOne, none); role labels generalised; Asha hand-off wording market-aware.
Still UK-flavoured by design: the clinical demo cohort (P001–P100, Riverside practice) and the Patel walkthrough; internal guardrail labels.

## 3. What exists vs what is missing

| Area | Built (Track A, synthetic) | Missing for a real product |
| --- | --- | --- |
| Clinician review loop | 12 agents, CONDUCTOR, Accept/Edit/Reject, SHIELD, FHIR staging, sim EHR | Unified clinician workspace (still several surfaces); live EHR write per market |
| Patient support | Asha (voice/chat, browser), health updates → GP drafts, check-in calls, My Health (cohort) | Native/mobile app, WhatsApp/SMS channels, real telephony, patient accounts bound to network patients' data, translations (Hindi, Arabic, Spanish) |
| Front Desk | scheduling, referral desk, cited answers, campaigns, slot fill, lift metrics | durable state (B3), real calendars (EHR/PMS), e-referral ingestion, verified-lift billing |
| Diabetes intelligence | 9 areas as v1 rules | CGM data model and device connectors (glucose = "awaiting"), governed ML models, twin |
| Pharmacy | pharmacist dashboard, GUARDIAN, med review queue | pharmacy organisation workflows (dispensing hand-off, refill sync, adherence from claims) |
| Labs / payers | synthetic entities in the network | lab result ingestion (HL7/FHIR), payer reporting and outcome contracts |
| Multi-organisation | practice-scoped tenancy | org directory in the database, cross-org care teams, per-org RBAC and admin |
| Platform | Next.js, Neon, NextAuth, Vercel | data residency per market (London / Mumbai / US regions), SSO, pen test, DR, SLAs, SOC 2 / ISO 27001 pathway |

## 4. Phased build plan

**Phase 0 — Fix and consolidate (next 2 weeks)**
1. B1 security: private/archive 0ne-Health, rotate demo credentials from env, scrub docs, restrict enquiry PII.
2. Apply migration 016; merge PR #2 → #3 → this PR; confirm CI E2E runs on throwaway Neon branches.
3. Name a CSO; adopt the hazard logs in `PATIENT_ACCESS_AND_ASHA.md`; sign off safety thresholds.
4. Decide the first live market (recommendation below).

**Phase 1 — Complete the product on synthetic data (6–8 weeks)**
1. Persist the network: organisations, professionals, patients and care teams as database entities (not generated), with per-organisation RBAC and admin.
2. Patient app v1: accounts bound to network patients, My Health showing their own HbA1c, CGM, medicines and care team; Asha inside the app.
3. CGM data model + connector framework (Glucose Intelligence leaves "awaiting"); synthetic device feeds.
4. Pharmacy workflows: medication review from community pharmacies, refill and adherence signals back to the care team.
5. Lab ingestion (FHIR/HL7) into the timeline; payer dashboard with care-gap closure and lift.
6. Messaging channels behind one transport interface (SMS, WhatsApp, email) in sandbox; localisation (en, hi, ar, es) and market units.
7. Unified clinician workspace (timeline → evidence → agents → approvals) replacing separate surfaces.

**Phase 2 — First market go-live readiness (8–12 weeks, one market)**
Privacy assessment for that market, clinical safety case, regulator opinion on device status, pen test, data residency deployment, EHR integration for that market, real telephony and messaging provider, consent and contact-preference registry, incident response and SLAs, audit export. Exit: Track B for one market only.

**Phase 3 — Second market and commercial model (quarter after go-live)**
Second market pack (regulator, residency, EHR, language), payer integrations, outcome-based pricing with verified lift (baseline locked before go-live), partner pharmacy network.

**Phase 4 — Precision diabetes (2027+)**
Governed models (hypo prediction, HbA1c forecasting) through G-ML-1/2/3, rules-to-scenario digital twin, federated research with ethics gates, wearables beyond CGM.

**Recommendation on first market.** The product can be global, but live clinical use needs one regulator first. The April 2026 analysis chose the UK for evidence quality; the July vision plans India for 2028. If the target is clinics and pharmacies broadly rather than the NHS, the fastest real-patient path is usually a private diabetes clinic or pharmacy network in one market under that market's rules, using the UK or India work already done. Decide in Phase 0.
