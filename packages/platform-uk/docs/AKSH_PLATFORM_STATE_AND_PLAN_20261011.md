# Aksh Health — Platform State and Plan (one map)

**Date:** 2026-10-11
**Purpose:** one place that connects the vision documents to what is built, where the pieces are disconnected, and what
comes next. Read with the sources below; where they conflict, the founder decisions in §6 apply.

**Sources read:** `AKSH_VISION_PRD_OVERVIEW.md` (v1.4) · `volume-i/` (pointer) · `AUDIT_AND_PHASED_PLAN_20261010.md` ·
`BUILT_VS_REMAINING_AUDIT.md` · Commercial Execution PRD v1.1 · Engineering Delivery Plan v1.1 · Investor One-Pager ·
Provider Pilot Deck · Comprehensive Platform Blueprint PRD v1.0 · Comprehensive Platform Architecture diagram.

---

## 1. The vision, in one picture

**Aksh Intelligence Platform:** one auditable, human-in-the-loop layer beside the system of record. It connects
patient access and clinical workflows through auditable AI orchestration, starting with bounded administrative
automation and clinician-reviewed clinical intelligence. A named person decides; the platform never decides alone.

| Layer (Blueprint §1.1) | Job |
| --- | --- |
| A. Patient Access & Operations | Contacts, scheduling, referral admin, **cancellation-slot fill**, staff hand-off |
| B. Clinical Workflow Intelligence | Capture → drafts → safety/risk/coordination → clinician Accept/Edit/Reject → stage → audit |
| C. Condition Intelligence (Diabetes first) | Nine signals feeding HORIZON / GUARDIAN review |
| D. Patient Intelligence | Consent-aware My Health, readings, coaching drafts |
| E. Population & Equity | Registries, care gaps, equity (aggregate) |
| F. Scenario Twin | Rules / what-if (`physiologicalTwin:false`) |
| G. Research & Evaluation | Ethics-gated offline evaluation |
| H. Governed Learning | Append-only events; G-ML-1/2/3; `autoRetrain:false` |
| Foundations | Identity, tenancy, consent, FHIR interop, knowledge, audit, observability, release |

**Commercial wedge (PRD v1.1):** staff-supervised cancellation-slot fill, shadow mode first, one primary metric
(verified fill rate) and three guardrails. Clinical intelligence continues in parallel and is not sold as live.

---

## 2. What exists: two worlds in one codebase

The confusion of "we built so much, are we missing everything?" comes from this: **two complete systems live in the same
application and do not yet share data.**

### World 1 — Clinical-proof platform (built Jul–Oct 2026, synthetic data)

| Built | Evidence |
| --- | --- |
| 8 role dashboards (GP, nurse, pharmacist, admin, ICS, hospital, patient, researcher) | `app/dashboard/*` |
| 12 agents under deterministic CONDUCTOR: CANVAS(+VOICE), SYNTHESIS(+Dr.Assist), GUARDIAN, HORIZON, NEXUS, PATHWAY, COMPASS (partial), BRIDGE (sim write), SHIELD; PRISM/ATLAS not built | `lib/agents.ts`, `app/api/agents/*` |
| Clinician review loop, human gates, SHIELD audit, FHIR staging, simulated EHR | `/review`, clinical spine A–F |
| Aksh Diabetes nine areas as v1 rules (glucose "awaiting CGM data model") | `lib/disease-modules` |
| Front Desk module + Asha (voice/chat), scheduling, referral desk, answers, campaigns, a synthetic slot fill | `docs/PATIENT_ACCESS_AND_ASHA.md` |
| Staged patient-access adapter (22 tests, disabled) | `npm run test:patient-access` |
| Synthetic world: 500 patients, 100 professionals, 57 organisations | `lib/synthetic-world` |
| Twin (rules), governed learning, research evaluation gate | Volume I Ch. 9, 13, 14 |
| **Status 2026-10-11:** `npm run test:clinical-proof` passes (62 checks) | run today |

### World 2 — Real workspace (built in the 12-week programme, production-ready)

| Built | Maps to |
| --- | --- |
| Organisations, memberships, invites, registration checks; **row-level security** per organisation; patients bound to their own record | Foundations |
| Waiting list + **cancellation-slot fill v1.2**: deterministic eligibility with exclusion codes, ranking by clinic rules, versioned offer template, shadow mode, idempotency, read-back before "booked", hand-offs, expiry sweep; unreachable / escalated / opted-out outcomes | Layer A · PA-01…PA-12 |
| **Schedule connector** (FHIR R4 Slot/Appointment/Observation or JSON), capabilities declared read-only, environment labelled | Layer A · PA-10 · §7.1 |
| **CGM** (Dexcom Clarity, LibreView, generic; device feed), consensus metrics, AGP, clinician worklist; patient uploads reviewed before they count | Layer C (glucose) · D |
| **Patient app**: readings (glucose, BP, weight), link by invite code + DOB, sharing decisions, offline queue, own-data export | Layer D |
| **Go-live checklist** (DPA, DPIA, safety lead, contact channel, locked baseline) reviewed by Aksh; **weekly review** with fill rate, guardrails, sign-off | PRD §10, §12 |
| Two-step sign-in, rate limits, error monitoring, retention, organisation export, restore drills, CSP headers | Foundations |
| Today home, simplified navigation; production shows **only** this world | — |
| Public site: vision-led, two pillars, honest status labels, guides | G0 scope honesty |

**Environments:** production (tiny-river) holds real organisations only and shows World 2 only. Simulation
(floral-salad) holds both worlds.

---

## 3. Where the two worlds are disconnected

| # | Gap | Why it matters |
| --- | --- | --- |
| G1 | **Two patient models.** CONDUCTOR loads patients from `lib/mock-data/patients` (the P001–P100 demo cohort); the real workspace uses `network_patients` + observations + CGM. | The vision's core loop (signal → agents → clinician review) cannot run on the patients clinics actually load, even in simulation. |
| G2 | **Real CGM does not feed Aksh Diabetes.** The glucose signal reads fixtures or patient-state ingest (`lib/disease-modules/diabetes/glucose.ts`; CGM modality schema is open question OQ-DIAB-1). World 2 already has that CGM model (`cgm_readings`, trusted readings, consensus metrics); nothing connects them. | Journey 4 (CGM → diabetes signal → review) stays `[FUTURE]` though both halves exist. |
| G3 | **Two slot-fill implementations.** Front Desk's synthetic slot fill and the staged adapter (22 tests) vs the production `lib/access` workflow. | PRD PA-101/102 asks for one canonical schema and source of truth. |
| G4 | **The clinical intelligence is invisible to buyers and investors.** Production hides World 1 (correctly); there is no governed, clearly labelled place to show it. | The site describes the platform; nobody outside can see it work. |
| G5 | **Source-of-truth docs are stale.** Vision overview §3 still says production = "8 dashboards + Patel demo"; Built-vs-Remaining is dated July. | External readers get the old state. |
| G6 | **Positioning conflict.** 10 Oct audit: not an NHS product, any market. PRD v1.1: UK-first. | Resolved for the public site (country-neutral, founder 2026-10-11); pilot materials may stay UK-specific. |
| G7 | **PRD items not yet in code:** complaint and staff-time capture (§10.2); SHIELD-style degraded state for access audit failures; offer template governance (preview/diff/versions, PA-108); contact adapter behind a default-off flag (PA-109). | Needed before a staff-assisted stage. |

---

## 4. Plan

### Now — the wedge (PRD v1.1, 90 days) · mostly founder work
1. Design partner: one clinic, ops owner, technical sponsor, clinical sponsor (PRD §3, §15).
2. Baseline: four weeks of freed/filled slots, locked through the go-live checklist.
3. Governance: CSO, privacy lead (DPIA), MHRA opinion for the clinical scope, legal review of the DPA.
4. Run shadow mode (weeks 3–5), staff-assisted only if approved (6–8), readout (9–10) from the weekly review.

### Next — engineering, in this order
1. **G1 one patient spine:** clinical agents read `network_patients`, observations and CGM (simulation first), behind the
   same RLS; the demo cohort becomes seed data in that spine.
2. **G2 CGM → Aksh Diabetes:** glucose signal from trusted CGM readings into HORIZON/GUARDIAN drafts in the review queue.
3. **G4 clinical-proof environment:** a separately hosted, clearly labelled synthetic environment (e.g. a demo subdomain on
   the simulation database) for buyers, investors and the CSO, never mixed into production.
4. **G3 one slot fill:** Front Desk and the staged adapter call `lib/access`; retire the duplicate.
5. **G7 PRD items:** complaint and staff-time capture, access audit degraded state, template governance.
6. **G5 docs:** update the vision overview §3 and Built-vs-Remaining to this map.

### Later — Blueprint layers D–H
Patient intelligence beyond readings, population and equity on real organisations, twin, research gate, governed
learning on pilot evidence; then the first market's live-data path (Track B) with its regulator.

---

## 5. Hard rules that stay (Volume I NO-1…NO-10, PRD §8.1)

No autonomous clinical decisions · no automatic prescribing · not an EHR replacement · no unsanctioned EHR write ·
no silent retraining · no implied certification · no unexplained output · no real PHI without a governed decision ·
no per-disease safety stack · no Diabetes-only lock-in. Honesty fields stay literal (`liveEmis`, `ehrWrite`,
`hitlRequired`, `autoRetrainTriggered`, `adapterEnvironment`, `physiologicalTwin`).

## 6. Founder decisions on record

| Date | Decision |
| --- | --- |
| 2026-10-10 | Aksh is not an NHS-only product; markets are configuration (audit) |
| 2026-10-11 | Production shows the real workspace only; no public demos or walkthroughs |
| 2026-10-11 | Public site leads with the original vision; two pillars per PRD v1.1; country-neutral |
| 2026-10-11 | Hero style: spruce gradient panel |
| Open | Hosting a labelled clinical-proof environment (G4) · first live market · Patel narrative (suspected vs confirmed DVT) · Volume I acceptance |
