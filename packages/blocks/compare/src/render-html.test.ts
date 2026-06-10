// SPDX-License-Identifier: MIT

import assert from "node:assert/strict";
import { test } from "node:test";

import { renderHtml } from "./render-html.js";

test("renderHtml emits semantic compare fallback markup", () => {
  const html = renderHtml({
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
  });

  assert.match(html, /<section class="prax-compare" lang="en">/);
  assert.match(html, /<h2>Before and after<\/h2>/);
  assert.match(html, /<figure class="prax-compare__figure">/);
  assert.match(html, /alt="Before state"/);
  assert.match(html, /alt="After state"/);
});
