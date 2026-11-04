/**
 * Marketing homepage honesty — Milestone A–E surfaces without overclaims.
 * Public marketing must not advertise synthetic-patient / demo-cohort mechanics.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = join(__dirname, "..");
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

const BANNED_PUBLIC = [
  /synthetic patients?/i,
  /demo cohort/i,
  /@demo\.akshhealth\.com/i,
  /200 patients/i,
  /purgeable/i,
  /seeded data/i,
];

function assertNoBannedPublicCopy(label: string, src: string) {
  for (const re of BANNED_PUBLIC) {
    assert.doesNotMatch(src, re, `${label} must not match ${re}`);
  }
}

test("homepage keeps production workflows and validation honesty", () => {
  const page = read("app/page.tsx");
  assert.match(page, /LandingHowItWorks/);
  assert.match(page, /LandingReviewAndStrategy/);
  assert.match(page, /LandingTrustLimits/);
  assert.match(page, /clinical AI in validation/i);
  assert.match(page, /Prism and Trials remain scaffolds/);
  assert.match(page, /not autonomous prescribing or clinical certification/i);
  assertNoBannedPublicCopy("app/page.tsx", page);
});

test("landing sections state HITL / no live EHR / no autonomous Rx", () => {
  const sections = read("components/site/LandingMilestoneSections.tsx");
  assert.match(sections, /data-landing="how-it-works"/);
  assert.match(sections, /data-landing="review-line"/);
  assert.match(sections, /data-landing="trust"/);
  assert.match(sections, /NON_OBJECTIVES/);
  assert.match(sections, /do not claim clinical certification/i);
  assert.match(sections, /no autonomous prescribing/i);
  assert.match(sections, /no silent write/i);
  assert.match(sections, /ProductSurface id="review"/);
  assert.match(sections, /ProductSurface id="strategy"/);
  assert.match(sections, /ProductSurface id="handoff"/);
  assert.match(sections, /ProductSurface id="ops"/);
  assertNoBannedPublicCopy("LandingMilestoneSections", sections);
});

test("ProductSurface covers review, strategy, handoff, ops with illustrative captions", () => {
  const surface = read("components/site/canvas/ProductSurface.tsx");
  assert.match(surface, /export type ProductSurfaceId/);
  for (const id of ["review", "strategy", "handoff", "ops"] as const) {
    assert.match(surface, new RegExp(`case "${id}"`));
  }
  assert.match(surface, />Illustrative</);
  assert.match(surface, /not a prescription/i);
  assert.match(surface, /no autonomous Rx/i);
  assert.match(surface, /not clinical certification/i);
  assert.match(surface, /_exhaustive: never/);
  assertNoBannedPublicCopy("ProductSurface", surface);
});
