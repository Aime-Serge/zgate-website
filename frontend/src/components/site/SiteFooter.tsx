import Link from "next/link";
import { Lockup } from "@/components/brand/GateMark";
import type { Division, SiteSetting } from "@zgate/cms-contracts";
import { telHref, whatsappHref } from "./ContactChannels";

type Props = { settings: SiteSetting; divisions: Division[]; showPrivacyLink: boolean };

/**
 * Phone and WhatsApp on every page, not just /contact (CR-10); the four
 * divisions in their own colours; and the verifiable company facts the
 * marketing strategy says belong on every page.
 */
export function SiteFooter({ settings, divisions, showPrivacyLink }: Props) {
  const whatsapp = settings.whatsapp || settings.phone;
  const facts = settings.companyFacts ?? [];
  return (
    <footer className="site-footer">
      <div className="max site-footer__inner">
        <div className="site-footer__brand">
          <Lockup name="Solution" />
          <p className="site-footer__motto">{settings.motto}</p>
          {settings.boilerplate ? (
            <p className="site-footer__about">{settings.boilerplate}</p>
          ) : null}
        </div>
        <nav aria-label="Divisions" className="site-footer__col">
          <h2 className="site-footer__heading">Divisions</h2>
          <ul>
            {divisions.map((division) => (
              <li key={division.id}>
                <Link href={`/${division.slug}`} className={`dot-link tone--${division.slug}`}>
                  {division.shortName}
                  {division.subtitle ? (
                    <span className="site-footer__sub">{division.subtitle}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="site-footer__col">
          <h2 className="site-footer__heading">Contact</h2>
          <ul aria-label="Contact">
            <li>
              WhatsApp: <a href={whatsappHref(whatsapp)}>{whatsapp}</a>
            </li>
            <li>
              Phone: <a href={telHref(settings.phone)}>{settings.phone}</a>
            </li>
            <li>
              Email: <a href={`mailto:${settings.email}`}>{settings.email}</a>
            </li>
          </ul>
          <address>{settings.address}</address>
        </div>
        <nav aria-label="Company" className="site-footer__col">
          <h2 className="site-footer__heading">Company</h2>
          <ul>
            <li>
              <Link href="/about">About Z-GATE</Link>
            </li>
            <li>
              <Link href="/academy/courses">Courses</Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
            {showPrivacyLink ? (
              <li>
                <Link href="/privacy">Privacy notice</Link>
              </li>
            ) : null}
          </ul>
        </nav>
      </div>
      <div className="max site-footer__legal">
        <p>{[settings.legalName, ...facts.map((entry) => entry.fact)].join(" · ")}</p>
      </div>
    </footer>
  );
}
