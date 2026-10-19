/**
 * First-touch attribution: which campaign or link brought a visitor, so
 * the team can see which channels actually produce enquiries
 * (docs/04-WEBSITE.md §6).
 *
 * Kept in sessionStorage only - no cookies, nothing sent anywhere unless
 * the visitor submits a form, cleared when the tab closes. Captured on the
 * first page of the visit, so it survives navigating to /contact.
 */
import type { AttributionField } from "@zgate/website-contracts/constants";

type Attribution = Record<AttributionField, string>;

const KEY = "zgate:attribution";

const UTM: Record<string, keyof Attribution> = {
  utm_source: "utmSource",
  utm_medium: "utmMedium",
  utm_campaign: "utmCampaign",
  utm_content: "utmContent",
  utm_term: "utmTerm",
};

export function captureAttribution(): void {
  try {
    if (sessionStorage.getItem(KEY)) return;
    const url = new URL(window.location.href);
    const data: Partial<Attribution> = {
      landingPage: url.pathname.slice(0, 500),
      // Only the referring site, never its full URL (which can carry personal data).
      referrer: document.referrer ? new URL(document.referrer).origin.slice(0, 500) : "",
    };
    for (const [param, field] of Object.entries(UTM)) {
      const value = url.searchParams.get(param);
      if (value) data[field] = value.slice(0, 100);
    }
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage blocked (private mode, policy): attribution is optional.
  }
}

export function readAttribution(): Partial<Attribution> {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "{}") as Partial<Attribution>;
  } catch {
    return {};
  }
}
