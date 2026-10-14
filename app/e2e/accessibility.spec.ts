/**
 * WCAG 2.2 AA (docs/platform-v2/04-WEBSITE.md §10) via axe-core, on every
 * kind of public page. axe catches roughly a third to a half of real
 * accessibility issues - this is a floor, not a substitute for manual
 * keyboard and screen-reader checks.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = [
  "/",
  "/about",
  "/contact",
  "/advisory",
  "/academy",
  "/tech",
  "/data",
  "/academy/courses",
  "/academy/courses/tax-bookkeeping-fundamentals",
];

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const path of PAGES) {
  test(`${path} has no detectable WCAG A/AA violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const summary = results.violations.map(
      (v) => `${v.id} (${v.impact}): ${v.nodes.length} element(s) - ${v.help}`,
    );
    expect(summary).toEqual([]);
  });
}

test("home page and form are accessible on a phone-sized screen @mobile", async ({ page }) => {
  for (const path of ["/", "/contact"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  }
});

test("every page has one h1, a main landmark and a working skip link", async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    await expect(page.locator("h1"), path).toHaveCount(1);
    await expect(page.locator("main#main"), path).toHaveCount(1);
  }
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
});

test("mobile menu is a real disclosure button @mobile", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Menu" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("link", { name: "About" })).toBeHidden();
  await toggle.click();
  await expect(page.getByRole("button", { name: "Close menu" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(page.getByRole("link", { name: "About" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Menu" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});
