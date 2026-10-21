import Link from "next/link";
import { Lockup } from "@/components/brand/GateMark";
import type React from "react";
import {
  Facebook,
  Instagram,
  LinkedIn,
  Message,
  TikTok,
  XLogo,
  YouTube,
} from "@/components/ui/icons";
import { button, buttonSecondary, container, cx, label } from "@/components/ui/styles";
import { tone } from "@/components/ui/tone";
import type { Course, Division, Page, SiteSetting } from "@zgate/cms-contracts";
import { telHref, whatsappGreeting, whatsappHref } from "./ContactChannels";

type Props = {
  settings: SiteSetting;
  divisions: Division[];
  solutions: Page[];
  courses: Course[];
  showInsights: boolean;
  showPrivacyLink: boolean;
};

type Network = NonNullable<SiteSetting["social"]>[number]["network"];

/**
 * Each network in its official colour (X and TikTok, black in their own
 * brand kits, are white on this dark footer; TikTok keeps its cyan and pink
 * edge). `color` styles the icon; `hover` fills the circle on a live link.
 * Class strings written out in full so Tailwind finds them.
 */
const NETWORKS: Record<
  Network,
  {
    name: string;
    Icon: (props: { className?: string }) => React.JSX.Element;
    color: string;
    hover: string;
    /** Extra classes on the icon itself (TikTok's coloured edge). */
    icon?: string;
  }
> = {
  linkedin: {
    name: "LinkedIn",
    Icon: LinkedIn,
    color: "text-[#0A66C2]",
    hover: "hover:border-[#0A66C2] hover:bg-[#0A66C2] hover:text-white",
  },
  facebook: {
    name: "Facebook",
    Icon: Facebook,
    color: "text-[#1877F2]",
    hover: "hover:border-[#1877F2] hover:bg-[#1877F2] hover:text-white",
  },
  instagram: {
    name: "Instagram",
    Icon: Instagram,
    color: "text-[#E4405F]",
    hover:
      "hover:border-[#DD2A7B] hover:bg-[linear-gradient(45deg,#F58529,#DD2A7B,#8134AF,#515BD4)] hover:text-white",
  },
  x: {
    name: "X",
    Icon: XLogo,
    color: "text-white",
    hover: "hover:border-white hover:bg-white hover:text-black",
  },
  youtube: {
    name: "YouTube",
    Icon: YouTube,
    color: "text-[#FF0000]",
    hover: "hover:border-[#FF0000] hover:bg-[#FF0000] hover:text-white",
  },
  tiktok: {
    name: "TikTok",
    Icon: TikTok,
    color: "text-white",
    icon: "[filter:drop-shadow(1.5px_0_0_#25F4EE)_drop-shadow(-1.5px_0_0_#FE2C55)]",
    hover: "hover:border-[#FE2C55] hover:bg-black",
  },
};

const heading = cx(label, "mb-4 tracking-[0.14em]");
const list = "grid list-none gap-2.5";
const footLink = "text-paper-dim no-underline transition-colors hover:text-paper hover:underline";

/**
 * Footer, in four bands (ServiceNow's order, Z-GATE's content):
 *  1. the site map in columns: services, solutions, Academy, company, contact;
 *  2. a centred invitation to talk to a person;
 *  3. the brand row: the lockup and motto, and the six social icons. Each
 *     links to the account set in Site settings > Contact; one without an
 *     address yet shows as a dimmed, non-clickable placeholder;
 *  4. the legal line, centred: copyright, registration, privacy notice.
 */
export function SiteFooter({
  settings,
  divisions,
  solutions,
  courses,
  showInsights,
  showPrivacyLink,
}: Props) {
  const whatsapp = settings.whatsapp || settings.phone;
  const social = settings.social ?? [];
  return (
    // Bottom padding on phones leaves room for the quick-contact bar.
    <footer className="border-t border-line bg-ink max-sm:pb-[calc(64px+env(safe-area-inset-bottom))]">
      <div className={container}>
        {/* Five columns only where the contact column can keep a phone
            number and the email on one line each. */}
        <div className="grid gap-10 py-12 sm:grid-cols-2 wide:grid-cols-3 xl:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,1.5fr)]">
          <nav aria-label="Services">
            <h2 className={heading}>Services</h2>
            <ul className={list}>
              {divisions.map((division) => (
                <li key={division.id} className={tone(division.slug)}>
                  <Link
                    href={`/${division.slug}`}
                    className="inline-grid grid-cols-[auto_1fr] items-baseline gap-x-2 text-paper no-underline before:size-2 before:-translate-y-px before:rounded-full before:bg-accent before:content-[''] hover:underline"
                  >
                    {division.name}
                    {division.subtitle ? (
                      <span className="col-start-2 text-[0.8125rem] text-paper-dim">
                        {division.subtitle}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {solutions.length > 0 ? (
            <nav aria-label="Solutions">
              <h2 className={heading}>Solutions</h2>
              <ul className={list}>
                {solutions.map((solution) => (
                  <li key={solution.id}>
                    <Link href={`/solutions/${solution.slug}`} className={footLink}>
                      {solution.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <nav aria-label="Academy">
            <h2 className={heading}>Academy</h2>
            <ul className={list}>
              <li>
                <Link href="/academy/courses" className={footLink}>
                  All courses
                </Link>
              </li>
              {courses.map((course) => (
                <li key={course.id}>
                  <Link href={`/academy/courses/${course.slug}`} className={footLink}>
                    {course.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company">
            <h2 className={heading}>Company</h2>
            <ul className={list}>
              <li>
                <Link href="/about" className={footLink}>
                  About Z-GATE
                </Link>
              </li>
              {showInsights ? (
                <li>
                  <Link href="/insights" className={footLink}>
                    Insights
                  </Link>
                </li>
              ) : null}
              <li>
                <Link href="/demos" className={footLink}>
                  Demo Library
                </Link>
              </li>
              <li>
                <Link href="/contact" className={footLink}>
                  Contact
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className={heading}>Contact</h2>
            <ul aria-label="Contact channels" className={list}>
              <li className="grid grid-cols-[5.5rem_1fr] gap-2">
                <span className="text-paper-dim">WhatsApp</span>
                <a href={whatsappHref(whatsapp)} className="text-paper underline-offset-4">
                  {whatsapp}
                </a>
              </li>
              <li className="grid grid-cols-[5.5rem_1fr] gap-2">
                <span className="text-paper-dim">Phone</span>
                <a href={telHref(settings.phone)} className="text-paper underline-offset-4">
                  {settings.phone}
                </a>
              </li>
              <li className="grid grid-cols-[5.5rem_1fr] gap-2">
                <span className="text-paper-dim">Email</span>
                <a
                  href={`mailto:${settings.email}`}
                  className="text-paper underline-offset-4 [overflow-wrap:anywhere]"
                >
                  {settings.email}
                </a>
              </li>
            </ul>
            <address className="mt-4 max-w-[30ch] text-sm leading-relaxed text-paper-dim not-italic">
              {settings.address}
            </address>
          </div>
        </div>

        {/* Pages already end with a big invitation; this one is compact. */}
        <div className="grid justify-items-center gap-5 border-t border-line py-12 text-center">
          <p className="font-display text-2xl font-bold tracking-[-0.01em] text-balance">
            Talk to a person at <span className="whitespace-nowrap">Z-GATE</span>
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/contact" className={button}>
              Contact us
            </Link>
            <a href={whatsappHref(whatsapp, whatsappGreeting())} className={buttonSecondary}>
              <Message className="mr-2 size-5" />
              WhatsApp us
            </a>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-6 border-t border-line pt-8 pb-6">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link href="/" aria-label={`${settings.tradingName}, home`} className="rounded-sm">
              <Lockup />
            </Link>
            <p className="font-display font-bold sm:border-l sm:border-line sm:pl-5">
              {settings.motto}
            </p>
          </div>
          <ul aria-label="Z-GATE on social media" className="flex list-none flex-wrap gap-2">
            {(Object.keys(NETWORKS) as Network[]).map((network) => {
              const { name, Icon, color, hover, icon } = NETWORKS[network];
              const url = social.find((entry) => entry.network === network)?.url;
              return (
                <li key={network}>
                  {url ? (
                    <a
                      href={url}
                      aria-label={`Z-GATE on ${name}`}
                      title={name}
                      rel="noopener noreferrer"
                      className={cx(
                        "inline-flex size-11 items-center justify-center rounded-full border border-line transition-colors duration-150",
                        color,
                        hover,
                      )}
                    >
                      <Icon className={cx("size-5", icon)} />
                    </a>
                  ) : (
                    // Placeholder until the account's address is added in
                    // Site settings: shown, but not a link to nowhere.
                    <span
                      role="img"
                      aria-label={`Z-GATE on ${name}: coming soon`}
                      title={`${name}: coming soon`}
                      className={cx(
                        "inline-flex size-11 items-center justify-center rounded-full border border-line",
                        color,
                      )}
                    >
                      <Icon className={cx("size-5", icon)} />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pb-8 text-center text-sm text-paper-dim">
          <p>
            © {new Date().getFullYear()} {settings.legalName}. All rights reserved.
          </p>
          <p>Registered in Rwanda</p>
          {showPrivacyLink ? (
            <Link href="/privacy" className={footLink}>
              Privacy notice
            </Link>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
