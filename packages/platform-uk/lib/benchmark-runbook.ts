export const benchmarkRunbookSteps = [
  "Start from the benchmark drilldown and confirm the dataset is synthetic-only before reviewing results.",
  "Review the pass/fail summary, then inspect failed checks before opening individual cases.",
  "For each failed check, compare expected versus actual output and decide whether the issue is rule logic, scenario data, or expected-outcome wording.",
  "Open the linked case evidence or dossier when a failure needs clinical context beyond the benchmark row.",
  "Resolve only actions that have a clear reviewer rationale; reopen any action where clinical uncertainty remains.",
  "Export the benchmark evidence JSON and printable report after the action queue has been triaged."
] as const;

export const benchmarkReadinessCriteria = [
  "All benchmarked cases have an explicit expected outcome.",
  "Every clinical rule coverage target is covered by at least one benchmarked case.",
  "No high-severity benchmark action remains open without an owner.",
  "The exported benchmark evidence includes pass/fail totals, coverage status, failed checks, and action status.",
  "The run remains synthetic-only unless integration rehearsal flags are explicitly enabled."
] as const;

export const benchmarkFailureTriage = [
  {
    label: "Rule logic issue",
    guidance: "Update deterministic safety, blocker, validation, or promotion logic when actual output is clinically wrong."
  },
  {
    label: "Scenario data issue",
    guidance: "Edit the synthetic case when source notes, observations, medication context, or trace evidence are too weak."
  },
  {
    label: "Expected-outcome issue",
    guidance: "Revise the benchmark contract when the current expected label is less clinically precise than the implementation."
  }
] as const;
