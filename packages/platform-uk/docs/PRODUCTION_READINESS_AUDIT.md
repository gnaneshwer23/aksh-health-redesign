# Production readiness audit — Aksh Health (platform-uk)

**Date:** 2026-07-23 (BST)  
**Auditor:** automated + codebase evidence  
**Live:** https://akshhealth.com  
**Repo:** `gnaneshwer23/0ne-Health` · package `packages/platform-uk`  
**Main SHA audited:** `c553b6d198de4d38c68f83da7f174b7cb93e3593`  
**Local HEAD:** matches `origin/main` (clean tracked tree; large untracked `data/` dumps present)

---

## Verdicts (read these first)

| Track | Bar | Verdict |
| --- | --- | --- |
| **A — Demo / pilot marketing launch** | Synthetic HITL product; honest marketing; demo script; no live EMR | **GO WITH GAPS** |
| **B — Live NHS clinical production** | IM1/EMIS write-back, CIS2, CSO safety case, live FHIR sync | **NO-GO** |

**One-liners**

- **A:** Shipable for synthetic HITL demos/pilots on akshhealth.com, but CI `verify` is red (stale marketing string asserts) and workspace hygiene has ~300 untracked `data/` dumps — fix before calling the launch “green.”
- **B:** Hard `liveEmis:false`; no IM1/EMIS Partner write-back, Medplum OAuth not production, no CSO-signed gates — not NHS EMR-ready.

---

## Snapshot — git / CI / Vercel

| Check | Result | Evidence |
| --- | --- | --- |
| Latest `main` SHA | `c553b6d` — *Fix hero parallel-drafts spacing into a readable 2×2 grid.* | `git rev-parse origin/main` |
| Push status | Local `main` == `origin/main` | `git status -sb` |
| GitHub Production deploy SHA | `c553b6d…` success | Deploy `5574846540` |
| Vercel production | Ready · aliases include `akshhealth.com` | `dpl_9fg9C23ZzonaNAhMbZV5TpTSNrCu` (~16:06 BST) |
| Prod matches main? | **Pass** | Same SHA on GitHub deployment + live alias |
| Workflows | Only `.github/workflows/e2e.yml` | — |
| Latest E2E on main | **Fail** (8+ consecutive after marketing polish) | [run 30018950439](https://github.com/gnaneshwer23/0ne-Health/actions/runs/30018950439) |
| Failure locus | `npm run verify` → `route-smoke` before Playwright | Assert: `app/resources/page.tsx` must include `"Twelve Phase-1 directory agents"` (copy removed in redesign) |
| Last green E2E | ~13:44 UTC — “Ship V1 Clinical Signal design refresh” | run before hero/cohort marketing commits |
| Local `typecheck` | **Pass** | `npm run typecheck` |
| Local `test:clinical-proof` | **Fail (partial)** after marketing redesign | `clinical-spine-phase-c.test.ts` expects `LIVE · in CONDUCTOR` / Twelve Phase-1 strings; earlier HITL/FHIR/SHIELD/spine A–B units still pass |

---

## Verdict A — Demo / pilot marketing launch

**GO WITH GAPS** — product spine and live site are demoable; engineering CI and copy-assert drift are the main launch gaps.

### Checklist A

| Area | Status | Notes |
| --- | --- | --- |
| Marketing: no `liveEmis:false` on public homepage | **Pass** | Live `/` has “Designed for · not a live feed” / “Drafts only · no live EMR write”; e2e asserts zero `liveEmis:false` on marketing |
| Marketing: no 100-patient volume claim | **Pass** | Policy in `MARKETING_12_FIXES_AUDIT.md`; live copy uses Patel / clinician gate; cohort stays on dashboards |
| Hero pipeline + CTAs | **Pass** | Agent pipeline (CANVAS→CONDUCTOR→drafts→clinician→FHIR/SHIELD); Get started / Book walkthrough / Patel |
| Contrast polish | **Partial** | Recent clinician-gate contrast fix on main; axe limited to `/` + `/signup`; WCAG still “ongoing” |
| HITL before staging | **Pass** | Accept → BRIDGE; `clinicianAccept:true` required |
| SHIELD audit | **Pass** | Immutable events → Neon/`shield_audit` |
| CONDUCTOR orchestration | **Pass** | Deterministic spine; `hitlRequired` / `liveEmis:false` |
| `liveEmis:false` hard | **Pass** | Types, API reject of `liveEmis:true`, sandbox never writes |
| BRIDGE FHIR-in-Neon | **Pass** | `aksh.fhir_staging_bundles` + file fallback |
| Sim write-back only | **Pass** | Token + replay deny; never live EMIS |
| `/demo/script` + Patel | **Pass** | Guided demo + `/demo/patel` |
| 100 cohort demo-only | **Pass** | Seeded synthetic P027–P100; not homepage marketing |
| Auth / 8 role dashboards | **Pass** (conceptual) | Role paths + onboarding; public GP/ICS/Hospital demos allowlisted |
| CI green | **Fail** | `verify` red on main |
| Secrets optional for demo | **Pass** | Demo path works without IM1/Medplum (`DEMO_LAUNCH_WITHOUT_IM1.md`) |
| Deepgram | **Partial** | SDK present; simulated ASR without key (acceptable for demo) |
| Untracked `data/` dumps | **Fail** (hygiene) | ~326 untracked under `data/` (consent-grants, modality-samples, health-plans, review-cases, …); `.gitignore` only covers a few patterns |

### Marketing honesty nuance (Partial polish)

Live Integrate copy says approved outputs are “staged to EMIS Web or SystmOne on clinician confirmation.” Hero honesty still says drafts only / not a live feed. Acceptable for pilot if walkthroughs reinforce **sim/staging**, but tighten Integrate wording if buyers confuse staging with live write-back.

---

## Verdict B — Live NHS clinical / EMR production

**NO-GO** — by design and by partner/governance gaps.

### Checklist B

| Area | Status | Notes |
| --- | --- | --- |
| Live EMIS / IM1 write-back | **Fail** | Hard-disabled; Partner sandbox never sets `ehrWriteAttempted` |
| Medplum production sync | **Fail** | `ENABLE_MEDPLUM_SYNC=false` default; OAuth client historically invalid |
| CIS2 / NHS identity | **Fail** | Documented partner-blocked; synthetic auth for demos |
| CSO-signed safety case / Gate 1–3 | **Fail** | Evidence pack templates exist; not signed production gates |
| DTAC / DCB0129 clinical safety | **Fail** | Templates / rehearsal only |
| Live PDS / real NHS numbers | **Fail** | Synthetic cohort only |
| Flip `liveEmis` | **Fail** | Gated to future N7 signed go/no-go — not an eng env switch |
| Pen test / DR evidence | **Fail / Partial** | Docs placeholders; not production-complete |
| RBAC for real tenants | **Partial** | Middleware roles OK; public demo allowlists unsuitable for live clinical |

See also: `docs/E2E_CLINICAL_PROOF.md` — **Production-ready: Not met**.

---

## Clinical spine scorecard (shared)

| Component | Demo bar | Live NHS bar | Evidence |
| --- | --- | --- | --- |
| HITL Accept/Edit/Reject | Pass | Required but insufficient alone | `review-queue`, bridge-staging API |
| SHIELD | Pass | Pass as platform audit; not a CSO substitute | `shield-audit`, Neon table |
| CONDUCTOR | Pass | Pass as orchestrator | `lib/clinical-spine/orchestrate.ts` |
| `liveEmis:false` hard | Pass (correct for demo) | Fail (must stay false until N7) | bridge + emis-partner-sandbox |
| BRIDGE → Neon FHIR | Pass (staging) | Fail (not live EMR) | `fhir_staging_bundles` |
| Sim write-back | Pass | Fail (not live) | `ehr-writeback-sim` |

---

## Top 5 blockers / polish items (ranked)

| Rank | Item | Track | Why it matters | Suggested fix |
| ---: | --- | --- | --- | --- |
| **1** | CI `verify` red — stale `route-smoke` / phase-c marketing asserts | **A** | Main cannot prove green; Playwright never runs | Update asserts to current copy (`InteroperabilityDiagram` honesty, resources five-layer language) or restore intentional strings |
| **2** | Partner IM1 / EMIS + signed N7 `liveEmis` path | **B** | Blocks any live write-back claim | Partner outreach + UAT + signed go/no-go (`PHASE2_PARTNER_CHECKLIST`, N3–N7) |
| **3** | Medplum OAuth / live FHIR sync | **B** | Required for integrated FHIR completeness | Valid client secrets + `ENABLE_MEDPLUM_SYNC` rehearsal → production decision |
| **4** | Untracked `data/` dump sprawl (~300+ files) | **A** | Repo hygiene, accidental commit risk, noisy status | Broaden `.gitignore`; prune local dumps; keep only seed fixtures tracked |
| **5** | Clinical governance for live care (CSO, DTAC, CIS2) | **B** | Non-negotiable for NHS production | Complete evidence pack Gates 1–3 with named sign-off |

**Honourable mentions:** Deepgram live ASR (demo polish only); Integrate marketing wording ambiguity; contrast/a11y breadth beyond homepage; public unauthenticated demo dashboards must stay out of live clinical tenancy.

---

## What is already strong for demos

1. **Hard anti-live-EMIS guards** across API, types, DB default, partner sandbox.  
2. **Honest marketing** on cohort volume and `liveEmis:false` leakage (e2e-enforced).  
3. **End-to-end synthetic loop:** capture → CONDUCTOR drafts → HITL → BRIDGE/Neon → sim write → SHIELD.  
4. **Demo ops:** `/demo/script`, Patel walkthrough, 100 synthetic cohort for outcomes demos.  
5. **Deploy path:** Vercel production tracks `main` SHA `c553b6d` on `akshhealth.com`.  
6. **Typecheck** clean; core HITL/FHIR/SHIELD unit contracts still green when run individually.

---

## Path to A = GO (close the gaps)

1. Fix `tests/route-smoke.test.ts` + `tests/clinical-spine-phase-c.test.ts` (and any AgentGrid “Twelve agents” asserts) to match the Clinical Signal marketing redesign.  
2. Re-run `npm run verify` + green GitHub E2E on `main`.  
3. Gitignore / clean untracked `data/*` dumps; confirm no secrets.  
4. Optional: one rehearsed production walkthrough from `DEMO_LAUNCH_D1_AUDIT.md` on akshhealth.com.  
5. Optional copy tweak: Integrate pillar → “staged (sim) for EMIS/SystmOne pathways — not live write-back.”

## Path to B = GO (long pole)

Partner credentials → Medplum OAuth green → IM1/EMIS sandbox then live → CIS2 → CSO-signed safety case → Gate 1–3 → signed N7 flip of `liveEmis` under change control. **Do not** treat eng env flags as the go-live switch.

---

## Related docs

- `docs/DEMO_LAUNCH_D1_AUDIT.md` — demo hardening PASS  
- `docs/DEMO_LAUNCH_WITHOUT_IM1.md` — demo without partner  
- `docs/E2E_CLINICAL_PROOF.md` — four completion levels; production not met  
- `docs/MARKETING_12_FIXES_AUDIT.md` — cohort honesty policy  
- `docs/PHASE2_PARTNER_CHECKLIST.md` / `docs/PHASE3_REGULATORY_PATH.md` — NHS path  

---

*Audit artefact only — does not change runtime flags or partner posture.*
