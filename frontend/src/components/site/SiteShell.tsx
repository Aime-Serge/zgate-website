import Link from "next/link";
import type React from "react";
import { listArticles, listDivisions } from "@/lib/cms";
import type { Division, SiteSetting } from "@zgate/cms-contracts";
import { AttributionCapture } from "./AttributionCapture";
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
    <div className="announcement">
      <p className="max">
        {text}
        {label && href ? (
          <>
            {" "}
            <Link href={href}>{label}</Link>
          </>
        ) : null}
      </p>
    </div>
  );
}

/**
 * On a phone the header's button sits inside the menu, so after the hero a
 * visitor had no contact action until the page ended. This bar keeps
 * WhatsApp and a call one tap away (marketing review, "should fix" #3).
 * Plain links, shown only on narrow screens by CSS; last in reading order
 * so screen-reader users meet the page first.
 */
function QuickContact({ settings }: { settings: SiteSetting }) {
  const whatsapp = settings.whatsapp || settings.phone;
  return (
    <aside className="quick-contact" aria-label="Quick contact">
      <a className="button" href={whatsappHref(whatsapp, whatsappGreeting())}>
        WhatsApp us
      </a>
      <a className="button button--secondary" href={telHref(settings.phone)}>
        Call us
      </a>
    </aside>
  );
}

/** Header, main landmark and footer around every public page. */
export async function SiteShell({ settings, privacyLive, divisions, children }: Props) {
  const [navDivisions, articles] = await Promise.all([
    divisions ? Promise.resolve(divisions) : listDivisions(),
    listArticles(1),
  ]);
  return (
    <>
      <AttributionCapture />
      <Announcement settings={settings} />
      <SiteHeader settings={settings} divisions={navDivisions} showInsights={articles.length > 0} />
      <main id="main">{children}</main>
      <SiteFooter settings={settings} divisions={navDivisions} showPrivacyLink={privacyLive} />
      <QuickContact settings={settings} />
    </>
  );
}
