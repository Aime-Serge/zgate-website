import { container, eyebrow, hero, heroHeading, lede } from "@/components/ui/styles";
import type { SearchEntry } from "@/lib/search";
import type { SiteSetting } from "@zgate/cms-contracts";
import { whatsappGreeting, whatsappHref } from "./ContactChannels";
import { SiteSearch } from "./SiteSearch";

/** Searches people are likely to start from: our services in their words. */
const SUGGESTIONS = ["EBM", "VAT", "Bookkeeping", "Courses", "Dashboards", "Hosting"];

export function SearchView({ index, settings }: { index: SearchEntry[]; settings: SiteSetting }) {
  return (
    <>
      <section className={hero}>
        <div className={container}>
          <p className={eyebrow}>Search</p>
          <h1 className={heroHeading}>Find what your business needs</h1>
          <p className={lede}>
            Services, solutions, courses and articles, all in one place. If you can&rsquo;t find it,
            ask: a person replies.
          </p>
        </div>
      </section>
      {/* Shorter top padding than `section`: the search box belongs close to the headline. */}
      <section className="border-t border-line pt-12 pb-16 lg:pt-16 lg:pb-28">
        <div className={container}>
          <SiteSearch
            index={index}
            suggestions={SUGGESTIONS}
            whatsapp={whatsappHref(settings.whatsapp || settings.phone, whatsappGreeting())}
          />
        </div>
      </section>
    </>
  );
}
