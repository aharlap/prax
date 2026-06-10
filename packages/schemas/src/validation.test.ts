// SPDX-License-Identifier: MIT

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { compareV1Schema, parseCompareConfig } from "./validation.js";

const baseCompareConfig = {
  $schema: "https://praxity.io/schemas/compare/v1.json",
  block: "compare",
  v: 1,
  meta: {
    title: "Before and after",
    lang: "en",
  },
  content: {
    prompt: "Compare these images.",
    before: {
      kind: "url",
      href: "https://example.test/before.jpg",
      alt: "Before state",
    },
    after: {
      kind: "url",
      href: "https://example.test/after.jpg",
      alt: "After state",
    },
  },
};

test("parseCompareConfig accepts the current compare v1 shape", () => {
  assert.equal(parseCompareConfig(baseCompareConfig).block, "compare");
});

test("parseCompareConfig rejects asset media until resolver plumbing exists", () => {
  assert.throws(
    () =>
      parseCompareConfig({
        ...baseCompareConfig,
        content: {
          ...baseCompareConfig.content,
          before: {
            kind: "asset",
            assetId: "before-image",
            name: "before.jpg",
            mime: "image/jpeg",
            alt: "Before state",
          },
        },
      }),
    /Expected a Prax compare v1 config/,
  );
});

test("parseCompareConfig rejects base64 data URI media", () => {
  assert.throws(
    () =>
      parseCompareConfig({
        ...baseCompareConfig,
        content: {
          ...baseCompareConfig.content,
          before: {
            kind: "url",
            href: "data:image/png;base64,abc123",
            alt: "Base64 image",
          },
        },
      }),
    /Expected a Prax compare v1 config/,
  );
});

test("parseCompareConfig reports newer config versions clearly", () => {
  assert.throws(
    () =>
      parseCompareConfig({
        ...baseCompareConfig,
        v: 2,
      }),
    /requires a newer @praxity\/compare runtime/,
  );
});

test("compareV1Schema matches the published JSON schema artifact", async () => {
  const schemaUrl = new URL("./schemas/compare/v1.json", import.meta.url);
  const schemaJson = JSON.parse(await readFile(schemaUrl, "utf8"));

  assert.deepEqual(compareV1Schema, schemaJson);
});
