# Agent golden-case eval harness

Lightweight, HITL-safe scoring for **SYNTHESIS**, **GUARDIAN**, and **HORIZON** (legacy id **ORACLE**). Deterministic drafts may mention either product or legacy name; the scorer accepts `mustMentionAnyOf` alias groups (P1-EVAL-01).

- Never writes to EMIS / SystmOne / any EHR
- Runs agent code paths (LLM when configured, else deterministic fallback)
- Reports pass/fail checks against fixed synthetic fixtures

## Run (CLI)

From `packages/platform-uk`:

```bash
# All golden cases (uses AI Gateway when configured; else deterministic)
npm run eval:agents

# Force deterministic-only (recommended for CI / regression)
ENABLE_LLM_SYNTHESIS=false npm run eval:agents

# Filter
npm run eval:agents -- --agent=ORACLE
npm run eval:agents -- --case=synthesis-dvt-leg-swelling
```

Exit code `1` if any case fails.

## Run (API)

Authenticated:

```bash
# List fixtures
curl -sS https://akshhealth.com/api/eval/agents

# Score (requires session cookie or test auth headers)
curl -sS -X POST https://akshhealth.com/api/eval/agents \
  -H 'Content-Type: application/json' \
  -d '{"agent":"GUARDIAN"}'
```

Response includes `ehrWrite: false` and `hitlRequired: true`.

## Fixtures

Defined in `lib/eval/golden-cases.ts`. Scoring logic in `lib/eval/score-agents.ts`.

## Boundaries

- Output is a rehearsal scorecard, not a clinical validation certificate
- Passing local golden cases does **not** mean unsupervised clinical use is approved
- See `docs/SAFETY_CASE_REHEARSAL.md` for the wider safety posture
