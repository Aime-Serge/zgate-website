/** The lead forms as a visitor uses them, with JavaScript on. */
import { expect, test } from "@playwright/test";
import { withDb } from "./db";

const COURSE = "/academy/courses/tax-bookkeeping-fundamentals";

test("course waitlist: errors are announced, then a valid sign-up succeeds", async ({ page }) => {
  await page.goto(COURSE);
  const form = page.locator("form.lead-form");
  await expect(form.getByRole("heading", { name: "Join the waitlist" })).toBeVisible();

  // Submitting empty: the error summary takes focus, fields are flagged.
  await form.getByRole("button", { name: "Join the waitlist" }).click();
  // (Next.js also renders an empty role=alert route announcer - target ours.)
  await expect(form.getByRole("alert")).toBeFocused();
  await expect(form.getByLabel("Your name")).toHaveAttribute("aria-invalid", "true");
  await expect(form.getByText("Enter your name.")).toBeVisible();

  await form.getByLabel("Your name").fill("E2E Waitlist");
  await form.getByLabel("Phone, WhatsApp or email").fill("+250 700 000 123");
  await form.getByLabel(/I agree that Z-GATE may contact me/).check();
  await form.getByRole("button", { name: "Join the waitlist" }).click();

  await expect(page.getByRole("status")).toContainText("Thank you");
  await expect(page.getByRole("status")).toBeFocused();

  const rows = await withDb((client) =>
    client.query("select kind, course_id from leads where name = 'E2E Waitlist'"),
  );
  expect(rows.rows).toEqual([{ kind: "waitlist", course_id: expect.any(Number) }]);
});

test("the consent text links to the privacy notice", async ({ page }) => {
  await page.goto("/contact");
  const link = page.locator("form.lead-form").getByRole("link", { name: "privacy notice" });
  await expect(link).toHaveAttribute("href", "/privacy");
  await link.click();
  await expect(page.getByRole("heading", { level: 1, name: "Privacy notice" })).toBeVisible();
});

test("the contact page always offers direct channels beside the form", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.getByRole("link", { name: /\+250/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /@/ }).first()).toBeVisible();
});
