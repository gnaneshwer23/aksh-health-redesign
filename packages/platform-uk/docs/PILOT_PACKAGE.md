# Pilot Package

This package turns the current UK/EU proof into a cleaner pilot-facing artifact set.

## Fixed Demo Dataset
- `case-001`: high-risk respiratory medication review
- `case-002`: blocked hypertension follow-up
- `case-004`: override-path lipid review
- `case-005`: accepted frozen artifact

## Reviewer Runbook
1. Reset the seeded dataset before each live walkthrough.
2. Start from dashboard or session summary depending on the audience.
3. Show one blocked or high-risk case before showing any accepted artifact.
4. Use the evidence page to cover source trace, generation trace, reviewer attribution, validation, and export bundle.
5. End on the accepted frozen artifact to land the story on reviewed output and governance.

## Audience Sequence
- Product: blocked queue -> blocked case -> accepted artifact
- Clinical: high-risk cohort -> allergy/interaction case -> override-path case
- Regulatory: session summary -> accepted evidence artifact -> blocked evidence contrast

## Intended Use
- advisor walkthroughs
- pilot readiness conversations
- internal reviewer rehearsal
- repeatable demo sessions with a fixed scenario set

## Rehearsal Tooling
- in-app rehearsal page: `/review/rehearsal`
- use it to practice the Product, Clinical, and Regulatory walkthroughs against a target duration before a live session

## Feedback Capture
- in-app feedback page: `/review/feedback`
- use it after rehearsal or live sessions to capture strongest moment, confusion points, objections, and next actions
