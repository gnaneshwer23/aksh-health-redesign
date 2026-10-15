# Aksh Health — Phase 1 audit (product, technical, clinical safety)

**Date:** 15 October 2026 · **Code audited:** `main` at `6db40c2` (gnaneshwer23/aksh-health-redesign) · **Production:** www.akshhealth.com
**Method:** code, schema and migrations read; API routes probed against production; production database read (read-only:
migration status, retention evidence); test suites run in this session (results below). Nothing was changed for this
audit. Status is never inferred from the website.

Companion documents: `AKSH_PLATFORM_STATE_AND_PLAN_20261011.md` (gap map G1–G7), `AKSH_VISION_PRD_OVERVIEW.md`.

---

## 0. Summary for the founder

- **Production is a real, narrow product that works:** clinic sign-up and onboarding, organisation workspace, go-live
  review, cancellation-slot fill in shadow mode with read-back verification, weekly review and pilot readout, care
  network, CGM monitoring, the patient app, two-step sign-in. All database-backed, with row-level security, and covered by
  passing end-to-end tests in production mode.
- **The clinical intelligence (the twelve agents, the HITL review queue, FHIR staging, the diabetes module) is real code
  but demonstration-only.** It runs on the synthetic 100-patient cohort, and since 15 Oct every one of its APIs is closed
  in production. The link from real care-network patients to the agents exists only in simulation (G1/G2).
- **The single biggest product gap against your Phase 2 brief is the unified clinician workspace:** in production a
  clinician has Today, Fill slots, Care network, Monitoring and Readings review as separate screens, and **no clinical
  review queue at all**. The review queue that exists (`review_cases`, HITL accept/edit/reject) lives in the demo estate.
- **The biggest safety/governance gaps are not code:** no clinical safety case or hazard log signed by a clinical safety
  officer, no DPIA, no regulatory (SaMD) opinion, no recorded restore drill, and no guideline source/version traceability
  in the diabetes rules.
- **Scope is general diabetes care, for any country (founder, 15 Oct).** No market-specific framing. Clinical guidance is a
  configurable, versioned source per organisation (for example the ADA Standards of Care, IDF guidance or a national
  guideline the clinic adopts), never hard-coded.
- **Website and internal material are now separated.** The public site describes what a clinic gets and the outcomes,
  with a plain "Available now / In development" split. Engineering status, component codenames and this inventory stay
  in internal documents.

---

## 1. Current product architecture

```
Browser ─► Next.js 15.5 App Router on Vercel (lhr1)
             ├─ middleware: auth (NextAuth JWT), role routing, real-workspace rules,
             │              production API allowlist (everything else → 403 TRACK_B_NOT_OPEN)
             ├─ public site (/, /platform, /product, /security, /resources, /contact, /get-started, legal)
             ├─ real workspace (/dashboard/today, access, network, monitoring, organisation, security,
             │                  platform [Aksh reviewers], patient) + onboarding
             ├─ demo estate (/dashboard/gp|nurse|pharmacist|ics|hospital|researcher|regional|admin|front-desk,
             │               /demo/*, legacy /cases /review /intake /workspace) — simulation only
             └─ API routes (187) ─► lib/* services
                    ├─ Postgres (Neon): production project "tiny-river"; simulation project "floral-salad"
                    │     withTenant(): restricted role aksh_tenant + session org/patient scope → RLS
                    ├─ Resend (email), Vercel Cron (offer expiry, retention)
                    ├─ OpenAI / AI Gateway (clinical-proof agents, chat) — unreachable in production
                    └─ Neo4j (optional; falls back to mock graph), Medplum (dry-run; OAuth degraded)
Separate deployment: aksh-clinical-proof (Vercel) — simulation DB, AKSH_PROOF_ENVIRONMENT=true (domain not attached)
```

Environments are separated by database and by `AKSH_ENVIRONMENT`; seed/test tooling refuses production
(`assertSeedingAllowed`, `assertNotProductionDatabase`).

---

## 2. Feature inventory

Legend: **W** working (verified) · **I** incomplete · **D** demonstration-only (synthetic/simulated) · **P** planned ·
**X** defect · **R** requires clinical or regulatory review before real use.

### 2.1 Platform foundations
| Capability | Status | Evidence |
|---|---|---|
| Email/password sign-up, sign-in, reset, verification | W | e2e `auth`, `real-workspace`; NextAuth credentials |
| Two-step sign-in (TOTP + recovery codes), required for Aksh reviewers | W | `tests/mfa`, e2e `mfa` |
| Organisations, memberships, staff invites, patient invite codes | W | `care-network-db`, e2e `organisation-workspace` |
| Row-level security on clinical tables (34 of 49 tables) | W | `review-cases-rls-db`, `care-network-db` isolation cases |
| Append-only history (17 reject-mutation triggers) | W | `weekly-review`, `prd-v11-pilot-db` assert rejection |
| Production API allowlist; synthetic/agent/chat APIs closed | W | e2e `real-workspace`; live uptime workflow every 15 min |
| Rate limits (DB-backed) on auth and enquiries | W | `readiness-db` |
| Error reporting → ops email; retention cron | W | `error-monitoring`; prod `rate_limits` empty (retention running) |
| Organisation export, patient record download | W | `readiness-db` |
| Units per organisation (mg/dL / mmol/L, % / mmol/mol) | W | `units`, e2e `real-workspace` (en-US → mg/dL, %) |
| Uptime monitoring | W | `.github/workflows/uptime.yml` (first run green) |
| Backups / point-in-time restore | **R** | Not verified; Neon PITR setting and a restore drill outstanding |
| Clinical-proof environment (demo.akshhealth.com) | I | Project + env built; repo link/domain not attached |

### 2.2 Patient access (Track A, production)
| Capability | Status | Evidence |
|---|---|---|
| Waiting list, eligibility rules (versioned `RULE_VERSION`), ranking with reasons | W | `access-workflow-db`, `access-eligibility` |
| Slot fill workflow: match → select → staff-approved offer → response → read-back confirm | W | e2e `slot-fill`; 19 PRD §14 negative cases pass |
| Shadow / staff-assisted pilot stages; approved offer templates | W | `prd-v11-pilot-db`, e2e `go-live` |
| Hand-offs with SLA; degraded "not recorded" state on audit failure | W | `patient-access-negative-db` (injected faults) |
| Schedule connector (FHIR R4 Slot/Appointment, JSON), read-only, per-org keys | W | `connector-db`, e2e `schedule-connector` |
| Weekly review, sign-off, pilot readout + CSV | W | `weekly-review`, `prd-v11-pilot-db` |
| Go-live checklist + Aksh review | W | e2e `go-live` (to "live in shadow mode") |
| Automated patient contact (SMS/voice) | P | Deliberately absent (PA-109 deferred) |
| Front Desk / Asha voice receptionist | D | In-memory synthetic calendar; closed in production |

### 2.3 Diabetes monitoring and patient app (production)
| Capability | Status | Evidence |
|---|---|---|
| CGM upload (Dexcom Clarity, LibreView, CSV), preview, AGP, consensus metrics | W | `cgm`, e2e `cgm` |
| Device feed via connector (FHIR Observation) with duplicate handling | W | `monitoring-db` |
| Monitoring worklist ordered by urgency, unit-aware flags | W | `monitoring-db`, e2e `cgm-monitoring` |
| Patient readings (glucose/BP/weight), sharing, clinician verification | W | `readings-db`, e2e `patient-readings` |
| Patient escalation guidance (emergency number from org locale) | I | Number shown if the organisation sets it; no default per country |
| Patient view of approved care instructions / appointments | P | Not built |

### 2.4 Clinical intelligence (demonstration-only)
| Capability | Status | Notes |
|---|---|---|
| CONDUCTOR orchestration (fixed sequence, contracts) | D, R | `lib/clinical-proof/agent-orchestration.ts`, `lib/agents/contracts`; synthetic cohort |
| SYNTHESIS, GUARDIAN, ORACLE/HORIZON, DR-ASSIST, NEXUS, EQUITY (LLM variants) | D, R | `lib/agents/llm-*.ts`; **LLM paths default ON unless `ENABLE_LLM_*=false`** |
| CANVAS, VOICE (Deepgram), PATHWAY, COMPASS | D | Rules/stubs; VOICE needs a key not set anywhere in production |
| BRIDGE (FHIR staging bundles), simulated EHR write-back | D | `fhir_staging_bundles`, `simulated-ehr`; no live write |
| SHIELD audit for agent events | W (demo scope) | `shield_audit_events` — **not under RLS**, fire-and-forget writes |
| Guardian gateway (output PASS/REVIEW/BLOCK) | D | `lib/guardian-gateway` |
| HITL review queue (`review_cases`, accept/edit/reject) | D, R | RLS-tested; only in demo dashboards; not fed by real patients |
| Aksh Diabetes 9 areas (glucose, HbA1c, insulin, GLP-1, nutrition, exercise, behaviour, complications, prevention) | D, R | Rules-based; **no guideline source/version per rule**; insulin/GLP-1 explanatory only |
| Track B link: care-network patient → CONDUCTOR + diabetes with trusted CGM | D | `lib/clinical-spine/spine-patient.ts`; simulation only; drafts not enqueued |
| Knowledge graph / GraphRAG | D | Neo4j optional; production health shows mock fallback |
| Evaluation harness (golden fixtures, AKSH-20) | I | `/api/eval/*`, `platform-golden-*` e2e; no thresholds tied to release |
| Learning loop / model registry | D | `learning_events`, `model_registry` (no RLS) |
| PRISM imaging, ATLAS research | P | Correctly deferred |

---

## 3. Routes and user journeys

- **122 pages, 187 API routes.** Production exposes 17 API families (allowlist in `lib/env/workspace.ts`).
- **Journeys verified end to end (production mode):**
  1. Clinic admin: sign up → role → identity → clinic (units, time zone) → consent → Today.
  2. Clinic: invite staff → import patients (CSV, HbA1c mmol/mol or %) → waiting list → slot fill → read-back.
  3. Go-live: checklist evidence → Aksh reviewer (2FA) → approve → live in shadow mode → stage change.
  4. Patient: invite code + DOB → link → share readings / CGM → clinician verifies.
  5. Weekly review → sign-off → pilot readout.
- **Demo-only journeys (simulation):** Patel walkthrough, GP/nurse/pharmacist dashboards with review queue, precision-health
  loop, Front Desk.
- **Disconnected:** a clinician can open a real patient in Care network and (simulation only) run a clinical review, but
  the result is shown inline and **does not enter any review queue**, so it cannot be accepted, edited or rejected.

---

## 4. Technology stack

Next.js 15.5.26 (App Router), React 19.2, TypeScript, Tailwind CSS 3.4 (locked), NextAuth 4.24, zod 4, `pg` 8 on Neon
Postgres, Vercel AI SDK 7 with `@ai-sdk/openai`, `neo4j-driver` 6, Resend, Playwright + axe-core, Vercel (hosting,
cron), GitHub Actions (e2e on PRs, uptime). No Python service in production (the FastAPI synthesis path is behind a flag
and unused).

---

## 5. Database and integration inventory

- **39 migrations** (numbering skips 029; harmless), **49 tables**, production at the latest migration (040).
- **RLS on 34 tables.** Without RLS (access only through server code using the owner pool):
  `users`, `profiles`, `password_reset_tokens`, `email_verification_tokens`, `onboarding_progress` (auth/onboarding —
  acceptable with code checks); and legacy/demo tables `consent_grants`, `patient_state_facts`, `shield_audit_events`,
  `fhir_staging_bundles`, `learning_events`, `model_registry`, `front_desk_state`, `practices`, `pilot_applications`.
- **Integrations:**
  - Schedule connector — FHIR R4 Slot/Appointment + JSON, inbound only, keyed, idempotent (production).
  - Device glucose — FHIR R4 Observation inbound (production).
  - CSV patient import (production).
  - Resend email (production).
  - OpenAI / AI Gateway (simulation only; key still set in production env).
  - Neo4j (optional, mock fallback), Medplum (dry-run, OAuth degraded), EMIS partner sandbox (flagged off),
    Deepgram (no key).
- **FHIR resources in code:** Bundle, Observation, Condition, Patient, Practitioner, Appointment, Slot, ServiceRequest,
  MedicationStatement, MedicationRequest, RiskAssessment, Flag, Provenance. Production uses only Slot, Appointment,
  Observation (read/inbound). Encounter, DiagnosticReport and CarePlan are not implemented.

---

## 6. Security and clinical-safety gaps

| # | Gap | Severity | Notes |
|---|---|---|---|
| S1 | No clinical safety case / hazard log / CSO sign-off (clinical risk management to ISO 14971 principles, with any national requirements of the market where a clinic goes live) | Critical (blocks real clinical use) | Founder/CSO work; code has hazard-trace tests but no signed artefact |
| S2 | No DPIA; DPA not legally reviewed | Critical (blocks real data) | Template exists in go-live checklist |
| S3 | No SaMD/regulatory opinion for the clinical module | Critical (blocks Track B) | Insulin/HbA1c/risk outputs may be a medical device |
| S4 | Backups: PITR not confirmed, no restore drill recorded | High | Security page commits to a drill before first clinic |
| S5 | `OPENAI_API_KEY` present in production though nothing uses it | High (latent) | Remove from production env |
| S6 | LLM agent paths default ON (`ENABLE_LLM_*` unless "false") | High (when Track B opens) | Should default OFF; enable per environment |
| S7 | Prompt-injection defence is a four-phrase regex blocklist on user text (guardian gateway); untrusted patient text is not structurally separated from instructions | High (Track B) | Needs delimiting, input minimisation and red-team fixtures |
| S8 | No LLM call timeouts/abort; on error the agent falls back to a deterministic draft (labelled `mode: "deterministic"`), logged but not surfaced to the reviewer | Medium | Reviewer should see "AI unavailable, rules-based draft"; never a partial record |
| S9 | Legacy tables without RLS (`consent_grants`, `patient_state_facts`, `shield_audit_events`, `fhir_staging_bundles`) | Medium | Closed in production via API allowlist; fix before reuse |
| S10 | Agent audit writes are fire-and-forget (`shield_audit_events`) | Medium | Contrast with slot-fill, where audit is transactional |
| S11 | Diabetes rules lack guideline source and version per rule | High (Track B) | Needed for traceability and safety case |
| S12 | Dependency advisories: next 15.5.28, nodemailer 10.1.1 patches deferred to ≥ 21 Oct; Tailwind 3.4 build-tooling advisories accepted | Low/Medium | Documented on PR #29 |
| S13 | Third-party model data handling (OpenAI DPA, zero-retention) not documented | Medium (Track B) | Founder item |

---

## 7. UX/UI problems

1. **No unified clinician workspace** in production: five separate screens; nothing says "what needs me now, why, and
   what can I do" across slot fill, readings, CGM and hand-offs. Today aggregates counts only.
2. **No clinical review queue** in production; status labels for draft / reviewed / approved / demonstration-only exist
   only in demo screens.
3. **Care network patient view** is a dense single panel: no tabs (summary, labs, medicines, readings, CGM, history),
   no audit history per patient.
4. **Demo estate is visually and conceptually separate** (legacy role dashboards in an older design language) and still
   shows "liveEmis:false" and similar engineering labels in simulation.
5. **Sandbox "Verify your email" banner** is oversized and repeats itself.
6. **Patient app:** no "what Aksh can and cannot do" explanation and no default escalation guidance per country.
7. **Lists** (patients, waiting list, monitoring) have limited search/sort and no pagination beyond fixed limits.
8. Accessibility is tested automatically (axe) on public and core pages; keyboard-only journeys through slot fill and
   review are not tested.
9. **Fixed 15 Oct:** the public site showed internal material (component codenames, a twelve-component engineering status
   table, "synthetic validation" and "planned" labels). It now shows only what clinics get, split into "Available now"
   and "In development".

---

## 8. Broken or disconnected workflows

| # | Workflow | Problem |
|---|---|---|
| B1 | Agent output → review | Clinical review results (Track B link) are not enqueued; no accept/edit/reject on real-patient drafts |
| B2 | Review decision → staging | HITL→FHIR staging works only for the synthetic cohort (`fhir_staging_bundles`), not care-network patients |
| B3 | Diabetes signals → monitoring worklist | CGM worklist (production) and Aksh Diabetes glucose signal (demo) compute separately; one definition should feed both |
| B4 | Proof environment | Deployed project not connected to a domain/repo |
| B5 | Evaluation → release | Golden fixtures exist but no thresholds gate a release |
| B6 | Clinic enquiries → follow-up | Enquiries now email ops; no in-product status for the enquirer beyond a reference |

No defects (failing functionality) were found in the production journeys during this session; the last full CI run
(37 e2e specs, 108 unit/DB tests) passed on `main`.

---

## 9. Prioritised backlog

Complexity: S ≤ 1 day · M 2–5 days · L 1–3 weeks. Owner F = founder/CSO/legal, E = engineering.

| ID | Item | Sev. | User impact | Depends on | Cx | Owner | Acceptance criteria |
|---|---|---|---|---|---|---|---|
| P0-1 | Confirm Neon PITR on production; run and record a restore drill | High | Data loss risk | — | S | F+E | PITR window documented; restore of a branch to a timestamp performed and logged in `docs/` |
| P0-2 | Remove `OPENAI_API_KEY` from production env | High | Latent PHI-to-cloud risk | — | S | F | Key absent in `vercel env ls production`; uptime and e2e green |
| P0-3 | LLM agent flags default OFF; explicit enable per environment | High | Prevents accidental model calls | — | S | E | With no flags set, no LLM call occurs (test spies the provider); simulation enables explicitly |
| P0-4 | Guidance policy: configurable, versioned sources per organisation (decided 15 Oct) | High | Clinical rule traceability | — | S | E | Decision recorded in the platform map; organisation setting for guideline source exists |
| P1-1 | Unified clinician workspace "Work" (one queue: slot decisions, readings to verify, CGM uploads to review, overdue hand-offs, CGM urgent patients) with reason, evidence link and action | High | Clinicians see what needs them and why | — | L | E | Every item shows type, why, evidence, owner, due; actions work inline; RLS isolation e2e; empty/loading/error states; axe clean |
| P1-2 | Patient record view in tabs (summary, labs, medicines, readings, CGM, activity/audit) | Medium | Faster review, clear provenance (recorded / patient-reported / calculated) | P1-1 | M | E | Each value labelled by provenance; audit tab lists actions on the patient; isolation tested |
| P1-3 | Clinical review queue for real-patient drafts (simulation first): enqueue Track B results into `review_cases`-style queue with accept/edit/reject, reason, audit | High | Closes B1 | P0-3, P1-1 | L | E | Draft never appears as approved without a decision; edit keeps original + edited; reject needs reason; audit row per transition; transactional |
| P1-4 | Agent failure semantics: timeouts, "draft unavailable" state, no partial records | High | Safety | P0-3 | M | E | Fault-injection tests: timeout, malformed output, provider error → explicit failed state, nothing staged |
| P1-5 | Diabetes rule registry: each rule with source, section, version, date; shown with the flag | High | Traceability for safety case | P0-4 | M | E+F | 100% of diabetes flags carry a source reference; test fails on a rule without one |
| P1-6 | Distinguish observed / calculated / AI-hypothesis / clinician-confirmed on every clinical value | High | Prevents inference read as fact | P1-2 | M | E | Typed provenance field rendered as a badge; tests per type |
| P2-1 | Prompt-injection and data-minimisation guard on agent inputs | High (Track B) | Safety | P1-3 | M | E | Red-team fixtures (instructions in notes) do not change agent behaviour; only minimum fields sent |
| P2-2 | Release gate from evaluation: thresholds per agent (critical omission, unsupported claims, false-negative safety flags) | High | Measurable safety | P1-4 | M | E+F | CI job fails when a threshold is breached; thresholds signed by CSO |
| P2-3 | RLS on remaining legacy tables or retire them | Medium | Defence in depth | — | M | E | Tables either under RLS with isolation tests or dropped by migration after approval |
| P2-4 | Transactional agent audit (replace fire-and-forget) | Medium | Audit integrity | P1-3 | S | E | Agent decision without audit row is impossible (test) |
| P2-5 | Patient app: "what Aksh can and cannot do", default escalation per country, approved care instructions view | Medium | Patient safety | P0-4 | M | E | Copy reviewed by CSO; escalation shows country default when org has none |
| P2-6 | Attach proof environment (domain + repo) | Medium | Sales/clinical demos | — | S | F | demo.akshhealth.com serves `/proof`; proof e2e passes against it |
| P2-7 | Dependency patches (next 15.5.28, nodemailer 10.1.1) | Low | Security hygiene | ≥ 21 Oct | S | E | `npm audit --omit=dev` shows no runtime advisories; CI green |
| P3-1 | FHIR: Encounter, DiagnosticReport, CarePlan mappings with provenance (read, sandbox) | Medium | Integration readiness | P1-2 | L | E | Validated against FHIR R4 profiles with synthetic fixtures; idempotent; audited |
| P3-2 | Evidence retrieval with citations and abstention (only if P2-2 shows need) | Medium | Clinical trust | P2-2 | L | E+F | Citation accuracy and abstention measured on a fixed set before any workflow use |
| F-1 | Clinical safety case and hazard log; CSO appointed | Critical | Required for real clinical use | — | — | F | Signed hazard log covering Track A and planned Track B |
| F-2 | DPIA, DPA legal review, model-provider DPA | Critical | Required for real data | — | — | F | Signed documents referenced in go-live checklist |
| F-3 | Regulatory opinion (SaMD classification) for the diabetes module | Critical | Determines Track B path | F-1 | — | F | Written opinion on file |
| F-4 | Design partner and locked baseline | Critical (commercial) | First live clinic | — | — | F | Signed pilot; baseline accepted in go-live |

---

## 10. Recommended implementation sequence

1. **Stage A (this audit) + P0 items** — P0-1 to P0-4 (one to two days of engineering, plus PITR and the production key on your side).
2. **Stage B — Foundation for Track B in simulation:** P1-4 (failure semantics), P2-3/P2-4 (RLS, transactional audit).
3. **Stage C — Clinical UX:** P1-1 unified workspace (production value now, for Track A), then P1-2 patient record tabs,
   P1-6 provenance badges.
4. **Stage D — Clinical intelligence in simulation:** P1-3 review queue for real-patient drafts, P1-5 rule registry,
   P2-1 input guard, P2-2 evaluation release gate.
5. **Stage E — Integration readiness:** P3-1 FHIR mappings in sandbox; proof environment live (P2-6).
6. **Stage F — Controlled deployment:** only after F-1 to F-4. No real-patient Track B or EHR write-back before then.

Phase 2 (UX) can start with P1-1 immediately because it improves the production product without touching AI.

---

## Appendix — tests run in this session (15 Oct 2026)

- `test:clinical-proof` full suite: **pass** (includes DB suites on simulation).
- e2e production mode (`real-workspace`): **5/5 pass**; slot fill and go-live journeys pass in production mode.
- e2e simulation: marketing, accessibility, auth, organisation workspace, slot fill, self-serve onboarding, cgm,
  onboarding redirect: **pass**. CI (PRs #29–#31): full Playwright suite **pass**.
- Production probes: 11 public pages 200; closed APIs 403; health `{status:"ok"}`; migrations up to date (040).
- Not run: load/latency tests; keyboard-only journey tests; agent evaluation thresholds (none defined).
