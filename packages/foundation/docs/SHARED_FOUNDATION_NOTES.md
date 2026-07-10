# Shared Foundation Notes

## Reusable Build Patterns

- `ReviewCase` as the central case object.
- FHIR-shaped draft bundle with `Encounter`, `Condition`, `MedicationRequest`, and `Observation`.
- Derived safety flags instead of static stored flags.
- Reviewer checklist with completion notes before acceptance.
- Frozen reviewed artifact after acceptance.
- Evidence payload and printable report from the same persisted case model.
- Validation readiness and transition checklist as explicit promotion gates.
- Meeting outcomes feeding back into queue, ops, and follow-through.
- Remediation action tracking with owner, handoff notes, history, churn, and risk triage.

## India Adaptation Notes

- Keep the review-first structure.
- Replace UK/EU roadmap labels with India-specific validation streams.
- Add ABDM-ready resource mapping and India-specific consent/data-governance language before pilot use.
- Build Indian clinical scenarios separately rather than reusing UK synthetic cases as-is.
- Treat multilingual input and local terminology as India-specific extensions, not shared defaults.

## Do Not Copy Blindly

- UK/EU page copy.
- NHS/ICS references.
- UK safety-case framing.
- UK pilot acceptance language.
- Any route or component that assumes UK-only evidence positioning.

