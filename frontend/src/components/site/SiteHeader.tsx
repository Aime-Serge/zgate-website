import Link from "next/link";
import { Lockup } from "@/components/brand/GateMark";
import { container, cx } from "@/components/ui/styles";
import type { Course, Division, Page, SiteSetting } from "@zgate/cms-contracts";
import { enrollAction, formatPrice, learningPlatform } from "./CourseCard";
import { MegaNav, type MenuLink, type MenuNeed } from "./MegaNav";

type Props = {
  settings: SiteSetting;
  divisions: Division[];
  solutions: Page[];
  needs: MenuNeed[];
  courses: Course[];
  showInsights: boolean;
};

/**
 * Sticky global header: the lockup, the mega menu (Services, Solutions,
 * Academy, Company), search, the phone number and the main call to action.
 *
 * Only what the menu shows is passed to the client component, so the page
 * doesn't ship whole CMS documents to the browser. "Insights" appears once
 * an article is published, "Log in" once the learning platform is live
 * (enrollmentMode = "lms"): no links to things that don't exist yet.
 */
export function SiteHeader({
  settings,
  divisions,
  solutions,
  needs,
  courses,
  showInsights,
}: Props) {
  const lms = learningPlatform(settings);
  const company: MenuLink[] = [
    { href: "/about", label: "About Z-GATE", description: "Why one company, our values and facts" },
    ...(showInsights
      ? [{ href: "/insights", label: "Insights", description: "Plain-language articles" }]
      : []),
    { href: "/demos", label: "Demo Library", description: "See how each service works" },
    { href: "/contact", label: "Contact", description: "WhatsApp, phone, email or the form" },
  ];
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ink/95 backdrop-blur supports-[backdrop-filter]:bg-ink/85">
      <nav
        aria-label="Main"
        className={cx(container, "flex flex-wrap items-center justify-between gap-x-6 py-3")}
      >
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-sm no-underline"
          aria-label={`${settings.tradingName}, home`}
        >
          <Lockup />
        </Link>
        <MegaNav
          services={divisions.map((division) => ({
            slug: division.slug,
            name: division.name,
            shortName: division.shortName,
            subtitle: division.subtitle,
            pillar: division.pillar,
            mission: division.mission,
            included: division.included.slice(0, 4).map((entry) => entry.item),
          }))}
          solutions={solutions.map((page) => ({
            slug: page.slug,
            title: page.title,
            summary: page.meta?.description,
          }))}
          needs={needs}
          courses={courses.map((course) => {
            const { label, href, external } = enrollAction(course, lms);
            return {
              slug: course.slug,
              title: course.title,
              detail:
                [course.duration, course.format, formatPrice(course)].filter(Boolean).join(" · ") ||
                null,
              enroll: { label, href, external },
            };
          })}
          company={company}
          facts={(settings.companyFacts ?? []).map((entry) => entry.fact)}
          phone={settings.phone}
          login={lms ? `${lms}/login` : null}
          lmsOpen={Boolean(lms)}
        />
      </nav>
    </header>
  );
}
