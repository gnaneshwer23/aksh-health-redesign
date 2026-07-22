# N1 Audit — External partner outreach (execution readiness)

**Date:** 2026-07-22  
**Branch:** `main`  
**Scope:** Make IM1 / EMIS Partner outreach **execution-ready** in-repo. Does **not** send email and does **not** enable live EMIS write-back.

## Status

| Gate | Result |
|---|---|
| **N1 in-repo readiness** | **READY_TO_SEND** |
| **N1 external send (IM1 and/or Partner email)** | **NOT SENT** — user/partner must send from their mail client |
| **`liveEmis`** | **`false`** (unchanged; do not flip) |

**Do not treat this audit as SENT.** No Message-ID, ticket ref, or Partner panel evidence of outbound mail was confirmed in this session.

## Exit criteria (from [`NEXT_BUILD_STEPS.md`](./NEXT_BUILD_STEPS.md) N1)

| Criterion | Result | Notes |
|---|---|---|
| IM1 (and/or Partner) email **sent** with reply or ticket ref | ☐ Open | Pack is paste-ready; send is user action |
| Gate tracker notes updated | ☐ Open | After send → PartnerReadinessPanel |
| Honesty flags still false | **PASS** | `liveEmis: false` · no certified claim |
| Fail if UI/API set `certified:true` / `liveEmis:true` because email sent | **N/A / guarded** | Not flipped; do not flip on send alone |

## In-repo artefacts

| Artefact | Role |
|---|---|
| [`P7_PARTNER_OUTREACH_PACK.md`](./P7_PARTNER_OUTREACH_PACK.md) §B | Paste-ready IM1 email + **N1 send checklist** |
| Pack §C | Short EMIS / Optum Partner Programme note (parallel track) |
| Pack §D | Internal CSO / IG kickoff note |
| Admin `PartnerReadinessPanel` | Record thread refs after send (`external_ref_noted` ≠ signed) |

## Paste-ready IM1 send (user mail client)

| Field | Value |
|---|---|
| **To** | `im1.team@nhs.net` |
| **Subject** | `Feasibility enquiry — Aksh Health clinical decision-support write-back (EMIS Partner API vs IM1 Transaction API)` |
| **Body** | Copy from [`P7_PARTNER_OUTREACH_PACK.md`](./P7_PARTNER_OUTREACH_PACK.md) §B (Dear IM1 Team … Kind regards + placeholders). Optional: append **Use-case appendix** in the same message. |

### What the user must do

1. Open organisational mail client; set **To** / **Subject** as above.
2. Paste body from pack §B; fill `[Organisation]`, `[Your name]`, `[Role]`, `[Email]`, `[Phone]`.
3. Run before-send checks (placeholders filled; org mailbox; no live/certified claims).
4. **Send** the email (agent does not send).
5. Record Sent date + Message-ID / ticket ref in **PartnerReadinessPanel**.
6. Optionally progress Partner Programme (§C) and CSO/IG kickoff (§D) in parallel.
7. When a reply or ticket ref exists, update this audit to **SENT** and check N1 “outreach sent” in [`NEXT_BUILD_STEPS.md`](./NEXT_BUILD_STEPS.md).

## Before-send checklist (3)

1. All `[…]` placeholders replaced with real org/contact details.  
2. Sent from an organisational mailbox; CC IG/CSO if they own the thread.  
3. No claim of live EMIS, certification, or MHRA/DCB approval — staging / `liveEmis: false` only.

## Honesty

| Flag / rule | Expected | Result |
|---|---|---|
| `liveEmis` | `false` | **PASS** — not flipped |
| Marketing “live EMIS / certified” | Forbidden | **PASS** |
| Eng flip because “email ready/sent” | Forbidden | **PASS** — N7 still blocked |

## Go / no-go

| Recommendation | Rationale |
|---|---|
| **GO — user sends IM1 email now** | Pack + checklist ready |
| **NO-GO — mark N1 exit complete** | Send + ticket/reply evidence still outstanding |
| **NO-GO — `liveEmis` flip** | Unchanged; requires N6–N7 signed path |

## Next

**N2** — Staging secrets: real Medplum Client Secret (staging OAuth) + optional local Deepgram; still `liveEmis: false`. See [`NEXT_BUILD_STEPS.md`](./NEXT_BUILD_STEPS.md) §N2.
