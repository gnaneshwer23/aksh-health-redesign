import type { FeedbackEntry } from "./feedback-types";

export function collectTopFeedbackPhrases(
  entries: FeedbackEntry[],
  selector: (entry: FeedbackEntry) => string,
  limit = 3
) {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    const value = selector(entry).trim();
    if (!value) continue;

    const normalized = value
      .replace(/\s+/g, " ")
      .split(/[.!?;\n]/)
      .map((part) => part.trim())
      .filter((part) => part.length >= 12);

    for (const phrase of normalized) {
      counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, limit);
}
