// SPDX-License-Identifier: MIT

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

test("hello-world compare embed hydrates and has no axe violations", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.locator("prax-compare [data-prax-hydrated='true']"),
  ).toBeVisible();
  await expect(page.locator("prax-compare [data-prax-ssr]")).toHaveCount(0);

  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(results.violations).toEqual([]);
});

test("invalid compare config renders the shared error card and keeps fallback visible", async ({
  page,
}) => {
  await page.goto("/invalid.html");

  await expect(page.locator(".prax-error-card")).toBeVisible();
  await expect(page.locator("prax-compare [data-prax-ssr]")).toBeVisible();
  await expect(
    page.locator("prax-compare [data-prax-hydrated='true']"),
  ).toHaveCount(0);

  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(results.violations).toEqual([]);
});
