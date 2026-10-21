/** The lead forms as a visitor uses them, with JavaScript on. */
import { expect, test } from "@playwright/test";
import { withDb } from "./db";

const COURSE = "/academy/courses/tax-bookkeeping-fundamentals";

test("course waitlist: errors are announced, then a valid sign-up succeeds", async ({ page }) => {
  await page.goto(COURSE);
  const form = page.locator("form[data-lead-form]");
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
    // ::int - Django's ids are bigint, which the pg driver returns as strings.
    client.query("select kind, course_id::int from leads_lead where name = 'E2E Waitlist'"),
  );
  expect(rows.rows).toEqual([{ kind: "waitlist", course_id: expect.any(Number) }]);
});

test("contact enquiry routes a service and stores the visitor's message", async ({ page }) => {
  await page.goto("/contact");
  const form = page.locator("form[data-lead-form]");
  await form.getByLabel("Your name").fill("E2E Simple Enquiry");
  await form.getByLabel("Phone, WhatsApp or email").fill("+250 700 000 124");
  await form.getByLabel("What do you need help with?").selectOption("advisory");
  await form.getByLabel("How can we help?").fill("I need help with monthly bookkeeping.");
  await form.getByLabel("I agree that Z-GATE may contact me").check();
  await form.getByRole("button", { name: "Send message" }).click();

  await expect(page.getByRole("status")).toContainText("Thank you");
  const rows = await withDb((client) =>
    client.query(
      `select lead.business_name, lead.preferred_channel, lead.message, area.code
       from leads_lead lead
       join leads_lead_service_areas selected on selected.lead_id = lead.id
       join leads_servicearea area on area.id = selected.servicearea_id
       where lead.name = 'E2E Simple Enquiry'`,
    ),
  );
  expect(rows.rows).toEqual([
    {
      business_name: "",
      preferred_channel: "provided-contact",
      message: "I need help with monthly bookkeeping.",
      code: "advisory",
    },
  ]);
});

test("contact validation preserves the selected service and entered details", async ({ page }) => {
  await page.goto("/contact");
  const form = page.locator("form[data-lead-form]");
  await form.getByLabel("Your name").fill("E2E Preserved Enquiry");
  await form.getByLabel("Phone, WhatsApp or email").fill("+250 700 000 125");
  await form.getByLabel("What do you need help with?").selectOption("data");
  await form.getByRole("button", { name: "Send message" }).click();

  await expect(form.getByRole("alert")).toContainText("Please check the highlighted fields.");
  await expect(form.getByLabel("Your name")).toHaveValue("E2E Preserved Enquiry");
  await expect(form.getByLabel("What do you need help with?")).toHaveValue("data");
});

test("the consent text links to the privacy notice", async ({ page }) => {
  await page.goto("/contact");
  const link = page.locator("form[data-lead-form]").getByRole("link", { name: "privacy notice" });
  await expect(link).toHaveAttribute("href", "/privacy");
  await link.click();
  await expect(page.getByRole("heading", { level: 1, name: "Privacy notice" })).toBeVisible();
});

test("division contact links carry the service context into the enquiry form", async ({ page }) => {
  await page.goto("/advisory");
  await page.getByRole("link", { name: "Request a consultation" }).first().click();
  await expect(page).toHaveURL(/\/contact\?service=advisory$/);
  await expect(
    page.locator("form[data-lead-form]").getByLabel("What do you need help with?"),
  ).toHaveValue("advisory");
  await expect(
    page
      .locator("form[data-lead-form]")
      .getByText(/selected Advisory — tax and business support based on the page you came from/),
  ).toBeVisible();
});

test("the contact page always offers direct channels beside the form", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.getByRole("link", { name: /\+250/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /@/ }).first()).toBeVisible();
});
