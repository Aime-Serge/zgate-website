import type React from "react";
import { listArticles, listDivisions } from "@/lib/queries";
import type { Division, SiteSetting } from "@/payload-types";
import { AttributionCapture } from "./AttributionCapture";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

type Props = {
  settings: SiteSetting;
  privacyLive: boolean;
  divisions?: Division[];
  children: React.ReactNode;
};

/** Header, main landmark and footer around every public page. */
export async function SiteShell({ settings, privacyLive, divisions, children }: Props) {
  const [navDivisions, articles] = await Promise.all([
    divisions ? Promise.resolve(divisions) : listDivisions(),
    listArticles(1),
  ]);
  return (
    <>
      <AttributionCapture />
      <SiteHeader settings={settings} divisions={navDivisions} showInsights={articles.length > 0} />
      <main id="main">{children}</main>
      <SiteFooter settings={settings} showPrivacyLink={privacyLive} />
    </>
  );
}
