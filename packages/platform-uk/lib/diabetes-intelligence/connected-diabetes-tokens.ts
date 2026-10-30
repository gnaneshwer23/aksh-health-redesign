/**
 * UX-04 — shared Connected Diabetes visual tokens (align with Patient 360 / journey).
 * Prefer CSS variables on `.connected-diabetes-surface` over ad-hoc inline hex.
 */

export const CONNECTED_DIABETES_TOKENS = {
  bg: "#f7fafc",
  ink: "#0f2744",
  muted: "#5b6b7c",
  line: "#d7e3ef",
  accent: "#0d9488",
  accentSoft: "#e6f7f5",
  warn: "#b45309",
  surface: "#ffffff",
} as const;

/** Inline style bag for legacy workspaces migrating off hard-coded hex. */
export const connectedDiabetesCssVars = {
  ["--cd-bg" as string]: CONNECTED_DIABETES_TOKENS.bg,
  ["--cd-ink" as string]: CONNECTED_DIABETES_TOKENS.ink,
  ["--cd-muted" as string]: CONNECTED_DIABETES_TOKENS.muted,
  ["--cd-line" as string]: CONNECTED_DIABETES_TOKENS.line,
  ["--cd-accent" as string]: CONNECTED_DIABETES_TOKENS.accent,
  ["--cd-accent-soft" as string]: CONNECTED_DIABETES_TOKENS.accentSoft,
  ["--cd-warn" as string]: CONNECTED_DIABETES_TOKENS.warn,
  ["--cd-surface" as string]: CONNECTED_DIABETES_TOKENS.surface,
  /** Alias journey `--dj-*` so existing journey markup can share the same surface. */
  ["--dj-bg" as string]: CONNECTED_DIABETES_TOKENS.bg,
  ["--dj-ink" as string]: CONNECTED_DIABETES_TOKENS.ink,
  ["--dj-muted" as string]: CONNECTED_DIABETES_TOKENS.muted,
  ["--dj-line" as string]: CONNECTED_DIABETES_TOKENS.line,
  ["--dj-accent" as string]: CONNECTED_DIABETES_TOKENS.accent,
  ["--dj-accent-soft" as string]: CONNECTED_DIABETES_TOKENS.accentSoft,
  ["--dj-warn" as string]: CONNECTED_DIABETES_TOKENS.warn,
} as const;

export const CONNECTED_DIABETES_PAGE_CLASS =
  "connected-diabetes-surface min-h-full space-y-6 overflow-y-auto bg-[var(--cd-bg,#f7fafc)] p-4 text-[var(--cd-ink,#0f2744)]";
