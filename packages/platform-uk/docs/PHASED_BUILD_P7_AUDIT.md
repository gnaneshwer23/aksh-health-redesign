# P7 Audit — Partner / EHR paperwork (Layer 15 outreach)

**Date:** 2026-07-21  
**Branch:** `main`  
**Scope:** In-repo **partner outreach / paperwork pack** only. Does **not** enable live EMIS/SystmOne write-back.

## Exit criteria — dual gate

| Gate | Result | Meaning |
|---|---|---|
| **P7 paperwork / outreach (in-repo)** | **PASS** | Consolidated checklist + paste-ready artefacts + audit; Phase F surfaces linked |
| **P7 live EHR / eng `liveEmis` flip** | **NO-GO** | No signed partner artefacts; `canFlipLiveEmisInCode():false`; staging/sim only |

**P7 exit (this audit):** **PASS for paperwork readiness** · **NO-GO for live flip**. Full Layer 15 live exit remains external until signed go/no-go + UAT.

## Pass/fail matrix (paperwork)

| Check | Pass bar | Result | Notes |
|---|---|---|---|
| Outreach pack consolidated | Checklist + IM1 email + partner/CSO drafts in docs | **PASS** | [`P7_PARTNER_OUTREACH_PACK.md`](./P7_PARTNER_OUTREACH_PACK.md) |
| Points at Admin UI | Plan/audit reference `PartnerReadinessPanel` | **PASS** | Admin → Precision Health |
| Phase F APIs honest | `liveEmis:false` · reject `certified:true` · no unlock | **PASS** | Unchanged Phase F invariants |
| Flip blocked in code | `canFlipLiveEmisInCode()===false` | **PASS** | Hard `false` return |
| No live claim in pack | No `liveEmis:true` / certified marketing | **PASS** | Explicit NO-GO language |
| Plan checkboxes honest | Paperwork ≠ live EHR | **PASS** | See plan P7 dual audit gate |
| Clinical-proof (if code touched) | Exit 0 | **PASS** | Phase F + honesty asserts still green |

## Original live-exit audit gate (still open — external)

| Item | Status |
|---|---|
| Partner checklist all human boxes **signed** (not just `external_ref_noted`) | ☐ Outstanding |
| `canFlipLiveEmisInCode()` / flip SOP only after go/no-go | ☐ Blocked — correctly stays `false` |
| Clinical-proof + partner UAT against **staging partner endpoint** | ☐ Outstanding (no partner endpoint) |
| Production claims match actual Partner connection state | ☐ N/A — still sim/staging |
| Residual risk + release/rollback docs updated with signed evidence | ☐ Outstanding |

## Outstanding external items (user must do)

1. **Send** IM1 feasibility email (`im1.team@nhs.net`) — paste from outreach pack §B.  
2. Progress **EMIS / Optum Partner Programme** (+ SystmOne/TPP track separately if needed).  
3. **DPIA + DPA** signed; record refs in PartnerReadinessPanel (still `certified:false`).  
4. Assign **named CSO**; Gate 2 + hazard residual risk signed.  
5. Plan **CIS2** and **Mirth** (organisational — not inventable in code).  
6. Agree write scopes; run **Partner UAT** + rollback drill.  
7. Signed **go / no-go** — only then eng flip checklist.  
8. Fund DTAC / DCB0129 / MHRA route (templates already in-repo).

Optional (not Layer 15): real Medplum Client Secret; local Deepgram.

## Honesty spot-check

| Flag / rule | Expected | Result |
|---|---|---|
| `liveEmis` | `false` | **PASS** |
| `autoRetrain` | `false` | **PASS** |
| Gate `certified` unlock | Rejected / always false | **PASS** |
| Marketing live EHR claims | Forbidden | **PASS** |

## Go / no-go

| Recommendation | Rationale |
|---|---|
| **GO — execute external outreach using this pack** | In-repo paperwork complete; product spine P0–P6 green |
| **NO-GO — eng `liveEmis` flip** | No signed artefacts; code hard-blocks flip |
| **NO-GO — “certified / live EMR” marketing** | Keep Designed-for / staging language |

## Commands (honesty / Phase F)

```text
npx tsx tests/clinical-spine-phase-f.test.ts
npm run test:clinical-proof
```

Confirm: `GET /api/clinical-spine/partner-readiness` → `honesty.liveEmis === false`.
