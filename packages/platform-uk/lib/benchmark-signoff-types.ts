export type BenchmarkSignoffDecision = "accepted_for_internal_evidence" | "accepted_with_follow_up" | "not_accepted";

export const defaultBenchmarkSignoffDraft = {
  reviewerName: "",
  decision: "accepted_with_follow_up" as BenchmarkSignoffDecision,
  followUpOwner: "",
  dueDate: "",
  notes: "",
  signedAt: null as string | null
};

export type BenchmarkSignoffDraft = typeof defaultBenchmarkSignoffDraft;

export type BenchmarkSignoffEntry = BenchmarkSignoffDraft & {
  id: string;
  userId: string;
  generatedAt: string;
  benchmarkedCases: number;
  passedCases: number;
  failedCases: number;
  openBenchmarkActions: number;
  resolvedBenchmarkActions: number;
};

export type BenchmarkSignoffState = {
  userId: string;
  draft: BenchmarkSignoffDraft;
  archive: BenchmarkSignoffEntry[];
};
