# Aksh Health — Full Surface + Clinical Activity Audit

**Date:** 2026-08-12  
**Package:** `packages/platform-uk`  
**Production:** https://akshhealth.com  
**Base commit under test:** `0138da9` (publication-ready simulated clinic)  
**Audit follow-up commit:** (this pass)  
**Master correlationId (this pass):** `aksh-master-20260812-4fed430e` (also re-traced in `docs/reports/E2E_MASTER_JOURNEY_20260812.md`)  
**Golden patient:** P002 Mr James Patel  
**Framing:** Diabetes-specific · region-adaptable (not NHS-primary) · honesty SIMULATED vs LIVE

---

## Verdict

**Yes — clean end-to-end for the publication simulated clinic**, with honesty class `SIMULATED END-TO-END` / engineering `INTERNAL TEST READY`.

- Landing → auth → all eight role dashboards smoke clean on production.
- Master Journey **35/35 PASS**; stakeholder clinic **PASS**.
- Browser HITL Accept moved a Patel draft into **Written to Record (1)** with `liveEmis:false` honesty intact.
- Agents drawer (CANVAS / VOICE / CONDUCTOR / HORIZON / GUARDIAN / SYNTHESIS / PATHWAY / BRIDGE) opens with correct invoke affordances and no silent-fail framing.
- Ask Aksh: **available when signed in** (`available:true` for GP); public demo correctly gates chat with clearer availability UX after this pass’s fix.
- Not claimed: clinically validated · autonomous care · live mic/EHR/EPS/lab/CGM vendor feeds.

---

## PASS / FAIL tables

### Landing

| Path | Result | Notes |
| --- | --- | --- |
| `/` | **PASS** | Hero + honesty (not live feed / not live write) |
| `/platform` | **PASS** | Eight roles · diabetes & primary care |
| `/security` | **PASS** | Clinical deployments (not NHS-locked copy) |
| `/contact` | **PASS** | Talk to Aksh Health |
| `/get-started` | **PASS** | Organisation access (region-adaptable) |
| `/demo` → `/demo/patel` | **PASS** | Patel walkthrough |
| `smoke:public` @ prod | **PASS** | 9 pages after marker refresh |

### Auth

| Path | Result | Notes |
| --- | --- | --- |
| `/signup` | **PASS** | Create your account |
| `/signin` | **PASS** | Credentials + enterprise IdP placeholder honesty |
| Protected dashboards unauth | **PASS** | Redirect to signin (nurse/pharmacist/admin/patient/researcher) |

### Dashboards (`smoke:all` @ prod)

| Role | Result | Notes |
| --- | --- | --- |
| GP | **PASS** | Public demo + auth; HonestyStatusBar; Review Queue; Agents; Ask Aksh |
| Nurse | **PASS** | Auth; VOICE Care / GUARDIAN alerts (timeout default raised to 25s) |
| Pharmacist | **PASS** | Med review / interactions / BNF · liveEmis:false |
| Admin | **PASS** | Users · integrations · consent · audit · enquiries |
| Patient | **PASS** | Signed-in companion surface |
| ICS | **PASS** | Public demo + neo4j honesty header |
| Hospital | **PASS** | Public + auth command centre |
| Researcher | **PASS** | Evaluation export API |

### Clinical activity loops

| Loop | Result | Class | Evidence |
| --- | --- | --- | --- |
| **Master Journey** | **PASS** 35/35 | SIMULATED E2E | `npm run test:master` |
| **Stakeholder clinic** | **PASS** | SIMULATED | patient→population_ops matrix |
| **Scribe** VOICE→SYNTHESIS | **PASS** | SIMULATED | Master MJ-25; Agents VOICE honesty |
| **Agents** CONDUCTOR/GUARDIAN/ORACLE(HORIZON)/SYNTHESIS | **PASS** | LIVE rules / SIMULATED invoke UX | Drawer + Master; no silent fail toasts wired |
| **Lab** delay→complete | **PASS** | SIMULATED | Master |
| **Pharmacy** adherence→escalate | **PASS** | SIMULATED | Master + stakeholder |
| **Referral** HITL Accept-for-send | **PASS** | SIMULATED | Master PATHWAY |
| **Nurse/Coordinator** | **PASS** | SIMULATED | Master nurse follow-up + coordinator tasks |
| **CGM hypo escalate** | **PASS** | SIMULATED | Master MJ-26 |
| **HITL Accept/Edit/Reject** | **PASS** | LIVE gate | Browser Accept → Written to Record (1) |
| **Learning / Patient State** | **PASS** | LIVE (Neon) | Master LEARN steps |
| **Ask Aksh** | **PASS** (signed-in) / gated (public) | Assisted | API `available:true` when authenticated |

---

## Glitches found

### Fixed this pass (ship)

| Severity | Issue | Fix |
| --- | --- | --- |
| P1 | `smoke:public` expected NHS-primary security/get-started copy | Markers → region-adaptable clinical/organisation copy |
| P1 | GP smoke expected outdated “AI Review Queue” | → “Review Queue” |
| P1 | Pharmacist/ICS smokes expected dismissible/outdated hero strings | Durable SSR markers; ICS “Synthetic ICS cohorts” |
| P1 | Hero demo paths `useState(true)` hid content until hydrate (SSR empty) | Default `dismissed=false` (GP + pharmacist) |
| P1 | Ask Aksh showed disabled prompts while availability unknown / public unauth silent | Loading state + sign-in gate message |
| P2 | Patient search placeholders “NHS number” | → “patient ID” (region-adaptable) |
| P2 | Nurse handover flaky under 12s prod timeout | Default smoke timeout 25s |

### Remaining (non-blocking for publication sim clinic)

| Severity | Issue | Notes |
| --- | --- | --- |
| P2 | Master Journey process can hang after PASS (open DB handles) | Printed PASS 35/35; kill needed; artifact written |
| P2 | `smoke:loop` needs `SMOKE_LOOP_*` credentials (not in `.env.local`) | Covered by Master + browser HITL instead |
| P3 | Some UK NHS number fixtures remain in synthetic patient IDs | Intentional synthetic UK clinic fixtures; UI search copy de-NHS’d |
| Out of scope | Live VOICE mic · live EMR write · live EPS · live lab/CGM vendors | Explicitly NOT IMPLEMENTED; honesty preserved |

---

## Commands executed

```bash
SMOKE_BASE_URL=https://akshhealth.com npm run smoke:public   # PASS
SMOKE_BASE_URL=https://akshhealth.com npm run smoke:all      # PASS (8 roles)
npm run test:master                                          # PASS 35/35
npx tsx tests/e2e-platform-stakeholder-clinic.test.ts        # PASS
# Browser: landing, /platform, /dashboard/gp Agents + Ask Aksh + HITL Accept
curl https://akshhealth.com/api/health                       # postgres live · neo4j live
```

---

## Publication readiness

| Question | Answer |
| --- | --- |
| Clean landing → dashboards? | **Y** |
| Clinical activity loops execute (not paint-only)? | **Y** (Master + HITL browser) |
| SIMULATED vs LIVE honesty intact? | **Y** |
| Diabetes-specific / not NHS-primary marketing? | **Y** (smoke markers + copy) |
| Clinically validated / autonomous care? | **N** (correctly not claimed) |
