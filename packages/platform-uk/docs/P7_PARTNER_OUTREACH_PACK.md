# P7 — Partner outreach / paperwork pack

**Date:** 2026-07-21  
**Status:** In-repo **paperwork readiness** — **not** live EMR write-back  
**Invariant:** `liveEmis: false` · `autoRetrain: false` · `certified: false` · HITL mandatory · zero autonomous clinical EHR write  
**UI:** Admin → Precision Health → **Partner / regulatory readiness** (`PartnerReadinessPanel`)  
**APIs:** `GET /api/clinical-spine/partner-readiness` · `GET/POST /api/clinical-spine/partner-gates` · `GET /api/clinical-spine/evidence-pack-export` · `GET /api/integrations/emis-partner-checklist`

Companions: [`CLINICAL_SPINE_PHASE_F.md`](./CLINICAL_SPINE_PHASE_F.md) · [`PHASE2_PARTNER_CHECKLIST.md`](./PHASE2_PARTNER_CHECKLIST.md) · [`PHASED_BUILD_P7_AUDIT.md`](./PHASED_BUILD_P7_AUDIT.md)

---

## What P7 “pass” means here

| In-repo (this pack) | External (you / partner / CSO) |
|---|---|
| Checklist of actions + paste-ready outreach | Send emails, obtain credentials, sign DPIA/DPA |
| Phase F readiness APIs + Admin panel | Named CSO, Gate 2, go/no-go decision |
| Evidence-pack index links | Partner UAT against real staging endpoint |
| Honesty flags stay false | Eng `liveEmis` flip **only after** signed go/no-go |

**This document does not certify EMIS, SystmOne, IM1, CIS2, Mirth, DPIA, DCB0129, or MHRA.**

---

## A. External action checklist (owner = user / partner / IG / CSO)

Track pending refs in Admin **PartnerReadinessPanel** gate tracker (`external_ref_noted` ≠ signed).

| # | Action | Owner | Status | Where to record |
|---|---|---|---|---|
| P7-01 | Send **IM1 feasibility email** (§B below) to `im1.team@nhs.net` | Org lead | ☐ **READY_TO_SEND** (pack ready; not yet sent) | Gate note / email thread ref |
| P7-02 | Apply / progress **EMIS / Optum Partner Programme** (sandbox → Partner API) | Org + partner | ☐ | Credentials later → Vercel env (never commit) |
| P7-03 | Confirm **TPP SystmOne** path separately (developer account ≠ live write) | Org + TPP | ☐ | Scope doc + test base URL |
| P7-04 | Draft + **sign DPIA** covering EMR write-back (+ first modality if in scope) | IG / DPO | ☐ | Gate `DPIA_EMR` / `DPIA_MODALITY` |
| P7-05 | **DPA / processing agreements** (practice + processors) | Legal / IG | ☐ | Signed DPA ref |
| P7-06 | Assign **named CSO**; complete **Gate 2** + hazard residual risk | CSO + sponsor | ☐ | Gate `NAMED_CSO` / `CSO_GATE2` |
| P7-07 | Plan **CIS2 / NHS authentication** for clinical users (partner-blocked today) | Org + NHS identity | ☐ | Architecture note; no fake SSO |
| P7-08 | Plan **Mirth Connect** / HL7 v2 intake if required by partner topology | Org + eng | ☐ | GAP until on-prem exists |
| P7-09 | Agree FHIR / Partner **write scopes** (Accept-only resources) | Partner + CSO | ☐ | Scope doc |
| P7-10 | **Partner UAT**: HITL Accept → staging → Partner path + rollback drill | Eng + clinical lead | ☐ | UAT script + sign-off |
| P7-11 | Signed write-back **go / no-go** | CSO + release authority | ☐ | Gate `EMIS_GO_NOGO` |
| P7-12 | Fund **DTAC / DCB0129 / MHRA** route (templates only in-repo) | Sponsor + consultant | ☐ | Gate `DTAC` / `DCB0129` / `MHRA_ROUTE` |

**Only after P7-11 = GO:** eng may run a controlled `liveEmis` flip checklist. Until then `canFlipLiveEmisInCode()` remains `false`.

---

## B. Paste-ready — IM1 feasibility email (EMIS-first)

### N1 send checklist (before you hit Send)

| Field | Value |
|---|---|
| **To** | `im1.team@nhs.net` |
| **Subject** | `Feasibility enquiry — Aksh Health clinical decision-support write-back (EMIS Partner API vs IM1 Transaction API)` |
| **Body** | Copy from the template below (through Kind regards + signature placeholders). Optionally paste the **Use-case appendix** in the same email or as a short attachment. |

**Before-send checks**

1. Replace every placeholder: `[Organisation]`, `[Your name]`, `[Role]`, `[Email]`, `[Phone]`.
2. Send from an organisational mailbox (not a personal throwaway); CC your IG/CSO contact if they should see the thread.
3. Do **not** claim live EMIS, certification, or MHRA/DCB approval — the template already states staging/`liveEmis: false` only.

After send: record the Sent date + Message-ID / ticket ref in Admin → Precision Health → **PartnerReadinessPanel** (`external_ref_noted` ≠ signed). Keep `liveEmis: false`.

---

**To:** im1.team@nhs.net  
**Subject:** Feasibility enquiry — Aksh Health clinical decision-support write-back (EMIS Partner API vs IM1 Transaction API)

---

Dear IM1 Team,

I am writing on behalf of **[Organisation]** regarding **Aksh Health** (https://akshhealth.com), a UK clinical decision-support / precision-health assistive platform for GP and nursing teams. We are **not** seeking to replace the EPR; our aim is a governed assistive layer that can, in due course, file **clinician-approved** content into the **EMIS Web** GP record.

### Current product posture (safety-first)

- AI agents may **draft** clinical content (e.g. notes, structured summaries).
- A **mandatory human-in-the-loop (HITL)** step requires a clinician to **Accept / Edit / Reject** before any write path is considered.
- Today we operate **staging / simulation write-back only**. There is **zero autonomous clinical EHR write**. Live EMIS write-back remains disabled (`liveEmis: false`) until partner assurance, information governance, and a signed clinical safety go/no-go are in place.
- We are aware of **DCB0129** obligations and are planning **CSO / DPIA** work. We do **not** claim existing MHRA or DCB certification.
- This enquiry is **EMIS-first**; we are exploring TPP SystmOne separately and do not need SystmOne advice in this thread.

### What we want to achieve

File **only clinician-accepted** content into EMIS Web — typically documents and/or structured entries as the chosen API permits — always after Accept (never on draft or Reject).

### Explicit ask

We would be grateful for guidance on:

1. **Which path is appropriate** for our Accept-only write-back model: **EMIS Partner API** vs **IM1 Transaction API** (or a staged combination)?
2. **How we should start** the formal process — pairing, SCAL, and any prerequisite forms or assurance packs you require from a supplier at our stage.
3. **Sandbox / test access** — indicative timeline, eligibility, and what artefacts (use case, DPIA outline, clinical safety approach) you need before credentials can be issued.

I have included a short use-case summary below for convenience. I am happy to join a call or provide a one-pager for the supplier assurance track.

Thank you for your time and advice.

Kind regards,  
**[Your name]**  
**[Role]**, **[Organisation]**  
**[Email]** | **[Phone]**  
https://akshhealth.com

---

### Use-case appendix (½ page — paste below or attach)

**Product:** Aksh Health is an assistive clinical decision-support layer for UK primary care. It helps GPs and nurses review AI-drafted clinical content; it is **not** a replacement EPR.

**Intended users:** Registered clinicians in EMIS Web GP practices (GPs, nurses, and other authorised clinical roles under practice policy).

**Clinical workflow:**
1. System produces **draft** clinical content (notes / structured summaries).
2. Clinician performs **mandatory HITL**: Accept, Edit, or Reject.
3. **Only Accepted** (or Accept-after-Edit) content is eligible for EMR write-back.
4. Rejected or unreviewed drafts are **never** written to the GP record.

**Target write-back (EMIS Web):** Clinician-approved documents and/or structured record entries, scoped to what Partner / IM1 APIs allow. Prefer minimal, auditable payloads with clear provenance (author, timestamp, acceptance event).

**Safety & governance posture:**
- No autonomous clinical write; live write disabled until assurance and signed go/no-go.
- Planned DPIA and Clinical Safety Officer oversight; DCB0129 awareness.
- Full audit of draft → HITL decision → staging → (future) partner write.
- Rollback / disable path required before any live enablement.

**Current technical state:** Internal staging queue and simulation write-back only; no live EMIS network write. Seeking NHSE/IM1 guidance on the correct API route and onboarding path for sandbox then controlled live use.

**Out of scope for this enquiry:** Prescribing, e-Referral autonomous submission, bulk population write, or any write without clinician Accept.

---

### Optional clarifying questions (for their reply)

1. For **Accept-only** filing of clinician-approved documents / structured entries into EMIS Web, do you recommend **Partner API**, **IM1 Transaction**, or Partner first with Transaction only if a specific transaction type is required?
2. What is the **minimum onboarding package** (SCAL, DPIA outline, clinical safety case / DCB0129 approach, practice sponsor) before **sandbox credentials** can be issued, and what is a realistic lead time?
3. Are there **hard constraints** we should design to now (allowed resource/transaction types, CIS2 / authentication model, practice-level pairing, rate limits, or prohibition on certain content classes) so our HITL Accept path maps cleanly to the approved API surface?

---

## C. Paste-ready — EMIS / Optum Partner Programme note (short)

Use when contacting EMIS / Optum partner onboarding (adjust channel per their current partner portal).

**Subject:** Supplier enquiry — Aksh Health Accept-only clinical write-back (sandbox first)

We are **[Organisation]**, building **Aksh Health** (https://akshhealth.com): an assistive clinical decision-support layer for UK GP/nursing teams. We request guidance on joining the **EMIS Partner** track for **sandbox** access first.

**Safety model:** AI drafts → mandatory clinician Accept/Edit/Reject → only then eligible for write-back. **Zero autonomous clinical EHR write.** Live write remains off until DPIA, CSO go/no-go, and partner UAT.

**Ask:** (1) correct Partner Programme application path, (2) sandbox credential prerequisites, (3) FHIR/Partner write scopes available for Accept-only document / structured entry filing, (4) technical contact for pairing.

We are **not** claiming live integration or certification today.

---

## D. Paste-ready — internal CSO / IG kickoff note

**Subject:** Need named CSO + DPIA for Aksh EMR write-back track (staging only today)

Aksh Health’s product spine (Capture → draft agents → HITL → SHIELD audit → EMIS **staging/sim**) is in place with `liveEmis: false`. Before any partner live write-back we need:

1. Named **Clinical Safety Officer** and Gate 2 / residual-risk sign-off path  
2. **DPIA** covering EMR write-back (and first modality if planned)  
3. **DPA** status with processors / pilot practice  
4. Written **go / no-go** before engineering enables Partner credentials in production  

In-repo trackers: Admin → Precision Health → Partner readiness panel; docs in `docs/P7_PARTNER_OUTREACH_PACK.md` and `docs/PHASE2_PARTNER_CHECKLIST.md`.

---

## E. In-repo surfaces (already shipped)

| Surface | Role |
|---|---|
| `PartnerReadinessPanel` | Track statuses, flip checklist, pending gate artefacts, evidence export |
| `SystemSpinePanel` Phase F | Ops view of partner honesty flags |
| Phase F APIs | Consolidated pack; reject `certified:true` |
| `emis-staging` / `ehr-writeback-sim` | Internal queue + sim only — **no EMIS network call** |
| Evidence pack templates | Unsigned Gate 1–3 / residual risk — partner review ready |

---

## F. Env var **names** (never commit secrets)

When partners issue sandbox credentials, set in Vercel / secure env only:

- `EMIS_PARTNER_CLIENT_ID`
- `EMIS_PARTNER_CLIENT_SECRET`
- `EMIS_PARTNER_TOKEN_URL`
- `EMIS_PARTNER_FHIR_BASE_URL`

Presence of env ≠ permission to flip `liveEmis`. CSO go/no-go still required.

---

## G. Honesty reminders

- Do **not** market “live EMIS / SystmOne ready / certified” until signed artefacts + live connection exist.  
- `external_ref_noted` in the gate tracker is **not** a signature.  
- Mirth mock / marketing status ≠ live HL7 intake.  
- NextAuth credentials ≠ CIS2.
