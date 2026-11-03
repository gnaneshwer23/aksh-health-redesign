/**
 * Marketing homepage honesty — Milestone A–E surfaces without overclaims.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = join(__dirname, "..");
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

test("homepage keeps production workflows and validation honesty", () => {
  const page = read("app/page.tsx");
  assert.match(page, /LandingHowItWorks/);
  assert.match(page, /LandingReviewAndStrategy/);
  assert.match(page, /LandingTrustLimits/);
  assert.match(page, /in validation on synthetic patients/i);
  assert.match(page, /PRISM and ATLAS remain scaffolds/);
  assert.match(page, /not autonomous prescribing or clinical certification/i);
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
});

test("ProductSurface covers review, strategy, handoff, ops with synthetic captions", () => {
  const surface = read("components/site/canvas/ProductSurface.tsx");
  assert.match(surface, /export type ProductSurfaceId/);
  for (const id of ["review", "strategy", "handoff", "ops"] as const) {
    assert.match(surface, new RegExp(`case "${id}"`));
  }
  assert.match(surface, /Synthetic data/);
  assert.match(surface, /not a prescription/i);
  assert.match(surface, /no autonomous Rx/i);
  assert.match(surface, /not clinical certification/i);
  assert.match(surface, /_exhaustive: never/);
});
