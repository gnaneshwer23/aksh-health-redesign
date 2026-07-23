# D1 Audit — Demo hardening (no IM1 / EMIS Partner / Medplum OAuth)

**Date:** 2026-07-23  
**Scope:** `packages/platform-uk` · Demo path from [`DEMO_LAUNCH_WITHOUT_IM1.md`](./DEMO_LAUNCH_WITHOUT_IM1.md)  
**Verdict:** **PASS** (eng demo launch hardening)

---

## What shipped

| ID | Task | Status | Notes |
|---|---|---|---|
| **D1-a** | FHIR-in-Neon (or durable file) BRIDGE staging | **PASS** | `aksh.fhir_staging_bundles` + file fallback; Accept → preliminary label; `liveEmis:false`; Medplum not required |
| **D1-b** | Accept → export FHIR Bundle (+ PDF summary) | **PASS** | `GET /api/review-cases/[id]/export/fhir`; evidence + report Download Bundle / Print PDF; handoff-only honesty |
| **D1-c** | Demo script polish | **PASS** | `/demo/script` Capture→Draft→Approve→SHIELD→sim→export; `/product/demo` wired; whole-loop cross-links |
| **Honesty / creds** | Marketing honesty + credentials docs | **PASS** | BRIDGE banners; [`DEMO_LAUNCH_CREDENTIALS.md`](./DEMO_LAUNCH_CREDENTIALS.md); no baked-in passwords |

**Hard invariants held:** `liveEmis:false` · HITL Accept mandatory · never `certified:true` · Partner N3/N6/N7 untouched.

---

## Surfaces

| Surface | Path |
|---|---|
| BRIDGE staging API | `GET/POST /api/integrations/bridge-staging` |
| FHIR Bundle handoff | `GET /api/review-cases/[id]/export/fhir` |
| Accept wire | `PUT /api/review-cases/[id]` → `stageAcceptedCaseToBridge` |
| Migration | `db/migrations/011_fhir_staging_bundles.sql` · `npm run db:migrate:d1` |
| Demo script | `/demo/script` |
| Credentials | `docs/DEMO_LAUNCH_CREDENTIALS.md` |

---

## Audit gate checklist

- [x] `GET /api/clinical-spine/partner-readiness` honesty → `liveEmis === false` (invariant; not flipped)
- [x] BRIDGE staging labelled preliminary/staging · Medplum not required
- [x] HITL Accept required before BRIDGE POST (`clinicianAccept:true`) and before case Accept path stages
- [x] FHIR/PDF exports labelled handoff-only · not live NHS write-back
- [x] Demo script honesty banners present
- [x] `npm run test:clinical-proof` includes `tests/demo-launch-d1.test.ts`
- [x] No marketing claim of live EMIS / IM1 / Medplum production FHIR

---

## How to demo (10–15 min)

1. Open **`/demo/script`** — read OK/Do-not claim.
2. **Capture:** `/demo/precision-health-loop` (optional whole-loop) or jump to pilot.
3. **Draft → Approve:** `/review/pilot?demo=1` → Accept one case.
4. **SHIELD:** `/dashboard/admin/audit` — Accept / BRIDGE event.
5. **Sim write-back:** Admin System Spine — BRIDGE + emis-staging · `liveEmis:false`.
6. **Export:** Evidence page → **Download FHIR Bundle** and/or **Print / Save PDF**.
7. Close on `/review/demo-readiness?demo=1`.

Account: create via `/signup` — see [`DEMO_LAUNCH_CREDENTIALS.md`](./DEMO_LAUNCH_CREDENTIALS.md).

---

## Remaining non-eng (optional)

| Item | Owner |
|---|---|
| Rehearse once on production URL (akshhealth.com) | user |
| Reset seeded demo dataset before live walkthrough | user |
| Capture feedback via `/review/feedback` | user |
| Partner outreach (IM1 / EMIS) if credentials appear | user/partner — **not** a demo gate |
| Apply `npm run db:migrate:d1` on Neon if not auto-created at runtime | eng/ops |

---

## Next (if any)

- **Demo launch ops:** production smoke + audience pick from PILOT_PACKAGE — eng done for D1.
- **Paused partner:** N3 Medplum rehearsal · N5 live sandbox · N6 UAT · N7 `liveEmis` flip — wait on secrets + signed go/no-go.
- **Optional eng later:** Deepgram live ASR; private PMS (Cliniko) story — not NHS GP substitute.

---

## Commands

```bash
cd packages/platform-uk
npm run db:migrate:d1          # optional if DATABASE_URL set
npm run test:clinical-proof
# Manual: open /demo/script after npm run dev
```
