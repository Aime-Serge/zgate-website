/**
 * JavaScript weight budget - the main cost on slow mobile connections
 * (docs/WEBSITE.md, Performance budget). Measured as compressed bytes on the
 * wire, on a cold load.
 *
 * Budgets are set from measurement, with headroom, so growth is a
 * deliberate decision rather than drift. Raise them only with a reason in
 * the commit message.
 */
import { expect, type Page, test } from "@playwright/test";

// Measured 2026-10-14: 138 KB on every page type (React DOM ~70 KB and the
// Next.js runtime ~50 KB are most of it; the form adds very little since
// validation stays server-side). Budget = measurement + ~10%.
// History: 227 KB before zod was kept out of the browser bundle.
const BUDGET_KB = {
  content: 152,
  form: 152,
};

async function scriptKb(page: Page, path: string): Promise<number> {
  let bytes = 0;
  const pending: Promise<void>[] = [];
  page.on("requestfinished", (request) => {
    if (request.resourceType() !== "script") return;
    pending.push(
      request.sizes().then((sizes) => {
        bytes += sizes.responseBodySize;
      }),
    );
  });
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  await Promise.all(pending);
  return Math.round(bytes / 1024);
}

for (const [path, kind] of [
  ["/", "content"],
  ["/advisory", "content"],
  ["/solutions/traders-and-shops", "content"],
  // The search page's own component, on top of every page's menu.
  ["/search", "content"],
  ["/contact", "form"],
  ["/academy/courses/tax-bookkeeping-fundamentals", "form"],
] as const) {
  test(`${path} ships at most ${BUDGET_KB[kind]} KB of compressed JavaScript`, async ({ page }) => {
    const kb = await scriptKb(page, path);
    test.info().annotations.push({ type: "js-kb", description: `${kb} KB` });
    console.log(`JS on ${path}: ${kb} KB`);
    expect(kb).toBeLessThanOrEqual(BUDGET_KB[kind]);
  });
}
