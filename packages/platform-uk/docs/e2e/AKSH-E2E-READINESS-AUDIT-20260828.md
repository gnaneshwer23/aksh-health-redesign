# Aksh Health — End-to-End Readiness Audit

**Date:** 2026-08-28  
**Product:** Aksh Health (`packages/platform-uk`)  
**Production:** https://akshhealth.com  
**Repo:** gnaneshwer23/0ne-Health  
**Auditor:** Automated audit (local execution + production probes)  
**Framing:** Diabetes-specific · region-adaptable (not NHS-primary) · honesty: LIVE vs SIMULATED vs NOT IMPLEMENTED

---

## Executive summary

Aksh Health **functions end-to-end as a simulated diabetes care-coordination clinic** on production infrastructure. The full CONNECT → UNDERSTAND → REASON → DECIDE → ACT → LEARN loop closes under Master Journey (35/35) and stakeholder clinic coverage. Paired gp01 + patient01 on **P002 (Mr James Patel)** is wired and verified.

It is **not** ready for live clinical care (real EMR/EPS/lab/voice) or unconstrained external-user email flows.

| Tier | Verdict |
| --- | --- |
| Demo / simulated diabetes clinic | **READY** |
| Paired doctor + patient session | **READY** |
| Production go-live for external users (registration/email) | **MOSTLY READY** |
| Live clinical care (real EMR/EPS/lab/voice) | **NOT READY** |

**Recommendation:** **Ship as-is for demo / paired-clinic use** with honest `liveEmis:false` labelling. **Fix Resend domain (P1)** before inviting external users who need password-reset or verification email. **Resume Neo4j Aura (P2)** before claiming graph features are live in production.

---

## 1. Git state

| Check | Result |
| --- | --- |
| Branch | `main` |
| HEAD | `296ec73` — *Update Playwright assertions for Review Queue rename and E2E admin gate.* |
| Uncommitted changes | Untracked only: `packages/platform-uk/docs/architecture/` |
| Latest main commit age | 2026-08-13 (15 days before this audit) |
| Prior fixes referenced | `dc8d12d` (boundPatientId P002), `ce012d6` (diabetes ingest isolation), consent Postgres |

---

## 2. CI (GitHub Actions)

| Check | Result |
| --- | --- |
| Workflow | **E2E Tests** |
| Latest run | [31723002519](https://github.com/gnaneshwer23/0ne-Health/actions/runs/31723002519) — **success** on `296ec73` (2026-08-13) |
| Jobs | E2E platform unit gates ✓ · Playwright E2E ✓ |
| Runs since HEAD | **None** — no new pushes to main since 2026-08-13 |
| Local re-validation (2026-08-28) | typecheck ✓ · test:workflow ✓ · Master 35/35 ✓ · stakeholder clinic ✓ |

**Note:** CI is green at last push but **stale**; this audit re-ran the critical suites locally and against production today.

---

## 3. Automated tests (executed 2026-08-28)

| Suite | Command / target | Result |
| --- | --- | --- |
| Typecheck | `npm run typecheck` | **PASS** |
| Workflow + route-smoke + clinical-proof | `npm run test:workflow` | **PASS** (~103s) |
| Master Journey | `npx tsx --env-file=.env.local tests/e2e-platform-master.test.ts` | **PASS** 35/35 · correlationId=`aksh-master-20260812-0d0647c4` · P002 |
| Stakeholder clinic | `npx tsx tests/e2e-platform-stakeholder-clinic.test.ts` | **PASS** (10 roles incl. care_coordinator) |
| Demo patient binding | `npx tsx tests/demo-patient-binding.test.ts` | **PASS** |
| Ask Aksh patient chat | `npx tsx tests/ask-aksh-patient-chat.test.ts` | **PASS** |
| Public pages smoke | `SMOKE_BASE_URL=https://akshhealth.com npm run smoke:public` | **PASS** 9/9 |
| All dashboard smokes | `SMOKE_BASE_URL=https://akshhealth.com npm run smoke:all` | **PASS** 8/8 |

---

## 4. Production health

### `/api/health` (2026-08-28)

```json
{
  "status": "ok",
  "database": { "configured": true, "connected": true, "mode": "live" },
  "neo4j": {
    "configured": true,
    "connected": false,
    "mode": "mock",
    "required": false,
    "note": "Neo4j Aura may be paused or unreachable..."
  }
}
```

| Component | Class | vs 2026-08-13 go-live |
| --- | --- | --- |
| Postgres / Neon | **LIVE** | Unchanged ✓ |
| Neo4j Aura | **MOCK / disconnected** | **Regression** — was LIVE at go-live |
| NextAuth / sessions | **LIVE** | ✓ |
| Honesty contract | `liveEmis:false` | ✓ |

### Key page probes

| Path | HTTP | Notes |
| --- | --- | --- |
| `/` | 200 | Marketing home |
| `/signin`, `/signup`, `/get-started` | 200 | Auth + org enquiry |
| `/onboarding` | 307 | Redirect (unauthenticated) |
| `/dashboard/gp`, `/dashboard/ics`, `/dashboard/hospital` | 200 | Public demo allowlist |
| `/dashboard/patient`, `/dashboard/nurse`, etc. | 307 | RBAC → signin ✓ |
| `/login` | 307 → `/signin` | Fixed in go-live pass ✓ |
| Signup API validation | 400 on incomplete payload | Endpoint live ✓ |

---

## 5. Surface coverage

| Surface | Status | Class |
| --- | --- | --- |
| Landing / marketing | **PASS** | LIVE pages |
| Signup / signin | **PASS** | LIVE (email delivery partial — see blockers) |
| Get-started (org enquiry) | **PASS** | LIVE intake |
| Onboarding gate | **PASS** | LIVE redirect to role-select |
| GP dashboard | **PASS** | LIVE UI · sim data |
| Nurse dashboard | **PASS** | LIVE UI · auth required |
| Pharmacist dashboard | **PASS** | LIVE UI · auth required |
| Admin / practice-manager | **PASS** | LIVE UI · auth required |
| Patient dashboard | **PASS** | LIVE UI · auth required |
| ICS dashboard | **PASS** | LIVE UI · public demo |
| Hospital dashboard | **PASS** | LIVE UI · public demo + auth |
| Researcher dashboard | **PASS** | LIVE UI · auth required |

**8 role dashboards** exercised by `smoke:all`. Stakeholder clinic adds **care_coordinator**, **specialist**, **lab**, **safety**, **population_ops** as simulated actors in the Master loop (not separate dashboard products).

---

## 6. Clinical loop (vision: STATE → INTELLIGENCE → DECISION → INTERVENTION → LEARNING)

| Step | Master ID | Status | Class |
| --- | --- | --- | --- |
| Identity / CONNECT | MJ-01 | PASS | CONTRACT · P002 canonical |
| Patient state ingest | MJ-03–04 | PASS | **LIVE** (Postgres facts) |
| Detect / golden paths | MJ-05 | PASS | PARTIAL |
| Orchestrate + agents | MJ-06–07 | PASS | **LIVE** (SYNTHESIS, GUARDIAN, ORACLE, NEXUS) |
| Decision gate | MJ-08 | PASS | **LIVE** |
| HITL Accept | MJ-10 | PASS | **LIVE** platform · staging write-back |
| Health plan / intervention | MJ-11, MJ-15 | PASS | PARTIAL / LIVE |
| Learning loop | MJ-12–14, MJ-21 | PASS | **LIVE** · `autoRetrain:false` |
| Lab delay/complete | MJ-17–18 | PASS | **SIMULATED** |
| Pharmacy | MJ-19 | PASS | **SIMULATED** |
| Nurse follow-up | MJ-20 | PASS | **SIMULATED** |
| Referral draft | MJ-22 | PASS | **SIMULATED** |
| VOICE → SYNTHESIS | MJ-25 | PASS | **SIMULATED** (`liveMic:false`) |
| CGM safety | MJ-26 | PASS | **SIMULATED** |
| Coordinator tasks | MJ-27 | PASS | **SIMULATED** |
| Consent revoke | MJ-24 | PASS | **SIMULATED** (grant registry **LIVE** on Neon) |
| Population / digital twin | MJ-29–30 | PASS | LIVE rules / SIMULATED cohort |
| Honesty gate | MJ-33 | PASS | CONTRACT |

---

## 7. Doctor ↔ patient paired (P002)

| Handoff | gp01 | patient01 | Paired? |
| --- | --- | --- | --- |
| Session binding | Reviews P002 Patel | `boundPatientId=P002` | **Yes** |
| Consent | Admin / grant registry | Companion consent on P002 | **Yes** (Neon) |
| Ask Aksh | Chart-scoped | Self-only P002 | **Yes** |
| HITL → care plan visibility | Accept → Written to Record (staging) | Timeline / care plan on P002 | **Yes** |
| Check-in / appointments | Outcomes on chart | Check-in API + sim appts | **Yes** |

Verified locally: `demo-patient-binding.test.ts`, `ask-aksh-patient-chat.test.ts`, Master Journey identity step.

---

## 8. Vision alignment

| Source | Alignment |
| --- | --- |
| `VOLUME_I_PRODUCT_REQUIREMENTS.md` | Track A demo GO / Track B live-EMR NO-GO — **consistent** |
| `lib/product-journey.ts` | Diabetes-first · HITL · `liveEmis:false` — **consistent** |
| `AKSH-VISION-PAIRED-JOURNEY-20260813.md` | P0 handoffs closed — **confirmed by tests** |
| `E2E_MASTER_JOURNEY_20260813.md` | 35-step trace — **reproduced locally 2026-08-28** |

**Gap vs Volume I full spec:** Many chapters remain **[DRAFTED]** not **Accepted**; PRISM/ATLAS Phase 2 explicitly `live:false`. Heart module is stub-only. Region adapters beyond sim EHR are not wired.

---

## 9. Blockers

| Sev | Item | Impact |
| --- | --- | --- |
| **P1** | Resend domain not verified (`onboarding@resend.dev`) | Password reset / verification email fails for non-owner inboxes |
| **P2** | Neo4j Aura paused/unreachable in production | Graph features fall back to mock; was LIVE at go-live |
| **P2** | CI not re-run since 2026-08-13 | No automated regression signal on 15-day window (local pass today) |
| **P2** | No live EMIS / SystmOne / EPS write-back | Cannot claim real record integration |
| **P2** | VOICE mic / live ASR | Simulated path only |
| — | Clinical validation / MHRA / CQC | **Not claimed** — correct honesty posture |

**No P0** identity, safety, or fake-live-EMR claim issues found.

---

## 10. What genuinely works end-to-end today

1. **Simulated diabetes clinic loop** — Master Journey 35/35 under one correlationId (P002 Patel).
2. **Production Postgres** — auth, patient-state facts, consent grants, review queue, learning events.
3. **8 role dashboards** on akshhealth.com with RBAC and public-demo allowlist for GP/ICS/Hospital.
4. **Paired gp01 + patient01** on shared P002 chart, Ask Aksh, consent, HITL staging.
5. **HITL Accept/Edit/Reject** → Written to Record counter (staging, not live EMR).
6. **Organisation enquiry** intake via `/get-started`.
7. **Honesty bar** — `liveEmis:false` visible; no autonomous-care or clinical-validation claims.

---

## 11. What is simulated but complete

- Lab results pipeline (delay → complete → fact ingest)
- Pharmacy routing to GP
- Nurse / coordinator follow-up tasks
- Referral draft staging
- VOICE capture → SYNTHESIS draft (`liveMic:false`)
- CGM safety alerts
- Appointment no-show tasks
- EHR adapter (`simulated_ehr_v1`)
- Population cohort analytics (n=100 synthetic)

---

## 12. What breaks or is missing

| Item | Status |
| --- | --- |
| Live EMIS / EPS / NHS lab feeds | **NOT IMPLEMENTED** |
| Live microphone / ASR | **NOT IMPLEMENTED** |
| Transactional email to arbitrary users | **PARTIAL** (Resend sandbox) |
| Neo4j graph in production | **DOWN** (mock fallback) |
| Real practice invite connector | **NOT IMPLEMENTED** (demo email map) |
| Phase 2 PRISM/ATLAS | **NOT BUILT** |
| Heart disease module | **STUB ONLY** |
| Clinical evidence / regulatory sign-off | **NOT CLAIMED** |

---

## 13. Top 5 blockers to *true* end-to-end (live clinical)

1. **Live EMR write-back** — `liveEmis:false`; staging only.
2. **Live lab / pharmacy / EPS integrations** — Master actors are simulated.
3. **Live voice / scribe ASR** — VOICE→SYNTHESIS is simulated.
4. **Verified transactional email domain** — blocks real external onboarding flows.
5. **Clinical validation & safety sign-off** — Volume I chapters not Accepted; evidence UNVALIDATED.

---

## 14. Audit commands (reproducible)

```bash
cd packages/platform-uk
npm run typecheck
npm run test:workflow
npx tsx --env-file=.env.local tests/e2e-platform-master.test.ts
npx tsx tests/e2e-platform-stakeholder-clinic.test.ts
npx tsx tests/demo-patient-binding.test.ts
npx tsx tests/ask-aksh-patient-chat.test.ts
SMOKE_BASE_URL=https://akshhealth.com npm run smoke:public
SMOKE_BASE_URL=https://akshhealth.com npm run smoke:all
curl -sS https://akshhealth.com/api/health | jq .
gh run list --workflow="E2E Tests" --limit 3
```

---

## 15. Related documents

- `docs/e2e/AKSH-GO-LIVE-PRODUCTION-READY-20260813.md`
- `docs/e2e/AKSH-VISION-PAIRED-JOURNEY-20260813.md`
- `docs/reports/E2E_MASTER_JOURNEY_20260813.md`
- `docs/volume-i/VOLUME_I_PRODUCT_REQUIREMENTS.md`
