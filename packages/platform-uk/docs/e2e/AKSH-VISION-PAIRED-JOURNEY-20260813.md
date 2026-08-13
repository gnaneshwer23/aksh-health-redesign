# Vision → paired diabetes journey — gaps closed (2026-08-13)

**Product vision sources used**
- `docs/volume-i/VOLUME_I_PRODUCT_REQUIREMENTS.md` (Ch. 1 vision, Ch. 11 Patient Intelligence, Ch. 15 journeys)
- `lib/product-journey.ts` (role dashboards / honesty copy)
- `docs/AKSH_PLATFORM_OVERVIEW_DEMO_IMPLEMENTATION_PLAN.md` (Patel golden journey)
- Prior e2e: `docs/e2e/AKSH-CLINICAL-ACTIVITY-END-TO-END-RESULTS.md`, `docs/e2e/AKSH-GO-LIVE-PRODUCTION-READY-20260813.md`

**Framing:** Diabetes-specific · region-adaptable later (not NHS-primary) · HITL preserved · `liveEmis:false` · simulated stakeholders OK if they function as a coherent clinic.

---

## P0 handoffs fixed this pass

| Bug | Fix |
| --- | --- |
| `boundPatientId` never set on JWT/session → patient Ask Aksh / check-in fail | `lib/auth/demo-patient-binding.ts` + `lib/auth.ts` JWT/session callbacks. Demo `patient01@demo.akshhealth.com` → **P002**. Preference override supported. Legacy JWTs re-resolve on refresh. |
| GP P002 vs companion P001 mismatch | `PatientCompanion` unified on `boundPatientId ?? P002` for care plan, consent, coaching, outcomes, timeline, appointments. |
| Consent grants EROFS on Vercel (file store) | `consent-grant-repository` is **Postgres-first** when `DATABASE_URL` is set; file store only for local / fallback. |

---

## Doctor ↔ patient paired demo (P002 Patel)

| Step | Doctor (gp01) | Patient (patient01) | Paired? |
| --- | --- | --- | --- |
| CONNECT / identity | Reviews **P002** Patel | Session `boundPatientId=P002` | **Yes** |
| Consent | Admin / patient grant registry | Companion consent panel on **P002** | **Yes** (durable Neon) |
| UNDERSTAND → REASON | Agents / Ask Aksh on Patel chart | Ask Aksh self-only on **P002** | **Yes** |
| HITL Accept | Review queue → Written to Record (staging) | Care plan / timeline visibility on **P002** | **Yes** (shared id) |
| Check-in / appointments | Sees outcomes / chart | Check-in API + simulated appt from P002 mock | **Yes** |
| LEARN | Learning events `autoRetrain:false` | Outcomes capture panel on P002 | **Yes** (Master) |

---

## Closed vs deferred

### Closed this pass
- Patient session binding for demo cohort (invite-by-practice simulation)
- Shared P002 chart across GP + patient companion surfaces
- Durable consent grants on Neon (production-safe)
- Honesty labels retained (`liveEmis:false`, synthetic / simulated)

### Still deferred (honest)
- **Live EMIS / SystmOne / EPS write-back** — not implemented; `liveEmis:false`
- **Live VOICE mic / ASR** — simulated path only
- **Live lab / pharmacy / CGM vendor feeds** — Master SIMULATED actors
- **Real practice invite connector** — demo email map + preferences until partner invite API exists
- Clinical validation / MHRA / CQC claims — not claimed

---

## Verification

```bash
npx tsx tests/demo-patient-binding.test.ts
npx tsx tests/precision-health-phase1.test.ts
npx tsx tests/next-ux-u8.test.ts
npx tsx tests/ask-aksh-patient-chat.test.ts
npx tsx --env-file=.env.local tests/e2e-platform-master.test.ts
npx tsx tests/e2e-platform-stakeholder-clinic.test.ts
```

Operator check on production after deploy:
1. Sign in `gp01@demo.akshhealth.com` → select **Mr James Patel (P002)** → Accept draft · confirm `liveEmis:false`
2. Sign in `patient01@demo.akshhealth.com` → My Health shows chart **P002** · Ask Aksh enabled · grant consent · see care plan / appointments
