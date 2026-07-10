# Aksh Health Shared UK/India Foundation

Publishable package **`@akshhealth/foundation`** — shared clinical workflow types, validation helpers, and synthetic fixtures for UK and India platforms.

## Install (local monorepo)

```bash
npm install
npm run verify
```

India app consumes via `"@akshhealth/foundation": "file:../akshhealth-shared-uk-india-foundation"`.

## Exports

- `types` — `ReviewCase`, FHIR draft shapes, safety/validation types
- `workflow` — intake generation, safety flags, evidence, human gates
- `mock-data` — synthetic `reviewCases` from `data/review-cases.synthetic-reference.json`

## What Is Shared

- Clinical review workflow primitives: intake, structured draft, safety flags, validation, reviewer decisions, frozen artifacts.
- Evidence and governance logic: FHIR-shaped export, validation protocol, transition checklists, dossier readiness, remediation tracking.
- Operating loops: feedback capture, linked feedback, meeting outcomes, remediation actions, owner handoffs, churn/risk scoring.
- Synthetic validation pattern: reusable seeded-case style and workflow regression tests.

## What Must Stay Country-Specific

- UK/EU regulatory language, NHS/ICS workflow assumptions, DCB0129 framing, and UK pilot packaging.
- India compliance language, ABDM alignment, DPDPA handling, multilingual assumptions, and provider/payer workflow details.
- Live integration assumptions, EHR adapters, terminology systems, and local clinical governance owners.

## Folder Map

- `lib/`: copied reference domain logic from the UK/EU platform.
- `data/`: synthetic review-case reference dataset.
- `tests/`: workflow regression reference tests.
- `docs/`: copied architecture, MVP, and pilot-package references.

## Use For India Later

Start from this folder when creating the India platform, then fork country-specific modules for:

- data-collection profile labels,
- validation stream naming,
- regulatory/gov evidence labels,
- integration adapters,
- pilot package language,
- clinical scenario library.

