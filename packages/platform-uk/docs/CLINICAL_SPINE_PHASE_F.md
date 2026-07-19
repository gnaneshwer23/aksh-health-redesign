# Clinical spine — Phase F

**Status:** Shipped in-repo (partner / regulatory **readiness**)  
**Honesty:** `liveEmis: false` · `autoRetrain: false` · `physiologicalTwin: false` · `ehrWrite: false` · signed DPIA/CSO/DCB0129/MHRA **not inventable in code**

## Goal

Maximum **in-repo** partner readiness that unblocks EMIS/SystmOne, DPIA, CSO Gate 2, G-ML, and modality credential work — without inventing live EMR, signed approvals, or certifications.

## Checklist (in-repo)

- [x] Partner readiness pack consolidating EMIS/SystmOne, DPIA, CSO Gate 2, G-ML-1…3, modality credentials, regulatory path
- [x] Admin UI status: unsigned / pending / blocked / needs_partner / needs_cso (honest)
- [x] EMIS path: staging → sim write-back; explicit **NOT LIVE EMIS** banners; liveEmis flip checklist
- [x] DPIA / CSO / gate artefact tracker as **pending human artefacts** (`certified:false`, never unlocks `liveEmis`)
- [x] Evidence pack export index for partner review (`GET /api/clinical-spine/evidence-pack-export`)
- [x] System spine Phase F section + `PartnerReadinessPanel` on admin Precision Health
- [x] Tests: `tests/clinical-spine-phase-f.test.ts` in `npm run test:clinical-proof`
- [x] Docs: this file + roadmap update

## Checklist (external — partner / org actions)

- [ ] EMIS / SystmOne Partner API credentials + FHIR write scope
- [ ] Signed DPIA + DPA covering EMR write-back (and first live modality)
- [ ] Named CSO assigned; Gate 2 + hazard residual risk signed
- [ ] Signed write-back **go / no-go** (only then can engineering consider flipping `liveEmis`)
- [ ] Partner UAT of HITL → staging → Partner path + rollback procedure
- [ ] First modality vendor credentials + modality DPIA (Fitbit/etc. — never invent streams)
- [ ] DTAC / DCB0129 / MHRA route selected and funded (templates exist; approvals are external)
- [ ] Production G-ML-2 / G-ML-3 named signers (UI rehearsal ≠ production CSO)

## APIs

| Endpoint | Role |
|----------|------|
| `GET /api/clinical-spine/partner-readiness` | Consolidated Phase F pack + honesty flags |
| `GET/POST /api/clinical-spine/partner-gates` | Pending human gate artefacts (reject `certified:true`) |
| `GET /api/clinical-spine/evidence-pack-export` | Partner-facing evidence / safety case link index |
| Existing `GET /api/integrations/emis-partner-checklist` | EMIS checklist + flip requirements |
| Existing `GET/POST /api/integrations/emis-staging` | Staging queue — **no EMIS network call** |
| Existing `POST /api/integrations/ehr-writeback-sim` | Sim write-back only |

## Path shape

```text
HITL Accept
  → emis-staging (internal queue, liveEmis:false)
    → ehr-writeback-sim (approval token / sim only)
      → [EXTERNAL] Partner credentials + DPIA + CSO go/no-go
        → only then: consider liveEmis (not auto-flipped by this pack)
```

## Honesty invariants

| Flag | Value | Notes |
|------|-------|-------|
| `liveEmis` | `false` | Hard until real partner path; `canFlipLiveEmisInCode()` always `false` |
| `autoRetrain` | `false` | Phase E governed eval unchanged |
| `physiologicalTwin` | `false` | Unchanged |
| `hitlRequired` | `true` | Unchanged |
| Gate `certified` | always `false` | `external_ref_noted` ≠ signed approval |
| `unlocksLiveEmis` | always `false` | Gate tracker never enables write-back |

## How to verify

```bash
cd packages/platform-uk
npx tsx tests/clinical-spine-phase-f.test.ts
npm run test:clinical-proof
```

Manual UI:

1. Admin → Precision Health → **Partner / regulatory readiness** panel — tracks show unsigned/pending/needs_partner; NOT LIVE banner visible.
2. Note a pending DPIA artefact (`pending_review` / `external_ref_noted`) — confirm `certified:false` · `liveEmis:false`.
3. Try POSTing `certified: true` to partner-gates — rejected.
4. Download evidence pack index — links only, no invented signatures.
5. System spine → Phase F section shows track statuses + liveEmis:false.
6. EMIS staging GET/POST responses include not-live banner.

## Integration phases A–F (product spine)

| Phase | In-repo | Outstanding |
|-------|---------|-------------|
| A–E | Clinical spine product path (ingest → intelligence → stakeholders → outcomes/learning) | — |
| **F** | Partner readiness pack, gate tracker, evidence export, EMIS not-live path | Partner credentials, signed DPIA/CSO/go-no-go, live write-back, regulatory submissions |

**Summary:** Integration phases **A–F are complete for the product spine in-repo**. Phase F **partner actions remain outstanding** before any live EMIS / signed regulatory claim.
