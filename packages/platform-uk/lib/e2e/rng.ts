/**
 * Deterministic seeded PRNG for reproducible E2E synthetic data.
 * Same seed → same dataset (brief §61).
 */

export type SeededRng = {
  next: () => number;
  int: (min: number, max: number) => number;
  float: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
  shuffle: <T>(items: readonly T[]) => T[];
  bool: (probability?: number) => boolean;
};

/** Mulberry32 — fast, deterministic 32-bit PRNG. */
export function createSeededRng(seed: number): SeededRng {
  let state = seed >>> 0;

  const next = () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int(min, max) {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    float(min, max) {
      return min + next() * (max - min);
    },
    pick(items) {
      if (items.length === 0) throw new Error("pick() called with empty array");
      return items[Math.floor(next() * items.length)]!;
    },
    shuffle(items) {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j]!, copy[i]!];
      }
      return copy;
    },
    bool(probability = 0.5) {
      return next() < probability;
    },
  };
}
