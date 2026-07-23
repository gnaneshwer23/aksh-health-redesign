/**
 * Shared class-name tokens for the marketing site design system.
 * Pairs with the `.btn-marketing-*` / `.marketing-*` utilities defined in app/globals.css.
 * Keeping these as named exports (rather than re-typing class strings) means every page
 * gets the same corner radius, shadow, spacing, and focus-ring behaviour for free.
 */
import { cn } from "@/lib/utils";

/** Pill CTA — emerald fill. Default action on light backgrounds. */
export const btnPrimary = "btn-marketing-primary";
/** Pill CTA — ink/navy fill (Owkin-style solid pill on paper fields). */
export const btnInk = "btn-marketing-ink";
/** Pill CTA — white fill, navy outline. Secondary action on light backgrounds. */
export const btnSecondary = "btn-marketing-secondary";
/** Pill CTA — white fill, emerald text. Primary action on emerald/dark bands. */
export const btnInverse = "btn-marketing-inverse";
/** Pill CTA — transparent, white outline. Secondary action on emerald/dark bands. */
export const btnGhost = "btn-marketing-ghost";
/** Size modifier for hero and CTA-band prominence (px-8 py-3.5 text-base). */
export const btnLg = "btn-marketing-lg";
/** Quiet underlined text CTA (Owkin secondary pattern). */
export const linkUnderline = "marketing-link-underline";

/** Outer max-width + responsive gutters used by every marketing section. */
export const container = "marketing-container";
/** Standard vertical rhythm for full sections: 48px mobile / 64px desktop. */
export const section = "marketing-section";
/** Tighter rhythm for bands that don't need the full section height (e.g. CTA strips). */
export const sectionTight = "marketing-section-tight";

/** Raised clinical frame shared by diagrams, forms, pricing, and information panels. */
export const frame = "marketing-frame";

/** Hero primary CTA: emerald pill, large size. */
export const heroPrimaryCta = cn(btnPrimary, btnLg);
/** Hero secondary CTA: outline pill, large size. */
export const heroSecondaryCta = cn(btnSecondary, btnLg);
/** CTA-band primary action on an emerald background. */
export const bandPrimaryCta = cn(btnInverse, btnLg);
/** CTA-band secondary action on an emerald background. */
export const bandSecondaryCta = cn(btnGhost, btnLg);

/** Card corner + icon-square hierarchy, kept here so it's referenced once. */
export const cardRadius = "rounded-2xl";
export const iconSquareRadius = "rounded-xl";
