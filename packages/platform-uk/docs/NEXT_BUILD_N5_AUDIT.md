# N5 Audit — Partner sandbox wire (feature-flagged; `liveEmis:false`)

**Date:** 2026-07-23  
**Branch:** `main`  
**Scope:** Env-gated EMIS Partner **sandbox** client + honesty UI; still **no** production live write-back. Partner credentials not yet issued → **PASS (scaffold)**.

## Status

| Gate | Result |
|---|---|
| **N5 overall** | **PASS (scaffold)** |
| **Sandbox flag path** | **PASS** — `ENABLE_EMIS_PARTNER_SANDBOX` (default off = sim) |
| **Creds absent honesty** | **PASS** — flag on without `EMIS_PARTNER_*` → `needs_partner` / blocked |
| **`liveEmis`** | **`false`** hard · `canFlipLiveEmisInCode() === false` |
| **Certified unlock** | **PASS** — partner-gates + sandbox POST reject live/certified flips |
| **Clinical-proof** | **PASS** (includes `tests/emis-partner-sandbox.test.ts`) |

## Exit criteria (from [`NEXT_BUILD_STEPS.md`](./NEXT_BUILD_STEPS.md) N5)

| Criterion | Result | Notes |
|---|---|---|
| Sandbox smoke documented; flag off = sim; flag on = sandbox only | **PASS (scaffold)** | `npm run smoke:emis-partner` — local: flag off / no Partner env → `disabled_honest` |
| `canFlipLiveEmisInCode()` still false until N7 | **PASS** | Typed `(): false` unchanged |
| Fail if env presence flips `liveEmis` | **PASS** | Status always `liveEmis:false`; `canFlipLiveEmisFromEnv:false` |
| Fail if writes without HITL Accept | **PASS** | `attemptEmisPartnerSandboxWrite` → `missing_hitl_accept` |
| Fail if credentials in git | **PASS** | Names only in `.env.example` / docs |

## Audit gate N5

- [x] Partner sandbox smoke (flag on) · sim path (flag off) — **scaffold**: without Partner creds, flag-on path reports `needs_partner_honest`; flag off = sim
- [x] `honesty.liveEmis === false` · `canFlipLiveEmisInCode() === false`
- [x] Clinical-proof + partner honesty tests green

## What is wired

| Surface | Role |
|---|---|
| `lib/emis-partner-sandbox.ts` | Flag + env status, OAuth probe, Accept-gated write attempt (network FHIR deferred) |
| `GET/POST /api/integrations/emis-partner-sandbox` | Status / `?probe=auth` / reject `liveEmis:true` |
| `lib/emis-staging.ts` | Surfaces sandbox mode on staging status; honest queue statuses |
| Partner readiness pack + checklist | `sandbox` object · flip checklist includes sandbox flag |
| `PartnerReadinessPanel` · `SystemSpinePanel` | Sandbox vs live honesty (`mode` / `writePath` / `needs_partner`) |
| `npm run smoke:emis-partner` | Local env honesty smoke (no secrets printed) |

## Creds still needed from partner (N1 / Partner Programme)

Until Partner Programme issues sandbox credentials, set nothing secret in git. When issued, secure env only:

1. `ENABLE_EMIS_PARTNER_SANDBOX=true` (rehearsal only)
2. `EMIS_PARTNER_CLIENT_ID`
3. `EMIS_PARTNER_CLIENT_SECRET`
4. `EMIS_PARTNER_TOKEN_URL`
5. `EMIS_PARTNER_FHIR_BASE_URL`

Then re-run `npm run smoke:emis-partner` and optional `EMIS_PARTNER_SMOKE_PROBE=auth`. **Still does not unlock `liveEmis`.**

## Tests run (2026-07-23)

```text
npm run smoke:emis-partner
  → verdict disabled_honest · liveEmis=false

npx tsx tests/emis-partner-sandbox.test.ts
  → N5 Partner sandbox honesty checks passed

npm run test:clinical-proof
  → exit 0
```

## Next recommendation

- **N6** — Partner UAT + rollback drill once sandbox creds exist and clinical lead available.
- Do **not** start N7 / `liveEmis` flip without signed go/no-go.
- Continue N1 outreach if Partner Programme not yet progressing credentials.
