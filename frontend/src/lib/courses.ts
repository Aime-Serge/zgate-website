/**
 * Course facts and the enroll action, shared by the course cards, the
 * Academy menu, the course page and the website assistant - one source,
 * so they can never disagree.
 */
import type { Course, SiteSetting } from "@zgate/cms-contracts";

// "RWF 40,000" - Intl's en-RW currency style prints the symbol "RF", which
// readers here don't use on prices.
const amount = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });
const dayFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatPrice(
  course: Pick<Course, "priceAmount" | "priceNote" | "currency">,
): string | null {
  if (typeof course.priceAmount !== "number") return null;
  return [`${course.currency ?? "RWF"} ${amount.format(course.priceAmount)}`, course.priceNote]
    .filter(Boolean)
    .join(" ");
}

export const coursePath = (course: Pick<Course, "slug">) => `/academy/courses/${course.slug}`;

/** The learning platform's address once enrollment runs there (Site settings > Academy), else null. */
export function learningPlatform(settings: SiteSetting): string | null {
  return settings.enrollmentMode === "lms" && settings.lmsBaseUrl ? settings.lmsBaseUrl : null;
}

export type EnrollAction = { label: string; href: string; external: boolean; open: boolean };

/**
 * The one enroll action every course card, menu and page uses, so they can
 * never disagree. The website is the gate, not the classroom: once
 * registration runs on Z-GATE Academy Online, "Enroll now" goes there;
 * until then the same button joins the course's waitlist, because a button
 * may never promise an enrollment the platform can't take yet. An admin
 * flips every card at once (Site settings > Academy > enrollment mode).
 */
export function enrollAction(course: Pick<Course, "slug">, platform: string | null): EnrollAction {
  return platform
    ? {
        label: "Enroll now",
        href: `${platform}/courses/${encodeURIComponent(course.slug)}/enroll`,
        external: true,
        open: true,
      }
    : {
        label: "Join the waitlist",
        href: `${coursePath(course)}#enroll`,
        external: false,
        open: false,
      };
}

/** The first intake that hasn't started yet, as words. */
export function nextIntake(course: Pick<Course, "intakes">): string {
  const upcoming = (course.intakes ?? []).filter(
    (intake) => new Date(intake.startsOn) >= new Date(),
  );
  const first = upcoming[0];
  return first
    ? `${first.label}, ${dayFormat.format(new Date(first.startsOn))}`
    : "Dates to be announced";
}
