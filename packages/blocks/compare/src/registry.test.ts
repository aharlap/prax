// SPDX-License-Identifier: MIT

import assert from "node:assert/strict";
import { test } from "node:test";

import { renderBlockHtml } from "@praxity/html-render";

import "./render-html.js";

test("compare registers its HTML renderer with the shared registry", () => {
  const html = renderBlockHtml("compare", {
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

  assert.match(html, /<h2>Before and after<\/h2>/);
});
