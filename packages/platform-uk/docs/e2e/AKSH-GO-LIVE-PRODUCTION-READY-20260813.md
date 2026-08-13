# Aksh Health — Production Go-Live Readiness

**Date:** 2026-08-13  
**Product:** Aksh Health (`packages/platform-uk`)  
**Production:** https://akshhealth.com  
**Verdict framing:** Diabetes-specific, region-adaptable clinic coordination (not NHS-primary). Honesty class: **SIMULATED** clinical loops vs **LIVE** platform infra.

---

## Overall verdict: **GO LIVE** (demo / simulated clinic)

**GO** for a **synthetic / demo launch** on akshhealth.com with cohort credentials, HITL review, and honest `liveEmis:false` staging.

**Not GO** for: open public registration with reliable transactional email to arbitrary mailboxes, live EMR write-back, autonomous care, or clinical validation claims.

### Why GO
- `/api/health` — Postgres **live**, Neo4j **live**
- Public marketing + legal pages load; nav/footer links OK
- Registration API creates accounts; demo cohort sign-in works; session persists
- Onboarding gate redirects new users to role-select
- All **8 role dashboard smokes PASS** against production
- Master Journey **35/35 PASS**; stakeholder clinic **PASS**
- GP browser loop: HonestyStatusBar/`liveEmis:false`, Agents drawer, Ask Aksh, HITL Accept → Written to Record (1)
- Organisation enquiry (get-started) full 3-step submit **PASS** (ref `AKSH-1622`)
- Vercel production deployments **Ready**

### Why not unconstrained GO
- Resend still uses `onboarding@resend.dev` → password-reset / verification email delivery limited to the Resend account owner until a custom domain is verified
- ~~Secondary `/cases/case-005/evidence?demo=1` 500~~ — **fixed and retested 200** after `3fcc769`
- Clinical evidence remains **UNVALIDATED**; EMR/EPS/lab/CGM vendor feeds are **NOT live**

---

## Area results

| Area | Result | Notes |
| --- | --- | --- |
| 1. Marketing & public | **PASS** | Home, Platform, Security, Contact, Demo/Patel, cookies/privacy/terms — 200; `smoke:public` 9/9 |
| 2. Registration & access | **PASS** (with email caveat) | See registration detail below |
| 3. Onboarding | **PASS** | Synth GP redirected `/dashboard/gp` → `/onboarding/role-select?role=gp` |
| 4. All 8 role dashboards | **PASS** | `smoke:all` against https://akshhealth.com |
| 5. Clinical / stakeholder loops | **PASS** | Master 35/35; stakeholder clinic PASS; GP HITL Accept executed in browser |
| 6. Production infrastructure | **PASS** | Health OK; critical env present locally/prod; Vercel Ready |
| 7. Security / honesty | **PASS** | `liveEmis:false` visible; RBAC redirects for nurse/admin/patient/etc.; `/login` → `/signin` fix deployed this pass |

### Registration detail (user-stressed)

| Check | Result |
| --- | --- |
| `/signup` page load | PASS |
| Validation rejects bad payload | PASS (400) |
| Synthetic account create | **PASS** — `golive.synth.20260813160037@demo.akshhealth.com` → HTTP 201 `usr_62a422e60e524e9b` |
| Sign-in after signup | PASS (NextAuth session; `onboardingComplete:false`) |
| Demo cohort `/signin` | PASS — `gp01@demo.akshhealth.com` |
| `/get-started` 3-step browser submit | **PASS** — Enquiry received · Reference **AKSH-1622** |
| Access-request API | PASS (also earlier API ref `AKSH-C39F`) |
| Password reset | **PARTIAL** — endpoint exists; works for Resend-owner email; other recipients fail at Resend (403 sandbox) until domain verified. Code now returns enumeration-safe generic OK (no secret leak). |
| Email verification | **PARTIAL** — implemented; send limited by same Resend constraint; signup still succeeds |
| Unauthenticated protected routes | PASS — nurse/admin/onboarding → `/signin?callbackUrl=…`; GP/ICS/Hospital public demo dashboards intentionally open |
| Session persistence | PASS |
| `/login` vs `/signin` | **FIXED** this pass — `/login` redirects to `/signin` |

**Cleanup note:** Synthetic users matching `@demo.akshhealth.com` (including `golive.synth.*`) can be removed with `npm run auth:cleanup-demo -- --apply`. Enquiry rows are durable admin-visible records (safe to ignore/delete in admin organisation enquiries).

---

## SIMULATED vs LIVE (honest)

| Capability | Class |
| --- | --- |
| Postgres / Neon patient-state & auth | **LIVE** |
| Neo4j graph (prod probe) | **LIVE** |
| NextAuth sessions, signup, RBAC middleware | **LIVE** |
| Organisation enquiry intake + notify (to owner inbox) | **LIVE** (notify depends on Resend allow-list) |
| HITL Accept / Edit / Reject UI + staging | **LIVE** (platform) / write-back **SIMULATED** |
| Agents drawer / Ask Aksh | **LIVE** UI · reasoning may be rules/LLM; honesty bar present |
| VOICE mic / live ASR | **NOT IMPLEMENTED** / simulated path |
| Lab / pharmacy / referral / CGM / appointments actors | **SIMULATED** (Master) |
| EMIS / SystmOne / EPS live write | **NOT IMPLEMENTED** · `liveEmis:false` |
| Clinical validation / MHRA / CQC | **NOT CLAIMED** |

---

## Blockers remaining

| Severity | Item | Action |
| --- | --- | --- |
| **P1 ops** | Resend domain not verified (`EMAIL_FROM` = `Aksh Health <onboarding@resend.dev>`) | Verify `akshhealth.com` (or subdomain) at resend.com/domains; set `EMAIL_FROM` to that domain in Vercel env; retest forgot-password to a non-owner inbox |
| ~~P2 case-005 evidence~~ | **RESOLVED** | Prod: HTTP 200 + “Case Evidence”; walkthrough smoke full PASS |
| None P0 | Identity / safety / fake-live-EMR claims | No P0 found |

---

## Commit / deploy hashes

| Item | Value |
| --- | --- |
| Pre-pass HEAD | `65fe2924c564fab8b53b48520edc7ed78147fd3d` |
| Go-live fix commits | `7f5ca29` · `3fcc769` · doc `68822e9` |
| Post-fix Vercel | `0ne-health-av5cnqs1w` / `dpl_CD1xAy6D3eTKHds3PAJGaUGA6Xxq` · Production · **Ready** · https://akshhealth.com |
| Walkthrough smoke (final) | **PASS** all protected + public pages including case-005 evidence |
| Master correlationId | `aksh-master-20260812-76f0355d` |
| Master report | `docs/reports/E2E_MASTER_JOURNEY_20260813.md` |

### Fixes in this pass
1. `middleware.ts` — `/login` → `/signin`
2. `forgot-password` — never leak Resend errors; generic OK response
3. `cases/[id]/evidence` — `demo=1` falls back to shared `case-005`
4. `smoke-walkthrough-path.mjs` — align public expectations with current marketing
5. Master test clean exit

---

## 5-minute operator checklist (going live now)

1. Open https://akshhealth.com — confirm hero “Clinical work, properly coordinated” and footer legal links.
2. Sign in: `gp01@demo.akshhealth.com` / password from `docs/DEMO_LAUNCH_CREDENTIALS.md`.
3. On GP dashboard, confirm **`liveEmis:false`** in hero path / Ask Aksh / Agents.
4. Select **Mr James Patel** → Accept one review-queue draft → confirm **Written to Record** increments (staging, not live EMR).
5. Open Agents + Ask Aksh drawers; close them.
6. Optional: `/get-started` submit a real org enquiry you want in the inbox (`ACCESS_REQUEST_NOTIFY_EMAIL`).
7. Do **not** claim live EMIS, NHS login, or clinically validated care.
8. After this deploy: hit `/login` (should land on `/signin`); optionally `/cases/case-005/evidence?demo=1` as GP (expect 200).
9. Ops follow-up (same day): verify Resend domain before inviting external emails that need reset/verify mail.
