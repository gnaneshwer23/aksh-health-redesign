export const defaultFeedbackDraft = {
  audience: "Product",
  sessionType: "Rehearsal",
  relatedCaseId: "",
  followUpOwner: "",
  dueDate: "",
  nextCheckpoint: "",
  overdueNote: "",
  readinessScore: "3",
  strongestMoment: "",
  confusionPoint: "",
  objections: "",
  nextActions: "",
  savedAt: null
} as const;

export type FeedbackAudience = "Product" | "Clinical" | "Regulatory";

export type FeedbackDraft = {
  audience: FeedbackAudience;
  sessionType: string;
  relatedCaseId: string;
  followUpOwner: string;
  dueDate: string;
  nextCheckpoint: string;
  overdueNote: string;
  readinessScore: string;
  strongestMoment: string;
  confusionPoint: string;
  objections: string;
  nextActions: string;
  savedAt: string | null;
};

export type FeedbackEntry = FeedbackDraft & {
  id: string;
  userId: string; // Owner of this feedback entry (from authenticated session)
  resolutionStatus: "open" | "resolved";
  resolvedAt?: string | null;
  resolutionNote?: string;
};

export type FeedbackState = {
  userId: string; // Owner of this feedback state (from authenticated session)
  draft: FeedbackDraft;
  archive: FeedbackEntry[];
};
