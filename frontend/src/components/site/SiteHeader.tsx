import Link from "next/link";
import type { Division, SiteSetting } from "@zgate/cms-contracts";
import { HeaderNav, type NavLink } from "./HeaderNav";

type Props = { settings: SiteSetting; divisions: Division[]; showInsights: boolean };

/**
 * Global navigation. "Insights" appears only once an article is published,
 * and "Log in" only once the e-learning platform is live
 * (enrollmentMode = "lms") - no links to things that don't exist yet.
 */
export function SiteHeader({ settings, divisions, showInsights }: Props) {
  const lms = settings.enrollmentMode === "lms" && settings.lmsBaseUrl ? settings.lmsBaseUrl : null;
  const links: NavLink[] = [
    ...divisions.map((division) => ({ href: `/${division.slug}`, label: division.shortName })),
    ...(showInsights ? [{ href: "/insights", label: "Insights" }] : []),
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    ...(lms ? [{ href: `${lms}/login`, label: "Log in", external: true }] : []),
  ];
  return (
    <header className="site-header">
      <div className="max site-header__inner">
        <Link href="/" className="site-header__brand">
          {settings.legalName}
        </Link>
        <HeaderNav links={links} />
      </div>
    </header>
  );
}
