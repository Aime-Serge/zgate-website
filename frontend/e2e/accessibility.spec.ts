/**
 * WCAG 2.2 AA (docs/WEBSITE.md, Accessibility) via axe-core, on every
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
  "/solutions",
  "/solutions/traders-and-shops",
  "/search",
  "/demos",
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
  // Scoped to the header: the footer has its own "About Z-GATE" link.
  const nav = page.getByRole("navigation", { name: "Main" });
  const about = nav.getByRole("link", { name: "About Z-GATE", exact: true });
  const toggle = nav.getByRole("button", { name: "Menu" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(about).toBeHidden();
  await toggle.click();
  await expect(nav.getByRole("button", { name: "Close menu" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(about).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(nav.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-expanded", "false");
});

test("the Services menu is a disclosure that Escape closes", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  const services = nav.getByRole("button", { name: "Services" });
  await expect(services).toHaveAttribute("aria-expanded", "false");
  await services.click();
  await expect(services).toHaveAttribute("aria-expanded", "true");
  const panel = page.getByRole("region", { name: "Services" });
  for (const name of ["Z-GATE Advisory", "Z-GATE Academy", "Z-GATE Tech", "Z-GATE Data"]) {
    await expect(panel.getByRole("link", { name: new RegExp(`^${name}`) })).toBeVisible();
  }
  await page.keyboard.press("Escape");
  await expect(services).toHaveAttribute("aria-expanded", "false");
  await expect(panel).toBeHidden();
});

test("the Solutions menu offers each kind of business and each need", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await nav.getByRole("button", { name: "Solutions" }).click();
  const panel = page.getByRole("region", { name: "Solutions" });
  await expect(panel.getByRole("link", { name: /^Traders and shops/ })).toBeVisible();
  await expect(panel.getByRole("link", { name: "I'm not sure what we need" })).toBeVisible();
  await panel.getByRole("link", { name: /^Traders and shops/ }).click();
  await expect(page).toHaveURL(/\/solutions\/traders-and-shops$/);
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Solutions");
});

test("a solution page has one address, under /solutions", async ({ page }) => {
  const response = await page.goto("/traders-and-shops");
  expect(response?.status()).toBe(404);
});

test("search filters as you type and keeps the query in the address", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("button", { name: "Search" })
    .click();
  await page.getByRole("searchbox", { name: "Search the site" }).fill("EBM");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=EBM$/);
  await expect(page.getByRole("status")).toHaveText(/^\d+ results? for “EBM”$/);
  const results = page.getByRole("main").getByRole("link", { name: /EBM & Digital Invoicing/ });
  await expect(results.first()).toBeVisible();

  await page.getByRole("searchbox", { name: "What are you looking for?" }).fill("zzzz");
  await expect(page.getByRole("status")).toHaveText("0 results for “zzzz”");
  await expect(page.getByRole("link", { name: "Start Now" }).first()).toBeVisible();
  await expect(page).toHaveURL(/\?q=zzzz$/);
});

test("an open menu holds the page still and fits the screen", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 640 });
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("button", { name: "Academy" })
    .click();
  const panel = page.getByRole("region", { name: "Academy" });
  await expect(panel).toBeVisible();
  await page.mouse.move(500, 600);
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(300);
  // The page behind didn't move, and the panel never runs past the screen.
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  const box = await panel.boundingBox();
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(640 + 1);
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
});

test("every course card is a gate: an enroll action and the details", async ({ page }) => {
  await page.goto("/academy/courses");
  const cards = page
    .getByRole("main")
    .getByRole("article")
    .filter({ has: page.getByRole("link", { name: /^Details: / }) });
  expect(await cards.count()).toBeGreaterThan(0);
  for (const card of await cards.all()) {
    // Waitlist until registration opens on the learning platform, then "Enroll now".
    await expect(
      card.getByRole("link", { name: /^(Join the waitlist|Enroll now)$/ }),
    ).toBeVisible();
  }
  await cards.first().getByRole("link", { name: "Join the waitlist" }).click();
  await expect(page).toHaveURL(/\/academy\/courses\/[a-z0-9-]+#enroll$/);
});

test("the assistant answers from the website and hands off to a person", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ask the Z-GATE assistant" }).click();
  const panel = page.getByRole("dialog", { name: "Z-GATE Assistant" });
  await expect(panel).toBeVisible();
  await panel.getByRole("textbox", { name: "Your question" }).fill("How do I fix my EBM receipts?");
  await panel.getByRole("button", { name: "Send" }).click();
  // Locally there's no AI key: guided answers, with the site pages that match.
  const log = panel.getByRole("log", { name: "Conversation" });
  await expect(log.getByRole("link").first()).toBeVisible();
  await expect(panel.getByRole("link", { name: "Start Now" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(page.getByRole("button", { name: "Ask the Z-GATE assistant" })).toBeFocused();
});

test("the header offers language and sign-in, honestly", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await nav.getByRole("button", { name: "Language: English" }).click();
  const languages = page.getByRole("region", { name: "Language" });
  await expect(languages.getByText("Coming soon", { exact: true })).toHaveCount(2);
  await nav.getByRole("button", { name: "Sign in" }).click();
  const account = page.getByRole("region", { name: "Sign in" });
  await expect(account.getByText("Z-GATE Academy Online")).toBeVisible();
});

test("Start Now sits in the header; Demo prefills a demo request", async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 800 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Start Now" })).toBeVisible();
  await page.goto("/contact?intent=demo");
  await expect(page.getByLabel("How can we help?")).toHaveValue(/demo/);
});

test("the demo library searches, filters, saves and leads to a walkthrough", async ({ page }) => {
  await page.goto("/demos");
  const status = page.getByRole("status").filter({ hasText: /^Showing/ });
  const all = Number((await status.innerText()).match(/\d+/)?.[0]);
  expect(all).toBeGreaterThan(0);

  // Filter by service: fewer results, and every card is a Data demo.
  await page.getByRole("checkbox", { name: "Data", exact: true }).check();
  const data = Number((await status.innerText()).match(/\d+/)?.[0]);
  expect(data).toBeLessThan(all);
  for (const card of await page.getByRole("main").getByRole("article").all()) {
    if (await card.isVisible()) await expect(card).toContainText(/^Data ·|Data ·/);
  }
  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(status).toHaveText(`Showing ${all} results`);

  // Search narrows; saving a demo makes it findable under "Saved demos".
  await page.getByRole("searchbox", { name: "Search demos" }).fill("EBM");
  const first = page.getByRole("main").getByRole("article").first();
  const title = await first.getByRole("heading").innerText();
  await first.getByRole("button", { name: `Save ${title}` }).click();
  await page.getByRole("button", { name: "Clear all" }).click();
  await page.getByRole("checkbox", { name: /^Saved demos/ }).check();
  await expect(status).toHaveText("Showing 1 result");

  // A placeholder offers a live walkthrough, with the demo named in the form.
  await page.getByRole("link", { name: `Request a live walkthrough: ${title}` }).click();
  await expect(page).toHaveURL(/\/contact\?intent=demo&topic=/);
  await expect(page.getByLabel("How can we help?")).toHaveValue(new RegExp(title.slice(0, 20)));
});

test("the footer always shows the six social networks", async ({ page }) => {
  await page.goto("/about");
  const social = page.getByRole("list", { name: "Z-GATE on social media" });
  await expect(social.getByRole("listitem")).toHaveCount(6);
  for (const name of ["LinkedIn", "Facebook", "Instagram", "X", "YouTube", "TikTok"]) {
    // A link once the account is set in the CMS, a labelled placeholder until then.
    await expect(social.getByLabel(new RegExp(`^Z-GATE on ${name}`))).toBeVisible();
  }
});

test("floating contact buttons wait until the visitor scrolls past the hero", async ({ page }) => {
  await page.goto("/");
  const floating = page.locator("[data-reveal]").getByRole("link", { name: "Demo Library" });
  // Hidden (not just transparent): keyboard focus can't land on it.
  await expect(floating).toBeHidden();
  await page.mouse.wheel(0, 1200);
  await expect(floating).toBeVisible();
});

test("division tabs follow the arrow-key tab pattern", async ({ page }) => {
  await page.goto("/");
  const tabs = page.getByRole("tablist", { name: "Divisions" });
  const first = tabs.getByRole("tab").first();
  await first.focus();
  await expect(first).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowRight");
  const second = tabs.getByRole("tab").nth(1);
  await expect(second).toBeFocused();
  await expect(second).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel", { name: await second.innerText() })).toBeVisible();
});

test("the situations marquee moves on its own, with no scrollbar", async ({ page }) => {
  await page.goto("/");
  const marquee = page.getByRole("region", { name: "What working with Z-GATE looks like" });
  const track = marquee.locator("[data-marquee-track]");
  // The track's left edge on screen: it moves left while the marquee runs.
  const offset = () => track.evaluate((el) => el.getBoundingClientRect().left);
  await marquee.scrollIntoViewIfNeeded();
  // Moving: the pointer is kept off it, since hovering pauses it.
  await page.mouse.move(0, 0);
  const start = await offset();
  await page.waitForTimeout(1000);
  expect(await offset()).toBeLessThan(start);

  // Nothing to scroll by hand: the row clips its overflow.
  await expect(marquee).toHaveCSS("overflow-x", "hidden");
  await expect(marquee.getByRole("button")).toHaveCount(0);

  // The loop's duplicate cards are hidden from screen readers: each situation is read once.
  const first = marquee.getByRole("heading", { level: 3 }).first();
  await expect(marquee.getByRole("heading", { name: await first.innerText() })).toHaveCount(1);
});

test("the situations row stays still for visitors who ask for reduced motion", async ({
  browser,
}) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  const marquee = page.getByRole("region", { name: "What working with Z-GATE looks like" });
  await expect(marquee.locator("[data-marquee-track]")).toHaveCSS("animation-name", "none");
  // Every card is shown, still, wrapped into rows: none is cut off.
  const clipped = await marquee.evaluate((region) => {
    const edge = region.getBoundingClientRect().right;
    return [...region.querySelectorAll("li")]
      .filter((li) => getComputedStyle(li).display !== "none")
      .filter((li) => li.getBoundingClientRect().right > edge + 1).length;
  });
  expect(clipped).toBe(0);
  await context.close();
});
