import Link from "next/link";
import { Lockup } from "@/components/brand/GateMark";
import { container, cx } from "@/components/ui/styles";
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
    ...divisions.map((division) => ({
      href: `/${division.slug}`,
      label: division.shortName,
      tone: division.slug,
    })),
    ...(showInsights ? [{ href: "/insights", label: "Insights" }] : []),
    { href: "/about", label: "About" },
    ...(lms ? [{ href: `${lms}/login`, label: "Log in", external: true }] : []),
  ];
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink">
      <div className={cx(container, "flex flex-wrap items-center justify-between gap-4 py-3")}>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center no-underline"
          aria-label={`${settings.tradingName} — home`}
        >
          <Lockup name="Solution" />
        </Link>
        <HeaderNav links={links} cta={{ href: "/contact", label: "Start a conversation" }} />
      </div>
    </header>
  );
}
