import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = join(__dirname, "..");
const canvasSrc = readFileSync(join(root, "components/site/canvas/ProductCanvas.tsx"), "utf8");

test("ProductCanvas is a client component with an interactive rail", () => {
  assert.match(canvasSrc, /^"use client";/m);
  assert.match(canvasSrc, /aria-current=\{on \? "page" : undefined\}/);
  assert.match(canvasSrc, /aria-label="Workspace modules"/);
  assert.match(canvasSrc, /onClick=\{\(\) => onModule\(key\)\}/);
});

test("rail icons map to existing canvas modules", () => {
  const expected = [
    ["today", "Today"],
    ["slots", "Fill slots"],
    ["glucose", "Glucose"],
    ["record", "Patient record"],
    ["agents", "Review line"],
    ["audit", "Audit"],
  ] as const;
  for (const [key, label] of expected) {
    assert.match(canvasSrc, new RegExp(`key: "${key}", label: "${label}"`));
  }
  assert.match(canvasSrc, /module === "today"/);
  assert.match(canvasSrc, /module === "slots"/);
  assert.match(canvasSrc, /module === "glucose"/);
  assert.match(canvasSrc, /module === "record"/);
  assert.match(canvasSrc, /module === "audit"/);
  assert.match(canvasSrc, /AgentLineFigure/);
});

test("segmented control stays consistent with module groups", () => {
  assert.match(canvasSrc, /function segFor\(module: CanvasModule\)/);
  assert.match(canvasSrc, /module === "today" \|\| module === "slots"/);
  assert.match(canvasSrc, /module === "glucose" \|\| module === "record"/);
  assert.match(canvasSrc, /moduleForSeg\(key\)/);
  assert.match(canvasSrc, /Synthetic data/);
});
