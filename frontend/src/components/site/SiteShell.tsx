import Link from "next/link";
import type React from "react";
import { getPageBySlug, listArticles, listCourses, listDivisions, listSolutions } from "@/lib/cms";
import type { Division, Page, SiteSetting } from "@zgate/cms-contracts";
import type { MenuNeed } from "./MegaNav";
import { Laptop, Message } from "@/components/ui/icons";
import { container } from "@/components/ui/styles";
import { env } from "@/lib/env";
import { AttributionCapture } from "./AttributionCapture";
import { Assistant } from "./Assistant";
import { RevealOnScroll } from "./RevealOnScroll";
import { telHref, whatsappGreeting, whatsappHref } from "./ContactChannels";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

type Props = {
  settings: SiteSetting;
  privacyLive: boolean;
  divisions?: Division[];
  children: React.ReactNode;
};

/** A real, dated event set in Site settings > Announcement; nothing otherwise. */
function Announcement({ settings }: { settings: SiteSetting }) {
  const { text, label, href } = settings.announcement ?? {};
  if (!text) return null;
  return (
    <div className="border-b border-line bg-ink-2 text-sm">
      <p
        className={`${container} py-2 before:mr-2 before:inline-block before:size-2 before:rounded-full before:bg-gate-2 before:content-['']`}
      >
        {text}
        {label && href ? (
          <>
            {" "}
            <Link href={href} className="underline underline-offset-2">
              {label}
            </Link>
          </>
        ) : null}
      </p>
    </div>
  );
}

/**
 * Contact actions always in reach (ServiceNow's floating stack): "Demo"
 * and WhatsApp pills above the round assistant button on larger screens; on phones a bottom bar with three direct paths, the assistant
 * button just above it. Last in reading order so screen readers meet the
 * page content first.
 */
function QuickContact({ settings }: { settings: SiteSetting }) {
  const whatsapp = settings.whatsapp || settings.phone;
  const primaryContact =
    "inline-flex min-h-12 min-w-0 items-center justify-center rounded-full border border-transparent bg-action px-2 py-3 text-center text-xs leading-tight font-semibold text-white no-underline transition-colors duration-150 ease-out hover:bg-action-hover";
  const secondaryContact =
    "inline-flex min-h-12 min-w-0 items-center justify-center rounded-full border border-paper-dim bg-transparent px-2 py-3 text-center text-xs leading-tight font-semibold text-paper no-underline transition-colors duration-150 ease-out hover:bg-paper/8";
  return (
    <>
      <aside
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 gap-2 border-t border-line bg-ink px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:hidden print:hidden"
        aria-label="Quick contact"
      >
        <a className={primaryContact} href={whatsappHref(whatsapp, whatsappGreeting())}>
          WhatsApp
        </a>
        <Link className={primaryContact} href="/contact">
          Start Now
        </Link>
        <a className={secondaryContact} href={telHref(settings.phone)}>
          Call us
        </a>
      </aside>
      {/* Larger screens (ServiceNow's stack): WhatsApp over "Demo", above
          the assistant button, once past the first screen. "Start Now"
          lives in the header. "Demo" opens the Demo Library (/demos). */}
      <RevealOnScroll className="fixed right-6 bottom-[5.5rem] z-30 hidden flex-col items-end gap-3 sm:flex print:hidden">
        <a
          href={whatsappHref(whatsapp, whatsappGreeting())}
          className="inline-flex min-h-12 items-center gap-2 rounded-full border border-gate-2/60 bg-ink px-5 py-3 font-semibold text-paper no-underline shadow-lg transition-colors duration-150 hover:bg-ink-2"
        >
          <Message className="size-5 text-gate-2" />
          WhatsApp
        </a>
        <Link
          href="/demos"
          aria-label="Demo Library"
          className="inline-flex min-h-12 items-center gap-2 rounded-full border border-transparent bg-action px-5 py-3 font-semibold text-white no-underline shadow-lg transition-colors duration-150 hover:bg-action-hover"
        >
          <Laptop className="size-5" />
          Demo
        </Link>
      </RevealOnScroll>
      <Assistant
        aiMode={Boolean(env().ANTHROPIC_API_KEY)}
        whatsapp={whatsappHref(whatsapp, whatsappGreeting())}
      />
    </>
  );
}

/**
 * The menu's "By need" list is the Solutions page's "What do you need?"
 * block, so editors change it in one place, in the CMS.
 */
function needsFrom(page: Page | null): MenuNeed[] {
  const doors = page?.layout.find((block) => block.blockType === "doors");
  if (!doors || doors.blockType !== "doors") return [];
  return doors.items.map((item) => ({ need: item.need, href: item.href, division: item.division }));
}

/** Header, main landmark and footer around every public page. */
export async function SiteShell({ settings, privacyLive, divisions, children }: Props) {
  const [navDivisions, courses, articles, solutions, solutionsPage] = await Promise.all([
    divisions ? Promise.resolve(divisions) : listDivisions(),
    listCourses(),
    // The same request as the homepage's "Latest" section (React cache).
    listArticles(3),
    listSolutions(),
    getPageBySlug("solutions"),
  ]);
  return (
    <>
      <AttributionCapture />
      <Announcement settings={settings} />
      <SiteHeader
        settings={settings}
        divisions={navDivisions}
        solutions={solutions}
        needs={needsFrom(solutionsPage)}
        courses={courses}
        showInsights={articles.length > 0}
      />
      <main id="main">{children}</main>
      <SiteFooter
        settings={settings}
        divisions={navDivisions}
        solutions={solutions}
        courses={courses}
        showInsights={articles.length > 0}
        showPrivacyLink={privacyLive}
      />
      <QuickContact settings={settings} />
    </>
  );
}
