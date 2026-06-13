// SPDX-License-Identifier: MIT

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import {
  auditTokenDocument,
  checkApcaColorPair,
  checkWcagColorPair,
  getContrastRatio,
  type TokenDocument,
  validateTokenContrast,
} from "./index.js";

test("WCAG contrast calculation handles black on white", () => {
  assert.equal(
    Math.round((getContrastRatio("#000000", "#ffffff") ?? 0) * 100) / 100,
    21,
  );
});

test("tokens.json semantic color pairs meet their required contrast ratios", async () => {
  const raw = await readFile(
    new URL("../tokens.json", import.meta.url),
    "utf-8",
  );
  const tokens = JSON.parse(raw) as TokenDocument;
  const failures = validateTokenContrast(tokens);

  assert.deepEqual(failures, []);
});

test("pair-level WCAG checks report pass and fail states", () => {
  assert.deepEqual(
    checkWcagColorPair({
      name: "readable",
      foreground: "#172033",
      background: "#ffffff",
    }),
    {
      name: "readable",
      foreground: "#172033",
      background: "#ffffff",
      ratio: 16.27,
      required: 4.5,
      passes: true,
    },
  );

  assert.deepEqual(
    checkWcagColorPair({
      name: "low",
      foreground: "#999999",
      background: "#ffffff",
    }),
    {
      name: "low",
      foreground: "#999999",
      background: "#ffffff",
      ratio: 2.85,
      required: 4.5,
      passes: false,
    },
  );
});

test("token audit includes APCA advisory and OKLCH repair placeholders", () => {
  const audit = auditTokenDocument({
    color: {
      foreground: { value: "#999999" },
      background: { value: "#ffffff" },
    },
    semanticPairs: [
      {
        name: "low",
        foreground: "color.foreground",
        background: "color.background",
      },
    ],
  });

  assert.equal(audit.wcagPairs.length, 1);
  assert.equal(audit.wcagPairs[0]?.passes, false);
  assert.equal(audit.apcaAdvisories[0]?.summary, "Large text");
  assert.equal(audit.repairSuggestions[0]?.status, "placeholder");
});

test("APCA checks return signed Lc scores", () => {
  assert.equal(
    checkApcaColorPair({
      name: "dark on light",
      foreground: "#888888",
      background: "#ffffff",
    }).lc,
    63.06,
  );

  assert.equal(
    checkApcaColorPair({
      name: "light on dark",
      foreground: "#ffffff",
      background: "#888888",
    }).lc,
    -68.54,
  );
});
