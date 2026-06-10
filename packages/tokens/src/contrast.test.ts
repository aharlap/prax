// SPDX-License-Identifier: MIT

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import {
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
