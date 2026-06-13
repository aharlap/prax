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

test("design workbench renders controls, result modes, and audit", async ({
  page,
}) => {
  await page.goto("/tools/design");

  await expect(
    page.getByLabel("Praxity Design Tool").getByText("Praxity"),
  ).toBeVisible();
  const presetSelect = page.getByRole("combobox", { name: "Preset" });
  await expect(presetSelect).toHaveValue("cinematic");
  await expect(page.getByText("Practice Studio")).toBeVisible();
  await expect(page.locator("#design-audit-badge")).toHaveText("OK");
  await expect(page.getByText("Import URL")).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: /Name/ })).toHaveValue(
    "Cinematic Learning UI",
  );

  await presetSelect.selectOption("colorful");
  await expect(
    page.getByRole("textbox", { name: /Style summary/ }),
  ).toHaveValue(/Expressive pink/);

  await page.getByRole("tab", { name: "Elements" }).click();
  await expect(
    page.getByLabel("Result", { exact: true }).getByRole("heading", {
      name: "Component Tokens",
    }),
  ).toBeVisible();

  await page.getByRole("tab", { name: "DESIGN.md" }).click();
  await expect(page.getByRole("heading", { name: "DESIGN.md" })).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(results.violations).toEqual([]);

  await page.locator("#design-body-size").fill("0.75");
  await page.locator("#design-heading-size").fill("0.8");
  await page.locator("#design-line-height").fill("1.2");
  await page.getByRole("button", { name: "Auto repair" }).click();
  await expect(page.locator("#design-body-size")).toHaveValue("1");
  await expect(page.locator("#design-heading-size")).toHaveValue("1.2");
  await expect(page.locator("#design-line-height")).toHaveValue("1.5");

  await page.getByLabel("neutral colour").fill("#eeeeee");
  await expect(page.locator("#design-audit-badge")).toHaveText("Check");
});
